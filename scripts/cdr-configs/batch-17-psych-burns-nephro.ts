import type { CdrSeed } from './types'

/**
 * Batch 17 — Psychiatry, Burns & Wound Management CDRs
 *
 * Covers:
 *  1. MMSE — Mini-Mental State Examination
 *  2. MoCA — Montreal Cognitive Assessment
 *  3. SCORTEN — Toxic Epidermal Necrolysis mortality
 *  4. ABSI — Abbreviated Burn Severity Index
 *
 * Quarantined to _quarantine/ (insufficient user-answerable components):
 *  - Lund-Browder: body region % inputs are number_range (only 1 select)
 *  - Baux Score: continuous formula (Age + TBSA%), only 1 boolean
 *  - KDIGO AKI: only 2 published criteria, 1 is lab-based
 *  - CKD-EPI: formula calculator, lab-dependent
 *  - Cockcroft-Gault: formula calculator, lab-dependent
 *  - FENa: pure lab formula, 0 user-answerable components
 *
 * Sources:
 *  - MMSE: Folstein et al., J Psychiatr Res 1975;12:189-198
 *  - MoCA: Nasreddine et al., J Am Geriatr Soc 2005;53:695-699
 *  - SCORTEN: Bastuji-Garin et al., J Invest Dermatol 2000;115:149-153
 *  - ABSI: Tobiasen et al., Ann Emerg Med 1982;11:260-262
 */

export const batch17PsychBurnsNephroCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // MMSE — Mini-Mental State Examination
  // Folstein et al., 1975. 11 items across 5 cognitive domains; max 30 points.
  // ---------------------------------------------------------------------------
  {
    id: 'mmse',
    name: 'MMSE',
    fullName: 'MMSE (Mini-Mental State Examination)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Brief standardized assessment of cognitive function. Screens for dementia and delirium with a total score of 0–30.',
    applicableChiefComplaints: ['altered_mental_status', 'dementia', 'cognitive_impairment', 'delirium'],
    keywords: [
      'MMSE',
      'Mini-Mental State Examination',
      'cognitive screening',
      'dementia',
      'delirium',
      'orientation',
      'recall',
      'Folstein',
    ],
    components: [
      // Orientation (10 points)
      {
        id: 'orientation_time',
        label: 'Orientation to Time (year, season, date, day, month)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct', value: 2 },
          { label: '3 correct', value: 3 },
          { label: '4 correct', value: 4 },
          { label: '5 correct (all)', value: 5 },
        ],
      },
      {
        id: 'orientation_place',
        label: 'Orientation to Place (state, county, city, hospital, floor)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct', value: 2 },
          { label: '3 correct', value: 3 },
          { label: '4 correct', value: 4 },
          { label: '5 correct (all)', value: 5 },
        ],
      },
      // Registration (3 points)
      {
        id: 'registration',
        label: 'Registration (repeat 3 words: e.g., apple, table, penny)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 words recalled', value: 0 },
          { label: '1 word recalled', value: 1 },
          { label: '2 words recalled', value: 2 },
          { label: '3 words recalled (all)', value: 3 },
        ],
      },
      // Attention & Calculation (5 points)
      {
        id: 'attention_calculation',
        label: 'Attention & Calculation (serial 7s from 100, or spell WORLD backward)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct', value: 2 },
          { label: '3 correct', value: 3 },
          { label: '4 correct', value: 4 },
          { label: '5 correct (all)', value: 5 },
        ],
      },
      // Recall (3 points)
      {
        id: 'recall',
        label: 'Recall (recall 3 words from registration)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 words recalled', value: 0 },
          { label: '1 word recalled', value: 1 },
          { label: '2 words recalled', value: 2 },
          { label: '3 words recalled (all)', value: 3 },
        ],
      },
      // Language — Naming (2 points)
      {
        id: 'naming',
        label: 'Naming (identify pencil and watch)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct (both)', value: 2 },
        ],
      },
      // Language — Repetition (1 point)
      {
        id: 'repetition',
        label: 'Repetition ("No ifs, ands, or buts")',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      // Language — 3-Stage Command (3 points)
      {
        id: 'three_stage_command',
        label: '3-Stage Command ("Take paper in right hand, fold in half, put on floor")',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 steps correct', value: 0 },
          { label: '1 step correct', value: 1 },
          { label: '2 steps correct', value: 2 },
          { label: '3 steps correct (all)', value: 3 },
        ],
      },
      // Language — Reading (1 point)
      {
        id: 'reading',
        label: 'Reading (reads and obeys "CLOSE YOUR EYES")',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      // Language — Writing (1 point)
      {
        id: 'writing',
        label: 'Writing (writes a complete sentence with subject and verb)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      // Visuospatial — Copy (1 point)
      {
        id: 'copying',
        label: 'Visuospatial (copies intersecting pentagons)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Severe', interpretation: 'Severe cognitive impairment' },
        { min: 10, max: 18, risk: 'Moderate', interpretation: 'Moderate cognitive impairment' },
        { min: 19, max: 23, risk: 'Mild', interpretation: 'Mild cognitive impairment' },
        { min: 24, max: 30, risk: 'Normal', interpretation: 'Normal (adjust for education level)' },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'neurology_consult',
        'dementia_workup',
        'safety_assessment',
        'caregiver_support',
        'consider_inpatient_evaluation',
      ],
      Moderate: [
        'neurology_referral',
        'dementia_workup',
        'cognitive_rehabilitation',
        'home_safety_evaluation',
        'caregiver_education',
      ],
      Mild: [
        'neurology_referral',
        'cognitive_screening_follow_up',
        'reversible_cause_evaluation',
        'lifestyle_modifications',
      ],
      Normal: [
        'reassurance',
        'routine_follow_up',
        'age_appropriate_screening',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // MoCA — Montreal Cognitive Assessment
  // Nasreddine et al., 2005. 8 domains; max 30 points; +1 if ≤12 yr education.
  // ---------------------------------------------------------------------------
  {
    id: 'moca',
    name: 'MoCA',
    fullName: 'MoCA (Montreal Cognitive Assessment)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Screens for mild cognitive impairment (MCI). More sensitive than MMSE for MCI and early dementia; add 1 point if ≤12 years of education.',
    applicableChiefComplaints: ['cognitive_impairment', 'dementia', 'altered_mental_status', 'memory_loss'],
    keywords: [
      'MoCA',
      'Montreal Cognitive Assessment',
      'mild cognitive impairment',
      'MCI',
      'dementia screening',
      'executive function',
      'Nasreddine',
    ],
    components: [
      // Visuospatial/Executive (5 points)
      {
        id: 'visuospatial_executive',
        label: 'Visuospatial/Executive (trail-making, cube copy, clock drawing)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 points', value: 0 },
          { label: '1 point', value: 1 },
          { label: '2 points', value: 2 },
          { label: '3 points', value: 3 },
          { label: '4 points', value: 4 },
          { label: '5 points (all correct)', value: 5 },
        ],
      },
      // Naming (3 points)
      {
        id: 'naming',
        label: 'Naming (lion, rhinoceros, camel)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct', value: 2 },
          { label: '3 correct (all)', value: 3 },
        ],
      },
      // Attention (6 points)
      {
        id: 'attention',
        label: 'Attention (digit span forward/backward, serial 7s, target tapping)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 points', value: 0 },
          { label: '1 point', value: 1 },
          { label: '2 points', value: 2 },
          { label: '3 points', value: 3 },
          { label: '4 points', value: 4 },
          { label: '5 points', value: 5 },
          { label: '6 points (all correct)', value: 6 },
        ],
      },
      // Language (3 points)
      {
        id: 'language',
        label: 'Language (sentence repetition × 2, verbal fluency ≥11 words)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 points', value: 0 },
          { label: '1 point', value: 1 },
          { label: '2 points', value: 2 },
          { label: '3 points (all correct)', value: 3 },
        ],
      },
      // Abstraction (2 points)
      {
        id: 'abstraction',
        label: 'Abstraction (similarity: train-bicycle, watch-ruler)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct (both)', value: 2 },
        ],
      },
      // Delayed Recall (5 points)
      {
        id: 'delayed_recall',
        label: 'Delayed Recall (5 words: face, velvet, church, daisy, red)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 words recalled', value: 0 },
          { label: '1 word recalled', value: 1 },
          { label: '2 words recalled', value: 2 },
          { label: '3 words recalled', value: 3 },
          { label: '4 words recalled', value: 4 },
          { label: '5 words recalled (all)', value: 5 },
        ],
      },
      // Orientation (6 points)
      {
        id: 'orientation',
        label: 'Orientation (date, month, year, day, place, city)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0 correct', value: 0 },
          { label: '1 correct', value: 1 },
          { label: '2 correct', value: 2 },
          { label: '3 correct', value: 3 },
          { label: '4 correct', value: 4 },
          { label: '5 correct', value: 5 },
          { label: '6 correct (all)', value: 6 },
        ],
      },
      // Education adjustment (+1 if ≤12 years)
      {
        id: 'education_adjustment',
        label: 'Education ≤12 years (add 1 point)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Severe', interpretation: 'Severe cognitive impairment' },
        { min: 10, max: 17, risk: 'Moderate', interpretation: 'Moderate cognitive impairment' },
        { min: 18, max: 25, risk: 'Mild', interpretation: 'Mild cognitive impairment' },
        { min: 26, max: 31, risk: 'Normal', interpretation: 'Normal cognitive function' },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'neurology_consult',
        'dementia_workup',
        'safety_assessment',
        'caregiver_support',
        'consider_inpatient_evaluation',
      ],
      Moderate: [
        'neurology_referral',
        'dementia_workup',
        'cognitive_rehabilitation',
        'home_safety_evaluation',
        'caregiver_education',
      ],
      Mild: [
        'neurology_referral',
        'cognitive_screening_follow_up',
        'reversible_cause_evaluation',
        'lifestyle_modifications',
      ],
      Normal: [
        'reassurance',
        'routine_follow_up',
        'age_appropriate_screening',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // SCORTEN — Toxic Epidermal Necrolysis Severity Score
  // Bastuji-Garin et al., 2000. 7 binary criteria; each = 1 point.
  // ---------------------------------------------------------------------------
  {
    id: 'scorten',
    name: 'SCORTEN',
    fullName: 'SCORTEN (Toxic Epidermal Necrolysis Severity Score)',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Predicts mortality in Stevens-Johnson Syndrome (SJS) and Toxic Epidermal Necrolysis (TEN). Assessed within first 24 hours and reassessed at 72 hours.',
    applicableChiefComplaints: [
      'stevens_johnson_syndrome',
      'toxic_epidermal_necrolysis',
      'drug_reaction',
      'skin_sloughing',
    ],
    keywords: [
      'SCORTEN',
      'SJS',
      'TEN',
      'Stevens-Johnson',
      'toxic epidermal necrolysis',
      'drug reaction',
      'skin mortality',
    ],
    requiredTests: ['BUN', 'serum bicarbonate', 'serum glucose', 'heart rate', 'BSA involvement assessment'],
    components: [
      {
        id: 'age_over_40',
        label: 'Age >40 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'malignancy',
        label: 'Associated malignancy (active cancer)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_rate_over_120',
        label: 'Heart rate >120 bpm',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'initial_bsa_over_10',
        label: 'Initial percentage of epidermal detachment >10%',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'serum_urea_over_10',
        label: 'Serum urea >10 mmol/L (BUN >28 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'serum_bicarb_under_20',
        label: 'Serum bicarbonate <20 mEq/L',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'serum_glucose_over_14',
        label: 'Serum glucose >14 mmol/L (>252 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low Mortality', interpretation: 'Score 0–1: Predicted mortality 3.2%' },
        { min: 2, max: 2, risk: 'Moderate Mortality', interpretation: 'Score 2: Predicted mortality 12.1%' },
        {
          min: 3,
          max: 3,
          risk: 'High Mortality',
          interpretation: 'Score 3: Predicted mortality 35.3%; consider burn center/ICU transfer',
        },
        {
          min: 4,
          max: 4,
          risk: 'Very High Mortality',
          interpretation: 'Score 4: Predicted mortality 58.3%',
        },
        { min: 5, max: 7, risk: 'Extreme Mortality', interpretation: 'Score ≥5: Predicted mortality ~90%' },
      ],
    },
    suggestedTreatments: {
      'Extreme Mortality': [
        'burn_center_icu_transfer',
        'stop_offending_drug',
        'ivig_consideration',
        'wound_care_non_adherent_dressings',
        'fluid_resuscitation',
        'pain_management',
        'ophthalmology_consult',
        'palliative_care_discussion',
      ],
      'Very High Mortality': [
        'burn_center_icu_transfer',
        'stop_offending_drug',
        'ivig_consideration',
        'wound_care_non_adherent_dressings',
        'fluid_resuscitation',
        'ophthalmology_consult',
      ],
      'High Mortality': [
        'burn_center_transfer',
        'stop_offending_drug',
        'dermatology_consult',
        'wound_care',
        'fluid_resuscitation',
        'ophthalmology_consult',
      ],
      'Moderate Mortality': [
        'stop_offending_drug',
        'dermatology_consult',
        'wound_care',
        'admit_monitored_bed',
        'ophthalmology_consult',
      ],
      'Low Mortality': [
        'stop_offending_drug',
        'dermatology_consult',
        'wound_care',
        'admit_for_observation',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ABSI — Abbreviated Burn Severity Index
  // Tobiasen et al., 1982. 5 components; sum yields survival probability.
  // ---------------------------------------------------------------------------
  {
    id: 'absi',
    name: 'ABSI',
    fullName: 'Abbreviated Burn Severity Index (ABSI)',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Multi-variable burn mortality prediction tool that is more accurate than the Baux score, incorporating sex, age, inhalation injury, full thickness burn, and TBSA.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'inhalation_injury'],
    keywords: [
      'ABSI',
      'Abbreviated Burn Severity Index',
      'burn mortality',
      'burn prognosis',
      'TBSA',
      'inhalation injury',
    ],
    components: [
      {
        id: 'sex',
        label: 'Sex',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female', value: 0 },
          { label: 'Male', value: 1 },
        ],
      },
      {
        id: 'age',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0–20 years', value: 1 },
          { label: '21–40 years', value: 2 },
          { label: '41–60 years', value: 3 },
          { label: '61–80 years', value: 4 },
          { label: '>80 years', value: 5 },
        ],
      },
      {
        id: 'inhalation_injury',
        label: 'Inhalation injury',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'full_thickness_burn',
        label: 'Full-thickness (3rd degree) burn present',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'tbsa_burned',
        label: 'TBSA Burned (%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '1–10%', value: 1 },
          { label: '11–20%', value: 2 },
          { label: '21–30%', value: 3 },
          { label: '31–40%', value: 4 },
          { label: '41–50%', value: 5 },
          { label: '51–60%', value: 6 },
          { label: '61–70%', value: 7 },
          { label: '71–80%', value: 8 },
          { label: '81–90%', value: 9 },
          { label: '91–100%', value: 10 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 2,
          max: 3,
          risk: 'Very Low',
          interpretation: 'Score 2–3: Very low threat to life; ≥99% survival probability',
        },
        {
          min: 4,
          max: 5,
          risk: 'Moderate',
          interpretation: 'Score 4–5: Moderate threat; ~98% survival',
        },
        {
          min: 6,
          max: 7,
          risk: 'Moderately Severe',
          interpretation: 'Score 6–7: Moderately severe threat; 80–90% survival',
        },
        {
          min: 8,
          max: 9,
          risk: 'Serious',
          interpretation: 'Score 8–9: Serious threat; 50–70% survival',
        },
        {
          min: 10,
          max: 11,
          risk: 'Severe',
          interpretation: 'Score 10–11: Severe threat; 20–40% survival',
        },
        {
          min: 12,
          max: 18,
          risk: 'Maximum',
          interpretation: 'Score ≥12: Maximum threat; <10% survival',
        },
      ],
    },
    suggestedTreatments: {
      Maximum: [
        'burn_center_icu',
        'goals_of_care_discussion',
        'palliative_care_consultation',
        'aggressive_resuscitation_if_goals_align',
      ],
      Severe: [
        'burn_center_icu',
        'aggressive_fluid_resuscitation',
        'intubation_if_inhalation_injury',
        'escharotomy_evaluation',
        'goals_of_care_discussion',
      ],
      Serious: [
        'burn_center_transfer',
        'parkland_fluid_resuscitation',
        'wound_care',
        'intubation_if_indicated',
      ],
      'Moderately Severe': [
        'burn_center_referral',
        'fluid_resuscitation',
        'wound_care',
        'pain_management',
      ],
      Moderate: [
        'burn_unit_admission',
        'wound_care',
        'pain_management',
        'physical_therapy',
      ],
      'Very Low': [
        'wound_care',
        'outpatient_follow_up',
        'pain_management',
      ],
    },
  },

]
