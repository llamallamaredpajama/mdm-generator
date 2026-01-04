/**
 * Build Mode TypeScript Interfaces
 *
 * Defines the data structures for the Build Mode feature which provides
 * a structured, accordion-based input form for complex MDM documentation.
 */

// ============================================================================
// Chief Complaint Section
// ============================================================================
export interface ChiefComplaintSection {
  complaint: string
  context: string
  age: string
  sex: string
}

// ============================================================================
// Problems Considered (Differential Diagnosis)
// ============================================================================
export interface ProblemsConsideredSection {
  /** Life-threatening conditions to consider first (worst-first approach) */
  emergent: string[]
  /** Less critical but still relevant conditions */
  nonEmergent: string[]
}

// ============================================================================
// Data Reviewed/Ordered
// ============================================================================
export interface DataReviewedSection {
  labs: string
  imaging: string
  ekg: string
  externalRecords: string
  independentHistorian: string
}

// ============================================================================
// Risk Assessment
// ============================================================================
export interface RiskAssessmentSection {
  patientFactors: string
  diagnosticRisks: string
  treatmentRisks: string
  dispositionRisks: string
  highestRiskElement: string
}

// ============================================================================
// Clinical Reasoning
// ============================================================================
export interface ClinicalReasoningSection {
  evaluationApproach: string
  keyDecisionPoints: string
  workingDiagnosis: string
}

// ============================================================================
// Treatment & Procedures
// ============================================================================
export interface TreatmentProceduresSection {
  medications: string
  procedures: string
  rationale: string
}

// ============================================================================
// Disposition
// ============================================================================
export interface DispositionSection {
  /** Admit/Discharge/Transfer/AMA */
  decision: string
  /** Floor/Stepdown/ICU/Observation */
  levelOfCare: string
  rationale: string
  dischargeInstructions: string
  followUp: string
  returnPrecautions: string
}

// ============================================================================
// Complete Build Mode Form State
// ============================================================================
export interface BuildModeFormState {
  chiefComplaint: ChiefComplaintSection
  problemsConsidered: ProblemsConsideredSection
  dataReviewed: DataReviewedSection
  riskAssessment: RiskAssessmentSection
  clinicalReasoning: ClinicalReasoningSection
  treatmentProcedures: TreatmentProceduresSection
  disposition: DispositionSection
}

// ============================================================================
// Initial/Empty Form State
// ============================================================================
export const initialBuildModeFormState: BuildModeFormState = {
  chiefComplaint: {
    complaint: '',
    context: '',
    age: '',
    sex: '',
  },
  problemsConsidered: {
    emergent: [''],
    nonEmergent: [''],
  },
  dataReviewed: {
    labs: '',
    imaging: '',
    ekg: '',
    externalRecords: '',
    independentHistorian: '',
  },
  riskAssessment: {
    patientFactors: '',
    diagnosticRisks: '',
    treatmentRisks: '',
    dispositionRisks: '',
    highestRiskElement: '',
  },
  clinicalReasoning: {
    evaluationApproach: '',
    keyDecisionPoints: '',
    workingDiagnosis: '',
  },
  treatmentProcedures: {
    medications: '',
    procedures: '',
    rationale: '',
  },
  disposition: {
    decision: '',
    levelOfCare: '',
    rationale: '',
    dischargeInstructions: '',
    followUp: '',
    returnPrecautions: '',
  },
}

// ============================================================================
// Parse Narrative API Types
// ============================================================================
export interface ParseNarrativeRequest {
  narrative: string
  userIdToken: string
}

export interface ParseNarrativeResponse {
  ok: boolean
  parsed: Partial<BuildModeFormState>
  confidence: number
  warnings?: string[]
}

// ============================================================================
// Validation Types
// ============================================================================
export type ValidationStatus = 'empty' | 'sparse' | 'complete'

export type SectionValidationState = Record<keyof BuildModeFormState, ValidationStatus>

// ============================================================================
// Section Metadata (for accordion display)
// ============================================================================
export interface SectionMetadata {
  id: keyof BuildModeFormState
  title: string
  description: string
  icon: string
}

export const sectionMetadata: SectionMetadata[] = [
  {
    id: 'chiefComplaint',
    title: 'Chief Complaint & Context',
    description: 'Patient demographics and presenting complaint',
    icon: 'user',
  },
  {
    id: 'problemsConsidered',
    title: 'Problems Considered',
    description: 'Differential diagnosis with worst-first mentality',
    icon: 'list',
  },
  {
    id: 'dataReviewed',
    title: 'Data Reviewed/Ordered',
    description: 'Labs, imaging, EKG, and external records',
    icon: 'clipboard',
  },
  {
    id: 'riskAssessment',
    title: 'Risk Assessment',
    description: 'Patient, diagnostic, treatment, and disposition risks',
    icon: 'alert-triangle',
  },
  {
    id: 'clinicalReasoning',
    title: 'Clinical Reasoning',
    description: 'Evaluation approach and key decision points',
    icon: 'brain',
  },
  {
    id: 'treatmentProcedures',
    title: 'Treatment & Procedures',
    description: 'Medications administered and procedures performed',
    icon: 'activity',
  },
  {
    id: 'disposition',
    title: 'Disposition',
    description: 'Discharge, admission, or transfer decision',
    icon: 'log-out',
  },
]
