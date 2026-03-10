import type { GapBenefitCategory, GapAcquisitionMethod } from '../types/encounter'

// ============================================================================
// Gap Tips Catalog
// ============================================================================

export interface GapTip {
  title: string
  tip: string
  category: GapBenefitCategory
  method: GapAcquisitionMethod
}

const catalog: Record<string, GapTip> = {
  // ── 5 Canonical Enhancement Gaps ──────────────────────────────────────
  independent_historian: {
    title: 'Document independent historian interview',
    tip: 'Note who provided history (EMS, family, facility staff) and key details they reported. This supports higher complexity MDM.',
    category: 'billing',
    method: 'history',
  },
  shared_decision_making: {
    title: 'Document shared decision-making discussion',
    tip: "Record that you discussed diagnosis, treatment options, risks/benefits, and patient preferences. Include the patient's expressed wishes.",
    category: 'medicolegal',
    method: 'history',
  },
  risk_benefit_discussion: {
    title: 'Document risk/benefit discussion',
    tip: 'Document specific risks and benefits discussed for procedures, medications, or disposition decisions. Note patient understanding and agreement.',
    category: 'medicolegal',
    method: 'history',
  },
  independent_imaging_interpretation: {
    title: 'Document independent imaging review',
    tip: 'Record your own interpretation of imaging studies before or independent of the radiologist read. Note specific findings you identified.',
    category: 'billing',
    method: 'data_collection',
  },
  reassessment_documentation: {
    title: 'Document reassessment findings',
    tip: 'Document interval reassessment including response to treatment, change in symptoms, and updated exam findings.',
    category: 'care',
    method: 'clinical_action',
  },

  // ── Common EM Documentation Gaps ──────────────────────────────────────
  pain_reassessment: {
    title: 'Pain reassessment',
    tip: 'Document pain score before and after intervention. Note time of reassessment and change in pain level.',
    category: 'care',
    method: 'clinical_action',
  },
  medication_reconciliation: {
    title: 'Medication reconciliation',
    tip: 'Document current medications reviewed including dose, frequency, and last taken. Note any discrepancies or interactions.',
    category: 'care',
    method: 'history',
  },
  allergy_documentation: {
    title: 'Allergy documentation',
    tip: 'Document specific allergies and reaction type (anaphylaxis vs. intolerance). Note "NKDA" explicitly if no known allergies.',
    category: 'care',
    method: 'history',
  },
  social_history_documentation: {
    title: 'Social history documentation',
    tip: 'Document relevant social history: tobacco, alcohol, substance use, living situation, and support system as clinically relevant.',
    category: 'billing',
    method: 'history',
  },
  advance_directive_discussion: {
    title: 'Advance directive discussion',
    tip: 'Document code status discussion for critically ill patients. Note existing advance directives or surrogate decision-maker.',
    category: 'medicolegal',
    method: 'history',
  },
  discharge_instructions_detail: {
    title: 'Detailed discharge instructions',
    tip: 'Document specific discharge instructions given including activity restrictions, medication changes, and warning signs.',
    category: 'care',
    method: 'clinical_action',
  },
  return_precautions: {
    title: 'Return precautions',
    tip: 'Document specific return-to-ED criteria discussed with patient. Include warning signs and symptoms requiring immediate re-evaluation.',
    category: 'medicolegal',
    method: 'clinical_action',
  },
  time_based_documentation: {
    title: 'Time-based documentation',
    tip: 'Document time spent in direct patient care when relevant for billing. Note bedside time, coordination, and counseling time.',
    category: 'billing',
    method: 'data_collection',
  },
  critical_care_time: {
    title: 'Critical care time documentation',
    tip: 'Document total critical care time excluding separately billable procedures. Note clinical instability and high-complexity decision-making.',
    category: 'billing',
    method: 'data_collection',
  },
  wound_measurement: {
    title: 'Wound measurement',
    tip: 'Document wound dimensions (length x width x depth), location, and characteristics. Required for accurate procedure coding.',
    category: 'billing',
    method: 'data_collection',
  },
  neurovascular_check: {
    title: 'Neurovascular check',
    tip: 'Document neurovascular status (sensation, motor, pulses, capillary refill) distal to injury or procedure site.',
    category: 'care',
    method: 'clinical_action',
  },
  capacity_assessment: {
    title: 'Capacity assessment',
    tip: 'Document assessment of decision-making capacity: understanding, appreciation, reasoning, and ability to express a choice.',
    category: 'medicolegal',
    method: 'clinical_action',
  },
  informed_consent: {
    title: 'Informed consent documentation',
    tip: 'Document that informed consent was obtained including risks, benefits, alternatives discussed, and patient agreement.',
    category: 'medicolegal',
    method: 'history',
  },
  safety_screening: {
    title: 'Safety screening',
    tip: 'Document screening for domestic violence, suicidal ideation, or substance abuse as clinically indicated.',
    category: 'care',
    method: 'history',
  },
  fall_risk_assessment: {
    title: 'Fall risk assessment',
    tip: 'Document fall risk evaluation including gait assessment, contributing factors, and preventive measures taken.',
    category: 'care',
    method: 'clinical_action',
  },
}

// ============================================================================
// Helper
// ============================================================================

const GENERIC_TIP: GapTip = {
  title: 'Documentation gap',
  tip: 'Consider adding documentation for this identified gap to support comprehensive MDM.',
  category: 'care',
  method: 'history',
}

/**
 * Returns the tip entry for a gap ID, or a generic fallback for uncataloged IDs.
 */
export function getGapTip(gapId: string): GapTip {
  return catalog[gapId] ?? GENERIC_TIP
}

export default catalog
