import { Router } from 'express'
import { parseLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { ParseNarrativeBodySchema } from './schemas'
import { createNarrativeController } from './controller'
import type { NarrativeDeps } from '../../dependencies'

export function createNarrativeRoutes(deps: NarrativeDeps): Router {
  const router = Router()
  const { parseNarrative } = createNarrativeController(deps)

  router.post('/v1/parse-narrative', parseLimiter, authenticate, validate(ParseNarrativeBodySchema), asyncHandler(parseNarrative))

  return router
}
