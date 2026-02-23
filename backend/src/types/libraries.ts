/** Category for test library items */
export type TestCategory = 'labs' | 'imaging' | 'procedures_poc'

/**
 * Master test definition — one document per test in the `testLibrary` Firestore collection.
 * Consumed by order selection UI, result entry UI, and CDR system.
 */
export interface TestDefinition {
  /** Unique identifier (lowercase, snake_case). Also the Firestore doc ID. */
  id: string
  /** Display name (e.g., "Troponin", "CT Head") */
  name: string
  /** Top-level category */
  category: TestCategory
  /** Subcategory within the category (e.g., "cardiac", "hepatic", "head_neck") */
  subcategory: string
  /** Common clinical indications (array of indication keywords) */
  commonIndications: string[]
  /** Unit of measurement (null for non-quantitative tests like imaging) */
  unit: string | null
  /** Normal range string (null if not applicable) */
  normalRange: string | null
  /** Quick findings options for rapid result entry (null if freeform only) */
  quickFindings: string[] | null
  /** Array of CDR IDs this test feeds into (defined in BM-1.2). Populate with known mappings now. */
  feedsCdrs: string[]
}

/**
 * Response shape for GET /v1/libraries/tests
 */
export interface TestLibraryResponse {
  ok: true
  tests: TestDefinition[]
  categories: TestCategory[]
  cachedAt: string  // ISO timestamp of when cache was populated
}
