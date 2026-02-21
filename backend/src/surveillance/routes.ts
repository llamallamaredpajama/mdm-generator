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
import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert } from './types'

const router = Router()

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

    // 3. Fetch user stats (used for logging)
    const stats = await userService.getUsageStats(uid)

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
    const { dataPoints, errors } = await registry.fetchAll(region, syndromes)

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

    const analysis: TrendAnalysisResult = {
      analysisId,
      region,
      regionLabel,
      rankedFindings: correlations,
      alerts,
      summary: buildSummary(correlations, alerts, regionLabel),
      dataSourcesQueried,
      dataSourceErrors: errors,
      analyzedAt: new Date().toISOString(),
    }

    // Store analysis in Firestore for later PDF generation
    const db = admin.firestore()
    await db
      .collection('surveillance_analyses')
      .doc(analysisId)
      .set({
        ...analysis,
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
