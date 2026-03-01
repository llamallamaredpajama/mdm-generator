import { z } from 'zod'

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

// ── CDR Component Types ─────────────────────────────────────────────────

export const CdrComponentOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
})
export type CdrComponentOption = z.infer<typeof CdrComponentOptionSchema>

export const CdrComponentSourceSchema = z.enum(['section1', 'section2', 'user_input'])
export type CdrComponentSource = z.infer<typeof CdrComponentSourceSchema>

export const CdrComponentTypeSchema = z.enum(['select', 'boolean', 'number_range', 'algorithm'])
export type CdrComponentType = z.infer<typeof CdrComponentTypeSchema>

export const CdrComponentSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: CdrComponentTypeSchema,
  options: z.array(CdrComponentOptionSchema).optional(),   // for 'select' type
  min: z.number().optional(),                               // for 'number_range'
  max: z.number().optional(),                               // for 'number_range'
  value: z.number().optional(),                             // point weight for 'boolean' type (e.g., Wells PE: DVT signs = 3 pts)
  source: CdrComponentSourceSchema,
  autoPopulateFrom: z.string().optional(),
})
export type CdrComponent = z.infer<typeof CdrComponentSchema>

// ── CDR Scoring ─────────────────────────────────────────────────────────

export const CdrScoringRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  risk: z.string(),             // e.g., "Low", "Moderate", "High"
  interpretation: z.string(),   // clinical meaning
})
export type CdrScoringRange = z.infer<typeof CdrScoringRangeSchema>

export const CdrScoringSchema = z.object({
  method: z.enum(['sum', 'threshold', 'algorithm']).default('sum'),
  ranges: z.array(CdrScoringRangeSchema),
})
export type CdrScoring = z.infer<typeof CdrScoringSchema>

// ── CDR Definition ──────────────────────────────────────────────────────

export const CdrDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  applicableChiefComplaints: z.array(z.string()),
  components: z.array(CdrComponentSchema),
  scoring: CdrScoringSchema,
  suggestedTreatments: z.record(z.string(), z.array(z.string())).optional(),
  category: z.string().optional(),
  application: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  requiredTests: z.array(z.string()).optional(),
  embedding: z.array(z.number()).optional(),
})
export type CdrDefinition = z.infer<typeof CdrDefinitionSchema>
