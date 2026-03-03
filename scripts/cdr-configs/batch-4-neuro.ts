/**
 * Batch 4 — Neurology CDRs
 *
 * Full clinical definitions for 10 neurological Clinical Decision Rules.
 * Replaces number_range placeholders in seed-cdr-library.ts with real
 * component-level data from EM literature.
 *
 * CDRs included:
 *   nihss, race_scale, ottawa_sah, abcd2, canadian_tia,
 *   hints_exam, hunt_hess, modified_fisher, ich_score, four_score
 */

import type { CdrSeed } from './types'

export const batch4NeuroCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // NIHSS — National Institutes of Health Stroke Scale
  // Full 15-item scale; each item maps to its published subscore range.
  // Source: Brott T et al. Stroke. 1989;20(7):864-870
  // ---------------------------------------------------------------------------
  {
    id: 'nihss',
    name: 'NIHSS',
    fullName: 'NIHSS (National Institutes of Health Stroke Scale)',
    category: 'NEUROLOGY',
    application:
      'Quantifies stroke deficit severity across 15 neurological domains to guide treatment decisions (thrombolysis eligibility, thrombectomy consideration) and predict functional outcomes.',
    applicableChiefComplaints: [
      'stroke',
      'facial_droop',
      'arm_weakness',
      'speech_difficulty',
      'focal_neurological_deficit',
    ],
    keywords: [
      'NIHSS',
      'NIH stroke scale',
      'stroke severity',
      'thrombolysis',
      'alteplase',
      'tPA',
      'thrombectomy',
      'LVO',
    ],
    requiredTests: ['CT head non-contrast', 'CT angiography head and neck'],
    components: [
      {
        id: 'loc',
        label: '1a. Level of Consciousness',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Alert; keenly responsive', value: 0 },
          { label: 'Not alert, but arousable by minor stimulation', value: 1 },
          { label: 'Not alert, requires repeated stimulation to attend', value: 2 },
          { label: 'Unresponsive or responds only with reflex motor/autonomic', value: 3 },
        ],
      },
      {
        id: 'loc_questions',
        label: '1b. LOC Questions (month and age)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Answers both questions correctly', value: 0 },
          { label: 'Answers one question correctly', value: 1 },
          { label: 'Answers neither question correctly', value: 2 },
        ],
      },
      {
        id: 'loc_commands',
        label: '1c. LOC Commands (eye open/close, grip/release)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Performs both tasks correctly', value: 0 },
          { label: 'Performs one task correctly', value: 1 },
          { label: 'Performs neither task correctly', value: 2 },
        ],
      },
      {
        id: 'best_gaze',
        label: '2. Best Gaze (horizontal eye movements)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Partial gaze palsy', value: 1 },
          { label: 'Forced deviation or total gaze paresis', value: 2 },
        ],
      },
      {
        id: 'visual',
        label: '3. Visual Fields',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No visual loss', value: 0 },
          { label: 'Partial hemianopia', value: 1 },
          { label: 'Complete hemianopia', value: 2 },
          { label: 'Bilateral hemianopia (blind including cortical blindness)', value: 3 },
        ],
      },
      {
        id: 'facial_palsy',
        label: '4. Facial Palsy',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Normal symmetrical movements', value: 0 },
          { label: 'Minor paralysis (flattened NLF, asymmetry on smiling)', value: 1 },
          { label: 'Partial paralysis (total or near-total lower face paralysis)', value: 2 },
          { label: 'Complete paralysis (no upper and lower face movement)', value: 3 },
        ],
      },
      {
        id: 'motor_arm_left',
        label: '5a. Motor Arm — Left (hold 90° seated / 45° supine for 10 sec)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No drift; holds for full 10 seconds', value: 0 },
          { label: 'Drift before full 10 seconds but does not hit bed', value: 1 },
          { label: 'Some effort against gravity; hits bed before 10 sec', value: 2 },
          { label: 'No effort against gravity; limb falls immediately', value: 3 },
          { label: 'No movement', value: 4 },
        ],
      },
      {
        id: 'motor_arm_right',
        label: '5b. Motor Arm — Right',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No drift', value: 0 },
          { label: 'Drift before 10 seconds', value: 1 },
          { label: 'Some effort against gravity; hits bed', value: 2 },
          { label: 'No effort against gravity', value: 3 },
          { label: 'No movement', value: 4 },
        ],
      },
      {
        id: 'motor_leg_left',
        label: '6a. Motor Leg — Left (hold 30° for 5 sec)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No drift; holds for full 5 seconds', value: 0 },
          { label: 'Drift before full 5 seconds but does not hit bed', value: 1 },
          { label: 'Some effort against gravity; hits bed', value: 2 },
          { label: 'No effort against gravity; falls immediately', value: 3 },
          { label: 'No movement', value: 4 },
        ],
      },
      {
        id: 'motor_leg_right',
        label: '6b. Motor Leg — Right',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No drift', value: 0 },
          { label: 'Drift before 5 seconds', value: 1 },
          { label: 'Some effort against gravity; hits bed', value: 2 },
          { label: 'No effort against gravity', value: 3 },
          { label: 'No movement', value: 4 },
        ],
      },
      {
        id: 'limb_ataxia',
        label: '7. Limb Ataxia (finger-nose-finger, heel-shin)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Present in one limb', value: 1 },
          { label: 'Present in two limbs', value: 2 },
        ],
      },
      {
        id: 'sensory',
        label: '8. Sensory (pinprick to face, arm, trunk, leg)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Normal; no sensory loss', value: 0 },
          { label: 'Mild-moderate sensory loss', value: 1 },
          { label: 'Severe to total sensory loss', value: 2 },
        ],
      },
      {
        id: 'best_language',
        label: '9. Best Language (describe scene, name items, read sentences)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No aphasia; normal', value: 0 },
          { label: 'Mild-moderate aphasia', value: 1 },
          { label: 'Severe aphasia; fragmentary expression', value: 2 },
          { label: 'Mute, global aphasia; no usable speech or comprehension', value: 3 },
        ],
      },
      {
        id: 'dysarthria',
        label: '10. Dysarthria (read or repeat words)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Mild-moderate; slurred but understandable', value: 1 },
          { label: 'Severe; unintelligible or mute/anarthric', value: 2 },
        ],
      },
      {
        id: 'extinction_inattention',
        label: '11. Extinction and Inattention',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'No abnormality', value: 0 },
          { label: 'Inattention or extinction to bilateral stimulation in one modality', value: 1 },
          { label: 'Profound hemi-inattention / extinction in more than one modality', value: 2 },
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
            'No stroke symptoms.',
        },
        {
          min: 1,
          max: 4,
          risk: 'Minor',
          interpretation:
            'Minor stroke. IV alteplase may be considered; individual risk-benefit required. PRISMS/TEMPO-2 trials relevant for minor stroke management.',
        },
        {
          min: 5,
          max: 15,
          risk: 'Moderate',
          interpretation:
            'Moderate stroke. IV alteplase within 4.5 hours of onset is generally indicated (if no contraindications). Evaluate for LVO with CTA.',
        },
        {
          min: 16,
          max: 20,
          risk: 'Moderate-Severe',
          interpretation:
            'Moderate to severe stroke. IV alteplase + thrombectomy evaluation if LVO identified. ICU-level monitoring.',
        },
        {
          min: 21,
          max: 42,
          risk: 'Severe',
          interpretation:
            'Severe stroke. Urgent CTA for LVO evaluation; mechanical thrombectomy if eligible. Aggressive airway and hemodynamic management. Early neurosurgical and neurology consultation.',
        },
      ],
    },
    suggestedTreatments: {
      Severe: [
        'IV_alteplase_if_eligible',
        'mechanical_thrombectomy_if_LVO',
        'airway_management',
        'neurology_consult_urgent',
        'neurosurgery_consult',
        'admit_neuro_ICU',
        'BP_management_per_stroke_protocol',
      ],
      'Moderate-Severe': [
        'IV_alteplase_if_eligible',
        'CTA_head_neck',
        'mechanical_thrombectomy_if_LVO',
        'neurology_consult_urgent',
        'admit_stroke_unit',
      ],
      Moderate: [
        'IV_alteplase_if_eligible',
        'CTA_head_neck',
        'neurology_consult',
        'admit_stroke_unit',
        'aspirin_after_thrombolysis_window',
      ],
      Minor: [
        'neurology_consult',
        'aspirin_325_loading',
        'antiplatelet_dual_therapy_POINT_CHANCE',
        'admit_or_expedited_outpatient_evaluation',
      ],
      None: [
        'reassess_for_stroke_mimics',
        'consider_alternative_diagnoses',
        'standard_neurological_monitoring',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // RACE Scale — Rapid Arterial oCclusion Evaluation
  // Perez de la Ossa N et al. Stroke. 2014;45(1):87-91
  // 5 items; max 9 points; ≥5 = high LVO probability
  // ---------------------------------------------------------------------------
  {
    id: 'race_scale',
    name: 'RACE Scale',
    fullName: 'RACE Scale (Rapid Arterial oCclusion Evaluation)',
    category: 'NEUROLOGY',
    application:
      'Prehospital large vessel occlusion (LVO) detection for field triage to a thrombectomy-capable comprehensive stroke center. Validated in the prehospital and ED triage setting.',
    applicableChiefComplaints: [
      'stroke',
      'facial_droop',
      'arm_weakness',
      'aphasia',
      'gaze_deviation',
    ],
    keywords: [
      'RACE',
      'LVO',
      'large vessel occlusion',
      'thrombectomy',
      'prehospital',
      'stroke triage',
      'facial palsy',
      'aphasia',
    ],
    components: [
      {
        id: 'facial_palsy',
        label: 'Facial Palsy',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Mild', value: 1 },
          { label: 'Moderate to severe', value: 2 },
        ],
      },
      {
        id: 'arm_motor_impairment',
        label: 'Arm Motor Impairment',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Mild (drifts before 10 sec, does not fall)', value: 1 },
          { label: 'Moderate to severe (falls, or no effort)', value: 2 },
        ],
      },
      {
        id: 'leg_motor_impairment',
        label: 'Leg Motor Impairment',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Absent', value: 0 },
          { label: 'Mild (drifts before 5 sec, does not fall)', value: 1 },
          { label: 'Moderate to severe (falls, or no effort)', value: 2 },
        ],
      },
      {
        id: 'head_and_gaze_deviation',
        label: 'Head and/or Gaze Deviation',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'aphasia_agnosia',
        label: 'Aphasia (left hemisphere) / Agnosia (right hemisphere)',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Performs tasks correctly', value: 0 },
          { label: 'Does not perform task but makes some effort', value: 1 },
          { label: 'Cannot perform — unresponsive or unable to perform', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Low LVO Probability',
          interpretation:
            'Lower likelihood of LVO. Transport to nearest certified stroke center for standard evaluation.',
        },
        {
          min: 5,
          max: 9,
          risk: 'High LVO Probability',
          interpretation:
            'RACE ≥5: ~85% sensitivity for LVO. Transport directly to comprehensive stroke center with thrombectomy capability. Do not divert to non-thrombectomy facility.',
        },
      ],
    },
    suggestedTreatments: {
      'High LVO Probability': [
        'transport_to_thrombectomy_capable_center',
        'neurology_consult_preactivation',
        'CTA_head_neck_on_arrival',
        'IV_alteplase_if_eligible',
        'mechanical_thrombectomy_evaluation',
      ],
      'Low LVO Probability': [
        'transport_to_nearest_stroke_center',
        'stroke_protocol_activation',
        'CT_head_noncontrast',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Ottawa SAH Rule
  // Perry JJ et al. BMJ. 2013;346:f2811
  // 6 high-risk criteria; ANY positive = investigate; 100% sensitivity
  // ---------------------------------------------------------------------------
  {
    id: 'ottawa_sah',
    name: 'Ottawa SAH Rule',
    fullName: 'Ottawa SAH Rule',
    category: 'NEUROLOGY',
    application:
      'Identifies which alert (GCS 15) patients ≥15 years with new severe non-traumatic headache reaching maximum intensity within 1 hour require investigation for subarachnoid hemorrhage. 100% sensitivity in derivation and validation cohorts.',
    applicableChiefComplaints: [
      'headache',
      'thunderclap_headache',
      'worst_headache_of_life',
    ],
    keywords: [
      'Ottawa SAH',
      'subarachnoid hemorrhage',
      'SAH',
      'headache',
      'thunderclap headache',
      'lumbar puncture',
      'CT head',
    ],
    requiredTests: ['CT head non-contrast', 'lumbar puncture'],
    components: [
      {
        id: 'age_gte_40',
        label: 'Age ≥40 years',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'neck_pain_stiffness',
        label: 'Neck pain or stiffness',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'witnessed_loc',
        label: 'Witnessed loss of consciousness',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'onset_with_exertion',
        label: 'Onset with exertion',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'thunderclap_onset',
        label: 'Thunderclap headache (instantaneous peak — ≤1 second to maximum)',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'limited_neck_flexion',
        label: 'Limited neck flexion on exam',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Very Low Risk',
          interpretation:
            'All 6 criteria absent: rule not triggered. SAH investigation (CT ± LP) may not be required if the rule is properly applied (GCS 15, ≥15 years, non-traumatic, max intensity within 1 hour). Clinical judgment still required.',
        },
        {
          min: 1,
          max: 6,
          risk: 'High Risk — Investigate',
          interpretation:
            'ANY ONE criterion present: 100% sensitivity for SAH. Perform non-contrast CT head immediately. If CT negative and headache onset <6 hours: may apply the 6-Hour CT Rule (Perry 2011). If CT negative and onset ≥6 hours or if <6-hour rule criteria not met: perform lumbar puncture for xanthochromia and RBC count, or CTA.',
        },
      ],
    },
    suggestedTreatments: {
      'High Risk — Investigate': [
        'CT_head_noncontrast_stat',
        'lumbar_puncture_if_CT_negative',
        'CTA_if_LP_equivocal',
        'neurosurgery_consult_if_SAH_confirmed',
        'nimodipine_60mg_q4h_if_SAH_confirmed',
        'admit_neurosurgery_if_SAH_confirmed',
      ],
      'Very Low Risk': [
        'clinical_reassessment',
        'consider_alternative_headache_diagnosis',
        'discharge_with_return_precautions',
        'outpatient_neurology_followup_if_recurrent',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ABCD2 Score
  // Johnston SC et al. Lancet. 2007;369(9558):283-292
  // Predicts 2-day and 7-day stroke risk after TIA; 7-point scale
  // ---------------------------------------------------------------------------
  {
    id: 'abcd2',
    name: 'ABCD2',
    fullName: 'ABCD\u00b2 Score',
    category: 'NEUROLOGY',
    application:
      'Predicts 2-day, 7-day, and 90-day stroke risk after a transient ischemic attack (TIA). Guides decision between hospital admission vs. expedited outpatient evaluation.',
    applicableChiefComplaints: [
      'tia',
      'transient_ischemic_attack',
      'focal_neurological_deficit',
      'speech_difficulty',
      'arm_weakness',
    ],
    keywords: [
      'ABCD2',
      'TIA',
      'transient ischemic attack',
      'stroke risk',
      'hypertension',
      'diabetes',
      'weakness',
      'speech',
    ],
    requiredTests: ['glucose', 'blood pressure'],
    components: [
      {
        id: 'age',
        label: 'A — Age ≥60 years',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'blood_pressure',
        label: 'B — Blood Pressure ≥140/90 mmHg at initial evaluation',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'clinical_features',
        label: 'C — Clinical Features of TIA',
        type: 'select',
        source: 'section1',
        options: [
          { label: 'Other symptom (no unilateral weakness or speech impairment)', value: 0 },
          { label: 'Speech impairment without unilateral weakness', value: 1 },
          { label: 'Unilateral weakness (with or without speech impairment)', value: 2 },
        ],
      },
      {
        id: 'duration',
        label: 'D1 — Duration of Symptoms',
        type: 'select',
        source: 'section1',
        options: [
          { label: '<10 minutes', value: 0 },
          { label: '10–59 minutes', value: 1 },
          { label: '≥60 minutes', value: 2 },
        ],
      },
      {
        id: 'diabetes',
        label: 'D2 — Diabetes Mellitus (history of or on treatment)',
        type: 'boolean',
        source: 'section1',
        value: 1,
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
            '1.0% 2-day stroke risk; 1.2% 7-day risk. May be appropriate for expedited outpatient evaluation within 24–48 hours if reliable follow-up arranged and no high-risk features (e.g., AF, carotid stenosis).',
        },
        {
          min: 4,
          max: 5,
          risk: 'Moderate',
          interpretation:
            '4.1% 2-day stroke risk; 5.9% 7-day risk. Urgent evaluation within 24 hours recommended. Admission to expedited TIA pathway or observation unit.',
        },
        {
          min: 6,
          max: 7,
          risk: 'High',
          interpretation:
            '8.1% 2-day stroke risk; 11.7% 7-day risk. Hospital admission for expedited workup: MRI/MRA or CTA, cardiac monitoring, echocardiogram. Initiate antiplatelet therapy.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'aspirin_325_loading',
        'clopidogrel_dual_antiplatelet_POINT_CHANCE',
        'admit_observation',
        'MRI_brain_with_DWI',
        'CTA_or_MRA_head_neck',
        'cardiac_monitoring_telemetry',
        'echocardiogram',
        'neurology_consult',
        'statin_initiation',
      ],
      Moderate: [
        'aspirin_325_loading',
        'clopidogrel_dual_antiplatelet_POINT_CHANCE',
        'expedited_TIA_pathway',
        'MRI_brain_with_DWI',
        'CTA_or_MRA_head_neck',
        'cardiac_monitoring',
        'neurology_consult',
      ],
      Low: [
        'aspirin_325_loading',
        'outpatient_TIA_clinic_within_48h',
        'MRI_brain_with_DWI',
        'neurology_referral',
        'statin_consideration',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Canadian TIA Score
  // Perry JJ et al. BMJ. 2016;354:i4086
  // Predicts 7-day stroke risk after TIA; range -3 to +23; more discriminating than ABCD2
  // ---------------------------------------------------------------------------
  {
    id: 'canadian_tia',
    name: 'Canadian TIA Score',
    fullName: 'Canadian TIA Score',
    category: 'NEUROLOGY',
    application:
      'Predicts 7-day stroke risk after TIA. More discriminating than ABCD2 alone. Incorporates history, clinical features, blood pressure, and laboratory values.',
    applicableChiefComplaints: [
      'tia',
      'transient_ischemic_attack',
      'focal_neurological_deficit',
    ],
    keywords: [
      'Canadian TIA',
      'TIA score',
      'stroke risk',
      'transient ischemic attack',
      'carotid stenosis',
      'antiplatelet',
      'atrial fibrillation',
    ],
    requiredTests: ['platelet count', 'glucose', 'blood pressure'],
    components: [
      {
        id: 'initial_bp_diastolic',
        label: 'Initial Diastolic BP',
        type: 'select',
        source: 'section1',
        options: [
          { label: '<80 mmHg', value: -1 },
          { label: '80–99 mmHg', value: 0 },
          { label: '≥100 mmHg', value: 2 },
        ],
      },
      {
        id: 'dysarthria',
        label: 'Carotid territory: Dysarthria',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      {
        id: 'unilateral_weakness',
        label: 'Carotid territory: Unilateral weakness',
        type: 'boolean',
        source: 'section1',
        value: 4,
      },
      {
        id: 'duration_10_to_59',
        label: 'Duration 10–59 minutes',
        type: 'boolean',
        source: 'section1',
        value: 3,
      },
      {
        id: 'duration_gte_60',
        label: 'Duration ≥60 minutes',
        type: 'boolean',
        source: 'section1',
        value: 4,
      },
      {
        id: 'history_of_tia',
        label: 'History of TIA in the past 7 days',
        type: 'boolean',
        source: 'section1',
        value: 2,
      },
      {
        id: 'age_gte_60',
        label: 'Age ≥60 years',
        type: 'boolean',
        source: 'section1',
        value: 2,
      },
      {
        id: 'diabetes_mellitus',
        label: 'Diabetes mellitus (history or glucose ≥7.8 mmol/L on presentation)',
        type: 'boolean',
        source: 'section1',
        value: 2,
      },
      {
        id: 'platelet_count_low',
        label: 'Platelet count <150 × 10⁹/L',
        type: 'boolean',
        source: 'section2',
        value: -2,
      },
      {
        id: 'already_on_antiplatelets',
        label: 'Already on antiplatelet therapy at time of TIA',
        type: 'boolean',
        source: 'section1',
        value: -1,
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: -4,
          max: 3,
          risk: 'Very Low',
          interpretation:
            '<1% 7-day stroke risk. Consider outpatient expedited TIA clinic evaluation if reliable follow-up is arranged.',
        },
        {
          min: 4,
          max: 5,
          risk: 'Low',
          interpretation:
            'Approximately 1–2% 7-day stroke risk. Score ≤5 may be appropriate for expedited outpatient evaluation per Canadian TIA protocol; initiate dual antiplatelet therapy.',
        },
        {
          min: 6,
          max: 8,
          risk: 'Medium',
          interpretation:
            'Approximately 4–7% 7-day stroke risk. Score ≥6 generally warrants hospital admission for expedited workup: MRI/MRA, cardiac monitoring, echocardiogram.',
        },
        {
          min: 9,
          max: 23,
          risk: 'High',
          interpretation:
            'Approximately 7–14% 7-day stroke risk. Hospital admission required. Early neuroimaging, vascular imaging, cardiac monitoring, and antiplatelet initiation.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'aspirin_325_loading',
        'clopidogrel_dual_antiplatelet_POINT_CHANCE',
        'admit_observation',
        'MRI_brain_with_DWI',
        'CTA_or_MRA_head_neck',
        'cardiac_monitoring_telemetry',
        'echocardiogram',
        'neurology_consult',
        'statin_initiation',
      ],
      Medium: [
        'aspirin_325_loading',
        'clopidogrel_dual_antiplatelet_POINT_CHANCE',
        'admit_observation',
        'MRI_brain_with_DWI',
        'CTA_head_neck',
        'cardiac_monitoring',
        'neurology_consult',
      ],
      Low: [
        'aspirin_325_loading',
        'dual_antiplatelet_therapy',
        'expedited_TIA_outpatient_pathway',
        'MRI_brain_with_DWI',
        'neurology_referral',
      ],
      'Very Low': [
        'aspirin_loading',
        'outpatient_TIA_clinic',
        'neurology_referral',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // HINTS Exam — Head Impulse, Nystagmus, Test of Skew
  // Kattah JC et al. Stroke. 2009;40(11):3504-3510
  // Algorithm-based; ANY central sign = concerning for stroke
  // HINTS+ adds hearing loss as 4th component
  // ---------------------------------------------------------------------------
  {
    id: 'hints_exam',
    name: 'HINTS Exam',
    fullName: 'HINTS Exam (Head Impulse, Nystagmus, Test of Skew)',
    category: 'NEUROLOGY',
    application:
      'Bedside oculomotor exam to differentiate central (stroke, demyelination) from peripheral (vestibular neuritis, labyrinthitis) cause of acute vestibular syndrome (AVS): continuous vertigo with nystagmus and gait instability, NOT episodic positional vertigo. Sensitivity ~97% for posterior fossa stroke, superior to early MRI in first 48 hours.',
    applicableChiefComplaints: [
      'vertigo',
      'dizziness',
      'nystagmus',
      'gait_instability',
    ],
    keywords: [
      'HINTS',
      'head impulse test',
      'nystagmus',
      'skew deviation',
      'vertigo',
      'vestibular',
      'central',
      'peripheral',
      'stroke',
      'INFARCT',
    ],
    components: [
      {
        id: 'head_impulse',
        label: 'H — Head Impulse Test (VOR integrity)',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'Normal (no corrective saccade) — CENTRAL feature',
            value: 1,
          },
          {
            label: 'Abnormal / positive (catch-up saccade present) — PERIPHERAL feature',
            value: 0,
          },
        ],
      },
      {
        id: 'nystagmus_type',
        label: 'N — Nystagmus Type',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'Direction-changing (gaze-evoked, changes direction with gaze) — CENTRAL feature',
            value: 1,
          },
          {
            label: 'Direction-fixed (unidirectional, same fast phase regardless of gaze) — PERIPHERAL feature',
            value: 0,
          },
        ],
      },
      {
        id: 'test_of_skew',
        label: 'T — Test of Skew (alternate cover test)',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'Skew deviation present (vertical misalignment) — CENTRAL feature',
            value: 1,
          },
          {
            label: 'No skew deviation — PERIPHERAL feature',
            value: 0,
          },
        ],
      },
      {
        id: 'acute_hearing_loss',
        label: 'HINTS+: Acute unilateral hearing loss (new onset)',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'No hearing loss',
            value: 0,
          },
          {
            label: 'New acute unilateral hearing loss present — may indicate AICA stroke (CENTRAL)',
            value: 1,
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
          risk: 'Peripheral (Benign)',
          interpretation:
            'All 3 HINTS criteria peripheral (abnormal head impulse + direction-fixed nystagmus + no skew deviation): peripheral etiology most likely (vestibular neuritis/labyrinthitis). ~97% sensitivity for excluding central cause — superior to MRI in first 48 hours. HINTS+ negative (no new hearing loss): discharge with vestibular suppresants and close follow-up is reasonable.',
        },
        {
          min: 1,
          max: 4,
          risk: 'Central (Concerning for Stroke)',
          interpretation:
            'ANY ONE central feature (normal head impulse, direction-changing nystagmus, or skew deviation) OR new acute unilateral hearing loss (HINTS+): strongly concerning for posterior fossa stroke. Urgent MRI brain with DWI/ADC and MRA posterior circulation. Admit for monitoring. Note: MRI may be false-negative in first 24–48 hours; repeat imaging or CTA if initial MRI negative but suspicion high.',
        },
      ],
    },
    suggestedTreatments: {
      'Central (Concerning for Stroke)': [
        'MRI_brain_DWI_ADC_stat',
        'MRA_posterior_circulation',
        'neurology_consult_urgent',
        'admit_stroke_unit',
        'BP_management_per_stroke_protocol',
        'aspirin_if_ischemic_stroke_confirmed',
        'repeat_MRI_if_initially_negative_and_suspicion_persists',
      ],
      'Peripheral (Benign)': [
        'meclizine_or_dimenhydrinate',
        'vestibular_physical_therapy_referral',
        'outpatient_ENT_or_neurology_follow_up',
        'return_precautions',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Hunt and Hess Scale
  // Hunt WE, Hess RM. J Neurosurg. 1968;28(1):14-20
  // Clinical grading of SAH at presentation; grades 1–5; predicts surgical risk
  // Decomposed into the 4 clinical assessment domains evaluated at bedside.
  // Algorithm scoring: grade determined by worst clinical feature, not sum.
  // ---------------------------------------------------------------------------
  {
    id: 'hunt_hess',
    name: 'Hunt and Hess Scale',
    fullName: 'Hunt and Hess Scale (Subarachnoid Hemorrhage)',
    category: 'NEUROLOGY',
    application:
      'Clinical grading of subarachnoid hemorrhage (SAH) severity at presentation. Predicts surgical risk and mortality. Used in conjunction with Modified Fisher Scale for CT-based vasospasm risk. Lower grades favor early surgical/endovascular aneurysm repair.',
    applicableChiefComplaints: [
      'headache',
      'thunderclap_headache',
      'subarachnoid_hemorrhage',
      'altered_mental_status',
    ],
    keywords: [
      'Hunt and Hess',
      'SAH',
      'subarachnoid hemorrhage',
      'grading',
      'surgical risk',
      'aneurysm',
      'nuchal rigidity',
    ],
    requiredTests: ['CT head non-contrast', 'CTA head', 'lumbar puncture'],
    components: [
      {
        id: 'consciousness_level',
        label: 'Level of Consciousness',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Alert, oriented', value: 0 },
          { label: 'Drowsy or confused', value: 1 },
          { label: 'Stuporous (responds to stimulation only)', value: 2 },
          { label: 'Deep coma, moribund appearance', value: 3 },
        ],
      },
      {
        id: 'headache_severity',
        label: 'Headache Severity',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Asymptomatic or minimal headache', value: 0 },
          { label: 'Moderate to severe headache', value: 1 },
        ],
      },
      {
        id: 'meningeal_signs',
        label: 'Meningeal Signs (Nuchal Rigidity)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None or slight nuchal rigidity', value: 0 },
          { label: 'Nuchal rigidity present', value: 1 },
        ],
      },
      {
        id: 'focal_neuro_deficit',
        label: 'Focal Neurological Deficit',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No focal deficit', value: 0 },
          { label: 'Cranial nerve palsy only', value: 0 },
          { label: 'Mild focal deficit', value: 1 },
          { label: 'Moderate to severe hemiparesis or decerebrate posturing', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1,
          max: 1,
          risk: 'Grade I — Minimal Risk',
          interpretation:
            '~1% surgical mortality. Early aneurysm repair (clipping or coiling) indicated within 24–72 hours. Nimodipine 60 mg q4h x 21 days. ICU monitoring for vasospasm.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Grade II — Low Risk',
          interpretation:
            '~5% surgical mortality. Early aneurysm repair recommended. Nimodipine, serial TCD monitoring, ICU care.',
        },
        {
          min: 3,
          max: 3,
          risk: 'Grade III — Moderate Risk',
          interpretation:
            '~19% surgical mortality. Aneurysm repair still indicated but timing individualized. Aggressive medical management, ICP monitoring consideration, nimodipine.',
        },
        {
          min: 4,
          max: 4,
          risk: 'Grade IV — High Risk',
          interpretation:
            '~42% surgical mortality. Stabilize medically before intervention decision. Goals-of-care discussion warranted. Neurosurgery and neurocritical care consultation essential.',
        },
        {
          min: 5,
          max: 5,
          risk: 'Grade V — Very High Risk',
          interpretation:
            '~77% surgical mortality. Requires aggressive resuscitation and stabilization. Most interventions deferred until clinical improvement. Immediate goals-of-care and family discussion. Neurosurgery consultation.',
        },
      ],
    },
    suggestedTreatments: {
      'Grade I — Minimal Risk': [
        'neurosurgery_consult_urgent',
        'CTA_head_stat',
        'nimodipine_60mg_q4h_x21_days',
        'admit_neuro_ICU',
        'early_aneurysm_coiling_or_clipping',
        'TCD_vasospasm_monitoring',
        'euvolemia_maintenance',
      ],
      'Grade II — Low Risk': [
        'neurosurgery_consult_urgent',
        'CTA_head_stat',
        'nimodipine_60mg_q4h_x21_days',
        'admit_neuro_ICU',
        'early_aneurysm_coiling_or_clipping',
        'TCD_vasospasm_monitoring',
      ],
      'Grade III — Moderate Risk': [
        'neurosurgery_consult_urgent',
        'neurocritical_care_consult',
        'nimodipine_60mg_q4h_x21_days',
        'admit_neuro_ICU',
        'ICP_monitoring_consideration',
        'aneurysm_treatment_timing_individualized',
      ],
      'Grade IV — High Risk': [
        'neurosurgery_consult_urgent',
        'neurocritical_care_consult',
        'nimodipine_60mg_q4h_x21_days',
        'admit_neuro_ICU',
        'airway_management',
        'goals_of_care_discussion',
        'ICP_monitoring',
      ],
      'Grade V — Very High Risk': [
        'airway_management_intubation',
        'neurosurgery_consult',
        'neurocritical_care_consult',
        'nimodipine_60mg_q4h_x21_days',
        'goals_of_care_discussion_urgent',
        'admit_neuro_ICU',
        'resuscitation_and_stabilization',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Modified Fisher Scale — QUARANTINED
  // Moved to _quarantine/modified_fisher.ts
  // Reason: All components are CT-based (section2); 0 user-answerable components.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // ICH Score — Intracerebral Hemorrhage Score
  // Hemphill JC et al. Stroke. 2001;32(4):891-897
  // Predicts 30-day mortality; 5 published components; max 6 points
  // GCS decomposed into Eye/Verbal/Motor sub-components (Teasdale & Jennett 1974)
  // for interactive assessment. Algorithm maps E+V+M → GCS total → ICH points.
  // ---------------------------------------------------------------------------
  {
    id: 'ich_score',
    name: 'ICH Score',
    fullName: 'ICH Score (Intracerebral Hemorrhage)',
    category: 'NEUROLOGY',
    application:
      'Predicts 30-day mortality in spontaneous intracerebral hemorrhage (ICH). Simple bedside tool for prognosis discussion and goals-of-care conversations. Not intended as sole determinant of treatment intensity.',
    applicableChiefComplaints: [
      'altered_mental_status',
      'focal_neurological_deficit',
      'intracerebral_hemorrhage',
      'headache',
    ],
    keywords: [
      'ICH score',
      'intracerebral hemorrhage',
      'ICH',
      'mortality',
      'GCS',
      'intraventricular hemorrhage',
      'prognosis',
      'ABC/2',
    ],
    requiredTests: ['CT head non-contrast'],
    components: [
      // GCS decomposed into sub-components per Teasdale & Jennett (Lancet 1974).
      // Algorithm: sum E+V+M → GCS total → ICH points (3-4=2, 5-12=1, 13-15=0).
      {
        id: 'gcs_eye',
        label: 'GCS — Eye Opening (E)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'E1 — No eye opening', value: 1 },
          { label: 'E2 — Eye opening to pain', value: 2 },
          { label: 'E3 — Eye opening to voice', value: 3 },
          { label: 'E4 — Spontaneous eye opening', value: 4 },
        ],
      },
      {
        id: 'gcs_verbal',
        label: 'GCS — Verbal Response (V)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'V1 — No verbal response', value: 1 },
          { label: 'V2 — Incomprehensible sounds', value: 2 },
          { label: 'V3 — Inappropriate words', value: 3 },
          { label: 'V4 — Confused', value: 4 },
          { label: 'V5 — Oriented', value: 5 },
        ],
      },
      {
        id: 'gcs_motor',
        label: 'GCS — Motor Response (M)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'M1 — No motor response', value: 1 },
          { label: 'M2 — Extension to pain (decerebrate)', value: 2 },
          { label: 'M3 — Abnormal flexion to pain (decorticate)', value: 3 },
          { label: 'M4 — Withdrawal from pain', value: 4 },
          { label: 'M5 — Localizing pain', value: 5 },
          { label: 'M6 — Obeys commands', value: 6 },
        ],
      },
      {
        id: 'age_gte_80',
        label: 'Age ≥80 years',
        type: 'boolean',
        source: 'section1',
        value: 1,
      },
      // Imaging components (section2) — not user-answerable in S1
      {
        id: 'ich_volume',
        label: 'ICH Volume (ABC/2 method on CT)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<30 mL', value: 0 },
          { label: '≥30 mL', value: 1 },
        ],
      },
      {
        id: 'ivh_presence',
        label: 'Intraventricular Hemorrhage (IVH) Present',
        type: 'boolean',
        source: 'section2',
        value: 1,
      },
      {
        id: 'infratentorial',
        label: 'ICH Origin: Infratentorial (brainstem or cerebellum)',
        type: 'boolean',
        source: 'section2',
        value: 1,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Very Low',
          interpretation:
            'ICH Score 0: ~0% 30-day mortality. Good prognosis. Aggressive care warranted. Neurosurgery consultation; blood pressure control; reverse anticoagulation if applicable.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low',
          interpretation:
            'ICH Score 1: ~13% 30-day mortality. Admit to ICU or stroke unit. Neurosurgery consultation. Early rehabilitation planning.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'ICH Score 2: ~26% 30-day mortality. ICU admission. Goals-of-care discussion with family. Neurosurgery consultation. Consider surgical intervention criteria (cerebellar hematoma ≥3 cm, or hydrocephalus with IVH).',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            'ICH Score 3: ~72% 30-day mortality. Urgent goals-of-care discussion. Comfort measures vs. aggressive care decision with family. Neurosurgery, neurocritical care consultations.',
        },
        {
          min: 4,
          max: 6,
          risk: 'Very High',
          interpretation:
            'ICH Score 4–6: 97–100% 30-day mortality. Very high short-term mortality. Immediate goals-of-care and family meeting. Early palliative care involvement. Avoid undertreating — self-fulfilling prophecy risk; individualize based on premorbid function and patient wishes.',
        },
      ],
    },
    suggestedTreatments: {
      'Very Low': [
        'neurosurgery_consult',
        'admit_neuro_ICU',
        'BP_target_SBP_130_to_140_per_AHA',
        'reverse_anticoagulation_if_applicable',
        'early_PT_OT_referral',
        'seizure_prophylaxis_consideration',
      ],
      Low: [
        'neurosurgery_consult',
        'admit_neuro_ICU',
        'BP_target_SBP_130_to_140',
        'reverse_anticoagulation_if_applicable',
        'seizure_prophylaxis_consideration',
        'goals_of_care_discussion',
      ],
      Moderate: [
        'neurosurgery_consult',
        'neurocritical_care_consult',
        'admit_neuro_ICU',
        'goals_of_care_discussion',
        'BP_management',
        'reverse_anticoagulation',
        'surgical_evaluation_cerebellar_or_IVH',
      ],
      High: [
        'urgent_goals_of_care_discussion',
        'palliative_care_consult',
        'neurosurgery_consult',
        'neurocritical_care_consult',
        'admit_neuro_ICU',
        'BP_management',
        'reverse_anticoagulation',
      ],
      'Very High': [
        'urgent_goals_of_care_and_family_meeting',
        'palliative_care_consult',
        'comfort_measures_vs_aggressive_care_decision',
        'neurosurgery_consult',
        'neurocritical_care_consult',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // FOUR Score — Full Outline of UnResponsiveness
  // Wijdicks EF et al. Mayo Clin Proc. 2005;80(9):1233-1241
  // 4 domains (Eye, Motor, Brainstem, Respiration), each 0–4; total 0–16
  // Advantage over GCS: usable in intubated patients; detects brain death pattern
  // ---------------------------------------------------------------------------
  {
    id: 'four_score',
    name: 'FOUR Score',
    fullName: 'FOUR Score (Full Outline of UnResponsiveness)',
    category: 'NEUROLOGY',
    application:
      'Alternative to GCS for comatose and critically ill patients, especially those who are intubated (verbal component of GCS cannot be assessed). Evaluates eye responses, motor responses, brainstem reflexes, and respiratory pattern. FOUR Score of 0 may indicate brain death.',
    applicableChiefComplaints: [
      'altered_mental_status',
      'coma',
      'decreased_consciousness',
      'intubated_patient',
    ],
    keywords: [
      'FOUR score',
      'coma',
      'GCS',
      'Glasgow Coma Scale',
      'brainstem',
      'intubated',
      'unresponsive',
      'brain death',
    ],
    components: [
      {
        id: 'eye_response',
        label: 'E — Eye Response',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'E4 — Eyelids open or opened, tracking or blinking to command',
            value: 4,
          },
          {
            label: 'E3 — Eyelids open but not tracking',
            value: 3,
          },
          {
            label: 'E2 — Eyelids closed but open to loud voice',
            value: 2,
          },
          {
            label: 'E1 — Eyelids closed but open to pain',
            value: 1,
          },
          {
            label: 'E0 — Eyelids remain closed with pain',
            value: 0,
          },
        ],
      },
      {
        id: 'motor_response',
        label: 'M — Motor Response (best upper limb)',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'M4 — Thumbs-up, fist, or peace sign to command',
            value: 4,
          },
          {
            label: 'M3 — Localizing to pain (hand moves above clavicle to noxious stimulation)',
            value: 3,
          },
          {
            label: 'M2 — Flexion response to pain',
            value: 2,
          },
          {
            label: 'M1 — Extension response to pain',
            value: 1,
          },
          {
            label: 'M0 — No response to pain, or generalized myoclonus status',
            value: 0,
          },
        ],
      },
      {
        id: 'brainstem_reflexes',
        label: 'B — Brainstem Reflexes',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'B4 — Pupil and corneal reflexes present',
            value: 4,
          },
          {
            label: 'B3 — One pupil wide and fixed',
            value: 3,
          },
          {
            label: 'B2 — Pupil OR corneal reflexes absent',
            value: 2,
          },
          {
            label: 'B1 — Pupil AND corneal reflexes absent',
            value: 1,
          },
          {
            label: 'B0 — Absent pupil, corneal, AND cough reflexes',
            value: 0,
          },
        ],
      },
      {
        id: 'respiration',
        label: 'R — Respiration Pattern',
        type: 'select',
        source: 'section1',
        options: [
          {
            label: 'R4 — Not intubated, regular breathing pattern',
            value: 4,
          },
          {
            label: 'R3 — Not intubated, Cheyne-Stokes breathing pattern',
            value: 3,
          },
          {
            label: 'R2 — Not intubated, irregular breathing',
            value: 2,
          },
          {
            label: 'R1 — Intubated, breathing above ventilator rate',
            value: 1,
          },
          {
            label: 'R0 — Intubated, breathing at ventilator rate or apnea',
            value: 0,
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
          risk: 'Critical — Possible Brain Death',
          interpretation:
            'FOUR Score 0 (E0M0B0R0): All domains absent. Pattern consistent with brain death. Formal brain death evaluation per institutional protocol required (apnea test, confirmatory testing). Neurology or neurocritical care consultation urgent. Goals-of-care discussion with surrogate decision-maker.',
        },
        {
          min: 1,
          max: 7,
          risk: 'Severe Impairment',
          interpretation:
            'Severe coma or profound neurological impairment. Brainstem reflexes and respiratory drive evaluation critical. ICU-level care. Neurology/neurosurgery/neurocritical care consultation. Serial FOUR Score assessments for trend monitoring.',
        },
        {
          min: 8,
          max: 12,
          risk: 'Moderate Impairment',
          interpretation:
            'Moderate impairment. Serial FOUR Score useful for tracking trajectory. Assess for treatable causes (metabolic, toxic, infectious). Brainstem function partially preserved — assess for locked-in syndrome if E3–E4 with low motor score.',
        },
        {
          min: 13,
          max: 16,
          risk: 'Mild Impairment or Normal',
          interpretation:
            'Mild or no coma. If E4 (eye tracking) with low motor score, consider locked-in syndrome (basilar artery occlusion). FOUR Score 16 = normal. Use for trending clinical trajectory in monitored settings.',
        },
      ],
    },
    suggestedTreatments: {
      'Critical — Possible Brain Death': [
        'neurology_or_neurocritical_care_consult_urgent',
        'formal_brain_death_evaluation',
        'goals_of_care_discussion_with_surrogate',
        'palliative_care_consult',
        'organ_procurement_referral_if_appropriate',
        'maintain_physiologic_support_during_evaluation',
      ],
      'Severe Impairment': [
        'admit_neuro_ICU',
        'neurology_or_neurosurgery_consult',
        'airway_management',
        'treat_reversible_causes',
        'serial_FOUR_score_monitoring',
        'goals_of_care_discussion',
        'ICP_monitoring_if_indicated',
      ],
      'Moderate Impairment': [
        'admit_ICU_or_step_down',
        'neurology_consult',
        'metabolic_and_toxic_workup',
        'EEG_if_nonconvulsive_seizure_suspected',
        'serial_FOUR_score_monitoring',
        'physical_and_occupational_therapy_early',
      ],
      'Mild Impairment or Normal': [
        'neurology_consult',
        'consider_locked_in_syndrome_if_eye_tracking_with_low_motor',
        'MRI_brain_if_etiology_unclear',
        'serial_neurological_exams',
      ],
    },
  },
]
