import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { asyncHandler } from '../../shared/asyncHandler'
import { getInsights } from './controller'

const router = Router()

router.post('/v1/analytics/insights', llmLimiter, authenticate, asyncHandler(getInsights))

export default router
