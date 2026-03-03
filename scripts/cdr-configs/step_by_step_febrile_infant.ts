import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: Step-by-Step Febrile Infant Algorithm
 *
 * Previously quarantined because lab components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results via select/boolean UI.
 * Thresholds verified against Gomez, Mintegi, Bressan et al., Pediatrics 2016.
 */
export const stepByStepFebrileInfant: CdrSeed = {
  id: 'step_by_step_febrile_infant',
  name: 'Step-by-Step Algorithm',
  fullName: 'Step-by-Step Approach (European Febrile Infant Algorithm)',
  category: 'INFECTIOUS DISEASE',
  application: 'Risk stratification for febrile infants ≤90 days using sequential assessment including procalcitonin. Studies show ~92% sensitivity and NPV ~99.3% for invasive bacterial infection (IBI) when all steps negative.',
  applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
  keywords: ['Step-by-Step', 'European febrile infant', 'procalcitonin', 'febrile infant', '≤90 days', 'sequential algorithm', 'invasive bacterial infection'],
  requiredTests: ['procalcitonin', 'esr_crp', 'cbc', 'ua'],
  components: [
    {
      id: 'step1_ill_appearing',
      label: 'Step 1: Ill-appearing (toxic, lethargic, poor perfusion) — if YES, stop; HIGH RISK',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'step2_age_21d_or_less',
      label: 'Step 2: Age ≤21 days — if YES, stop; HIGH RISK regardless of other criteria',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'step3_leukocyturia',
      label: 'Step 3: Leukocyturia present on UA (≥10 WBC/hpf or positive LE)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'step4_procalcitonin_elevated',
      label: 'Step 4: Procalcitonin ≥0.5 ng/mL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'step5_crp_or_anc_elevated',
      label: 'Step 5: CRP ≥20 mg/L OR ANC >10,000/µL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 0, max: 0, risk: 'Low', interpretation: 'All 5 steps negative: Low risk of IBI; NPV ~99.3%; close outpatient follow-up with strict return precautions may be appropriate; blood culture recommended before discharge' },
      { min: 1, max: 5, risk: 'High', interpretation: 'Step 1 positive (ill-appearing): Full sepsis workup; empiric antibiotics; admit immediately. Step 2 positive (age ≤21d): Full workup including LP; empiric antibiotics; admit. Step 3 or 4 positive: High risk for IBI/UTI; full workup + treat. Step 5 positive alone: Intermediate risk; consider LP; treat empirically' },
    ],
  },
  suggestedTreatments: {
    High: ['blood_cx', 'urine_cx', 'lumbar_puncture', 'empiric_antibiotics', 'admit'],
    Low: ['blood_cx', 'urine_cx', 'close_followup_24h', 'return_precautions'],
  },
}
