import type { CdrSeed } from './types'

/**
 * Batch 9 — Cardiovascular III + Pulmonary CDRs
 *
 * Covers: OHFRS, Modified Duke Criteria, CRUSADE, Framingham HF, DASI,
 *         ATRIA Bleeding, STRATIFY, CRB-65, DECAF, PASS
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - OHFRS: Stiell et al., Ann Emerg Med 2013
 *  - Modified Duke: Li et al., Clin Infect Dis 2000 (modified from Durack 1994)
 *  - CRUSADE: Subherwal et al., Circulation 2009
 *  - Framingham HF: McKee et al., NEJM 1971; Ho et al., Circulation 1993
 *  - DASI: Hlatky et al., Am J Cardiol 1989
 *  - ATRIA Bleeding: Fang et al., J Am Coll Cardiol 2011
 *  - STRATIFY: Lee et al., JACC Heart Failure 2019
 *  - CRB-65: Bauer et al., Eur Respir J 2006 (simplified CURB-65)
 *  - DECAF: Steer et al., Thorax 2012
 *  - PASS: Gorelick et al., Acad Emerg Med 2004
 */

export const batch9CardioIiiCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Ottawa Heart Failure Risk Scale (OHFRS)
  // Sum-based, ~10 weighted criteria for 14-day serious events in acute HF
  // ---------------------------------------------------------------------------
  {
    id: 'ohfrs',
    name: 'OHFRS',
    fullName: 'Ottawa Heart Failure Risk Scale (OHFRS)',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts short-term (14-day) serious adverse events in ED heart failure patients being considered for discharge.',
    applicableChiefComplaints: [
      'heart_failure',
      'shortness_of_breath',
      'dyspnea',
      'acute_decompensated_heart_failure',
    ],
    keywords: [
      'Ottawa heart failure risk scale',
      'OHFRS',
      'heart failure disposition',
      'HF discharge risk',
      'BNP heart failure',
      'troponin heart failure',
      'ischemic ECG heart failure',
    ],
    requiredTests: ['ECG', 'troponin', 'BUN/urea', 'NT-proBNP', 'serum CO2'],
    components: [
      {
        id: 'hx_stroke_tia',
        label: 'History of stroke or TIA',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'oxygen_saturation',
        label: 'Oxygen saturation <90% on assessment',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hr_gt_110',
        label: 'Heart rate on ED arrival ≥110 bpm',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'co2_lt_33',
        label: 'Serum CO₂ <33 mEq/L (venous)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'troponin_elevated',
        label: 'Troponin I or T elevated (above 99th percentile URL)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'nt_probnp_gt_5000',
        label: 'NT-proBNP ≥5,000 pg/mL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ecg_acute_ischemia',
        label: 'ECG with acute ST-segment depression',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'urea_gt_12',
        label: 'Urea (BUN) ≥12 mmol/L (≈33.6 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'hf_previous_visit',
        label: 'ED visit or hospitalization for HF in past 2 weeks',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'arrival_by_ambulance',
        label: 'Arrived by EMS (ambulance)',
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
          interpretation:
            'Score 0: ~2.8% 14-day serious adverse event risk — consider discharge with close follow-up within 48–72 hours.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation:
            'Score 1: ~5.3% 14-day risk — consider discharge with close follow-up.',
        },
        {
          min: 2,
          max: 3,
          risk: 'Moderate',
          interpretation:
            'Score 2–3: ~10–15% 14-day risk — observation or short-stay unit recommended.',
        },
        {
          min: 4,
          max: 14,
          risk: 'High',
          interpretation:
            'Score ≥4: ~20%+ 14-day risk of serious adverse events — admission recommended.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['admit_telemetry', 'iv_diuretics', 'cardiology_consult', 'daily_weights'],
      Moderate: ['observation_unit', 'iv_diuretics', 'close_follow_up'],
      Low: ['discharge_with_follow_up', 'oral_diuretic_adjustment'],
      'Very Low': ['discharge_with_follow_up', 'pcp_follow_up_48h'],
    },
  },

  // ---------------------------------------------------------------------------
  // Modified Duke Criteria (Infective Endocarditis)
  // Algorithm-based: major + minor criteria classification
  // ---------------------------------------------------------------------------
  {
    id: 'modified_duke',
    name: 'Modified Duke',
    fullName: 'Modified Duke Criteria (Infective Endocarditis)',
    category: 'CARDIOVASCULAR',
    application: 'Diagnostic criteria for infective endocarditis.',
    applicableChiefComplaints: [
      'fever_with_bacteremia',
      'endocarditis',
      'fever_ivdu',
      'new_murmur_fever',
    ],
    keywords: [
      'Duke criteria',
      'modified Duke criteria',
      'infective endocarditis',
      'endocarditis diagnosis',
      'blood culture endocarditis',
      'echocardiogram vegetation',
      'HACEK endocarditis',
      'Staph aureus bacteremia',
    ],
    requiredTests: ['blood cultures (×2 or more)', 'echocardiogram'],
    components: [
      // --- Major Criteria ---
      {
        id: 'major_blood_cultures',
        label:
          'MAJOR: Positive blood cultures (typical organism from 2 separate cultures, or persistently positive cultures)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'major_echo_positive',
        label:
          'MAJOR: Positive echocardiogram (oscillating intracardiac mass/vegetation, abscess, or new prosthetic valve dehiscence)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'major_new_valvular_regurgitation',
        label: 'MAJOR: New valvular regurgitation (new murmur or worsening/changing of pre-existing murmur)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      // --- Minor Criteria ---
      {
        id: 'minor_predisposition',
        label: 'MINOR: Predisposing heart condition or injection drug use (IVDU)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'minor_fever',
        label: 'MINOR: Fever ≥38.0°C (100.4°F)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'minor_vascular_phenomena',
        label:
          'MINOR: Vascular phenomena (major arterial emboli, septic pulmonary infarcts, mycotic aneurysm, Janeway lesions, conjunctival hemorrhage)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'minor_immunologic_phenomena',
        label:
          'MINOR: Immunologic phenomena (glomerulonephritis, Osler nodes, Roth spots, positive rheumatoid factor)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'minor_micro_evidence',
        label:
          'MINOR: Microbiological evidence (positive blood culture not meeting major criteria, or serologic evidence of active infection with organism consistent with IE)',
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
          max: 2,
          risk: 'Rejected',
          interpretation:
            'Firm alternative diagnosis explaining findings, OR resolution of manifestations with ≤4 days of antibiotic therapy, OR no pathologic evidence of IE at surgery or autopsy — Rejected. Does not meet criteria for possible or definite IE.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Possible',
          interpretation:
            '1 major + 1 minor criterion, OR 3 minor criteria → Possible IE. Further evaluation recommended (repeat blood cultures, TEE if TTE non-diagnostic).',
        },
        {
          min: 5,
          max: 11,
          risk: 'Definite',
          interpretation:
            '2 major criteria, OR 1 major + 3 minor criteria, OR 5 minor criteria → Definite IE. Initiate empiric antibiotic therapy and obtain infectious disease consult.',
        },
      ],
    },
    suggestedTreatments: {
      Definite: [
        'empiric_iv_antibiotics',
        'infectious_disease_consult',
        'repeat_blood_cultures',
        'tee_if_tte_nondiagnostic',
        'admit_telemetry',
      ],
      Possible: [
        'repeat_blood_cultures',
        'tee_if_tte_nondiagnostic',
        'empiric_antibiotics_if_septic',
        'infectious_disease_consult',
      ],
      Rejected: ['alternative_diagnosis_workup'],
    },
  },

  // ---------------------------------------------------------------------------
  // CRUSADE Bleeding Score
  // Sum-based, weighted criteria for in-hospital major bleeding in NSTEMI
  // ---------------------------------------------------------------------------
  {
    id: 'crusade',
    name: 'CRUSADE',
    fullName: 'CRUSADE Bleeding Score',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts in-hospital major bleeding risk in NSTEMI patients. Guides decisions about anticoagulation intensity and invasive strategy.',
    applicableChiefComplaints: ['nstemi', 'acs', 'chest_pain'],
    keywords: [
      'CRUSADE',
      'CRUSADE bleeding score',
      'NSTEMI bleeding risk',
      'ACS bleeding risk',
      'anticoagulation bleeding NSTEMI',
      'hematocrit bleeding',
      'creatinine clearance bleeding',
    ],
    requiredTests: ['hematocrit', 'creatinine clearance', 'heart rate', 'blood pressure'],
    components: [
      {
        id: 'hematocrit',
        label: 'Baseline hematocrit',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥40%', value: 0 },
          { label: '37–39.9%', value: 2 },
          { label: '34–36.9%', value: 3 },
          { label: '31–33.9%', value: 7 },
          { label: '<31%', value: 9 },
        ],
      },
      {
        id: 'creatinine_clearance',
        label: 'Creatinine clearance (mL/min)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '>120 mL/min', value: 0 },
          { label: '91–120 mL/min', value: 7 },
          { label: '61–90 mL/min', value: 17 },
          { label: '31–60 mL/min', value: 28 },
          { label: '≤30 mL/min', value: 35 },
        ],
      },
      {
        id: 'heart_rate',
        label: 'Heart rate (bpm)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '≤70', value: 0 },
          { label: '71–80', value: 1 },
          { label: '81–90', value: 3 },
          { label: '91–100', value: 6 },
          { label: '101–110', value: 8 },
          { label: '111–120', value: 10 },
          { label: '>120', value: 11 },
        ],
      },
      {
        id: 'sex',
        label: 'Sex',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Male', value: 0 },
          { label: 'Female', value: 8 },
        ],
      },
      {
        id: 'chf_signs',
        label: 'Signs of CHF at presentation (rales, JVD, peripheral edema)',
        type: 'boolean',
        value: 7,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'prior_vascular_disease',
        label: 'Prior vascular disease (peripheral arterial disease or stroke)',
        type: 'boolean',
        value: 6,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'diabetes',
        label: 'Diabetes mellitus',
        type: 'boolean',
        value: 6,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'systolic_bp',
        label: 'Systolic blood pressure (mmHg)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '≤90', value: 10 },
          { label: '91–100', value: 8 },
          { label: '101–120', value: 5 },
          { label: '121–180', value: 1 },
          { label: '181–200', value: 3 },
          { label: '>200', value: 5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 20,
          risk: 'Very Low',
          interpretation: 'Score ≤20: 3.1% major in-hospital bleeding rate.',
        },
        {
          min: 21,
          max: 30,
          risk: 'Low',
          interpretation: 'Score 21–30: 5.5% major in-hospital bleeding rate.',
        },
        {
          min: 31,
          max: 40,
          risk: 'Moderate',
          interpretation: 'Score 31–40: 8.6% major in-hospital bleeding rate.',
        },
        {
          min: 41,
          max: 50,
          risk: 'High',
          interpretation:
            'Score 41–50: 11.9% major in-hospital bleeding rate. Consider reduced anticoagulation intensity.',
        },
        {
          min: 51,
          max: 92,
          risk: 'Very High',
          interpretation:
            'Score >50: 19.5% major in-hospital bleeding rate. Strongly consider conservative strategy and reduced anticoagulation.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'reduced_anticoagulation',
        'conservative_strategy_consideration',
        'type_and_screen',
        'bleeding_precautions',
      ],
      High: ['reduced_anticoagulation', 'type_and_screen', 'close_monitoring'],
      Moderate: ['standard_anticoagulation', 'monitoring'],
      Low: ['standard_anticoagulation'],
      'Very Low': ['standard_anticoagulation'],
    },
  },

  // ---------------------------------------------------------------------------
  // Framingham Heart Failure Criteria
  // Threshold-based: 2 major OR 1 major + 2 minor = CHF diagnosis
  // Major criteria = 2 pts each, minor = 1 pt each
  // ---------------------------------------------------------------------------
  {
    id: 'framingham_hf',
    name: 'Framingham HF',
    fullName: 'Framingham Heart Failure Criteria',
    category: 'CARDIOVASCULAR',
    application:
      'Clinical diagnosis of congestive heart failure. Requires 2 major criteria OR 1 major + 2 minor criteria.',
    applicableChiefComplaints: [
      'heart_failure',
      'shortness_of_breath',
      'dyspnea',
      'edema',
      'orthopnea',
    ],
    keywords: [
      'Framingham heart failure criteria',
      'CHF diagnosis',
      'congestive heart failure criteria',
      'paroxysmal nocturnal dyspnea',
      'S3 gallop',
      'cardiomegaly',
      'JVD CHF',
      'rales CHF',
    ],
    components: [
      // --- Major Criteria (2 pts each) ---
      {
        id: 'major_pnd',
        label: 'MAJOR: Paroxysmal nocturnal dyspnea (PND) or orthopnea',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'major_jvd',
        label: 'MAJOR: Jugular venous distension (JVD)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'major_rales',
        label: 'MAJOR: Rales (crackles on lung auscultation)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'major_cardiomegaly',
        label: 'MAJOR: Cardiomegaly (on chest radiograph)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'major_acute_pulmonary_edema',
        label: 'MAJOR: Acute pulmonary edema (on exam or chest radiograph)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'major_s3_gallop',
        label: 'MAJOR: S3 gallop',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'major_hepatojugular_reflux',
        label: 'MAJOR: Hepatojugular reflux',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'major_weight_loss',
        label: 'MAJOR: Weight loss >4.5 kg in 5 days in response to CHF treatment',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // --- Minor Criteria (1 pt each) ---
      {
        id: 'minor_bilateral_ankle_edema',
        label: 'MINOR: Bilateral ankle edema',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'minor_nocturnal_cough',
        label: 'MINOR: Nocturnal cough',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'minor_doe',
        label: 'MINOR: Dyspnea on ordinary exertion',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'minor_hepatomegaly',
        label: 'MINOR: Hepatomegaly',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'minor_pleural_effusion',
        label: 'MINOR: Pleural effusion',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'minor_tachycardia',
        label: 'MINOR: Heart rate ≥120 bpm',
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
          max: 3,
          risk: 'Non-Diagnostic',
          interpretation:
            'Insufficient criteria — CHF not diagnosed. Neither 2 major criteria nor 1 major + 2 minor criteria met.',
        },
        {
          min: 4,
          max: 22,
          risk: 'CHF Diagnosed',
          interpretation:
            '2 major criteria (≥4 pts from major) OR 1 major + 2 minor criteria met → CHF diagnosis (sensitivity ~97%, specificity ~78%). Initiate appropriate heart failure management.',
        },
      ],
    },
    suggestedTreatments: {
      'CHF Diagnosed': [
        'iv_diuretics',
        'supplemental_oxygen',
        'cardiology_consult',
        'echocardiogram',
        'bnp_or_nt_probnp',
        'admit_telemetry',
      ],
      'Non-Diagnostic': ['alternative_diagnosis_workup', 'bnp_or_nt_probnp', 'echocardiogram_if_clinical_suspicion'],
    },
  },

  // ---------------------------------------------------------------------------
  // Duke Activity Status Index (DASI)
  // Sum-based, 12 binary activity items with varying metabolic weights
  // ---------------------------------------------------------------------------
  {
    id: 'dasi',
    name: 'DASI',
    fullName: 'Duke Activity Status Index (DASI)',
    category: 'CARDIOVASCULAR',
    application:
      'Estimates functional capacity in METs (metabolic equivalents) from self-reported activities. Used for preoperative cardiac risk assessment.',
    applicableChiefComplaints: [
      'preoperative_evaluation',
      'cardiac_risk_assessment',
      'chest_pain',
      'dyspnea_on_exertion',
    ],
    keywords: [
      'DASI',
      'Duke activity status index',
      'functional capacity METs',
      'preoperative cardiac risk',
      'metabolic equivalents',
      'perioperative cardiac assessment',
      'exercise capacity',
    ],
    components: [
      {
        id: 'self_care',
        label: 'Can you take care of yourself (eating, dressing, bathing, using the toilet)?',
        type: 'boolean',
        value: 2.75,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'walk_indoors',
        label: 'Can you walk indoors, such as around your house?',
        type: 'boolean',
        value: 1.75,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'walk_block',
        label: 'Can you walk a block or two on level ground (100–200 m)?',
        type: 'boolean',
        value: 2.75,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'climb_flight',
        label: 'Can you climb a flight of stairs or walk up a hill?',
        type: 'boolean',
        value: 5.50,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'run_short_distance',
        label: 'Can you run a short distance?',
        type: 'boolean',
        value: 8.00,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'light_housework',
        label: 'Can you do light housework (dusting, washing dishes)?',
        type: 'boolean',
        value: 2.70,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'moderate_housework',
        label: 'Can you do moderate housework (vacuuming, sweeping floors, carrying groceries)?',
        type: 'boolean',
        value: 3.50,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heavy_housework',
        label: 'Can you do heavy housework (scrubbing floors, lifting/moving heavy furniture)?',
        type: 'boolean',
        value: 8.00,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'yard_work',
        label: 'Can you do yard work (raking leaves, weeding, pushing a power mower)?',
        type: 'boolean',
        value: 4.50,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'sexual_relations',
        label: 'Can you have sexual relations?',
        type: 'boolean',
        value: 5.25,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'moderate_recreation',
        label:
          'Can you participate in moderate recreational activities (golf, bowling, dancing, doubles tennis, throwing a ball)?',
        type: 'boolean',
        value: 6.00,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'strenuous_sports',
        label:
          'Can you participate in strenuous sports (swimming, singles tennis, football, basketball, skiing)?',
        type: 'boolean',
        value: 7.50,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 11,
          risk: 'Poor',
          interpretation:
            'DASI ≤11 (approximately <4 METs): Poor functional capacity — increased perioperative cardiac risk. Consider further cardiac testing before non-emergent surgery.',
        },
        {
          min: 12,
          max: 33,
          risk: 'Moderate',
          interpretation:
            'DASI 12–33 (approximately 4–7 METs): Moderate functional capacity — intermediate perioperative cardiac risk.',
        },
        {
          min: 34,
          max: 58.2,
          risk: 'Adequate',
          interpretation:
            'DASI ≥34 (approximately ≥7 METs): Adequate functional capacity — generally low perioperative cardiac risk. Proceed with surgery per clinical judgment.',
        },
      ],
    },
    suggestedTreatments: {
      Poor: ['pharmacologic_stress_test', 'echocardiogram', 'cardiology_consult', 'delay_surgery_if_possible'],
      Moderate: ['proceed_with_monitoring', 'cardiology_consult_if_symptomatic'],
      Adequate: ['proceed_with_surgery', 'standard_perioperative_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // ATRIA Bleeding Risk Score
  // Sum-based, 5 weighted criteria for hemorrhage in AF on warfarin
  // ---------------------------------------------------------------------------
  {
    id: 'atria_bleeding',
    name: 'ATRIA Bleeding',
    fullName: 'ATRIA Bleeding Risk Score',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts major hemorrhage risk in patients on warfarin for atrial fibrillation.',
    applicableChiefComplaints: [
      'atrial_fibrillation',
      'anticoagulation_management',
      'afib',
    ],
    keywords: [
      'ATRIA bleeding',
      'ATRIA bleeding risk',
      'warfarin hemorrhage risk',
      'atrial fibrillation bleeding warfarin',
      'anticoagulation major bleeding',
      'anemia bleeding risk',
      'renal disease bleeding',
    ],
    requiredTests: ['hemoglobin', 'eGFR/creatinine'],
    components: [
      {
        id: 'anemia',
        label: 'Anemia (hemoglobin <13 g/dL male, <12 g/dL female)',
        type: 'boolean',
        value: 3,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'severe_renal_disease',
        label: 'Severe renal disease (eGFR <30 mL/min or dialysis-dependent)',
        type: 'boolean',
        value: 3,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'age_gte_75',
        label: 'Age ≥75 years',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_hemorrhage',
        label: 'Any prior hemorrhage diagnosis (GI bleed, intracranial hemorrhage, hemorrhagic stroke, etc.)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hypertension',
        label: 'Diagnosed hypertension',
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
          risk: 'Low',
          interpretation:
            'Score 0–3: Low risk — 0.8% annual major hemorrhage rate. Benefits of anticoagulation likely outweigh risks.',
        },
        {
          min: 4,
          max: 4,
          risk: 'Intermediate',
          interpretation:
            'Score 4: Intermediate risk — 2.6% annual major hemorrhage rate. Weigh anticoagulation benefits against bleeding risk.',
        },
        {
          min: 5,
          max: 10,
          risk: 'High',
          interpretation:
            'Score 5–10: High risk — 5.8% annual major hemorrhage rate. Careful consideration of anticoagulation alternatives (e.g., DOAC, left atrial appendage closure).',
        },
      ],
    },
    suggestedTreatments: {
      High: ['reassess_anticoagulation', 'consider_doac', 'hematology_consult', 'gi_prophylaxis'],
      Intermediate: ['continue_anticoagulation_with_monitoring', 'close_inr_follow_up'],
      Low: ['continue_anticoagulation', 'routine_inr_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // STRATIFY Score for Acute Heart Failure
  // Threshold-based: any criterion present = not safe for early discharge
  // ---------------------------------------------------------------------------
  {
    id: 'stratify_ahf',
    name: 'STRATIFY',
    fullName: 'STRATIFY Decision Rule (Acute Heart Failure)',
    category: 'CARDIOVASCULAR',
    application:
      'Aids disposition decision-making for acute heart failure. Identifies patients safe for discharge.',
    applicableChiefComplaints: [
      'dyspnea',
      'heart_failure',
      'chf_exacerbation',
      'edema',
      'shortness_of_breath',
    ],
    keywords: [
      'STRATIFY',
      'acute heart failure',
      'CHF',
      'disposition',
      'discharge',
      'heart failure exacerbation',
    ],
    requiredTests: ['troponin', 'bmp', 'ecg', 'chest_xray'],
    components: [
      {
        id: 'troponin_elevated',
        label: 'Troponin elevation (above 99th percentile URL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'renal_dysfunction',
        label: 'Renal dysfunction (creatinine >2.0 mg/dL or eGFR <30 mL/min)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'ischemic_ecg',
        label: 'Ischemic ECG changes (new ST depression or T-wave inversion)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'inadequate_oxygenation',
        label: 'Inadequate oxygenation (SpO₂ <92% on room air or requiring supplemental O₂)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'inadequate_diuresis',
        label: 'Inadequate diuresis response (<500 mL urine output in first 2 hours after IV diuretic)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'unstable_vitals',
        label: 'Unstable vital signs (SBP <90 mmHg or HR >130 bpm)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'iv_vasodilator_inotrope',
        label: 'Requires IV vasodilators or inotropes',
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
            'All criteria absent (no troponin elevation, no renal dysfunction, no ischemic ECG changes, adequate oxygenation, adequate diuresis, stable vitals, no IV vasodilators/inotropes). Safe for discharge consideration with close follow-up.',
        },
        {
          min: 1,
          max: 7,
          risk: 'Not Low',
          interpretation:
            'One or more criteria present. Not safe for early discharge. Continued inpatient management recommended.',
        },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['admit_telemetry', 'iv_diuretics', 'cardiology_consult', 'continuous_monitoring'],
      Low: ['discharge_with_follow_up', 'oral_diuretic_adjustment', 'pcp_follow_up_48h'],
    },
  },

  // ---------------------------------------------------------------------------
  // CRB-65
  // Sum-based, 4 binary criteria for community-acquired pneumonia severity
  // ---------------------------------------------------------------------------
  {
    id: 'crb_65',
    name: 'CRB-65',
    fullName: 'CRB-65',
    category: 'PULMONARY',
    application:
      'Simplified CURB-65 without urea (for use in outpatient/clinic settings without labs). Assesses community-acquired pneumonia severity.',
    applicableChiefComplaints: [
      'cough',
      'shortness_of_breath',
      'fever',
      'pneumonia',
    ],
    keywords: [
      'CRB-65',
      'pneumonia',
      'community-acquired pneumonia',
      'CAP',
      'severity',
      'outpatient',
      'no labs',
    ],
    components: [
      {
        id: 'confusion',
        label: 'Confusion (new disorientation in person, place, or time; AMT ≤8)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'respiratory_rate',
        label: 'Respiratory rate ≥30 breaths/min',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'low_blood_pressure',
        label: 'Blood pressure: systolic <90 mmHg or diastolic ≤60 mmHg',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age_gte_65',
        label: 'Age ≥65 years',
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
          risk: 'Low',
          interpretation:
            'Score 0: Low risk (<1% 30-day mortality). Outpatient treatment appropriate with oral antibiotics.',
        },
        {
          min: 1,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'Score 1–2: Moderate risk (1–10% 30-day mortality). Consider hospital referral for observation or short-stay admission.',
        },
        {
          min: 3,
          max: 4,
          risk: 'High',
          interpretation:
            'Score 3–4: High risk (>10% 30-day mortality). Urgent hospital admission required; consider ICU if score 4.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['admit_icu_if_score_4', 'iv_antibiotics', 'blood_cultures', 'chest_xray', 'supplemental_oxygen'],
      Moderate: ['admit_or_observation', 'iv_or_oral_antibiotics', 'chest_xray'],
      Low: ['outpatient_oral_antibiotics', 'return_precautions', 'follow_up_48h'],
    },
  },

  // ---------------------------------------------------------------------------
  // DECAF Score (COPD Exacerbation)
  // Sum-based, 5 weighted criteria for in-hospital mortality
  // ---------------------------------------------------------------------------
  {
    id: 'decaf',
    name: 'DECAF',
    fullName: 'DECAF Score',
    category: 'PULMONARY',
    application: 'Predicts in-hospital mortality from acute exacerbation of COPD.',
    applicableChiefComplaints: [
      'shortness_of_breath',
      'copd_exacerbation',
      'dyspnea',
    ],
    keywords: [
      'DECAF',
      'COPD',
      'exacerbation',
      'mortality',
      'eosinopenia',
      'atrial fibrillation',
      'acidemia',
      'consolidation',
    ],
    requiredTests: ['eosinophil count', 'arterial blood gas', 'chest x-ray', 'ECG'],
    components: [
      {
        id: 'dyspnea_emrcd',
        label: 'Dyspnea (eMRCD scale)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'eMRCD 1–4 (not too breathless to leave the house independently)', value: 0 },
          { label: 'eMRCD 5a (too breathless to leave the house but independent with washing/dressing)', value: 1 },
          { label: 'eMRCD 5b (too breathless to leave the house AND needs help with washing or dressing)', value: 2 },
        ],
      },
      {
        id: 'eosinopenia',
        label: 'Eosinopenia (eosinophils <0.05 × 10⁹/L)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'consolidation',
        label: 'Consolidation on chest radiograph',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'acidemia',
        label: 'Acidemia (pH <7.30 on arterial blood gas)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'atrial_fibrillation',
        label: 'Atrial fibrillation on ECG (including new or existing)',
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
          max: 1,
          risk: 'Low',
          interpretation:
            'DECAF 0–1: 0–1.4% in-hospital mortality. Consider early supported discharge or outpatient management.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Intermediate',
          interpretation:
            'DECAF 2: ~5.3% in-hospital mortality. Standard inpatient management on respiratory ward.',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            'DECAF 3: ~15.3% in-hospital mortality. Consider higher-level monitoring and early escalation planning.',
        },
        {
          min: 4,
          max: 6,
          risk: 'Very High',
          interpretation:
            'DECAF 4–6: 31–50% in-hospital mortality. Consider ICU or high-dependency unit; discuss goals of care.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'icu_or_hdu_admission',
        'niv_if_acidotic',
        'iv_corticosteroids',
        'antibiotics',
        'goals_of_care_discussion',
      ],
      High: ['admit_respiratory_ward', 'niv_if_acidotic', 'systemic_corticosteroids', 'antibiotics'],
      Intermediate: ['admit_respiratory_ward', 'systemic_corticosteroids', 'bronchodilators', 'antibiotics'],
      Low: ['early_supported_discharge', 'oral_corticosteroids', 'bronchodilators', 'follow_up_48h'],
    },
  },

  // ---------------------------------------------------------------------------
  // Pediatric Asthma Severity Score (PASS)
  // Sum-based, 3 components scored 1–3 each (total 3–9)
  // ---------------------------------------------------------------------------
  {
    id: 'pass_asthma',
    name: 'PASS',
    fullName: 'PASS (Pediatric Asthma Severity Score)',
    category: 'PULMONARY',
    application:
      'Standardized assessment of acute asthma severity in children to guide treatment intensity.',
    applicableChiefComplaints: [
      'wheezing',
      'shortness_of_breath',
      'asthma_exacerbation',
      'respiratory_distress',
    ],
    keywords: [
      'PASS',
      'pediatric asthma',
      'asthma severity',
      'children',
      'wheezing',
      'bronchospasm',
    ],
    components: [
      {
        id: 'wheezing',
        label: 'Wheezing',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'None or mild end-expiratory wheezing only', value: 1 },
          { label: 'Wheezing throughout expiration (±inspiratory wheezing)', value: 2 },
          { label: 'Audible wheezing without stethoscope or silent chest (severe obstruction)', value: 3 },
        ],
      },
      {
        id: 'work_of_breathing',
        label: 'Work of breathing',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'Normal or mildly increased (no retractions)', value: 1 },
          { label: 'Moderate (intercostal retractions, use of accessory muscles)', value: 2 },
          { label: 'Severe (nasal flaring, suprasternal retractions, abdominal breathing)', value: 3 },
        ],
      },
      {
        id: 'prolonged_expiration',
        label: 'Prolongation of expiration',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'Normal or mildly prolonged expiratory phase', value: 1 },
          { label: 'Moderately prolonged expiratory phase (I:E ratio ~1:2–1:3)', value: 2 },
          { label: 'Severely prolonged expiratory phase (I:E ratio ≥1:4)', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 3,
          max: 4,
          risk: 'Mild',
          interpretation:
            'PASS 3–4: Mild exacerbation. Standard bronchodilator therapy (albuterol nebulizer or MDI q20 min × 3).',
        },
        {
          min: 5,
          max: 6,
          risk: 'Moderate',
          interpretation:
            'PASS 5–6: Moderate exacerbation. Aggressive bronchodilator therapy (continuous albuterol neb), systemic corticosteroids (dexamethasone or prednisolone).',
        },
        {
          min: 7,
          max: 9,
          risk: 'Severe',
          interpretation:
            'PASS 7–9: Severe exacerbation. Continuous nebulization, IV magnesium sulfate (25–75 mg/kg), systemic corticosteroids, consider epinephrine IM, terbutaline, and escalation to PICU.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'continuous_albuterol_nebulization',
        'ipratropium_bromide',
        'iv_magnesium_sulfate',
        'systemic_corticosteroids',
        'consider_epinephrine_im',
        'picu_consult',
      ],
      Moderate: [
        'albuterol_neb_q20min',
        'ipratropium_bromide',
        'systemic_corticosteroids',
        'reassess_after_treatment',
      ],
      Mild: [
        'albuterol_neb_or_mdi',
        'consider_oral_corticosteroids',
        'reassess_in_1_hour',
        'discharge_if_improving',
      ],
    },
  },
]
