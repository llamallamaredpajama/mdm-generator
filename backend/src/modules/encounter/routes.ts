import { Router } from 'express'
import { z } from 'zod'
import { llmLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  MatchCdrsRequestSchema,
  SuggestDiagnosisRequestSchema,
  ParseResultsRequestSchema,
} from '../../buildModeSchemas'
import { GenerateSchema } from './controller'
import {
  generate,
  processSection1,
  processSection2,
  finalize,
  matchCdrs,
  suggestDiagnosis,
  parseResults,
} from './controller'

// Body-only schema variants (omit userIdToken — handled by auth middleware)
const GenerateBodySchema = GenerateSchema.omit({ userIdToken: true })
const Section1BodySchema = Section1RequestSchema.omit({ userIdToken: true })
const Section2BodySchema = Section2RequestSchema.omit({ userIdToken: true })
const FinalizeBodySchema = FinalizeRequestSchema.omit({ userIdToken: true })
const MatchCdrsBodySchema = MatchCdrsRequestSchema.omit({ userIdToken: true })
const SuggestDiagnosisBodySchema = SuggestDiagnosisRequestSchema.omit({ userIdToken: true })
const ParseResultsBodySchema = ParseResultsRequestSchema.omit({ userIdToken: true })

const router = Router()

// Legacy one-shot generation
router.post('/v1/generate', llmLimiter, authenticate, validate(GenerateBodySchema), asyncHandler(generate))

// Build Mode endpoints
router.post('/v1/build-mode/process-section1', llmLimiter, authenticate, validate(Section1BodySchema), asyncHandler(processSection1))
router.post('/v1/build-mode/process-section2', llmLimiter, authenticate, validate(Section2BodySchema), asyncHandler(processSection2))
router.post('/v1/build-mode/finalize', llmLimiter, authenticate, validate(FinalizeBodySchema), asyncHandler(finalize))
router.post('/v1/build-mode/match-cdrs', llmLimiter, authenticate, validate(MatchCdrsBodySchema), asyncHandler(matchCdrs))
router.post('/v1/build-mode/suggest-diagnosis', llmLimiter, authenticate, validate(SuggestDiagnosisBodySchema), asyncHandler(suggestDiagnosis))
router.post('/v1/build-mode/parse-results', llmLimiter, authenticate, validate(ParseResultsBodySchema), asyncHandler(parseResults))

export default router
