import type { CdrSeed } from './types'

/**
 * Batch 15 — Disposition / Risk Stratification + Procedural / Airway CDRs
 *
 * Covers: MEWS, Revised Trauma Score (RTS), Injury Severity Score (ISS),
 *         MELD Score, Child-Pugh Score, MOANS, RODS, SHORT, 3-3-2 Rule,
 *         ASA Physical Status Classification
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - MEWS: Subbe et al., QJM 2001; Gardner-Thorpe et al., Ann R Coll Surg Engl 2006
 *  - RTS: Champion et al., J Trauma 1989 (Triage RTS)
 *  - ISS: Baker et al., J Trauma 1974; AIS Committee on Injury Scaling
 *  - MELD: Kamath et al., Hepatology 2001; Wiesner et al., Gastroenterology 2003
 *  - Child-Pugh: Pugh et al., Br J Surg 1973
 *  - MOANS: Walls & Murphy, Manual of Emergency Airway Management, 5th Ed
 *  - RODS: Walls & Murphy, Manual of Emergency Airway Management, 5th Ed
 *  - SHORT: Walls & Murphy, Manual of Emergency Airway Management, 5th Ed
 *  - 3-3-2 Rule: Walls & Murphy, Manual of Emergency Airway Management, 5th Ed
 *  - ASA Classification: ASA House of Delegates, Last amended 2020
 */

export const batch15DispositionProcCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // MEWS — Modified Early Warning Score
  // 5 physiologic parameters each scored 0–3; total 0–15 (some variants 0–14)
  // ---------------------------------------------------------------------------
  {
    id: 'mews',
    name: 'MEWS',
    fullName: 'MEWS (Modified Early Warning Score)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application:
      'Simplified deterioration detection tool for inpatient monitoring. Score ≥5 warrants urgent medical review and critical care consultation.',
    applicableChiefComplaints: ['clinical_deterioration', 'inpatient_monitoring', 'vital_sign_abnormality'],
    keywords: [
      'MEWS',
      'Modified Early Warning Score',
      'deterioration',
      'inpatient',
      'vital signs',
      'escalation',
      'AVPU',
    ],
    components: [
      {
        id: 'sbp',
        label: 'Systolic Blood Pressure',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'SBP 101–199 mmHg', value: 0 },
          { label: 'SBP 81–100 mmHg', value: 1 },
          { label: 'SBP 71–80 mmHg or ≥200 mmHg', value: 2 },
          { label: 'SBP ≤70 mmHg', value: 3 },
        ],
      },
      {
        id: 'heart_rate',
        label: 'Heart Rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'HR 51–100 bpm', value: 0 },
          { label: 'HR 41–50 or 101–110 bpm', value: 1 },
          { label: 'HR ≤40 or 111–129 bpm', value: 2 },
          { label: 'HR ≥130 bpm', value: 3 },
        ],
      },
      {
        id: 'respiratory_rate',
        label: 'Respiratory Rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'RR 9–14 breaths/min', value: 0 },
          { label: 'RR 15–20 breaths/min', value: 1 },
          { label: 'RR 21–29 breaths/min', value: 2 },
          { label: 'RR <9 or ≥30 breaths/min', value: 3 },
        ],
      },
      {
        id: 'temperature',
        label: 'Temperature',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '35.0–38.4 °C (95.0–101.1 °F)', value: 0 },
          { label: '34.0–34.9 °C or 38.5–38.9 °C', value: 1 },
          { label: '≥39.0 °C (≥102.2 °F)', value: 2 },
          { label: '<34.0 °C (<93.2 °F)', value: 3 },
        ],
      },
      {
        id: 'avpu',
        label: 'AVPU Consciousness Level',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Alert', value: 0 },
          { label: 'Responds to Voice', value: 1 },
          { label: 'Responds to Pain', value: 2 },
          { label: 'Unresponsive', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Score 0–2: Continue routine monitoring' },
        {
          min: 3,
          max: 4,
          risk: 'Moderate',
          interpretation: 'Score 3–4: Increase monitoring frequency; notify primary team',
        },
        {
          min: 5,
          max: 15,
          risk: 'High',
          interpretation: 'Score ≥5: Urgent medical review; consider ICU/critical care consultation',
        },
      ],
    },
    suggestedTreatments: {
      High: ['icu_consult', 'continuous_monitoring', 'rapid_response_team'],
      Moderate: ['increased_monitoring', 'notify_primary_team'],
      Low: ['routine_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // Revised Trauma Score (RTS)
  // Triage version: 3 components (GCS, SBP, RR) each coded 0–4; max 12
  // ---------------------------------------------------------------------------
  {
    id: 'rts',
    name: 'Revised Trauma Score',
    fullName: 'Revised Trauma Score (RTS)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application:
      'Prehospital and ED triage tool; predicts survival in trauma. T-RTS ≤11 indicates need for trauma center transport.',
    applicableChiefComplaints: ['trauma', 'MVC', 'fall', 'penetrating_trauma', 'multi_system_trauma'],
    keywords: [
      'RTS',
      'Revised Trauma Score',
      'trauma triage',
      'T-RTS',
      'GCS',
      'SBP',
      'respiratory rate',
      'TRISS',
      'trauma center',
    ],
    components: [
      {
        id: 'gcs_coded',
        label: 'Glasgow Coma Scale (coded)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'GCS 13–15', value: 4 },
          { label: 'GCS 9–12', value: 3 },
          { label: 'GCS 6–8', value: 2 },
          { label: 'GCS 4–5', value: 1 },
          { label: 'GCS 3', value: 0 },
        ],
      },
      {
        id: 'sbp_coded',
        label: 'Systolic Blood Pressure (coded)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'SBP >89 mmHg', value: 4 },
          { label: 'SBP 76–89 mmHg', value: 3 },
          { label: 'SBP 50–75 mmHg', value: 2 },
          { label: 'SBP 1–49 mmHg', value: 1 },
          { label: 'SBP 0 (no pulse)', value: 0 },
        ],
      },
      {
        id: 'rr_coded',
        label: 'Respiratory Rate (coded)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'RR 10–29 breaths/min', value: 4 },
          { label: 'RR >29 breaths/min', value: 3 },
          { label: 'RR 6–9 breaths/min', value: 2 },
          { label: 'RR 1–5 breaths/min', value: 1 },
          { label: 'RR 0 (apneic)', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'Critical',
          interpretation:
            'T-RTS 0–3: Critical; associated with <10% predicted survival; immediate trauma center transport and resuscitation',
        },
        {
          min: 4,
          max: 7,
          risk: 'Severe',
          interpretation: 'T-RTS 4–7: Severe; ~30–60% predicted survival; trauma center transport indicated',
        },
        {
          min: 8,
          max: 11,
          risk: 'Moderate',
          interpretation:
            'T-RTS 8–11: Moderate; >60% predicted survival; consider trauma center transport (meets field triage criteria)',
        },
        {
          min: 12,
          max: 12,
          risk: 'Low',
          interpretation: 'T-RTS 12: Normal physiology; standard triage',
        },
      ],
    },
    suggestedTreatments: {
      Critical: ['trauma_center_transport', 'massive_transfusion_protocol', 'surgical_consult'],
      Severe: ['trauma_center_transport', 'trauma_activation', 'surgical_consult'],
      Moderate: ['trauma_center_transport', 'trauma_evaluation'],
      Low: ['standard_triage'],
    },
  },

  // ---------------------------------------------------------------------------
  // ISS — Injury Severity Score
  // Algorithm: 3 most injured body regions (AIS 1–5 each), squared and summed;
  // max 75; auto-75 if any AIS = 6
  // ---------------------------------------------------------------------------
  {
    id: 'iss',
    name: 'ISS',
    fullName: 'Injury Severity Score (ISS)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application:
      'Anatomic injury severity measure calculated after injuries are identified. Uses the three highest AIS scores from three different body regions; ISS ≥16 = major trauma.',
    applicableChiefComplaints: ['trauma', 'multi_system_trauma', 'MVC', 'penetrating_trauma', 'blunt_trauma'],
    keywords: [
      'ISS',
      'Injury Severity Score',
      'AIS',
      'Abbreviated Injury Scale',
      'trauma',
      'major trauma',
      'mortality',
      'TRISS',
      'anatomic scoring',
    ],
    components: [
      {
        id: 'ais_region_1',
        label: 'Highest AIS — Most Injured Body Region',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Minor injury (AIS 1)', value: 1 },
          { label: 'Moderate injury (AIS 2)', value: 2 },
          { label: 'Serious injury (AIS 3)', value: 3 },
          { label: 'Severe injury (AIS 4)', value: 4 },
          { label: 'Critical injury (AIS 5)', value: 5 },
          { label: 'Unsurvivable injury (AIS 6) — auto ISS 75', value: 6 },
        ],
      },
      {
        id: 'ais_region_2',
        label: 'Highest AIS — 2nd Most Injured Body Region',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'No additional region injured (AIS 0)', value: 0 },
          { label: 'Minor injury (AIS 1)', value: 1 },
          { label: 'Moderate injury (AIS 2)', value: 2 },
          { label: 'Serious injury (AIS 3)', value: 3 },
          { label: 'Severe injury (AIS 4)', value: 4 },
          { label: 'Critical injury (AIS 5)', value: 5 },
          { label: 'Unsurvivable injury (AIS 6) — auto ISS 75', value: 6 },
        ],
      },
      {
        id: 'ais_region_3',
        label: 'Highest AIS — 3rd Most Injured Body Region',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'No additional region injured (AIS 0)', value: 0 },
          { label: 'Minor injury (AIS 1)', value: 1 },
          { label: 'Moderate injury (AIS 2)', value: 2 },
          { label: 'Serious injury (AIS 3)', value: 3 },
          { label: 'Severe injury (AIS 4)', value: 4 },
          { label: 'Critical injury (AIS 5)', value: 5 },
          { label: 'Unsurvivable injury (AIS 6) — auto ISS 75', value: 6 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 8, risk: 'Minor', interpretation: 'ISS <9: Minor trauma' },
        { min: 9, max: 15, risk: 'Moderate', interpretation: 'ISS 9–15: Moderate trauma' },
        {
          min: 16,
          max: 24,
          risk: 'Severe',
          interpretation: 'ISS 16–24: Severe trauma (major trauma); trauma center care recommended',
        },
        { min: 25, max: 74, risk: 'Critical', interpretation: 'ISS ≥25: Critical trauma; high mortality' },
        {
          min: 75,
          max: 75,
          risk: 'Unsurvivable',
          interpretation: 'ISS 75: Unsurvivable injury present (any AIS = 6 automatically scores 75)',
        },
      ],
    },
    suggestedTreatments: {
      Unsurvivable: ['palliative_care_discussion', 'family_notification'],
      Critical: ['trauma_activation', 'massive_transfusion_protocol', 'surgical_consult', 'icu_admission'],
      Severe: ['trauma_activation', 'surgical_consult', 'admit_monitored_bed'],
      Moderate: ['trauma_evaluation', 'observation'],
      Minor: ['outpatient_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // MELD Score
  // Algorithm: logarithmic formula using bilirubin, INR, creatinine
  // MELD = 3.78 × ln(bilirubin) + 11.2 × ln(INR) + 9.57 × ln(creatinine) + 6.43
  // ---------------------------------------------------------------------------
  {
    id: 'meld',
    name: 'MELD Score',
    fullName: 'MELD Score / MELD-Na',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application:
      'End-stage liver disease severity; transplant prioritization; predicts 90-day mortality. MELD >15 generally indicates transplant evaluation.',
    applicableChiefComplaints: [
      'liver_failure',
      'cirrhosis',
      'ascites',
      'hepatic_encephalopathy',
      'jaundice',
      'GI_bleed',
    ],
    keywords: [
      'MELD',
      'MELD-Na',
      'liver disease',
      'transplant',
      'cirrhosis',
      'creatinine',
      'bilirubin',
      'INR',
      'sodium',
      '90-day mortality',
    ],
    requiredTests: ['creatinine', 'bilirubin', 'INR', 'sodium'],
    components: [
      {
        id: 'bilirubin',
        label: 'Total Bilirubin (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.0 mg/dL (floor 1.0 in calculation)', value: 1 },
          { label: '1.0–1.9 mg/dL', value: 3 },
          { label: '2.0–3.9 mg/dL', value: 6 },
          { label: '4.0–7.9 mg/dL', value: 9 },
          { label: '≥8.0 mg/dL', value: 12 },
        ],
      },
      {
        id: 'inr',
        label: 'INR',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.0 (floor 1.0 in calculation)', value: 0 },
          { label: '1.0–1.4', value: 2 },
          { label: '1.5–1.9', value: 5 },
          { label: '2.0–2.9', value: 8 },
          { label: '≥3.0', value: 11 },
        ],
      },
      {
        id: 'creatinine',
        label: 'Creatinine (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<1.0 mg/dL (floor 1.0 in calculation)', value: 0 },
          { label: '1.0–1.4 mg/dL', value: 3 },
          { label: '1.5–1.9 mg/dL', value: 6 },
          { label: '2.0–3.9 mg/dL', value: 9 },
          { label: '≥4.0 mg/dL (cap 4.0) or dialysis', value: 12 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 6, max: 9, risk: 'Low', interpretation: 'MELD <10: ~2% 90-day mortality' },
        { min: 10, max: 19, risk: 'Moderate', interpretation: 'MELD 10–19: ~6% 90-day mortality' },
        {
          min: 20,
          max: 29,
          risk: 'High',
          interpretation: 'MELD 20–29: ~20% 90-day mortality; transplant evaluation strongly considered',
        },
        {
          min: 30,
          max: 39,
          risk: 'Very High',
          interpretation: 'MELD 30–39: ~53% 90-day mortality; high transplant priority',
        },
        {
          min: 40,
          max: 40,
          risk: 'Critical',
          interpretation: 'MELD ≥40: ~71% 90-day mortality; urgent transplant priority',
        },
      ],
    },
    suggestedTreatments: {
      Critical: ['icu_admission', 'transplant_center_transfer', 'gi_hepatology_consult'],
      'Very High': ['transplant_center_transfer', 'gi_hepatology_consult', 'icu_consult'],
      High: ['gi_hepatology_consult', 'transplant_evaluation', 'admission'],
      Moderate: ['gi_hepatology_consult', 'outpatient_transplant_referral'],
      Low: ['outpatient_follow_up', 'hepatology_referral'],
    },
  },

  // ---------------------------------------------------------------------------
  // Child-Pugh Score
  // 5 components each scored 1–3; total 5–15
  // ---------------------------------------------------------------------------
  {
    id: 'child_pugh',
    name: 'Child-Pugh Score',
    fullName: 'Child-Pugh Score',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application:
      'Classifies cirrhosis severity; predicts surgical risk and survival. Class C (score 10–15) associated with 45% 1-year and 35% 2-year survival.',
    applicableChiefComplaints: [
      'cirrhosis',
      'liver_disease',
      'ascites',
      'hepatic_encephalopathy',
      'jaundice',
      'GI_bleed',
    ],
    keywords: [
      'Child-Pugh',
      'cirrhosis',
      'liver failure',
      'surgical risk',
      'ascites',
      'encephalopathy',
      'bilirubin',
      'albumin',
      'INR',
      'hepatic',
    ],
    requiredTests: ['bilirubin', 'albumin', 'INR'],
    components: [
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<2 mg/dL (<34 µmol/L)', value: 1 },
          { label: '2–3 mg/dL (34–50 µmol/L)', value: 2 },
          { label: '>3 mg/dL (>50 µmol/L)', value: 3 },
        ],
      },
      {
        id: 'albumin',
        label: 'Serum Albumin',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>3.5 g/dL', value: 1 },
          { label: '2.8–3.5 g/dL', value: 2 },
          { label: '<2.8 g/dL', value: 3 },
        ],
      },
      {
        id: 'inr',
        label: 'INR (Prothrombin Time)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'INR <1.7', value: 1 },
          { label: 'INR 1.7–2.3', value: 2 },
          { label: 'INR >2.3', value: 3 },
        ],
      },
      {
        id: 'ascites',
        label: 'Ascites',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Absent', value: 1 },
          { label: 'Slight (controlled with diuretics)', value: 2 },
          { label: 'Moderate-severe (refractory)', value: 3 },
        ],
      },
      {
        id: 'encephalopathy',
        label: 'Hepatic Encephalopathy',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 1 },
          { label: 'Grade 1–2 (mild confusion, asterixis)', value: 2 },
          { label: 'Grade 3–4 (somnolence to coma)', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 5,
          max: 6,
          risk: 'Low',
          interpretation: 'Class A (5–6): Well-compensated cirrhosis; 1-year survival 100%, 2-year 85%',
        },
        {
          min: 7,
          max: 9,
          risk: 'Moderate',
          interpretation: 'Class B (7–9): Significant compromise; 1-year survival 81%, 2-year 57%',
        },
        {
          min: 10,
          max: 15,
          risk: 'High',
          interpretation:
            'Class C (10–15): Decompensated cirrhosis; 1-year survival 45%, 2-year 35%; high surgical mortality',
        },
      ],
    },
    suggestedTreatments: {
      High: ['icu_consult', 'gi_hepatology_consult', 'transplant_evaluation', 'avoid_elective_procedures'],
      Moderate: ['gi_hepatology_consult', 'medical_optimization', 'transplant_referral'],
      Low: ['outpatient_follow_up', 'hepatology_referral'],
    },
  },

  // ---------------------------------------------------------------------------
  // MOANS — Difficult BVM Ventilation
  // 5 binary criteria: any positive → anticipate difficult BVM
  // ---------------------------------------------------------------------------
  {
    id: 'moans',
    name: 'MOANS',
    fullName: 'MOANS',
    category: 'PROCEDURAL / AIRWAY',
    application:
      'Predicts difficult bag-valve-mask (BVM) ventilation. Any positive factor warrants preparation with adjuncts (OPA/NPA, two-person technique, supraglottic device backup).',
    applicableChiefComplaints: ['airway_management', 'BVM_ventilation', 'respiratory_failure', 'apnea'],
    keywords: [
      'MOANS',
      'bag-valve-mask',
      'BVM',
      'difficult ventilation',
      'airway',
      'mask seal',
      'obesity',
      'COPD',
      'sleep apnea',
    ],
    components: [
      {
        id: 'mask_seal',
        label: 'Mask seal difficulty (beard, facial trauma, blood/secretions, facial deformity)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'obesity',
        label: 'Obesity / Obstructive sleep apnea (BMI >30 or known OSA)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age',
        label: 'Age >55 years (reduced tissue compliance)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_teeth',
        label: 'No teeth / Edentulous (poor mask seal)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'stiffness',
        label: 'Stiffness / Snoring (COPD, asthma, pulmonary fibrosis, advanced pregnancy, or upper airway obstruction)',
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
          risk: 'Standard',
          interpretation: 'No positive factors: Standard BVM ventilation expected',
        },
        {
          min: 1,
          max: 5,
          risk: 'High',
          interpretation:
            'Any positive factor → Anticipate difficult BVM ventilation; have adjuncts ready (OPA/NPA, two-person technique, supraglottic device backup)',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // RODS — Difficult EGD / Supraglottic Airway
  // 4 binary criteria: any positive → EGD may fail
  // ---------------------------------------------------------------------------
  {
    id: 'rods',
    name: 'RODS',
    fullName: 'RODS',
    category: 'PROCEDURAL / AIRWAY',
    application:
      'Predicts difficult extraglottic device (EGD/supraglottic airway) placement. Any positive factor suggests EGD may not be a reliable rescue and surgical airway should be planned.',
    applicableChiefComplaints: [
      'airway_management',
      'cannot_intubate',
      'respiratory_failure',
      'airway_obstruction',
    ],
    keywords: [
      'RODS',
      'extraglottic device',
      'EGD',
      'supraglottic airway',
      'LMA',
      'difficult airway',
      'surgical airway',
    ],
    components: [
      {
        id: 'restricted_opening',
        label: 'Restricted mouth opening (<3 cm or 2 finger-breadths)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'obstruction',
        label: 'Obstruction at or below the glottis (tumor, epiglottitis, peritonsillar abscess, foreign body)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'distorted_airway',
        label: 'Distorted airway anatomy (radiation changes, tumor, abscess, angioedema, congenital anomaly)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'stiff_lungs',
        label: 'Stiff lungs / Stiff compliance (severe bronchospasm, pulmonary edema, ARDS, advanced pregnancy, morbid obesity)',
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
          risk: 'Standard',
          interpretation: 'No positive factors: EGD likely to be effective rescue device',
        },
        {
          min: 1,
          max: 4,
          risk: 'High',
          interpretation:
            'Any positive factor → EGD may not be a reliable rescue; plan for surgical airway',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // SHORT — Difficult Cricothyrotomy
  // 5 binary criteria: any positive → difficult surgical airway
  // ---------------------------------------------------------------------------
  {
    id: 'short',
    name: 'SHORT',
    fullName: 'SHORT',
    category: 'PROCEDURAL / AIRWAY',
    application:
      'Predicts difficult cricothyrotomy (surgical airway). Any positive factor suggests the procedure may be technically challenging.',
    applicableChiefComplaints: [
      'airway_management',
      'cannot_intubate_cannot_oxygenate',
      'surgical_airway',
      'neck_trauma',
    ],
    keywords: [
      'SHORT',
      'cricothyrotomy',
      'surgical airway',
      'difficult airway',
      'neck hematoma',
      'obesity',
      'cannot intubate',
      'CICO',
    ],
    components: [
      {
        id: 'surgery',
        label: 'Surgery or other scarring of the neck (prior tracheostomy, thyroidectomy, cervical spine hardware)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hematoma',
        label: 'Hematoma / Infection (expanding neck hematoma, abscess, or Ludwig angina)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'obesity',
        label: 'Obesity (obscured landmarks, increased distance to membrane)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'radiation',
        label: 'Radiation distortion / Restricted access (prior neck radiation causing fibrosis, cervical collar)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'tumor',
        label: 'Tumor / Tissue abnormality (thyroid mass, anterior neck mass, subcutaneous emphysema)',
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
          risk: 'Standard',
          interpretation: 'No positive factors: Standard cricothyrotomy expected',
        },
        {
          min: 1,
          max: 5,
          risk: 'High',
          interpretation:
            'Any positive factor → Cricothyrotomy may be technically difficult; consider awake intubation; have backup plans; consider patient positioning',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 3-3-2 Rule — Airway Geometry Assessment
  // 3 measurements: any inadequate → difficult laryngoscopy
  // (threshold: 3 = all adequate = standard; <3 = high risk)
  // ---------------------------------------------------------------------------
  {
    id: 'three_three_two',
    name: '3-3-2 Rule',
    fullName: '3-3-2 Rule',
    category: 'PROCEDURAL / AIRWAY',
    application:
      'Quick bedside airway geometry assessment to predict difficulty with direct laryngoscopy. Evaluates three distances: mouth opening, submandibular space, and thyromental distance.',
    applicableChiefComplaints: ['airway_management', 'intubation', 'difficult_airway', 'RSI'],
    keywords: [
      '3-3-2 rule',
      'airway geometry',
      'thyromental distance',
      'mouth opening',
      'submandibular space',
      'direct laryngoscopy',
      'difficult airway',
    ],
    components: [
      {
        id: 'mouth_opening',
        label: 'Mouth opening ≥3 finger-breadths (inter-incisor distance ≥4 cm)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hyoid_mentum',
        label: 'Hyoid-to-mentum distance ≥3 finger-breadths (mandibular space adequacy)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'thyroid_floor',
        label: 'Thyroid notch-to-floor of mouth ≥2 finger-breadths (larynx position)',
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
          min: 3,
          max: 3,
          risk: 'Standard',
          interpretation: 'All measurements adequate: Likely adequate space for laryngoscopy',
        },
        {
          min: 0,
          max: 2,
          risk: 'High',
          interpretation:
            'Any measurement reduced → Predicts difficulty; plan for difficult airway accordingly',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ASA Physical Status Classification
  // Single select: 6 classes (I–VI)
  // ---------------------------------------------------------------------------
  {
    id: 'asa_classification',
    name: 'ASA Classification',
    fullName: 'ASA Physical Status Classification',
    category: 'PROCEDURAL / AIRWAY',
    application:
      'Pre-procedural risk stratification; standardized communication about patient baseline health. ASA I–II generally safe for ED procedural sedation by emergency physicians.',
    applicableChiefComplaints: ['procedural_sedation', 'procedure', 'sedation', 'anesthesia'],
    keywords: [
      'ASA',
      'physical status',
      'anesthesia',
      'procedural sedation',
      'pre-procedural',
      'risk stratification',
      'ASA I',
      'ASA II',
      'ASA III',
    ],
    components: [
      {
        id: 'asa_class',
        label: 'ASA Physical Status Class',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'ASA I — Normal healthy patient', value: 1 },
          { label: 'ASA II — Mild systemic disease (well-controlled HTN, DM, obesity BMI 30–40, social ETOH)', value: 2 },
          { label: 'ASA III — Severe systemic disease (poorly controlled DM/HTN, COPD, morbid obesity BMI ≥40, active hepatitis, alcohol dependence, pacemaker, moderate EF reduction, ESRD on dialysis, history of MI/CVA/TIA/CAD >3 months)', value: 3 },
          { label: 'ASA IV — Severe systemic disease that is a constant threat to life (recent MI/CVA/TIA <3 months, ongoing cardiac ischemia, severe valve disease, severe EF reduction, sepsis, DIC, ARDS)', value: 4 },
          { label: 'ASA V — Moribund patient not expected to survive without the operation (ruptured AAA, massive trauma, intracranial bleed with mass effect, ischemic bowel with cardiac disease)', value: 5 },
          { label: 'ASA VI — Declared brain-dead patient (organ donor)', value: 6 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 2,
          risk: 'Low',
          interpretation:
            'ASA I–II: Generally safe for ED procedural sedation by emergency physicians',
        },
        {
          min: 3,
          max: 3,
          risk: 'Moderate',
          interpretation:
            'ASA III: Increased risk; careful risk-benefit analysis; consider anesthesia involvement',
        },
        {
          min: 4,
          max: 4,
          risk: 'High',
          interpretation:
            'ASA IV: Severe risk; strong consideration for anesthesia-managed sedation or operating room',
        },
        {
          min: 5,
          max: 5,
          risk: 'Very High',
          interpretation:
            'ASA V: Moribund; not expected to survive without surgery; maximal risk',
        },
        {
          min: 6,
          max: 6,
          risk: 'Not Applicable',
          interpretation: 'ASA VI: Brain-dead; organ procurement only',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': ['operating_room', 'anesthesia_managed', 'surgical_consult'],
      High: ['anesthesia_consult', 'operating_room_preferred', 'continuous_monitoring'],
      Moderate: ['anesthesia_consult', 'enhanced_monitoring', 'risk_benefit_discussion'],
      Low: ['standard_ed_procedural_sedation', 'routine_monitoring'],
    },
  },
]
