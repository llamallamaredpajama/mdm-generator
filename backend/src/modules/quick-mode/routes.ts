import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { QuickModeGenerateBodySchema } from './schemas'
import { generate } from './controller'

const router = Router()

router.post('/v1/quick-mode/generate', llmLimiter, authenticate, validate(QuickModeGenerateBodySchema), asyncHandler(generate))

export default router
