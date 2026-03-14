/**
 * Dependency type definitions for the composition root.
 *
 * Each module declares its required dependencies via a dedicated interface.
 * The composition root in index.ts constructs concrete implementations
 * and passes them to createApp().
 */

import type { UserService } from './services/userService.js'
import type { ILlmClient } from './llm/llmClient.js'
import type { LlmResponseParser } from './llm/responseParser.js'
import type { IEncounterRepository } from './data/repositories/encounterRepository.js'
import type { EncounterOrchestrator } from './modules/encounter/encounterOrchestrator.js'
import type { CdrDefinition, TestDefinition } from './types/libraries.js'
import type { createRequirePlan } from './middleware/auth.js'

// ============================================================================
// Shared types
// ============================================================================

export interface LibraryCaches {
  getCdrs: () => Promise<CdrDefinition[]>
  getTests: () => Promise<TestDefinition[]>
}

// ============================================================================
// Per-module dependency interfaces
// ============================================================================

export interface AdminDeps {
  userService: UserService
}

export interface LibraryDeps {
  libraryCaches: LibraryCaches
}

export interface NarrativeDeps {
  llmClient: ILlmClient
  responseParser: LlmResponseParser
}

export interface UserModuleDeps {
  userService: UserService
  db: FirebaseFirestore.Firestore
}

export interface AnalyticsDeps {
  userService: UserService
  db: FirebaseFirestore.Firestore
  llmClient: ILlmClient
  requirePlan: ReturnType<typeof createRequirePlan>
}

export interface SurveillanceDeps {
  userService: UserService
  db: FirebaseFirestore.Firestore
  requirePlan: ReturnType<typeof createRequirePlan>
}

export interface EncounterDeps {
  orchestrator: EncounterOrchestrator
}

export interface QuickModeDeps {
  encounterRepo: IEncounterRepository
  userService: UserService
  llmClient: ILlmClient
  responseParser: LlmResponseParser
  db: FirebaseFirestore.Firestore
}

// ============================================================================
// Aggregate — used by createApp()
// ============================================================================

export interface AppDependencies {
  userService: UserService
  db: FirebaseFirestore.Firestore
  llmClient: ILlmClient
  responseParser: LlmResponseParser
  encounterRepo: IEncounterRepository
  libraryCaches: LibraryCaches
}
