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
  // Light's Criteria: QUARANTINED — see _quarantine/lights_criteria.ts
  // Reason: 0 user-answerable components; all 3 criteria are lab ratios (section2).
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // ROX Index: QUARANTINED — see _quarantine/rox_index.ts
  // Reason: 1 user-answerable component; core inputs are continuous measurements (number_range).
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // BODE Index: QUARANTINED — see _quarantine/bode_index.ts
  // Reason: 2 user-answerable components (BMI, mMRC); FEV1 and 6MWD are section2 tests.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // RSBI: QUARANTINED — see _quarantine/rsbi.ts
  // Reason: 0 user-answerable components; pure ventilator calculation (RR/Vt).
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Murray Lung Injury Score: QUARANTINED — see _quarantine/murray_lung_injury.ts
  // Reason: 0 user-answerable components; all 4 components are imaging/vent/lab (section2).
  // ---------------------------------------------------------------------------

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
        source: 'user_input',
      },
      {
        id: 'modern_scanner',
        label: 'CT obtained on 3rd-generation or newer scanner',
        type: 'boolean',
        value: 1,
        source: 'user_input',
      },
      {
        id: 'experienced_radiologist',
        label: 'CT interpreted by experienced (attending-level) radiologist',
        type: 'boolean',
        value: 1,
        source: 'user_input',
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
