/** A reusable order set for common test combinations */
export interface OrderSet {
  /** Firestore document ID */
  id: string
  /** Display name (e.g., "R/O MI Workup") */
  name: string
  /** Test IDs from the test library (e.g., ["ecg", "troponin_x2"]) */
  tests: string[]
  /** Searchable tags (e.g., ["chest_pain", "cardiac"]) */
  tags: string[]
  /** Server-set creation timestamp (ISO string from Firestore) */
  createdAt: string
  /** Number of times this order set has been used */
  usageCount: number
}

/** A saved disposition + follow-up pattern for quick encounter completion */
export interface DispositionFlow {
  /** Firestore document ID */
  id: string
  /** Display name (e.g., "Standard Discharge - Chest Pain") */
  name: string
  /** Disposition type (e.g., "discharge", "admit", "transfer") */
  disposition: string
  /** Follow-up instructions (e.g., ["cardiology_48hr", "return_ed_prn"]) */
  followUp: string[]
  /** Server-set creation timestamp (ISO string from Firestore) */
  createdAt: string
  /** Number of times this flow has been used */
  usageCount: number
}

/** A saved report template for common test result narratives */
export interface ReportTemplate {
  /** Firestore document ID */
  id: string
  /** Test library ID this template applies to (e.g., "ecg") */
  testId: string
  /** Display name (e.g., "NSR, normal intervals") */
  name: string
  /** Full report text */
  text: string
  /** Auto-sets result status when this template is applied */
  defaultStatus: 'unremarkable' | 'abnormal'
  /** Server-set creation timestamp (ISO string from Firestore) */
  createdAt: string
  /** Number of times this template has been used */
  usageCount: number
}

/** User-customizable dropdown options for disposition and follow-up fields */
export interface CustomizableOptions {
  /** Custom disposition labels (e.g., ["Discharge", "Admit", "Observation"]) */
  dispositionOptions: string[]
  /** Custom follow-up labels (e.g., ["Cardiology 48hr", "PCP 1 week"]) */
  followUpOptions: string[]
}
