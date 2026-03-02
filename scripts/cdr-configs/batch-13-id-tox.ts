import type { CdrSeed } from './types'

/**
 * Batch 13 — Infectious Disease, Toxicology & First Pediatric CDRs
 *
 * CDRs: feverpain, kocher_criteria, bacterial_meningitis_score,
 *       kings_college_criteria, done_nomogram, pawss, naranjo_adr,
 *       qtc_calculation, poisoning_severity_score, ten_4_faces_p
 *
 * Sources:
 *  - FeverPAIN: Little et al., BMJ 2013
 *  - Kocher Criteria: Kocher et al., J Bone Joint Surg Am 1999; Caird et al., JBJS 2006
 *  - Bacterial Meningitis Score: Nigrovic et al., JAMA 2007
 *  - King's College Criteria: O'Grady et al., Gastroenterology 1989
 *  - Done Nomogram: Done, Pediatrics 1960 (historical; largely abandoned)
 *  - PAWSS: Maldonado et al., Alcohol 2014
 *  - Naranjo ADR Scale: Naranjo et al., Clin Pharmacol Ther 1981
 *  - QTc Calculation: Bazett, Heart 1920; Fridericia, Acta Med Scand 1920
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
  // INFECTIOUS DISEASE — Kocher Criteria
  // 4 binary criteria (threshold scoring); probability brackets by count
  // ===========================================================================
  {
    id: 'kocher_criteria',
    name: 'Kocher Criteria',
    fullName: 'Kocher Criteria',
    category: 'INFECTIOUS DISEASE',
    application:
      'Predicts septic arthritis of the hip in children (typically age 3 months to 18 years) presenting with hip pain and/or refusal to bear weight.',
    applicableChiefComplaints: [
      'hip_pain',
      'limp',
      'joint_pain',
      'fever',
      'refusal_to_bear_weight',
    ],
    keywords: [
      'Kocher',
      'septic arthritis',
      'hip',
      'pediatric',
      'Caird',
      'ESR',
      'CRP',
      'non-weight-bearing',
    ],
    requiredTests: ['ESR', 'WBC', 'CRP'],
    components: [
      {
        id: 'non_weight_bearing',
        label: 'Non-weight-bearing on affected side',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'esr_gt_40',
        label: 'ESR >40 mm/hr',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'fever_gt_38_5',
        label: 'Fever >38.5°C (101.3°F)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'wbc_gt_12k',
        label: 'WBC >12,000 cells/µL',
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
          risk: 'Very Low',
          interpretation:
            '0 predictors: ~0.2% probability; observation appropriate',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation:
            '1 predictor: ~3% probability; consider observation vs. aspiration based on clinical picture',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            '2 predictors: ~40% probability; joint aspiration recommended',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            '3 predictors: ~93.1% probability; aspiration +/- operative intervention',
        },
        {
          min: 4,
          max: 4,
          risk: 'Very High',
          interpretation:
            '4 predictors: ~99.6% probability; operative drainage strongly recommended',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': ['orthopedic_consult_emergent', 'iv_antibiotics', 'operative_drainage'],
      High: ['orthopedic_consult_urgent', 'joint_aspiration', 'iv_antibiotics'],
      Moderate: ['joint_aspiration', 'orthopedic_consult', 'iv_antibiotics'],
      Low: ['observation', 'consider_aspiration'],
      'Very Low': ['observation', 'outpatient_follow_up'],
    },
  },

  // ===========================================================================
  // INFECTIOUS DISEASE — Bacterial Meningitis Score
  // 5 binary criteria (threshold: ANY positive = high risk)
  // ===========================================================================
  {
    id: 'bacterial_meningitis_score',
    name: 'Bacterial Meningitis Score',
    fullName: 'Bacterial Meningitis Score',
    category: 'INFECTIOUS DISEASE',
    application:
      'Differentiates bacterial from aseptic (viral) meningitis in children (≥2 months old) with CSF pleocytosis (CSF WBC ≥10/µL). NPV 99.7–100% when all criteria negative.',
    applicableChiefComplaints: [
      'headache',
      'meningitis',
      'fever',
      'altered_mental_status',
      'stiff_neck',
      'seizure',
    ],
    keywords: [
      'bacterial meningitis score',
      'meningitis',
      'CSF',
      'pleocytosis',
      'bacterial vs viral',
      'pediatric',
      'gram stain',
      'aseptic meningitis',
    ],
    requiredTests: ['CSF gram stain', 'CSF ANC', 'CSF protein', 'peripheral ANC'],
    components: [
      {
        id: 'csf_gram_stain_positive',
        label: 'CSF Gram stain positive',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_anc_gte_1000',
        label: 'CSF ANC ≥1,000 cells/µL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'csf_protein_gte_80',
        label: 'CSF protein ≥80 mg/dL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'peripheral_anc_gte_10000',
        label: 'Peripheral blood ANC ≥10,000 cells/µL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'seizure_at_presentation',
        label: 'Seizure at or before presentation',
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
            'ALL 5 criteria NEGATIVE → Very low risk of bacterial meningitis (NPV 99.7–100%); aseptic meningitis likely; may consider outpatient management',
        },
        {
          min: 1,
          max: 5,
          risk: 'High',
          interpretation:
            'ANY criterion POSITIVE → Cannot classify as low risk; treat empirically for bacterial meningitis',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'empiric_antibiotics_meningitis_dose',
        'dexamethasone_adjunctive',
        'admit_icu',
        'infectious_disease_consult',
      ],
      Low: ['observation', 'consider_outpatient_management', 'close_follow_up'],
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
  // TOXICOLOGY — Done Nomogram
  // Algorithm: serum salicylate level + time since ingestion → severity prediction
  // Historical tool — largely abandoned but still referenced
  // ===========================================================================
  {
    id: 'done_nomogram',
    name: 'Done Nomogram',
    fullName: 'Done Nomogram',
    category: 'TOXICOLOGY',
    application:
      'Historically used to predict salicylate toxicity severity based on serum salicylate level and time since ingestion. Now considered unreliable and NOT recommended for clinical decision-making.',
    applicableChiefComplaints: [
      'salicylate_overdose',
      'aspirin_overdose',
      'toxic_ingestion',
      'tinnitus',
      'tachypnea',
    ],
    keywords: [
      'Done nomogram',
      'salicylate',
      'aspirin',
      'overdose',
      'toxicity',
      'hemodialysis',
      'historical',
    ],
    requiredTests: ['serum salicylate level', 'arterial blood gas', 'pH'],
    components: [
      {
        id: 'hours_since_ingestion',
        label: 'Hours since ingestion',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<6 hours (level may not yet reflect peak)', value: 0 },
          { label: '6–12 hours', value: 1 },
          { label: '12–24 hours', value: 2 },
          { label: '>24 hours or unknown (nomogram unreliable)', value: 3 },
        ],
      },
      {
        id: 'serum_salicylate_level',
        label: 'Serum salicylate level (mg/dL)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<30 mg/dL (therapeutic range)', value: 0 },
          { label: '30–50 mg/dL (mild toxicity)', value: 1 },
          { label: '50–75 mg/dL (moderate toxicity)', value: 2 },
          { label: '75–100 mg/dL (severe toxicity)', value: 3 },
          { label: '>100 mg/dL (potentially lethal)', value: 4 },
        ],
      },
      {
        id: 'clinical_severity',
        label: 'Clinical severity findings',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Asymptomatic or tinnitus only', value: 0 },
          { label: 'Tachypnea, nausea, vomiting', value: 1 },
          { label: 'Altered mental status, hyperthermia, or severe acid-base disturbance', value: 2 },
          { label: 'Seizures, coma, cardiovascular collapse, or pulmonary edema', value: 3 },
        ],
      },
      {
        id: 'acidemia_present',
        label: 'Acidemia present (pH <7.35)',
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
          risk: 'Mild',
          interpretation:
            'Mild toxicity: Tinnitus, nausea, vomiting; GI decontamination if early, supportive care, serial salicylate levels q2h until trending down, urine alkalinization',
        },
        {
          min: 3,
          max: 5,
          risk: 'Moderate',
          interpretation:
            'Moderate toxicity: Tachypnea, diaphoresis, acid-base disturbance; aggressive IV fluids, urine alkalinization (target urine pH 7.5–8.0), serial levels, consider nephrology/toxicology consult',
        },
        {
          min: 6,
          max: 11,
          risk: 'Severe',
          interpretation:
            'Severe toxicity: AMS, seizures, pulmonary edema, renal failure, or level >100 mg/dL — emergent hemodialysis indicated; ICU admission. Note: Done Nomogram is unreliable; treat based on clinical status, not nomogram position',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'emergent_hemodialysis',
        'icu_admission',
        'toxicology_consult',
        'intubation_caution_maintain_hyperventilation',
      ],
      Moderate: [
        'iv_fluids_aggressive',
        'urine_alkalinization',
        'serial_salicylate_levels',
        'toxicology_consult',
      ],
      Mild: [
        'gi_decontamination_if_early',
        'serial_salicylate_levels_q2h',
        'urine_alkalinization',
        'supportive_care',
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
  },

  // ===========================================================================
  // TOXICOLOGY — QTc Calculation / Bazett's Formula
  // Algorithm: QT interval and RR interval → calculated QTc → risk thresholds
  // ===========================================================================
  {
    id: 'qtc_calculation',
    name: 'QTc Calculation',
    fullName: 'QTc Calculation (Bazett and Fridericia)',
    category: 'TOXICOLOGY',
    application:
      'Corrects QT interval for heart rate. Prolonged QTc increases risk of torsades de pointes. QTc >500 ms carries significant risk for TdP.',
    applicableChiefComplaints: [
      'palpitations',
      'syncope',
      'overdose',
      'arrhythmia',
      'QT_prolongation',
      'torsades_de_pointes',
    ],
    keywords: [
      'QTc',
      'QT prolongation',
      'Bazett',
      'Fridericia',
      'torsades de pointes',
      'TdP',
      'arrhythmia',
      'corrected QT',
      'ECG',
    ],
    requiredTests: ['ECG', 'QT interval measurement', 'heart rate'],
    components: [
      {
        id: 'qt_interval',
        label: 'Measured QT interval (ms)',
        type: 'number_range',
        min: 200,
        max: 700,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'heart_rate',
        label: 'Heart rate (bpm)',
        type: 'number_range',
        min: 30,
        max: 250,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'patient_sex',
        label: 'Patient sex (QTc thresholds differ)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Male (prolonged >450 ms)', value: 0 },
          { label: 'Female (prolonged >470 ms)', value: 1 },
        ],
      },
      {
        id: 'qt_prolonging_meds',
        label: 'Currently on QT-prolonging medication(s)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'electrolyte_abnormality',
        label: 'Electrolyte abnormality (hypokalemia, hypomagnesemia, hypocalcemia)',
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
          min: 200,
          max: 449,
          risk: 'Normal',
          interpretation:
            'Normal QTc (Male <450 ms, Female <470 ms); no immediate TdP risk. Continue monitoring if on QT-prolonging medications.',
        },
        {
          min: 450,
          max: 499,
          risk: 'Borderline',
          interpretation:
            'Borderline-prolonged QTc; review and discontinue QT-prolonging medications if possible; correct electrolytes (K⁺ >4.0, Mg²⁺ >2.0); serial ECGs',
        },
        {
          min: 500,
          max: 700,
          risk: 'High',
          interpretation:
            'QTc ≥500 ms: Significant risk for torsades de pointes; discontinue ALL QT-prolonging drugs; correct electrolytes aggressively (IV Mg²⁺, K⁺, Ca²⁺); continuous telemetry; consider isoproterenol or temporary pacing if TdP occurs. Increase >60 ms from baseline also concerning.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'discontinue_qt_prolonging_drugs',
        'iv_magnesium_2g',
        'correct_potassium_gt_4',
        'continuous_telemetry',
        'cardiology_consult',
        'isoproterenol_or_pacing_if_tdp',
      ],
      Borderline: [
        'review_qt_prolonging_medications',
        'correct_electrolytes',
        'serial_ecg',
        'telemetry_monitoring',
      ],
      Normal: ['continue_monitoring_if_on_qt_prolonging_meds'],
    },
  },

  // ===========================================================================
  // TOXICOLOGY — Poisoning Severity Score (PSS)
  // Single select: 0–4 grade based on worst-affected organ system (IPCS/EAPCCT)
  // ===========================================================================
  {
    id: 'poisoning_severity_score',
    name: 'Poisoning Severity Score',
    fullName: 'Poisoning Severity Score (PSS)',
    category: 'TOXICOLOGY',
    application:
      'Standardized grading of acute poisoning severity. Used for clinical communication and outcome tracking. Score the worst-affected organ system to determine overall grade.',
    applicableChiefComplaints: ['overdose', 'toxic_ingestion', 'poisoning', 'ingestion'],
    keywords: [
      'PSS',
      'poisoning severity score',
      'toxicology',
      'grading',
      'overdose',
      'severity',
    ],
    components: [
      {
        id: 'overall_severity',
        label: 'Overall poisoning severity grade (worst organ system)',
        type: 'select',
        source: 'user_input',
        options: [
          {
            label: 'Grade 0 — None: No symptoms or signs related to poisoning',
            value: 0,
          },
          {
            label:
              'Grade 1 — Minor: Mild, transient, spontaneously resolving symptoms (e.g., GI irritation, drowsiness, transient skin irritation)',
            value: 1,
          },
          {
            label:
              'Grade 2 — Moderate: Pronounced or prolonged symptoms (e.g., marked drowsiness, prolonged GI symptoms, isolated organ dysfunction, localized skin lesions)',
            value: 2,
          },
          {
            label:
              'Grade 3 — Severe: Life-threatening symptoms (e.g., coma, seizures, respiratory failure, significant cardiac arrhythmias, circulatory shock, severe acid-base disturbance)',
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
      method: 'sum',
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
