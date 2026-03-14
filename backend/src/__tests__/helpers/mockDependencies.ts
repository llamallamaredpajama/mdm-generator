/**
 * Mock dependency factories for DI-based integration tests.
 *
 * Creates mock implementations of AppDependencies for injection into createApp().
 * Eliminates the need for module-level mocks of vertex, userService, and the
 * Express capture hack — dependencies are injected directly.
 */

import { vi } from 'vitest'
import type { ILlmClient } from '../../llm/llmClient.js'
import type { IEncounterRepository } from '../../data/repositories/encounterRepository.js'
import type { UserService } from '../../services/userService.js'
import { LlmResponseParser } from '../../llm/responseParser.js'
import type { LibraryCaches, AppDependencies } from '../../dependencies.js'

// ============================================================================
// Mock type aliases (expose vi.fn() return type for assertion access)
// ============================================================================

export interface MockLlmClient {
  generate: ReturnType<typeof vi.fn>
}

export interface MockEncounterRepo {
  get: ReturnType<typeof vi.fn>
  updateSection1: ReturnType<typeof vi.fn>
  updateSection2: ReturnType<typeof vi.fn>
  finalize: ReturnType<typeof vi.fn>
  markQuotaCounted: ReturnType<typeof vi.fn>
  updateCdrTracking: ReturnType<typeof vi.fn>
  updateQuickModeStatus: ReturnType<typeof vi.fn>
  finalizeQuickMode: ReturnType<typeof vi.fn>
}

export interface MockUserService {
  ensureUser: ReturnType<typeof vi.fn>
  getUser: ReturnType<typeof vi.fn>
  getUsageStats: ReturnType<typeof vi.fn>
  checkQuota: ReturnType<typeof vi.fn>
  checkAndIncrementQuota: ReturnType<typeof vi.fn>
  incrementUsage: ReturnType<typeof vi.fn>
  adminSetPlan: ReturnType<typeof vi.fn>
  incrementGapTallies: ReturnType<typeof vi.fn>
}

export interface MockLibraryCaches {
  getCdrs: ReturnType<typeof vi.fn>
  getTests: ReturnType<typeof vi.fn>
}

// ============================================================================
// Factory functions
// ============================================================================

export function createMockLlmClient(): MockLlmClient {
  return {
    generate: vi.fn(),
  }
}

export function createMockEncounterRepo(): MockEncounterRepo {
  return {
    get: vi.fn(),
    updateSection1: vi.fn().mockResolvedValue(undefined),
    updateSection2: vi.fn().mockResolvedValue(undefined),
    finalize: vi.fn().mockResolvedValue(undefined),
    markQuotaCounted: vi.fn().mockResolvedValue(undefined),
    updateCdrTracking: vi.fn().mockResolvedValue(undefined),
    updateQuickModeStatus: vi.fn().mockResolvedValue(undefined),
    finalizeQuickMode: vi.fn().mockResolvedValue(undefined),
  }
}

export function createMockUserService(): MockUserService {
  return {
    ensureUser: vi.fn(),
    getUser: vi.fn(),
    getUsageStats: vi.fn(),
    checkQuota: vi.fn(),
    checkAndIncrementQuota: vi.fn(),
    incrementUsage: vi.fn(),
    adminSetPlan: vi.fn(),
    incrementGapTallies: vi.fn().mockResolvedValue(undefined),
  }
}

export function createMockLibraryCaches(): MockLibraryCaches {
  return {
    getCdrs: vi.fn().mockResolvedValue([]),
    getTests: vi.fn().mockResolvedValue([]),
  }
}

export function createMockDb() {
  return {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: true }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true }),
            set: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    }),
  } as unknown as FirebaseFirestore.Firestore
}

// ============================================================================
// Aggregate factory — builds AppDependencies + exposes mock handles
// ============================================================================

export interface MockDependencyKit {
  deps: AppDependencies
  llmClient: MockLlmClient
  encounterRepo: MockEncounterRepo
  userService: MockUserService
  libraryCaches: MockLibraryCaches
  db: FirebaseFirestore.Firestore
}

export function createMockDependencies(): MockDependencyKit {
  const llmClient = createMockLlmClient()
  const encounterRepo = createMockEncounterRepo()
  const userService = createMockUserService()
  const libraryCaches = createMockLibraryCaches()
  const db = createMockDb()

  return {
    deps: {
      llmClient: llmClient as unknown as ILlmClient,
      encounterRepo: encounterRepo as unknown as IEncounterRepository,
      userService: userService as unknown as UserService,
      responseParser: new LlmResponseParser(),
      libraryCaches: libraryCaches as unknown as LibraryCaches,
      db,
    },
    llmClient,
    encounterRepo,
    userService,
    libraryCaches,
    db,
  }
}
