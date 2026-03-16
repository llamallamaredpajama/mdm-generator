import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import {
  buildQuickModePrompt,
  type QuickModeGenerationResult,
} from '../../promptBuilderQuickMode.js'
import { buildPhotoCatalogPrompt, validatePhoto } from '../../photoCatalog.js'
import { checkTokenSize } from '../../shared/quotaHelpers.js'
import {
  runSurveillanceEnrichment,
  runCdrEnrichment,
  injectSurveillanceIntoMdm,
} from '../../shared/surveillanceEnrichment.js'
import type { QuickModeDeps } from '../../dependencies.js'

export function createQuickModeController(deps: QuickModeDeps) {
  const { encounterRepo, userService, llmClient, responseParser } = deps

  return {
    generate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const email = req.user!.email || ''
      const { encounterId, narrative, location } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      if (encounter.mode !== 'quick') {
        return res.status(400).json({
          error: 'This endpoint is for quick mode encounters only',
          mode: encounter.mode,
        })
      }

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
        await encounterRepo.markQuotaCounted(uid, encounterId)
      }

      const stats = await userService.getUsageStats(uid)
      quotaRemaining = stats.remaining

      const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
      if (tokenCheck.exceeded) {
        return res.status(400).json(tokenCheck.payload)
      }

      // Mark as processing
      await encounterRepo.updateQuickModeStatus(uid, encounterId, 'processing')

      // Surveillance + CDR enrichment (supplementary — failures must not block MDM)
      const [surveillanceContext, quickCdrContext] = await Promise.all([
        location ? runSurveillanceEnrichment(narrative, location, deps.db) : undefined,
        runCdrEnrichment(narrative, deps.db),
      ])

      // Build prompt and call LLM
      let generationFailed = false
      let result: QuickModeGenerationResult
      let encounterPhoto: { category: string; subcategory: string } | undefined
      try {
        const photoCatalog = buildPhotoCatalogPrompt()
        const prompt = await buildQuickModePrompt(narrative, surveillanceContext, quickCdrContext, photoCatalog)
        const modelResponse = await llmClient.generate(prompt, { jsonMode: true, timeoutMs: 90_000 })
        const parsed = responseParser.parseQuickMode(modelResponse.text)
        result = parsed.data
        encounterPhoto = validatePhoto(result.encounterPhoto)
        generationFailed = !parsed.success
      } catch (modelError) {
        req.log!.error({
          action: 'quick-mode-generation-failed',
          error: modelError instanceof Error ? modelError.message : String(modelError),
        })
        // Use parser's built-in fallback for LLM failures
        result = responseParser.parseQuickMode('').data
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
      await encounterRepo.finalizeQuickMode(uid, encounterId, {
        'quickModeData.status': generationFailed ? 'error' : 'completed',
        'quickModeData.narrative': narrative,
        'quickModeData.patientIdentifier': result.patientIdentifier,
        'quickModeData.mdmOutput': {
          text: result.text,
          json: result.json,
        },
        'quickModeData.gaps': result.gaps,
        'quickModeData.cdrAnalysis': result.cdrAnalysis,
        'quickModeData.processedAt': admin.firestore.Timestamp.now(),
        ...(generationFailed && { 'quickModeData.errorMessage': 'MDM generation failed — model returned unusable output' }),
        chiefComplaint: [
          result.patientIdentifier.age,
          result.patientIdentifier.sex?.charAt(0).toUpperCase(),
          result.patientIdentifier.chiefComplaint,
        ].filter(Boolean).join(' ').trim() || encounter.chiefComplaint,
        ...(encounterPhoto && { encounterPhoto }),
        status: generationFailed ? 'error' : 'finalized',
        updatedAt: admin.firestore.Timestamp.now(),
      })

      await userService.incrementGapTallies(uid, result.gaps)

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
    },
  }
}
