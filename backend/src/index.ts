import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { config } from './config'
import { logger } from './logger'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { initPhotoCatalog } from './photoCatalog.js'
import { getDb } from './shared/db'

// Module routers
import adminRouter from './modules/admin/routes'
import libraryRouter from './modules/library/routes'
import userRouter from './modules/user/routes'
import analyticsRouter from './modules/analytics/routes'
import narrativeRouter from './modules/narrative/routes'
import quickModeRouter from './modules/quick-mode/routes'
import encounterRouter from './modules/encounter/routes'
import surveillanceRouter from './surveillance/routes'

// ============================================================================
// Express App Setup
// ============================================================================

const app = express()

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

// Rate limiting — global: 60 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})
app.use(globalLimiter)

// ============================================================================
// Health Checks
// ============================================================================

// Liveness: always pass if event loop is responsive
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))

// Readiness: check dependencies
app.get('/health/ready', async (_req, res) => {
  try {
    await admin.firestore().collection('_health').doc('ping').get()
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

app.use(adminRouter)
app.use(libraryRouter)
app.use(userRouter)
app.use(analyticsRouter)
app.use(narrativeRouter)
app.use(quickModeRouter)
app.use(encounterRouter)
app.use(surveillanceRouter)

// Error-handling middleware (must be registered after all routes)
app.use(errorHandler)

// ============================================================================
// Firebase Init + Server Bootstrap
// ============================================================================

async function initFirebase() {
  try {
    if (!admin.apps.length) {
      const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

      if (serviceAccountJson) {
        logger.info('Initializing Firebase Admin with JSON credentials from environment')
        const serviceAccount = JSON.parse(serviceAccountJson)
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.PROJECT_ID || 'mdm-generator'
        })
      } else if (serviceAccountPath && serviceAccountPath.includes('.json')) {
        logger.info({ path: serviceAccountPath }, 'Initializing Firebase Admin with service account file')
        const serviceAccountContent = await fs.readFile(path.resolve(serviceAccountPath), 'utf8')
        const serviceAccount = JSON.parse(serviceAccountContent)
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.PROJECT_ID || 'mdm-generator'
        })
      } else {
        logger.info('Initializing Firebase Admin with default credentials')
        admin.initializeApp()
      }
      logger.info('Firebase Admin initialized successfully')
    }
  } catch (e) {
    logger.error({ err: e }, 'Firebase Admin initialization error')
    // swallow init errors in local dev; will throw on verify if misconfigured
  }
}

async function main() {
  await initFirebase()
  await initPhotoCatalog(getDb())

  const port = config.port
  const server = app.listen(port, () => {
    logger.info({ port }, 'backend listening')
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
    // Force exit after 95s (longer than max LLM timeout of 90s)
    setTimeout(() => process.exit(1), 95_000)
  })
}

main().catch((err) => logger.error({ err }, 'Fatal startup error'))
