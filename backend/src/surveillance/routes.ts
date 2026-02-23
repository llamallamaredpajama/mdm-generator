/**
 * Surveillance API routes.
 *
 * POST /v1/surveillance/analyze  - Run regional trend analysis
 * POST /v1/surveillance/report   - Generate PDF trend report
 *
 * Both endpoints follow the project's 6-step auth pattern:
 * VALIDATE -> AUTHENTICATE -> AUTHORIZE -> EXECUTE -> AUDIT -> RESPOND
 */

import { Router } from 'express'
import crypto from 'node:crypto'
import admin from 'firebase-admin'
import { userService } from '../services/userService'
import { TrendAnalysisRequestSchema, TrendReportRequestSchema } from './schemas'
import { mapToSyndromes } from './syndromeMapper'
import { RegionResolver } from './regionResolver'
import { AdapterRegistry } from './adapters/adapterRegistry'
import { computeCorrelations, detectAlerts } from './correlationEngine'
import { generateTrendReport } from './pdfGenerator'
import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert, SurveillanceDataPoint, DataSourceSummary, DataSourceError } from './types'

const router = Router()

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
 * Returns one entry per known source indicating what was found.
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

    // Pick the most recent data point per condition
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
// POST /v1/surveillance/analyze
// ---------------------------------------------------------------------------

router.post('/v1/surveillance/analyze', async (req, res) => {
  try {
    // 1. VALIDATE
    const parsed = TrendAnalysisRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }
    const data = parsed.data

    // 2. AUTHENTICATE
    let decoded: admin.auth.DecodedIdToken
    try {
      decoded = await admin.auth().verifyIdToken(data.userIdToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const uid = decoded.uid

    // 3. AUTHORIZE — surveillance requires Pro or Enterprise plan
    const stats = await userService.getUsageStats(uid)
    if (stats.plan === 'free') {
      return res.status(403).json({
        error: 'Surveillance trend analysis requires a Pro or Enterprise plan',
        upgradeRequired: true,
        requiredPlan: 'pro',
      })
    }

    // 4. EXECUTE
    const syndromes = mapToSyndromes(data.chiefComplaint, data.differential)

    const resolver = new RegionResolver()
    const region = await resolver.resolve(data.location)
    if (!region) {
      return res.status(400).json({ error: 'Could not resolve location' })
    }

    const regionLabel = region.county
      ? `${region.county}, ${region.stateAbbrev} area — HHS Region ${region.hhsRegion}`
      : `${region.state} — HHS Region ${region.hhsRegion}`

    const registry = new AdapterRegistry()
    const { dataPoints, errors, queriedSources } = await registry.fetchAll(region, syndromes)

    const correlations = computeCorrelations({
      chiefComplaint: data.chiefComplaint,
      differential: data.differential,
      dataPoints,
    })
    const alerts = detectAlerts(dataPoints, correlations)

    const analysisId = crypto.randomUUID()

    // Determine which data sources were successfully queried
    const allSourceNames = ['CDC Respiratory', 'NWSS Wastewater', 'CDC NNDSS']
    const allSourceKeys = ['cdc_respiratory', 'cdc_wastewater', 'cdc_nndss']
    const failedSources = new Set(errors.map((e) => e.source))
    const dataSourcesQueried = allSourceNames.filter(
      (_, i) => !failedSources.has(allSourceKeys[i]),
    )

    // Build per-source summaries
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
    // JSON round-trip strips `undefined` values that Firestore rejects.
    const cleanAnalysis = JSON.parse(JSON.stringify(analysis))
    const db = admin.firestore()
    await db
      .collection('surveillance_analyses')
      .doc(analysisId)
      .set({
        ...cleanAnalysis,
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    // 5. AUDIT (no PHI)
    console.log({
      action: 'surveillance-analyze',
      uid,
      analysisId,
      findingsCount: correlations.length,
      alertsCount: alerts.length,
      timestamp: new Date().toISOString(),
    })

    // 6. RESPOND
    return res.json({
      ok: true,
      analysis,
      warnings: errors.length > 0 ? errors.map((e) => e.error) : undefined,
    })
  } catch (e) {
    console.error('surveillance/analyze error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /v1/surveillance/report
// ---------------------------------------------------------------------------

router.post('/v1/surveillance/report', async (req, res) => {
  try {
    // 1. VALIDATE
    const parsed = TrendReportRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }
    const data = parsed.data

    // 2. AUTHENTICATE
    let decoded: admin.auth.DecodedIdToken
    try {
      decoded = await admin.auth().verifyIdToken(data.userIdToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const uid = decoded.uid

    // 3. AUTHORIZE — must have PDF export access
    const stats = await userService.getUsageStats(uid)
    if (!stats.features.exportFormats.includes('pdf')) {
      return res.status(403).json({
        error: 'PDF export requires a Pro or Enterprise plan',
      })
    }

    // 4. EXECUTE
    const db = admin.firestore()
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

    // 5. AUDIT (no PHI)
    console.log({
      action: 'surveillance-report',
      uid,
      analysisId: data.analysisId,
      timestamp: new Date().toISOString(),
    })

    // 6. RESPOND
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="surveillance-report-${data.analysisId}.pdf"`,
    )
    return res.send(pdfBuffer)
  } catch (e) {
    console.error('surveillance/report error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

export default router
