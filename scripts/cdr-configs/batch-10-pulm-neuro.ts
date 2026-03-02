import type { CdrSeed } from './types'

/**
 * Batch 10 — Pulmonary (remaining) & Neurology (stroke screens + SAH)
 *
 * CDRs included:
 *   lights_criteria, rox_index, bode_index, rsbi, murray_lung_injury,
 *   cpss, lams, be_fast, six_hour_ct_sah, standing_algorithm
 *
 * Sources:
 *  - Light's Criteria: Light RW et al., Ann Intern Med 1972
 *  - ROX Index: Roca O et al., J Crit Care 2016; Roca O et al., Chest 2019
 *  - BODE Index: Celli BR et al., NEJM 2004
 *  - RSBI: Yang KL & Tobin MJ, NEJM 1991
 *  - Murray Lung Injury Score: Murray JF et al., Am Rev Respir Dis 1988
 *  - CPSS: Kothari RU et al., Ann Emerg Med 1999
 *  - LAMS: Llanes JN et al., Stroke 2019; Noorian AR et al., J Stroke Cerebrovasc Dis 2018
 *  - BE-FAST: Aroor S et al., J Neurointerv Surg 2017
 *  - 6-Hour CT Rule for SAH: Perry JJ et al., BMJ 2011
 *  - STANDING Algorithm: Vanni S et al., Acad Emerg Med 2015
 */

export const batch10PulmNeuroCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Light's Criteria — Pleural Effusion Classification
  // Algorithm: Exudate if ANY of 3 criteria met; Transudate if none met
  // ---------------------------------------------------------------------------
  {
    id: 'lights_criteria',
    name: "Light's Criteria",
    fullName: "Light's Criteria (Pleural Effusion)",
    category: 'PULMONARY',
    application:
      'Differentiates transudative from exudative pleural effusions. Essential for determining the etiology of pleural effusion.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pleural_effusion'],
    keywords: [
      "Light's criteria",
      'pleural effusion',
      'transudate',
      'exudate',
      'LDH',
      'protein',
      'thoracentesis',
    ],
    requiredTests: ['pleural fluid protein', 'serum protein', 'pleural fluid LDH', 'serum LDH'],
    components: [
      {
        id: 'protein_ratio',
        label: 'Pleural fluid protein / Serum protein ratio >0.5',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ldh_ratio',
        label: 'Pleural fluid LDH / Serum LDH ratio >0.6',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ldh_upper_normal',
        label: 'Pleural fluid LDH >2/3 upper limit of normal for serum LDH',
        type: 'boolean',
        value: 1,
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
          risk: 'Transudate',
          interpretation:
            'No criteria met. Transudative effusion — caused by systemic factors (CHF, cirrhosis, nephrotic syndrome). Treat the underlying condition.',
        },
        {
          min: 1,
          max: 3,
          risk: 'Exudate',
          interpretation:
            'One or more criteria met. Exudative effusion — caused by local/inflammatory process (infection, malignancy, PE, autoimmune). Requires further workup: cell count, glucose, pH, cytology, cultures.',
        },
      ],
    },
    suggestedTreatments: {
      Transudate: ['treat_underlying_cause', 'diuretics', 'sodium_restriction'],
      Exudate: [
        'pleural_fluid_culture',
        'pleural_fluid_cytology',
        'pulmonology_consult',
        'ct_chest_with_contrast',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ROX Index — HFNC Failure Prediction
  // Algorithm: (SpO2/FiO2) / Respiratory Rate
  // Continuous calculation with time-based thresholds
  // ---------------------------------------------------------------------------
  {
    id: 'rox_index',
    name: 'ROX Index',
    fullName: 'ROX Index (HFNC Failure Prediction)',
    category: 'PULMONARY',
    application:
      'Predicts failure of high-flow nasal cannula (HFNC) oxygen therapy, identifying patients who may need intubation.',
    applicableChiefComplaints: ['shortness_of_breath', 'respiratory_failure', 'hypoxia'],
    keywords: [
      'ROX index',
      'HFNC',
      'high flow nasal cannula',
      'intubation',
      'respiratory failure',
      'oxygen therapy',
    ],
    components: [
      {
        id: 'spo2',
        label: 'SpO2 (%)',
        type: 'number_range',
        min: 50,
        max: 100,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'fio2',
        label: 'FiO2 (%, e.g. 60 for 60%)',
        type: 'number_range',
        min: 21,
        max: 100,
        source: 'section2',
      },
      {
        id: 'respiratory_rate',
        label: 'Respiratory Rate (breaths/min)',
        type: 'number_range',
        min: 1,
        max: 60,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'assessment_time',
        label: 'Time on HFNC',
        type: 'select',
        source: 'user_input',
        options: [
          { label: '2 hours', value: 0 },
          { label: '6 hours', value: 1 },
          { label: '12 hours', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'High Risk',
          interpretation:
            'ROX <3.85 at 2h or <3.47 at 6h or <3.85 at 12h: High risk of HFNC failure. Strongly consider intubation and mechanical ventilation.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Intermediate',
          interpretation:
            'ROX 3.85–4.87: Intermediate risk. Reassess frequently (every 1–2 hours) and trend ROX values.',
        },
        {
          min: 4,
          max: 20,
          risk: 'Low Risk',
          interpretation:
            'ROX >=4.88 at 2, 6, or 12 hours: Low risk of HFNC failure. Continue current HFNC settings with routine monitoring.',
        },
      ],
    },
    suggestedTreatments: {
      'High Risk': ['intubation', 'mechanical_ventilation', 'icu_admission', 'rapid_sequence_intubation'],
      Intermediate: ['continue_hfnc', 'frequent_reassessment', 'icu_monitoring'],
      'Low Risk': ['continue_hfnc', 'routine_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // BODE Index — COPD Mortality Prediction
  // Sum-based: 4 components (BMI, FEV1%, 6MWD, mMRC), each scored 0–3
  // ---------------------------------------------------------------------------
  {
    id: 'bode_index',
    name: 'BODE Index',
    fullName: 'BODE Index (COPD Prognosis)',
    category: 'PULMONARY',
    application:
      'Multidimensional assessment of COPD prognosis. Predicts mortality better than FEV1 alone.',
    applicableChiefComplaints: ['shortness_of_breath', 'copd', 'dyspnea', 'exercise_intolerance'],
    keywords: [
      'BODE',
      'COPD',
      'prognosis',
      'mortality',
      'FEV1',
      'BMI',
      'dyspnea',
      'mMRC',
      '6-minute walk',
    ],
    requiredTests: ['FEV1', '6-minute walk test', 'BMI'],
    components: [
      {
        id: 'bmi',
        label: 'Body Mass Index (BMI)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'BMI >21', value: 0 },
          { label: 'BMI <=21', value: 1 },
        ],
      },
      {
        id: 'fev1_percent',
        label: 'FEV1 (% predicted)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>=65%', value: 0 },
          { label: '50–64%', value: 1 },
          { label: '36–49%', value: 2 },
          { label: '<=35%', value: 3 },
        ],
      },
      {
        id: 'six_mwd',
        label: '6-Minute Walk Distance (meters)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>=350 m', value: 0 },
          { label: '250–349 m', value: 1 },
          { label: '150–249 m', value: 2 },
          { label: '<=149 m', value: 3 },
        ],
      },
      {
        id: 'mmrc_dyspnea',
        label: 'mMRC Dyspnea Scale',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '0 — Dyspnea only with strenuous exercise', value: 0 },
          { label: '1 — Dyspnea when hurrying on level or walking up slight hill', value: 0 },
          { label: '2 — Walks slower than people of same age or stops for breath on level', value: 1 },
          { label: '3 — Stops for breath after ~100 m or a few minutes on level', value: 2 },
          { label: '4 — Too dyspneic to leave house or breathless dressing/undressing', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Low',
          interpretation: 'Quartile 1: ~15% 4-year mortality. Optimize medical therapy.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Moderate',
          interpretation:
            'Quartile 2: ~25% 4-year mortality. Pulmonary rehabilitation, optimize bronchodilators.',
        },
        {
          min: 5,
          max: 6,
          risk: 'High',
          interpretation:
            'Quartile 3: ~45% 4-year mortality. Consider lung volume reduction surgery evaluation.',
        },
        {
          min: 7,
          max: 10,
          risk: 'Very High',
          interpretation:
            'Quartile 4: ~80% 4-year mortality. Discuss palliative care, goals of care, transplant evaluation.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': ['palliative_care_consult', 'transplant_evaluation', 'pulmonology_consult'],
      High: ['pulmonary_rehabilitation', 'pulmonology_consult', 'lvrs_evaluation'],
      Moderate: ['pulmonary_rehabilitation', 'optimize_bronchodilators'],
      Low: ['continue_current_therapy', 'smoking_cessation'],
    },
  },

  // ---------------------------------------------------------------------------
  // RSBI — Rapid Shallow Breathing Index
  // Algorithm: Respiratory Rate / Tidal Volume (L)
  // Threshold: <105 predicts weaning success
  // ---------------------------------------------------------------------------
  {
    id: 'rsbi',
    name: 'RSBI',
    fullName: 'Rapid Shallow Breathing Index (RSBI)',
    category: 'PULMONARY',
    application:
      'Predicts success of weaning from mechanical ventilation (spontaneous breathing trial).',
    applicableChiefComplaints: ['mechanical_ventilation', 'respiratory_failure', 'icu'],
    keywords: [
      'RSBI',
      'rapid shallow breathing index',
      'weaning',
      'extubation',
      'mechanical ventilation',
      'spontaneous breathing trial',
      'SBT',
    ],
    components: [
      {
        id: 'respiratory_rate',
        label: 'Respiratory Rate during SBT (breaths/min)',
        type: 'number_range',
        min: 1,
        max: 60,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'tidal_volume',
        label: 'Tidal Volume during SBT (liters)',
        type: 'select',
        source: 'section2',
        options: [
          { label: '>=0.5 L (adequate depth)', value: 0 },
          { label: '0.3–0.49 L (borderline)', value: 1 },
          { label: '<0.3 L (shallow)', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 104,
          risk: 'Favorable',
          interpretation:
            'RSBI <105 breaths/min/L: Likely to tolerate extubation (PPV ~78%). Proceed with spontaneous breathing trial and consider extubation.',
        },
        {
          min: 105,
          max: 300,
          risk: 'Unfavorable',
          interpretation:
            'RSBI >=105 breaths/min/L: Likely to fail extubation (NPV ~95%). Continue mechanical ventilation and address reversible causes before reattempting.',
        },
      ],
    },
    suggestedTreatments: {
      Favorable: ['spontaneous_breathing_trial', 'extubation', 'post_extubation_monitoring'],
      Unfavorable: [
        'continue_mechanical_ventilation',
        'address_reversible_causes',
        'reassess_in_24_hours',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Murray Lung Injury Score
  // Sum-based (averaged): 4 components each scored 0–4; final = sum / # components
  // Score >2.5 = severe (ECMO consideration)
  // ---------------------------------------------------------------------------
  {
    id: 'murray_lung_injury',
    name: 'Murray Lung Injury Score',
    fullName: 'Murray Lung Injury Score',
    category: 'PULMONARY',
    application:
      'Quantifies severity of acute lung injury. Can be used to identify patients who may benefit from ECMO.',
    applicableChiefComplaints: ['respiratory_failure', 'shortness_of_breath', 'hypoxia', 'ards'],
    keywords: [
      'Murray score',
      'lung injury score',
      'ARDS',
      'ECMO',
      'acute lung injury',
      'PaO2/FiO2',
      'PEEP',
      'compliance',
    ],
    requiredTests: ['arterial blood gas', 'chest x-ray', 'PaO2/FiO2 ratio', 'lung compliance', 'PEEP'],
    components: [
      {
        id: 'cxr_consolidation',
        label: 'Chest X-Ray (alveolar consolidation)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No alveolar consolidation', value: 0 },
          { label: 'Consolidation confined to 1 quadrant', value: 1 },
          { label: 'Consolidation confined to 2 quadrants', value: 2 },
          { label: 'Consolidation confined to 3 quadrants', value: 3 },
          { label: 'Consolidation in all 4 quadrants', value: 4 },
        ],
      },
      {
        id: 'pao2_fio2',
        label: 'PaO2/FiO2 Ratio',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>=300', value: 0 },
          { label: '225–299', value: 1 },
          { label: '175–224', value: 2 },
          { label: '100–174', value: 3 },
          { label: '<100', value: 4 },
        ],
      },
      {
        id: 'peep',
        label: 'PEEP (cmH2O)',
        type: 'select',
        source: 'section2',
        options: [
          { label: '<=5 cmH2O', value: 0 },
          { label: '6–8 cmH2O', value: 1 },
          { label: '9–11 cmH2O', value: 2 },
          { label: '12–14 cmH2O', value: 3 },
          { label: '>=15 cmH2O', value: 4 },
        ],
      },
      {
        id: 'compliance',
        label: 'Lung Compliance (mL/cmH2O)',
        type: 'select',
        source: 'section2',
        options: [
          { label: '>=80 mL/cmH2O', value: 0 },
          { label: '60–79 mL/cmH2O', value: 1 },
          { label: '40–59 mL/cmH2O', value: 2 },
          { label: '20–39 mL/cmH2O', value: 3 },
          { label: '<=19 mL/cmH2O', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'No Injury',
          interpretation: 'Average score 0: No lung injury.',
        },
        {
          min: 0,
          max: 2,
          risk: 'Mild-Moderate',
          interpretation:
            'Average score 0.1–2.5: Mild to moderate lung injury. Continue lung-protective ventilation.',
        },
        {
          min: 2,
          max: 4,
          risk: 'Severe',
          interpretation:
            'Average score >2.5: Severe lung injury (ARDS). Consider ECMO referral if refractory hypoxemia despite optimal conventional management.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: ['ecmo_referral', 'prone_positioning', 'lung_protective_ventilation', 'icu_admission'],
      'Mild-Moderate': ['lung_protective_ventilation', 'optimize_peep', 'icu_monitoring'],
      'No Injury': ['routine_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // CPSS — Cincinnati Prehospital Stroke Scale
  // Threshold: 3 binary assessments; any abnormal = stroke alert
  // ---------------------------------------------------------------------------
  {
    id: 'cpss',
    name: 'CPSS',
    fullName: 'Cincinnati Prehospital Stroke Scale (CPSS)',
    category: 'NEUROLOGY',
    application:
      'Rapid prehospital stroke screening tool using three bedside assessments.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness', 'speech_difficulty'],
    keywords: [
      'Cincinnati',
      'CPSS',
      'prehospital stroke',
      'stroke screen',
      'facial droop',
      'arm drift',
      'speech',
      'BE-FAST',
    ],
    components: [
      {
        id: 'facial_droop',
        label: 'Facial Droop — Ask patient to smile or show teeth',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'arm_drift',
        label: 'Arm Drift — Patient closes eyes and extends arms 10 seconds',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'abnormal_speech',
        label: 'Abnormal Speech — Patient repeats a sentence (slurred, inappropriate words, or mute)',
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
            'No abnormal findings. Stroke less likely but does not rule out posterior circulation or minor stroke.',
        },
        {
          min: 1,
          max: 2,
          risk: 'High',
          interpretation:
            'Any 1–2 findings abnormal: ~72% probability of stroke. Activate stroke alert; document time of last known well.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Very High',
          interpretation:
            'All 3 findings abnormal: >85% probability of stroke. Activate stroke alert immediately; emergent CT and neurology consultation.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'stroke_alert',
        'stat_ct_head',
        'neurology_consult',
        'tpa_evaluation',
        'npo',
      ],
      High: [
        'stroke_alert',
        'stat_ct_head',
        'neurology_consult',
        'tpa_evaluation',
      ],
      Low: ['complete_neurological_exam', 'consider_other_etiologies'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAMS — Los Angeles Motor Scale
  // Sum-based: 3 motor components (facial droop 0–1, arm drift 0–2, grip 0–2)
  // Max score 5; >=4 suggests LVO
  // ---------------------------------------------------------------------------
  {
    id: 'lams',
    name: 'LAMS',
    fullName: 'LAMS (Los Angeles Motor Scale)',
    category: 'NEUROLOGY',
    application:
      'Prehospital LVO detection using 3 motor assessments.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness'],
    keywords: [
      'LAMS',
      'Los Angeles Motor Scale',
      'LVO',
      'large vessel occlusion',
      'prehospital',
      'stroke',
      'thrombectomy',
      'motor',
    ],
    components: [
      {
        id: 'facial_droop',
        label: 'Facial Droop',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present', value: 1 },
        ],
      },
      {
        id: 'arm_drift',
        label: 'Arm Drift',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent — arms stay up equally', value: 0 },
          { label: 'Drifts down — arm drifts but does not contact body', value: 1 },
          { label: 'Falls rapidly — arm falls to bed or unable to lift', value: 2 },
        ],
      },
      {
        id: 'grip_strength',
        label: 'Grip Strength',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Weak grip', value: 1 },
          { label: 'No grip', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'Lower LVO Probability',
          interpretation:
            'LAMS 0–3: Lower probability of large vessel occlusion. Does not exclude LVO; complete neurological assessment recommended.',
        },
        {
          min: 4,
          max: 5,
          risk: 'High LVO Probability',
          interpretation:
            'LAMS >=4: Highly suggestive of LVO (~81% sensitivity). Transport to thrombectomy-capable center; consider CTA head/neck.',
        },
      ],
    },
    suggestedTreatments: {
      'High LVO Probability': [
        'transport_thrombectomy_center',
        'stroke_alert',
        'stat_ct_head',
        'ct_angiography',
        'neurology_consult',
      ],
      'Lower LVO Probability': [
        'stroke_alert',
        'stat_ct_head',
        'neurology_consult',
        'complete_neurological_exam',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // BE-FAST — Stroke Recognition Screen
  // Threshold: 6 binary checks (Balance, Eyes, Face, Arm, Speech, Time)
  // Any positive = emergency response
  // ---------------------------------------------------------------------------
  {
    id: 'be_fast',
    name: 'BE-FAST',
    fullName: 'BE-FAST Mnemonic',
    category: 'NEUROLOGY',
    application:
      'Public and prehospital stroke recognition mnemonic covering Balance, Eyes, Face, Arms, Speech, and Time.',
    applicableChiefComplaints: [
      'stroke',
      'balance_problems',
      'vision_changes',
      'facial_droop',
      'arm_weakness',
      'speech_difficulty',
    ],
    keywords: [
      'BE-FAST',
      'BEFAST',
      'FAST',
      'stroke',
      'prehospital',
      'stroke recognition',
      'balance',
      'eyes',
      'face',
      'arms',
      'speech',
    ],
    components: [
      {
        id: 'balance',
        label: 'Balance — Sudden loss of balance or coordination',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'eyes',
        label: 'Eyes — Sudden vision change in one or both eyes (diplopia, field cut, blindness)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'face',
        label: 'Face — Facial droop or uneven smile',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'arm',
        label: 'Arm — Arm or leg weakness (unilateral drift or inability to raise)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'speech',
        label: 'Speech — Slurred speech, difficulty speaking or understanding',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'time',
        label: 'Time — Symptoms acute onset (note last known well)',
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
            'No positive signs identified. Stroke is less likely; consider alternative diagnoses but maintain clinical vigilance.',
        },
        {
          min: 1,
          max: 6,
          risk: 'High',
          interpretation:
            'Any positive sign: Activate emergency response immediately. Note time of last known well; expedite CT and stroke team evaluation.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'stroke_alert',
        'stat_ct_head',
        'neurology_consult',
        'tpa_evaluation',
        'document_last_known_well',
      ],
      Low: ['complete_neurological_exam', 'consider_other_etiologies'],
    },
  },

  // ---------------------------------------------------------------------------
  // 6-Hour CT Rule for SAH
  // Algorithm: All criteria must be met to apply rule (rule-out without LP)
  // Criteria: GCS 15, CT <6h from ictus, 3rd-gen scanner, experienced radiologist
  // ---------------------------------------------------------------------------
  {
    id: 'six_hour_ct_sah',
    name: '6-Hour CT Rule',
    fullName: '6-Hour CT Rule for SAH',
    category: 'NEUROLOGY',
    application:
      'CT head within 6 hours of headache ictus has near-100% sensitivity for SAH in patients with GCS 15, when interpreted by experienced radiologist on modern scanner.',
    applicableChiefComplaints: ['headache', 'thunderclap_headache', 'worst_headache_of_life'],
    keywords: [
      '6-hour CT',
      'SAH',
      'subarachnoid hemorrhage',
      'CT sensitivity',
      'Perry',
      'headache',
      'lumbar puncture',
    ],
    requiredTests: ['CT head non-contrast'],
    components: [
      {
        id: 'gcs_15',
        label: 'Patient is alert with GCS 15',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'ct_within_6h',
        label: 'CT performed within 6 hours of headache onset (ictus)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'modern_scanner',
        label: 'CT obtained on 3rd-generation or newer scanner',
        type: 'boolean',
        value: 1,
        source: 'section2',
      },
      {
        id: 'experienced_radiologist',
        label: 'CT interpreted by experienced (attending-level) radiologist',
        type: 'boolean',
        value: 1,
        source: 'section2',
      },
      {
        id: 'ct_negative',
        label: 'CT is negative for SAH',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 5,
          max: 5,
          risk: 'Rule Applicable — SAH Excluded',
          interpretation:
            'All 5 criteria met: Negative CT within 6 hours has ~100% sensitivity (95% CI 97–100%) for SAH. LP is not required. Perry et al. BMJ 2011.',
        },
        {
          min: 0,
          max: 4,
          risk: 'Rule Not Applicable',
          interpretation:
            'One or more criteria not met: The 6-hour rule cannot be applied. LP or CTA should be performed if clinical suspicion for SAH persists.',
        },
      ],
    },
    suggestedTreatments: {
      'Rule Not Applicable': [
        'lumbar_puncture',
        'ct_angiography',
        'neurosurgery_consult',
        'observation',
      ],
      'Rule Applicable — SAH Excluded': [
        'discharge_with_follow_up',
        'return_precautions',
        'analgesia',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // STANDING Algorithm — Structured Vertigo Assessment
  // Algorithm: step-wise diagnostic pathway for acute vertigo
  // Steps: Spontaneous nystagmus → Type of nystagmus → HINTS → Gait/Other → Dx
  // ---------------------------------------------------------------------------
  {
    id: 'standing_algorithm',
    name: 'STANDING Algorithm',
    fullName: 'STANDING Algorithm',
    category: 'NEUROLOGY',
    application:
      'Bedside evaluation approach for acute vertigo combining orthostatic assessment, nystagmus analysis, and HINTS components.',
    applicableChiefComplaints: ['vertigo', 'dizziness', 'nystagmus'],
    keywords: [
      'STANDING',
      'vertigo',
      'HINTS',
      'nystagmus',
      'orthostatic',
      'gait',
      'central vs peripheral',
    ],
    components: [
      {
        id: 'spontaneous_nystagmus',
        label: 'SponTaneous nystagmus present at rest',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No spontaneous nystagmus (episodic vestibular syndrome)', value: 0 },
          { label: 'Spontaneous nystagmus present (acute vestibular syndrome)', value: 1 },
        ],
      },
      {
        id: 'nystagmus_direction',
        label: 'Nystagmus direction-changing with gaze?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Direction-fixed (always beats the same way)', value: 0 },
          { label: 'Direction-changing (reverses with gaze direction) — CENTRAL', value: 2 },
        ],
      },
      {
        id: 'head_impulse',
        label: 'Head Impulse Test (HIT)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Abnormal (corrective saccade) — suggests PERIPHERAL', value: 0 },
          { label: 'Normal (no corrective saccade) — suggests CENTRAL', value: 2 },
        ],
      },
      {
        id: 'skew_deviation',
        label: 'Test of Skew (alternate cover test)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No skew deviation — suggests peripheral', value: 0 },
          { label: 'Skew deviation present — suggests CENTRAL', value: 2 },
        ],
      },
      {
        id: 'gait_assessment',
        label: 'Gait Assessment',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Able to walk (may lean to one side) — peripheral pattern', value: 0 },
          { label: 'Unable to walk or severe truncal ataxia — concerning for CENTRAL', value: 2 },
        ],
      },
      {
        id: 'new_headache_or_neuro',
        label: 'New headache, neck pain, or other focal neurological deficit',
        type: 'boolean',
        value: 2,
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
          risk: 'Peripheral (Benign)',
          interpretation:
            'All components consistent with peripheral vestibular lesion: direction-fixed nystagmus, abnormal head impulse, no skew, stable gait. Likely vestibular neuritis or labyrinthitis. Symptomatic treatment and outpatient follow-up.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Indeterminate',
          interpretation:
            'Mixed findings. Does not clearly fit peripheral or central pattern. Consider MRI brain with diffusion-weighted imaging if clinical suspicion for stroke.',
        },
        {
          min: 2,
          max: 12,
          risk: 'Central (Concerning)',
          interpretation:
            'One or more central features identified (direction-changing nystagmus, normal head impulse, skew deviation, inability to walk, new headache/neuro findings). High suspicion for posterior circulation stroke. Obtain urgent MRI with DWI; neurology consult.',
        },
      ],
    },
    suggestedTreatments: {
      'Central (Concerning)': [
        'stat_mri_brain_dwi',
        'neurology_consult',
        'stroke_alert',
        'ct_angiography',
        'admit_for_observation',
      ],
      Indeterminate: [
        'mri_brain_dwi',
        'neurology_consult',
        'observation',
        'frequent_reassessment',
      ],
      'Peripheral (Benign)': [
        'meclizine',
        'ondansetron',
        'vestibular_rehabilitation_referral',
        'outpatient_follow_up',
      ],
    },
  },
]
