/**
 * Test Library Types
 *
 * Mirror of backend/src/types/libraries.ts for frontend consumption.
 * These types are consumed by the order selection UI and result entry components.
 */

/** Category for test library items */
export type TestCategory = 'labs' | 'imaging' | 'procedures_poc'

/**
 * Master test definition from the testLibrary Firestore collection.
 * Fetched via GET /v1/libraries/tests.
 */
export interface TestDefinition {
  /** Unique identifier (lowercase, snake_case) */
  id: string
  /** Display name (e.g., "Troponin", "CT Head") */
  name: string
  /** Top-level category */
  category: TestCategory
  /** Subcategory within the category */
  subcategory: string
  /** Common clinical indications */
  commonIndications: string[]
  /** Unit of measurement (null for non-quantitative tests) */
  unit: string | null
  /** Normal range string (null if not applicable) */
  normalRange: string | null
  /** Quick findings options for rapid result entry (null if freeform only) */
  quickFindings: string[] | null
  /** Array of CDR IDs this test feeds into */
  feedsCdrs: string[]
}

/** Response shape from GET /v1/libraries/tests */
export interface TestLibraryResponse {
  ok: true
  tests: TestDefinition[]
  categories: TestCategory[]
  cachedAt: string
}
