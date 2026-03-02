import type { CdrSeed } from './types'

/**
 * Batch 20 — Orthopedic, Rheumatology, Geriatrics & Palliative CDRs (final batch)
 *
 * Covers: Garden Classification (Hip), Jones Criteria, ACR/EULAR RA Criteria,
 *         4AT Delirium Screen, Braden Scale, Morse Fall Scale,
 *         PPI, PPS, PaP Score
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published literature.
 *
 * Sources:
 *  - Garden Classification: Garden RS, J Bone Joint Surg Br 1961
 *  - Jones Criteria: Gewitz et al., Circulation 2015 (AHA revision)
 *  - ACR/EULAR RA: Aletaha et al., Arthritis Rheum 2010
 *  - 4AT: Bellelli et al., Age Ageing 2014
 *  - Braden Scale: Bergstrom et al., Nurs Res 1987
 *  - Morse Fall Scale: Morse et al., West J Nurs Res 1989
 *  - PPI: Morita et al., J Pain Symptom Manage 1999
 *  - PPS: Anderson et al., J Palliat Care 1996 (Victoria Hospice Society)
 *  - PaP Score: Pirovano et al., J Clin Oncol 1999; Maltoni et al., J Clin Oncol 1999
 */

export const batch20OrthoGeriPallCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Garden Classification for Hip Fractures
  // Single select — classifies femoral neck fracture displacement (Type I–IV)
  // ---------------------------------------------------------------------------
  {
    id: 'garden_hip',
    name: 'Garden Classification',
    fullName: 'Garden Classification (Hip Fractures)',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application:
      'Classifies femoral neck fractures by displacement to guide surgical management (internal fixation vs. arthroplasty). Garden III–IV carry high risk of avascular necrosis.',
    applicableChiefComplaints: ['hip_fracture', 'hip_pain', 'fall_injury', 'trauma'],
    keywords: [
      'Garden',
      'femoral neck fracture',
      'hip fracture',
      'avascular necrosis',
      'AVN',
      'hemiarthroplasty',
      'total hip arthroplasty',
      'intracapsular fracture',
    ],
    requiredTests: ['plain radiographs (hip AP and lateral)'],
    components: [
      {
        id: 'garden_type',
        label: 'Garden Type',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Type I — Incomplete / valgus impacted (trabeculae angulated but intact)', value: 1 },
          { label: 'Type II — Complete but non-displaced (trabeculae interrupted, no shift)', value: 2 },
          { label: 'Type III — Complete, partially displaced (femoral head rotated, some contact)', value: 3 },
          { label: 'Type IV — Complete, fully displaced (no contact between fragments)', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 2,
          risk: 'Non-Displaced',
          interpretation:
            'Garden I–II: Non-displaced; lower AVN risk; internal fixation with cannulated screws preferred',
        },
        {
          min: 3,
          max: 4,
          risk: 'Displaced',
          interpretation:
            'Garden III–IV: Displaced; high AVN risk (20–35%); arthroplasty (hemiarthroplasty vs THA based on age/activity)',
        },
      ],
    },
    suggestedTreatments: {
      'Non-Displaced': ['cannulated_screw_fixation', 'ortho_consult', 'non_weight_bearing'],
      Displaced: ['arthroplasty', 'ortho_consult', 'admit_surgical'],
    },
  },

  // ---------------------------------------------------------------------------
  // Jones Criteria for Acute Rheumatic Fever
  // Algorithm — 5 major + 4 minor criteria with evidence of preceding GAS infection
  // Diagnosis: 2 major OR 1 major + 2 minor (+ GAS evidence)
  // ---------------------------------------------------------------------------
  {
    id: 'jones_criteria',
    name: 'Jones Criteria',
    fullName: 'Jones Criteria (Acute Rheumatic Fever)',
    category: 'RHEUMATOLOGY',
    application:
      'Diagnoses initial attack of acute rheumatic fever (ARF) following Group A streptococcal pharyngitis. Requires evidence of preceding GAS infection plus major/minor criteria.',
    applicableChiefComplaints: ['joint_pain', 'fever', 'carditis', 'chorea', 'rheumatic_fever'],
    keywords: [
      'Jones criteria',
      'acute rheumatic fever',
      'ARF',
      'Group A strep',
      'carditis',
      'chorea',
      'Sydenham',
      'erythema marginatum',
      'ASO',
      'anti-DNase B',
    ],
    requiredTests: ['throat culture', 'rapid strep test', 'ASO titer', 'anti-DNase B', 'ESR', 'CRP', 'ECG', 'echo'],
    components: [
      // --- Major Criteria (each = 1 major criterion) ---
      {
        id: 'carditis',
        label: 'Carditis (clinical or subclinical on echo)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'polyarthritis',
        label: 'Polyarthritis (migratory, large joints)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'chorea',
        label: 'Sydenham chorea (involuntary purposeless movements)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'erythema_marginatum',
        label: 'Erythema marginatum (non-pruritic, evanescent pink rings on trunk/extremities)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'subcutaneous_nodules',
        label: 'Subcutaneous nodules (firm, painless, over bony prominences)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // --- Minor Criteria (each = 1 minor criterion) ---
      {
        id: 'arthralgia',
        label: 'Minor: Arthralgia (only if polyarthritis not counted)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'fever',
        label: 'Minor: Fever (>=38.5 C / 101.3 F)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'elevated_esr_crp',
        label: 'Minor: Elevated ESR (>=60 mm/hr) or CRP (>=3.0 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'prolonged_pr',
        label: 'Minor: Prolonged PR interval (only if carditis not counted)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      // --- Evidence of preceding GAS infection ---
      {
        id: 'gas_evidence',
        label: 'Evidence of preceding GAS infection (positive culture, rapid strep, elevated/rising ASO or anti-DNase B)',
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
          min: 0,
          max: 0,
          risk: 'Not Met',
          interpretation: 'Criteria not met for ARF diagnosis',
        },
        {
          min: 1,
          max: 9,
          risk: 'Possible ARF',
          interpretation:
            'Evaluate criteria: requires 2 major OR 1 major + 2 minor criteria PLUS evidence of preceding GAS infection. Chorea alone is sufficient if other causes excluded.',
        },
      ],
    },
    suggestedTreatments: {
      'Possible ARF': [
        'penicillin_v_or_amoxicillin',
        'aspirin_anti_inflammatory',
        'echo',
        'rheumatology_consult',
        'secondary_prophylaxis',
      ],
      'Not Met': ['monitor_and_reassess', 'alternative_diagnosis'],
    },
  },

  // ---------------------------------------------------------------------------
  // ACR/EULAR 2010 RA Classification Criteria
  // Sum: 4 domains — joint involvement (0–5), serology (0–3),
  //   acute phase reactants (0–1), duration (0–1); max 10; >=6 = definite RA
  // ---------------------------------------------------------------------------
  {
    id: 'acr_eular_ra',
    name: 'ACR/EULAR RA Criteria',
    fullName: 'ACR/EULAR 2010 Rheumatoid Arthritis Classification Criteria',
    category: 'RHEUMATOLOGY',
    application:
      'Classifies definite RA in patients with at least 1 joint with synovitis not better explained by another disease. Score >=6/10 defines definite RA.',
    applicableChiefComplaints: ['joint_swelling', 'polyarthritis', 'rheumatoid_arthritis', 'inflammatory_arthritis'],
    keywords: [
      'ACR',
      'EULAR',
      'rheumatoid arthritis',
      'RA classification',
      'RF',
      'anti-CCP',
      'synovitis',
      'DMARD',
      '2010 criteria',
    ],
    requiredTests: ['RF', 'anti-CCP', 'CRP', 'ESR', 'joint examination'],
    components: [
      {
        id: 'joint_involvement',
        label: 'Joint Involvement',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 large joint (shoulder, elbow, hip, knee, ankle)', value: 0 },
          { label: '2–10 large joints', value: 1 },
          { label: '1–3 small joints (MCP, PIP, MTP, thumb IP, wrist)', value: 2 },
          { label: '4–10 small joints', value: 3 },
          { label: '>10 joints (at least 1 small joint)', value: 5 },
        ],
      },
      {
        id: 'serology',
        label: 'Serology (RF and anti-CCP)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Negative RF AND negative anti-CCP', value: 0 },
          { label: 'Low-positive RF OR low-positive anti-CCP (<=3x ULN)', value: 2 },
          { label: 'High-positive RF OR high-positive anti-CCP (>3x ULN)', value: 3 },
        ],
      },
      {
        id: 'acute_phase_reactants',
        label: 'Acute Phase Reactants',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Normal CRP AND normal ESR', value: 0 },
          { label: 'Abnormal CRP OR abnormal ESR', value: 1 },
        ],
      },
      {
        id: 'duration',
        label: 'Duration of Symptoms',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<6 weeks', value: 0 },
          { label: '>=6 weeks', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 5,
          risk: 'Not Classifiable',
          interpretation: 'Score <6: Not classifiable as RA at this time; monitor and reassess',
        },
        {
          min: 6,
          max: 10,
          risk: 'Definite RA',
          interpretation: 'Score >=6: Definite RA; initiate disease-modifying therapy (DMARD)',
        },
      ],
    },
    suggestedTreatments: {
      'Definite RA': ['methotrexate', 'rheumatology_consult', 'baseline_labs', 'xrays_hands_feet'],
      'Not Classifiable': ['monitor_and_reassess', 'nsaids_symptomatic', 'follow_up_rheumatology'],
    },
  },

  // ---------------------------------------------------------------------------
  // 4AT Delirium Screen
  // Sum: 4 components — Alertness (0/4), AMT4 (0/1/2), Attention (0/1/2),
  //   Acute change (0/4); max 12
  // ---------------------------------------------------------------------------
  {
    id: '4at',
    name: '4AT',
    fullName: '4AT (Rapid Clinical Test for Delirium)',
    category: 'GERIATRICS & DELIRIUM',
    application:
      'Rapid (<2 minutes) bedside delirium screening tool that does not require special training to administer. Assesses alertness, orientation, attention, and acute change.',
    applicableChiefComplaints: ['delirium', 'altered_mental_status', 'confusion', 'cognitive_impairment'],
    keywords: [
      '4AT',
      'delirium screening',
      'rapid delirium',
      'AMT4',
      'alertness',
      'attention',
      'months backward',
      'acute confusion',
    ],
    components: [
      {
        id: 'alertness',
        label: 'Item 1: Alertness',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal — fully alert, not agitated, throughout assessment', value: 0 },
          { label: 'Abnormal — clearly abnormal alertness (mild sleepiness for <10s after waking, or hyperalert/agitated/drowsy)', value: 4 },
        ],
      },
      {
        id: 'amt4',
        label: 'Item 2: AMT4 (Abbreviated Mental Test — 4 items: age, DOB, place, current year)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No mistakes', value: 0 },
          { label: '1 mistake', value: 1 },
          { label: '2 or more mistakes / untestable', value: 2 },
        ],
      },
      {
        id: 'attention',
        label: 'Item 3: Attention (ask patient to name months of year backwards from December)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Achieves 7 months or more correctly', value: 0 },
          { label: 'Starts but scores <7 months / refuses to start', value: 1 },
          { label: 'Untestable (unwell, drowsy, inattentive)', value: 2 },
        ],
      },
      {
        id: 'acute_change',
        label: 'Item 4: Acute change or fluctuating course',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes (evidence of significant change or fluctuation in alertness, cognition, or other mental function)', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Unlikely',
          interpretation: 'Score 0: Delirium or severe cognitive impairment unlikely',
        },
        {
          min: 1,
          max: 3,
          risk: 'Possible Cognitive Impairment',
          interpretation: 'Score 1–3: Possible cognitive impairment; further assessment needed',
        },
        {
          min: 4,
          max: 12,
          risk: 'Possible Delirium',
          interpretation:
            'Score >=4: Possible delirium (+/- cognitive impairment); sensitivity ~89%, specificity ~88%; full clinical assessment required',
        },
      ],
    },
    suggestedTreatments: {
      'Possible Delirium': [
        'identify_underlying_cause',
        'medication_review',
        'reorientation',
        'avoid_sedatives',
        'geriatrics_consult',
      ],
      'Possible Cognitive Impairment': ['formal_cognitive_testing', 'delirium_workup_if_acute'],
    },
  },

  // ---------------------------------------------------------------------------
  // Braden Scale for Pressure Injury Risk
  // Sum: 6 subscales — sensory perception (1–4), moisture (1–4), activity (1–4),
  //   mobility (1–4), nutrition (1–4), friction/shear (1–3); range 6–23
  //   Lower score = higher risk
  // ---------------------------------------------------------------------------
  {
    id: 'braden_scale',
    name: 'Braden Scale',
    fullName: 'Braden Scale (Pressure Injury Risk)',
    category: 'GERIATRICS & DELIRIUM',
    application:
      'Predicts risk of pressure injury (pressure ulcer) development in hospitalized and long-term care patients using 6 subscales. Lower scores indicate higher risk.',
    applicableChiefComplaints: ['pressure_injury', 'immobility', 'wound_prevention', 'long_term_care'],
    keywords: [
      'Braden',
      'pressure ulcer',
      'pressure injury',
      'decubitus',
      'sensory perception',
      'moisture',
      'mobility',
      'nutrition',
      'friction shear',
    ],
    components: [
      {
        id: 'sensory_perception',
        label: 'Sensory Perception (ability to respond to pressure-related discomfort)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Completely limited (unresponsive to painful stimuli / limited ability to feel over most of body)', value: 1 },
          { label: '2 — Very limited (responds only to painful stimuli / impaired sensation over half of body)', value: 2 },
          { label: '3 — Slightly limited (responds to verbal commands but cannot always communicate discomfort)', value: 3 },
          { label: '4 — No impairment (responds to verbal commands, has no sensory deficit)', value: 4 },
        ],
      },
      {
        id: 'moisture',
        label: 'Moisture (degree to which skin is exposed to moisture)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Constantly moist (skin is kept moist almost constantly)', value: 1 },
          { label: '2 — Very moist (skin is often but not always moist; linen change at least once per shift)', value: 2 },
          { label: '3 — Occasionally moist (skin occasionally moist; linen change approximately once a day)', value: 3 },
          { label: '4 — Rarely moist (skin usually dry; linen only requires routine changing)', value: 4 },
        ],
      },
      {
        id: 'activity',
        label: 'Activity (degree of physical activity)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Bedfast (confined to bed)', value: 1 },
          { label: '2 — Chairfast (ability to walk severely limited or non-existent; cannot bear own weight)', value: 2 },
          { label: '3 — Walks occasionally (walks occasionally during day but very short distances)', value: 3 },
          { label: '4 — Walks frequently (walks outside room at least twice/day and inside room at least every 2 hours)', value: 4 },
        ],
      },
      {
        id: 'mobility',
        label: 'Mobility (ability to change and control body position)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Completely immobile (does not make even slight changes in position without assistance)', value: 1 },
          { label: '2 — Very limited (makes occasional slight changes but unable to make frequent or significant changes independently)', value: 2 },
          { label: '3 — Slightly limited (makes frequent though slight changes in position independently)', value: 3 },
          { label: '4 — No limitations (makes major and frequent changes in position without assistance)', value: 4 },
        ],
      },
      {
        id: 'nutrition',
        label: 'Nutrition (usual food intake pattern)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Very poor (never eats a complete meal; rarely eats >1/3 of food offered; <=2 servings protein/day)', value: 1 },
          { label: '2 — Probably inadequate (rarely eats complete meal; generally eats about half of food offered; 3 servings protein/day)', value: 2 },
          { label: '3 — Adequate (eats over half of most meals; 4 servings protein/day; occasionally refuses a meal)', value: 3 },
          { label: '4 — Excellent (eats most of every meal; never refuses a meal; eats >=4 servings protein/day)', value: 4 },
        ],
      },
      {
        id: 'friction_shear',
        label: 'Friction and Shear',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '1 — Problem (requires moderate to maximum assistance in moving; complete lifting without sliding against sheets impossible; frequently slides down in bed/chair)', value: 1 },
          { label: '2 — Potential problem (moves feebly or requires minimum assistance; during move skin probably slides to some extent)', value: 2 },
          { label: '3 — No apparent problem (moves in bed and in chair independently; has sufficient muscle strength to lift up completely during move)', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 6,
          max: 9,
          risk: 'Very High Risk',
          interpretation: 'Score <=9: Very high risk; aggressive pressure injury prevention protocol',
        },
        {
          min: 10,
          max: 12,
          risk: 'High Risk',
          interpretation: 'Score 10–12: High risk; implement pressure injury prevention protocol',
        },
        {
          min: 13,
          max: 14,
          risk: 'Moderate Risk',
          interpretation: 'Score 13–14: Moderate risk; prevention measures indicated',
        },
        {
          min: 15,
          max: 18,
          risk: 'Mild Risk',
          interpretation: 'Score 15–18: Mild risk; standard prevention; reassess regularly',
        },
        {
          min: 19,
          max: 23,
          risk: 'Low Risk',
          interpretation: 'Score 19–23: No or minimal risk; routine care',
        },
      ],
    },
    suggestedTreatments: {
      'Very High Risk': [
        'specialty_mattress',
        'reposition_q1h',
        'nutrition_consult',
        'wound_care_consult',
        'heel_elevation',
        'moisture_barrier',
      ],
      'High Risk': [
        'pressure_redistribution_surface',
        'reposition_q2h',
        'nutrition_optimization',
        'skin_inspection_daily',
      ],
      'Moderate Risk': ['reposition_q2h', 'foam_mattress', 'nutritional_support'],
      'Mild Risk': ['standard_prevention', 'reposition_q2_4h', 'reassess_regularly'],
    },
  },

  // ---------------------------------------------------------------------------
  // Morse Fall Scale
  // Sum: 6 items — fall history (0/25), secondary dx (0/15),
  //   ambulatory aid (0/15/30), IV/heparin lock (0/20),
  //   gait (0/10/20), mental status (0/15); range 0–125
  // ---------------------------------------------------------------------------
  {
    id: 'morse_fall_scale',
    name: 'Morse Fall Scale',
    fullName: 'Morse Fall Scale',
    category: 'GERIATRICS & DELIRIUM',
    application:
      'Identifies hospitalized patients at risk for falls using 6 items in a quick bedside assessment. Score >=45 indicates high fall risk requiring enhanced prevention protocol.',
    applicableChiefComplaints: ['fall_risk', 'falls', 'gait_instability', 'hospitalized_patient'],
    keywords: [
      'Morse Fall Scale',
      'fall risk',
      'fall prevention',
      'gait',
      'ambulatory aid',
      'history of falls',
      'mental status',
    ],
    components: [
      {
        id: 'fall_history',
        label: 'History of falling (immediate or within past 3 months)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes', value: 25 },
        ],
      },
      {
        id: 'secondary_diagnosis',
        label: 'Secondary diagnosis (>=2 medical diagnoses)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes', value: 15 },
        ],
      },
      {
        id: 'ambulatory_aid',
        label: 'Ambulatory aid',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None / bed rest / nurse assist', value: 0 },
          { label: 'Crutches / cane / walker', value: 15 },
          { label: 'Furniture (holds onto furniture for support)', value: 30 },
        ],
      },
      {
        id: 'iv_heparin_lock',
        label: 'IV / heparin lock',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes', value: 20 },
        ],
      },
      {
        id: 'gait',
        label: 'Gait / transferring',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal / bed rest / wheelchair', value: 0 },
          { label: 'Weak (stooped but able to lift head while walking; shuffling, short steps)', value: 10 },
          { label: 'Impaired (cannot rise without assistance; requires cane/walker but deviates, has unsteady gait, grabs furniture)', value: 20 },
        ],
      },
      {
        id: 'mental_status',
        label: 'Mental status',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Oriented to own ability (knows limitations)', value: 0 },
          { label: 'Overestimates ability / forgets limitations', value: 15 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 24,
          risk: 'Low Risk',
          interpretation: 'Score 0–24: Low fall risk; standard fall prevention measures',
        },
        {
          min: 25,
          max: 44,
          risk: 'Moderate Risk',
          interpretation: 'Score 25–44: Moderate fall risk; implement fall prevention interventions',
        },
        {
          min: 45,
          max: 125,
          risk: 'High Risk',
          interpretation: 'Score >=45: High fall risk; implement high-risk fall prevention protocol',
        },
      ],
    },
    suggestedTreatments: {
      'High Risk': [
        'fall_precaution_sign',
        'bed_alarm',
        'non_slip_footwear',
        'toileting_schedule',
        'low_bed_position',
        'pt_ot_consult',
      ],
      'Moderate Risk': [
        'fall_precaution_sign',
        'assistive_device',
        'non_slip_footwear',
        'call_light_in_reach',
      ],
      'Low Risk': ['standard_fall_prevention', 'education'],
    },
  },

  // ---------------------------------------------------------------------------
  // Palliative Prognostic Index (PPI)
  // Sum: 5 components — PPS (0/2.5/4), oral intake (0/1/2.5),
  //   edema (0/1), dyspnea at rest (0/3.5), delirium (0/4); max 15
  // ---------------------------------------------------------------------------
  {
    id: 'ppi',
    name: 'PPI',
    fullName: 'Palliative Prognostic Index (PPI)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application:
      'Predicts survival in terminally ill cancer patients using entirely clinical variables (no laboratory data required). PPI >6 predicts survival <3 weeks and is a strong consideration for hospice referral.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'hospice_referral', 'goals_of_care'],
    keywords: [
      'PPI',
      'Palliative Prognostic Index',
      'survival prediction',
      'terminal cancer',
      'hospice',
      'palliative performance scale',
      'dyspnea',
      'delirium',
      'edema',
    ],
    components: [
      {
        id: 'pps_component',
        label: 'Palliative Performance Scale (PPS)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'PPS 10–20% (bed-bound, total care, minimal/no intake)', value: 4 },
          { label: 'PPS 30–50% (mainly bed-bound, considerable assistance, reduced intake)', value: 2.5 },
          { label: 'PPS >=60% (ambulatory, reduced to normal intake)', value: 0 },
        ],
      },
      {
        id: 'oral_intake',
        label: 'Oral intake',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Moderately reduced (reduced but more than mouthfuls)', value: 1 },
          { label: 'Severely reduced (mouthfuls or less)', value: 2.5 },
        ],
      },
      {
        id: 'edema',
        label: 'Edema',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 1 },
        ],
      },
      {
        id: 'dyspnea_at_rest',
        label: 'Dyspnea at rest',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 3.5 },
        ],
      },
      {
        id: 'delirium',
        label: 'Delirium',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present (e.g., agitation, drowsiness with cognitive failure, hallucinations)', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 3.5,
          risk: 'Longer Survival',
          interpretation: 'PPI <4.0: Predicted survival >6 weeks (sensitivity 79%, specificity 77%)',
        },
        {
          min: 4,
          max: 6,
          risk: 'Intermediate',
          interpretation: 'PPI 4.0–6.0: Predicted survival 3–6 weeks',
        },
        {
          min: 6.5,
          max: 15,
          risk: 'Short Survival',
          interpretation:
            'PPI >6.0: Predicted survival <3 weeks (sensitivity 83%, specificity 85%); strong consideration for hospice referral',
        },
      ],
    },
    suggestedTreatments: {
      'Short Survival': ['hospice_referral', 'goals_of_care_discussion', 'comfort_measures', 'family_meeting'],
      Intermediate: ['palliative_care_consult', 'advance_care_planning', 'symptom_management'],
      'Longer Survival': ['disease_directed_therapy_if_appropriate', 'palliative_care_integration'],
    },
  },

  // ---------------------------------------------------------------------------
  // Palliative Performance Scale (PPS)
  // Select: single value 0–100 in 10-point increments
  // Based on ambulation, activity/evidence of disease, self-care, intake, consciousness
  // ---------------------------------------------------------------------------
  {
    id: 'pps',
    name: 'PPS',
    fullName: 'Palliative Performance Scale (PPS)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application:
      'Measures functional status in palliative care patients on a 0–100% scale across ambulation, activity, self-care, intake, and conscious level. Component of PPI; decline >=30% over 1–2 months suggests weeks prognosis.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'functional_decline', 'palliative_care'],
    keywords: [
      'PPS',
      'Palliative Performance Scale',
      'functional status',
      'end of life',
      'palliative',
      'hospice',
      'ambulation',
      'self-care',
      'intake',
    ],
    components: [
      {
        id: 'pps_level',
        label: 'PPS Level',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '100% — Full ambulation, normal activity, full self-care, normal intake, fully conscious', value: 100 },
          { label: '90% — Full ambulation, normal activity with effort, full self-care, normal intake, fully conscious', value: 90 },
          { label: '80% — Full ambulation, normal activity with effort, full self-care, normal or reduced intake, fully conscious', value: 80 },
          { label: '70% — Reduced ambulation, unable to do normal job/work, full self-care, normal or reduced intake, fully conscious', value: 70 },
          { label: '60% — Reduced ambulation, unable to do hobbies/housework, occasional assistance needed, normal or reduced intake, full or confusion', value: 60 },
          { label: '50% — Mainly sit/lie, unable to do any work, considerable assistance, normal or reduced intake, full or confusion', value: 50 },
          { label: '40% — Mainly in bed, unable to do most activity, mainly assistance, normal or reduced intake, full or drowsy +/- confusion', value: 40 },
          { label: '30% — Totally bed-bound, unable to do any activity, total care, reduced intake, full or drowsy +/- confusion', value: 30 },
          { label: '20% — Totally bed-bound, unable to do any activity, total care, minimal sips, full or drowsy +/- confusion', value: 20 },
          { label: '10% — Totally bed-bound, unable to do any activity, total care, mouth care only, drowsy or coma', value: 10 },
          { label: '0% — Death', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 30,
          risk: 'Nearing End of Life',
          interpretation:
            'PPS 0–30%: Nearing end of life; hospice appropriate; median survival days to weeks',
        },
        {
          min: 40,
          max: 60,
          risk: 'Significant Decline',
          interpretation:
            'PPS 40–60%: Significant functional decline; transition conversations appropriate; median survival weeks to months',
        },
        {
          min: 70,
          max: 100,
          risk: 'Relatively Preserved',
          interpretation:
            'PPS 70–100%: Relatively preserved function; may continue disease-directed therapy',
        },
      ],
    },
    suggestedTreatments: {
      'Nearing End of Life': ['hospice_referral', 'comfort_measures', 'family_meeting', 'advance_directive_review'],
      'Significant Decline': ['palliative_care_consult', 'advance_care_planning', 'symptom_management'],
      'Relatively Preserved': ['disease_directed_therapy', 'early_palliative_integration', 'functional_assessment'],
    },
  },

  // ---------------------------------------------------------------------------
  // PaP Score (Palliative Prognostic Score)
  // Sum: 6 components — dyspnea (0/1), anorexia (0/1.5), KPS (0/2.5),
  //   clinical prediction of survival (0/2/2.5/4.5/6/8.5),
  //   WBC (0/0.5/1.5), lymphocyte % (0/1/2.5); max 17.5
  // ---------------------------------------------------------------------------
  {
    id: 'pap_score',
    name: 'PaP Score',
    fullName: 'PaP Score (Palliative Prognostic Score)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application:
      'Predicts 30-day survival in terminally ill cancer patients using clinical and laboratory variables including dyspnea, anorexia, KPS, clinical prediction of survival, WBC, and lymphocyte percentage.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'goals_of_care', 'prognosis'],
    keywords: [
      'PaP score',
      'Palliative Prognostic Score',
      '30-day survival',
      'terminal cancer',
      'prognosis',
      'hospice',
      'dyspnea',
      'anorexia',
      'lymphocyte',
    ],
    requiredTests: ['WBC with differential', 'clinical prediction of survival'],
    components: [
      {
        id: 'dyspnea',
        label: 'Dyspnea',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 1 },
        ],
      },
      {
        id: 'anorexia',
        label: 'Anorexia',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 1.5 },
        ],
      },
      {
        id: 'kps',
        label: 'Karnofsky Performance Status (KPS)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'KPS >=30 (able to do limited self-care or better)', value: 0 },
          { label: 'KPS 10–20 (very disabled; hospital admission necessary; moribund)', value: 2.5 },
        ],
      },
      {
        id: 'clinical_prediction',
        label: 'Clinical Prediction of Survival (CPS)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: '>12 weeks', value: 0 },
          { label: '11–12 weeks', value: 2 },
          { label: '9–10 weeks', value: 2.5 },
          { label: '7–8 weeks', value: 2.5 },
          { label: '5–6 weeks', value: 4.5 },
          { label: '3–4 weeks', value: 6 },
          { label: '1–2 weeks', value: 8.5 },
        ],
      },
      {
        id: 'wbc',
        label: 'Total WBC count',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Normal (4,800–8,500)', value: 0 },
          { label: 'High (8,501–11,000)', value: 0.5 },
          { label: 'Very high (>11,000)', value: 1.5 },
        ],
      },
      {
        id: 'lymphocyte_pct',
        label: 'Lymphocyte percentage',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Normal (20–40%)', value: 0 },
          { label: 'Low (12–19.9%)', value: 1 },
          { label: 'Very low (<12%)', value: 2.5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 5.5,
          risk: 'Group A',
          interpretation: 'PaP 0–5.5 (Group A): >70% probability of 30-day survival',
        },
        {
          min: 5.6,
          max: 11,
          risk: 'Group B',
          interpretation: 'PaP 5.6–11.0 (Group B): 30–70% probability of 30-day survival',
        },
        {
          min: 11.1,
          max: 17.5,
          risk: 'Group C',
          interpretation:
            'PaP 11.1–17.5 (Group C): <30% probability of 30-day survival; hospice referral strongly indicated',
        },
      ],
    },
    suggestedTreatments: {
      'Group C': ['hospice_referral', 'comfort_measures', 'goals_of_care_discussion', 'family_meeting'],
      'Group B': ['palliative_care_consult', 'advance_care_planning', 'reassess_in_1_2_weeks'],
      'Group A': ['continued_treatment_if_appropriate', 'palliative_integration', 'advance_directive_review'],
    },
  },
]
