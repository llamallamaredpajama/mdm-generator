/**
 * In-memory cache for test and CDR libraries.
 *
 * These libraries rarely change (only via seed scripts), so a simple
 * time-based cache avoids redundant Firestore reads.
 */

import { getDb } from './db'
import type { TestDefinition, TestCategory, TestLibraryResponse, CdrDefinition } from '../types/libraries'

const LIBRARY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let testLibraryCache: TestLibraryResponse | null = null
let testLibraryCacheTime = 0

let cdrLibraryCache: { ok: true; cdrs: CdrDefinition[] } | null = null
let cdrLibraryCacheTime = 0

function isCacheValid(cacheTime: number): boolean {
  return (Date.now() - cacheTime) < LIBRARY_CACHE_TTL
}

/**
 * Read CDR library from cache or Firestore.
 * Used by GET /v1/libraries/cdrs and POST /v1/build-mode/match-cdrs.
 */
export async function getCachedCdrLibrary(): Promise<CdrDefinition[]> {
  if (cdrLibraryCache && isCacheValid(cdrLibraryCacheTime)) {
    return cdrLibraryCache.cdrs
  }

  const snapshot = await getDb().collection('cdrLibrary').get()
  const cdrs: CdrDefinition[] = []
  for (const doc of snapshot.docs) {
    const d = doc.data()
    if (d.id && d.name && d.components && d.scoring) {
      cdrs.push(d as CdrDefinition)
    } else {
      console.warn({ action: 'cdr-cache-refresh', warning: 'skipped malformed doc', docId: doc.id })
    }
  }

  cdrLibraryCache = { ok: true as const, cdrs }
  cdrLibraryCacheTime = Date.now()
  return cdrs
}

/**
 * Read test library from cache or Firestore, returning only TestDefinition[].
 * Used by POST /v1/build-mode/parse-results and other internal callers.
 */
export async function getCachedTestLibrary(): Promise<TestDefinition[]> {
  const response = await getCachedTestLibraryResponse()
  return response.tests
}

/**
 * Read test library from cache or Firestore, returning the full response shape.
 * Used by GET /v1/libraries/tests.
 */
export async function getCachedTestLibraryResponse(): Promise<TestLibraryResponse> {
  if (testLibraryCache && isCacheValid(testLibraryCacheTime)) {
    return testLibraryCache
  }

  const snapshot = await getDb().collection('testLibrary').get()
  const tests: TestDefinition[] = []
  for (const doc of snapshot.docs) {
    const d = doc.data()
    if (d.id && d.name && d.category) {
      tests.push(d as TestDefinition)
    } else {
      console.warn({ action: 'test-cache-refresh', warning: 'skipped malformed doc', docId: doc.id })
    }
  }
  const categories = [...new Set(tests.map(t => t.category))] as TestCategory[]

  testLibraryCache = { ok: true, tests, categories, cachedAt: new Date().toISOString() }
  testLibraryCacheTime = Date.now()
  return testLibraryCache
}
