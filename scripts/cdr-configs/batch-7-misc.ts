import type { CdrSeed } from './types'

export const batch7MiscCdrs: CdrSeed[] = [

  // ── C-SSRS (Columbia Suicide Severity Rating Scale) ──────────────────────
  {
    id: 'cssrs_screening',
    name: 'C-SSRS',
    fullName: 'Columbia Suicide Severity Rating Scale (C-SSRS) — Screening Version',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Standardized screening for suicidal ideation and behavior used in emergency departments, primary care, and crisis settings. Questions asked sequentially; stop when criteria met.',
    applicableChiefComplaints: [
      'suicidal_ideation',
      'suicide_attempt',
      'psychiatric_emergency',
      'depression',
      'self_harm',
    ],
    keywords: [
      'C-SSRS',
      'Columbia',
      'suicide',
      'suicidal ideation',
      'suicidal behavior',
      'risk assessment',
      'safety planning',
      'psychiatric screening',
    ],
    components: [
      {
        id: 'wish_to_be_dead',
        label: 'Q1 — Wish to be dead (passive ideation, no self-harm thought)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'suicidal_thoughts',
        label: 'Q2 — Non-specific active suicidal thoughts ("I want to kill myself," no method)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'ideation_with_method',
        label: 'Q3 — Active ideation with method, no plan or intent to act',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'ideation_with_intent',
        label: 'Q4 — Active ideation with some intent to act, no specific plan',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'ideation_with_plan',
        label: 'Q5 — Active ideation with specific plan and intent',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'suicidal_behavior',
        label: 'Q6 — Suicidal behavior (preparatory acts, aborted attempt, interrupted attempt, or actual attempt)',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Negative Screen',
          interpretation:
            'No ideation or behavior endorsed; document and reassess if clinical concern persists.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Passive Ideation',
          interpretation:
            'Q1 only — wish to be dead without active ideation; brief intervention, safety planning, and routine follow-up.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Low Active Ideation',
          interpretation:
            'Q2 only — non-specific suicidal thoughts; safety assessment, consider outpatient psychiatric referral.',
        },
        {
          min: 3,
          max: 5,
          risk: 'High Active Ideation',
          interpretation:
            'Q3–Q5 positive — active ideation with method and/or intent; psychiatric evaluation required, 1:1 monitoring, consider inpatient hospitalization.',
        },
        {
          min: 6,
          max: 6,
          risk: 'Suicidal Behavior',
          interpretation:
            'Q6 positive — preparatory behavior or actual attempt; immediate psychiatric evaluation, 1:1 observation, emergency hospitalization likely required.',
        },
      ],
    },
    suggestedTreatments: {
      'Suicidal Behavior': [
        'one_to_one_observation',
        'psychiatry_emergency_consult',
        'medical_clearance',
        'inpatient_psychiatric_admission',
        'safety_planning',
      ],
      'High Active Ideation': [
        'psychiatry_consult',
        'safety_planning',
        'means_restriction_counseling',
        'inpatient_psychiatric_admission',
      ],
      'Low Active Ideation': [
        'safety_planning',
        'outpatient_psychiatry_referral',
        'crisis_hotline_education',
      ],
      'Passive Ideation': [
        'safety_planning',
        'outpatient_follow_up',
        'crisis_hotline_education',
      ],
      'Negative Screen': [
        'document_negative_screen',
        'reassess_if_clinical_concern',
      ],
    },
  },

  // ── PHQ-9 (Patient Health Questionnaire-9) ───────────────────────────────
  {
    id: 'phq9',
    name: 'PHQ-9',
    fullName: 'PHQ-9 (Patient Health Questionnaire-9)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Screens for and measures severity of depression. Each of 9 items rates frequency of symptoms over the past 2 weeks on a 0–3 scale (Not at all / Several days / More than half the days / Nearly every day). Maximum score 27.',
    applicableChiefComplaints: [
      'depression',
      'mood_disorder',
      'psychiatric_evaluation',
      'suicidal_ideation',
      'anxiety',
    ],
    keywords: [
      'PHQ-9',
      'PHQ9',
      'depression screening',
      'Patient Health Questionnaire',
      'depression severity',
      'anhedonia',
      'mood',
    ],
    components: [
      {
        id: 'anhedonia',
        label: 'Little interest or pleasure in doing things',
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
        id: 'depressed_mood',
        label: 'Feeling down, depressed, or hopeless',
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
        id: 'sleep',
        label: 'Trouble falling or staying asleep, or sleeping too much',
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
        id: 'fatigue',
        label: 'Feeling tired or having little energy',
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
        id: 'appetite',
        label: 'Poor appetite or overeating',
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
        id: 'self_worth',
        label: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
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
        id: 'concentration',
        label: 'Trouble concentrating on things, such as reading the newspaper or watching television',
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
        id: 'psychomotor',
        label: 'Moving or speaking so slowly that other people could have noticed; or being fidgety or restless',
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
        id: 'suicidal_ideation',
        label: 'Thoughts that you would be better off dead, or of hurting yourself',
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
        {
          min: 0,
          max: 4,
          risk: 'Minimal',
          interpretation: 'Minimal or no depression; no treatment indicated unless symptoms are causing functional impairment.',
        },
        {
          min: 5,
          max: 9,
          risk: 'Mild',
          interpretation:
            'Mild depression; watchful waiting, repeat PHQ-9 at follow-up; consider counseling or psychotherapy.',
        },
        {
          min: 10,
          max: 14,
          risk: 'Moderate',
          interpretation:
            'Moderate depression; develop treatment plan, consider counseling and pharmacotherapy (e.g., SSRI).',
        },
        {
          min: 15,
          max: 19,
          risk: 'Moderately Severe',
          interpretation:
            'Moderately severe depression; active pharmacotherapy and/or psychotherapy; evaluate for safety and referral.',
        },
        {
          min: 20,
          max: 27,
          risk: 'Severe',
          interpretation:
            'Severe depression; immediate pharmacotherapy and psychotherapy; evaluate for suicidality; consider psychiatry referral or hospitalization.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'psychiatry_consult',
        'ssri_initiation',
        'suicide_risk_assessment',
        'safety_planning',
        'inpatient_psychiatric_admission',
      ],
      'Moderately Severe': [
        'ssri_initiation',
        'outpatient_psychiatry_referral',
        'safety_planning',
        'psychotherapy_referral',
      ],
      Moderate: ['ssri_initiation', 'psychotherapy_referral', 'outpatient_follow_up'],
      Mild: ['watchful_waiting', 'psychotherapy_referral', 'outpatient_follow_up'],
      Minimal: ['no_treatment_indicated', 'routine_follow_up'],
    },
  },

  // ── CAGE Questionnaire ────────────────────────────────────────────────────
  {
    id: 'cage',
    name: 'CAGE',
    fullName: 'CAGE Questionnaire',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Screens for alcohol use disorder using a simple 4-question mnemonic. Two or more positive responses have sensitivity 71–93% and specificity 68–89% for alcohol dependence. Best used as part of a comprehensive substance use evaluation.',
    applicableChiefComplaints: [
      'alcohol_use_disorder',
      'substance_abuse',
      'psychiatric_evaluation',
      'alcohol_withdrawal',
    ],
    keywords: [
      'CAGE',
      'alcohol screening',
      'alcohol use disorder',
      'alcohol dependence',
      'cut down',
      'annoyed',
      'guilty',
      'eye-opener',
    ],
    components: [
      {
        id: 'cut_down',
        label: 'C — Have you ever felt you should Cut down on your drinking?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'annoyed',
        label: 'A — Have people Annoyed you by criticizing your drinking?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'guilty',
        label: 'G — Have you ever felt Guilty about your drinking?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'eye_opener',
        label: 'E — Have you ever had a drink first thing in the morning (Eye-opener) to steady your nerves or get rid of a hangover?',
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
          max: 0,
          risk: 'Low',
          interpretation: 'Low suspicion for alcohol use disorder; routine counseling.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low-Moderate',
          interpretation:
            'Low-moderate suspicion; explore drinking history further, consider brief motivational intervention.',
        },
        {
          min: 2,
          max: 3,
          risk: 'High',
          interpretation:
            '≥2 is clinically significant (sensitivity 93%, specificity 76%); high suspicion for alcohol use disorder. Proceed with full assessment; offer brief intervention and referral to treatment.',
        },
        {
          min: 4,
          max: 4,
          risk: 'Very High',
          interpretation:
            'Score 4 is nearly diagnostic of alcohol dependence; refer to addiction specialist; assess for withdrawal risk (CIWA-Ar).',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'ciwa_ar_assessment',
        'addiction_medicine_consult',
        'thiamine_100mg_iv',
        'benzodiazepine_withdrawal_protocol',
        'referral_to_treatment',
      ],
      High: [
        'ciwa_ar_assessment',
        'brief_motivational_intervention',
        'referral_to_treatment',
        'thiamine_100mg_iv',
      ],
      'Low-Moderate': ['brief_motivational_intervention', 'outpatient_follow_up'],
      Low: ['routine_counseling', 'no_further_screening_needed'],
    },
  },

  // ── COWS (Clinical Opiate Withdrawal Scale) ───────────────────────────────
  {
    id: 'cows',
    name: 'COWS',
    fullName: 'COWS (Clinical Opiate Withdrawal Scale)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application:
      'Measures severity of opioid withdrawal to guide medication-assisted treatment (buprenorphine, methadone) initiation. Buprenorphine initiation typically requires COWS ≥8 to minimize precipitated withdrawal risk. Maximum score 48.',
    applicableChiefComplaints: [
      'opioid_withdrawal',
      'substance_abuse',
      'drug_withdrawal',
    ],
    keywords: [
      'COWS',
      'opioid withdrawal',
      'Clinical Opiate Withdrawal Scale',
      'buprenorphine',
      'methadone',
      'MAT',
      'MOUD',
      'suboxone',
    ],
    components: [
      {
        id: 'resting_pulse',
        label: 'Resting Pulse Rate (measured after sitting for 1 minute)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '≤80 bpm', value: 0 },
          { label: '81–100 bpm', value: 1 },
          { label: '101–120 bpm', value: 2 },
          { label: '>120 bpm', value: 4 },
        ],
      },
      {
        id: 'sweating',
        label: 'Sweating (not accounted for by room temperature or patient activity)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No report of chills or flushing', value: 0 },
          { label: 'Subjective report of chills or flushing', value: 1 },
          { label: 'Flushed or observable moistness on face', value: 2 },
          { label: 'Beads of sweat on brow or face', value: 3 },
          { label: 'Drenching sweats', value: 4 },
        ],
      },
      {
        id: 'restlessness',
        label: 'Restlessness (observation during assessment)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Able to sit still', value: 0 },
          { label: 'Reports difficulty sitting still, but able to do so', value: 1 },
          { label: 'Frequent shifting or extraneous movements of legs/arms', value: 3 },
          { label: 'Unable to sit still for more than a few seconds', value: 5 },
        ],
      },
      {
        id: 'pupil_size',
        label: 'Pupil Size',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Pupils pinned or normal size for room light', value: 0 },
          { label: 'Pupils possibly larger than normal for room light', value: 1 },
          { label: 'Pupils moderately dilated', value: 2 },
          { label: 'Pupils so dilated that only rim of iris is visible', value: 5 },
        ],
      },
      {
        id: 'bone_joint_aches',
        label: 'Bone or Joint Aches (if patient was having pain previously, score only additional pain)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not present', value: 0 },
          { label: 'Mild diffuse discomfort', value: 1 },
          { label: 'Patient reports severe diffuse aching of joints/muscles', value: 2 },
          { label: 'Patient is rubbing joints or muscles and unable to sit still due to discomfort', value: 4 },
        ],
      },
      {
        id: 'runny_nose_tearing',
        label: 'Runny Nose or Tearing (not accounted for by cold symptoms or allergies)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not present', value: 0 },
          { label: 'Nasal stuffiness or unusually moist eyes', value: 1 },
          { label: 'Nose running or tearing', value: 2 },
          { label: 'Nose constantly running or tears streaming down cheeks', value: 4 },
        ],
      },
      {
        id: 'gi_upset',
        label: 'GI Upset (over last 30 min)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No GI symptoms', value: 0 },
          { label: 'Stomach cramping', value: 1 },
          { label: 'Nausea or loose stool', value: 2 },
          { label: 'Vomiting or diarrhea', value: 3 },
          { label: 'Multiple episodes of vomiting or diarrhea', value: 5 },
        ],
      },
      {
        id: 'tremor',
        label: 'Tremor (observation of outstretched hands)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No tremor', value: 0 },
          { label: 'Tremor can be felt but not observed', value: 1 },
          { label: 'Slight tremor observable', value: 2 },
          { label: 'Gross tremor or muscle twitching', value: 4 },
        ],
      },
      {
        id: 'yawning',
        label: 'Yawning (observation during assessment)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No yawning', value: 0 },
          { label: 'Yawning once or twice during assessment', value: 1 },
          { label: 'Yawning three or more times during assessment', value: 2 },
          { label: 'Yawning several times per minute', value: 4 },
        ],
      },
      {
        id: 'anxiety_irritability',
        label: 'Anxiety or Irritability',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'None', value: 0 },
          { label: 'Patient reports increasing irritability or anxiousness', value: 1 },
          { label: 'Patient obviously irritable or anxious', value: 2 },
          { label: 'Patient so irritable or anxious that participation in assessment is difficult', value: 4 },
        ],
      },
      {
        id: 'gooseflesh',
        label: 'Gooseflesh Skin',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Skin is smooth', value: 0 },
          { label: 'Piloerrection of skin can be felt or hairs standing up on arms', value: 3 },
          { label: 'Prominent piloerection', value: 5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Minimal / No Withdrawal',
          interpretation:
            'Score <5: Minimal or no withdrawal; do not initiate buprenorphine — risk of precipitated withdrawal is high.',
        },
        {
          min: 5,
          max: 12,
          risk: 'Mild',
          interpretation:
            'Mild withdrawal; buprenorphine initiation generally safe if COWS ≥8; close monitoring required.',
        },
        {
          min: 13,
          max: 24,
          risk: 'Moderate',
          interpretation:
            'Moderate withdrawal; appropriate candidate for buprenorphine induction; can initiate methadone in licensed program.',
        },
        {
          min: 25,
          max: 36,
          risk: 'Moderately Severe',
          interpretation:
            'Moderately severe withdrawal; initiate buprenorphine or methadone; symptomatic adjuncts (clonidine, antiemetics, antidiarrheals) recommended.',
        },
        {
          min: 37,
          max: 48,
          risk: 'Severe',
          interpretation:
            'Severe withdrawal; hospitalization may be warranted; initiate MOUD and aggressive symptom management.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'buprenorphine_induction',
        'clonidine_0_1mg',
        'ondansetron_4mg_iv',
        'loperamide',
        'iv_fluid_hydration',
        'addiction_medicine_consult',
      ],
      'Moderately Severe': [
        'buprenorphine_induction',
        'clonidine_0_1mg',
        'ondansetron_4mg_iv',
        'loperamide',
      ],
      Moderate: ['buprenorphine_induction', 'clonidine_0_1mg', 'antiemetic'],
      Mild: ['symptomatic_management', 'addiction_medicine_referral'],
      'Minimal / No Withdrawal': ['do_not_initiate_buprenorphine', 'reassess_cows_in_1_2h'],
    },
  },

  // ── STOP-BANG ─────────────────────────────────────────────────────────────
  {
    id: 'stop_bang',
    name: 'STOP-BANG',
    fullName: 'STOP-BANG Questionnaire (Obstructive Sleep Apnea)',
    category: 'ENT / OTOLARYNGOLOGY',
    application:
      'Screens for obstructive sleep apnea (OSA) using 8 yes/no items. Score ≥3 has sensitivity 84–93% for moderate-to-severe OSA. Widely used preoperatively and in the ED for patients with symptoms of sleep-disordered breathing.',
    applicableChiefComplaints: [
      'sleep_apnea',
      'snoring',
      'daytime_sleepiness',
      'preoperative_evaluation',
    ],
    keywords: [
      'STOP-BANG',
      'obstructive sleep apnea',
      'OSA',
      'snoring',
      'sleep disordered breathing',
      'preoperative',
      'BMI',
      'neck circumference',
    ],
    components: [
      {
        id: 'snoring',
        label: 'S — Do you Snore loudly (louder than talking or loud enough to be heard through closed doors)?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'tired',
        label: 'T — Do you often feel Tired, fatigued, or sleepy during the daytime?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'observed_apnea',
        label: 'O — Has anyone Observed you stop breathing during your sleep?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'pressure',
        label: 'P — Do you have or are you being treated for high blood Pressure?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'bmi',
        label: 'B — BMI >35 kg/m²?',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age',
        label: 'A — Age >50 years?',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'neck_circumference',
        label: 'N — Neck circumference >40 cm?',
        type: 'boolean',
        value: 1,
        source: 'section1',
      },
      {
        id: 'gender',
        label: 'G — Gender = Male?',
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
          max: 2,
          risk: 'Low Risk',
          interpretation:
            'Low OSA risk; routine perioperative care; no additional sleep monitoring required.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Intermediate Risk',
          interpretation:
            'Intermediate OSA risk; consider polysomnography referral; perioperative enhanced monitoring recommended; caution with sedatives and opioids.',
        },
        {
          min: 5,
          max: 8,
          risk: 'High Risk',
          interpretation:
            'High OSA risk (especially if ≥3 of S-T-O-P items are positive, or score ≥5); polysomnography strongly recommended; perioperative CPAP if already diagnosed; enhanced monitoring required.',
        },
      ],
    },
    suggestedTreatments: {
      'High Risk': [
        'sleep_medicine_referral',
        'polysomnography_order',
        'cpap_if_diagnosed',
        'perioperative_enhanced_monitoring',
      ],
      'Intermediate Risk': [
        'sleep_medicine_referral',
        'polysomnography_order',
        'perioperative_monitoring',
      ],
      'Low Risk': ['routine_perioperative_care', 'no_additional_sleep_monitoring'],
    },
  },

  // ── Rule of Nines ─────────────────────────────────────────────────────────
  {
    id: 'rule_of_nines',
    name: 'Rule of Nines',
    fullName: 'Rule of Nines (Wallace)',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Rapid estimation of total body surface area (TBSA) burned in adults using 9% body-region increments. Used to determine fluid resuscitation need (Parkland formula) and burn center transfer criteria. For children, use Lund-Browder chart.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury'],
    keywords: [
      'rule of nines',
      'Wallace',
      'TBSA',
      'total body surface area',
      'burn estimation',
      'Parkland',
      'burn resuscitation',
      'palm method',
    ],
    components: [
      {
        id: 'head_neck',
        label: 'Head and Neck (9%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Partial involvement', value: 4 },
          { label: 'Full involvement (9%)', value: 9 },
        ],
      },
      {
        id: 'anterior_trunk',
        label: 'Anterior Trunk (18%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Chest only (~9%)', value: 9 },
          { label: 'Abdomen only (~9%)', value: 9 },
          { label: 'Full anterior trunk (18%)', value: 18 },
        ],
      },
      {
        id: 'posterior_trunk',
        label: 'Posterior Trunk (18%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Upper back only (~9%)', value: 9 },
          { label: 'Lower back/buttocks only (~9%)', value: 9 },
          { label: 'Full posterior trunk (18%)', value: 18 },
        ],
      },
      {
        id: 'right_arm',
        label: 'Right Arm (9%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Partial involvement', value: 4 },
          { label: 'Full arm (9%)', value: 9 },
        ],
      },
      {
        id: 'left_arm',
        label: 'Left Arm (9%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Partial involvement', value: 4 },
          { label: 'Full arm (9%)', value: 9 },
        ],
      },
      {
        id: 'right_leg',
        label: 'Right Leg (18%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Thigh only (~9%)', value: 9 },
          { label: 'Lower leg/foot only (~9%)', value: 9 },
          { label: 'Full leg (18%)', value: 18 },
        ],
      },
      {
        id: 'left_leg',
        label: 'Left Leg (18%)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Not burned', value: 0 },
          { label: 'Thigh only (~9%)', value: 9 },
          { label: 'Lower leg/foot only (~9%)', value: 9 },
          { label: 'Full leg (18%)', value: 18 },
        ],
      },
      {
        id: 'genitalia',
        label: 'Perineum / Genitalia (1%)',
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
          max: 9,
          risk: 'Minor',
          interpretation:
            'TBSA <10%: Minor burn in adults; outpatient management may be appropriate for superficial partial-thickness burns. Full-thickness or deep partial-thickness burns require burn surgery referral regardless of TBSA.',
        },
        {
          min: 10,
          max: 19,
          risk: 'Moderate',
          interpretation:
            'TBSA 10–19%: Moderate burn; hospital admission required; initiate Parkland formula fluid resuscitation (4 mL × kg × %TBSA LR over 24 hr); consider burn center transfer.',
        },
        {
          min: 20,
          max: 100,
          risk: 'Major',
          interpretation:
            'TBSA ≥20%: Major burn; burn center transfer indicated; aggressive resuscitation per Parkland formula; airway management if facial/inhalation burn; monitor urine output 0.5–1 mL/kg/hr.',
        },
      ],
    },
    suggestedTreatments: {
      Major: [
        'parkland_formula_lr_resuscitation',
        'airway_assessment',
        'foley_catheter',
        'burn_center_transfer',
        'escharotomy_if_circumferential',
        'tetanus_prophylaxis',
        'iv_access_large_bore',
      ],
      Moderate: [
        'parkland_formula_lr_resuscitation',
        'foley_catheter',
        'wound_care',
        'tetanus_prophylaxis',
        'burn_surgery_consult',
        'pain_management',
      ],
      Minor: [
        'wound_care_dressing',
        'tetanus_prophylaxis',
        'pain_management',
        'outpatient_burn_follow_up',
      ],
    },
  },

  // ── Parkland Formula ──────────────────────────────────────────────────────
  {
    id: 'parkland_formula',
    name: 'Parkland Formula',
    fullName: 'Parkland Formula (Baxter Formula)',
    category: 'BURNS & WOUND MANAGEMENT',
    application:
      'Calculates IV fluid resuscitation volume for burn patients in the first 24 hours post-burn. Formula: 4 mL × weight (kg) × %TBSA burned (partial and full-thickness only). Give first half over the first 8 hours from time of burn; second half over the subsequent 16 hours. Titrate to urine output 0.5–1.0 mL/kg/hr (adults) or 1.0–1.5 mL/kg/hr (children).',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'burn_resuscitation'],
    keywords: [
      'Parkland formula',
      'Baxter formula',
      'burn resuscitation',
      'fluid resuscitation',
      'LR',
      'lactated ringers',
      'TBSA',
      'burn fluid',
    ],
    components: [
      {
        id: 'weight_kg',
        label: 'Patient weight (kg)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<30 kg (pediatric)', value: 20 },
          { label: '30–49 kg', value: 40 },
          { label: '50–69 kg', value: 60 },
          { label: '70–89 kg', value: 80 },
          { label: '90–109 kg', value: 100 },
          { label: '≥110 kg', value: 120 },
        ],
      },
      {
        id: 'tbsa_pct',
        label: '%TBSA (partial and full thickness burns only — from Rule of Nines or Lund-Browder)',
        type: 'select',
        source: 'section1',
        options: [
          { label: '<10% (minimal resuscitation criteria)', value: 5 },
          { label: '10–19%', value: 15 },
          { label: '20–29%', value: 25 },
          { label: '30–39%', value: 35 },
          { label: '40–49%', value: 45 },
          { label: '50–59%', value: 55 },
          { label: '≥60%', value: 65 },
        ],
      },
      {
        id: 'inhalation_injury',
        label: 'Inhalation injury present (increases fluid requirements ~30–50%)',
        type: 'boolean',
        value: 0,
        source: 'section1',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 2000,
          risk: 'Low Volume',
          interpretation:
            'Total 24-hr LR ≤2000 mL: Give first half (≤1000 mL) over first 8 hr from time of burn, second half over next 16 hr. Titrate to urine output 0.5–1 mL/kg/hr.',
        },
        {
          min: 2001,
          max: 8000,
          risk: 'Moderate Volume',
          interpretation:
            'Total 24-hr LR 2001–8000 mL: Calculate rate: first-half volume ÷ 8 hr. Anticipate large fluid shifts; monitor UO, hemodynamic status. Consider colloid (albumin) after 8 hours if output inadequate.',
        },
        {
          min: 8001,
          max: 99999,
          risk: 'High Volume',
          interpretation:
            'Total 24-hr LR >8000 mL: Massive resuscitation; burn center required. Abdominal compartment syndrome risk; consider colloid supplementation and vasopressors. Monitor for abdominal hypertension.',
        },
      ],
    },
    suggestedTreatments: {
      'High Volume': [
        'lactated_ringers_resuscitation',
        'foley_catheter_strict_io',
        'albumin_after_8hr',
        'burn_center_transfer',
        'escharotomy_if_circumferential',
        'icu_admission',
      ],
      'Moderate Volume': [
        'lactated_ringers_resuscitation',
        'foley_catheter_strict_io',
        'burn_surgery_consult',
      ],
      'Low Volume': ['lactated_ringers_resuscitation', 'foley_catheter_strict_io'],
    },
  },

  // ── Bishop Score ──────────────────────────────────────────────────────────
  {
    id: 'bishop_score',
    name: 'Bishop Score',
    fullName: 'Bishop Score',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application:
      'Assesses cervical readiness (favorability) for induction of labor. Score ≥8 predicts successful vaginal delivery; score <6 indicates an unfavorable cervix where cervical ripening agents (misoprostol, dinoprostone, Foley balloon) should be considered before oxytocin induction.',
    applicableChiefComplaints: [
      'labor_induction',
      'obstetric_emergency',
      'pregnancy_complications',
    ],
    keywords: [
      'bishop',
      'cervical ripening',
      'labor induction',
      'effacement',
      'dilation',
      'station',
      'cervix',
      'obstetrics',
    ],
    components: [
      {
        id: 'dilation',
        label: 'Cervical Dilation',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Closed (0 cm)', value: 0 },
          { label: '1–2 cm', value: 1 },
          { label: '3–4 cm', value: 2 },
          { label: '≥5 cm', value: 3 },
        ],
      },
      {
        id: 'effacement',
        label: 'Cervical Effacement',
        type: 'select',
        source: 'section1',
        options: [
          { label: '0–30%', value: 0 },
          { label: '40–50%', value: 1 },
          { label: '60–70%', value: 2 },
          { label: '≥80%', value: 3 },
        ],
      },
      {
        id: 'station',
        label: 'Fetal Station',
        type: 'select',
        source: 'section1',
        options: [
          { label: '-3 or higher (not engaged)', value: 0 },
          { label: '-2', value: 1 },
          { label: '-1 or 0', value: 2 },
          { label: '+1 or +2', value: 3 },
        ],
      },
      {
        id: 'consistency',
        label: 'Cervical Consistency',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Firm (like tip of nose)', value: 0 },
          { label: 'Medium', value: 1 },
          { label: 'Soft (like lips)', value: 2 },
        ],
      },
      {
        id: 'position',
        label: 'Cervical Position',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Posterior', value: 0 },
          { label: 'Mid-position', value: 1 },
          { label: 'Anterior', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 5,
          risk: 'Unfavorable',
          interpretation:
            'Unfavorable cervix; cervical ripening recommended before oxytocin induction. Options: misoprostol 25 mcg vaginal q4–6h, dinoprostone, or mechanical Foley balloon.',
        },
        {
          min: 6,
          max: 7,
          risk: 'Moderate',
          interpretation:
            'Moderately favorable cervix; induction may proceed with oxytocin, though ripening agents may still be beneficial.',
        },
        {
          min: 8,
          max: 13,
          risk: 'Favorable',
          interpretation:
            'Favorable cervix; high likelihood of successful induction with oxytocin. Proceed with standard induction protocol.',
        },
      ],
    },
    suggestedTreatments: {
      Unfavorable: [
        'misoprostol_cervical_ripening',
        'dinoprostone_gel',
        'foley_balloon_cervical_ripening',
        'obstetrics_consult',
      ],
      Moderate: ['oxytocin_induction', 'obstetrics_consult'],
      Favorable: ['oxytocin_induction', 'continuous_fetal_monitoring'],
    },
  },

  // ── Apgar Score ───────────────────────────────────────────────────────────
  {
    id: 'apgar',
    name: 'Apgar Score',
    fullName: 'Apgar Score',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application:
      'Rapid assessment of newborn clinical status at 1 and 5 minutes after birth. The 1-minute score guides need for immediate resuscitation; the 5-minute score correlates better with neonatal outcomes. If the 5-minute score is <7, continue scoring every 5 minutes up to 20 minutes.',
    applicableChiefComplaints: [
      'newborn_resuscitation',
      'delivery',
      'neonatal_distress',
      'obstetric_emergency',
    ],
    keywords: [
      'Apgar',
      'newborn',
      'neonatal resuscitation',
      'appearance',
      'pulse',
      'grimace',
      'activity',
      'respiration',
      'birth assessment',
    ],
    components: [
      {
        id: 'appearance',
        label: 'A — Appearance (skin color)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Blue or pale all over', value: 0 },
          { label: 'Pink body, blue extremities (acrocyanosis)', value: 1 },
          { label: 'Completely pink', value: 2 },
        ],
      },
      {
        id: 'pulse',
        label: 'P — Pulse (heart rate)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent (no heart rate)', value: 0 },
          { label: '<100 bpm', value: 1 },
          { label: '≥100 bpm', value: 2 },
        ],
      },
      {
        id: 'grimace',
        label: 'G — Grimace (reflex irritability — response to catheter in nostril)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No response', value: 0 },
          { label: 'Grimace', value: 1 },
          { label: 'Cough, sneeze, or cry', value: 2 },
        ],
      },
      {
        id: 'activity',
        label: 'A — Activity (muscle tone)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Limp (no tone)', value: 0 },
          { label: 'Some flexion of extremities', value: 1 },
          { label: 'Active motion / flexed position', value: 2 },
        ],
      },
      {
        id: 'respiration',
        label: 'R — Respiration (breathing effort)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent (no respirations)', value: 0 },
          { label: 'Slow, weak, or irregular cry', value: 1 },
          { label: 'Good, strong cry', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 3,
          risk: 'Severely Depressed',
          interpretation:
            'Severely depressed newborn; immediate resuscitation required (PPV, chest compressions, possible epinephrine). Activate neonatal code team.',
        },
        {
          min: 4,
          max: 6,
          risk: 'Moderately Depressed',
          interpretation:
            'Moderately depressed; may need stimulation, suctioning, supplemental oxygen, and/or positive pressure ventilation. Reassess at 5 minutes.',
        },
        {
          min: 7,
          max: 10,
          risk: 'Normal',
          interpretation:
            'Normal newborn status; routine care (warming, drying, stimulation). Reassess at 5 minutes.',
        },
      ],
    },
    suggestedTreatments: {
      'Severely Depressed': [
        'neonatal_resuscitation_ppv',
        'chest_compressions_neonate',
        'epinephrine_neonate',
        'neonatology_emergency_consult',
        'umbilical_vein_access',
        'continuous_monitoring',
      ],
      'Moderately Depressed': [
        'supplemental_oxygen_neonate',
        'ppv_if_inadequate_respirations',
        'neonatology_consult',
        'warming_drying_stimulation',
      ],
      Normal: ['warming_drying_stimulation', 'routine_newborn_care'],
    },
  },

]
