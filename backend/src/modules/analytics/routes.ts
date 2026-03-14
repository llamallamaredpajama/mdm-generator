import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { asyncHandler } from '../../shared/asyncHandler'
import { createAnalyticsController } from './controller'
import type { AnalyticsDeps } from '../../dependencies'

export function createAnalyticsRoutes(deps: AnalyticsDeps): Router {
  const router = Router()
  const { getInsights } = createAnalyticsController(deps)

  router.post('/v1/analytics/insights', llmLimiter, authenticate, asyncHandler(getInsights))

  return router
}
