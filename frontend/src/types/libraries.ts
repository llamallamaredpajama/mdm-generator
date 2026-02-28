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

/** Response shape from GET /v1/libraries/cdrs */
export interface CdrLibraryResponse {
  ok: true
  cdrs: CdrDefinition[]
}

// ── CDR Types ───────────────────────────────────────────────────────────

/** Option for a CDR select component */
export interface CdrComponentOption {
  label: string
  value: number
}

/** Where a CDR component gets its data */
export type CdrComponentSource = 'section1' | 'section2' | 'user_input'

/** Type of CDR input component */
export type CdrComponentType = 'select' | 'boolean' | 'number_range' | 'algorithm'

/** Individual component of a Clinical Decision Rule */
export interface CdrComponent {
  id: string
  label: string
  type: CdrComponentType
  options?: CdrComponentOption[]
  min?: number
  max?: number
  /** Point weight for boolean components (e.g., Wells PE: DVT signs = 3 pts) */
  value?: number
  source: CdrComponentSource
  autoPopulateFrom?: string
}

/** A scoring range with risk level and interpretation */
export interface CdrScoringRange {
  min: number
  max: number
  risk: string
  interpretation: string
}

/** Scoring configuration for a CDR */
export interface CdrScoring {
  method: 'sum' | 'threshold' | 'algorithm'
  ranges: CdrScoringRange[]
}

/** Complete Clinical Decision Rule definition */
export interface CdrDefinition {
  id: string
  name: string
  fullName: string
  applicableChiefComplaints: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
  /** Brief clinical application summary (e.g., "Stratifies chest pain patients…") */
  application?: string
}
