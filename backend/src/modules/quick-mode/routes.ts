import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { QuickModeGenerateBodySchema } from './schemas.js'
import { createQuickModeController } from './controller.js'
import type { QuickModeDeps } from '../../dependencies.js'

export function createQuickModeRoutes(deps: QuickModeDeps): Router {
  const router = Router()
  const { generate } = createQuickModeController(deps)

  router.post('/v1/quick-mode/generate', llmLimiter, authenticate, validate(QuickModeGenerateBodySchema), asyncHandler(generate))

  return router
}
