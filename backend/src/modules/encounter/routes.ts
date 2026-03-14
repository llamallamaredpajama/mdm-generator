import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  MatchCdrsRequestSchema,
  SuggestDiagnosisRequestSchema,
  ParseResultsRequestSchema,
} from '../../buildModeSchemas.js'
import { GenerateSchema, createEncounterController } from './controller.js'
import type { EncounterDeps } from '../../dependencies.js'

// Body-only schema variants (omit userIdToken — handled by auth middleware)
const GenerateBodySchema = GenerateSchema.omit({ userIdToken: true })
const Section1BodySchema = Section1RequestSchema.omit({ userIdToken: true })
const Section2BodySchema = Section2RequestSchema.omit({ userIdToken: true })
const FinalizeBodySchema = FinalizeRequestSchema.omit({ userIdToken: true })
const MatchCdrsBodySchema = MatchCdrsRequestSchema.omit({ userIdToken: true })
const SuggestDiagnosisBodySchema = SuggestDiagnosisRequestSchema.omit({ userIdToken: true })
const ParseResultsBodySchema = ParseResultsRequestSchema.omit({ userIdToken: true })

export function createEncounterRoutes(deps: EncounterDeps): Router {
  const router = Router()
  const c = createEncounterController(deps)

  // Legacy one-shot generation
  router.post('/v1/generate', llmLimiter, authenticate, validate(GenerateBodySchema), asyncHandler(c.generate))

  // Build Mode endpoints
  router.post('/v1/build-mode/process-section1', llmLimiter, authenticate, validate(Section1BodySchema), asyncHandler(c.processSection1))
  router.post('/v1/build-mode/process-section2', authenticate, validate(Section2BodySchema), asyncHandler(c.processSection2))
  router.post('/v1/build-mode/finalize', llmLimiter, authenticate, validate(FinalizeBodySchema), asyncHandler(c.finalize))
  router.post('/v1/build-mode/match-cdrs', llmLimiter, authenticate, validate(MatchCdrsBodySchema), asyncHandler(c.matchCdrs))
  router.post('/v1/build-mode/suggest-diagnosis', llmLimiter, authenticate, validate(SuggestDiagnosisBodySchema), asyncHandler(c.suggestDiagnosis))
  router.post('/v1/build-mode/parse-results', llmLimiter, authenticate, validate(ParseResultsBodySchema), asyncHandler(c.parseResults))

  return router
}
