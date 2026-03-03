import type { CdrSeed } from './types'

/**
 * Batch 19 — Oncologic Emergency, Critical Care, Dermatology, ENT, Orthopedic CDRs
 *
 * Covers: SINS Score, SAPS II, ABCDE Melanoma Rule, SCORAD, PASI,
 *         Epworth Sleepiness Scale, Lund-Mackay Score, Beighton Score,
 *         Salter-Harris Classification, Weber Ankle Classification
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published literature.
 *
 * Sources:
 *  - SINS: Fisher et al., J Clin Oncol 2010
 *  - SAPS II: Le Gall et al., JAMA 1993
 *  - ABCDE Melanoma: Friedman et al., CA Cancer J Clin 1985; Abbasi et al., JAMA 2004
 *  - SCORAD: European Task Force on Atopic Dermatitis, Dermatology 1993
 *  - PASI: Fredriksson & Pettersson, Dermatologica 1978
 *  - Epworth Sleepiness Scale: Johns, Sleep 1991
 *  - Lund-Mackay: Lund & Mackay, Rhinology 1993
 *  - Beighton Score: Beighton et al., Ann Rheum Dis 1973; 2017 hEDS criteria
 *  - Salter-Harris: Salter & Harris, J Bone Joint Surg Am 1963
 *  - Weber: Danis-Weber classification; AO Foundation
 */

export const batch19OncDermEntCdrs: CdrSeed[] = [
  // SINS Score — QUARANTINED to _quarantine/sins_score.ts
  // Reason: Only 1/6 components user-answerable (pain); 5 are imaging-based (section2)

  // ---------------------------------------------------------------------------
  // SAPS II — Simplified Acute Physiology Score II
  // 17 components (worst values in first 24h of ICU admission); sum scoring; max 163
  // ---------------------------------------------------------------------------
  {
    id: 'saps2',
    name: 'SAPS II',
    fullName: 'SAPS II (Simplified Acute Physiology Score II)',
    category: 'CRITICAL CARE & ICU',
    application:
      'Predicts ICU mortality using the worst values in the first 24 hours of ICU admission. An alternative to APACHE II using a logistic regression equation to convert total score to predicted mortality.',
    applicableChiefComplaints: ['icu_admission', 'critical_illness', 'sepsis', 'respiratory_failure'],
    keywords: [
      'SAPS II',
      'SAPS 2',
      'ICU mortality',
      'critical care scoring',
      'prognosis',
      'acute physiology score',
    ],
    requiredTests: ['ABG', 'serum urea', 'WBC', 'potassium', 'sodium', 'bicarbonate', 'bilirubin', 'GCS', 'urine output'],
    components: [
      {
        id: 'age',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<40 years', value: 0 },
          { label: '40-59 years', value: 7 },
          { label: '60-69 years', value: 12 },
          { label: '70-74 years', value: 15 },
          { label: '75-79 years', value: 16 },
          { label: '>=80 years', value: 18 },
        ],
      },
      {
        id: 'heart_rate',
        label: 'Heart Rate (worst in 24h)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<40 bpm', value: 11 },
          { label: '40-69 bpm', value: 2 },
          { label: '70-119 bpm', value: 0 },
          { label: '120-159 bpm', value: 4 },
          { label: '>=160 bpm', value: 7 },
        ],
      },
      {
        id: 'systolic_bp',
        label: 'Systolic BP (worst in 24h)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<70 mmHg', value: 13 },
          { label: '70-99 mmHg', value: 5 },
          { label: '100-199 mmHg', value: 0 },
          { label: '>=200 mmHg', value: 2 },
        ],
      },
      {
        id: 'temperature',
        label: 'Temperature (worst in 24h)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<39.0 C', value: 0 },
          { label: '>=39.0 C', value: 3 },
        ],
      },
      {
        id: 'pao2_fio2',
        label: 'PaO2/FiO2 Ratio (if ventilated or CPAP)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Not ventilated / no CPAP', value: 0 },
          { label: 'PaO2/FiO2 >=200', value: 6 },
          { label: 'PaO2/FiO2 100-199', value: 9 },
          { label: 'PaO2/FiO2 <100', value: 11 },
        ],
      },
      {
        id: 'urine_output',
        label: 'Urine Output (24h total)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>=1.0 L/day', value: 0 },
          { label: '0.5-0.999 L/day', value: 4 },
          { label: '<0.5 L/day', value: 11 },
        ],
      },
      {
        id: 'bun',
        label: 'BUN / Serum Urea (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'BUN <28 mg/dL (urea <10 mmol/L)', value: 0 },
          { label: 'BUN 28-83 mg/dL (urea 10-29.9 mmol/L)', value: 6 },
          { label: 'BUN >=84 mg/dL (urea >=30 mmol/L)', value: 10 },
        ],
      },
      {
        id: 'wbc',
        label: 'WBC (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.0 x10^9/L', value: 12 },
          { label: '1.0-19.9 x10^9/L', value: 0 },
          { label: '>=20.0 x10^9/L', value: 3 },
        ],
      },
      {
        id: 'potassium',
        label: 'Potassium (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<3.0 mEq/L', value: 3 },
          { label: '3.0-4.9 mEq/L', value: 0 },
          { label: '>=5.0 mEq/L', value: 3 },
        ],
      },
      {
        id: 'sodium',
        label: 'Sodium (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<125 mEq/L', value: 5 },
          { label: '125-144 mEq/L', value: 0 },
          { label: '>=145 mEq/L', value: 1 },
        ],
      },
      {
        id: 'bicarbonate',
        label: 'Serum Bicarbonate (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<15 mEq/L', value: 6 },
          { label: '15-19 mEq/L', value: 3 },
          { label: '>=20 mEq/L', value: 0 },
        ],
      },
      {
        id: 'bilirubin',
        label: 'Bilirubin (worst in 24h)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<4.0 mg/dL (68.4 umol/L)', value: 0 },
          { label: '4.0-5.9 mg/dL (68.4-102.5 umol/L)', value: 4 },
          { label: '>=6.0 mg/dL (>=102.6 umol/L)', value: 9 },
        ],
      },
      {
        id: 'gcs',
        label: 'Glasgow Coma Scale (lowest in 24h)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'GCS 14-15', value: 0 },
          { label: 'GCS 11-13', value: 5 },
          { label: 'GCS 9-10', value: 7 },
          { label: 'GCS 6-8', value: 13 },
          { label: 'GCS <6', value: 26 },
        ],
      },
      {
        id: 'chronic_disease',
        label: 'Chronic Disease',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Metastatic cancer', value: 9 },
          { label: 'Hematologic malignancy', value: 10 },
          { label: 'AIDS', value: 17 },
        ],
      },
      {
        id: 'admission_type',
        label: 'Type of Admission',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Scheduled surgical', value: 0 },
          { label: 'Medical', value: 6 },
          { label: 'Unscheduled surgical', value: 8 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 29,
          risk: 'Low Mortality',
          interpretation: 'Score <30: Approximate ICU mortality <10%.',
        },
        {
          min: 30,
          max: 39,
          risk: 'Low-Moderate',
          interpretation: 'Score 30-39: Approximate mortality 10-20%.',
        },
        {
          min: 40,
          max: 49,
          risk: 'Moderate',
          interpretation: 'Score 40-49: Approximate mortality 20-40%.',
        },
        {
          min: 50,
          max: 59,
          risk: 'High',
          interpretation: 'Score 50-59: Approximate mortality 40-50%.',
        },
        {
          min: 60,
          max: 79,
          risk: 'Very High',
          interpretation: 'Score 60-79: Approximate mortality 50-75%.',
        },
        {
          min: 80,
          max: 163,
          risk: 'Extreme',
          interpretation: 'Score >=80: Approximate mortality >75%.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ABCDE Melanoma Rule
  // 5 binary criteria; threshold scoring (any positive = suspicious)
  // ---------------------------------------------------------------------------
  {
    id: 'abcde_melanoma',
    name: 'ABCDE Melanoma Rule',
    fullName: 'ABCDE Rule (Melanoma Screening)',
    category: 'DERMATOLOGY',
    application:
      'Clinical criteria for identifying suspicious pigmented lesions that may be melanoma. Any single positive feature warrants referral for dermatoscopy or biopsy.',
    applicableChiefComplaints: ['skin_lesion', 'mole_change', 'pigmented_lesion', 'melanoma_screening'],
    keywords: [
      'ABCDE',
      'melanoma',
      'skin cancer',
      'asymmetry',
      'border',
      'color',
      'diameter',
      'evolution',
      'pigmented lesion',
      'dermatology',
    ],
    components: [
      {
        id: 'asymmetry',
        label: 'Asymmetry (one half does not match the other)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'border',
        label: 'Border irregularity (edges ragged, notched, or blurred)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'color',
        label: 'Color variation (uneven distribution of color; shades of brown/black/red/white/blue)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'diameter',
        label: 'Diameter >6 mm (larger than a pencil eraser)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'evolution',
        label: 'Evolution (change in size, shape, color, or new symptom such as bleeding/itching)',
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
          max: 0,
          risk: 'Low Suspicion',
          interpretation:
            'No ABCDE features; routine follow-up; maintain vigilance for ugly duckling sign.',
        },
        {
          min: 1,
          max: 5,
          risk: 'Suspicious',
          interpretation:
            'Any positive feature warrants referral for dermatoscopy or biopsy; sensitivity ~83%, specificity ~59% for melanoma.',
        },
      ],
    },
    suggestedTreatments: {
      Suspicious: ['dermatology_referral', 'biopsy', 'dermatoscopy', 'photographic_documentation'],
      'Low Suspicion': ['skin_self_exam_education', 'routine_follow_up', 'sun_protection_counseling'],
    },
  },

  // ---------------------------------------------------------------------------
  // SCORAD — SCORing Atopic Dermatitis
  // Algorithm: A/5 + 7B/2 + C
  // A = extent (0-100), B = intensity (0-18), C = subjective symptoms (0-20)
  // Max: 100/5 + 7*18/2 + 20 = 20 + 63 + 20 = 103
  // ---------------------------------------------------------------------------
  {
    id: 'scorad',
    name: 'SCORAD',
    fullName: 'SCORAD (SCORing Atopic Dermatitis)',
    category: 'DERMATOLOGY',
    application:
      'Measures severity of atopic dermatitis combining extent (% BSA), intensity (6 features), and subjective symptoms (pruritus and sleep disturbance). Formula: SCORAD = A/5 + 7B/2 + C.',
    applicableChiefComplaints: ['atopic_dermatitis', 'eczema', 'rash', 'pruritus'],
    keywords: [
      'SCORAD',
      'atopic dermatitis',
      'eczema severity',
      'BSA',
      'pruritus',
      'lichenification',
      'atopy',
    ],
    components: [
      // A: Extent (% BSA affected, 0-100)
      {
        id: 'extent',
        label: 'A: Extent of Disease (% BSA affected, rule of nines)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 100,
      },
      // B: Intensity — 6 features each scored 0-3 (none/mild/moderate/severe)
      {
        id: 'erythema',
        label: 'B: Erythema (redness)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      {
        id: 'edema_papulation',
        label: 'B: Edema / Papulation',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      {
        id: 'oozing_crusting',
        label: 'B: Oozing / Crusting',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      {
        id: 'excoriation',
        label: 'B: Excoriation (scratch marks)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      {
        id: 'lichenification',
        label: 'B: Lichenification (skin thickening)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      {
        id: 'dryness',
        label: 'B: Dryness (assessed on uninvolved skin)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
        ],
      },
      // C: Subjective symptoms — VAS scales 0-10 each
      {
        id: 'pruritus_vas',
        label: 'C: Pruritus (patient-rated, 0-10 VAS)',
        type: 'number_range',
        source: 'user_input',
        min: 0,
        max: 10,
      },
      {
        id: 'sleep_loss_vas',
        label: 'C: Sleep Disturbance (patient-rated, 0-10 VAS)',
        type: 'number_range',
        source: 'user_input',
        min: 0,
        max: 10,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 24,
          risk: 'Mild',
          interpretation: 'SCORAD <25: Mild atopic dermatitis; topical emollients and low-potency corticosteroids.',
        },
        {
          min: 25,
          max: 50,
          risk: 'Moderate',
          interpretation:
            'SCORAD 25-50: Moderate atopic dermatitis; consider step-up therapy with mid-potency topical steroids or calcineurin inhibitors.',
        },
        {
          min: 51,
          max: 103,
          risk: 'Severe',
          interpretation:
            'SCORAD >50: Severe atopic dermatitis; systemic immunosuppressant or biologic therapy consideration.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: ['dermatology_referral', 'systemic_therapy_consideration', 'biologic_therapy', 'emollients'],
      Moderate: ['mid_potency_topical_steroids', 'calcineurin_inhibitors', 'emollients', 'dermatology_follow_up'],
      Mild: ['emollients', 'low_potency_topical_steroids', 'trigger_avoidance'],
    },
  },

  // ---------------------------------------------------------------------------
  // PASI — Psoriasis Area and Severity Index
  // Algorithm: weighted sum of 4 body regions (head, upper extremities, trunk, lower extremities)
  // Each region: (erythema + induration + desquamation) * area_fraction * weight
  // Max: 72
  // ---------------------------------------------------------------------------
  {
    id: 'pasi',
    name: 'PASI',
    fullName: 'PASI (Psoriasis Area and Severity Index)',
    category: 'DERMATOLOGY',
    application:
      'Gold standard for measuring psoriasis severity combining area and intensity across 4 body regions. PASI >=10 or BSA >=10% typically qualifies for systemic or biologic therapy.',
    applicableChiefComplaints: ['psoriasis', 'plaque_psoriasis', 'skin_rash'],
    keywords: [
      'PASI',
      'psoriasis',
      'Psoriasis Area Severity Index',
      'PASI 75',
      'biologic therapy',
      'psoriasis severity',
      'erythema',
      'induration',
      'scaling',
    ],
    components: [
      // --- Head (weight 0.1) ---
      {
        id: 'head_erythema',
        label: 'Head: Erythema',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'head_induration',
        label: 'Head: Induration (thickness)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'head_desquamation',
        label: 'Head: Desquamation (scaling)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'head_area',
        label: 'Head: Area Involvement (%)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0% (none)', value: 0 },
          { label: '1-9% (mild)', value: 1 },
          { label: '10-29% (moderate)', value: 2 },
          { label: '30-49% (marked)', value: 3 },
          { label: '50-69% (severe)', value: 4 },
          { label: '70-89% (extensive)', value: 5 },
          { label: '90-100% (near-total)', value: 6 },
        ],
      },
      // --- Upper Extremities (weight 0.2) ---
      {
        id: 'upper_erythema',
        label: 'Upper Extremities: Erythema',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'upper_induration',
        label: 'Upper Extremities: Induration (thickness)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'upper_desquamation',
        label: 'Upper Extremities: Desquamation (scaling)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'upper_area',
        label: 'Upper Extremities: Area Involvement (%)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0% (none)', value: 0 },
          { label: '1-9% (mild)', value: 1 },
          { label: '10-29% (moderate)', value: 2 },
          { label: '30-49% (marked)', value: 3 },
          { label: '50-69% (severe)', value: 4 },
          { label: '70-89% (extensive)', value: 5 },
          { label: '90-100% (near-total)', value: 6 },
        ],
      },
      // --- Trunk (weight 0.3) ---
      {
        id: 'trunk_erythema',
        label: 'Trunk: Erythema',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'trunk_induration',
        label: 'Trunk: Induration (thickness)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'trunk_desquamation',
        label: 'Trunk: Desquamation (scaling)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'trunk_area',
        label: 'Trunk: Area Involvement (%)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0% (none)', value: 0 },
          { label: '1-9% (mild)', value: 1 },
          { label: '10-29% (moderate)', value: 2 },
          { label: '30-49% (marked)', value: 3 },
          { label: '50-69% (severe)', value: 4 },
          { label: '70-89% (extensive)', value: 5 },
          { label: '90-100% (near-total)', value: 6 },
        ],
      },
      // --- Lower Extremities (weight 0.4) ---
      {
        id: 'lower_erythema',
        label: 'Lower Extremities: Erythema',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'lower_induration',
        label: 'Lower Extremities: Induration (thickness)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'lower_desquamation',
        label: 'Lower Extremities: Desquamation (scaling)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Slight', value: 1 },
          { label: 'Moderate', value: 2 },
          { label: 'Severe', value: 3 },
          { label: 'Very Severe', value: 4 },
        ],
      },
      {
        id: 'lower_area',
        label: 'Lower Extremities: Area Involvement (%)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0% (none)', value: 0 },
          { label: '1-9% (mild)', value: 1 },
          { label: '10-29% (moderate)', value: 2 },
          { label: '30-49% (marked)', value: 3 },
          { label: '50-69% (severe)', value: 4 },
          { label: '70-89% (extensive)', value: 5 },
          { label: '90-100% (near-total)', value: 6 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Clear',
          interpretation: 'PASI 0: Clear skin.',
        },
        {
          min: 1,
          max: 4,
          risk: 'Mild',
          interpretation: 'PASI <5: Mild psoriasis; topical therapy.',
        },
        {
          min: 5,
          max: 10,
          risk: 'Moderate',
          interpretation:
            'PASI 5-10: Moderate psoriasis; consider phototherapy or systemic therapy.',
        },
        {
          min: 11,
          max: 20,
          risk: 'Severe',
          interpretation:
            'PASI >10: Severe psoriasis; systemic or biologic therapy indicated.',
        },
        {
          min: 21,
          max: 72,
          risk: 'Very Severe',
          interpretation:
            'PASI >20: Very severe psoriasis; biologic therapy strongly indicated.',
        },
      ],
    },
    suggestedTreatments: {
      'Very Severe': ['biologic_therapy', 'dermatology_urgent_referral', 'systemic_therapy'],
      Severe: ['systemic_therapy', 'biologic_therapy', 'dermatology_referral'],
      Moderate: ['phototherapy', 'systemic_therapy_consideration', 'topical_vitamin_d_analogs'],
      Mild: ['topical_corticosteroids', 'topical_vitamin_d_analogs', 'emollients'],
      Clear: ['maintenance_therapy', 'routine_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // Epworth Sleepiness Scale (ESS)
  // 8 situational questions each 0-3; sum scoring; max 24
  // ---------------------------------------------------------------------------
  {
    id: 'epworth_sleepiness',
    name: 'Epworth Sleepiness Scale',
    fullName: 'Epworth Sleepiness Scale (ESS)',
    category: 'ENT / OTOLARYNGOLOGY',
    application:
      'Measures daytime sleepiness using 8 situational questions rated 0-3. Used to screen for sleep disorders and monitor treatment response.',
    applicableChiefComplaints: ['daytime_sleepiness', 'sleep_disorder', 'fatigue', 'sleep_apnea'],
    keywords: [
      'Epworth',
      'ESS',
      'daytime sleepiness',
      'sleep disorder',
      'narcolepsy',
      'sleep apnea',
      'somnolence',
    ],
    components: [
      {
        id: 'sitting_reading',
        label: 'Chance of dozing: Sitting and reading',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'watching_tv',
        label: 'Chance of dozing: Watching TV',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'sitting_inactive_public',
        label: 'Chance of dozing: Sitting inactive in a public place (e.g., theater, meeting)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'car_passenger',
        label: 'Chance of dozing: As a passenger in a car for an hour without a break',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'lying_down_afternoon',
        label: 'Chance of dozing: Lying down to rest in the afternoon when circumstances permit',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'sitting_talking',
        label: 'Chance of dozing: Sitting and talking to someone',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'sitting_quietly_after_lunch',
        label: 'Chance of dozing: Sitting quietly after lunch without alcohol',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
      {
        id: 'car_stopped_traffic',
        label: 'Chance of dozing: In a car, while stopped for a few minutes in traffic',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Would never doze', value: 0 },
          { label: 'Slight chance of dozing', value: 1 },
          { label: 'Moderate chance of dozing', value: 2 },
          { label: 'High chance of dozing', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 5,
          risk: 'Lower Normal',
          interpretation: 'Lower normal daytime sleepiness.',
        },
        {
          min: 6,
          max: 10,
          risk: 'Higher Normal',
          interpretation: 'Higher normal daytime sleepiness.',
        },
        {
          min: 11,
          max: 12,
          risk: 'Mild Excessive',
          interpretation:
            'Mild excessive daytime sleepiness; evaluate for sleep disorder.',
        },
        {
          min: 13,
          max: 15,
          risk: 'Moderate Excessive',
          interpretation:
            'Moderate excessive daytime sleepiness; sleep study indicated.',
        },
        {
          min: 16,
          max: 24,
          risk: 'Severe Excessive',
          interpretation:
            'Severe excessive daytime sleepiness; strongly suggests sleep disorder requiring evaluation.',
        },
      ],
    },
    suggestedTreatments: {
      'Severe Excessive': ['sleep_study_polysomnography', 'sleep_medicine_referral', 'driving_safety_counseling'],
      'Moderate Excessive': ['sleep_study_polysomnography', 'sleep_hygiene_counseling', 'sleep_medicine_referral'],
      'Mild Excessive': ['sleep_hygiene_counseling', 'sleep_study_consideration'],
      'Higher Normal': ['sleep_hygiene_counseling'],
      'Lower Normal': ['reassurance'],
    },
  },

  // Lund-Mackay Score — QUARANTINED to _quarantine/lund_mackay.ts
  // Reason: All 12 components are imaging-based (section2 — CT sinus findings); 0 user-answerable

  // ---------------------------------------------------------------------------
  // Beighton Hypermobility Score
  // 9 binary maneuvers (bilateral pinky, thumbs, elbows, knees + forward flexion)
  // Each 1 point; sum scoring; max 9
  // ---------------------------------------------------------------------------
  {
    id: 'beighton_score',
    name: 'Beighton Score',
    fullName: 'Beighton Hypermobility Score',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application:
      'Screens for generalized joint hypermobility used in evaluation of hypermobility spectrum disorders and Ehlers-Danlos syndrome (hypermobile type). Positive Beighton alone does not diagnose hEDS.',
    applicableChiefComplaints: ['joint_hypermobility', 'joint_pain', 'connective_tissue_disorder', 'ehlers_danlos'],
    keywords: [
      'Beighton',
      'joint hypermobility',
      'hEDS',
      'Ehlers-Danlos',
      'hypermobility spectrum',
      'generalized joint hypermobility',
      'GJH',
    ],
    components: [
      {
        id: 'left_pinky',
        label: 'Left 5th finger: passive dorsiflexion >90 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'right_pinky',
        label: 'Right 5th finger: passive dorsiflexion >90 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'left_thumb',
        label: 'Left thumb: passive apposition to forearm flexor surface',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'right_thumb',
        label: 'Right thumb: passive apposition to forearm flexor surface',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'left_elbow',
        label: 'Left elbow: hyperextension >10 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'right_elbow',
        label: 'Right elbow: hyperextension >10 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'left_knee',
        label: 'Left knee: hyperextension >10 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'right_knee',
        label: 'Right knee: hyperextension >10 degrees',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'forward_flexion',
        label: 'Forward flexion: palms flat on floor with knees fully extended',
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
          max: 3,
          risk: 'Not Hypermobile',
          interpretation:
            'Score <4 (adults): Does not meet criteria for generalized joint hypermobility.',
        },
        {
          min: 4,
          max: 5,
          risk: 'Hypermobile (Adult Threshold)',
          interpretation:
            'Score >=4 adults / >=5 children: Generalized joint hypermobility; requires additional hEDS criteria for diagnosis.',
        },
        {
          min: 6,
          max: 9,
          risk: 'Strongly Hypermobile',
          interpretation:
            'Score >=6: Strong evidence of generalized hypermobility; evaluate for EDS and hypermobility spectrum disorder.',
        },
      ],
    },
    suggestedTreatments: {
      'Strongly Hypermobile': ['genetics_referral', 'rheumatology_referral', 'physical_therapy', 'joint_protection_education'],
      'Hypermobile (Adult Threshold)': ['rheumatology_referral', 'physical_therapy', 'joint_protection_education'],
      'Not Hypermobile': ['reassurance', 'consider_alternative_diagnosis'],
    },
  },

  // Salter-Harris Classification — QUARANTINED to _quarantine/salter_harris.ts
  // Reason: Single imaging-based component (section2); 0 user-answerable

  // Weber Ankle Classification — QUARANTINED to _quarantine/weber_ankle.ts
  // Reason: Single imaging-based component (section2); 0 user-answerable
]
