/**
 * Express application factory.
 *
 * Receives fully-constructed dependencies from the composition root (index.ts)
 * and wires them into module route factories. Owns middleware registration order.
 */

import express from 'express'
import helmet from 'helmet'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import { createAdminRoutes } from './modules/admin/routes.js'
import { createLibraryRoutes } from './modules/library/routes.js'
import { createUserRoutes } from './modules/user/routes.js'
import { createAnalyticsRoutes } from './modules/analytics/routes.js'
import { createNarrativeRoutes } from './modules/narrative/routes.js'
import { createQuickModeRoutes } from './modules/quick-mode/routes.js'
import { createEncounterRoutes } from './modules/encounter/routes.js'
import { createSurveillanceRoutes } from './surveillance/routes.js'
import { createRequirePlan } from './middleware/auth.js'
import { EnrichmentPipeline } from './modules/encounter/enrichmentPipeline.js'
import { EncounterOrchestrator } from './modules/encounter/encounterOrchestrator.js'
import type { AppDependencies } from './dependencies.js'

export function createApp(deps: AppDependencies): express.Application {
  const app = express()
  const requirePlan = createRequirePlan(deps.userService)

  // Trust proxy: Cloud Run sits behind a load balancer that injects X-Forwarded-For.
  // Required for express-rate-limit to correctly identify client IPs.
  app.set('trust proxy', true)

  // CORS configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL, // Production frontend URL
  ].filter(Boolean) as string[]

  app.use((req, res, next) => {
    const origin = req.headers.origin
    // Allow any localhost origin (Vite auto-increments ports) or listed/Firebase origins
    const isLocalhost = origin?.match(/^http:\/\/localhost:\d+$/)
    if (origin && (isLocalhost || allowedOrigins.includes(origin) || origin.match(/^https:\/\/(mdm-generator[^.]*\.web\.app|aimdm\.app)$/))) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.header('Access-Control-Allow-Credentials', 'true')
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }
    next()
  })

  app.use(express.json({ limit: '1mb' }))

  // Security headers
  app.use(helmet())

  // Structured request logging with Cloud Trace correlation
  app.use(requestLogger)

  // Rate limiting — global (configured via config.limits.globalRateLimit)
  app.use(globalLimiter)

  // ============================================================================
  // Health Checks
  // ============================================================================

  // Liveness: always pass if event loop is responsive
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))

  // Readiness: check dependencies
  app.get('/health/ready', async (_req, res) => {
    try {
      await deps.db.collection('_health').doc('ping').get()
      res.json({ status: 'ok', checks: { firestore: 'ok' } })
    } catch {
      res.status(503).json({ status: 'unhealthy', checks: { firestore: 'failed' } })
    }
  })

  // Keep original /health for backward compatibility
  app.get('/health', (_req, res) => res.json({ ok: true }))

  // ============================================================================
  // Module Routers
  // ============================================================================

  // Construct encounter orchestrator (encapsulates all encounter business logic)
  const enrichmentPipeline = new EnrichmentPipeline(deps.libraryCaches)
  const encounterOrchestrator = new EncounterOrchestrator({
    encounterRepo: deps.encounterRepo,
    userService: deps.userService,
    llmClient: deps.llmClient,
    responseParser: deps.responseParser,
    enrichmentPipeline,
    libraryCaches: deps.libraryCaches,
    db: deps.db,
  })

  app.use(createAdminRoutes(deps))
  app.use(createLibraryRoutes(deps))
  app.use(createUserRoutes(deps))
  app.use(createAnalyticsRoutes({ ...deps, requirePlan }))
  app.use(createNarrativeRoutes(deps))
  app.use(createQuickModeRoutes(deps))
  app.use(createEncounterRoutes({ orchestrator: encounterOrchestrator }))
  app.use(createSurveillanceRoutes({ userService: deps.userService, db: deps.db, requirePlan }))

  // Error-handling middleware (must be registered after all routes)
  app.use(errorHandler)

  return app
}
