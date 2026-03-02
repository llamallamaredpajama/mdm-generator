/**
 * CdrSeed Interface
 *
 * Extracted from seed-cdr-library.ts for use by batch config files.
 * Each batch file exports an array of CdrSeed objects that override
 * placeholder CDR entries in the seed script.
 */

export interface CdrComponentOption {
  label: string
  value: number
}

export type CdrComponentSource = 'section1' | 'section2' | 'user_input'
export type CdrComponentType = 'select' | 'boolean' | 'number_range' | 'algorithm'

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

export interface CdrScoringRange {
  min: number
  max: number
  risk: string
  interpretation: string
}

export interface CdrScoring {
  method: 'sum' | 'threshold' | 'algorithm'
  ranges: CdrScoringRange[]
}

export interface CdrSeed {
  id: string
  name: string
  fullName: string
  category: string
  application: string
  applicableChiefComplaints: string[]
  keywords: string[]
  requiredTests?: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
}
