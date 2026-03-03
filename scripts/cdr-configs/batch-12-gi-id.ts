import type { CdrSeed } from './types'

/**
 * Batch 12 — Gastrointestinal / Genitourinary + Infectious Disease CDRs
 *
 * Covers: Ranson's Criteria, Revised Atlanta Classification, Charcot's Triad / Reynolds' Pentad,
 *         STONE Score, TWIST Score, Philadelphia Criteria, Boston Criteria (Febrile Infant),
 *         Lab-Score, AAP 2021 Febrile Infant Guidelines, CISNE Score
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - Ranson's Criteria: Ranson et al., Surg Gynecol Obstet 1974; Ranson, Ann Surg 1982
 *  - Revised Atlanta Classification: Banks et al., Gut 2013
 *  - Charcot's Triad / Reynolds' Pentad: Charcot 1877; Reynolds & Dargan, Ann Surg 1959
 *  - STONE Score: Moore et al., Ann Emerg Med 2014
 *  - TWIST Score: Barbosa et al., J Urol 2013
 *  - Philadelphia Criteria: Baker et al., Pediatrics 1993
 *  - Boston Criteria: Baskin et al., J Pediatr 1992
 *  - Lab-Score: Galetto-Lacour et al., Pediatrics 2003; Galetto-Lacour et al., Arch Dis Child 2008
 *  - AAP 2021 Febrile Infant: Pantell et al., Pediatrics 2021 (AAP Clinical Practice Guideline)
 *  - CISNE Score: Carmona-Bayonas et al., J Clin Oncol 2015
 */

export const batch12GiIdCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Revised Atlanta Classification
  // Select-based classification: mild / moderately severe / severe
  // ---------------------------------------------------------------------------
  {
    id: 'atlanta_pancreatitis',
    name: 'Atlanta Classification',
    fullName: 'Atlanta Classification (Revised 2012)',
    category: 'GASTROINTESTINAL',
    application:
      'Classifies severity of acute pancreatitis into mild, moderately severe, and severe categories based on organ failure and local complications.',
    applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
    keywords: [
      'Atlanta classification',
      'pancreatitis',
      'organ failure',
      'pancreatic necrosis',
      'pseudocyst',
      'severity',
      'Marshall score',
    ],
    components: [
      // Cardiovascular organ failure — based on systolic BP (Modified Marshall cardiovascular component)
      {
        id: 'organ_failure_cardiovascular',
        label: 'Cardiovascular Organ Failure (Modified Marshall — Systolic BP)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'SBP >90 mmHg (no cardiovascular failure)', value: 0 },
          { label: 'SBP <90 mmHg, fluid responsive', value: 1 },
          { label: 'SBP <90 mmHg, not fluid responsive (Marshall ≥2)', value: 2 },
        ],
      },
      // Respiratory/renal organ failure — lab-based (PaO2/FiO2 ratio or creatinine)
      {
        id: 'organ_failure_respiratory_renal',
        label: 'Respiratory/Renal Organ Failure (PaO₂/FiO₂ or Creatinine — Modified Marshall ≥2)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No respiratory or renal organ failure', value: 0 },
          { label: 'Respiratory failure (PaO₂/FiO₂ ≤300) OR Renal failure (Creatinine ≥1.9 mg/dL)', value: 1 },
        ],
      },
      // Duration of organ failure — clinical judgment
      {
        id: 'organ_failure_duration',
        label: 'Duration of Organ Failure (if any organ failure present)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'No organ failure present', value: 0 },
          { label: 'Transient organ failure (resolves within 48 hours)', value: 1 },
          { label: 'Persistent organ failure (>48 hours)', value: 2 },
        ],
      },
      {
        id: 'local_complications',
        label: 'Local Complications (imaging)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No local complications', value: 0 },
          {
            label:
              'Local complications present (acute peripancreatic fluid collection, pancreatic pseudocyst, acute necrotic collection, or walled-off necrosis)',
            value: 1,
          },
        ],
      },
      {
        id: 'systemic_complications',
        label: 'Exacerbation of Pre-existing Comorbidity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No exacerbation of comorbidities', value: 0 },
          { label: 'Exacerbation of pre-existing disease (e.g., COPD, CHF, CAD)', value: 1 },
        ],
      },
    ],
    scoring: {
      // Classification logic: Severe if persistent organ failure; moderately severe if transient
      // organ failure OR local/systemic complications; mild if none of the above
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Mild',
          interpretation:
            'No organ failure AND no local/systemic complications. Usually self-limiting; resolves in 1–2 weeks.',
        },
        {
          min: 1,
          max: 3,
          risk: 'Moderately Severe',
          interpretation:
            'Transient organ failure (<48 hours) AND/OR local complications (peripancreatic fluid, necrosis, pseudocyst, walled-off necrosis) AND/OR exacerbation of comorbidities.',
        },
        {
          min: 4,
          max: 7,
          risk: 'Severe',
          interpretation:
            'Persistent organ failure (>48 hours) — defined by modified Marshall score ≥2 in any organ system. Mortality 36–50%.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'icu_admission',
        'aggressive_iv_fluid_resuscitation',
        'organ_support',
        'surgery_consult',
        'interventional_radiology_consult',
      ],
      'Moderately Severe': [
        'admit_monitored_bed',
        'iv_fluid_resuscitation',
        'serial_imaging',
        'gi_consult',
      ],
      Mild: ['iv_fluids', 'pain_management', 'advance_diet_as_tolerated'],
    },
  },

  // ---------------------------------------------------------------------------
  // Charcot's Triad / Reynolds' Pentad
  // Threshold-based: 3/5 = Charcot's Triad, 5/5 = Reynolds' Pentad
  // ---------------------------------------------------------------------------
  {
    id: 'charcot_reynolds',
    name: "Charcot's Triad / Reynolds' Pentad",
    fullName: "Charcot's Triad / Reynolds' Pentad",
    category: 'GASTROINTESTINAL',
    application:
      'Clinical diagnosis of ascending cholangitis using the presence of characteristic symptom clusters.',
    applicableChiefComplaints: ['right_upper_quadrant_pain', 'jaundice', 'fever', 'abdominal_pain'],
    keywords: [
      "Charcot's triad",
      "Reynolds' pentad",
      'cholangitis',
      'ascending cholangitis',
      'jaundice',
      'fever',
      'RUQ pain',
      'ERCP',
      'biliary',
    ],
    components: [
      {
        id: 'ruq_pain',
        label: 'Right upper quadrant pain',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'fever',
        label: 'Fever / chills / rigors',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'jaundice',
        label: 'Jaundice (icterus or elevated bilirubin)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'altered_mental_status',
        label: 'Altered mental status / confusion (Reynolds)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hypotension',
        label: 'Hypotension / shock (Reynolds)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Low Suspicion',
          interpretation:
            'Absence of triad does NOT exclude cholangitis; consider alternative diagnosis',
        },
        {
          min: 3,
          max: 3,
          risk: "Charcot's Triad",
          interpretation:
            'RUQ pain + fever + jaundice: high suspicion for cholangitis; initiate antibiotics and biliary imaging',
        },
        {
          min: 4,
          max: 5,
          risk: "Reynolds' Pentad",
          interpretation:
            "Charcot's Triad + mental status changes + hypotension: toxic/suppurative cholangitis; emergent biliary decompression (ERCP) required",
        },
      ],
    },
    suggestedTreatments: {
      "Reynolds' Pentad": [
        'emergent_ercp',
        'broad_spectrum_antibiotics',
        'aggressive_iv_fluid_resuscitation',
        'vasopressors_if_needed',
        'icu_admission',
      ],
      "Charcot's Triad": [
        'iv_antibiotics',
        'biliary_imaging',
        'gi_consult_for_ercp',
        'iv_fluid_resuscitation',
        'admit',
      ],
      'Low Suspicion': ['biliary_imaging', 'monitor', 'consider_alternative_diagnosis'],
    },
  },

  // ---------------------------------------------------------------------------
  // STONE Score
  // Sum-based: Sex + Timing + Origin + Nausea + Erythrocytes
  // Range: 5–13 (no component scores 0 for Sex minimum is 2)
  // ---------------------------------------------------------------------------
  {
    id: 'stone_score',
    name: 'STONE Score',
    fullName: 'STONE Score',
    category: 'GENITOURINARY',
    application:
      'Predicts likelihood of ureteral stone in patients presenting with flank pain suspicious for renal colic.',
    applicableChiefComplaints: ['flank_pain', 'renal_colic', 'hematuria', 'abdominal_pain'],
    keywords: [
      'STONE score',
      'ureteral stone',
      'kidney stone',
      'nephrolithiasis',
      'renal colic',
      'flank pain',
      'hematuria',
      'CT',
    ],
    requiredTests: ['urinalysis'],
    components: [
      {
        id: 'sex',
        label: 'Sex',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female', value: 2 },
          { label: 'Male', value: 3 },
        ],
      },
      {
        id: 'timing',
        label: 'Timing — Duration of Pain',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '>24 hours', value: 1 },
          { label: '6–24 hours', value: 2 },
          { label: '<6 hours', value: 3 },
        ],
      },
      {
        id: 'origin',
        label: 'Origin — Race/Ethnicity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Black', value: 1 },
          { label: 'Non-Black', value: 3 },
        ],
      },
      {
        id: 'nausea',
        label: 'Nausea / Vomiting',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Nausea alone', value: 1 },
          { label: 'Vomiting', value: 2 },
        ],
      },
      {
        id: 'erythrocytes',
        label: 'Erythrocytes (RBCs on urinalysis)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'None', value: 0 },
          { label: 'Present (any RBCs on UA)', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 4,
          max: 7,
          risk: 'Low',
          interpretation:
            '~9% probability of ureteral stone; consider alternative diagnoses; imaging may still be warranted',
        },
        {
          min: 8,
          max: 9,
          risk: 'Moderate',
          interpretation: '~52% probability of ureteral stone',
        },
        {
          min: 10,
          max: 13,
          risk: 'High',
          interpretation:
            '~89% probability of ureteral stone; may influence imaging choice for known stone-formers',
        },
      ],
    },
    suggestedTreatments: {
      High: ['pain_management', 'ct_kub_if_not_done', 'urology_follow_up', 'hydration', 'tamsulosin_if_small_stone'],
      Moderate: ['ct_kub', 'pain_management', 'hydration', 'urology_follow_up'],
      Low: ['consider_alternative_diagnosis', 'ct_kub_if_clinically_indicated', 'pain_management'],
    },
  },

  // ---------------------------------------------------------------------------
  // TWIST Score
  // Sum-based: 5 clinical exam findings, weighted differently
  // Range: 0–7
  // ---------------------------------------------------------------------------
  {
    id: 'twist_score',
    name: 'TWIST Score',
    fullName: 'TWIST Score (Testicular Workup for Ischemia and Suspected Torsion)',
    category: 'GENITOURINARY',
    application:
      'Risk stratification for testicular torsion in males presenting with acute scrotal pain.',
    applicableChiefComplaints: ['scrotal_pain', 'testicular_pain', 'testicular_torsion'],
    keywords: [
      'TWIST',
      'testicular torsion',
      'scrotal pain',
      'cremasteric reflex',
      'high-riding testicle',
      'torsion',
      'urologic emergency',
    ],
    components: [
      {
        id: 'testicular_swelling',
        label: 'Testicular swelling',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hard_testicle',
        label: 'Hard / firm testicle on palpation',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'absent_cremasteric_reflex',
        label: 'Absent cremasteric reflex',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'nausea_vomiting',
        label: 'Nausea and/or vomiting',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'high_riding_testicle',
        label: 'High-riding testicle',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Low',
          interpretation: 'Torsion unlikely; ultrasound if clinically concerned',
        },
        {
          min: 3,
          max: 4,
          risk: 'Intermediate',
          interpretation: 'Urgent ultrasound with Doppler required',
        },
        {
          min: 5,
          max: 7,
          risk: 'High',
          interpretation:
            'Immediate surgical exploration required — do not delay for ultrasound',
        },
      ],
    },
    suggestedTreatments: {
      High: ['emergent_urology_consult', 'immediate_surgical_exploration', 'pain_management'],
      Intermediate: ['urgent_scrotal_ultrasound_with_doppler', 'urology_consult', 'pain_management'],
      Low: ['scrotal_ultrasound_if_clinically_concerned', 'pain_management', 'reassess'],
    },
  },

  // ---------------------------------------------------------------------------
  // Philadelphia Criteria
  // Threshold-based: ALL 9 criteria must be met for low-risk classification
  // ---------------------------------------------------------------------------
  {
    id: 'philadelphia_criteria',
    name: 'Philadelphia Criteria',
    fullName: 'Philadelphia Criteria',
    category: 'INFECTIOUS DISEASE',
    application:
      'Risk stratification for febrile infants 29–60 days old. All criteria must be met for low-risk classification; NPV >98%.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever', 'irritability'],
    keywords: [
      'Philadelphia criteria',
      'febrile infant',
      'serious bacterial infection',
      'SBI',
      '29-60 days',
      'CSF',
      'low risk',
    ],
    requiredTests: ['WBC', 'bands', 'urinalysis', 'CSF WBC', 'CSF gram stain', 'CXR'],
    components: [
      {
        id: 'well_appearing',
        label: 'Infant is well-appearing (non-toxic, alert)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age_29_60_days',
        label: 'Age 29–60 days',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_focal_infection',
        label: 'No obvious source of infection on exam (except otitis media)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'wbc_normal',
        label: 'WBC <15,000/µL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'band_to_neutrophil_ratio',
        label: 'Band-to-neutrophil ratio <0.2',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ua_normal',
        label: 'Urinalysis: <10 WBC/hpf, negative gram stain',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_wbc_normal',
        label: 'CSF: <8 WBC/mm³',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_gram_stain_negative',
        label: 'CSF gram stain negative',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'cxr_no_infiltrate',
        label: 'Chest X-ray: no infiltrate (if obtained)',
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
          min: 9,
          max: 9,
          risk: 'Low',
          interpretation:
            'ALL criteria met → Low risk; NPV >98%; may consider outpatient management with close follow-up in 24 hours',
        },
        {
          min: 0,
          max: 8,
          risk: 'High',
          interpretation:
            'ANY criterion not met → Not low risk; admit and treat empirically with IV antibiotics pending cultures',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'admit',
        'empiric_iv_antibiotics',
        'blood_culture',
        'urine_culture',
        'csf_culture',
        'close_monitoring',
      ],
      Low: [
        'consider_outpatient_management',
        'close_follow_up_24h',
        'return_precautions',
        'cultures_pending',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Boston Criteria (Febrile Infant)
  // Threshold-based: ALL 6 criteria must be met for low-risk
  // ---------------------------------------------------------------------------
  {
    id: 'boston_criteria_febrile_infant',
    name: 'Boston Criteria',
    fullName: 'Boston Criteria (Febrile Infant)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Risk stratification for febrile infants 28–89 days old. NPV 94.6% for SBI when all low-risk criteria are met.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: [
      'Boston criteria',
      'febrile infant',
      'serious bacterial infection',
      'SBI',
      '28-89 days',
      'ceftriaxone',
      'low risk',
    ],
    requiredTests: ['WBC', 'CSF WBC', 'urinalysis', 'CXR'],
    components: [
      {
        id: 'age_28_89_days',
        label: 'Age 28–89 days (inclusion criterion per Baskin et al.)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'well_appearing',
        label: 'Infant appears well (non-toxic)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_focal_infection',
        label: 'No focal bacterial infection on exam (except otitis media)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'wbc_normal',
        label: 'Peripheral WBC 5,000–20,000/µL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_wbc_normal',
        label: 'CSF: <10 WBC/mm³',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ua_normal',
        label: 'Urinalysis: ≤10 WBC/hpf (spun), negative gram stain',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'cxr_no_infiltrate',
        label: 'Chest X-ray: no infiltrate (if obtained)',
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
          min: 7,
          max: 7,
          risk: 'Low',
          interpretation:
            'ALL criteria met → Low risk; NPV 94.6% for SBI; may consider outpatient management with ceftriaxone and 24-hour follow-up',
        },
        {
          min: 0,
          max: 6,
          risk: 'High',
          interpretation:
            'ANY criterion not met → Not low risk; further workup required; admit for empiric antibiotics',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'admit',
        'empiric_iv_antibiotics',
        'blood_culture',
        'urine_culture',
        'csf_culture',
      ],
      Low: [
        'im_ceftriaxone_50mg_kg',
        'outpatient_management',
        'mandatory_24h_follow_up',
        'return_precautions',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // AAP 2021 Febrile Infant Guidelines
  // Algorithm-based: age-stratified approach (8–21d, 22–28d, 29–60d) +
  // inflammatory markers
  // ---------------------------------------------------------------------------
  {
    id: 'aap_2021_febrile_infant',
    name: 'AAP 2021 Febrile Infant',
    fullName: 'AAP 2021 Febrile Infant Guidelines',
    category: 'INFECTIOUS DISEASE',
    application:
      'Age-stratified management of febrile (≥38.0°C) well-appearing infants 8–60 days old. Stratifies by age group (8–21, 22–28, 29–60 days) and inflammatory markers.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: [
      'AAP 2021',
      'febrile infant',
      'procalcitonin',
      'CRP',
      'ANC',
      'low risk',
      '8-60 days',
      'American Academy of Pediatrics',
    ],
    requiredTests: ['procalcitonin', 'CRP', 'ANC', 'urinalysis', 'blood culture', 'CSF'],
    components: [
      {
        id: 'age_group',
        label: 'Age Group',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '8–21 days old', value: 1 },
          { label: '22–28 days old', value: 2 },
          { label: '29–60 days old', value: 3 },
        ],
      },
      {
        id: 'well_appearing',
        label: 'Infant appears well (non-toxic)',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'previously_healthy',
        label: 'Previously healthy (born at term ≥37 weeks, no prior hospitalization, no chronic illness)',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'inflammatory_markers_normal',
        label: 'Inflammatory Markers Normal (PCT <0.5 ng/mL AND ANC <4,000/µL AND CRP <20 mg/L)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ua_negative',
        label: 'Urinalysis negative (no pyuria, no bacteriuria)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_normal',
        label: 'CSF normal (WBC ≤20/mm³ with negative gram stain)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      // Decision tree: age determines baseline risk; labs modify disposition
      // Scoring is encoded as ranges keyed by age group for UI display
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Ill-Appearing',
          interpretation:
            'Any age: Ill-appearing infant → Full sepsis workup (blood, urine, CSF) + empiric antibiotics + admit. Do not use age-stratification for toxic infants.',
        },
        {
          min: 1,
          max: 1,
          risk: 'High',
          interpretation:
            'Age 8–21 days: Well-appearing → Obtain blood culture, UA/urine culture, and lumbar puncture. Admit and start empiric parenteral antibiotics (ampicillin + gentamicin). HSV PCR if risk factors present.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate-High',
          interpretation:
            'Age 22–28 days: Well-appearing → Obtain blood culture, UA/urine culture, and lumbar puncture. If inflammatory markers ALL normal AND CSF normal → may observe hospitalized without antibiotics (shared decision). If ANY marker abnormal → empiric parenteral antibiotics.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Variable',
          interpretation:
            'Age 29–60 days: Well-appearing → Obtain blood culture, UA/urine culture. LP recommended if inflammatory markers abnormal. If ALL low-risk (well-appearing + normal UA + normal inflammatory markers) → outpatient management with reliable 24h follow-up. If ANY abnormality → admit for further evaluation.',
        },
      ],
    },
    suggestedTreatments: {
      'Ill-Appearing': [
        'full_sepsis_workup',
        'empiric_iv_antibiotics',
        'icu_if_unstable',
        'hsv_pcr_if_risk_factors',
      ],
      High: [
        'blood_culture',
        'urine_culture',
        'lumbar_puncture',
        'admit',
        'empiric_ampicillin_gentamicin',
        'hsv_pcr_if_risk_factors',
      ],
      'Moderate-High': [
        'blood_culture',
        'urine_culture',
        'lumbar_puncture',
        'admit',
        'empiric_antibiotics_if_markers_abnormal',
        'observe_if_all_normal',
      ],
      Variable: [
        'blood_culture',
        'urine_culture',
        'lp_if_markers_abnormal',
        'outpatient_if_all_low_risk',
        'admit_if_any_abnormality',
        'follow_up_24h',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // CISNE Score
  // Sum-based: 6 criteria with varying weights; range 0–8
  // ---------------------------------------------------------------------------
  {
    id: 'cisne',
    name: 'CISNE Score',
    fullName: 'CISNE Score (Clinical Index of Stable Febrile Neutropenia)',
    category: 'INFECTIOUS DISEASE',
    application:
      'Further risk-stratifies apparently stable febrile neutropenic patients (those who appear well at presentation). Score ≥3 indicates high risk (~36% complications).',
    applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenic_fever', 'cancer_fever'],
    keywords: [
      'CISNE',
      'febrile neutropenia',
      'stable',
      'cancer',
      'ECOG',
      'monocytes',
      'hyperglycemia',
      'outpatient',
    ],
    requiredTests: ['monocyte count', 'blood glucose', 'ECOG performance status'],
    components: [
      {
        id: 'ecog_2_or_more',
        label: 'ECOG Performance Status ≥2 (symptomatic, in bed ≤50% of the day or worse)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'stress_hyperglycemia',
        label: 'Stress-induced hyperglycemia (glucose ≥121 mg/dL or ≥250 mg/dL if diabetic)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'copd',
        label: 'Chronic obstructive pulmonary disease (COPD)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'chronic_cvd',
        label: 'Chronic cardiovascular disease (CHF, CAD, valvular disease)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'mucositis_nci_2',
        label: 'Mucositis NCI grade ≥2 (moderate pain, modified diet, or interferes with oral intake)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'monocytes_low',
        label: 'Monocytes <200/µL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Low',
          interpretation:
            'Score 0: Low risk (1.1% complications); outpatient management may be appropriate',
        },
        {
          min: 1,
          max: 2,
          risk: 'Intermediate',
          interpretation:
            'Score 1–2: Intermediate risk (~6%); consider individual risk/benefit for outpatient vs inpatient management',
        },
        {
          min: 3,
          max: 8,
          risk: 'High',
          interpretation:
            'Score ≥3: High risk (~36% complications); inpatient management with IV antibiotics required',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'admit',
        'iv_broad_spectrum_antibiotics',
        'blood_cultures',
        'close_monitoring',
        'oncology_consult',
      ],
      Intermediate: [
        'consider_admit_vs_outpatient',
        'empiric_antibiotics',
        'blood_cultures',
        'close_follow_up',
        'shared_decision_making',
      ],
      Low: [
        'outpatient_oral_antibiotics',
        'blood_cultures_before_discharge',
        'close_follow_up_24_48h',
        'return_precautions',
      ],
    },
  },
]
