import { Router } from 'express'
import { parseLimiter } from '../../middleware/rateLimiter.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { ParseNarrativeBodySchema } from './schemas.js'
import { createNarrativeController } from './controller.js'
import type { NarrativeDeps } from '../../dependencies.js'

export function createNarrativeRoutes(deps: NarrativeDeps): Router {
  const router = Router()
  const { parseNarrative } = createNarrativeController(deps)

  router.post('/v1/parse-narrative', parseLimiter, authenticate, validate(ParseNarrativeBodySchema), asyncHandler(parseNarrative))

  return router
}
