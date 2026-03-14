/**
 * Surveillance API routes.
 *
 * POST /v1/surveillance/analyze  - Run regional trend analysis
 * POST /v1/surveillance/report   - Generate PDF trend report
 *
 * Middleware chain: authenticate → requirePlan/validate → asyncHandler(controller)
 */

import { Router } from 'express'
import crypto from 'node:crypto'
import admin from 'firebase-admin'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../shared/asyncHandler.js'
import { TrendAnalysisBodySchema, TrendReportBodySchema } from './schemas.js'
import { mapToSyndromes } from './syndromeMapper.js'
import { RegionResolver } from './regionResolver.js'
import { AdapterRegistry } from './adapters/adapterRegistry.js'
import { computeCorrelations, detectAlerts } from './correlationEngine.js'
import { generateTrendReport } from './pdfGenerator.js'
import type { SurveillanceDeps } from '../dependencies.js'
import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert, SurveillanceDataPoint, DataSourceSummary, DataSourceError } from './types.js'

/** Known CDC data source keys and their human-readable labels */
const KNOWN_SOURCES: { key: string; label: string }[] = [
  { key: 'cdc_respiratory', label: 'CDC Respiratory Hospital Data' },
  { key: 'cdc_wastewater', label: 'NWSS Wastewater Surveillance' },
  { key: 'cdc_nndss', label: 'CDC NNDSS Notifiable Diseases' },
]

/** Format a highlight for a single data point based on its source */
function formatHighlight(dp: SurveillanceDataPoint): string {
  const trendLabel = dp.trend === 'rising' ? 'Rising' : dp.trend === 'falling' ? 'Falling' : dp.trend === 'stable' ? 'Stable' : 'Unknown'
  const mag = dp.trendMagnitude != null ? `, ${dp.trendMagnitude > 0 ? '+' : ''}${dp.trendMagnitude.toFixed(1)}%` : ''

  if (dp.unit === 'pct_inpatient_beds') {
    return `${dp.condition}: ${dp.value.toFixed(2)}% of inpatient beds (${trendLabel}${mag})`
  }
  if (dp.unit === 'wastewater_concentration') {
    const formatted = dp.value >= 1_000_000
      ? `${(dp.value / 1_000_000).toFixed(1)}M copies/L`
      : dp.value >= 1_000
        ? `${(dp.value / 1_000).toFixed(1)}K copies/L`
        : `${dp.value.toFixed(0)} copies/L`
    return `${dp.condition}: ${formatted} (${trendLabel}${mag})`
  }
  if (dp.unit === 'case_count') {
    return `${dp.condition}: ${dp.value} cases/wk (${trendLabel}${mag})`
  }
  return `${dp.condition}: ${dp.value} ${dp.unit} (${trendLabel}${mag})`
}

/**
 * Build per-source summaries from raw data points and errors.
 */
function buildDataSourceSummaries(
  dataPoints: SurveillanceDataPoint[],
  errors: DataSourceError[],
  queriedSourceKeys: Set<string>,
): DataSourceSummary[] {
  const errorSet = new Set(errors.map((e) => e.source))
  const pointsBySource = new Map<string, SurveillanceDataPoint[]>()
  for (const dp of dataPoints) {
    const existing = pointsBySource.get(dp.source) || []
    existing.push(dp)
    pointsBySource.set(dp.source, existing)
  }

  return KNOWN_SOURCES.map(({ key, label }) => {
    if (errorSet.has(key)) {
      return { source: key, label, status: 'error' as const, highlights: [] }
    }
    if (!queriedSourceKeys.has(key)) {
      return { source: key, label, status: 'not_queried' as const, highlights: [] }
    }
    const points = pointsBySource.get(key)
    if (!points || points.length === 0) {
      return { source: key, label, status: 'no_data' as const, highlights: [] }
    }

    const latestByCondition = new Map<string, SurveillanceDataPoint>()
    for (const dp of points) {
      const existing = latestByCondition.get(dp.condition)
      if (!existing || dp.periodEnd > existing.periodEnd) {
        latestByCondition.set(dp.condition, dp)
      }
    }

    const highlights = Array.from(latestByCondition.values()).map(formatHighlight)
    return { source: key, label, status: 'data' as const, highlights }
  })
}

/**
 * Build a brief 1-2 sentence summary of the surveillance analysis.
 */
function buildSummary(
  correlations: ClinicalCorrelation[],
  alerts: TrendAlert[],
  regionLabel: string,
): string {
  const highTier = correlations.filter((c) => c.tier === 'high')
  const moderateTier = correlations.filter((c) => c.tier === 'moderate')

  if (highTier.length === 0 && moderateTier.length === 0) {
    return `No significant regional surveillance signals detected in ${regionLabel} for the given clinical presentation.`
  }

  const conditionNames = highTier
    .concat(moderateTier)
    .slice(0, 3)
    .map((c) => c.condition)
    .join(', ')

  const alertSuffix =
    alerts.length > 0 ? ` ${alerts.length} alert(s) warrant review.` : ''

  return `Regional surveillance in ${regionLabel} shows notable activity for ${conditionNames}.${alertSuffix}`
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSurveillanceRoutes(deps: SurveillanceDeps): Router {
  const router = Router()
  const { userService, db, requirePlan } = deps

  // ---------------------------------------------------------------------------
  // POST /v1/surveillance/analyze
  // ---------------------------------------------------------------------------

  router.post('/v1/surveillance/analyze', authenticate, requirePlan('pro'), validate(TrendAnalysisBodySchema),
    asyncHandler(async (req, res) => {
      const uid = req.user!.uid
      const data = req.body

      // EXECUTE
      const syndromes = mapToSyndromes(data.chiefComplaint, data.differential)

      const resolver = new RegionResolver(db)
      const region = await resolver.resolve(data.location)
      if (!region) {
        return res.status(400).json({ error: 'Could not resolve location' })
      }

      const regionLabel = region.county
        ? `${region.county}, ${region.stateAbbrev} area — HHS Region ${region.hhsRegion}`
        : `${region.state} — HHS Region ${region.hhsRegion}`

      const registry = new AdapterRegistry(db)
      const { dataPoints, errors, queriedSources } = await registry.fetchAll(region, syndromes)

      const correlations = computeCorrelations({
        chiefComplaint: data.chiefComplaint,
        differential: data.differential,
        dataPoints,
      })
      const alerts = detectAlerts(dataPoints, correlations)

      const analysisId = crypto.randomUUID()

      const allSourceNames = ['CDC Respiratory', 'NWSS Wastewater', 'CDC NNDSS']
      const allSourceKeys = ['cdc_respiratory', 'cdc_wastewater', 'cdc_nndss']
      const failedSources = new Set(errors.map((e) => e.source))
      const dataSourcesQueried = allSourceNames.filter(
        (_, i) => !failedSources.has(allSourceKeys[i]),
      )

      const queriedSourceKeys = new Set(queriedSources || allSourceKeys.filter((_, i) => !failedSources.has(allSourceKeys[i])))
      const dataSourceSummaries = buildDataSourceSummaries(dataPoints, errors, queriedSourceKeys)

      const analysis: TrendAnalysisResult = {
        analysisId,
        region,
        regionLabel,
        rankedFindings: correlations,
        alerts,
        summary: buildSummary(correlations, alerts, regionLabel),
        dataSourcesQueried,
        dataSourceErrors: errors,
        dataSourceSummaries,
        analyzedAt: new Date().toISOString(),
      }

      // Store analysis in Firestore for later PDF generation.
      const cleanAnalysis = JSON.parse(JSON.stringify(analysis))
      await db
        .collection('surveillance_analyses')
        .doc(analysisId)
        .set({
          ...cleanAnalysis,
          uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

      req.log!.info({
        action: 'surveillance-analyze',
        uid,
        analysisId,
        findingsCount: correlations.length,
        alertsCount: alerts.length,
      })

      return res.json({
        ok: true,
        analysis,
        warnings: errors.length > 0 ? errors.map((e) => e.error) : undefined,
      })
    })
  )

  // ---------------------------------------------------------------------------
  // POST /v1/surveillance/report
  // ---------------------------------------------------------------------------

  router.post('/v1/surveillance/report', authenticate, validate(TrendReportBodySchema),
    asyncHandler(async (req, res) => {
      const uid = req.user!.uid
      const data = req.body

      // AUTHORIZE — must have PDF export access (granular feature check)
      const stats = await userService.getUsageStats(uid)
      if (!stats.features.exportFormats.includes('pdf')) {
        return res.status(403).json({
          error: 'PDF export requires a Pro or Enterprise plan',
        })
      }

      // EXECUTE
      const analysisDoc = await db
        .collection('surveillance_analyses')
        .doc(data.analysisId)
        .get()

      if (!analysisDoc.exists) {
        return res.status(404).json({ error: 'Analysis not found' })
      }

      const analysisData = analysisDoc.data() as TrendAnalysisResult & { uid: string }
      if (analysisData.uid !== uid) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      const pdfBuffer = await generateTrendReport(analysisData)

      req.log!.info({
        action: 'surveillance-report',
        uid,
        analysisId: data.analysisId,
      })

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="surveillance-report-${data.analysisId}.pdf"`,
      )
      return res.send(pdfBuffer)
    })
  )

  return router
}
