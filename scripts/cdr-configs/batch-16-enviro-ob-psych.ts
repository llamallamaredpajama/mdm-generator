import type { CdrSeed } from './types'

/**
 * Batch 16 — Environmental + OB/GYN + Psychiatry CDRs
 *
 * Covers: Swiss Staging System (Hypothermia), Bouchama Criteria (Heat Stroke),
 *         HELLP Mississippi Classification, Kleihauer-Betke / RhIG Dosing,
 *         PHQ-2, GAD-7, AUDIT, RASS, DAST-10, SAD PERSONS
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - Swiss Staging: Durrer et al., Resuscitation 2003; Brown et al., NEJM 2012
 *  - Bouchama Criteria: Bouchama & Knochel, NEJM 2002
 *  - HELLP Mississippi: Martin et al., Am J Obstet Gynecol 1999
 *  - Kleihauer-Betke / RhIG: ACOG Practice Bulletin No. 181, 2017; Sebring & Polesky, Transfusion 1990
 *  - PHQ-2: Kroenke et al., Med Care 2003; Lowe et al., J Affect Disord 2005
 *  - GAD-7: Spitzer et al., Arch Intern Med 2006
 *  - AUDIT: Saunders et al., Addiction 1993; WHO 2001
 *  - RASS: Sessler et al., Am J Respir Crit Care Med 2002
 *  - DAST-10: Skinner, Addict Behav 1982; Yudko et al., Subst Abuse 2007
 *  - SAD PERSONS: Patterson et al., Psychosomatics 1983; Hockberger & Rothstein, Ann Emerg Med 1988
 */

export const batch16EnviroObPsychCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Swiss Staging System for Hypothermia
  // Clinical staging I–V based on signs/symptoms; guides rewarming strategy
  // ---------------------------------------------------------------------------
  {
    id: 'swiss_staging_hypothermia',
    name: 'Swiss Staging System',
    fullName: 'Swiss Staging System (Hypothermia)',
    category: 'ENVIRONMENTAL',
    application:
      'Classifies hypothermia severity based on clinical signs, applicable in the field when core temperature measurement may not be available.',
    applicableChiefComplaints: [
      'hypothermia',
      'cold_exposure',
      'altered_mental_status',
      'cold_water_immersion',
      'frostbite',
    ],
    keywords: [
      'Swiss staging',
      'hypothermia',
      'HT I',
      'HT II',
      'HT III',
      'HT IV',
      'ECMO',
      'rewarming',
      'cardiac arrest',
    ],
    components: [
      {
        id: 'stage',
        label: 'Hypothermia Stage',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'HT I — Conscious, shivering (est. 32–35°C)',
            value: 1,
          },
          {
            label: 'HT II — Impaired consciousness, not shivering (est. 28–32°C)',
            value: 2,
          },
          {
            label: 'HT III — Unconscious, vital signs present (est. 24–28°C)',
            value: 3,
          },
          {
            label: 'HT IV — No vital signs / apparent death (est. <24°C)',
            value: 4,
          },
          {
            label: 'HT V — Death from irreversible hypothermia (est. <13.7°C)',
            value: 5,
          },
        ],
      },
      {
        id: 'shivering',
        label: 'Shivering present (key discriminator: present in HT I, absent in HT II+)',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'consciousness_level',
        label: 'Level of consciousness',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Conscious and alert (HT I)', value: 0 },
          { label: 'Impaired consciousness — confused, lethargic (HT II)', value: 0 },
          { label: 'Unconscious — responsive to stimuli (HT III)', value: 0 },
          { label: 'Unconscious — unresponsive (HT IV–V)', value: 0 },
        ],
      },
      {
        id: 'vital_signs_present',
        label: 'Vital signs (pulse and respirations) detectable',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 1,
          risk: 'Mild',
          interpretation:
            'HT I (32–35°C): Mild; shivering, conscious; passive external rewarming (remove wet clothes, blankets)',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'HT II (28–32°C): Moderate; impaired consciousness; active external rewarming; minimize movement (dysrhythmia risk)',
        },
        {
          min: 3,
          max: 3,
          risk: 'Severe',
          interpretation:
            'HT III (24–28°C): Severe; unconscious with vital signs; active internal rewarming; limit to 3 defibrillation attempts if VF',
        },
        {
          min: 4,
          max: 4,
          risk: 'Critical',
          interpretation:
            'HT IV (<24°C): Profound; no vital signs; ECMO/cardiopulmonary bypass if available; "Not dead until warm and dead"',
        },
        {
          min: 5,
          max: 5,
          risk: 'Fatal',
          interpretation: 'HT V (<13.7°C): Death from irreversible hypothermia',
        },
      ],
    },
    suggestedTreatments: {
      Mild: ['remove_wet_clothing', 'warm_blankets', 'warm_fluids_po', 'monitor_temperature'],
      Moderate: [
        'active_external_rewarming',
        'minimize_movement',
        'warm_iv_fluids',
        'cardiac_monitoring',
      ],
      Severe: [
        'active_internal_rewarming',
        'warm_iv_fluids',
        'warm_humidified_oxygen',
        'cardiac_monitoring',
        'icu_admission',
      ],
      Critical: [
        'ecmo_consult',
        'cardiopulmonary_bypass',
        'cpr',
        'warm_iv_fluids',
        'icu_admission',
      ],
      Fatal: [
        'death_pronouncement',
        'medical_examiner_notification',
        'family_notification',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Bouchama Criteria for Heat Stroke
  // Threshold: 3 required criteria — core temp >40°C, CNS dysfunction, exposure
  // ---------------------------------------------------------------------------
  {
    id: 'bouchama_heat_stroke',
    name: 'Bouchama Criteria',
    fullName: 'Bouchama Criteria (Heat Stroke)',
    category: 'ENVIRONMENTAL',
    application:
      'Diagnostic criteria for classic and exertional heat stroke. Requires core temperature >40°C plus CNS dysfunction — medical emergency requiring aggressive cooling.',
    applicableChiefComplaints: [
      'heat_stroke',
      'hyperthermia',
      'altered_mental_status',
      'heat_exposure',
      'exertional_heat_illness',
    ],
    keywords: [
      'Bouchama',
      'heat stroke',
      'hyperthermia',
      'heat exhaustion',
      'cooling',
      'exertional',
      'CNS dysfunction',
      'cold water immersion',
    ],
    components: [
      {
        id: 'core_temp',
        label: 'Core temperature >40°C (104°F)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cns_dysfunction',
        label: 'CNS dysfunction (altered mental status, seizures, delirium, coma)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'exposure_history',
        label: 'Environmental heat exposure or strenuous exercise',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'heat_stroke_type',
        label: 'Heat stroke type',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Classic (passive environmental exposure — elderly, comorbid)', value: 0 },
          { label: 'Exertional (strenuous physical activity — athletes, military, laborers)', value: 0 },
        ],
      },
      {
        id: 'anhidrosis',
        label: 'Anhidrosis (hot, dry skin — classic subtype)',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Heat Exhaustion',
          interpretation:
            'Does not meet heat stroke criteria; temperature typically <40°C with normal mental status = heat exhaustion; treat with cooling and rehydration',
        },
        {
          min: 3,
          max: 3,
          risk: 'Heat Stroke',
          interpretation:
            'ALL 3 criteria met (temp >40°C, CNS dysfunction, heat exposure): Heat stroke — medical emergency; aggressive cooling targeting <39°C within 30 minutes; cold water immersion gold standard for exertional heat stroke',
        },
      ],
    },
    suggestedTreatments: {
      'Heat Stroke': [
        'cold_water_immersion',
        'aggressive_iv_hydration',
        'continuous_temperature_monitoring',
        'icu_admission',
        'electrolyte_monitoring',
        'cbc_cmp_coags_ck_ua',
      ],
      'Heat Exhaustion': [
        'remove_from_heat',
        'oral_rehydration',
        'cooling_measures',
        'monitor_temperature',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // HELLP Mississippi: QUARANTINED → scripts/cdr-configs/_quarantine/hellp_mississippi.ts
  // Reason: Pure lab-based classification (0 user-answerable components)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Kleihauer-Betke: QUARANTINED → scripts/cdr-configs/_quarantine/kleihauer_betke.ts
  // Reason: Pure lab calculation / dosing tool (1 user-answerable component)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // PHQ-2 Depression Screen
  // Sum: 2 questions, each 0–3; ≥3 is positive screen → triggers full PHQ-9
  // ---------------------------------------------------------------------------
  {
    id: 'phq2',
    name: 'PHQ-2',
    fullName: 'PHQ-2 (Patient Health Questionnaire-2)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Ultra-brief depression screening using the first 2 items of the PHQ-9. Used as initial screen; a positive result triggers administration of the full PHQ-9.',
    applicableChiefComplaints: ['depression', 'mood_disorder', 'psychiatric_evaluation'],
    keywords: [
      'PHQ-2',
      'PHQ2',
      'depression screening',
      'ultra-brief',
      'Patient Health Questionnaire',
      'anhedonia',
    ],
    components: [
      {
        id: 'little_interest',
        label: 'Little interest or pleasure in doing things (over past 2 weeks)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'feeling_down',
        label: 'Feeling down, depressed, or hopeless (over past 2 weeks)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'prior_depression_or_treatment',
        label: 'Known prior depression diagnosis or currently on psychiatric medication',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Negative Screen',
          interpretation:
            'Negative screen (sensitivity 83%, specificity 92% for major depression)',
        },
        {
          min: 3,
          max: 6,
          risk: 'Positive Screen',
          interpretation:
            'Positive screen; administer full PHQ-9 to assess depression severity and guide treatment',
        },
      ],
    },
    suggestedTreatments: {
      'Positive Screen': ['administer_phq9', 'safety_assessment', 'behavioral_health_referral'],
      'Negative Screen': ['routine_follow_up', 'rescreen_if_clinical_concern'],
    },
  },

  // ---------------------------------------------------------------------------
  // GAD-7 Anxiety
  // Sum: 7 questions, each 0–3; max 21
  // ---------------------------------------------------------------------------
  {
    id: 'gad7',
    name: 'GAD-7',
    fullName: 'GAD-7 (Generalized Anxiety Disorder-7)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Screens for and measures severity of generalized anxiety disorder. Also sensitive for panic disorder, social anxiety, and PTSD.',
    applicableChiefComplaints: ['anxiety', 'panic_attack', 'psychiatric_evaluation', 'ptsd'],
    keywords: [
      'GAD-7',
      'GAD7',
      'anxiety screening',
      'generalized anxiety disorder',
      'panic',
      'PTSD',
      'worry',
    ],
    components: [
      {
        id: 'feeling_nervous',
        label: 'Feeling nervous, anxious, or on edge',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'uncontrollable_worry',
        label: 'Not being able to stop or control worrying',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'worrying_too_much',
        label: 'Worrying too much about different things',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'trouble_relaxing',
        label: 'Trouble relaxing',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'restlessness',
        label: 'Being so restless that it is hard to sit still',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'easily_annoyed',
        label: 'Becoming easily annoyed or irritable',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'feeling_afraid',
        label: 'Feeling afraid, as if something awful might happen',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Minimal', interpretation: 'Minimal anxiety' },
        { min: 5, max: 9, risk: 'Mild', interpretation: 'Mild anxiety' },
        {
          min: 10,
          max: 14,
          risk: 'Moderate',
          interpretation: 'Moderate anxiety; consider treatment',
        },
        {
          min: 15,
          max: 21,
          risk: 'Severe',
          interpretation: 'Severe anxiety; active treatment recommended',
        },
      ],
    },
    suggestedTreatments: {
      Severe: ['psychiatry_referral', 'anxiolytic_consideration', 'safety_assessment', 'cbt_referral'],
      Moderate: ['behavioral_health_referral', 'cbt_referral', 'consider_pharmacotherapy'],
      Mild: ['psychoeducation', 'outpatient_follow_up'],
      Minimal: ['reassurance', 'routine_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // AUDIT Alcohol Use Disorders Identification Test
  // Sum: 10 questions; consumption (Q1-3), dependence (Q4-6), harm (Q7-10); max 40
  // ---------------------------------------------------------------------------
  {
    id: 'audit',
    name: 'AUDIT',
    fullName: 'AUDIT (Alcohol Use Disorders Identification Test)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'WHO-developed comprehensive screening for hazardous drinking, harmful drinking, and alcohol dependence using 10 items scored 0–4 each.',
    applicableChiefComplaints: [
      'alcohol_use_disorder',
      'substance_abuse',
      'psychiatric_evaluation',
    ],
    keywords: [
      'AUDIT',
      'alcohol screening',
      'WHO',
      'hazardous drinking',
      'alcohol dependence',
      'AUDIT-C',
      'alcohol use disorders',
    ],
    components: [
      // --- Consumption domain (Q1–Q3) ---
      {
        id: 'drinking_frequency',
        label: 'Q1: How often do you have a drink containing alcohol?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Monthly or less', value: 1 },
          { label: '2–4 times a month', value: 2 },
          { label: '2–3 times a week', value: 3 },
          { label: '4+ times a week', value: 4 },
        ],
      },
      {
        id: 'drinks_per_occasion',
        label: 'Q2: How many drinks containing alcohol on a typical day when drinking?',
        type: 'select',
        source: 'section1',
        options: [
          { label: '1 or 2', value: 0 },
          { label: '3 or 4', value: 1 },
          { label: '5 or 6', value: 2 },
          { label: '7 to 9', value: 3 },
          { label: '10 or more', value: 4 },
        ],
      },
      {
        id: 'binge_frequency',
        label: 'Q3: How often do you have 6+ drinks on one occasion?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      // --- Dependence domain (Q4–Q6) ---
      {
        id: 'impaired_control',
        label: 'Q4: How often in the past year have you been unable to stop drinking once started?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      {
        id: 'failed_expectations',
        label: 'Q5: How often in the past year have you failed to do what was expected because of drinking?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      {
        id: 'morning_drinking',
        label: 'Q6: How often in the past year have you needed a drink in the morning to get going?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      // --- Harm domain (Q7–Q10) ---
      {
        id: 'guilt_after_drinking',
        label: 'Q7: How often in the past year have you had guilt or remorse after drinking?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      {
        id: 'blackouts',
        label: 'Q8: How often in the past year have you been unable to remember the night before because of drinking?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Never', value: 0 },
          { label: 'Less than monthly', value: 1 },
          { label: 'Monthly', value: 2 },
          { label: 'Weekly', value: 3 },
          { label: 'Daily or almost daily', value: 4 },
        ],
      },
      {
        id: 'alcohol_related_injury',
        label: 'Q9: Have you or someone else been injured because of your drinking?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes, but not in the past year', value: 2 },
          { label: 'Yes, during the past year', value: 4 },
        ],
      },
      {
        id: 'others_concerned',
        label: 'Q10: Has a relative, friend, or health worker been concerned about your drinking or suggested cutting down?',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No', value: 0 },
          { label: 'Yes, but not in the past year', value: 2 },
          { label: 'Yes, during the past year', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 7, risk: 'Low Risk', interpretation: 'Low risk drinking' },
        {
          min: 8,
          max: 15,
          risk: 'Hazardous',
          interpretation: 'Hazardous drinking; brief intervention recommended',
        },
        {
          min: 16,
          max: 19,
          risk: 'Harmful',
          interpretation: 'Harmful drinking; brief intervention plus continued monitoring',
        },
        {
          min: 20,
          max: 40,
          risk: 'Probable Dependence',
          interpretation:
            'Probable alcohol dependence; referral for diagnostic evaluation and treatment',
        },
      ],
    },
    suggestedTreatments: {
      'Probable Dependence': [
        'addiction_medicine_referral',
        'assess_withdrawal_risk',
        'ciwa_protocol',
        'inpatient_treatment_referral',
      ],
      Harmful: ['brief_intervention', 'behavioral_health_referral', 'outpatient_follow_up'],
      Hazardous: ['brief_intervention', 'motivational_interviewing', 'outpatient_follow_up'],
      'Low Risk': ['positive_reinforcement', 'alcohol_education'],
    },
  },

  // ---------------------------------------------------------------------------
  // RASS — Richmond Agitation-Sedation Scale
  // Select: single -5 to +4 scale from unarousable to combative
  // ---------------------------------------------------------------------------
  {
    id: 'rass',
    name: 'RASS',
    fullName: 'RASS (Richmond Agitation-Sedation Scale)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Standardized assessment of agitation and sedation level in ICU and ED patients. Used to titrate sedation and assess for delirium; target RASS for most ICU patients is 0 to −2.',
    applicableChiefComplaints: [
      'agitation',
      'altered_mental_status',
      'sedation',
      'icu_management',
    ],
    keywords: [
      'RASS',
      'Richmond Agitation Sedation Scale',
      'sedation',
      'agitation',
      'ICU',
      'delirium',
      'sedation titration',
    ],
    components: [
      {
        id: 'sedation_agitation_level',
        label: 'Observed sedation/agitation level',
        type: 'select',
        source: 'section1',
        options: [
          { label: '+4 Combative — overtly combative, violent, immediate danger to staff', value: 4 },
          { label: '+3 Very agitated — pulls/removes tubes or catheters, aggressive', value: 3 },
          { label: '+2 Agitated — frequent non-purposeful movement, fights ventilator', value: 2 },
          { label: '+1 Restless — anxious, apprehensive but movements not aggressive', value: 1 },
          { label: '0 Alert and calm', value: 0 },
          { label: '−1 Drowsy — not fully alert, sustained awakening (≥10 sec) to voice', value: -1 },
          { label: '−2 Light sedation — briefly awakens to voice, eye contact <10 sec', value: -2 },
          { label: '−3 Moderate sedation — movement or eye opening to voice, no eye contact', value: -3 },
          { label: '−4 Deep sedation — no response to voice, movement to physical stimulation', value: -4 },
          { label: '−5 Unarousable — no response to voice or physical stimulation', value: -5 },
        ],
      },
      {
        id: 'receiving_sedation',
        label: 'Currently receiving continuous sedation (propofol, midazolam, dexmedetomidine, etc.)',
        type: 'boolean',
        value: 0,
        source: 'section1',
      },
      {
        id: 'mechanically_ventilated',
        label: 'Patient is mechanically ventilated (intubated)',
        type: 'boolean',
        value: 0,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: -5,
          max: -5,
          risk: 'Unarousable',
          interpretation: 'No response to voice or physical stimulation',
        },
        {
          min: -4,
          max: -4,
          risk: 'Deep Sedation',
          interpretation: 'No response to voice; movement to physical stimulation only',
        },
        {
          min: -3,
          max: -3,
          risk: 'Moderate Sedation',
          interpretation: 'Movement or eye opening to voice but no eye contact',
        },
        {
          min: -2,
          max: -1,
          risk: 'Light Sedation',
          interpretation:
            'Briefly awakens or has sustained awakening to voice; typical ICU target range',
        },
        {
          min: 0,
          max: 0,
          risk: 'Alert & Calm',
          interpretation: 'Alert and calm; target state',
        },
        {
          min: 1,
          max: 1,
          risk: 'Restless',
          interpretation: 'Anxious but movements not aggressive or vigorous',
        },
        {
          min: 2,
          max: 3,
          risk: 'Agitated',
          interpretation:
            'Frequent non-purposeful movement, fights ventilator, or pulls at tubes',
        },
        {
          min: 4,
          max: 4,
          risk: 'Combative',
          interpretation: 'Overtly combative, violent, immediate danger to staff',
        },
      ],
    },
    suggestedTreatments: {
      Combative: [
        'chemical_restraint',
        'physical_restraint',
        'stat_security',
        'im_haloperidol_or_midazolam',
      ],
      Agitated: ['verbal_de_escalation', 'anxiolytic', 'reassess_pain', 'adjust_sedation'],
      Restless: ['verbal_reassurance', 'reorientation', 'reassess_pain'],
      'Alert & Calm': ['maintain_current_management', 'continue_monitoring'],
      'Light Sedation': ['target_sedation_achieved', 'continue_monitoring', 'reassess_sedation_goal'],
      'Moderate Sedation': ['reassess_sedation_depth', 'consider_lightening_sedation', 'daily_sedation_vacation'],
      'Deep Sedation': ['lighten_sedation_if_safe', 'assess_for_oversedation', 'neurologic_assessment'],
      Unarousable: ['hold_sedation', 'neurologic_assessment', 'ct_head_if_unexplained', 'assess_for_metabolic_causes'],
    },
  },

  // ---------------------------------------------------------------------------
  // DAST-10 Drug Abuse Screening Test
  // Sum: 10 binary yes/no questions about drug use patterns; max 10
  // ---------------------------------------------------------------------------
  {
    id: 'dast10',
    name: 'DAST-10',
    fullName: 'DAST-10 (Drug Abuse Screening Test)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Screens for drug use problems (excluding alcohol and tobacco) using a 10-item self-report questionnaire referring to the past 12 months.',
    applicableChiefComplaints: ['substance_abuse', 'drug_use', 'psychiatric_evaluation'],
    keywords: [
      'DAST-10',
      'DAST10',
      'drug abuse screening',
      'substance use disorder',
      'drug screening',
    ],
    components: [
      {
        id: 'used_drugs_other_than_medical',
        label: '1. Have you used drugs other than those required for medical reasons?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'abuse_prescription',
        label: '2. Do you abuse more than one drug at a time?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'unable_to_stop',
        label: '3. Are you unable to stop using drugs when you want to?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'blackouts_flashbacks',
        label: '4. Have you ever had blackouts or flashbacks as a result of drug use?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'feel_bad_about_use',
        label: '5. Do you ever feel bad or guilty about your drug use?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'spouse_parent_complain',
        label: '6. Does your spouse (or parents) ever complain about your involvement with drugs?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'neglected_family',
        label: '7. Have you neglected your family because of your use of drugs?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'illegal_activities',
        label: '8. Have you engaged in illegal activities in order to obtain drugs?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'withdrawal_symptoms',
        label: '9. Have you ever experienced withdrawal symptoms when you stopped taking drugs?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'medical_problems',
        label: '10. Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'No Problem', interpretation: 'No drug problems reported' },
        { min: 1, max: 2, risk: 'Low', interpretation: 'Low level; monitor' },
        {
          min: 3,
          max: 5,
          risk: 'Moderate',
          interpretation: 'Moderate level; further investigation needed',
        },
        {
          min: 6,
          max: 8,
          risk: 'Substantial',
          interpretation: 'Substantial level; intensive assessment',
        },
        {
          min: 9,
          max: 10,
          risk: 'Severe',
          interpretation:
            'Severe level; intensive assessment and likely treatment needed',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'addiction_medicine_referral',
        'inpatient_treatment_referral',
        'behavioral_health_consult',
      ],
      Substantial: ['addiction_medicine_referral', 'intensive_outpatient_referral'],
      Moderate: ['brief_intervention', 'outpatient_substance_use_referral'],
      Low: ['monitor', 'brief_counseling', 'outpatient_follow_up'],
      'No Problem': ['positive_reinforcement', 'routine_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // SAD PERSONS Suicide Risk
  // Sum: 10 binary criteria (mnemonic); each worth 1 point; max 10
  // ---------------------------------------------------------------------------
  {
    id: 'sad_persons',
    name: 'SAD PERSONS',
    fullName: 'SAD PERSONS Scale',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Mnemonic-based suicide risk assessment tool for emergency settings using 10 dichotomous risk factor items.',
    applicableChiefComplaints: [
      'suicidal_ideation',
      'suicide_attempt',
      'psychiatric_emergency',
    ],
    keywords: [
      'SAD PERSONS',
      'suicide risk',
      'suicide assessment',
      'mnemonic',
      'psychiatric emergency',
    ],
    components: [
      {
        id: 'sex_male',
        label: 'S — Sex (male)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age',
        label: 'A — Age <19 or >45 years',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'depression',
        label: 'D — Depression (current major depressive episode or hopelessness)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'previous_attempt',
        label: 'P — Previous suicide attempt',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'ethanol_abuse',
        label: 'E — Ethanol (alcohol) abuse',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'rational_thinking_loss',
        label: 'R — Rational thinking loss (psychosis, organic brain syndrome)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'social_support_lacking',
        label: 'S — Social support deficit (isolated, no close contacts)',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'organized_plan',
        label: 'O — Organized plan (specific plan with means and timeline)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'no_spouse',
        label: 'N — No spouse (divorced, widowed, separated, single)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'sickness',
        label: 'S — Sickness (chronic or debilitating illness)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Low',
          interpretation: 'May be safe for discharge with outpatient follow-up',
        },
        {
          min: 3,
          max: 4,
          risk: 'Moderate',
          interpretation: 'Close follow-up; consider hospitalization',
        },
        {
          min: 5,
          max: 6,
          risk: 'High',
          interpretation: 'Strongly consider hospitalization',
        },
        {
          min: 7,
          max: 10,
          risk: 'Very High',
          interpretation: 'Hospitalize or commit',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'psychiatric_admission',
        '1_to_1_observation',
        'safety_assessment',
        'remove_means',
      ],
      High: [
        'psychiatric_consult',
        'consider_admission',
        'safety_plan',
        '1_to_1_observation',
      ],
      Moderate: [
        'psychiatric_consult',
        'safety_plan',
        'close_outpatient_follow_up',
        'crisis_hotline',
      ],
      Low: ['outpatient_follow_up', 'safety_plan', 'crisis_hotline'],
    },
  },
]
