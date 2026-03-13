import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { getInsights } from './controller'

const router = Router()

router.post('/v1/analytics/insights', llmLimiter, getInsights)

export default router
