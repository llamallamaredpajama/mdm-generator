import type { CdrSeed } from './types'

/**
 * Batch 17 — Psychiatry, Burns & Wound Management, Nephrology CDRs
 *
 * Covers:
 *  1. MMSE — Mini-Mental State Examination
 *  2. MoCA — Montreal Cognitive Assessment
 *  3. Lund-Browder Chart — Age-adjusted burn TBSA
 *  4. SCORTEN — Toxic Epidermal Necrolysis mortality
 *  5. Baux Score — Burn mortality prediction
 *  6. ABSI — Abbreviated Burn Severity Index
 *  7. KDIGO AKI — Acute Kidney Injury staging
 *  8. CKD-EPI — eGFR estimation (2021 race-free)
 *  9. Cockcroft-Gault — Creatinine clearance estimation
 * 10. FENa — Fractional Excretion of Sodium
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published literature.
 *
 * Sources:
 *  - MMSE: Folstein et al., J Psychiatr Res 1975;12:189-198
 *  - MoCA: Nasreddine et al., J Am Geriatr Soc 2005;53:695-699
 *  - Lund-Browder: Lund CC, Browder NC, Surg Gynecol Obstet 1944;79:352-358
 *  - SCORTEN: Bastuji-Garin et al., J Invest Dermatol 2000;115:149-153
 *  - Baux Score: Baux S, Contribution à l'étude du traitement local des brûlures thermiques, 1961
 *  - ABSI: Tobiasen et al., Ann Emerg Med 1982;11:260-262
 *  - KDIGO AKI: KDIGO Clinical Practice Guideline for AKI, Kidney Int Suppl 2012;2:1-138
 *  - CKD-EPI: Inker et al., NEJM 2021;385:1737-1749 (2021 race-free equation)
 *  - Cockcroft-Gault: Cockcroft DW, Gault MH, Nephron 1976;16:31-41
 *  - FENa: Espinel CH, Arch Intern Med 1976;136:370-373
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
  },

  // ---------------------------------------------------------------------------
  // Lund-Browder Chart
  // Lund & Browder, 1944. Age-adjusted body region TBSA percentages.
  // Uses number_range for each body region (algorithm sums adjusted values).
  // ---------------------------------------------------------------------------
  {
    id: 'lund_browder',
    name: 'Lund-Browder',
    fullName: 'Lund-Browder Chart',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Most accurate method for TBSA burn estimation, accounting for age-related body proportion changes. Especially important in pediatrics where head and lower extremity proportions differ from adults.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'pediatric_burns', 'thermal_injury'],
    keywords: [
      'Lund-Browder',
      'TBSA',
      'burn estimation',
      'pediatric burns',
      'total body surface area',
      'age-adjusted',
    ],
    components: [
      {
        id: 'patient_age_group',
        label: 'Patient Age Group',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0–1 year', value: 0 },
          { label: '1–4 years', value: 1 },
          { label: '5–9 years', value: 2 },
          { label: '10–14 years', value: 3 },
          { label: '15+ years (adult)', value: 4 },
        ],
      },
      {
        id: 'head_neck',
        label: 'Head & Neck (% burned — infant 19%, adult 7%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 19,
      },
      {
        id: 'anterior_trunk',
        label: 'Anterior Trunk (% burned — 13% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 13,
      },
      {
        id: 'posterior_trunk',
        label: 'Posterior Trunk (% burned — 13% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 13,
      },
      {
        id: 'right_upper_arm',
        label: 'Right Upper Arm (% burned — 4% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 4,
      },
      {
        id: 'left_upper_arm',
        label: 'Left Upper Arm (% burned — 4% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 4,
      },
      {
        id: 'right_lower_arm',
        label: 'Right Lower Arm (% burned — 3% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 3,
      },
      {
        id: 'left_lower_arm',
        label: 'Left Lower Arm (% burned — 3% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 3,
      },
      {
        id: 'right_hand',
        label: 'Right Hand (% burned — 2.5% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 3,
      },
      {
        id: 'left_hand',
        label: 'Left Hand (% burned — 2.5% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 3,
      },
      {
        id: 'buttocks',
        label: 'Buttocks (% burned — 5% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 5,
      },
      {
        id: 'genitalia',
        label: 'Genitalia (% burned — 1% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 1,
      },
      {
        id: 'right_thigh',
        label: 'Right Thigh (% burned — infant 5.5%, adult 9.5%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 10,
      },
      {
        id: 'left_thigh',
        label: 'Left Thigh (% burned — infant 5.5%, adult 9.5%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 10,
      },
      {
        id: 'right_lower_leg',
        label: 'Right Lower Leg (% burned — infant 5%, adult 7%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 7,
      },
      {
        id: 'left_lower_leg',
        label: 'Left Lower Leg (% burned — infant 5%, adult 7%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 7,
      },
      {
        id: 'right_foot',
        label: 'Right Foot (% burned — 3.5% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 4,
      },
      {
        id: 'left_foot',
        label: 'Left Foot (% burned — 3.5% all ages)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 4,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 9,
          risk: 'Minor Burn',
          interpretation:
            'TBSA <10%: Minor burn. Outpatient management possible for partial-thickness burns in non-critical areas without complicating factors.',
        },
        {
          min: 10,
          max: 19,
          risk: 'Moderate Burn',
          interpretation:
            'TBSA 10–19%: Moderate burn. IV fluid resuscitation per Parkland formula (4 mL/kg/%TBSA). Consider burn center referral.',
        },
        {
          min: 20,
          max: 39,
          risk: 'Major Burn',
          interpretation:
            'TBSA 20–39%: Major burn. Aggressive fluid resuscitation required. Burn center transfer. Monitor for complications (compartment syndrome, rhabdomyolysis).',
        },
        {
          min: 40,
          max: 100,
          risk: 'Critical Burn',
          interpretation:
            'TBSA ≥40%: Critical/life-threatening burn. Burn center ICU. Massive fluid resuscitation, intubation likely, escharotomy evaluation, high mortality risk.',
        },
      ],
    },
    suggestedTreatments: {
      'Critical Burn': [
        'burn_center_transfer',
        'parkland_fluid_resuscitation',
        'intubation_airway_protection',
        'foley_catheter_urine_output_monitoring',
        'escharotomy_evaluation',
        'tetanus_prophylaxis',
      ],
      'Major Burn': [
        'burn_center_referral',
        'parkland_fluid_resuscitation',
        'wound_care_silver_sulfadiazine',
        'pain_management_iv_opioids',
        'tetanus_prophylaxis',
      ],
      'Moderate Burn': [
        'iv_fluid_resuscitation',
        'wound_care',
        'pain_management',
        'burn_center_consultation',
        'tetanus_prophylaxis',
      ],
      'Minor Burn': [
        'outpatient_wound_care',
        'topical_antimicrobials',
        'oral_analgesics',
        'burn_clinic_follow_up',
        'tetanus_prophylaxis',
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
  // Baux Score — Burn Mortality
  // Baux, 1961. Modified Baux: Age + %TBSA + 17 (if inhalation injury).
  // Uses algorithm: continuous inputs summed with conditional adjustment.
  // ---------------------------------------------------------------------------
  {
    id: 'baux_score',
    name: 'Baux Score',
    fullName: 'Baux Score (Burn Mortality)',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Simple predictor of mortality in burn patients. Original: Age + %TBSA. Modified version adds 17 points for inhalation injury.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'inhalation_injury'],
    keywords: [
      'Baux score',
      'burn mortality',
      'modified Baux',
      'inhalation injury',
      'TBSA',
      'burn prognosis',
    ],
    components: [
      {
        id: 'patient_age',
        label: 'Patient Age (years)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 0,
        max: 120,
      },
      {
        id: 'tbsa_percent',
        label: 'TBSA Burned (%)',
        type: 'number_range',
        source: 'section1',
        min: 0,
        max: 100,
      },
      {
        id: 'inhalation_injury',
        label: 'Inhalation injury present (adds 17 points in modified Baux)',
        type: 'boolean',
        value: 17,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 79,
          risk: 'Generally Survivable',
          interpretation: 'Score <80: Generally survivable with modern burn care',
        },
        {
          min: 80,
          max: 109,
          risk: 'Significant Risk',
          interpretation:
            'Score 80–109: Significant mortality risk; aggressive management warranted',
        },
        {
          min: 110,
          max: 129,
          risk: 'Near LD50',
          interpretation:
            'Score 110–120: LD50 in modern burn centers; serious prognosis discussion',
        },
        {
          min: 130,
          max: 237,
          risk: 'Near-Fatal',
          interpretation:
            'Score >130 (modified) or >140 (original): Near-uniformly fatal; consider comfort care discussion',
        },
      ],
    },
    suggestedTreatments: {
      'Near-Fatal': [
        'burn_center_transfer',
        'goals_of_care_discussion',
        'palliative_care_consultation',
        'comfort_measures',
      ],
      'Near LD50': [
        'burn_center_icu',
        'aggressive_fluid_resuscitation',
        'goals_of_care_discussion',
        'intubation_if_inhalation_injury',
      ],
      'Significant Risk': [
        'burn_center_transfer',
        'parkland_fluid_resuscitation',
        'intubation_if_inhalation_injury',
        'escharotomy_evaluation',
      ],
      'Generally Survivable': [
        'burn_center_referral_if_criteria_met',
        'fluid_resuscitation',
        'wound_care',
        'pain_management',
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

  // ---------------------------------------------------------------------------
  // KDIGO AKI Staging
  // KDIGO 2012. Algorithm: creatinine rise + urine output criteria → Stage 1/2/3.
  // ---------------------------------------------------------------------------
  {
    id: 'kdigo_aki',
    name: 'KDIGO AKI',
    fullName: 'KDIGO AKI Staging',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Standardized staging of Acute Kidney Injury (AKI) severity to guide management based on serum creatinine rise relative to baseline and/or urine output criteria.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'renal_failure', 'elevated_creatinine'],
    keywords: [
      'KDIGO',
      'AKI',
      'acute kidney injury',
      'creatinine',
      'urine output',
      'oliguria',
      'RRT',
      'renal replacement therapy',
      'nephrology',
    ],
    requiredTests: ['serum creatinine', 'urine output measurement'],
    components: [
      {
        id: 'creatinine_criteria',
        label: 'Serum Creatinine Criteria',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No significant rise (< 1.5× baseline and < 0.3 mg/dL increase)', value: 0 },
          { label: 'Stage 1: ≥0.3 mg/dL increase within 48h OR 1.5–1.9× baseline within 7 days', value: 1 },
          { label: 'Stage 2: 2.0–2.9× baseline', value: 2 },
          { label: 'Stage 3: ≥3.0× baseline OR ≥4.0 mg/dL OR initiation of RRT', value: 3 },
        ],
      },
      {
        id: 'urine_output_criteria',
        label: 'Urine Output Criteria',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Normal (>0.5 mL/kg/h)', value: 0 },
          { label: 'Stage 1: <0.5 mL/kg/h for 6–12 hours', value: 1 },
          { label: 'Stage 2: <0.5 mL/kg/h for ≥12 hours', value: 2 },
          { label: 'Stage 3: <0.3 mL/kg/h for ≥24 hours OR anuria ≥12 hours', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'No AKI',
          interpretation:
            'Does not meet KDIGO AKI criteria. Monitor renal function if risk factors present.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Stage 1',
          interpretation:
            'KDIGO AKI Stage 1: Creatinine 1.5–1.9× baseline or ≥0.3 mg/dL rise within 48h, and/or UOP <0.5 mL/kg/h for 6–12h. Identify and treat reversible causes, hold nephrotoxins, optimize volume status, monitor closely.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Stage 2',
          interpretation:
            'KDIGO AKI Stage 2: Creatinine 2.0–2.9× baseline and/or UOP <0.5 mL/kg/h for ≥12h. Above measures plus consider nephrology consultation. Monitor for indications for RRT.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Stage 3',
          interpretation:
            'KDIGO AKI Stage 3: Creatinine ≥3.0× baseline or ≥4.0 mg/dL, RRT initiation, or UOP <0.3 mL/kg/h for ≥24h or anuria ≥12h. Nephrology consultation. Evaluate RRT indications (refractory hyperkalemia, acidosis, volume overload, uremic symptoms).',
        },
      ],
    },
    suggestedTreatments: {
      'Stage 3': [
        'nephrology_consult_urgent',
        'rrt_evaluation',
        'hold_nephrotoxins',
        'optimize_volume_status',
        'correct_hyperkalemia',
        'icu_admission',
      ],
      'Stage 2': [
        'nephrology_consultation',
        'hold_nephrotoxins',
        'optimize_volume_status',
        'strict_io_monitoring',
        'renal_dosing_medications',
      ],
      'Stage 1': [
        'hold_nephrotoxins',
        'volume_assessment_and_optimization',
        'serial_creatinine_monitoring',
        'strict_io_monitoring',
        'renal_dosing_medications',
      ],
      'No AKI': [
        'monitor_renal_function',
        'avoid_nephrotoxins_if_at_risk',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // CKD-EPI eGFR Equation (2021 Race-Free)
  // Inker et al., NEJM 2021. Algorithm: Cr, age, sex → eGFR → CKD stage.
  // ---------------------------------------------------------------------------
  {
    id: 'ckd_epi',
    name: 'CKD-EPI',
    fullName: 'CKD-EPI Equation (2021 Race-Free)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Estimates GFR for classification of chronic kidney disease using the 2021 race-free creatinine equation based on serum creatinine, age, and sex.',
    applicableChiefComplaints: ['chronic_kidney_disease', 'renal_failure', 'elevated_creatinine', 'drug_dosing'],
    keywords: [
      'CKD-EPI',
      'eGFR',
      'GFR',
      'chronic kidney disease',
      'renal function',
      'creatinine clearance',
      'CKD staging',
      '2021',
    ],
    requiredTests: ['serum creatinine'],
    components: [
      {
        id: 'serum_creatinine',
        label: 'Serum Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.1,
        max: 25,
      },
      {
        id: 'patient_age',
        label: 'Patient Age (years)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 18,
        max: 120,
      },
      {
        id: 'patient_sex',
        label: 'Patient Sex',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female', value: 0 },
          { label: 'Male', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 14,
          risk: 'G5 - Kidney Failure',
          interpretation: 'eGFR <15: Kidney failure; dialysis or transplant evaluation',
        },
        {
          min: 15,
          max: 29,
          risk: 'G4 - Severely Decreased',
          interpretation:
            'eGFR 15–29: Severely decreased; nephrology follow-up, dialysis preparation',
        },
        {
          min: 30,
          max: 44,
          risk: 'G3b - Moderately-Severely Decreased',
          interpretation: 'eGFR 30–44: Moderately to severely decreased',
        },
        {
          min: 45,
          max: 59,
          risk: 'G3a - Mildly-Moderately Decreased',
          interpretation: 'eGFR 45–59: Mildly to moderately decreased',
        },
        {
          min: 60,
          max: 89,
          risk: 'G2 - Mildly Decreased',
          interpretation:
            'eGFR 60–89: Mildly decreased (CKD only if other markers present)',
        },
        {
          min: 90,
          max: 200,
          risk: 'G1 - Normal/High',
          interpretation:
            'eGFR ≥90: Normal or high (CKD only if other markers of kidney damage present)',
        },
      ],
    },
    suggestedTreatments: {
      'G5 - Kidney Failure': [
        'nephrology_consult_urgent',
        'dialysis_evaluation',
        'transplant_referral',
        'renal_diet',
        'medication_dose_adjustment',
      ],
      'G4 - Severely Decreased': [
        'nephrology_referral',
        'dialysis_access_planning',
        'renal_diet',
        'medication_dose_adjustment',
        'avoid_nephrotoxins',
      ],
      'G3b - Moderately-Severely Decreased': [
        'nephrology_referral',
        'bp_optimization',
        'medication_dose_adjustment',
        'avoid_nephrotoxins',
      ],
      'G3a - Mildly-Moderately Decreased': [
        'pcp_monitoring',
        'bp_optimization',
        'avoid_nephrotoxins',
        'annual_egfr_monitoring',
      ],
      'G2 - Mildly Decreased': [
        'pcp_monitoring',
        'address_underlying_cause',
        'annual_egfr_monitoring',
      ],
      'G1 - Normal/High': [
        'routine_monitoring',
        'address_proteinuria_if_present',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Cockcroft-Gault Equation
  // Cockcroft & Gault, 1976. CrCl = [(140 - age) × weight] / (72 × SCr) × 0.85 if female.
  // ---------------------------------------------------------------------------
  {
    id: 'cockcroft_gault',
    name: 'Cockcroft-Gault',
    fullName: 'Cockcroft-Gault Equation',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Estimates creatinine clearance (CrCl) for drug dosing. Still widely used for medication dose adjustments when package inserts reference CrCl.',
    applicableChiefComplaints: ['drug_dosing', 'renal_dosing', 'chronic_kidney_disease'],
    keywords: [
      'Cockcroft-Gault',
      'creatinine clearance',
      'CrCl',
      'drug dosing',
      'renal dosing',
      'medication adjustment',
    ],
    requiredTests: ['serum creatinine', 'weight'],
    components: [
      {
        id: 'patient_age',
        label: 'Patient Age (years)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 18,
        max: 120,
      },
      {
        id: 'patient_weight',
        label: 'Patient Weight (kg)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 20,
        max: 300,
      },
      {
        id: 'serum_creatinine',
        label: 'Serum Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.1,
        max: 25,
      },
      {
        id: 'patient_sex',
        label: 'Patient Sex (multiply by 0.85 if female)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female (× 0.85)', value: 0 },
          { label: 'Male', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 15,
          risk: 'Severe Impairment',
          interpretation:
            'CrCl <15: Severe impairment; most renally-cleared drugs require significant dose reduction or avoidance',
        },
        {
          min: 16,
          max: 29,
          risk: 'Moderate-Severe',
          interpretation:
            'CrCl 16–29: Moderate-severe impairment; substantial dose adjustment required',
        },
        {
          min: 30,
          max: 59,
          risk: 'Moderate',
          interpretation:
            'CrCl 30–59: Moderate impairment; dose adjustment per drug-specific guidance',
        },
        {
          min: 60,
          max: 200,
          risk: 'Mild/Normal',
          interpretation:
            'CrCl ≥60: Mild impairment or normal; standard dosing or minor adjustment per drug label',
        },
      ],
    },
    suggestedTreatments: {
      'Severe Impairment': [
        'nephrology_consult',
        'avoid_renally_cleared_drugs',
        'significant_dose_reduction',
        'monitor_drug_levels',
      ],
      'Moderate-Severe': [
        'renal_dose_adjustment',
        'avoid_nephrotoxins',
        'monitor_drug_levels',
        'pharmacy_consult',
      ],
      Moderate: [
        'renal_dose_adjustment_per_drug_label',
        'avoid_nephrotoxins',
        'monitor_renal_function',
      ],
      'Mild/Normal': [
        'standard_dosing',
        'check_drug_label_for_minor_adjustments',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // FENa — Fractional Excretion of Sodium
  // Espinel, 1976. Formula: (UNa × PCr) / (PNa × UCr) × 100
  // Differentiates prerenal from intrinsic AKI.
  // ---------------------------------------------------------------------------
  {
    id: 'fena',
    name: 'FENa',
    fullName: 'Fractional Excretion of Sodium (FENa)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Differentiates prerenal azotemia from intrinsic renal injury (ATN) in oliguric AKI. Unreliable with diuretic use; use FEUrea instead in those cases.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
    keywords: [
      'FENa',
      'fractional excretion of sodium',
      'prerenal',
      'ATN',
      'acute tubular necrosis',
      'AKI differentiation',
      'urine sodium',
    ],
    requiredTests: ['urine sodium', 'serum sodium', 'urine creatinine', 'serum creatinine'],
    components: [
      {
        id: 'urine_sodium',
        label: 'Urine Sodium (mEq/L)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 300,
      },
      {
        id: 'serum_sodium',
        label: 'Serum Sodium (mEq/L)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 100,
        max: 180,
      },
      {
        id: 'urine_creatinine',
        label: 'Urine Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 1,
        max: 500,
      },
      {
        id: 'serum_creatinine',
        label: 'Serum Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.1,
        max: 25,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Prerenal',
          interpretation:
            'FENa <1%: Prerenal azotemia; kidney retaining sodium appropriately. Treat underlying cause (volume depletion, heart failure, hepatorenal syndrome). If on diuretics, use FEUrea instead.',
        },
        {
          min: 1,
          max: 2,
          risk: 'Indeterminate',
          interpretation:
            'FENa 1–2%: Indeterminate; clinical correlation required. May be early ATN transitioning from prerenal state, or post-obstructive AKI.',
        },
        {
          min: 2,
          max: 100,
          risk: 'Intrinsic Renal',
          interpretation:
            'FENa >2%: Intrinsic renal disease (ATN most common); tubular sodium wasting indicates tubular injury. Note: contrast nephropathy, myoglobinuria, and early obstruction may also have low FENa despite intrinsic injury.',
        },
      ],
    },
    suggestedTreatments: {
      Prerenal: [
        'iv_fluid_resuscitation',
        'treat_underlying_cause',
        'hold_diuretics',
        'hold_ace_arb_nsaids',
        'serial_creatinine_monitoring',
      ],
      Indeterminate: [
        'volume_challenge_if_hypovolemic',
        'serial_creatinine_monitoring',
        'consider_feurea_if_on_diuretics',
        'nephrology_consultation_if_worsening',
      ],
      'Intrinsic Renal': [
        'nephrology_consultation',
        'hold_nephrotoxins',
        'supportive_care',
        'monitor_for_rrt_indications',
        'renal_dosing_medications',
      ],
    },
  },
]
