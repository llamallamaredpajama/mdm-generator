import type { CdrSeed } from './types'

/**
 * Batch 13 — Infectious Disease, Toxicology & First Pediatric CDRs
 *
 * CDRs: feverpain, kings_college_criteria, pawss, naranjo_adr,
 *       poisoning_severity_score, ten_4_faces_p
 *
 * Quarantined (insufficient user-answerable components):
 *   - kocher_criteria (2/4 clinical — lab-dominant)
 *   - bacterial_meningitis_score (1/5 clinical — lab-dominant)
 *   - done_nomogram (2/4 clinical — measurement-based, historically abandoned)
 *   - qtc_calculation (2/5 clinical — mathematical formula)
 *
 * Sources:
 *  - FeverPAIN: Little et al., BMJ 2013
 *  - King's College Criteria: O'Grady et al., Gastroenterology 1989
 *  - PAWSS: Maldonado et al., Alcohol 2014
 *  - Naranjo ADR Scale: Naranjo et al., Clin Pharmacol Ther 1981
 *  - Poisoning Severity Score: Persson et al., J Toxicol Clin Toxicol 1998 (IPCS/EAPCCT)
 *  - TEN-4-FACESp: Pierce et al., Pediatrics 2010; expanded Pierce et al., Pediatrics 2017
 */

export const batch13IdToxCdrs: CdrSeed[] = [
  // ===========================================================================
  // INFECTIOUS DISEASE — FeverPAIN Score
  // 5 binary criteria, each 1 point; guides antibiotic prescribing for pharyngitis
  // ===========================================================================
  {
    id: 'feverpain',
    name: 'FeverPAIN Score',
    fullName: 'FeverPAIN Score',
    category: 'INFECTIOUS DISEASE',
    application:
      'UK alternative for assessment of streptococcal pharyngitis. Guides antibiotic prescribing with scores 4–5 indicating 62–65% strep probability.',
    applicableChiefComplaints: ['sore_throat', 'pharyngitis', 'throat_pain', 'fever'],
    keywords: [
      'FeverPAIN',
      'pharyngitis',
      'streptococcal',
      'sore throat',
      'antibiotics',
      'UK',
      'tonsillitis',
    ],
    components: [
      {
        id: 'fever_24h',
        label: 'Fever (during previous 24 hours)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'purulence',
        label: 'Purulence (pharyngeal/tonsillar exudate)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'attend_rapidly',
        label: 'Attend rapidly (within 3 days of symptom onset)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'inflamed_tonsils',
        label: 'Inflamed tonsils (severely inflamed)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_cough_coryza',
        label: 'No cough or coryza',
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
            'Score 0–1: Strep probability 13–18%; no antibiotics recommended',
        },
        {
          min: 2,
          max: 3,
          risk: 'Intermediate',
          interpretation:
            'Score 2–3: Strep probability 34–40%; delayed antibiotics (backup prescription) or RADT',
        },
        {
          min: 4,
          max: 5,
          risk: 'High',
          interpretation:
            'Score 4–5: Strep probability 62–65%; immediate antibiotics OR RADT',
        },
      ],
    },
    suggestedTreatments: {
      Low: ['symptomatic_treatment', 'no_antibiotics'],
      Intermediate: ['delayed_antibiotics', 'rapid_antigen_test'],
      High: ['antibiotics_penicillin_v', 'rapid_antigen_test'],
    },
  },

  // ===========================================================================
  // TOXICOLOGY — King's College Criteria
  // Algorithm: separate pathways for acetaminophen vs non-acetaminophen ALF
  // ===========================================================================
  {
    id: 'kings_college_criteria',
    name: "King's College Criteria",
    fullName: "King's College Criteria",
    category: 'TOXICOLOGY',
    application:
      'Identifies acetaminophen-induced (and non-acetaminophen) fulminant hepatic failure patients who should be referred for liver transplant evaluation.',
    applicableChiefComplaints: [
      'liver_failure',
      'acetaminophen_overdose',
      'hepatic_encephalopathy',
      'jaundice',
      'coagulopathy',
    ],
    keywords: [
      "King's College",
      'liver failure',
      'transplant',
      'acetaminophen',
      'hepatic failure',
      'INR',
      'encephalopathy',
      'creatinine',
      'fulminant',
    ],
    requiredTests: ['arterial pH', 'INR', 'creatinine', 'bilirubin'],
    components: [
      // --- Etiology selection (determines which pathway) ---
      {
        id: 'etiology',
        label: 'Etiology of acute liver failure',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Acetaminophen-induced', value: 1 },
          { label: 'Non-acetaminophen', value: 2 },
        ],
      },
      // --- Acetaminophen pathway criteria ---
      {
        id: 'arterial_ph_lt_7_3',
        label: 'Arterial pH <7.3 (after resuscitation, >24h post ingestion)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'inr_gt_6_5',
        label: 'INR >6.5 (PT >100 seconds)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'creatinine_gt_3_4',
        label: 'Creatinine >3.4 mg/dL (>300 µmol/L)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'grade_3_4_encephalopathy',
        label: 'Grade III–IV hepatic encephalopathy',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // --- Non-acetaminophen pathway criteria ---
      {
        id: 'inr_gt_6_5_nonacet',
        label: 'INR >6.5 (independent criterion for non-APAP)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'age_lt_10_or_gt_40',
        label: 'Age <10 or >40 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'unfavorable_etiology',
        label: 'Unfavorable etiology (non-A/non-B hepatitis, drug reaction, Wilson disease)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'jaundice_to_enceph_gt_7d',
        label: 'Jaundice-to-encephalopathy interval >7 days',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'bilirubin_gt_17_5',
        label: 'Bilirubin >17.5 mg/dL (>300 µmol/L)',
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
          risk: 'Low',
          interpretation:
            'Criteria NOT met; some patients not meeting criteria may still deteriorate — monitor closely with serial labs (INR, lactate, pH)',
        },
        {
          min: 1,
          max: 1,
          risk: 'High',
          interpretation:
            'ACETAMINOPHEN pathway: pH <7.3 alone = criteria met; OR all three of (INR >6.5 + Cr >3.4 + grade III-IV encephalopathy). NON-ACETAMINOPHEN pathway: INR >6.5 alone = criteria met; OR any 3 of 5 ancillary criteria. → Refer urgently for liver transplant evaluation; specificity ~95%, sensitivity ~58–69%',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'transplant_center_referral_emergent',
        'nac_if_acetaminophen',
        'icu_admission',
        'hepatology_consult',
        'fresh_frozen_plasma_only_if_bleeding',
      ],
      Low: [
        'serial_labs_q6h',
        'nac_if_acetaminophen',
        'close_monitoring',
        'hepatology_consult',
      ],
    },
  },

  // ===========================================================================
  // TOXICOLOGY — PAWSS
  // 10 binary criteria (threshold ≥4 = high risk)
  // ===========================================================================
  {
    id: 'pawss',
    name: 'PAWSS',
    fullName: 'PAWSS (Prediction of Alcohol Withdrawal Severity Scale)',
    category: 'TOXICOLOGY',
    application:
      'Predicts which hospitalized patients are at risk for complicated alcohol withdrawal (seizures, delirium tremens) to guide prophylactic treatment.',
    applicableChiefComplaints: [
      'alcohol_withdrawal',
      'alcohol_use_disorder',
      'substance_use',
      'tremor',
      'anxiety',
    ],
    keywords: [
      'PAWSS',
      'alcohol withdrawal',
      'prediction',
      'complicated withdrawal',
      'delirium tremens',
      'seizure',
      'prophylaxis',
      'benzodiazepine',
    ],
    components: [
      {
        id: 'drinks_gt_threshold',
        label: 'Drinks >standard daily threshold (>2 women, >4 men) or binge pattern',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_withdrawal',
        label: 'History of prior alcohol withdrawal episode',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_withdrawal_seizure',
        label: 'History of prior withdrawal seizure',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_dt',
        label: 'History of prior delirium tremens',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'prior_detox',
        label: 'History of prior detoxification (medical or social)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'last_drink_gt_24h',
        label: 'Last drink within 24–72 hours or recent cessation',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'bac_gt_200_or_evidence',
        label: 'Evidence of increased tolerance (BAC >200 without intoxication, or high daily consumption)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'current_withdrawal_signs',
        label: 'Current signs of withdrawal (tremor, agitation, diaphoresis, tachycardia)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'concurrent_benzo_or_barb',
        label: 'Concurrent benzodiazepine or barbiturate use',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'concurrent_medical_illness',
        label: 'Concurrent acute medical illness (infection, trauma, surgery, metabolic)',
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
          risk: 'Low',
          interpretation:
            'Score 0–3: Low risk for complicated withdrawal; standard monitoring, may not require pharmacologic prophylaxis',
        },
        {
          min: 4,
          max: 10,
          risk: 'High',
          interpretation:
            'Score ≥4: High risk for complicated withdrawal (seizures, DTs); initiate withdrawal prophylaxis with benzodiazepines; CIWA monitoring recommended; sensitivity 93.1%, specificity 99.5%',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'benzodiazepine_prophylaxis',
        'ciwa_monitoring',
        'thiamine_iv',
        'electrolyte_repletion',
        'consider_icu_if_high_risk',
      ],
      Low: ['ciwa_monitoring', 'thiamine_po', 'supportive_care', 'reassess_prn'],
    },
  },

  // ===========================================================================
  // TOXICOLOGY — Naranjo Adverse Drug Reaction Scale
  // 10 questions with variable scoring (+2/+1/0/-1); sum-based
  // ===========================================================================
  {
    id: 'naranjo_adr',
    name: 'Naranjo Scale',
    fullName: 'Naranjo Adverse Drug Reaction Scale',
    category: 'TOXICOLOGY',
    application:
      'Assesses probability that an adverse event is caused by a drug rather than other factors. Uses 10 standardized questions to classify ADR likelihood.',
    applicableChiefComplaints: [
      'adverse_drug_reaction',
      'drug_reaction',
      'allergic_reaction',
      'medication_side_effect',
    ],
    keywords: [
      'Naranjo',
      'adverse drug reaction',
      'ADR',
      'causality',
      'drug reaction',
      'pharmacovigilance',
    ],
    components: [
      {
        id: 'previous_reports',
        label: 'Are there previous conclusive reports on this reaction?',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'event_after_drug',
        label: 'Did the adverse event appear after the suspected drug was administered?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes', value: 2 },
          { label: 'No', value: -1 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'improved_on_withdrawal',
        label: 'Did the adverse reaction improve when the drug was discontinued or a specific antagonist administered?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'reappear_on_readmin',
        label: 'Did the adverse reaction reappear when the drug was readministered?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes', value: 2 },
          { label: 'No', value: -1 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'alternative_causes',
        label: 'Are there alternative causes (other than the drug) that could have caused the reaction?',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Yes', value: -1 },
          { label: 'No', value: 2 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'placebo_response',
        label: 'Did the reaction reappear when a placebo was given?',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Yes', value: -1 },
          { label: 'No', value: 1 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'drug_in_blood',
        label: 'Was the drug detected in blood (or other fluids) in concentrations known to be toxic?',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'dose_related',
        label: 'Was the reaction more severe when the dose was increased, or less severe when decreased?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'prior_exposure_reaction',
        label: 'Did the patient have a similar reaction to the same or similar drug in a previous exposure?',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
      {
        id: 'objective_evidence',
        label: 'Was the adverse event confirmed by any objective evidence?',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Yes', value: 1 },
          { label: 'No', value: 0 },
          { label: 'Do not know', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: -4,
          max: 0,
          risk: 'Doubtful',
          interpretation: 'Score ≤0: Doubtful ADR causality',
        },
        {
          min: 1,
          max: 4,
          risk: 'Possible',
          interpretation: 'Score 1–4: Possible ADR',
        },
        {
          min: 5,
          max: 8,
          risk: 'Probable',
          interpretation: 'Score 5–8: Probable ADR',
        },
        {
          min: 9,
          max: 13,
          risk: 'Definite',
          interpretation: 'Score ≥9: Definite ADR',
        },
      ],
    },
    suggestedTreatments: {
      Definite: [
        'discontinue_suspected_drug',
        'report_to_pharmacovigilance',
        'alternative_medication',
        'monitor_for_recurrence',
      ],
      Probable: [
        'discontinue_suspected_drug',
        'consider_alternative_medication',
        'monitor_closely',
        'report_to_pharmacovigilance',
      ],
      Possible: [
        'monitor_closely',
        'consider_dose_adjustment',
        'evaluate_alternative_causes',
      ],
      Doubtful: [
        'continue_current_medication',
        'reassess_if_symptoms_persist',
      ],
    },
  },

  // ===========================================================================
  // TOXICOLOGY — Poisoning Severity Score (PSS)
  // 4 clinical organ system assessments + overall physician grade
  // Each organ system graded 0–3 per IPCS/EAPCCT criteria;
  // overall PSS = worst-affected organ system (algorithm)
  // Source: Persson et al., J Toxicol Clin Toxicol 1998 (IPCS/EAPCCT)
  // ===========================================================================
  {
    id: 'poisoning_severity_score',
    name: 'Poisoning Severity Score',
    fullName: 'Poisoning Severity Score (PSS)',
    category: 'TOXICOLOGY',
    application:
      'Standardized grading of acute poisoning severity (IPCS/EAPCCT). Assesses multiple organ systems; overall grade = worst-affected system. Used for clinical communication and outcome tracking.',
    applicableChiefComplaints: ['overdose', 'toxic_ingestion', 'poisoning', 'ingestion'],
    keywords: [
      'PSS',
      'poisoning severity score',
      'toxicology',
      'grading',
      'overdose',
      'severity',
      'IPCS',
      'EAPCCT',
    ],
    components: [
      {
        id: 'gi_severity',
        label: 'GI/Hepatic severity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Grade 0 — No GI symptoms', value: 0 },
          { label: 'Grade 1 — Minor: nausea, vomiting, diarrhea, abdominal pain', value: 1 },
          { label: 'Grade 2 — Moderate: prolonged vomiting/diarrhea, ileus, GI bleeding without hemodynamic compromise', value: 2 },
          { label: 'Grade 3 — Severe: massive GI hemorrhage, GI perforation, pancreatitis with organ failure', value: 3 },
        ],
      },
      {
        id: 'respiratory_severity',
        label: 'Respiratory severity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Grade 0 — No respiratory symptoms', value: 0 },
          { label: 'Grade 1 — Minor: cough, irritation, mild dyspnea, mild bronchospasm', value: 1 },
          { label: 'Grade 2 — Moderate: prolonged cough, bronchospasm, stridor, hypoxemia requiring O2', value: 2 },
          { label: 'Grade 3 — Severe: respiratory failure, pulmonary edema, ARDS, pneumonitis with respiratory failure', value: 3 },
        ],
      },
      {
        id: 'cns_severity',
        label: 'Nervous system severity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Grade 0 — No neurological symptoms', value: 0 },
          { label: 'Grade 1 — Minor: drowsiness, dizziness, tinnitus, ataxia, restlessness', value: 1 },
          { label: 'Grade 2 — Moderate: deep unconsciousness with appropriate pain response, brief/self-limited seizure', value: 2 },
          { label: 'Grade 3 — Severe: deep coma, prolonged/repeated seizures, status epilepticus, respiratory depression from CNS cause', value: 3 },
        ],
      },
      {
        id: 'cv_severity',
        label: 'Cardiovascular severity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Grade 0 — No cardiovascular symptoms', value: 0 },
          { label: 'Grade 1 — Minor: isolated/transient hypotension or hypertension, sinus tachycardia', value: 1 },
          { label: 'Grade 2 — Moderate: significant bradycardia or tachycardia, marked hypo/hypertension, conduction disturbances', value: 2 },
          { label: 'Grade 3 — Severe: cardiac arrest, cardiogenic shock, severe arrhythmia with hemodynamic compromise', value: 3 },
        ],
      },
      {
        id: 'overall_severity',
        label: 'Overall PSS grade (worst organ system, including metabolic/renal/hepatic lab findings)',
        type: 'select',
        source: 'user_input',
        options: [
          {
            label: 'Grade 0 — None: No symptoms or signs related to poisoning',
            value: 0,
          },
          {
            label:
              'Grade 1 — Minor: Mild, transient, spontaneously resolving symptoms',
            value: 1,
          },
          {
            label:
              'Grade 2 — Moderate: Pronounced or prolonged symptoms; isolated organ dysfunction',
            value: 2,
          },
          {
            label:
              'Grade 3 — Severe: Life-threatening symptoms (coma, seizures, respiratory failure, shock)',
            value: 3,
          },
          {
            label: 'Grade 4 — Fatal: Death as a result of poisoning or direct complications',
            value: 4,
          },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'None',
          interpretation:
            'Grade 0: No symptoms; observation period then safe for discharge if no delayed-onset toxicology concern',
        },
        {
          min: 1,
          max: 1,
          risk: 'Minor',
          interpretation:
            'Grade 1: Minor, self-limiting symptoms; brief observation, supportive care; usually safe for discharge',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'Grade 2: Moderate symptoms; requires inpatient management and monitoring; toxicology consult recommended',
        },
        {
          min: 3,
          max: 3,
          risk: 'Severe',
          interpretation:
            'Grade 3: Severe, life-threatening symptoms; ICU admission required; aggressive management',
        },
        {
          min: 4,
          max: 4,
          risk: 'Fatal',
          interpretation: 'Grade 4: Fatal outcome',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'icu_admission',
        'toxicology_consult',
        'antidote_if_available',
        'supportive_care_aggressive',
      ],
      Moderate: ['inpatient_admission', 'toxicology_consult', 'monitoring', 'supportive_care'],
      Minor: ['observation_4_6h', 'supportive_care', 'poison_control_consultation'],
      None: ['observation_period', 'discharge_if_no_delayed_toxicity_concern'],
      Fatal: ['death_pronouncement', 'medical_examiner_notification', 'family_notification'],
    },
  },

  // ===========================================================================
  // PEDIATRIC — TEN-4-FACESp Rule
  // Threshold: ANY suspicious bruise location in child <4 years = high concern
  // TEN = Torso, Ear, Neck; 4 = <4 years; FACES = Frenulum, Angle of jaw,
  // Cheek, Eyelid, Subconjunctival; p = patterned bruising
  // ===========================================================================
  {
    id: 'ten_4_faces_p',
    name: 'TEN-4-FACESp',
    fullName: 'TEN-4-FACESp Rule',
    category: 'PEDIATRIC',
    application:
      'Identifies bruising patterns in young children (<4 years) suspicious for child abuse/non-accidental trauma. Any bruising in listed locations warrants evaluation.',
    applicableChiefComplaints: [
      'bruising',
      'child_abuse',
      'non_accidental_trauma',
      'injury',
      'infant_injury',
    ],
    keywords: [
      'TEN-4-FACESp',
      'child abuse',
      'non-accidental trauma',
      'bruising',
      'pediatric',
      'NAT',
      'infant',
      'physical abuse',
      'patterned bruising',
    ],
    components: [
      // TEN locations
      {
        id: 'torso_bruising',
        label: 'T — Bruising on Torso (chest, abdomen, back, buttocks, genitalia)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'ear_bruising',
        label: 'E — Bruising on Ear (pinna or behind ear)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'neck_bruising',
        label: 'N — Bruising on Neck',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // 4 = Age <4 years component
      {
        id: 'age_under_4_any_bruise',
        label: '4 — Any bruising in child <4 months old',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // FACES locations
      {
        id: 'frenulum_bruising',
        label: 'F — Bruising of Frenulum (labial or lingual)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'angle_of_jaw_bruising',
        label: 'A — Bruising at Angle of jaw',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cheek_bruising',
        label: 'C — Bruising on Cheek (in non-mobile infant/toddler)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'eyelid_bruising',
        label: 'E — Bruising on Eyelid (not associated with forehead impact)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'subconjunctival_hemorrhage',
        label: 'S — Subconjunctival hemorrhage (in infant/toddler without clear mechanism)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      // p = patterned bruising
      {
        id: 'patterned_bruising',
        label: 'p — Patterned bruising (loop marks, belt marks, bite marks, hand prints, or other implement patterns)',
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
            'No bruising in suspicious locations; standard clinical judgment applies. Note: rule designed for children <4 years; any bruise in a pre-mobile infant (<4 months) is always concerning.',
        },
        {
          min: 1,
          max: 10,
          risk: 'High',
          interpretation:
            'Bruising in ANY TEN-4-FACESp location → High suspicion for non-accidental trauma (sensitivity 97%, specificity 84%). Initiate child protective evaluation, full skeletal survey (age <2 years), consider head CT, ophthalmologic exam, and report to child protective services.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'child_protective_services_report',
        'skeletal_survey',
        'head_ct_if_indicated',
        'ophthalmologic_exam',
        'social_work_consult',
        'admit_for_safety',
      ],
      Low: ['routine_evaluation', 'document_bruise_location_and_mechanism'],
    },
  },
]
