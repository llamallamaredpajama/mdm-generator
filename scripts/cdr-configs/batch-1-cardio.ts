import type { CdrSeed } from './types'

/**
 * Batch 1 — Cardiovascular CDRs
 *
 * Covers: HEART Pathway, TIMI UA/NSTEMI, EDACS, Revised Geneva, PESI, sPESI,
 *         GRACE 2.0, Sgarbossa Criteria, HAS-BLED, ADD-RS
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - HEART Pathway: Mahler et al., Ann Emerg Med 2015
 *  - TIMI UA/NSTEMI: Antman et al., JAMA 2000
 *  - EDACS: Than et al., Am Heart J 2014
 *  - Revised Geneva: Klok et al., Arch Intern Med 2008 (simplified)
 *  - PESI: Aujesky et al., Am J Respir Crit Care Med 2005
 *  - sPESI: Jimenez et al., Arch Intern Med 2010
 *  - GRACE 2.0: Fox et al., BMJ Open 2012
 *  - Sgarbossa: Sgarbossa et al., NEJM 1996; Smith et al., Ann Emerg Med 2012
 *  - HAS-BLED: Pisters et al., Chest 2010
 *  - ADD-RS / ADvISED: Nazerian et al., Circulation 2018
 */

export const batch1CardioCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // HEART Pathway
  // Accelerated diagnostic protocol: HEART score + 0h/3h serial troponins
  // ---------------------------------------------------------------------------
  {
    id: 'heart_pathway',
    name: 'HEART Pathway',
    fullName: 'HEART Pathway',
    category: 'CARDIOVASCULAR',
    application:
      'Accelerated diagnostic protocol combining HEART score with serial troponins (0 and 3 hours) to identify low-risk chest pain patients for early discharge.',
    applicableChiefComplaints: ['chest_pain', 'chest_tightness', 'atypical_chest_pain', 'acs_rule_out'],
    keywords: [
      'HEART pathway',
      'accelerated diagnostic protocol',
      'ADP',
      'serial troponin',
      'chest pain low risk',
      'early discharge',
      'MACE',
      '0 hour 3 hour troponin',
    ],
    requiredTests: ['troponin', 'ecg'],
    components: [
      // --- HEART Score components (replicated here so pathway can stand alone) ---
      {
        id: 'history',
        label: 'History',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Slightly suspicious (non-specific features)', value: 0 },
          { label: 'Moderately suspicious (mixed features)', value: 1 },
          { label: 'Highly suspicious (typical ischemic features)', value: 2 },
        ],
      },
      {
        id: 'ecg',
        label: 'ECG',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Non-specific repolarization disturbance / LBBB / LVH / early repol', value: 1 },
          { label: 'Significant ST deviation (new ST depression or elevation)', value: 2 },
        ],
      },
      {
        id: 'age',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<45 years', value: 0 },
          { label: '45–64 years', value: 1 },
          { label: '≥65 years', value: 2 },
        ],
      },
      {
        id: 'risk_factors',
        label: 'Risk Factors',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No known risk factors', value: 0 },
          { label: '1–2 risk factors (HTN, hypercholesterolemia, DM, obesity BMI >30, smoking, family hx)', value: 1 },
          { label: '≥3 risk factors OR history of atherosclerotic disease', value: 2 },
        ],
      },
      {
        id: 'troponin_0h',
        label: 'Troponin (0-hour)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≤normal limit (≤1× URL)', value: 0 },
          { label: '1–3× normal limit', value: 1 },
          { label: '>3× normal limit', value: 2 },
        ],
      },
      {
        id: 'troponin_3h',
        label: 'Troponin (3-hour)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Negative (≤normal limit)', value: 0 },
          { label: 'Positive (any elevation)', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'Low',
          interpretation:
            'HEART 0–3 AND both serial troponins (0h and 3h) negative → ~0.4–1.7% 30-day MACE rate; candidate for early discharge without further workup.',
        },
        {
          min: 4,
          max: 11,
          risk: 'Not Low Risk',
          interpretation:
            'HEART ≥4 OR any troponin elevated → Not low risk; requires further workup, observation, or admission.',
        },
      ],
    },
    suggestedTreatments: {
      'Not Low Risk': ['aspirin_325', 'cardiology_consult', 'admit_telemetry', 'serial_troponins'],
      Low: ['discharge_with_follow_up', 'outpatient_stress_test'],
    },
  },

  // ---------------------------------------------------------------------------
  // TIMI Risk Score for UA/NSTEMI
  // 7 binary variables, each worth 1 point; predicts 14-day MACE
  // ---------------------------------------------------------------------------
  {
    id: 'timi_ua_nstemi',
    name: 'TIMI UA/NSTEMI',
    fullName: 'TIMI Risk Score (UA/NSTEMI)',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts 14-day risk of all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization in patients with UA/NSTEMI.',
    applicableChiefComplaints: ['chest_pain', 'acs', 'nstemi', 'unstable_angina'],
    keywords: [
      'TIMI',
      'UA NSTEMI risk',
      'acute coronary syndrome',
      'ACS risk score',
      'unstable angina',
      'NSTEMI',
      'CAD risk factors',
      'troponin elevated',
      'ST deviation',
    ],
    requiredTests: ['troponin', 'ecg'],
    components: [
      {
        id: 'age_65',
        label: 'Age ≥65 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cad_risk_factors',
        label: '≥3 CAD risk factors (family history, HTN, hypercholesterolemia, DM, active smoking)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_cad',
        label: 'Known coronary artery disease (stenosis ≥50% on prior catheterization)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'aspirin_use',
        label: 'Aspirin use in past 7 days',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'severe_angina',
        label: '≥2 anginal episodes in past 24 hours',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'st_deviation',
        label: 'ST deviation ≥0.5 mm on ECG',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'positive_troponin',
        label: 'Elevated serum cardiac markers (troponin or CK-MB)',
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
          max: 2,
          risk: 'Low',
          interpretation:
            'Score 0–2: ~4.7–8.3% 14-day all-cause mortality / MI / revascularization event rate. Consider observation with serial biomarkers; noninvasive testing may be appropriate.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Intermediate',
          interpretation:
            'Score 3–4: ~13.2–19.9% 14-day event rate. Benefit from early invasive strategy and antithrombotic therapy.',
        },
        {
          min: 5,
          max: 7,
          risk: 'High',
          interpretation:
            'Score 5–7: ~26.2–40.9% 14-day event rate. Strong evidence for early aggressive medical therapy and early invasive strategy.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['aspirin_325', 'heparin_drip', 'p2y12_inhibitor', 'cardiology_consult', 'admit_telemetry'],
      Intermediate: ['aspirin_325', 'heparin_drip', 'cardiology_consult', 'admit_telemetry'],
      Low: ['aspirin_325', 'serial_troponins', 'cardiology_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // EDACS — Emergency Department Assessment of Chest Pain Score
  // Age/sex/diaphoresis-based score + symptom features; threshold <16
  // ---------------------------------------------------------------------------
  {
    id: 'edacs',
    name: 'EDACS',
    fullName: 'EDACS (Emergency Department Assessment of Chest Pain Score)',
    category: 'CARDIOVASCULAR',
    application:
      'Identifies low-risk chest pain for accelerated disposition combined with 0 and 2-hour troponins.',
    applicableChiefComplaints: ['chest_pain', 'acs_rule_out', 'atypical_chest_pain'],
    keywords: [
      'EDACS',
      'emergency department assessment chest pain',
      'EDACS-ADP',
      'accelerated diagnostic protocol',
      'chest pain score',
      'low risk chest pain',
      '0 hour 2 hour troponin',
    ],
    requiredTests: ['troponin', 'ecg'],
    components: [
      // Age/sex base score (select)
      {
        id: 'age_sex',
        label: 'Age and Sex (base points)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Male 18–45', value: 2 },
          { label: 'Female 18–45', value: 0 },
          { label: 'Male 46–50', value: 4 },
          { label: 'Female 46–50', value: 3 },
          { label: 'Male 51–55', value: 6 },
          { label: 'Female 51–55', value: 5 },
          { label: 'Male 56–60', value: 8 },
          { label: 'Female 56–60', value: 7 },
          { label: 'Male 61–65', value: 10 },
          { label: 'Female 61–65', value: 9 },
          { label: 'Male 66–70', value: 12 },
          { label: 'Female 66–70', value: 11 },
          { label: 'Male 71–75', value: 14 },
          { label: 'Female 71–75', value: 13 },
          { label: 'Male 76–80', value: 16 },
          { label: 'Female 76–80', value: 15 },
          { label: 'Male 81–85', value: 18 },
          { label: 'Female 81–85', value: 17 },
          { label: 'Male ≥86', value: 20 },
          { label: 'Female ≥86', value: 18 },
        ],
      },
      {
        id: 'diaphoresis',
        label: 'Diaphoresis (sweating with this episode)',
        type: 'boolean',
        value: 3,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'radiates_arm_shoulder',
        label: 'Pain radiates to arm or shoulder',
        type: 'boolean',
        value: 5,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'pain_occurred_exertion',
        label: 'Pain occurred or worsened with exertion',
        type: 'boolean',
        value: 4,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // Exclusions: lower score (negative points) if present
      {
        id: 'reproduced_palpation',
        label: 'Pain is reproduced by palpation',
        type: 'boolean',
        value: -6,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      // ECG / troponin (assessed separately for EDACS-ADP low-risk determination)
      {
        id: 'ecg_ischemia',
        label: 'ECG: ischemic changes (new ST deviation ≥0.5 mm or new T-wave inversion)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'troponin_0h',
        label: 'Troponin 0h: negative (below assay URL)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'troponin_2h',
        label: 'Troponin 2h: negative (below assay URL)',
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
          min: -6,
          max: 15,
          risk: 'Low',
          interpretation:
            'EDACS <16 AND no ECG ischemia AND both 0h + 2h troponins negative → Low risk (~1% 30-day MACE); candidate for early discharge.',
        },
        {
          min: 16,
          max: 46,
          risk: 'Not Low Risk',
          interpretation:
            'EDACS ≥16, OR ECG ischemia present, OR any troponin positive → Not low risk; further evaluation required.',
        },
      ],
    },
    suggestedTreatments: {
      'Not Low Risk': ['aspirin_325', 'cardiology_consult', 'admit_telemetry', 'serial_troponins'],
      Low: ['discharge_with_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // Revised Geneva Score (Simplified version)
  // Pre-test probability for PE — fully objective (no physician gestalt criterion)
  // ---------------------------------------------------------------------------
  {
    id: 'revised_geneva',
    name: 'Revised Geneva',
    fullName: 'Revised Geneva Score',
    category: 'CARDIOVASCULAR',
    application:
      'Alternative pre-test probability assessment for PE. Does not include subjective "PE most likely diagnosis" criterion.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pe_rule_out', 'hypoxia', 'tachycardia'],
    keywords: [
      'revised Geneva score',
      'Geneva PE',
      'pulmonary embolism pre-test probability',
      'PE risk stratification',
      'DVT history',
      'malignancy PE',
      'hemoptysis',
    ],
    requiredTests: ['d_dimer'],
    components: [
      {
        id: 'age',
        label: 'Age >65 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_pe_dvt',
        label: 'Prior PE or DVT',
        type: 'boolean',
        value: 3,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'surgery_fracture',
        label: 'Surgery or fracture within 1 month',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'active_malignancy',
        label: 'Active malignancy (solid or hematologic, currently treated or treated within 1 year)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'unilateral_leg_pain',
        label: 'Unilateral lower limb pain',
        type: 'boolean',
        value: 3,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hemoptysis',
        label: 'Hemoptysis',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_rate',
        label: 'Heart rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        options: [
          { label: '<75 bpm', value: 0 },
          { label: '75–94 bpm', value: 3 },
          { label: '≥95 bpm', value: 5 },
        ],
      },
      {
        id: 'leg_pain_edema',
        label: 'Pain on deep palpation of leg AND unilateral edema',
        type: 'boolean',
        value: 4,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
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
            'Score 0–3: Low pre-test probability (~7.9% PE prevalence). D-dimer can rule out if negative.',
        },
        {
          min: 4,
          max: 10,
          risk: 'Intermediate',
          interpretation:
            'Score 4–10: Intermediate pre-test probability (~29.4% PE prevalence). CT pulmonary angiography indicated if D-dimer elevated or if D-dimer testing not used.',
        },
        {
          min: 11,
          max: 25,
          risk: 'High',
          interpretation:
            'Score ≥11: High pre-test probability (~73.7% PE prevalence). Proceed directly to CTPA without D-dimer.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['anticoagulation_initiation', 'ctpa', 'pulmonology_consult'],
      Intermediate: ['d_dimer', 'ctpa_if_ddimer_positive', 'anticoagulation_initiation'],
      Low: ['d_dimer', 'discharge_if_ddimer_negative'],
    },
  },

  // ---------------------------------------------------------------------------
  // PESI — Pulmonary Embolism Severity Index
  // Predicts 30-day mortality in CONFIRMED PE; guides disposition
  // ---------------------------------------------------------------------------
  {
    id: 'pesi',
    name: 'PESI',
    fullName: 'PESI (Pulmonary Embolism Severity Index)',
    category: 'CARDIOVASCULAR',
    application:
      'Risk stratifies patients with CONFIRMED PE to predict 30-day mortality and guide disposition (inpatient vs. outpatient).',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism', 'shortness_of_breath'],
    keywords: [
      'PESI',
      'pulmonary embolism severity index',
      'PE severity',
      'PE mortality',
      'PE disposition',
      'outpatient PE treatment',
      'PE risk class',
    ],
    requiredTests: ['troponin', 'bnp'],
    components: [
      // Base score = age in years
      {
        id: 'age',
        label: 'Age (add 1 point per year of age)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '18–30 years', value: 25 },
          { label: '31–40 years', value: 35 },
          { label: '41–50 years', value: 45 },
          { label: '51–60 years', value: 55 },
          { label: '61–70 years', value: 65 },
          { label: '71–80 years', value: 75 },
          { label: '81–90 years', value: 85 },
          { label: '≥91 years', value: 95 },
        ],
      },
      {
        id: 'male_sex',
        label: 'Male sex',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cancer',
        label: 'History of cancer',
        type: 'boolean',
        value: 30,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_failure',
        label: 'History of heart failure',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'chronic_lung_disease',
        label: 'History of chronic lung disease (COPD, asthma)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hr_110',
        label: 'Heart rate ≥110 bpm',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'sbp_100',
        label: 'Systolic BP <100 mmHg',
        type: 'boolean',
        value: 30,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'rr_30',
        label: 'Respiratory rate ≥30 breaths/min',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'temp_36',
        label: 'Temperature <36°C (96.8°F)',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'altered_mental_status',
        label: 'Altered mental status (disorientation, lethargy, stupor, or coma)',
        type: 'boolean',
        value: 60,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      {
        id: 'o2_sat_90',
        label: 'O₂ saturation <90% on room air',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 65,
          risk: 'Class I — Very Low',
          interpretation:
            'Score ≤65: 0–1.6% 30-day mortality — consider outpatient treatment with anticoagulation.',
        },
        {
          min: 66,
          max: 85,
          risk: 'Class II — Low',
          interpretation:
            'Score 66–85: 1.7–3.5% 30-day mortality — consider outpatient treatment with close follow-up or brief observation.',
        },
        {
          min: 86,
          max: 105,
          risk: 'Class III — Intermediate',
          interpretation:
            'Score 86–105: 3.2–7.1% 30-day mortality — inpatient management recommended.',
        },
        {
          min: 106,
          max: 125,
          risk: 'Class IV — High',
          interpretation:
            'Score 106–125: 4.0–11.4% 30-day mortality — inpatient management; consider ICU if hemodynamically unstable.',
        },
        {
          min: 126,
          max: 325,
          risk: 'Class V — Very High',
          interpretation:
            'Score >125: 10.0–24.5% 30-day mortality — inpatient management with ICU; consider systemic thrombolysis or catheter-directed therapy if massive PE.',
        },
      ],
    },
    suggestedTreatments: {
      'Class V — Very High': ['anticoagulation_initiation', 'hematology_consult', 'pulmonology_consult', 'icu_admission', 'thrombolysis_consideration'],
      'Class IV — High': ['anticoagulation_initiation', 'pulmonology_consult', 'admit_telemetry'],
      'Class III — Intermediate': ['anticoagulation_initiation', 'pulmonology_consult', 'admit_telemetry'],
      'Class II — Low': ['anticoagulation_initiation', 'discharge_with_follow_up'],
      'Class I — Very Low': ['anticoagulation_initiation', 'discharge_with_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // sPESI — Simplified PESI
  // 6 binary items; score 0 = low risk, ≥1 = high risk
  // ---------------------------------------------------------------------------
  {
    id: 'spesi',
    name: 'sPESI',
    fullName: 'sPESI (Simplified PESI)',
    category: 'CARDIOVASCULAR',
    application: 'Simplified version of PESI for PE risk stratification.',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism', 'shortness_of_breath'],
    keywords: [
      'sPESI',
      'simplified PESI',
      'simplified pulmonary embolism severity index',
      'PE severity simplified',
      'PE disposition',
      'outpatient PE',
    ],
    requiredTests: ['troponin', 'bnp'],
    components: [
      {
        id: 'age_80',
        label: 'Age >80 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cancer',
        label: 'History of cancer',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cardiopulmonary_disease',
        label: 'Chronic cardiopulmonary disease (chronic heart failure OR chronic pulmonary disease)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hr_110',
        label: 'Heart rate ≥110 bpm',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'sbp_100',
        label: 'Systolic BP <100 mmHg',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'o2_sat_90',
        label: 'O₂ saturation <90%',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
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
            'Score 0: Low risk (1.0% 30-day mortality) — consider outpatient management with anticoagulation if no contraindications.',
        },
        {
          min: 1,
          max: 6,
          risk: 'High',
          interpretation:
            'Score ≥1: High risk (10.9% 30-day mortality) — inpatient management; higher scores may warrant ICU and consideration of thrombolysis.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['anticoagulation_initiation', 'pulmonology_consult', 'admit_telemetry'],
      Low: ['anticoagulation_initiation', 'discharge_with_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // GRACE 2.0 Score
  // Continuous score (online calculator); components captured as select for UI
  // ---------------------------------------------------------------------------
  {
    id: 'grace_score',
    name: 'GRACE 2.0',
    fullName: 'GRACE 2.0 Score (Global Registry of Acute Coronary Events)',
    category: 'CARDIOVASCULAR',
    application:
      'Predicts in-hospital and 6-month mortality in patients with acute coronary syndrome (NSTEMI/STEMI). Used for risk stratification and treatment decisions.',
    applicableChiefComplaints: ['chest_pain', 'acs', 'nstemi', 'stemi'],
    keywords: [
      'GRACE score',
      'GRACE 2.0',
      'global registry acute coronary events',
      'ACS mortality',
      'NSTEMI risk',
      'STEMI risk',
      'Killip class',
      'cardiac arrest ACS',
      'invasive strategy ACS',
    ],
    requiredTests: ['troponin', 'ecg', 'bmp'],
    components: [
      {
        id: 'age',
        label: 'Age (years)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<30', value: 0 },
          { label: '30–39', value: 8 },
          { label: '40–49', value: 25 },
          { label: '50–59', value: 41 },
          { label: '60–69', value: 58 },
          { label: '70–79', value: 75 },
          { label: '80–89', value: 91 },
          { label: '≥90', value: 100 },
        ],
      },
      {
        id: 'heart_rate',
        label: 'Heart rate (bpm)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        options: [
          { label: '<50', value: 0 },
          { label: '50–69', value: 3 },
          { label: '70–89', value: 9 },
          { label: '90–109', value: 15 },
          { label: '110–149', value: 24 },
          { label: '150–199', value: 38 },
          { label: '≥200', value: 46 },
        ],
      },
      {
        id: 'sbp',
        label: 'Systolic BP (mmHg)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        options: [
          { label: '<80', value: 58 },
          { label: '80–99', value: 53 },
          { label: '100–119', value: 43 },
          { label: '120–139', value: 34 },
          { label: '140–159', value: 24 },
          { label: '160–199', value: 10 },
          { label: '≥200', value: 0 },
        ],
      },
      {
        id: 'creatinine',
        label: 'Serum creatinine (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '0–0.39', value: 1 },
          { label: '0.40–0.79', value: 4 },
          { label: '0.80–1.19', value: 7 },
          { label: '1.20–1.59', value: 10 },
          { label: '1.60–1.99', value: 13 },
          { label: '2.00–3.99', value: 21 },
          { label: '≥4.0 or dialysis', value: 28 },
        ],
      },
      {
        id: 'killip_class',
        label: 'Killip Class (heart failure on presentation)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'Class I — No heart failure signs', value: 0 },
          { label: 'Class II — Rales or JVD', value: 20 },
          { label: 'Class III — Pulmonary edema', value: 39 },
          { label: 'Class IV — Cardiogenic shock', value: 59 },
        ],
      },
      {
        id: 'cardiac_arrest',
        label: 'Cardiac arrest at admission',
        type: 'boolean',
        value: 39,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'st_deviation',
        label: 'ST-segment deviation on ECG',
        type: 'boolean',
        value: 28,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'positive_biomarker',
        label: 'Elevated cardiac biomarkers (troponin or CK-MB above URL)',
        type: 'boolean',
        value: 14,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 108,
          risk: 'Low',
          interpretation:
            'GRACE ≤108: Low in-hospital mortality (<1%). 6-month mortality low if ≤88 (<3%). Medical management; timing of invasive strategy can be elective.',
        },
        {
          min: 109,
          max: 140,
          risk: 'Intermediate',
          interpretation:
            'GRACE 109–140: Intermediate in-hospital mortality (1–3%). Early invasive strategy within 24 hours recommended by ACC/AHA guidelines.',
        },
        {
          min: 141,
          max: 400,
          risk: 'High',
          interpretation:
            'GRACE >140: High in-hospital mortality (>3%). Very high-risk patients benefit most from urgent invasive strategy (<2 hours); aggressive medical therapy required.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['aspirin_325', 'heparin_drip', 'p2y12_inhibitor', 'cardiology_consult', 'admit_telemetry', 'urgent_cath_lab'],
      Intermediate: ['aspirin_325', 'heparin_drip', 'p2y12_inhibitor', 'cardiology_consult', 'admit_telemetry'],
      Low: ['aspirin_325', 'cardiology_consult', 'serial_troponins'],
    },
  },

  // ---------------------------------------------------------------------------
  // Sgarbossa Criteria (Original + Smith-Modified)
  // Identifies acute MI in presence of LBBB or ventricular-paced rhythm
  // ---------------------------------------------------------------------------
  {
    id: 'sgarbossa',
    name: 'Sgarbossa Criteria',
    fullName: 'Sgarbossa Criteria (STEMI Diagnosis in LBBB)',
    category: 'CARDIOVASCULAR',
    application:
      'Identifies acute MI in the presence of left bundle branch block (LBBB), where standard ST criteria are unreliable.',
    applicableChiefComplaints: ['chest_pain', 'lbbb', 'stemi_equivalent', 'ventricular_paced_rhythm'],
    keywords: [
      'Sgarbossa criteria',
      'Smith-modified Sgarbossa',
      'LBBB MI',
      'STEMI LBBB',
      'concordant ST elevation',
      'discordant ST',
      'left bundle branch block ACS',
      'paced rhythm MI',
    ],
    requiredTests: ['ecg'],
    components: [
      // Original Sgarbossa — weighted points
      {
        id: 'concordant_st_elevation',
        label: 'Criterion 1: Concordant ST elevation ≥1 mm in any lead with positive QRS complex',
        type: 'boolean',
        value: 5,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'concordant_st_depression',
        label: 'Criterion 2: Concordant ST depression ≥1 mm in leads V1–V3',
        type: 'boolean',
        value: 3,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'discordant_st_elevation',
        label: 'Criterion 3 (Original): Excessively discordant ST elevation ≥5 mm in leads with negative QRS complex',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      // Smith-Modified criterion (replaces Criterion 3 for better sensitivity)
      {
        id: 'smith_modified',
        label: 'Criterion 3 (Smith-Modified): ST/S ratio ≤−0.25 in any lead with discordant ST deviation (excessively discordant relative to QRS amplitude)',
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
          max: 2,
          risk: 'Non-Diagnostic',
          interpretation:
            'Score <3 (original criteria): Non-diagnostic for acute MI in LBBB by original weighted score alone. If Smith-Modified Criterion 3 present (ST/S ratio ≤−0.25), treat as STEMI equivalent regardless of total score.',
        },
        {
          min: 3,
          max: 10,
          risk: 'STEMI Equivalent',
          interpretation:
            'Score ≥3 (original criteria): High specificity for acute MI (~90%). Smith-Modified: ANY one of the 3 criteria present → treat as STEMI equivalent (sensitivity ~91%, specificity ~90%). Activate cath lab.',
        },
      ],
    },
    suggestedTreatments: {
      'STEMI Equivalent': [
        'aspirin_325',
        'heparin_drip',
        'p2y12_inhibitor',
        'cardiology_consult',
        'cath_lab_activation',
        'admit_telemetry',
      ],
      'Non-Diagnostic': ['serial_ecg', 'serial_troponins', 'cardiology_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // HAS-BLED Score
  // Estimates annual major bleeding risk in AF patients on anticoagulation
  // ---------------------------------------------------------------------------
  {
    id: 'has_bled',
    name: 'HAS-BLED',
    fullName: 'HAS-BLED Score',
    category: 'CARDIOVASCULAR',
    application:
      'Assesses risk of major bleeding in patients on anticoagulation for atrial fibrillation. Helps weigh bleeding risk against stroke risk.',
    applicableChiefComplaints: ['atrial_fibrillation', 'anticoagulation_management', 'afib'],
    keywords: [
      'HAS-BLED',
      'bleeding risk score',
      'anticoagulation bleeding',
      'atrial fibrillation bleeding',
      'warfarin bleeding risk',
      'major hemorrhage atrial fibrillation',
    ],
    requiredTests: ['coags_inr', 'bmp'],
    components: [
      {
        id: 'hypertension',
        label: 'H — Uncontrolled hypertension (systolic BP >160 mmHg)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
      },
      {
        id: 'renal_disease',
        label: 'A — Abnormal renal function (dialysis, transplant, or creatinine >2.26 mg/dL / 200 μmol/L)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'liver_disease',
        label: 'A — Abnormal liver function (cirrhosis, bilirubin >2× normal, AST/ALT/ALP >3× normal)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'stroke_history',
        label: 'S — History of stroke',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'bleeding_history',
        label: 'B — Prior major bleeding OR bleeding predisposition (anemia, thrombocytopenia)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'labile_inr',
        label: 'L — Labile INR (unstable/high INR, time in therapeutic range <60%)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'elderly',
        label: 'E — Elderly (age >65 years)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'drugs',
        label: 'D — Drugs predisposing to bleeding (antiplatelets, NSAIDs)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'alcohol',
        label: 'D — Alcohol use (≥8 drinks/week)',
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
          max: 1,
          risk: 'Low',
          interpretation:
            'Score 0–1: Annual major bleeding risk ~1.1–1.9% — anticoagulation generally favored over bleeding risk. Address any modifiable factors.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'Score 2: Annual major bleeding risk ~1.9% — anticoagulation typically still favored. Ensure careful INR monitoring and modifiable risk reduction.',
        },
        {
          min: 3,
          max: 4,
          risk: 'High',
          interpretation:
            'Score 3–4: Annual major bleeding risk 3.7–8.7% — flag for closer monitoring. Score does NOT automatically contraindicate anticoagulation; focus on correcting modifiable risk factors (HTN, labile INR, drug interactions, alcohol).',
        },
        {
          min: 5,
          max: 9,
          risk: 'Very High',
          interpretation:
            'Score ≥5: Annual major bleeding risk ~12.5% — high caution required. Does NOT necessarily mean withhold anticoagulation; weigh against stroke risk (CHA₂DS₂-VASc). Address ALL modifiable risks. Consider hematology consultation.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': ['cardiology_consult', 'hematology_consult', 'anticoagulation_review'],
      High: ['cardiology_consult', 'anticoagulation_review', 'inr_monitoring'],
      Moderate: ['anticoagulation_initiation', 'inr_monitoring'],
      Low: ['anticoagulation_initiation'],
    },
  },

  // ---------------------------------------------------------------------------
  // ADD-RS / ADvISED Score — Aortic Dissection Detection Risk Score
  // 3 high-risk categories; combined with D-dimer in ADvISED protocol
  // ---------------------------------------------------------------------------
  {
    id: 'add_rs',
    name: 'ADD-RS',
    fullName: 'ADvISED Score / ADD-RS (Aortic Dissection Detection Risk Score)',
    category: 'CARDIOVASCULAR',
    application:
      'Risk stratifies patients for acute aortic dissection, often combined with D-dimer.',
    applicableChiefComplaints: ['chest_pain', 'back_pain', 'tearing_chest_pain', 'aortic_dissection'],
    keywords: [
      'ADD-RS',
      'ADvISED',
      'aortic dissection detection risk score',
      'acute aortic dissection',
      'tearing chest pain',
      'Marfan syndrome',
      'pulse deficit',
      'D-dimer dissection',
    ],
    requiredTests: ['d_dimer', 'ecg'],
    components: [
      // Category 1: High-risk conditions (predisposing connective tissue disorder / aortic disease)
      {
        id: 'high_risk_condition',
        label: 'High-risk condition — Marfan syndrome, other connective tissue disease (EDS, Loeys-Dietz), family history of aortic disease, known aortic valve disease, recent aortic instrumentation/surgery',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // Category 2: High-risk pain features
      {
        id: 'high_risk_pain',
        label: 'High-risk pain features — abrupt onset of severe chest/back/abdominal pain; ripping, tearing, or sharp quality',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // Category 3: High-risk exam findings
      {
        id: 'high_risk_exam',
        label: 'High-risk exam findings — pulse deficit or BP differential >20 mmHg between arms, focal neurologic deficit (new), aortic regurgitation murmur (new), hypotension or shock',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
      },
      // D-dimer for ADvISED protocol decision
      {
        id: 'd_dimer_result',
        label: 'D-dimer: negative (<500 ng/mL FEU)',
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
          risk: 'Low',
          interpretation:
            'ADD-RS 0 AND D-dimer <500 ng/mL (ADvISED protocol): Aortic dissection effectively ruled out (~0% miss rate in ADvISED study). D-dimer ≥500 with ADD-RS 0 → advanced imaging (CTA aorta) still indicated.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Intermediate',
          interpretation:
            'ADD-RS 1: Intermediate pre-test probability. D-dimer <500 ng/mL → low likelihood of dissection but clinical judgment required. D-dimer ≥500 → CTA aorta indicated.',
        },
        {
          min: 2,
          max: 3,
          risk: 'High',
          interpretation:
            'ADD-RS ≥2: High pre-test probability for aortic dissection — CTA aorta indicated REGARDLESS of D-dimer. Do not use D-dimer to rule out in high-risk patients. Emergent vascular surgery / CT surgery consultation.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['iv_access_large_bore', 'blood_pressure_control', 'ct_angiography_aorta', 'vascular_surgery_consult', 'admit_icu'],
      Intermediate: ['ct_angiography_aorta', 'd_dimer', 'vascular_surgery_consult'],
      Low: ['d_dimer', 'clinical_reassessment'],
    },
  },
]
