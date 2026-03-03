import type { CdrSeed } from './types'

/**
 * Batch 8 — Cardiovascular II CDRs
 *
 * Covers: Vancouver Chest Pain Rule, ESC hs-Troponin Algorithm, HESTIA Criteria,
 *         YEARS Algorithm, SFSR, CSRS, OESIL Score, Boston Syncope Rule,
 *         FAINT Score, Ottawa Aggressive AF Protocol
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - Vancouver Chest Pain Rule: Scheuermeyer et al., Ann Emerg Med 2014
 *  - ESC hs-Troponin: Roffi et al., Eur Heart J 2016 (ESC 0/1h and 0/3h algorithms)
 *  - HESTIA Criteria: Zondag et al., J Thromb Haemost 2011
 *  - YEARS Algorithm: van der Hulle et al., Lancet 2017
 *  - SFSR: Quinn et al., Ann Emerg Med 2004
 *  - CSRS: Thiruganasambandamoorthy et al., CMAJ 2016
 *  - OESIL Score: Colivicchi et al., Eur Heart J 2003
 *  - Boston Syncope Rule: Grossman et al., J Emerg Med 2007
 *  - FAINT Score: Reed et al., Ann Emerg Med 2010
 *  - Ottawa AF Protocol: Stiell et al., CJEM 2010; Stiell et al., Ann Emerg Med 2020
 */

export const batch8CardioIiCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Vancouver Chest Pain Rule
  // Threshold-based: all 5 criteria must be met for safe early discharge
  // ---------------------------------------------------------------------------
  {
    id: 'vancouver_chest_pain',
    name: 'Vancouver Chest Pain',
    fullName: 'Vancouver Chest Pain Rule',
    category: 'CARDIOVASCULAR',
    application:
      'Identifies low-risk chest pain patients suitable for early ED discharge.',
    applicableChiefComplaints: ['chest_pain', 'atypical_chest_pain', 'acs_rule_out'],
    keywords: [
      'Vancouver chest pain rule',
      'low risk chest pain discharge',
      'ACS rule out',
      'early discharge chest pain',
      'troponin chest pain',
      'ECG ischemia',
    ],
    requiredTests: ['troponin', 'ecg'],
    components: [
      {
        id: 'abnormal_ecg',
        label: 'Abnormal initial ECG (new ST-segment depression or elevation, T-wave inversion, or Q-waves)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'positive_troponin',
        label: 'Positive troponin at 2-hour mark',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'prior_cad_nitrate',
        label: 'History of coronary artery disease or nitrate use',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'typical_pain',
        label: 'Typical ischemic chest pain (pressure/crushing, radiating to arm/jaw, exertional)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'physician_gestalt_concern',
        label: 'Emergency physician clinical concern for ACS (gestalt)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Low',
          interpretation:
            'All 5 criteria absent — Low risk for ACS (~0.8% 30-day MACE), safe for early discharge consideration.',
        },
        {
          min: 1,
          max: 5,
          risk: 'Elevated',
          interpretation:
            'Any criterion present — Further workup needed; not safe for early discharge.',
        },
      ],
    },
    suggestedTreatments: {
      Low: ['discharge_with_follow_up', 'outpatient_stress_test'],
      Elevated: ['serial_troponins', 'aspirin_325', 'cardiology_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // ESC hs-Troponin: QUARANTINED — see _quarantine/esc_hs_troponin.ts
  // Reason: Only 2 user-answerable components (ongoing_chest_pain, time_from_onset);
  // core algorithm is lab-based (hs-cTn levels). Cannot add criteria not in published source.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // HESTIA Criteria for PE
  // Threshold-based: 11 binary criteria; score 0 = safe for outpatient
  // ---------------------------------------------------------------------------
  {
    id: 'hestia',
    name: 'HESTIA',
    fullName: 'HESTIA Criteria',
    category: 'CARDIOVASCULAR',
    application:
      'Identifies PE patients safe for outpatient management. All items must be "No" for outpatient eligibility.',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism'],
    keywords: [
      'HESTIA',
      'HESTIA criteria',
      'PE outpatient',
      'pulmonary embolism discharge',
      'PE home treatment',
      'outpatient anticoagulation PE',
    ],
    requiredTests: ['creatinine clearance'],
    components: [
      {
        id: 'hemodynamic_instability',
        label: 'Hemodynamically unstable (SBP <100, requiring ICU admission, vasopressors, or thrombolysis)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'thrombolysis_embolectomy',
        label: 'Thrombolysis or embolectomy necessary',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'active_bleeding',
        label: 'Active bleeding or high risk of bleeding (GI bleeding in past 14 days, recent surgery, platelet <75k, or uncontrolled HTN >180/110)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'oxygen_supplementation',
        label: 'Requires >24 hours of supplemental oxygen to maintain SpO2 >90%',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'pe_on_anticoagulation',
        label: 'PE diagnosed while on therapeutic anticoagulation',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'severe_pain_iv',
        label: 'Severe pain requiring IV analgesics for >24 hours',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'medical_social_reason',
        label: 'Medical or social reason for admission (>24h) — infection, malignancy, no social support',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'crcl_below_30',
        label: 'Creatinine clearance <30 mL/min',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'severe_liver_disease',
        label: 'Severe liver impairment',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'pregnant',
        label: 'Patient is pregnant',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heparin_allergy',
        label: 'Documented history of heparin-induced thrombocytopenia (HIT)',
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
          risk: 'Safe for Outpatient',
          interpretation:
            'All 11 criteria answered "No" — safe for outpatient management with LMWH/DOAC (~2% 30-day VTE recurrence).',
        },
        {
          min: 1,
          max: 11,
          risk: 'Inpatient Required',
          interpretation:
            'Any criterion "Yes" — inpatient management recommended.',
        },
      ],
    },
    suggestedTreatments: {
      'Safe for Outpatient': ['enoxaparin_or_doac', 'outpatient_follow_up_48h', 'return_precautions'],
      'Inpatient Required': ['heparin_drip', 'admit_telemetry', 'pulmonology_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // YEARS Algorithm for PE
  // Algorithm-based: 3 binary YEARS items + D-dimer level
  // ---------------------------------------------------------------------------
  {
    id: 'years_algorithm',
    name: 'YEARS Algorithm',
    fullName: 'YEARS Algorithm',
    category: 'CARDIOVASCULAR',
    application:
      'Simplified diagnostic pathway for suspected PE that reduces unnecessary CTPA.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pe_rule_out', 'dvt_symptoms'],
    keywords: [
      'YEARS algorithm',
      'YEARS PE',
      'pulmonary embolism YEARS',
      'D-dimer threshold',
      'adjusted D-dimer',
      'CTPA reduction',
      'DVT signs hemoptysis',
    ],
    requiredTests: ['d-dimer'],
    components: [
      {
        id: 'dvt_signs',
        label: 'Clinical signs of DVT (leg swelling, pain on palpation of deep veins)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'hemoptysis',
        label: 'Hemoptysis',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'pe_most_likely',
        label: 'PE is the most likely diagnosis (clinical judgment)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'ddimer_level',
        label: 'D-dimer level',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<500 ng/mL', value: 0 },
          { label: '500–999 ng/mL', value: 1 },
          { label: '≥1000 ng/mL', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'PE Excluded',
          interpretation:
            '0 YEARS items AND D-dimer <1000 ng/mL → PE excluded without CTPA (failure rate ~0.3%).',
        },
        {
          min: 1,
          max: 2,
          risk: 'PE Excluded (Standard)',
          interpretation:
            '≥1 YEARS item AND D-dimer <500 ng/mL → PE excluded without CTPA.',
        },
        {
          min: 3,
          max: 5,
          risk: 'CTPA Indicated',
          interpretation:
            '≥1 YEARS item AND D-dimer ≥500 ng/mL, OR 0 YEARS items AND D-dimer ≥1000 ng/mL → CTPA indicated.',
        },
      ],
    },
    suggestedTreatments: {
      'CTPA Indicated': ['ctpa', 'empiric_anticoagulation_if_high_suspicion'],
      'PE Excluded (Standard)': ['discharge_with_follow_up', 'alternative_diagnosis_workup'],
      'PE Excluded': ['discharge_with_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // San Francisco Syncope Rule (SFSR)
  // Threshold-based: 5 binary CHESS criteria; any positive = not low risk
  // ---------------------------------------------------------------------------
  {
    id: 'sfsr',
    name: 'SFSR',
    fullName: 'San Francisco Syncope Rule (SFSR)',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts short-term (7-day) serious outcomes in patients with syncope (true LOC with spontaneous return).',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness', 'presyncope'],
    keywords: [
      'San Francisco syncope rule',
      'SFSR',
      'CHESS',
      'syncope risk',
      'syncope serious outcome',
      'CHF syncope',
      'ECG syncope',
      'hematocrit syncope',
    ],
    requiredTests: ['ecg', 'hematocrit/cbc'],
    components: [
      {
        id: 'chf_history',
        label: 'C — History of congestive heart failure',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hematocrit_low',
        label: 'H — Hematocrit <30%',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'abnormal_ecg',
        label: 'E — Abnormal ECG (new changes or any non-sinus rhythm)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'shortness_of_breath',
        label: 'S — Complaint of shortness of breath',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'systolic_bp_low',
        label: 'S — Systolic blood pressure <90 mmHg at triage',
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
          risk: 'Low',
          interpretation:
            'All CHESS criteria absent → Low risk (~2% 7-day serious outcome rate). Consider discharge with outpatient follow-up.',
        },
        {
          min: 1,
          max: 5,
          risk: 'High',
          interpretation:
            'Any CHESS criterion present → Not low risk (~18% 7-day serious outcome rate). Further workup and/or admission recommended.',
        },
      ],
    },
    suggestedTreatments: {
      Low: ['discharge_with_follow_up', 'return_precautions'],
      High: ['admit_telemetry', 'echocardiogram', 'cardiology_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // Canadian Syncope Risk Score (CSRS)
  // Sum-based: multiple weighted criteria for 30-day serious adverse events
  // ---------------------------------------------------------------------------
  {
    id: 'csrs',
    name: 'CSRS',
    fullName: 'Canadian Syncope Risk Score (CSRS)',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts 30-day serious adverse events after syncope in ED patients (age ≥16, presenting within 24 hours of syncope).',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness', 'presyncope'],
    keywords: [
      'Canadian syncope risk score',
      'CSRS',
      'syncope 30 day risk',
      'vasovagal syncope',
      'cardiac syncope',
      'QTc prolonged syncope',
      'troponin syncope',
      'syncope disposition',
    ],
    requiredTests: ['ecg', 'troponin', 'blood pressure'],
    components: [
      // Clinical evaluation (Section 1)
      {
        id: 'vasovagal_predisposition',
        label: 'Predisposition to vasovagal symptoms (warm crowded place, prolonged standing, fear/emotion/pain)',
        type: 'boolean',
        value: -1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_disease_history',
        label: 'History of heart disease (CAD, atrial fibrillation, CHF, valvular disease)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'sbp_below_90_or_above_180',
        label: 'Any ED SBP reading <90 or >180 mmHg',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // Investigations (Section 2)
      {
        id: 'elevated_troponin',
        label: 'Elevated troponin (>99th percentile)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'abnormal_qrs_axis',
        label: 'Abnormal QRS axis (<−30° or >100°)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'qrs_duration_130',
        label: 'QRS duration >130 ms',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'qtc_prolonged',
        label: 'Corrected QT interval >480 ms',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      // ED diagnosis
      {
        id: 'cardiac_syncope_diagnosis',
        label: 'ED diagnosis of cardiac syncope',
        type: 'boolean',
        value: 2,
        source: 'user_input',
      },
      {
        id: 'vasovagal_syncope_diagnosis',
        label: 'ED diagnosis of vasovagal syncope',
        type: 'boolean',
        value: -2,
        source: 'user_input',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: -3,
          max: 0,
          risk: 'Very Low',
          interpretation:
            'Score −3 to 0: ~0.4–0.7% 30-day risk of serious adverse event — consider safe discharge with outpatient follow-up.',
        },
        {
          min: 1,
          max: 3,
          risk: 'Low',
          interpretation:
            'Score 1–3: ~2.7–5.1% 30-day risk of serious adverse event.',
        },
        {
          min: 4,
          max: 5,
          risk: 'Medium',
          interpretation:
            'Score 4–5: ~9.4–12.0% 30-day risk — consider admission or expedited cardiac workup.',
        },
        {
          min: 6,
          max: 8,
          risk: 'High',
          interpretation:
            'Score 6–8: ~17.2–25.9% 30-day risk — admission with cardiac monitoring recommended.',
        },
        {
          min: 9,
          max: 11,
          risk: 'Very High',
          interpretation:
            'Score ≥9: ~34.8% 30-day risk — urgent admission with continuous cardiac monitoring.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': ['admit_telemetry', 'cardiology_consult', 'echocardiogram', 'continuous_monitoring'],
      High: ['admit_telemetry', 'cardiology_consult', 'echocardiogram'],
      Medium: ['observation', 'cardiology_consult', 'echocardiogram'],
      Low: ['discharge_with_follow_up', 'outpatient_holter'],
      'Very Low': ['discharge_with_follow_up', 'return_precautions'],
    },
  },

  // ---------------------------------------------------------------------------
  // OESIL Score
  // Sum-based: 4 binary criteria (1 point each) for 1-year syncope mortality
  // ---------------------------------------------------------------------------
  {
    id: 'oesil',
    name: 'OESIL Score',
    fullName: 'OESIL Score',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts 1-year all-cause mortality in patients presenting with syncope.',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
    keywords: [
      'OESIL',
      'OESIL score',
      'syncope mortality',
      '1 year syncope mortality',
      'cardiovascular disease syncope',
      'ECG syncope abnormal',
    ],
    requiredTests: ['ecg'],
    components: [
      {
        id: 'age_over_65',
        label: 'Age >65 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_prodrome',
        label: 'No prodromal symptoms (absence of nausea, diaphoresis, lightheadedness before syncope)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'abnormal_ecg',
        label: 'Abnormal ECG (rhythm abnormalities, AV conduction disorders, BBB, old MI, or ST-T changes)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'cardiovascular_disease',
        label: 'History of cardiovascular disease (CHF, CAD, valvular heart disease, stroke/TIA)',
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
          max: 0,
          risk: 'Very Low',
          interpretation: 'Score 0: 0% 1-year mortality.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation: 'Score 1: 0.8% 1-year mortality.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation: 'Score 2: 19.6% 1-year mortality.',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation: 'Score 3: 34.7% 1-year mortality.',
        },
        {
          min: 4,
          max: 4,
          risk: 'Very High',
          interpretation: 'Score 4: 57.1% 1-year mortality.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Boston Syncope Rule
  // Threshold-based: 8 binary risk factors; any present = admit
  // ---------------------------------------------------------------------------
  {
    id: 'boston_syncope',
    name: 'Boston Syncope',
    fullName: 'Boston Syncope Rule',
    category: 'CARDIOVASCULAR',
    application:
      'Identifies need for hospital admission after syncope based on risk of adverse outcomes.',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
    keywords: [
      'Boston syncope rule',
      'syncope admission',
      'syncope ACS',
      'syncope heart failure',
      'syncope CNS',
      'troponin syncope',
      'cardiac syncope admission',
    ],
    requiredTests: ['ecg', 'troponin'],
    components: [
      {
        id: 'signs_acs',
        label: 'Signs/symptoms of acute coronary syndrome',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'signs_conduction_disease',
        label: 'Signs of conduction disease (new BBB, 2nd/3rd degree AV block, pauses >3 sec)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'worrisome_cardiac_history',
        label: 'Worrisome cardiac history (prior VT/VF, pacemaker/ICD, CHF, LVEF <40%, Brugada, HCM)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'family_sudden_death',
        label: 'Family history of sudden death (age <50)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'valvular_heart_disease',
        label: 'Valvular heart disease (by history or exam findings — systolic murmur)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cns_signs',
        label: 'Signs/symptoms suggesting CNS event (severe headache, focal neuro deficit, new seizure)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'volume_depletion',
        label: 'Volume depletion concern (GI bleeding, dehydration, hematocrit <30%)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'positive_troponin',
        label: 'Positive troponin (above institutional 99th percentile)',
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
          max: 0,
          risk: 'Low',
          interpretation:
            'No criteria present — consider discharge (sensitivity ~97% for 30-day serious outcomes).',
        },
        {
          min: 1,
          max: 8,
          risk: 'High',
          interpretation:
            'Any criterion present — admission indicated for further evaluation and monitoring.',
        },
      ],
    },
    suggestedTreatments: {
      Low: ['discharge_with_follow_up', 'return_precautions'],
      High: ['admit_telemetry', 'cardiology_consult', 'echocardiogram'],
    },
  },

  // ---------------------------------------------------------------------------
  // FAINT Score: QUARANTINED — see _quarantine/faint_score.ts
  // Reason: Only 2 user-answerable components (heart_failure_history, arrhythmia_history);
  // I/N/T are lab/test results. Cannot add criteria not in published source.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Ottawa Aggressive AF Protocol
  // Threshold-based: criteria for rhythm control vs rate control approach
  // ---------------------------------------------------------------------------
  {
    id: 'ottawa_af_protocol',
    name: 'Ottawa AF Protocol',
    fullName: 'Ottawa Aggressive Protocol (Acute Atrial Fibrillation)',
    category: 'CARDIOVASCULAR',
    application:
      'Guides ED management of recent-onset atrial fibrillation (<48 hours duration).',
    applicableChiefComplaints: ['atrial_fibrillation', 'palpitations', 'afib_with_rvr', 'new_onset_afib'],
    keywords: [
      'Ottawa aggressive protocol',
      'Ottawa AF',
      'acute atrial fibrillation',
      'AF cardioversion',
      'chemical cardioversion',
      'procainamide AF',
      'recent onset AF',
      'rate control AF',
      'electrical cardioversion',
    ],
    components: [
      {
        id: 'hemodynamic_instability',
        label: 'Hemodynamically unstable (hypotension, AMS, severe dyspnea, chest pain with ischemia)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'onset_over_48h',
        label: 'AF duration >48 hours or uncertain onset time',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_valve_surgery',
        label: 'History of valvular heart disease or valve surgery (rheumatic, prosthetic valve)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'permanent_af',
        label: 'Known permanent atrial fibrillation (previously failed cardioversion or accepted permanent AF)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'chads2_vasc_high',
        label: 'High stroke risk (CHA2DS2-VASc ≥2 without therapeutic anticoagulation)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'severe_hf',
        label: 'Severe heart failure (NYHA class IV or acute decompensation)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'electrolyte_abnormality',
        label: 'Uncorrected electrolyte abnormality (hypokalemia, hypomagnesemia)',
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
          max: 0,
          risk: 'Rhythm Control Candidate',
          interpretation:
            'No contraindications — proceed with aggressive rhythm control: procainamide 15 mg/kg IV over 30–60 min. If chemical cardioversion fails, electrical cardioversion. ~60% convert with drug alone, ~95% overall. Discharge same day if converted with stable rhythm for 2–3 hours.',
        },
        {
          min: 1,
          max: 7,
          risk: 'Rate Control / Defer',
          interpretation:
            'One or more contraindications present — pursue rate control strategy (beta-blocker or calcium channel blocker). If hemodynamically unstable, emergent electrical cardioversion regardless. If onset >48h, anticoagulate and consider TEE-guided cardioversion electively.',
        },
      ],
    },
    suggestedTreatments: {
      'Rhythm Control Candidate': [
        'procainamide_iv',
        'electrical_cardioversion_if_drug_fails',
        'observe_2_3h_post_conversion',
        'discharge_if_stable_sinus',
      ],
      'Rate Control / Defer': [
        'diltiazem_iv_or_metoprolol_iv',
        'anticoagulation',
        'cardiology_consult',
        'outpatient_cardioversion',
      ],
    },
  },
]
