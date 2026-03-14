import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import { callGemini } from '../../vertex'
import {
  buildQuickModePrompt,
  parseQuickModeResponse,
  getQuickModeFallback,
  type QuickModeGenerationResult,
} from '../../promptBuilderQuickMode'
import { buildPhotoCatalogPrompt, validatePhoto } from '../../photoCatalog.js'
import { getEncounterRef } from '../../shared/db'
import { checkTokenSize } from '../../shared/quotaHelpers'
import {
  runSurveillanceEnrichment,
  runCdrEnrichment,
  injectSurveillanceIntoMdm,
  incrementGapTallies,
} from '../../shared/surveillanceEnrichment'

export async function generate(req: Request, res: Response) {
  const uid = req.user!.uid
  const email = req.user!.email || ''
  const { encounterId, narrative, location } = req.body

  // Get encounter and verify ownership
  const encounterRef = getEncounterRef(uid, encounterId)
  const encounterSnap = await encounterRef.get()

  if (!encounterSnap.exists) {
    return res.status(404).json({ error: 'Encounter not found' })
  }

  const encounter = encounterSnap.data()!

  // Verify this is a quick mode encounter
  if (encounter.mode !== 'quick') {
    return res.status(400).json({
      error: 'This endpoint is for quick mode encounters only',
      mode: encounter.mode,
    })
  }

  // Check if already processed
  if (encounter.quickModeData?.status === 'completed') {
    return res.status(400).json({
      error: 'Encounter already processed',
      status: 'completed',
    })
  }

  // Handle quota - only count if not already counted
  let quotaRemaining: number
  if (!encounter.quotaCounted) {
    await userService.ensureUser(uid, email)
    const quotaCheck = await userService.checkAndIncrementQuota(uid)
    if (!quotaCheck.allowed) {
      return res.status(402).json({
        error: 'Monthly quota exceeded',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0,
      })
    }
    // Mark as counted
    await encounterRef.update({
      quotaCounted: true,
      quotaCountedAt: admin.firestore.Timestamp.now(),
    })
  }

  // Get updated quota
  const stats = await userService.getUsageStats(uid)
  quotaRemaining = stats.remaining

  // Check token limit per request based on plan
  const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
  if (tokenCheck.exceeded) {
    return res.status(400).json(tokenCheck.payload)
  }

  // Mark as processing
  await encounterRef.update({
    'quickModeData.status': 'processing',
    'quickModeData.narrative': narrative,
    updatedAt: admin.firestore.Timestamp.now(),
  })

  // Surveillance + CDR enrichment (supplementary — failures must not block MDM)
  const [surveillanceContext, quickCdrContext] = await Promise.all([
    location ? runSurveillanceEnrichment(narrative, location) : undefined,
    runCdrEnrichment(narrative),
  ])

  // Build prompt and call Vertex AI
  let generationFailed = false
  let result: QuickModeGenerationResult
  let encounterPhoto: { category: string; subcategory: string } | undefined
  try {
    const photoCatalog = buildPhotoCatalogPrompt()
    const prompt = await buildQuickModePrompt(narrative, surveillanceContext, quickCdrContext, photoCatalog)
    const modelResponse = await callGemini(prompt, { jsonMode: true, timeoutMs: 90_000 })
    result = parseQuickModeResponse(modelResponse.text)
    encounterPhoto = validatePhoto(result.encounterPhoto)
  } catch (modelError) {
    req.log!.error({
      action: 'quick-mode-generation-failed',
      error: modelError instanceof Error ? modelError.message : String(modelError),
    })
    result = getQuickModeFallback()
    generationFailed = true
  }

  // Deterministic surveillance enrichment of dataReviewed
  if (surveillanceContext && result.json?.dataReviewed) {
    const reviewed = Array.isArray(result.json.dataReviewed)
      ? result.json.dataReviewed
      : [result.json.dataReviewed]
    const enriched = injectSurveillanceIntoMdm(reviewed, result.text, surveillanceContext)
    result.json.dataReviewed = enriched.dataReviewed
    result.text = enriched.text
  }

  // Update Firestore with results
  await encounterRef.update({
    'quickModeData.status': generationFailed ? 'error' : 'completed',
    'quickModeData.narrative': narrative,
    'quickModeData.patientIdentifier': result.patientIdentifier,
    'quickModeData.mdmOutput': {
      text: result.text,
      json: result.json,
    },
    'quickModeData.gaps': result.gaps,
    'quickModeData.processedAt': admin.firestore.Timestamp.now(),
    ...(generationFailed && { 'quickModeData.errorMessage': 'MDM generation failed — model returned unusable output' }),
    // Update chief complaint with extracted identifier for card display
    chiefComplaint: [
      result.patientIdentifier.age,
      result.patientIdentifier.sex?.charAt(0).toUpperCase(),
      result.patientIdentifier.chiefComplaint,
    ].filter(Boolean).join(' ').trim() || encounter.chiefComplaint,
    ...(encounterPhoto && { encounterPhoto }),
    status: generationFailed ? 'error' : 'finalized',
    updatedAt: admin.firestore.Timestamp.now(),
  })

  // Increment gap tallies on user profile
  await incrementGapTallies(uid, result.gaps)

  req.log!.info({
    action: 'quick-mode-generate',
    uid,
    encounterId,
    gapCount: result.gaps.length,
  })

  return res.json({
    ok: true,
    generationFailed,
    mdm: {
      text: result.text,
      json: result.json,
    },
    patientIdentifier: result.patientIdentifier,
    gaps: result.gaps,
    quotaRemaining,
  })
}
