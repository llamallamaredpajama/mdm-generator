import type { CdrSeed } from './types'

/**
 * Batch 5 — Infectious Disease & Toxicology CDRs
 *
 * CDRs: sofa, sirs, mascc, lrinec, ciwa_ar, rumack_matthew,
 *       bwps, ada_dka_severity, four_ts, anion_gap
 *
 * Sources: Singer et al. (Sepsis-3, JAMA 2016), MASCC 2000 (Klastersky),
 * LRINEC (Wong et al. 2004), CIWA-Ar (Sullivan et al. 1989),
 * Rumack-Matthew (J Pediatr 1975, Ann Emerg Med 1981), BWPS (Burch & Wartofsky 1993),
 * ADA DKA Standards 2024, Lo et al. 4Ts (2006), ADA SIRS criteria.
 */

export const batch5IdToxCdrs: CdrSeed[] = [
  // =========================================================================
  // INFECTIOUS DISEASE — SOFA Score
  // =========================================================================
  {
    id: 'sofa',
    name: 'SOFA Score',
    fullName: 'SOFA Score (Sequential Organ Failure Assessment)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Quantifies organ dysfunction in critically ill patients. An increase of ≥2 from baseline defines sepsis (Sepsis-3 definition). Each organ system scored 0–4; total 0–24.',
    applicableChiefComplaints: [
      'sepsis',
      'infection',
      'fever',
      'altered_mental_status',
      'hypotension',
      'shortness_of_breath',
    ],
    keywords: [
      'SOFA',
      'sequential organ failure assessment',
      'sepsis',
      'organ dysfunction',
      'ICU',
      'Sepsis-3',
      'critically ill',
    ],
    requiredTests: ['ABG/PaO2', 'FiO2', 'platelet count', 'bilirubin', 'creatinine', 'GCS'],
    components: [
      // Respiratory: PaO2/FiO2 ratio
      {
        id: 'pao2_fio2',
        label: 'Respiratory: PaO₂/FiO₂ ratio',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥400 (no dysfunction)', value: 0 },
          { label: '300–399', value: 1 },
          { label: '200–299 (with respiratory support)', value: 2 },
          { label: '100–199 (with respiratory support)', value: 3 },
          { label: '<100 (with respiratory support)', value: 4 },
        ],
      },
      // Coagulation: Platelets (×10³/µL)
      {
        id: 'platelets',
        label: 'Coagulation: Platelets (×10³/µL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥150', value: 0 },
          { label: '100–149', value: 1 },
          { label: '50–99', value: 2 },
          { label: '20–49', value: 3 },
          { label: '<20', value: 4 },
        ],
      },
      // Liver: Bilirubin (mg/dL)
      {
        id: 'bilirubin',
        label: 'Liver: Bilirubin (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.2', value: 0 },
          { label: '1.2–1.9', value: 1 },
          { label: '2.0–5.9', value: 2 },
          { label: '6.0–11.9', value: 3 },
          { label: '≥12.0', value: 4 },
        ],
      },
      // Cardiovascular: MAP or vasopressors
      {
        id: 'cardiovascular',
        label: 'Cardiovascular: MAP / Vasopressors',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'MAP ≥70 mmHg', value: 0 },
          { label: 'MAP <70 mmHg', value: 1 },
          { label: 'Dopamine ≤5 or dobutamine (any dose)', value: 2 },
          { label: 'Dopamine >5, epi ≤0.1, or norepi ≤0.1 µg/kg/min', value: 3 },
          { label: 'Dopamine >15, epi >0.1, or norepi >0.1 µg/kg/min', value: 4 },
        ],
      },
      // CNS: Glasgow Coma Scale
      {
        id: 'gcs',
        label: 'CNS: Glasgow Coma Scale (GCS)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '15 (normal)', value: 0 },
          { label: '13–14', value: 1 },
          { label: '10–12', value: 2 },
          { label: '6–9', value: 3 },
          { label: '<6', value: 4 },
        ],
      },
      // Renal: Creatinine (mg/dL) or urine output
      {
        id: 'renal',
        label: 'Renal: Creatinine (mg/dL) or Urine Output',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.2', value: 0 },
          { label: '1.2–1.9', value: 1 },
          { label: '2.0–3.4', value: 2 },
          { label: '3.5–4.9 or UO <500 mL/day', value: 3 },
          { label: '>5.0 or UO <200 mL/day', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 6,
          risk: 'Low',
          interpretation:
            'SOFA 0–6: <10% predicted mortality. Baseline SOFA assumed 0 unless prior organ dysfunction documented.',
        },
        {
          min: 7,
          max: 9,
          risk: 'Moderate',
          interpretation:
            'SOFA 7–9: ~15–20% predicted mortality. Sepsis if acute increase ≥2 from baseline with suspected infection.',
        },
        {
          min: 10,
          max: 12,
          risk: 'High',
          interpretation:
            'SOFA 10–12: ~40–50% predicted mortality. Septic shock if vasopressors required to maintain MAP ≥65 with lactate >2 mmol/L.',
        },
        {
          min: 13,
          max: 24,
          risk: 'Very High',
          interpretation:
            'SOFA >12: >80% predicted mortality. Acute change ≥2 from baseline + suspected infection = sepsis (Sepsis-3). Septic shock: vasopressors + lactate >2 mmol/L despite adequate resuscitation.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'broad_spectrum_antibiotics_1hr',
        'iv_fluid_30ml_kg',
        'vasopressors_norepinephrine',
        'lactate_recheck_2hr',
        'blood_cultures_x2',
        'icu_admission',
        'sepsis_bundle_activation',
      ],
      High: [
        'broad_spectrum_antibiotics_1hr',
        'iv_fluid_30ml_kg',
        'vasopressors_norepinephrine',
        'blood_cultures_x2',
        'lactate_recheck_2hr',
        'icu_consult',
      ],
      Moderate: [
        'broad_spectrum_antibiotics',
        'iv_fluid_resuscitation',
        'blood_cultures_x2',
        'serial_lactate',
        'step_down_monitoring',
      ],
      Low: ['source_control', 'targeted_antibiotics', 'monitoring'],
    },
  },

  // =========================================================================
  // INFECTIOUS DISEASE — SIRS Criteria
  // =========================================================================
  {
    id: 'sirs',
    name: 'SIRS Criteria',
    fullName: 'SIRS Criteria (Systemic Inflammatory Response Syndrome)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Traditional criteria for systemic inflammatory response. ≥2 criteria defines SIRS. When caused by infection, historically termed "sepsis" (pre-Sepsis-3 definition). Highly sensitive but non-specific — now superseded by qSOFA/SOFA for sepsis.',
    applicableChiefComplaints: ['fever', 'infection', 'sepsis', 'tachycardia', 'shortness_of_breath'],
    keywords: [
      'SIRS',
      'systemic inflammatory response',
      'sepsis',
      'fever',
      'tachycardia',
      'leukocytosis',
      'bands',
    ],
    requiredTests: ['WBC with differential', 'temperature', 'heart rate', 'respiratory rate', 'PaCO2'],
    components: [
      {
        id: 'temperature',
        label: 'Temperature >38°C (100.4°F) or <36°C (96.8°F)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_rate',
        label: 'Heart Rate >90 bpm',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'respiratory_rate',
        label: 'Respiratory Rate >20/min OR PaCO₂ <32 mmHg',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'wbc',
        label: 'WBC >12,000/µL, <4,000/µL, or >10% bands',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Low',
          interpretation:
            'Fewer than 2 SIRS criteria: Does not meet SIRS definition. Clinical judgment still required — SIRS is insensitive and non-specific.',
        },
        {
          min: 2,
          max: 4,
          risk: 'High',
          interpretation:
            '≥2 SIRS criteria = SIRS. Highly sensitive but not specific; can be triggered by non-infectious causes (trauma, pancreatitis, surgery). SIRS + confirmed infection historically = sepsis (pre-Sepsis-3). Use SOFA/qSOFA for sepsis identification.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'blood_cultures_x2',
        'broad_spectrum_antibiotics',
        'iv_fluid_resuscitation',
        'lactate',
        'source_investigation',
      ],
    },
  },

  // =========================================================================
  // INFECTIOUS DISEASE — MASCC Score
  // =========================================================================
  {
    id: 'mascc',
    name: 'MASCC Score',
    fullName: 'MASCC Score (Multinational Association for Supportive Care in Cancer)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Identifies low-risk febrile neutropenic cancer patients who may be candidates for outpatient management with oral antibiotics. Score ≥21 indicates low risk (~5% serious complication rate). Must be used only in patients with solid tumors or lymphoma; not validated in leukemia without bone marrow suppression.',
    applicableChiefComplaints: [
      'fever',
      'febrile_neutropenia',
      'neutropenic_fever',
      'cancer_fever',
    ],
    keywords: [
      'MASCC',
      'febrile neutropenia',
      'cancer',
      'outpatient',
      'low risk',
      'neutropenia',
      'Multinational Association Supportive Care Cancer',
    ],
    requiredTests: ['ANC', 'blood cultures', 'CXR'],
    components: [
      {
        id: 'burden_symptoms',
        label: 'Burden of febrile neutropenia illness',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No or mild symptoms', value: 5 },
          { label: 'Moderate symptoms', value: 3 },
          { label: 'Severe symptoms or moribund', value: 0 },
        ],
      },
      {
        id: 'hypotension',
        label: 'No hypotension (SBP ≥90 mmHg)',
        type: 'boolean',
        value: 5,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'copd',
        label: 'No COPD (chronic obstructive pulmonary disease)',
        type: 'boolean',
        value: 4,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'solid_tumor_no_fungal',
        label: 'Solid tumor OR no previous fungal infection',
        type: 'boolean',
        value: 4,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'dehydration',
        label: 'No dehydration requiring parenteral fluids',
        type: 'boolean',
        value: 3,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'outpatient_status',
        label: 'Outpatient at time of fever onset',
        type: 'boolean',
        value: 3,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age',
        label: 'Age <60 years',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 20,
          risk: 'High',
          interpretation:
            'Score <21: High risk for serious complications. Inpatient IV antipseudomonal antibiotics required (e.g., piperacillin-tazobactam or cefepime). Blood cultures mandatory.',
        },
        {
          min: 21,
          max: 26,
          risk: 'Low',
          interpretation:
            'Score ≥21: Low risk (~5% serious complication rate). Eligible for outpatient oral antibiotic therapy (ciprofloxacin + amoxicillin-clavulanate) with 24-hour reassessment. Requires reliable follow-up and caregiver support.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'cefepime_iv',
        'piperacillin_tazobactam_iv',
        'blood_cultures_x2',
        'admit_oncology',
        'anc_monitoring',
      ],
      Low: [
        'ciprofloxacin_po',
        'amoxicillin_clavulanate_po',
        'blood_cultures_x2',
        'outpatient_24hr_followup',
        'return_precautions',
      ],
    },
  },

  // =========================================================================
  // INFECTIOUS DISEASE — LRINEC Score
  // =========================================================================
  {
    id: 'lrinec',
    name: 'LRINEC Score',
    fullName: 'LRINEC Score (Laboratory Risk Indicator for Necrotizing Fasciitis)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Distinguishes necrotizing fasciitis (NF) from other soft tissue infections using laboratory values. A low score does NOT exclude NF — clinical suspicion (pain out of proportion, skin discoloration, crepitus) always supersedes the score. PPV 92% for score ≥8. Validated by Wong et al. (2004).',
    applicableChiefComplaints: [
      'soft_tissue_infection',
      'cellulitis',
      'wound_infection',
      'pain_out_of_proportion',
      'necrotizing_fasciitis',
    ],
    keywords: [
      'LRINEC',
      'necrotizing fasciitis',
      'soft tissue infection',
      'CRP',
      'WBC',
      'sodium',
      'creatinine',
      'glucose',
      'necrotizing',
    ],
    requiredTests: ['CRP', 'WBC with differential', 'hemoglobin', 'sodium', 'creatinine', 'glucose'],
    components: [
      // CRP (mg/L)
      {
        id: 'crp',
        label: 'C-Reactive Protein (mg/L)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<150', value: 0 },
          { label: '≥150', value: 4 },
        ],
      },
      // WBC (/mm³)
      {
        id: 'wbc',
        label: 'WBC (/mm³)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<15,000', value: 0 },
          { label: '15,000–25,000', value: 1 },
          { label: '>25,000', value: 2 },
        ],
      },
      // Hemoglobin (g/dL)
      {
        id: 'hemoglobin',
        label: 'Hemoglobin (g/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>13.5', value: 0 },
          { label: '11.0–13.5', value: 1 },
          { label: '<11.0', value: 2 },
        ],
      },
      // Sodium (mEq/L)
      {
        id: 'sodium',
        label: 'Sodium (mEq/L)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥135', value: 0 },
          { label: '<135', value: 2 },
        ],
      },
      // Creatinine (mg/dL)
      {
        id: 'creatinine',
        label: 'Creatinine (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≤1.6', value: 0 },
          { label: '>1.6', value: 2 },
        ],
      },
      // Glucose (mg/dL)
      {
        id: 'glucose',
        label: 'Glucose (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≤180', value: 0 },
          { label: '>180', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 5,
          risk: 'Low',
          interpretation:
            'Score ≤5: Low risk (PPV <50%). Does NOT exclude necrotizing fasciitis — do not delay surgical exploration if clinical suspicion is high (pain out of proportion, skin changes, crepitus, hemodynamic instability).',
        },
        {
          min: 6,
          max: 7,
          risk: 'Intermediate',
          interpretation:
            'Score 6–7: Intermediate risk (~73% PPV). Heightened suspicion warranted; serial exams, consider surgical consult for bedside assessment or operative exploration.',
        },
        {
          min: 8,
          max: 13,
          risk: 'High',
          interpretation:
            'Score ≥8: High risk (~93% PPV). Strong presumption of necrotizing fasciitis. Emergent surgical consult for operative exploration and debridement; broad-spectrum antibiotics immediately.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'emergency_surgery_consult',
        'surgical_exploration_debridement',
        'vancomycin_iv',
        'piperacillin_tazobactam_iv',
        'iv_fluid_resuscitation',
        'blood_cultures_x2',
        'icu_admission',
      ],
      Intermediate: [
        'surgery_consult',
        'vancomycin_iv',
        'piperacillin_tazobactam_iv',
        'serial_wound_exams',
        'blood_cultures_x2',
      ],
      Low: ['antibiotics_cellulitis_protocol', 'serial_wound_exams', 'low_threshold_surgery_consult'],
    },
  },

  // =========================================================================
  // TOXICOLOGY — CIWA-Ar
  // =========================================================================
  {
    id: 'ciwa_ar',
    name: 'CIWA-Ar',
    fullName: 'CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol — Revised)',
    category: 'TOXICOLOGY',
    application:
      'Standardized bedside assessment of alcohol withdrawal severity to guide benzodiazepine dosing. Scored by direct clinical assessment of 10 components. Score ≥10 indicates pharmacotherapy is warranted. Sullivan et al., 1989.',
    applicableChiefComplaints: [
      'alcohol_withdrawal',
      'tremor',
      'agitation',
      'seizure',
      'delirium_tremens',
      'altered_mental_status',
    ],
    keywords: [
      'CIWA-Ar',
      'alcohol withdrawal',
      'delirium tremens',
      'benzodiazepine',
      'AWS',
      'tremor',
      'seizure',
      'hallucinations',
      'DTs',
    ],
    components: [
      // Each component 0–7 except clouding of sensorium (0–4)
      {
        id: 'nausea_vomiting',
        label: 'Nausea / Vomiting',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — No nausea, no vomiting', value: 0 },
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4 — Intermittent nausea with dry heaves', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7 — Constant nausea, frequent dry heaves/vomiting', value: 7 },
        ],
      },
      {
        id: 'tremor',
        label: 'Tremor (arms extended, fingers spread)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — No tremor', value: 0 },
          { label: '1 — Not visible, felt at fingertips', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4 — Moderate, with arms extended', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7 — Severe, even without extended arms', value: 7 },
        ],
      },
      {
        id: 'paroxysmal_sweats',
        label: 'Paroxysmal Sweats',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — No sweat visible', value: 0 },
          { label: '1 — Barely perceptible sweating, palms moist', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4 — Beads of sweat on forehead', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7 — Drenching sweats', value: 7 },
        ],
      },
      {
        id: 'anxiety',
        label: 'Anxiety',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — No anxiety, at ease', value: 0 },
          { label: '1 — Mildly anxious', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4 — Moderately anxious or guarded', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7 — Equivalent to acute panic state', value: 7 },
        ],
      },
      {
        id: 'agitation',
        label: 'Agitation',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — Normal activity', value: 0 },
          { label: '1 — Somewhat more than normal activity', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4 — Moderately fidgety and restless', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7 — Paces back and forth or constantly thrashes', value: 7 },
        ],
      },
      {
        id: 'tactile_disturbances',
        label: 'Tactile Disturbances',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — None', value: 0 },
          { label: '1 — Very mild itching, pins/needles, burning', value: 1 },
          { label: '2 — Mild itching, pins/needles, burning', value: 2 },
          { label: '3 — Moderate itching, pins/needles, burning', value: 3 },
          { label: '4 — Moderately severe tactile hallucinations', value: 4 },
          { label: '5 — Severe tactile hallucinations', value: 5 },
          { label: '6 — Extremely severe tactile hallucinations', value: 6 },
          { label: '7 — Continuous tactile hallucinations', value: 7 },
        ],
      },
      {
        id: 'auditory_disturbances',
        label: 'Auditory Disturbances',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — Not present', value: 0 },
          { label: '1 — Very mild harshness or ability to frighten', value: 1 },
          { label: '2 — Mild harshness or ability to frighten', value: 2 },
          { label: '3 — Moderate harshness or ability to frighten', value: 3 },
          { label: '4 — Moderately severe auditory hallucinations', value: 4 },
          { label: '5 — Severe auditory hallucinations', value: 5 },
          { label: '6 — Extremely severe auditory hallucinations', value: 6 },
          { label: '7 — Continuous auditory hallucinations', value: 7 },
        ],
      },
      {
        id: 'visual_disturbances',
        label: 'Visual Disturbances',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — Not present', value: 0 },
          { label: '1 — Very mild sensitivity', value: 1 },
          { label: '2 — Mild sensitivity', value: 2 },
          { label: '3 — Moderate sensitivity', value: 3 },
          { label: '4 — Moderately severe visual hallucinations', value: 4 },
          { label: '5 — Severe visual hallucinations', value: 5 },
          { label: '6 — Extremely severe visual hallucinations', value: 6 },
          { label: '7 — Continuous visual hallucinations', value: 7 },
        ],
      },
      {
        id: 'headache',
        label: 'Headache / Fullness in Head',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — Not present', value: 0 },
          { label: '1 — Very mild', value: 1 },
          { label: '2 — Mild', value: 2 },
          { label: '3 — Moderate', value: 3 },
          { label: '4 — Moderately severe', value: 4 },
          { label: '5 — Severe', value: 5 },
          { label: '6 — Very severe', value: 6 },
          { label: '7 — Extremely severe', value: 7 },
        ],
      },
      // Clouding of sensorium: 0–4 only
      {
        id: 'clouding_sensorium',
        label: 'Orientation / Clouding of Sensorium',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 — Oriented and can do serial additions', value: 0 },
          { label: '1 — Cannot do serial additions or uncertain about date', value: 1 },
          { label: '2 — Date disorientation by ≤2 days', value: 2 },
          { label: '3 — Date disorientation by >2 days', value: 3 },
          { label: '4 — Disoriented to place and/or person', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 9,
          risk: 'Low',
          interpretation:
            'Score <10: Mild withdrawal. Supportive care; monitor every 1–2 hours. Pharmacotherapy not routinely required; use clinical judgment for high-risk patients (prior seizure/DTs, heavy drinker).',
        },
        {
          min: 10,
          max: 18,
          risk: 'Moderate',
          interpretation:
            'Score 10–18: Moderate withdrawal. Benzodiazepine treatment indicated using symptom-triggered protocol (lorazepam or diazepam). Reassess q1h after each dose.',
        },
        {
          min: 19,
          max: 35,
          risk: 'High',
          interpretation:
            'Score >18: Severe withdrawal. Aggressive benzodiazepine titration required; consider IV diazepam or phenobarbital for refractory cases. Step-down unit or ICU monitoring.',
        },
        {
          min: 36,
          max: 67,
          risk: 'Very High',
          interpretation:
            'Score >35: Very severe — high risk for delirium tremens and seizures. ICU admission recommended. IV benzodiazepines (diazepam or lorazepam drip); consider phenobarbital adjunct. Airway management on standby.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'icu_admission',
        'iv_lorazepam_or_diazepam_drip',
        'phenobarbital_adjunct',
        'thiamine_100mg_iv',
        'folate_iv',
        'magnesium_iv',
        'seizure_precautions',
        'continuous_monitoring',
      ],
      High: [
        'iv_lorazepam_symptom_triggered',
        'iv_diazepam_symptom_triggered',
        'thiamine_100mg_iv',
        'folate_iv',
        'magnesium_iv',
        'seizure_precautions',
        'step_down_monitoring',
      ],
      Moderate: [
        'po_diazepam_or_lorazepam',
        'thiamine_100mg_iv',
        'folate',
        'magnesium_iv',
        'iv_access',
        'ciwa_reassessment_q1h',
      ],
      Low: [
        'thiamine_100mg_iv',
        'oral_thiamine',
        'folate',
        'supportive_care',
        'ciwa_reassessment_q2h',
        'hydration',
      ],
    },
  },

  // =========================================================================
  // TOXICOLOGY — Rumack-Matthew Nomogram
  // =========================================================================
  {
    id: 'rumack_matthew',
    name: 'Rumack-Matthew Nomogram',
    fullName: 'Rumack-Matthew Nomogram',
    category: 'TOXICOLOGY',
    application:
      'Determines need for N-acetylcysteine (NAC) treatment in acute acetaminophen (APAP) overdose based on serum APAP level and hours since ingestion. Only valid for single acute ingestion with a reliably known time. Not applicable to chronic ingestions, unknown time of ingestion, or ingestions <4 hours prior.',
    applicableChiefComplaints: [
      'overdose',
      'acetaminophen_overdose',
      'APAP_overdose',
      'intentional_ingestion',
      'toxic_ingestion',
    ],
    keywords: [
      'Rumack-Matthew',
      'acetaminophen',
      'APAP',
      'NAC',
      'N-acetylcysteine',
      'overdose',
      'nomogram',
      'hepatotoxicity',
      'Tylenol',
    ],
    requiredTests: ['serum acetaminophen level (4-hour post-ingestion minimum)', 'LFTs', 'INR', 'BMP'],
    components: [
      // Time since ingestion
      {
        id: 'hours_since_ingestion',
        label: 'Hours since ingestion (must be ≥4h for valid level)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<4 hours (level not yet interpretable)', value: 0 },
          { label: '4 hours', value: 1 },
          { label: '6 hours', value: 2 },
          { label: '8 hours', value: 3 },
          { label: '10 hours', value: 4 },
          { label: '12 hours', value: 5 },
          { label: '16 hours', value: 6 },
          { label: '20 hours', value: 7 },
          { label: '24 hours', value: 8 },
        ],
      },
      // APAP level relative to Rumack-Matthew treatment line
      {
        id: 'apap_level_vs_treatment_line',
        label: 'Serum APAP level relative to Rumack-Matthew treatment line',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Below treatment line — NAC not indicated (single acute ingestion)', value: 0 },
          {
            label:
              'At or above treatment line (≥150 µg/mL at 4h; ≥75 at 8h; ≥37.5 at 12h; ≥18.75 at 16h) — Start NAC',
            value: 1,
          },
          {
            label: 'Cannot plot — unknown time, chronic ingestion, or extended-release product',
            value: 2,
          },
        ],
      },
      // Risk factors increasing hepatotoxicity risk
      {
        id: 'risk_factors',
        label: 'High-risk features present (chronic EtOH, malnourishment, CYP inducers, fasting)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Low',
          interpretation:
            'APAP level BELOW treatment line on nomogram for known single acute ingestion: NAC not indicated. Continue to monitor LFTs if level was drawn early; reassess if clinical picture changes.',
        },
        {
          min: 1,
          max: 1,
          risk: 'High',
          interpretation:
            'APAP level AT or ABOVE treatment line: Start NAC immediately. IV NAC (21-hour protocol): 150 mg/kg over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h. Oral NAC also effective. Treatment threshold: 150 µg/mL at 4h, 75 µg/mL at 8h, 37.5 µg/mL at 12h, 18.75 µg/mL at 16h.',
        },
        {
          min: 2,
          max: 3,
          risk: 'Indeterminate',
          interpretation:
            'Unknown time of ingestion, extended-release product, chronic ingestion, or high-risk features: Empirically treat with NAC pending clinical and laboratory evaluation. Consult Poison Control (1-800-222-1222).',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'nac_iv_21hr_protocol',
        'nac_oral_72hr_if_iv_unavailable',
        'poison_control_consult',
        'serial_lfts_inr',
        'admission_hepatology_if_elevated_ast',
        'iv_fluid_support',
      ],
      Indeterminate: [
        'nac_empiric_iv',
        'poison_control_consult',
        'serial_apap_levels',
        'serial_lfts_inr',
        'admission',
      ],
      Low: ['serial_lfts_if_symptomatic', 'discharge_with_return_precautions', 'psychiatry_consult_if_intentional'],
    },
  },

  // =========================================================================
  // ENDOCRINE — Burch-Wartofsky Point Scale (BWPS)
  // =========================================================================
  {
    id: 'bwps',
    name: 'Burch-Wartofsky Scale',
    fullName: 'Burch-Wartofsky Point Scale (BWPS)',
    category: 'ENDOCRINE',
    application:
      'Differentiates thyroid storm from uncomplicated thyrotoxicosis. Score ≥45 is highly suggestive of thyroid storm and warrants aggressive multi-drug treatment. Score 25–44 = impending storm. No prospective validation exists; use in conjunction with clinical judgment. Burch & Wartofsky, 1993.',
    applicableChiefComplaints: [
      'thyroid_storm',
      'hyperthyroidism',
      'fever',
      'altered_mental_status',
      'tachycardia',
      'heart_failure',
    ],
    keywords: [
      'Burch-Wartofsky',
      'BWPS',
      'thyroid storm',
      'thyrotoxicosis',
      'hyperthyroidism',
      'atrial fibrillation',
      'fever',
      'thyroid crisis',
    ],
    requiredTests: ['TSH', 'free T4', 'free T3', 'LFTs', 'CBC', 'BMP'],
    components: [
      // Thermoregulatory dysfunction (temperature)
      {
        id: 'temperature',
        label: 'Temperature',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '37.2–37.7°C (99–99.9°F)', value: 5 },
          { label: '37.8–38.2°C (100–100.9°F)', value: 10 },
          { label: '38.3–38.8°C (101–101.9°F)', value: 15 },
          { label: '38.9–39.4°C (102–102.9°F)', value: 20 },
          { label: '39.5–39.9°C (103–103.9°F)', value: 25 },
          { label: '≥40°C (≥104°F)', value: 30 },
        ],
      },
      // Central nervous system effects
      {
        id: 'cns_effects',
        label: 'CNS Effects',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild agitation', value: 10 },
          { label: 'Delirium, psychosis, extreme lethargy', value: 20 },
          { label: 'Seizure or coma', value: 30 },
        ],
      },
      // GI/hepatic dysfunction
      {
        id: 'gi_hepatic',
        label: 'GI / Hepatic Dysfunction',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Moderate (diarrhea, nausea/vomiting, abdominal pain)', value: 10 },
          { label: 'Severe (jaundice)', value: 20 },
        ],
      },
      // Cardiovascular dysfunction — heart rate
      {
        id: 'heart_rate',
        label: 'Heart Rate (bpm)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<90', value: 0 },
          { label: '90–109', value: 5 },
          { label: '110–119', value: 10 },
          { label: '120–129', value: 15 },
          { label: '130–139', value: 20 },
          { label: '≥140', value: 25 },
        ],
      },
      // Congestive heart failure
      {
        id: 'chf',
        label: 'Congestive Heart Failure',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild (pedal edema)', value: 5 },
          { label: 'Moderate (bibasilar rales)', value: 10 },
          { label: 'Severe (pulmonary edema)', value: 15 },
        ],
      },
      // Atrial fibrillation
      {
        id: 'afib',
        label: 'Atrial Fibrillation',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 10 },
        ],
      },
      // Precipitating event
      {
        id: 'precipitant',
        label: 'Precipitating Event',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None identified', value: 0 },
          { label: 'Precipitant present (infection, surgery, trauma, iodine load, medication noncompliance)', value: 10 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 24,
          risk: 'Low',
          interpretation:
            'Score <25: Thyroid storm unlikely. Manage underlying hyperthyroidism; treat precipitant if present.',
        },
        {
          min: 25,
          max: 44,
          risk: 'Intermediate',
          interpretation:
            'Score 25–44: Impending thyroid storm. Consider empiric treatment while confirming diagnosis; treat precipitant aggressively.',
        },
        {
          min: 45,
          max: 140,
          risk: 'High',
          interpretation:
            'Score ≥45: Thyroid storm highly likely. Treat aggressively with multi-drug regimen: propylthiouracil (PTU) FIRST → iodine (1 hour later) → beta-blocker → corticosteroids → treat precipitant. ICU admission.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'propylthiouracil_600mg_loading',
        'potassium_iodide_1hr_after_ptu',
        'propranolol_iv',
        'dexamethasone_iv',
        'icu_admission',
        'treat_precipitant',
        'endocrinology_consult',
        'acetaminophen_for_fever',
        'cooling_blanket',
      ],
      Intermediate: [
        'methimazole_po',
        'propranolol_po',
        'endocrinology_consult',
        'treat_precipitant',
        'admission',
      ],
      Low: ['thyroid_function_tests', 'outpatient_endocrinology_referral', 'treat_precipitant'],
    },
  },

  // =========================================================================
  // ENDOCRINE — ADA DKA Severity Criteria
  // =========================================================================
  {
    id: 'ada_dka_severity',
    name: 'ADA DKA Severity',
    fullName: 'ADA DKA Severity Criteria',
    category: 'ENDOCRINE',
    application:
      'Classifies diabetic ketoacidosis (DKA) severity as mild, moderate, or severe to guide management intensity and disposition. Based on ADA Standards of Medical Care in Diabetes (annually updated). Euglycemic DKA may occur with SGLT2 inhibitors at glucose <250 mg/dL.',
    applicableChiefComplaints: [
      'DKA',
      'diabetic_ketoacidosis',
      'hyperglycemia',
      'nausea_vomiting',
      'altered_mental_status',
      'abdominal_pain',
    ],
    keywords: [
      'DKA',
      'diabetic ketoacidosis',
      'ADA',
      'severity',
      'pH',
      'bicarbonate',
      'anion gap',
      'insulin',
      'glucose',
      'SGLT2',
    ],
    requiredTests: [
      'arterial blood gas (pH)',
      'serum bicarbonate',
      'blood glucose',
      'anion gap',
      'serum/urine ketones',
      'BMP (sodium, potassium, creatinine)',
      'CBC',
      'urinalysis',
      'phosphate',
    ],
    components: [
      // Arterial pH
      {
        id: 'arterial_ph',
        label: 'Arterial pH',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '7.25–7.30 (Mild)', value: 1 },
          { label: '7.00–7.24 (Moderate)', value: 2 },
          { label: '<7.00 (Severe)', value: 3 },
        ],
      },
      // Serum bicarbonate (mEq/L)
      {
        id: 'bicarbonate',
        label: 'Serum Bicarbonate (mEq/L)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '15–18 mEq/L (Mild)', value: 1 },
          { label: '10–14.9 mEq/L (Moderate)', value: 2 },
          { label: '<10 mEq/L (Severe)', value: 3 },
        ],
      },
      // Mental status
      {
        id: 'mental_status',
        label: 'Mental Status',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Alert (Mild)', value: 1 },
          { label: 'Alert/drowsy (Moderate)', value: 2 },
          { label: 'Stupor / Coma (Severe)', value: 3 },
        ],
      },
      // Urine/serum ketones
      {
        id: 'ketones',
        label: 'Urine Ketones / Serum Ketones',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Positive (present in all severities)', value: 0 },
          { label: 'Strongly positive', value: 0 },
        ],
      },
      // Blood glucose
      {
        id: 'glucose',
        label: 'Blood Glucose (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>250 (typical DKA; SGLT2i euglycemic DKA may be lower)', value: 0 },
          { label: '≤250 (euglycemic DKA — consider SGLT2 inhibitor use)', value: 0 },
        ],
      },
      // Anion gap
      {
        id: 'anion_gap',
        label: 'Anion Gap >10 mEq/L',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation:
            'Mild DKA: pH 7.25–7.30, bicarb 15–18 mEq/L, alert. Anion gap >10, glucose >250, ketones positive. IV fluids (0.9% NaCl), SC or IV insulin, potassium replacement (keep K >3.5 before insulin). May be treated in ED/observation with close follow-up.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'Moderate DKA: pH 7.00–7.24, bicarb 10–14.9 mEq/L, alert or drowsy. IV fluids, continuous IV insulin infusion, potassium repletion. Admission required; step-down or telemetry acceptable if no hemodynamic instability.',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            'Severe DKA: pH <7.00, bicarb <10 mEq/L, stupor or coma. Aggressive IV fluid resuscitation, continuous IV insulin infusion, aggressive potassium/phosphate repletion. ICU admission required. Consider sodium bicarbonate if pH <6.9.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'iv_ns_bolus_1l_hr1',
        'continuous_iv_insulin_0_1unit_kg_hr',
        'potassium_repletion_aggressive',
        'phosphate_repletion',
        'sodium_bicarbonate_if_ph_less_6_9',
        'q1h_bmp_monitoring',
        'icu_admission',
        'foley_catheter',
        'treat_precipitant',
      ],
      Moderate: [
        'iv_ns_resuscitation',
        'continuous_iv_insulin',
        'potassium_repletion',
        'q2h_bmp_monitoring',
        'admission_telemetry',
        'treat_precipitant',
        'diabetes_education',
      ],
      Low: [
        'iv_ns_resuscitation',
        'iv_or_sc_insulin',
        'potassium_repletion',
        'q2_4h_bmp_monitoring',
        'observation_or_admission',
        'treat_precipitant',
        'diabetes_education',
      ],
    },
  },

  // =========================================================================
  // HEMATOLOGY / COAGULATION — 4Ts Score
  // =========================================================================
  {
    id: 'four_ts',
    name: '4Ts Score',
    fullName: '4Ts Score (Heparin-Induced Thrombocytopenia)',
    category: 'HEMATOLOGY / COAGULATION',
    application:
      'Estimates pre-test probability of heparin-induced thrombocytopenia (HIT). Score 6–8 carries ~64% HIT probability and warrants immediate heparin cessation and alternative anticoagulation. Score 0–3 has NPV >99% for HIT. Lo et al. (2006), validated by Cuker et al. (2010).',
    applicableChiefComplaints: [
      'thrombocytopenia',
      'HIT',
      'heparin_induced_thrombocytopenia',
      'thrombosis',
      'skin_necrosis',
    ],
    keywords: [
      '4Ts',
      'HIT',
      'heparin-induced thrombocytopenia',
      'platelets',
      'thrombocytopenia',
      'PF4',
      'anticoagulation',
      'thrombosis',
    ],
    requiredTests: ['serial platelet counts', 'PF4/H-PF4 antibody immunoassay', 'serotonin release assay (SRA) if indicated'],
    components: [
      // Thrombocytopenia: magnitude of platelet fall
      {
        id: 'thrombocytopenia',
        label: 'Thrombocytopenia: Platelet Count Fall',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<30% fall or nadir <10,000/µL (Low suspicion)', value: 0 },
          { label: '30–50% fall or nadir 10,000–19,000/µL (Intermediate)', value: 1 },
          { label: '>50% fall AND nadir ≥20,000/µL (High suspicion)', value: 2 },
        ],
      },
      // Timing of platelet fall
      {
        id: 'timing',
        label: 'Timing of Platelet Fall',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<4 days without recent heparin, or onset >14 days (Low)', value: 0 },
          { label: 'Consistent with days 5–10, but unclear; or ≤1 day with prior heparin 31–100 days ago (Intermediate)', value: 1 },
          { label: 'Clear onset days 5–10, or ≤1 day with heparin within 30 days (High)', value: 2 },
        ],
      },
      // Thrombosis or other sequelae
      {
        id: 'thrombosis',
        label: 'Thrombosis / Other Sequelae',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None (Low)', value: 0 },
          { label: 'Progressive or recurrent thrombosis; erythematous skin lesions at injection site (Intermediate)', value: 1 },
          { label: 'New thrombosis confirmed; skin necrosis; anaphylactoid reaction after IV heparin bolus (High)', value: 2 },
        ],
      },
      // Other causes of thrombocytopenia
      {
        id: 'other_causes',
        label: 'Other Causes of Thrombocytopenia',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Definite other cause present (Low)', value: 0 },
          { label: 'Possible other cause (Intermediate)', value: 1 },
          { label: 'No other cause evident (High)', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'Low',
          interpretation:
            'Score 0–3: Low probability (~5% HIT). NPV >99%. Consider other causes of thrombocytopenia (sepsis, medications, TTP/HUS). PF4 antibody testing generally unnecessary; continue heparin if clinically indicated.',
        },
        {
          min: 4,
          max: 5,
          risk: 'Intermediate',
          interpretation:
            'Score 4–5: Intermediate probability (~14% HIT). Send PF4/H-PF4 immunoassay. Consider switching to alternative anticoagulation (argatroban, bivalirudin, fondaparinux) pending results. Avoid warfarin until platelet count >150,000.',
        },
        {
          min: 6,
          max: 8,
          risk: 'High',
          interpretation:
            'Score 6–8: High probability (~64% HIT). Immediately stop ALL heparin (including flushes, LMWH, heparin-coated catheters). Start alternative non-heparin anticoagulation (argatroban or bivalirudin). Send PF4 immunoassay and SRA. Hematology consult. Do NOT give warfarin until platelet count recovers (risk of venous limb gangrene).',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'stop_all_heparin_immediately',
        'argatroban_infusion',
        'bivalirudin_alternative',
        'pf4_immunoassay',
        'serotonin_release_assay',
        'hematology_consult',
        'avoid_warfarin_until_platelet_recovery',
        'platelet_count_monitoring',
      ],
      Intermediate: [
        'pf4_immunoassay',
        'consider_heparin_alternative',
        'argatroban_if_high_suspicion',
        'hematology_consult',
        'platelet_count_monitoring',
      ],
      Low: ['continue_heparin_if_indicated', 'evaluate_alternative_causes_thrombocytopenia'],
    },
  },

  // =========================================================================
  // NEPHROLOGY & ELECTROLYTES — Anion Gap
  // =========================================================================
  {
    id: 'anion_gap',
    name: 'Anion Gap',
    fullName: 'Anion Gap Calculation',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Essential calculation for evaluating metabolic acidosis. Identifies unmeasured anions suggesting specific etiologies (DKA, lactic acidosis, toxic ingestions). Correct for hypoalbuminemia: AG_corrected = AG_measured + 2.5 × (4.0 − albumin). Delta-delta ratio helps identify concurrent non-AG metabolic acidosis or alkalosis.',
    applicableChiefComplaints: [
      'metabolic_acidosis',
      'altered_mental_status',
      'toxic_ingestion',
      'dka',
      'sepsis',
    ],
    keywords: [
      'anion gap',
      'AGMA',
      'metabolic acidosis',
      'MUDPILES',
      'delta-delta',
      'corrected anion gap',
      'hypoalbuminemia',
      'lactic acidosis',
      'DKA',
    ],
    requiredTests: [
      'serum sodium',
      'serum chloride',
      'serum bicarbonate',
      'albumin',
      'lactate',
      'ABG (pH)',
    ],
    components: [
      // Anion Gap value — this is calculated, not a scored component
      {
        id: 'anion_gap_value',
        label: 'Calculated Anion Gap: Na⁺ − (Cl⁻ + HCO₃⁻) (mEq/L)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≤12 mEq/L — Normal AG', value: 0 },
          { label: '13–19 mEq/L — Mildly elevated', value: 1 },
          { label: '20–29 mEq/L — Moderately elevated', value: 2 },
          { label: '≥30 mEq/L — Severely elevated', value: 3 },
        ],
      },
      // Albumin correction
      {
        id: 'albumin_correction',
        label: 'Albumin level (needed for correction)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Albumin ≥4.0 g/dL — no correction needed', value: 0 },
          { label: 'Albumin 3.0–3.9 g/dL — add ~2.5 mEq/L to measured AG', value: 0 },
          { label: 'Albumin 2.0–2.9 g/dL — add ~5 mEq/L to measured AG', value: 0 },
          { label: 'Albumin <2.0 g/dL — add ~5–7.5 mEq/L to measured AG', value: 0 },
        ],
      },
      // Concurrent etiology identification
      {
        id: 'agma_etiology',
        label: 'Suspected AGMA Etiology (MUDPILES)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Not applicable / Normal AG', value: 0 },
          { label: 'Methanol ingestion', value: 1 },
          { label: 'Uremia', value: 1 },
          { label: 'Diabetic ketoacidosis (DKA)', value: 1 },
          { label: 'Propylene glycol toxicity', value: 1 },
          { label: 'Isoniazid / Iron toxicity', value: 1 },
          { label: 'Lactic acidosis (type A: ischemia; type B: drugs/toxins)', value: 1 },
          { label: 'Ethylene glycol ingestion', value: 1 },
          { label: 'Salicylate toxicity', value: 1 },
        ],
      },
      // Delta-delta ratio
      {
        id: 'delta_delta',
        label: 'Delta-Delta Ratio: (AG − 12) / (24 − HCO₃)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<0.4 — Concurrent hyperchloremic (non-AG) acidosis', value: 0 },
          { label: '0.4–1.0 — Mixed AGMA + non-AG acidosis', value: 0 },
          { label: '1.0–2.0 — Pure AGMA (expected)', value: 0 },
          { label: '>2.0 — Concurrent metabolic alkalosis or pre-existing compensated respiratory acidosis', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Normal',
          interpretation:
            'Anion Gap ≤12 mEq/L (corrected for albumin): Normal AG. If acidemic, evaluate for non-anion gap metabolic acidosis (HARDUP mnemonic: Hyperalimentation, Addison\'s disease, Renal tubular acidosis, Diarrhea, Ureteral diversion, Pancreatic fistula).',
        },
        {
          min: 1,
          max: 1,
          risk: 'Mildly Elevated',
          interpretation:
            'AG 13–19 mEq/L (albumin-corrected): Mildly elevated. AGMA etiology workup warranted. Check lactate, beta-hydroxybutyrate, renal function, and toxic screen. Mild lactic acidosis and DKA are common causes.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Elevated',
          interpretation:
            'AG 20–29 mEq/L (albumin-corrected): Moderately elevated AGMA. High concern for significant DKA, lactic acidosis, toxic alcohol, or uremia. Evaluate osmolar gap (toxic alcohol), lactate, BHB, renal function. Calculate delta-delta to look for mixed acid-base disorder.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Severely Elevated',
          interpretation:
            'AG ≥30 mEq/L (albumin-corrected): Severely elevated. Suggests florid AGMA — urgent evaluation for toxic alcohol (methanol, ethylene glycol), severe lactic acidosis (type A ischemic or type B), severe DKA, or salicylate toxicity. Calculate osmolar gap; contact Poison Control if toxic ingestion suspected.',
        },
      ],
    },
    suggestedTreatments: {
      'Severely Elevated': [
        'iv_fluid_resuscitation',
        'lactate_level',
        'abg',
        'osmolar_gap_calculation',
        'toxic_screen',
        'serum_ketones_bhb',
        'poison_control_consult',
        'nephrology_consult',
        'treat_underlying_cause',
      ],
      Elevated: [
        'lactate_level',
        'abg',
        'serum_ketones_bhb',
        'renal_function_panel',
        'treat_underlying_cause',
      ],
      'Mildly Elevated': [
        'lactate_level',
        'serum_ketones',
        'renal_function_panel',
        'treat_underlying_cause',
      ],
      Normal: ['evaluate_non_ag_acidosis_causes', 'abg_if_acidemic'],
    },
  },
]
