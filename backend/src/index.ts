import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { config } from './config'
import { logger } from './logger'
import { initPhotoCatalog } from './photoCatalog.js'
import { UserService } from './services/userService'
import { VertexLlmClient } from './llm/vertexProvider'
import { RetryingLlmClient } from './llm/retryingLlmClient'
import { LlmResponseParser } from './llm/responseParser'
import { FirestoreEncounterRepository } from './data/repositories/encounterRepository'
import { FirestoreLibraryRepository } from './data/repositories/libraryRepository'
import { InMemoryCache } from './data/cache'
import { createApp } from './app'
import type { AppDependencies } from './dependencies'
import type { CdrDefinition, TestDefinition } from './types/libraries'

// ============================================================================
// Firebase Init
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
  }
}

// ============================================================================
// Composition Root
// ============================================================================

async function main() {
  await initFirebase()
  const db = admin.firestore()
  await initPhotoCatalog(db)

  // Construct all dependencies
  const userService = new UserService(db)
  const vertexClient = new VertexLlmClient()
  const llmClient = new RetryingLlmClient(vertexClient, undefined, logger)
  const responseParser = new LlmResponseParser()
  const encounterRepo = new FirestoreEncounterRepository(db)
  const libraryRepo = new FirestoreLibraryRepository(db)

  const cdrCache = new InMemoryCache<CdrDefinition[]>(config.limits.cacheTtlMs)
  const testCache = new InMemoryCache<TestDefinition[]>(config.limits.cacheTtlMs)

  const deps: AppDependencies = {
    userService,
    db,
    llmClient,
    responseParser,
    encounterRepo,
    libraryCaches: {
      getCdrs: () => cdrCache.getOrFetch('all', () => libraryRepo.getAllCdrs()),
      getTests: () => testCache.getOrFetch('all', () => libraryRepo.getAllTests()),
    },
  }

  const app = createApp(deps)
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
