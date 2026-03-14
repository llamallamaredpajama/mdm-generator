import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { createAnalyticsController } from './controller.js'
import type { AnalyticsDeps } from '../../dependencies.js'

export function createAnalyticsRoutes(deps: AnalyticsDeps): Router {
  const router = Router()
  const { getInsights } = createAnalyticsController(deps)
  const { requirePlan } = deps

  router.post('/v1/analytics/insights', llmLimiter, authenticate, requirePlan('pro'), asyncHandler(getInsights))

  return router
}
