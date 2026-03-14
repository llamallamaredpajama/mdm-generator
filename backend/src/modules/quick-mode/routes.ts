import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { QuickModeGenerateBodySchema } from './schemas'
import { createQuickModeController } from './controller'
import type { QuickModeDeps } from '../../dependencies'

export function createQuickModeRoutes(deps: QuickModeDeps): Router {
  const router = Router()
  const { generate } = createQuickModeController(deps)

  router.post('/v1/quick-mode/generate', llmLimiter, authenticate, validate(QuickModeGenerateBodySchema), asyncHandler(generate))

  return router
}
