import type { CdrSeed } from './types'

/**
 * Batch 3 — Pulmonary & GI CDRs
 *
 * CDRs included:
 *   psi_port, ottawa_copd, smart_cop, berlin_ards,
 *   glasgow_blatchford, aims65, rockall, alvarado, air_score, bisap
 *
 * All clinical data sourced from original validation literature.
 * Sources: Fine et al. NEJM 1997 (PSI), Stiell et al. CMAJ 2009 (Ottawa COPD),
 * Charles et al. Thorax 2008 (SMART-COP), ARDS Definition Task Force JAMA 2012 (Berlin),
 * Blatchford et al. Lancet 2000 (GBS), Saltzman et al. Gastrointest Endosc 2011 (AIMS65),
 * Rockall et al. Gut 1996, Alvarado Surg 1986, Scott et al. World J Surg 2010 (AIR),
 * Wu et al. Gastroenterology 2008 (BISAP).
 */

export const batch3PulmGiCdrs: CdrSeed[] = [
  // =========================================================================
  // PULMONARY — PSI/PORT Score
  // =========================================================================
  {
    id: 'psi_port',
    name: 'PSI/PORT',
    fullName: 'Pneumonia Severity Index (PSI / PORT Score)',
    category: 'PULMONARY',
    application:
      'Risk stratification for community-acquired pneumonia (CAP) mortality; guides inpatient vs. outpatient treatment. Uses a two-step process: clinical screening for Class I (low risk), then point calculation for Classes II–V.',
    applicableChiefComplaints: ['cough', 'shortness_of_breath', 'fever', 'pneumonia'],
    keywords: [
      'PSI',
      'PORT',
      'pneumonia severity index',
      'community-acquired pneumonia',
      'CAP',
      'mortality',
      'disposition',
    ],
    requiredTests: ['BUN', 'sodium', 'glucose', 'hematocrit', 'arterial_blood_gas', 'chest_xray'],
    components: [
      // ---- Step 1 exclusion screen (section1 — all from history/exam) ----
      {
        id: 'age_over_50',
        label: 'Age > 50 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'neoplastic_disease',
        label: 'Neoplastic disease (active cancer)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'liver_disease',
        label: 'Liver disease (clinical or lab evidence)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'chf_history',
        label: 'History of congestive heart failure',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cerebrovascular_disease',
        label: 'Cerebrovascular disease (stroke or TIA)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'renal_disease',
        label: 'Renal disease (chronic)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'altered_mental_status',
        label: 'Altered mental status (disorientation, stupor, or coma)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'rr_over_30',
        label: 'Respiratory rate ≥ 30 breaths/min',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'sbp_under_90',
        label: 'Systolic BP < 90 mmHg',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'temp_abnormal',
        label: 'Temperature < 35°C or ≥ 40°C',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hr_over_125',
        label: 'Heart rate ≥ 125 beats/min',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Step 2 point scoring (demographic + comorbid) ----
      {
        id: 'age_points',
        label: 'Age (points: male = age in years; female = age − 10)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female age 20–29 (10 pts)', value: 10 },
          { label: 'Male age 20–29 (20 pts)', value: 20 },
          { label: 'Female age 30–39 (20 pts)', value: 20 },
          { label: 'Male age 30–39 (30 pts)', value: 30 },
          { label: 'Female age 40–49 (30 pts)', value: 30 },
          { label: 'Male age 40–49 (40 pts)', value: 40 },
          { label: 'Female age 50–59 (40 pts)', value: 40 },
          { label: 'Male age 50–59 (50 pts)', value: 50 },
          { label: 'Female age 60–69 (50 pts)', value: 50 },
          { label: 'Male age 60–69 (60 pts)', value: 60 },
          { label: 'Female age 70–79 (60 pts)', value: 60 },
          { label: 'Male age 70–79 (70 pts)', value: 70 },
          { label: 'Female age 80–89 (70 pts)', value: 70 },
          { label: 'Male age 80–89 (80 pts)', value: 80 },
          { label: 'Female ≥ 90 (80 pts)', value: 80 },
          { label: 'Male ≥ 90 (90 pts)', value: 90 },
        ],
      },
      {
        id: 'nursing_home_resident',
        label: 'Nursing home resident (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Comorbidities (+10 each) ----
      {
        id: 'comorbid_neoplasm',
        label: 'Comorbid: Neoplastic disease (+30 pts)',
        type: 'boolean',
        value: 30,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'comorbid_liver',
        label: 'Comorbid: Liver disease (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'comorbid_chf',
        label: 'Comorbid: CHF (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'comorbid_cerebrovascular',
        label: 'Comorbid: Cerebrovascular disease (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'comorbid_renal',
        label: 'Comorbid: Renal disease (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Physical exam findings ----
      {
        id: 'exam_altered_mental_status',
        label: 'Exam: Altered mental status (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'exam_rr_over_30',
        label: 'Exam: Respiratory rate ≥ 30/min (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'exam_sbp_under_90',
        label: 'Exam: Systolic BP < 90 mmHg (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'exam_temp_abnormal',
        label: 'Exam: Temp < 35°C or ≥ 40°C (+15 pts)',
        type: 'boolean',
        value: 15,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'exam_hr_over_125',
        label: 'Exam: Heart rate ≥ 125/min (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Lab / imaging findings ----
      {
        id: 'lab_ph_under_7_35',
        label: 'Lab: Arterial pH < 7.35 (+30 pts)',
        type: 'boolean',
        value: 30,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_bun_over_30',
        label: 'Lab: BUN ≥ 30 mg/dL (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_sodium_under_130',
        label: 'Lab: Sodium < 130 mEq/L (+20 pts)',
        type: 'boolean',
        value: 20,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_glucose_over_250',
        label: 'Lab: Glucose > 250 mg/dL (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_hematocrit_under_30',
        label: 'Lab: Hematocrit < 30% (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_pao2_under_60',
        label: 'Lab: PaO₂ < 60 mmHg or O₂ sat < 90% (+10 pts)',
        type: 'boolean',
        value: 10,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'lab_pleural_effusion',
        label: 'Imaging: Pleural effusion on CXR (+10 pts)',
        type: 'boolean',
        value: 10,
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
          risk: 'Class I',
          interpretation:
            'Step 1 screen negative (age ≤50, no comorbidities, no abnormal vitals/exam): 0.1% 30-day mortality; outpatient treatment appropriate.',
        },
        {
          min: 1,
          max: 70,
          risk: 'Class II',
          interpretation:
            '0.6% 30-day mortality; outpatient treatment recommended.',
        },
        {
          min: 71,
          max: 90,
          risk: 'Class III',
          interpretation:
            '0.9–2.8% 30-day mortality; outpatient or brief inpatient observation (23-hour stay).',
        },
        {
          min: 91,
          max: 130,
          risk: 'Class IV',
          interpretation:
            '8.2–9.3% 30-day mortality; inpatient admission recommended.',
        },
        {
          min: 131,
          max: 395,
          risk: 'Class V',
          interpretation:
            '27–31% 30-day mortality; inpatient admission required; consider ICU or step-down unit.',
        },
      ],
    },
    suggestedTreatments: {
      'Class V': [
        'empiric_antibiotics_cap',
        'iv_fluid_resuscitation',
        'supplemental_oxygen',
        'icu_or_stepdown_admission',
        'infectious_disease_consult',
      ],
      'Class IV': [
        'empiric_antibiotics_cap',
        'supplemental_oxygen',
        'inpatient_admission',
      ],
      'Class III': [
        'empiric_antibiotics_cap',
        'supplemental_oxygen',
        'observation_or_discharge_with_followup',
      ],
      'Class II': [
        'oral_antibiotics_cap',
        'discharge_with_close_followup',
      ],
      'Class I': [
        'oral_antibiotics_cap',
        'outpatient_management',
      ],
    },
  },

  // =========================================================================
  // PULMONARY — Ottawa COPD Risk Scale
  // =========================================================================
  {
    id: 'ottawa_copd',
    name: 'Ottawa COPD Risk Scale',
    fullName: 'Ottawa COPD Risk Scale',
    category: 'PULMONARY',
    application:
      'Predicts short-term serious adverse events (SAE) in patients presenting to the ED with acute COPD exacerbation. Guides safe discharge vs. admission decisions.',
    applicableChiefComplaints: [
      'shortness_of_breath',
      'copd_exacerbation',
      'wheezing',
      'dyspnea',
    ],
    keywords: [
      'COPD',
      'Ottawa',
      'exacerbation',
      'adverse events',
      'disposition',
      'discharge',
      'AECOPD',
    ],
    requiredTests: ['ECG', 'chest_xray', 'hemoglobin', 'BUN', 'CO2'],
    components: [
      // ---- Historical risk factors ----
      {
        id: 'coronary_artery_disease',
        label: 'Ischemic heart disease (coronary artery disease)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Exam findings ----
      {
        id: 'o2_sat_under_90',
        label: 'O₂ saturation < 90% on room air at triage',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hr_over_110',
        label: 'Heart rate > 110 beats/min on triage',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'too_ill_to_walk',
        label: 'Too ill to do walk test / unable to walk without stopping',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // ---- Lab / imaging findings ----
      {
        id: 'ecg_ischemia',
        label: 'ECG: Acute ischemia or LBBB (new)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'hemoglobin_under_100',
        label: 'Hemoglobin < 100 g/L (< 10 g/dL)',
        type: 'boolean',
        value: 3,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'bun_over_12',
        label: 'BUN ≥ 12 mmol/L (≥ 34 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'serum_co2_under_35',
        label: 'Serum CO₂ < 35 mmol/L (bicarbonate)',
        type: 'boolean',
        value: 4,
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
          risk: 'Very Low',
          interpretation:
            '~2.2% risk of short-term serious adverse event (SAE); safe for discharge with close follow-up.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation: '~3.6% risk of SAE; consider observation vs. discharge with follow-up.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation: '~7.2% risk of SAE; consider extended observation or admission.',
        },
        {
          min: 3,
          max: 16,
          risk: 'High',
          interpretation:
            '~12%+ risk of SAE; observation or inpatient admission strongly recommended.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'ipratropium_albuterol_nebs',
        'systemic_corticosteroids',
        'supplemental_oxygen_titrated',
        'admission_or_observation',
        'consider_bipap_if_respiratory_acidosis',
      ],
      Moderate: [
        'ipratropium_albuterol_nebs',
        'systemic_corticosteroids',
        'supplemental_oxygen_titrated',
        'extended_observation',
      ],
      Low: [
        'ipratropium_albuterol_nebs',
        'systemic_corticosteroids',
        'discharge_with_followup_48h',
      ],
      'Very Low': [
        'ipratropium_albuterol_nebs',
        'systemic_corticosteroids',
        'discharge_with_followup',
      ],
    },
  },

  // =========================================================================
  // PULMONARY — SMART-COP
  // =========================================================================
  {
    id: 'smart_cop',
    name: 'SMART-COP',
    fullName: 'SMART-COP (Pneumonia ICU Admission Prediction)',
    category: 'PULMONARY',
    application:
      'Predicts need for intensive respiratory or vasopressor support (IRVS) in community-acquired pneumonia. Identifies patients requiring ICU admission. Acronym: Systolic BP, Multilobar infiltrates, Albumin, Respiratory rate, Tachycardia, Confusion, Oxygenation, pH.',
    applicableChiefComplaints: ['cough', 'shortness_of_breath', 'fever', 'pneumonia'],
    keywords: [
      'SMART-COP',
      'pneumonia',
      'ICU',
      'vasopressor',
      'intensive respiratory support',
      'CAP',
      'IRVS',
      'albumin',
    ],
    requiredTests: ['chest_xray', 'albumin', 'arterial_blood_gas', 'BUN'],
    components: [
      {
        id: 'systolic_bp_under_90',
        label: 'Systolic BP < 90 mmHg (+2 pts)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'multilobar_infiltrates',
        label: 'Multilobar or bilateral infiltrates on CXR (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'albumin_under_3_5',
        label: 'Albumin < 3.5 g/dL (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'rr_high',
        label: 'Respiratory rate elevated for age (+1 pt)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Age < 50: RR ≥ 25/min (1 pt)', value: 1 },
          { label: 'Age ≥ 50: RR ≥ 30/min (1 pt)', value: 1 },
          { label: 'Not elevated (0 pts)', value: 0 },
        ],
      },
      {
        id: 'tachycardia_over_125',
        label: 'Heart rate > 125 beats/min (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'confusion',
        label: 'Confusion (new onset) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'oxygenation',
        label: 'Oxygenation (PaO₂/FiO₂ or SpO₂) (+2 pts)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Age < 50: PaO₂ < 70 mmHg or SpO₂ < 94% or PaO₂/FiO₂ < 333 (2 pts)', value: 2 },
          { label: 'Age ≥ 50: PaO₂ < 60 mmHg or SpO₂ < 90% or PaO₂/FiO₂ < 250 (2 pts)', value: 2 },
          { label: 'Not meeting low oxygenation criteria (0 pts)', value: 0 },
        ],
      },
      {
        id: 'arterial_ph_under_7_35',
        label: 'Arterial pH < 7.35 (+2 pts)',
        type: 'boolean',
        value: 2,
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
            '~5% need for intensive respiratory or vasopressor support (IRVS); standard ward admission appropriate.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Moderate',
          interpretation:
            '~18% need for IRVS; consider ICU or step-down unit admission.',
        },
        {
          min: 5,
          max: 6,
          risk: 'High',
          interpretation:
            '~36% need for IRVS; strongly consider ICU admission.',
        },
        {
          min: 7,
          max: 11,
          risk: 'Very High',
          interpretation:
            '~62% need for IRVS; ICU admission recommended; anticipate mechanical ventilation or vasopressor need.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'empiric_antibiotics_cap_iv',
        'icu_admission',
        'supplemental_oxygen_or_intubation',
        'iv_fluid_resuscitation',
        'vasopressors_if_hypotensive',
        'infectious_disease_consult',
      ],
      High: [
        'empiric_antibiotics_cap_iv',
        'icu_or_stepdown_admission',
        'supplemental_oxygen',
        'iv_fluid_resuscitation',
      ],
      Moderate: [
        'empiric_antibiotics_cap_iv',
        'ward_admission_with_monitoring',
        'supplemental_oxygen',
      ],
      Low: [
        'empiric_antibiotics_cap',
        'admission_or_discharge_per_psi',
      ],
    },
  },

  // =========================================================================
  // PULMONARY — Berlin Criteria (ARDS)
  // =========================================================================
  {
    id: 'berlin_ards',
    name: 'Berlin Criteria',
    fullName: 'Berlin Criteria (ARDS Definition)',
    category: 'PULMONARY',
    application:
      'Defines Acute Respiratory Distress Syndrome (ARDS) and classifies severity to guide ventilator management and prognosis. Requires: onset within 1 week of insult or worsening respiratory symptoms, bilateral opacities on CXR/CT not explained by effusions/collapse, respiratory failure not fully explained by cardiac failure/fluid overload, and PaO₂/FiO₂ ≤ 300 on ≥5 cmH₂O PEEP.',
    applicableChiefComplaints: [
      'shortness_of_breath',
      'respiratory_failure',
      'hypoxia',
      'respiratory_distress',
    ],
    keywords: [
      'Berlin criteria',
      'ARDS',
      'acute respiratory distress syndrome',
      'PaO2/FiO2',
      'P/F ratio',
      'ventilator',
      'PEEP',
      'lung protective ventilation',
    ],
    requiredTests: ['arterial_blood_gas', 'chest_xray', 'chest_ct'],
    components: [
      // ---- Prerequisite criteria (algorithm components) ----
      {
        id: 'acute_onset',
        label: 'Acute onset within 1 week of known insult or new/worsening respiratory symptoms',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'bilateral_opacities',
        label: 'Bilateral opacities on CXR or CT (not fully explained by effusions, lobar/lung collapse, or nodules)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'not_cardiac_or_fluid',
        label: 'Respiratory failure not fully explained by cardiac failure or fluid overload (echocardiography if uncertain)',
        type: 'boolean',
        value: 0,
        source: 'user_input',
      },
      {
        id: 'respiratory_support',
        label: 'Current respiratory support mode',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'High-flow nasal cannula (HFNC) or CPAP ≥ 5 cmH₂O', value: 0 },
          { label: 'Non-invasive ventilation (BiPAP/NIPPV)', value: 0 },
          { label: 'Invasive mechanical ventilation', value: 0 },
        ],
      },
      {
        id: 'peep_level',
        label: 'Minimum PEEP ≥ 5 cmH₂O (or CPAP ≥ 5 cmH₂O for non-intubated)',
        type: 'boolean',
        value: 0,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      // ---- Severity classification by P/F ratio ----
      {
        id: 'pf_ratio',
        label: 'PaO₂/FiO₂ ratio (on ≥5 cmH₂O PEEP)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Mild ARDS: PaO₂/FiO₂ 201–300 mmHg', value: 1 },
          { label: 'Moderate ARDS: PaO₂/FiO₂ 101–200 mmHg', value: 2 },
          { label: 'Severe ARDS: PaO₂/FiO₂ ≤ 100 mmHg', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 1,
          risk: 'Mild ARDS',
          interpretation:
            'PaO₂/FiO₂ 201–300 mmHg: ~27% mortality. Consider NIV/HFNC. If intubated: lung-protective ventilation (6 mL/kg IBW, Pplat ≤30 cmH₂O), PEEP ≥5 cmH₂O.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate ARDS',
          interpretation:
            'PaO₂/FiO₂ 101–200 mmHg: ~32% mortality. Lung-protective ventilation mandatory. Higher PEEP strategy (ARDSNet table). Neuromuscular blockade for 48 hours if P/F < 150. Prone positioning beneficial.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Severe ARDS',
          interpretation:
            'PaO₂/FiO₂ ≤100 mmHg: ~45% mortality. Mandatory lung-protective ventilation. Prone positioning ≥16 hours/day (PROSEVA trial mortality benefit). Consider venovenous ECMO at ECMO center. Recruitment maneuvers per protocol.',
        },
      ],
    },
    suggestedTreatments: {
      'Severe ARDS': [
        'lung_protective_ventilation_6ml_kg',
        'prone_positioning_16h_daily',
        'high_peep_strategy',
        'nmba_cisatracurium_48h',
        'conservative_fluid_strategy',
        'ecmo_consult_if_refractory',
        'treat_underlying_cause',
      ],
      'Moderate ARDS': [
        'lung_protective_ventilation_6ml_kg',
        'high_peep_strategy',
        'prone_positioning_if_pf_under_150',
        'nmba_cisatracurium_48h',
        'conservative_fluid_strategy',
        'treat_underlying_cause',
      ],
      'Mild ARDS': [
        'lung_protective_ventilation_6ml_kg',
        'peep_titration',
        'supplemental_oxygen_or_hfnc_trial',
        'treat_underlying_cause',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — Glasgow-Blatchford Score
  // =========================================================================
  {
    id: 'glasgow_blatchford',
    name: 'Glasgow-Blatchford Score',
    fullName: 'Glasgow-Blatchford Bleeding Score (GBS)',
    category: 'GASTROINTESTINAL',
    application:
      'Pre-endoscopic risk stratification for upper GI bleeding (UGIB). Identifies patients at very low risk who may be safely managed as outpatients without urgent endoscopy. Score of 0 identifies low-risk patients for discharge.',
    applicableChiefComplaints: [
      'upper_gi_bleeding',
      'hematemesis',
      'melena',
      'blood_in_stool',
    ],
    keywords: [
      'Glasgow-Blatchford',
      'GBS',
      'upper GI bleed',
      'UGIB',
      'hematemesis',
      'melena',
      'endoscopy',
      'risk stratification',
      'discharge',
    ],
    requiredTests: ['BUN', 'hemoglobin', 'blood_pressure', 'heart_rate'],
    components: [
      {
        id: 'bun',
        label: 'BUN (Blood Urea Nitrogen)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '< 18.2 mg/dL (0 pts)', value: 0 },
          { label: '18.2–22.3 mg/dL (2 pts)', value: 2 },
          { label: '22.4–27.9 mg/dL (3 pts)', value: 3 },
          { label: '28.0–69.9 mg/dL (4 pts)', value: 4 },
          { label: '≥ 70 mg/dL (6 pts)', value: 6 },
        ],
      },
      {
        id: 'hemoglobin_male',
        label: 'Hemoglobin — male',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Male ≥ 13.0 g/dL (0 pts)', value: 0 },
          { label: 'Male 12.0–12.9 g/dL (1 pt)', value: 1 },
          { label: 'Male 10.0–11.9 g/dL (3 pts)', value: 3 },
          { label: 'Male < 10.0 g/dL (6 pts)', value: 6 },
        ],
      },
      {
        id: 'hemoglobin_female',
        label: 'Hemoglobin — female',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Female ≥ 12.0 g/dL (0 pts)', value: 0 },
          { label: 'Female 10.0–11.9 g/dL (1 pt)', value: 1 },
          { label: 'Female < 10.0 g/dL (6 pts)', value: 6 },
        ],
      },
      {
        id: 'systolic_bp',
        label: 'Systolic blood pressure',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '≥ 110 mmHg (0 pts)', value: 0 },
          { label: '100–109 mmHg (1 pt)', value: 1 },
          { label: '90–99 mmHg (2 pts)', value: 2 },
          { label: '< 90 mmHg (3 pts)', value: 3 },
        ],
      },
      {
        id: 'pulse_over_100',
        label: 'Pulse > 100 beats/min (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'melena',
        label: 'Melena at presentation (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'syncope',
        label: 'Syncope at presentation (+2 pts)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hepatic_disease',
        label: 'Known hepatic disease (+2 pts)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heart_failure',
        label: 'Known cardiac failure (+2 pts)',
        type: 'boolean',
        value: 2,
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
            'Score = 0: <1% risk of requiring intervention (endoscopy, transfusion, surgery). Safe for outpatient management without urgent endoscopy.',
        },
        {
          min: 1,
          max: 2,
          risk: 'Low',
          interpretation:
            'Low risk; consider outpatient endoscopy within 24 hours or early discharge with close follow-up.',
        },
        {
          min: 3,
          max: 5,
          risk: 'Moderate',
          interpretation:
            'Moderate risk; inpatient management with early endoscopy (within 24 hours) indicated.',
        },
        {
          min: 6,
          max: 29,
          risk: 'High',
          interpretation:
            'High risk; urgent endoscopy required; anticipate need for intervention (hemostasis, blood transfusion).',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'iv_ppi_infusion',
        'blood_type_and_crossmatch',
        'iv_access_large_bore',
        'npo_for_endoscopy',
        'urgent_gi_consult',
        'iv_erythromycin_prior_to_scope',
        'prbcs_if_hemodynamically_unstable',
        'icu_or_monitored_bed',
      ],
      Moderate: [
        'iv_ppi',
        'gi_consult',
        'early_endoscopy_24h',
        'npo',
        'type_and_screen',
      ],
      Low: [
        'oral_ppi',
        'gi_followup_outpatient_endoscopy',
        'discharge_with_return_precautions',
      ],
      'Very Low': [
        'discharge_with_outpatient_gi_followup',
        'oral_ppi',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — AIMS65 Score
  // =========================================================================
  {
    id: 'aims65',
    name: 'AIMS65',
    fullName: 'AIMS65 Score',
    category: 'GASTROINTESTINAL',
    application:
      'Predicts in-hospital mortality in upper GI bleeding (UGIB). Useful for risk stratification prior to endoscopy. Acronym: Albumin < 3.0, INR > 1.5, altered Mental status, Systolic BP < 90, age > 65.',
    applicableChiefComplaints: ['upper_gi_bleeding', 'hematemesis', 'melena'],
    keywords: [
      'AIMS65',
      'upper GI bleed',
      'UGIB',
      'mortality',
      'albumin',
      'INR',
      'altered mental status',
      'hematemesis',
    ],
    requiredTests: ['albumin', 'INR', 'blood_pressure'],
    components: [
      {
        id: 'albumin_under_3',
        label: 'Albumin < 3.0 g/dL (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'inr_over_1_5',
        label: 'INR > 1.5 (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'altered_mental_status',
        label: 'Altered mental status (GCS < 14, or documented AMS) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'sbp_under_90',
        label: 'Systolic BP < 90 mmHg (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age_over_65',
        label: 'Age > 65 years (+1 pt)',
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
            '0.3% in-hospital mortality. Consider outpatient management if hemodynamically stable (use with GBS = 0 for discharge decision).',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation: '1.2% in-hospital mortality. Inpatient admission with early endoscopy.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            '5.3% in-hospital mortality. Inpatient admission; early endoscopy within 24 hours; GI consult.',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            '10.3% in-hospital mortality. ICU-level monitoring; urgent endoscopy; aggressive resuscitation.',
        },
        {
          min: 4,
          max: 5,
          risk: 'Very High',
          interpretation:
            '16.5–24.5% in-hospital mortality. ICU admission; emergent endoscopy; massive transfusion protocol if hemodynamically unstable.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'iv_ppi_infusion',
        'massive_transfusion_protocol_if_unstable',
        'emergent_gi_consult',
        'icu_admission',
        'npo_emergent_endoscopy',
        'type_and_crossmatch_4u_prbc',
      ],
      High: [
        'iv_ppi_infusion',
        'gi_consult',
        'icu_or_monitored_bed',
        'urgent_endoscopy',
        'type_and_crossmatch',
      ],
      Moderate: [
        'iv_ppi',
        'gi_consult',
        'early_endoscopy_24h',
        'inpatient_admission',
        'type_and_screen',
      ],
      Low: [
        'iv_ppi',
        'gi_consult',
        'inpatient_admission',
        'endoscopy_within_24h',
      ],
      'Very Low': [
        'oral_ppi',
        'gi_followup',
        'discharge_if_gbscore_zero',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — Rockall Score
  // =========================================================================
  {
    id: 'rockall',
    name: 'Rockall Score',
    fullName: 'Rockall Score',
    category: 'GASTROINTESTINAL',
    application:
      'Predicts rebleeding and mortality in upper GI bleeding (UGIB). Available as a pre-endoscopic (clinical) score (max 7) and full post-endoscopic score (max 11). Pre-endoscopic score ≥0 predicts risk before intervention; post-endoscopic score incorporates endoscopic findings.',
    applicableChiefComplaints: ['upper_gi_bleeding', 'hematemesis', 'melena'],
    keywords: [
      'Rockall',
      'upper GI bleed',
      'UGIB',
      'rebleeding',
      'mortality',
      'endoscopy',
      'stigmata of hemorrhage',
      'Mallory-Weiss',
    ],
    requiredTests: ['upper_endoscopy'],
    components: [
      // ---- Pre-endoscopic components ----
      {
        id: 'age',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '< 60 years (0 pts)', value: 0 },
          { label: '60–79 years (1 pt)', value: 1 },
          { label: '≥ 80 years (2 pts)', value: 2 },
        ],
      },
      {
        id: 'shock',
        label: 'Shock status',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No shock (HR < 100, SBP ≥ 100) (0 pts)', value: 0 },
          { label: 'Tachycardia (HR ≥ 100, SBP ≥ 100) (1 pt)', value: 1 },
          { label: 'Hypotension (SBP < 100) (2 pts)', value: 2 },
        ],
      },
      {
        id: 'comorbidities',
        label: 'Comorbidities',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No major comorbidity (0 pts)', value: 0 },
          { label: 'Cardiac failure, IHD, or any major comorbidity (2 pts)', value: 2 },
          { label: 'Renal failure, liver failure, or disseminated malignancy (3 pts)', value: 3 },
        ],
      },
      // ---- Post-endoscopic components ----
      {
        id: 'diagnosis',
        label: 'Endoscopic diagnosis (post-endoscopy only)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Mallory-Weiss tear or no lesion identified, no SRH (0 pts)', value: 0 },
          { label: 'All other diagnoses (1 pt)', value: 1 },
          { label: 'Malignancy of upper GI tract (2 pts)', value: 2 },
        ],
      },
      {
        id: 'stigmata',
        label: 'Stigmata of recent hemorrhage (SRH) on endoscopy (post-endoscopy only)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'None or dark spot only (0 pts)', value: 0 },
          { label: 'Blood in upper GI tract, adherent clot, visible or spurting vessel (2 pts)', value: 2 },
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
          interpretation:
            'Pre-endoscopic score 0: 0.2% rebleeding, 0% mortality. Post-endoscopic 0–2: ~4–5% rebleeding, 0% mortality. Low risk; consider outpatient endoscopy if pre-endoscopic score 0.',
        },
        {
          min: 3,
          max: 5,
          risk: 'Moderate',
          interpretation:
            'Pre-endoscopic ≥3 indicates moderate-high risk. Post-endoscopic 3–5: 11–25% rebleeding, 3–11% mortality. Inpatient management; endoscopy within 24 hours.',
        },
        {
          min: 6,
          max: 11,
          risk: 'High',
          interpretation:
            'Post-endoscopic 6–8+: 33–42% rebleeding, 17–41% mortality. High risk; ICU-level monitoring; repeat endoscopy or surgical/IR intervention if rebleeding.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'iv_ppi_infusion_72h',
        'icu_admission',
        'repeat_endoscopy_if_rebleed',
        'ir_or_surgery_consult_if_refractory',
        'type_and_crossmatch',
        'prbcs_to_maintain_hgb_over_7',
      ],
      Moderate: [
        'iv_ppi',
        'inpatient_admission',
        'endoscopy_within_24h',
        'gi_consult',
        'type_and_screen',
      ],
      Low: [
        'oral_ppi',
        'outpatient_endoscopy',
        'discharge_with_gi_followup',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — Alvarado Score (MANTRELS)
  // =========================================================================
  {
    id: 'alvarado',
    name: 'Alvarado Score',
    fullName: 'Alvarado Score (MANTRELS)',
    category: 'GASTROINTESTINAL',
    application:
      'Clinical prediction rule for acute appendicitis. Useful for initial stratification before imaging. Acronym: Migration of pain to RLQ, Anorexia, Nausea/vomiting, Tenderness in RLQ, Rebound tenderness, Elevated temperature, Leukocytosis, Left shift.',
    applicableChiefComplaints: [
      'right_lower_quadrant_pain',
      'abdominal_pain',
      'appendicitis',
    ],
    keywords: [
      'Alvarado',
      'MANTRELS',
      'appendicitis',
      'RLQ pain',
      'right lower quadrant',
      'leukocytosis',
      'rebound tenderness',
    ],
    requiredTests: ['WBC', 'differential'],
    components: [
      {
        id: 'migration_to_rlq',
        label: 'Migration of pain to right iliac fossa (RLQ) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'anorexia',
        label: 'Anorexia (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'nausea_vomiting',
        label: 'Nausea or vomiting (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'rlq_tenderness',
        label: 'Tenderness in right lower quadrant (+2 pts)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'rebound_tenderness',
        label: 'Rebound tenderness (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'elevated_temp',
        label: 'Elevated temperature (> 37.3°C / 99.1°F) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'leukocytosis',
        label: 'Leukocytosis (WBC > 10,000/mm³) (+2 pts)',
        type: 'boolean',
        value: 2,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'left_shift',
        label: 'Left shift (neutrophilia > 75% or bands present) (+1 pt)',
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
          max: 4,
          risk: 'Low',
          interpretation:
            '~7% probability of appendicitis. Consider observation or discharge with return precautions. Imaging optional based on clinical judgment.',
        },
        {
          min: 5,
          max: 6,
          risk: 'Intermediate',
          interpretation:
            '~57% probability of appendicitis. Equivocal — imaging strongly recommended (CT abdomen/pelvis with contrast or ultrasound in pediatric/pregnant patients). Surgical consult.',
        },
        {
          min: 7,
          max: 8,
          risk: 'High',
          interpretation:
            '~83% probability of appendicitis. Surgical consultation warranted; imaging to confirm unless clinically clear.',
        },
        {
          min: 9,
          max: 10,
          risk: 'Very High',
          interpretation:
            '~95% probability of appendicitis. Near-certain diagnosis; immediate surgical consultation; prepare for operative intervention.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'npo',
        'iv_fluids',
        'preoperative_antibiotics',
        'emergent_surgery_consult',
        'appendectomy',
      ],
      High: [
        'npo',
        'iv_fluids',
        'ct_abdomen_pelvis',
        'surgery_consult',
        'iv_antibiotics_preoperative',
      ],
      Intermediate: [
        'npo',
        'ct_abdomen_pelvis_or_ultrasound',
        'iv_fluids',
        'observation',
        'serial_abdominal_exams',
        'surgery_consult',
      ],
      Low: [
        'observation',
        'oral_hydration',
        'serial_abdominal_exams',
        'return_precautions',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — AIR Score (Appendicitis Inflammatory Response)
  // =========================================================================
  {
    id: 'air_score',
    name: 'AIR Score',
    fullName: 'AIR Score (Appendicitis Inflammatory Response Score)',
    category: 'GASTROINTESTINAL',
    application:
      'Risk stratification for appendicitis using clinical and laboratory inflammatory markers. Designed to safely identify patients who can be observed or discharged, and those who need immediate surgery. Outperforms Alvarado in reducing negative appendectomy rate.',
    applicableChiefComplaints: [
      'right_lower_quadrant_pain',
      'abdominal_pain',
      'appendicitis',
    ],
    keywords: [
      'AIR score',
      'appendicitis',
      'inflammatory response',
      'CRP',
      'WBC',
      'rebound tenderness',
      'RLQ pain',
    ],
    requiredTests: ['WBC', 'CRP', 'polymorphonuclear_leukocyte_count'],
    components: [
      {
        id: 'vomiting',
        label: 'Vomiting (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'rlq_pain',
        label: 'Pain in right lower quadrant (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'rebound_or_muscular_defense',
        label: 'Rebound tenderness or muscular defense',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Mild (light rebound tenderness) (1 pt)', value: 1 },
          { label: 'Moderate (medium rebound tenderness) (2 pts)', value: 2 },
          { label: 'Strong (muscular defense / guarding) (3 pts)', value: 3 },
          { label: 'None (0 pts)', value: 0 },
        ],
      },
      {
        id: 'elevated_body_temp',
        label: 'Elevated body temperature (≥ 38.5°C / 101.3°F) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'polymorphonuclear_leukocytes',
        label: 'Polymorphonuclear leukocytes (PMN / neutrophils)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '70–84% (1 pt)', value: 1 },
          { label: '≥ 85% (2 pts)', value: 2 },
          { label: '< 70% (0 pts)', value: 0 },
        ],
      },
      {
        id: 'wbc',
        label: 'WBC count',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '10.0–14.9 × 10⁹/L (1 pt)', value: 1 },
          { label: '≥ 15.0 × 10⁹/L (2 pts)', value: 2 },
          { label: '< 10.0 × 10⁹/L (0 pts)', value: 0 },
        ],
      },
      {
        id: 'crp',
        label: 'CRP level',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '10–49 mg/L (1 pt)', value: 1 },
          { label: '≥ 50 mg/L (2 pts)', value: 2 },
          { label: '< 10 mg/L (0 pts)', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Low',
          interpretation:
            'Low probability of appendicitis (negative predictive value ~97%). Safe for observation, outpatient follow-up, or discharge with return precautions.',
        },
        {
          min: 5,
          max: 8,
          risk: 'Intermediate',
          interpretation:
            'Intermediate risk. Active observation with serial exams, CT abdomen/pelvis, or diagnostic laparoscopy. Surgical consult recommended.',
        },
        {
          min: 9,
          max: 12,
          risk: 'High',
          interpretation:
            'High probability of appendicitis (positive predictive value ~96%). Surgical intervention indicated without delay for imaging in clear cases.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'npo',
        'iv_fluids',
        'preoperative_antibiotics_cefazolin',
        'surgery_consult_appendectomy',
      ],
      Intermediate: [
        'npo',
        'iv_fluids',
        'ct_abdomen_pelvis_contrast',
        'observation_serial_exams',
        'surgery_consult',
      ],
      Low: [
        'observation',
        'clear_liquid_diet',
        'serial_abdominal_exams',
        'crp_wbc_repeat_in_6_8h',
        'discharge_with_return_precautions',
      ],
    },
  },

  // =========================================================================
  // GASTROINTESTINAL — BISAP Score (Pancreatitis)
  // =========================================================================
  {
    id: 'bisap',
    name: 'BISAP',
    fullName: 'BISAP Score (Bedside Index for Severity in Acute Pancreatitis)',
    category: 'GASTROINTESTINAL',
    application:
      'Early bedside severity assessment for acute pancreatitis; can be calculated within the first 24 hours of presentation. Predicts in-hospital mortality, organ failure, and pancreatic necrosis. Acronym: BUN > 25, Impaired mental status, SIRS, Age > 60, Pleural effusion.',
    applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
    keywords: [
      'BISAP',
      'pancreatitis',
      'acute pancreatitis',
      'severity',
      'early assessment',
      'SIRS',
      'BUN',
      'pleural effusion',
    ],
    requiredTests: ['BUN', 'chest_xray_or_ct', 'WBC', 'temperature', 'heart_rate', 'respiratory_rate'],
    components: [
      {
        id: 'bun_over_25',
        label: 'BUN > 25 mg/dL (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'impaired_mental_status',
        label: 'Impaired mental status (GCS < 15 or disorientation) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'sirs',
        label: 'SIRS criteria (≥ 2 of 4: Temp < 36°C or > 38°C, HR > 90, RR > 20 or PaCO₂ < 32, WBC < 4K or > 12K or > 10% bands) (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age_over_60',
        label: 'Age > 60 years (+1 pt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'pleural_effusion',
        label: 'Pleural effusion on imaging (CXR or CT) (+1 pt)',
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
          risk: 'Mild',
          interpretation:
            'Score 0: <1% mortality. Score 1: ~1% mortality. Mild pancreatitis likely; IV fluids, bowel rest, pain control. Early oral feeding if tolerated.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            '~2% mortality; increased risk of organ failure. Close monitoring; consider step-down unit. Aggressive IV hydration (Lactated Ringer preferred).',
        },
        {
          min: 3,
          max: 5,
          risk: 'Severe',
          interpretation:
            'Score 3: ~5% mortality. Score 4–5: ~22–27% mortality with increased pancreatic necrosis and organ failure risk. ICU admission; aggressive resuscitation; early CT if clinical deterioration.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'aggressive_iv_hydration_lr_250_500ml_hr',
        'icu_admission',
        'npo_ngt_if_vomiting',
        'early_enteral_nutrition_within_24_48h',
        'ct_abdomen_pelvis_with_contrast',
        'serial_hematocrit_bun_creatinine',
        'gi_or_surgery_consult',
        'ercp_if_biliary_pancreatitis_with_cholangitis',
        'avoid_prophylactic_antibiotics_unless_infection_suspected',
      ],
      Moderate: [
        'iv_hydration_lr',
        'npo_or_low_fat_oral_diet',
        'pain_control',
        'monitoring_hematocrit_bun_creatinine',
        'consideration_of_ct_if_deteriorating',
      ],
      Mild: [
        'iv_hydration_lr',
        'npo_then_early_oral_feeding',
        'pain_control',
        'monitor_for_clinical_deterioration',
        'cholecystectomy_if_biliary_etiology_same_admission',
      ],
    },
  },
]
