/**
 * Build Mode v2 - Encounter TypeScript Interfaces
 *
 * Defines the data structures for the multi-encounter Build Mode feature
 * which provides a 3-section guided workflow for MDM documentation.
 *
 * Data Model: Firestore `customers/{uid}/encounters/{encounterId}`
 */

import type { Timestamp } from 'firebase/firestore'

// ============================================================================
// Character Limit Constants
// ============================================================================

/** Maximum characters for Section 1: Initial Evaluation */
export const SECTION1_MAX_CHARS = 2000

/** Maximum characters for Section 2: Workup & Results */
export const SECTION2_MAX_CHARS = 2000

/** Maximum characters for Section 3: Treatment & Disposition */
export const SECTION3_MAX_CHARS = 2000

/** Total approximate character limit across all sections */
export const TOTAL_MAX_CHARS = SECTION1_MAX_CHARS + SECTION2_MAX_CHARS + SECTION3_MAX_CHARS

/** Maximum submissions per section before locking */
export const MAX_SUBMISSIONS_PER_SECTION = 2

// ============================================================================
// Mode Types
// ============================================================================

/** Encounter mode: quick (one-shot) vs build (3-section workflow) */
export type EncounterMode = 'quick' | 'build'

/** Status of a quick mode encounter */
export type QuickModeStatus = 'draft' | 'processing' | 'completed' | 'error'

/** Patient identifier extracted by AI from quick mode narrative */
export interface PatientIdentifier {
  /** Patient age (e.g., "45 y/o", "elderly") */
  age?: string
  /** Patient sex (e.g., "male", "female") */
  sex?: string
  /** Brief chief complaint (e.g., "chest pain") */
  chiefComplaint?: string
}

/** Quick mode specific data stored in encounter */
export interface QuickModeData {
  /** User's narrative input */
  narrative: string
  /** AI-extracted patient identifier (populated after processing) */
  patientIdentifier?: PatientIdentifier
  /** Current status of the quick mode encounter */
  status: QuickModeStatus
  /** Generated MDM output (populated after processing) */
  mdmOutput?: {
    /** Formatted text version for direct EHR paste */
    text: string
    /** Structured JSON version for programmatic use */
    json: Record<string, unknown>
  }
  /** Error message if status is 'error' */
  errorMessage?: string
  /** When the AI processed this encounter */
  processedAt?: import('firebase/firestore').Timestamp
}

// ============================================================================
// Status Types
// ============================================================================

/** Status of an individual section within an encounter */
export type SectionStatus = 'pending' | 'in_progress' | 'completed'

/** Overall status of an encounter document */
export type EncounterStatus =
  | 'draft'
  | 'section1_done'
  | 'section2_done'
  | 'finalized'
  | 'archived'

/** Urgency classification for differential diagnosis items */
export type UrgencyLevel = 'emergent' | 'urgent' | 'routine'

// ============================================================================
// LLM Response Types
// ============================================================================

/**
 * Individual item in the generated differential diagnosis
 * Follows worst-first approach for Emergency Medicine
 */
export interface DifferentialItem {
  /** The diagnosis being considered */
  diagnosis: string
  /** Urgency classification: emergent, urgent, or routine */
  urgency: UrgencyLevel
  /** Clinical reasoning supporting this diagnosis */
  reasoning: string
  /** Regional surveillance context (e.g., "RSV activity elevated in region") */
  regionalContext?: string
  /** Clinical decision rule context (e.g., "HEART score applicable") */
  cdrContext?: string
}

/**
 * MDM preview generated after Section 2 processing
 * Contains accumulated information from sections 1 and 2
 *
 * NOTE: problems, differential, and dataReviewed may be strings, arrays,
 * or objects — the backend schema uses z.any() because LLM output varies.
 * Always normalize before display (see MdmPreviewPanel.normalizeToString).
 */
export interface MdmPreview {
  /** Problems/diagnoses being addressed (may be string or array from LLM) */
  problems: string | string[] | Record<string, unknown>[]
  /** Differential diagnosis summary (may be string or array from LLM) */
  differential: string | string[] | Record<string, unknown>[]
  /** Data reviewed: labs, imaging, EKG, etc. (may be string or array from LLM) */
  dataReviewed: string | string[] | Record<string, unknown>[]
  /** Clinical reasoning and decision-making rationale */
  reasoning: string
}

/**
 * Final MDM output generated after Section 3 processing
 * Ready for copy-paste into EHR
 */
export interface FinalMdm {
  /** Formatted text version for direct EHR paste */
  text: string
  /** Structured JSON version for programmatic use */
  json: Record<string, unknown>
}

// ============================================================================
// Foundational Types (used across sections and structured data)
// ============================================================================

/** Section number type for type-safe section references */
export type SectionNumber = 1 | 2 | 3

// ============================================================================
// Structured Data Types (Build Mode v2 Extensions)
// ============================================================================

/** Status of an individual test result */
export type TestResultStatus = 'unremarkable' | 'abnormal' | 'pending'

/** Individual test result with structured findings */
export interface TestResult {
  status: TestResultStatus
  quickFindings?: string[]
  notes?: string | null
  value?: string | null
  unit?: string | null
}

/** Structured working diagnosis with AI suggestions */
export interface WorkingDiagnosis {
  selected: string | null
  custom?: string | null
  suggestedOptions?: string[]
}

/** Type guard: distinguishes structured WorkingDiagnosis from legacy plain string */
export const isStructuredDiagnosis = (
  wd: string | WorkingDiagnosis | undefined | null
): wd is WorkingDiagnosis => {
  return wd !== null && wd !== undefined && typeof wd === 'object'
}

/** Source of a CDR component value */
export type CdrComponentSource = 'section1' | 'section2' | 'user_input'

/** State of an individual CDR component */
export interface CdrComponentState {
  value?: number | null
  source?: CdrComponentSource | null
  answered: boolean
}

/** Status of a CDR tracking entry */
export type CdrStatus = 'pending' | 'partial' | 'completed' | 'dismissed'

/** Tracking entry for a single clinical decision rule */
export interface CdrTrackingEntry {
  name: string
  status: CdrStatus
  identifiedInSection?: SectionNumber
  completedInSection?: SectionNumber | null
  dismissed: boolean
  components: Record<string, CdrComponentState>
  score?: number | null
  interpretation?: string | null
}

/** CDR tracking state, keyed by CDR ID (e.g., "heart", "wells_pe") */
export type CdrTracking = Record<string, CdrTrackingEntry>

/** Disposition option for patient */
export type DispositionOption = 'discharge' | 'observation' | 'admit' | 'icu' | 'transfer' | 'ama' | 'lwbs' | 'deceased'

// ============================================================================
// Section Data Interfaces
// ============================================================================

/**
 * Section 1: Initial Evaluation
 * User input: History, physical exam, initial impression
 * LLM output: Differential diagnosis (worst-first)
 */
export interface Section1Data {
  /** Status of this section */
  status: SectionStatus
  /** User dictation content (frontend: SECTION1_MAX_CHARS) */
  content: string
  /** Number of times this section has been submitted (0, 1, or 2) */
  submissionCount: number
  /** Whether this section is locked (true after 2nd submission) */
  isLocked: boolean
  /** LLM response after processing */
  llmResponse?: {
    /** Generated differential diagnosis items */
    differential: DifferentialItem[]
    /** When the LLM processed this section */
    processedAt: Timestamp
  }
}

/**
 * Section 2: Workup & Results
 * User input: Tests, results, clinical decision rules, working diagnosis
 * LLM output: MDM preview with accumulated context
 */
export interface Section2Data {
  /** Status of this section */
  status: SectionStatus
  /** User dictation content (frontend: SECTION2_MAX_CHARS) */
  content: string
  /** Number of times this section has been submitted (0, 1, or 2) */
  submissionCount: number
  /** Whether this section is locked (true after 2nd submission) */
  isLocked: boolean
  /** Working diagnosis — plain string (legacy) or structured object (v2) */
  workingDiagnosis?: string | WorkingDiagnosis
  /** Selected test IDs from master test library (e.g., "ecg", "troponin") */
  selectedTests?: string[]
  /** Test results keyed by test ID */
  testResults?: Record<string, TestResult>
  /** Whether all test results are unremarkable */
  allUnremarkable?: boolean
  /** Raw pasted text from results (unstructured fallback) */
  pastedRawText?: string | null
  /** Applied order set ID, if any */
  appliedOrderSet?: string | null
  /** LLM response after processing */
  llmResponse?: {
    /** Generated MDM preview */
    mdmPreview: MdmPreview
    /** When the LLM processed this section */
    processedAt: Timestamp
  }
}

/**
 * Section 3: Treatment & Disposition
 * User input: Treatments, responses, consults, disposition
 * LLM output: Final complete MDM
 */
export interface Section3Data {
  /** Status of this section */
  status: SectionStatus
  /** User dictation content (frontend: SECTION3_MAX_CHARS) */
  content: string
  /** Number of times this section has been submitted (0, 1, or 2) */
  submissionCount: number
  /** Whether this section is locked (true after 2nd submission) */
  isLocked: boolean
  /** Free-text treatments description */
  treatments?: string
  /** CDR-suggested treatment IDs */
  cdrSuggestedTreatments?: string[]
  /** Patient disposition */
  disposition?: DispositionOption | null
  /** Follow-up instructions */
  followUp?: string[]
  /** Applied disposition flow ID, if any */
  appliedDispoFlow?: string | null
  /** LLM response after processing */
  llmResponse?: {
    /** Final generated MDM */
    finalMdm: FinalMdm
    /** When the LLM processed this section */
    processedAt: Timestamp
  }
}

// ============================================================================
// Main Encounter Document
// ============================================================================

/**
 * Complete Encounter document stored in Firestore
 * Path: customers/{uid}/encounters/{encounterId}
 *
 * TTL Strategy:
 * - 0-12h: Active (editable)
 * - 12-24h: Archived (read-only)
 * - 24h+: Auto-deleted via Cloud Function
 *
 * Mode Strategy:
 * - 'quick': One-shot AI processing, single narrative input
 * - 'build': 3-section guided workflow (default for backward compatibility)
 */
export interface EncounterDocument {
  /** Firestore document ID */
  id: string
  /** User ID who owns this encounter */
  userId: string
  /** Room identifier (e.g., "Room 5", "Bed 2A") */
  roomNumber: string
  /** Brief chief complaint for card display (build mode) or auto-populated from AI (quick mode) */
  chiefComplaint: string
  /** Overall encounter status */
  status: EncounterStatus
  /** Current active section (1, 2, or 3) - only used in build mode */
  currentSection: 1 | 2 | 3

  /** Encounter mode: 'quick' or 'build' (defaults to 'build' for backward compatibility) */
  mode: EncounterMode

  /** Quick mode specific data - only populated when mode is 'quick' */
  quickModeData?: QuickModeData

  /** Section 1: Initial Evaluation data (build mode) */
  section1: Section1Data
  /** Section 2: Workup & Results data (build mode) */
  section2: Section2Data
  /** Section 3: Treatment & Disposition data (build mode) */
  section3: Section3Data

  /** CDR tracking state, keyed by CDR ID (always hydrated to {} by onSnapshot) */
  cdrTracking: CdrTracking

  /** Whether this encounter has been counted against user quota */
  quotaCounted: boolean
  /** When the encounter was counted against quota */
  quotaCountedAt?: Timestamp

  /** When the encounter was created */
  createdAt: Timestamp
  /** When the encounter was last updated */
  updatedAt: Timestamp
  /** Reference timestamp for 12h active window */
  shiftStartedAt: Timestamp
  /** When the encounter was archived (if applicable) */
  archivedAt?: Timestamp
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from /v1/build-mode/process-section1
 */
export interface Section1Response {
  /** Generated differential diagnosis */
  differential: DifferentialItem[]
  /** Updated submission count for this section */
  submissionCount: number
  /** Whether the section is now locked */
  isLocked: boolean
  /** Remaining encounters in user's quota */
  quotaRemaining: number
}

/**
 * Response from /v1/build-mode/process-section2
 */
export interface Section2Response {
  /** Generated MDM preview */
  mdmPreview: MdmPreview
  /** Updated submission count for this section */
  submissionCount: number
  /** Whether the section is now locked */
  isLocked: boolean
}

/**
 * Response from /v1/build-mode/finalize
 */
export interface FinalizeResponse {
  /** Final generated MDM */
  finalMdm: FinalMdm
  /** Remaining encounters in user's quota */
  quotaRemaining: number
}

// ============================================================================
// Utility Types
// ============================================================================

/** Map section number to its data type */
export type SectionDataMap = {
  1: Section1Data
  2: Section2Data
  3: Section3Data
}

/** Character limits by section number */
export const SECTION_CHAR_LIMITS: Record<SectionNumber, number> = {
  1: SECTION1_MAX_CHARS,
  2: SECTION2_MAX_CHARS,
  3: SECTION3_MAX_CHARS,
}

/** Section titles for display */
export const SECTION_TITLES: Record<SectionNumber, string> = {
  1: 'Initial Evaluation',
  2: 'Workup & Results',
  3: 'Treatment & Disposition',
}

// ============================================================================
// Initial/Default Values
// ============================================================================

/**
 * Default section data for creating new sections
 */
export const createDefaultSectionData = (): Omit<Section1Data, 'llmResponse'> => ({
  status: 'pending',
  content: '',
  submissionCount: 0,
  isLocked: false,
})

/**
 * Helper to check if a section can be submitted
 */
export const canSubmitSection = (
  sectionData: Section1Data | Section2Data | Section3Data
): boolean => {
  return !sectionData.isLocked && sectionData.submissionCount < MAX_SUBMISSIONS_PER_SECTION
}

/**
 * Helper to get remaining submissions for a section
 */
export const getRemainingSubmissions = (
  sectionData: Section1Data | Section2Data | Section3Data
): number => {
  return Math.max(0, MAX_SUBMISSIONS_PER_SECTION - sectionData.submissionCount)
}

/**
 * Helper to format patient identifier for display (e.g., "45M Chest Pain")
 */
export const formatPatientIdentifier = (identifier?: PatientIdentifier): string => {
  if (!identifier) return ''

  const parts: string[] = []

  // Combine age and sex (e.g., "45M" or "elderly F")
  if (identifier.age || identifier.sex) {
    const age = identifier.age?.replace(/\s*(y\/o|years?(\s+old)?|yo)\s*/gi, '').trim() || ''
    const sex = identifier.sex?.charAt(0).toUpperCase() || '' // First letter (M/F)
    parts.push(`${age}${sex}`.trim())
  }

  // Add chief complaint
  if (identifier.chiefComplaint) {
    // Capitalize first letter and keep it brief
    const cc = identifier.chiefComplaint.charAt(0).toUpperCase() + identifier.chiefComplaint.slice(1)
    // Truncate if too long
    parts.push(cc.length > 20 ? cc.substring(0, 20) + '...' : cc)
  }

  return parts.join(' ').trim()
}

/**
 * Helper to get the display label for a quick mode encounter card
 * Returns formatted patient identifier if available, otherwise status
 */
export const getQuickModeCardLabel = (encounter: EncounterDocument): string => {
  if (encounter.mode !== 'quick' || !encounter.quickModeData) {
    return encounter.chiefComplaint
  }

  const { status, patientIdentifier } = encounter.quickModeData

  switch (status) {
    case 'draft':
      return 'Draft'
    case 'processing':
      return 'Processing...'
    case 'error':
      return 'Error'
    case 'completed':
      return formatPatientIdentifier(patientIdentifier) || 'Completed'
    default:
      return encounter.chiefComplaint
  }
}

/**
 * Helper to get encounter mode with backward compatibility
 * Existing encounters without mode field default to 'build'
 */
export const getEncounterMode = (encounter: EncounterDocument): EncounterMode => {
  return encounter.mode || 'build'
}

/**
 * Format room number for display.
 * If the input is purely numeric (e.g., "12"), prepends "Room " → "Room 12".
 * Otherwise returns as-is (e.g., "Bed 2A" stays "Bed 2A").
 */
export const formatRoomDisplay = (roomNumber: string): string => {
  const trimmed = roomNumber.trim()
  if (/^\d+$/.test(trimmed)) {
    return `Room ${trimmed}`
  }
  return trimmed
}
