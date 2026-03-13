import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import {
  generate,
  processSection1,
  processSection2,
  finalize,
  matchCdrs,
  suggestDiagnosis,
  parseResults,
} from './controller'

const router = Router()

// Legacy one-shot generation
router.post('/v1/generate', llmLimiter, generate)

// Build Mode endpoints
router.post('/v1/build-mode/process-section1', llmLimiter, processSection1)
router.post('/v1/build-mode/process-section2', llmLimiter, processSection2)
router.post('/v1/build-mode/finalize', llmLimiter, finalize)
router.post('/v1/build-mode/match-cdrs', llmLimiter, matchCdrs)
router.post('/v1/build-mode/suggest-diagnosis', llmLimiter, suggestDiagnosis)
router.post('/v1/build-mode/parse-results', llmLimiter, parseResults)

export default router
