import type { CdrSeed } from './types'

/**
 * Batch 11 — Neurology, Trauma & GI CDRs
 *
 * Covers: STESS, ASPECTS, Modified Rankin Scale, CHALICE Rule, NEXUS Chest CT,
 *         NEXUS Chest X-Ray, TASH Score, BIG Score, Oakland Score, PAS
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published EM literature.
 *
 * Sources:
 *  - STESS: Rossetti et al., J Neurol 2006; 253:1374–1379
 *  - ASPECTS: Barber et al., Lancet 2000; 355:1670–1674
 *  - Modified Rankin Scale: van Swieten et al., Stroke 1988; 19:604–607
 *  - CHALICE: Dunning et al., Arch Dis Child 2006; 91:885–891
 *  - NEXUS Chest CT: Rodriguez et al., J Trauma 2008; 64:943–952
 *  - NEXUS Chest X-Ray: Rodriguez et al., J Trauma 2006; 60:508–514
 *  - TASH Score: Yucel et al., J Trauma 2006; 60:1228–1237
 *  - BIG Score: Borgman et al., Pediatrics 2011; 127(4):e895–e901
 *  - Oakland Score: Oakland et al., Gut 2017; 66:1441–1449
 *  - PAS: Samuel, J Pediatr Surg 2002; 37(6):877–881
 */

export const batch11NeuroTraumaCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // STESS — Status Epilepticus Severity Score
  // Rossetti et al., J Neurol 2006
  // 4 components: consciousness, seizure type, age, prior seizure history
  // Sum-based, max score = 6
  // ---------------------------------------------------------------------------
  {
    id: 'stess',
    name: 'STESS',
    fullName: 'Status Epilepticus Severity Score (STESS)',
    category: 'NEUROLOGY',
    application: 'Predicts outcomes (return to baseline) in patients with status epilepticus.',
    applicableChiefComplaints: ['seizure', 'status_epilepticus', 'altered_mental_status'],
    keywords: ['STESS', 'status epilepticus', 'seizure', 'outcome', 'prognosis', 'consciousness', 'nonconvulsive'],
    components: [
      {
        id: 'consciousness',
        label: 'Level of consciousness at presentation',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Alert or somnolent/confused', value: 0 },
          { label: 'Stuporous or comatose', value: 1 },
        ],
      },
      {
        id: 'worst_seizure_type',
        label: 'Worst seizure type',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Simple partial / complex partial / absence / myoclonic', value: 0 },
          { label: 'Generalized convulsive', value: 1 },
          { label: 'Nonconvulsive SE in coma', value: 2 },
        ],
      },
      {
        id: 'age_stess',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<65 years', value: 0 },
          { label: '≥65 years', value: 2 },
        ],
      },
      {
        id: 'prior_seizure_history',
        label: 'History of prior seizures',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Yes (known epilepsy or prior seizures)', value: 0 },
          { label: 'No (first seizure / no seizure history)', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Favorable', interpretation: 'Return to baseline neurological status likely' },
        { min: 3, max: 6, risk: 'Unfavorable', interpretation: 'Higher mortality and poor functional outcome expected' },
      ],
    },
    suggestedTreatments: {
      Unfavorable: ['icu_admission', 'continuous_eeg_monitoring', 'neurology_consult', 'aggressive_antiepileptic_therapy'],
      Favorable: ['benzodiazepine_protocol', 'neurology_consult', 'eeg_monitoring'],
    },
  },

  // ---------------------------------------------------------------------------
  // ASPECTS — QUARANTINED: All 10 components are CT imaging (section2).
  // See _quarantine/aspects.ts
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Modified Rankin Scale — QUARANTINED: Single-item ordinal scale, cannot
  // decompose into 3+ additive components. See _quarantine/modified_rankin.ts
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // CHALICE Rule — Children's Head Injury Algorithm for Important Clinical Events
  // Dunning et al., Arch Dis Child 2006
  // 14 binary criteria across history, examination, and mechanism
  // Threshold-based: any positive = CT indicated
  // ---------------------------------------------------------------------------
  {
    id: 'chalice_rule',
    name: 'CHALICE',
    fullName: 'CHALICE Rule (Children\'s Head injury ALgorithm for the prediction of Important Clinical Events)',
    category: 'TRAUMA',
    application: 'UK-derived rule for children (<16 years) presenting with any severity of head injury (not limited to GCS 13–15).',
    applicableChiefComplaints: ['pediatric_head_trauma', 'head_injury', 'pediatric_loss_of_consciousness'],
    keywords: ['CHALICE', 'children head injury algorithm', 'pediatric head CT', 'UK head injury rule', 'CT head child', 'non-accidental injury'],
    components: [
      // --- History criteria ---
      {
        id: 'witnessed_loc',
        label: 'History: Witnessed loss of consciousness lasting >5 minutes',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'amnesia_anterograde_retrograde',
        label: 'History: Amnesia (anterograde or retrograde) lasting >5 minutes',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'abnormal_drowsiness',
        label: 'History: Abnormal drowsiness (excess for that child)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'three_or_more_vomiting',
        label: 'History: ≥3 discrete episodes of vomiting after head injury',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'suspicion_nai',
        label: 'History: Suspicion of non-accidental injury (NAI)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'seizure_no_epilepsy',
        label: 'History: Post-traumatic seizure (no history of epilepsy)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      // --- Examination criteria ---
      {
        id: 'gcs_lt_14',
        label: 'Exam: GCS <14, or GCS <15 if <1 year old',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'focal_neurological_deficit',
        label: 'Exam: Focal neurological deficit',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'signs_basal_skull_fracture',
        label: 'Exam: Signs of basal skull fracture (hemotympanum, panda eyes, CSF otorrhea/rhinorrhea, Battle\'s sign)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'tense_fontanelle',
        label: 'Exam: Tense fontanelle (if <1 year old)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'positive_bruise_swelling_laceration',
        label: 'Exam: Bruise, swelling, or laceration >5 cm (if <1 year old)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      // --- Mechanism criteria ---
      {
        id: 'high_speed_rta',
        label: 'Mechanism: High-speed road traffic accident (>40 mph / pedestrian / bicycle vs. vehicle)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'fall_gt_3m',
        label: 'Mechanism: Fall of >3 meters in height',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'high_speed_projectile',
        label: 'Mechanism: High-speed injury from projectile or object',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — CT not required (sensitivity 98% for clinically significant intracranial pathology)' },
        { min: 1, max: 14, risk: 'High', interpretation: 'Any criterion present — CT indicated' },
      ],
    },
    suggestedTreatments: {
      High: ['stat_ct_head', 'neurosurgery_consult_if_abnormal', 'pediatric_observation'],
      Low: ['observation_period', 'discharge_with_head_injury_precautions', 'return_precautions_given'],
    },
  },

  // ---------------------------------------------------------------------------
  // NEXUS Chest CT Rule
  // Rodriguez et al., J Trauma 2008
  // 8 binary criteria for chest CT after blunt trauma
  // Threshold-based: any positive = CT indicated
  // ---------------------------------------------------------------------------
  {
    id: 'nexus_chest_ct',
    name: 'NEXUS Chest CT',
    fullName: 'NEXUS Chest CT Rule',
    category: 'TRAUMA',
    application: 'Identifies blunt trauma patients who require chest CT.',
    applicableChiefComplaints: ['chest_trauma', 'blunt_trauma', 'chest_pain_trauma', 'mvc'],
    keywords: ['NEXUS chest CT', 'chest CT trauma', 'blunt trauma chest', 'mediastinum widened', 'chest wall tenderness', 'sternal tenderness'],
    components: [
      {
        id: 'abnormal_cxr',
        label: 'Abnormal chest X-ray (any finding: widened mediastinum, pneumothorax, hemothorax, rib fracture, etc.)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'distracting_injury',
        label: 'Distracting injury (clinically significant long bone fracture, pelvic fracture, visceral injury, large laceration, crush injury, or severe burns)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'chest_wall_tenderness',
        label: 'Chest wall tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'sternal_tenderness',
        label: 'Sternal tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'thoracic_spine_tenderness',
        label: 'Thoracic spine tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'scapular_tenderness',
        label: 'Scapular tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'rapid_deceleration',
        label: 'Mechanism: Rapid deceleration (fall >20 feet, MVC >40 mph)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'intubated_nexus',
        label: 'Patient is intubated or has altered mental status (not amenable to exam)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent — Chest CT not indicated (sensitivity ~99%)' },
        { min: 1, max: 8, risk: 'High', interpretation: 'Any criterion present — Chest CT indicated' },
      ],
    },
    suggestedTreatments: {
      High: ['chest_ct_with_contrast', 'trauma_surgery_consult', 'serial_assessment'],
      Low: ['observation', 'discharge_if_no_other_injuries'],
    },
  },

  // ---------------------------------------------------------------------------
  // NEXUS Chest X-Ray Rule
  // Rodriguez et al., J Trauma 2006
  // 7 binary criteria for CXR after blunt trauma
  // Threshold-based: any positive = CXR indicated
  // ---------------------------------------------------------------------------
  {
    id: 'nexus_chest_xray',
    name: 'NEXUS Chest X-Ray',
    fullName: 'NEXUS Chest X-Ray Rule',
    category: 'TRAUMA',
    application: 'Identifies blunt trauma patients who require chest radiography.',
    applicableChiefComplaints: ['chest_trauma', 'blunt_trauma', 'chest_pain_trauma'],
    keywords: ['NEXUS chest x-ray', 'CXR trauma', 'blunt trauma chest radiograph', 'chest tenderness', 'chest radiography decision'],
    components: [
      {
        id: 'chest_pain_cxr',
        label: 'Chest pain',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'chest_wall_tenderness_cxr',
        label: 'Chest wall tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'sternal_tenderness_cxr',
        label: 'Sternal tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'thoracic_spine_tenderness_cxr',
        label: 'Thoracic spine tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'scapular_tenderness_cxr',
        label: 'Scapular tenderness on palpation',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'diaphragm_tenderness_cxr',
        label: 'Diaphragm tenderness (anterior costal margin)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'rapid_deceleration_cxr',
        label: 'Mechanism: Rapid deceleration (fall >20 feet, MVC >40 mph)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent — CXR not indicated' },
        { min: 1, max: 7, risk: 'High', interpretation: 'Any criterion present — CXR indicated' },
      ],
    },
    suggestedTreatments: {
      High: ['chest_xray', 'consider_chest_ct_if_abnormal', 'trauma_evaluation'],
      Low: ['observation', 'discharge_if_no_other_injuries'],
    },
  },

  // ---------------------------------------------------------------------------
  // TASH Score — Trauma-Associated Severe Hemorrhage
  // Yucel et al., J Trauma 2006
  // Sum-based, weighted criteria: SBP, Hb, FAST, fractures, HR, base excess, sex
  // Max score = 28 (SBP 0-4, Hb 0-8, FAST 0-3, pelvic Fx 0-6, femur Fx 0-3, HR 0-2, base excess 0-1, sex 0-1)
  // ---------------------------------------------------------------------------
  {
    id: 'tash_score',
    name: 'TASH Score',
    fullName: 'TASH Score (Trauma-Associated Severe Hemorrhage)',
    category: 'TRAUMA',
    application: 'Predicts probability of massive transfusion in trauma using clinical and laboratory variables.',
    applicableChiefComplaints: ['major_trauma', 'hemorrhage', 'shock', 'pelvic_fracture'],
    keywords: ['TASH', 'trauma associated severe hemorrhage', 'massive transfusion prediction', 'hemoglobin trauma', 'base excess', 'pelvic fracture hemorrhage', 'femur fracture trauma'],
    requiredTests: ['hemoglobin/hematocrit', 'base excess/blood gas', 'FAST exam'],
    components: [
      {
        id: 'sbp',
        label: 'Systolic blood pressure',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vitals',
        options: [
          { label: 'SBP ≥120 mmHg', value: 0 },
          { label: 'SBP 100–119 mmHg', value: 1 },
          { label: 'SBP <100 mmHg', value: 4 },
        ],
      },
      {
        id: 'hemoglobin',
        label: 'Hemoglobin level',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Hb ≥12 g/dL', value: 0 },
          { label: 'Hb <12 g/dL', value: 2 },
          { label: 'Hb <11 g/dL', value: 3 },
          { label: 'Hb <10 g/dL', value: 4 },
          { label: 'Hb <9 g/dL', value: 6 },
          { label: 'Hb <7 g/dL', value: 8 },
        ],
      },
      {
        id: 'fast_positive',
        label: 'FAST exam positive (free intraperitoneal fluid)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 3,
      },
      {
        id: 'pelvic_fracture',
        label: 'Clinically unstable pelvic fracture',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 6,
      },
      {
        id: 'femur_fracture',
        label: 'Open or displaced femur fracture',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 3,
      },
      {
        id: 'heart_rate_tash',
        label: 'Heart rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vitals',
        options: [
          { label: 'HR <120 bpm', value: 0 },
          { label: 'HR ≥120 bpm', value: 2 },
        ],
      },
      {
        id: 'base_excess',
        label: 'Base excess',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Base excess ≥ -2 mmol/L', value: 0 },
          { label: 'Base excess < -2 mmol/L', value: 1 },
          { label: 'Base excess < -6 mmol/L', value: 3 },
          { label: 'Base excess < -10 mmol/L', value: 4 },
        ],
      },
      {
        id: 'sex_male',
        label: 'Male sex',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Low', interpretation: 'Score <10: <5% probability of massive transfusion' },
        { min: 10, max: 14, risk: 'Moderate', interpretation: 'Score 10–14: 10–20% probability of massive transfusion' },
        { min: 15, max: 18, risk: 'High', interpretation: 'Score 15–18: 30–50% probability of massive transfusion' },
        { min: 19, max: 31, risk: 'Very High', interpretation: 'Score >18: >50% probability; Score ≥27: ~100%' },
      ],
    },
    suggestedTreatments: {
      'Very High': ['activate_massive_transfusion_protocol', 'type_o_negative_blood', 'trauma_surgery_stat', 'icu_admission'],
      High: ['massive_transfusion_protocol', 'trauma_surgery_consult', 'type_and_crossmatch', 'icu_admission'],
      Moderate: ['type_and_crossmatch', 'trauma_surgery_consult', 'serial_hematocrit', 'close_monitoring'],
      Low: ['type_and_screen', 'serial_assessment', 'standard_resuscitation'],
    },
  },

  // ---------------------------------------------------------------------------
  // BIG Score — Pediatric Trauma Mortality
  // Borgman et al., Pediatrics 2011
  // Formula: BIG = (base deficit) + (2.5 × INR) + (15 − GCS)
  // GCS decomposed into Eye + Verbal + Motor sub-scales (Teasdale & Jennett 1974)
  // since 15 − GCS = (4−E) + (5−V) + (6−M), which is mathematically equivalent.
  // This gives 3 user-answerable section1 components instead of 1.
  // ---------------------------------------------------------------------------
  {
    id: 'big_score',
    name: 'BIG Score',
    fullName: 'BIG Score (Pediatric Trauma Mortality)',
    category: 'TRAUMA',
    application: 'Predicts mortality in pediatric trauma using three simple variables: Base deficit, INR, and GCS.',
    applicableChiefComplaints: ['pediatric_trauma', 'major_trauma', 'pediatric_shock'],
    keywords: ['BIG score', 'pediatric trauma mortality', 'base deficit', 'INR trauma', 'GCS trauma', 'pediatric trauma score'],
    requiredTests: ['base deficit (blood gas)', 'INR/PT', 'GCS'],
    components: [
      {
        id: 'base_deficit_big',
        label: 'Base deficit (absolute value, mEq/L)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Base deficit 0–2 (normal)', value: 1 },
          { label: 'Base deficit 3–5 (mild)', value: 4 },
          { label: 'Base deficit 6–9 (moderate)', value: 8 },
          { label: 'Base deficit 10–14 (severe)', value: 12 },
          { label: 'Base deficit ≥15 (critical)', value: 17 },
        ],
      },
      {
        id: 'inr_big',
        label: 'INR (International Normalized Ratio)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'INR ≤1.0 (normal)', value: 3 },
          { label: 'INR 1.1–1.5', value: 4 },
          { label: 'INR 1.6–2.0', value: 5 },
          { label: 'INR 2.1–3.0', value: 7 },
          { label: 'INR 3.1–4.0', value: 9 },
          { label: 'INR >4.0', value: 12 },
        ],
      },
      // GCS decomposed: 15 − GCS = (4−Eye) + (5−Verbal) + (6−Motor)
      // Each sub-scale is a bedside clinical assessment (section1)
      {
        id: 'gcs_eye',
        label: 'GCS — Eye Opening (Teasdale & Jennett)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'E4 — Spontaneous eye opening', value: 0 },
          { label: 'E3 — Eye opening to voice', value: 1 },
          { label: 'E2 — Eye opening to pain', value: 2 },
          { label: 'E1 — No eye opening', value: 3 },
        ],
      },
      {
        id: 'gcs_verbal',
        label: 'GCS — Verbal Response (Teasdale & Jennett)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'V5 — Oriented', value: 0 },
          { label: 'V4 — Confused', value: 1 },
          { label: 'V3 — Inappropriate words', value: 2 },
          { label: 'V2 — Incomprehensible sounds', value: 3 },
          { label: 'V1 — No verbal response', value: 4 },
        ],
      },
      {
        id: 'gcs_motor',
        label: 'GCS — Motor Response (Teasdale & Jennett)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'M6 — Obeys commands', value: 0 },
          { label: 'M5 — Localizes pain', value: 1 },
          { label: 'M4 — Withdraws from pain (flexion)', value: 2 },
          { label: 'M3 — Abnormal flexion (decorticate)', value: 3 },
          { label: 'M2 — Extension (decerebrate)', value: 4 },
          { label: 'M1 — No motor response', value: 5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Low', interpretation: 'BIG <10: <5% predicted mortality' },
        { min: 10, max: 15, risk: 'Moderate', interpretation: 'BIG 10–15: ~10% predicted mortality' },
        { min: 16, max: 25, risk: 'High', interpretation: 'BIG 16–25: ~30% predicted mortality' },
        { min: 26, max: 35, risk: 'Very High', interpretation: 'BIG 26–35: ~60% predicted mortality' },
        { min: 36, max: 41, risk: 'Critical', interpretation: 'BIG >35: >80% predicted mortality' },
      ],
    },
    suggestedTreatments: {
      Critical: ['icu_admission', 'massive_transfusion_protocol', 'pediatric_trauma_surgery_stat', 'goals_of_care_discussion'],
      'Very High': ['icu_admission', 'pediatric_trauma_surgery_consult', 'aggressive_resuscitation', 'blood_products'],
      High: ['icu_admission', 'pediatric_trauma_surgery_consult', 'close_monitoring', 'serial_labs'],
      Moderate: ['pediatric_trauma_consult', 'serial_labs', 'close_monitoring'],
      Low: ['serial_assessment', 'standard_pediatric_trauma_care'],
    },
  },

  // ---------------------------------------------------------------------------
  // Oakland Score — Lower GI Bleeding
  // Oakland et al., Gut 2017
  // 7 weighted criteria: age, sex, prior LGIB admission, DRE findings, HR, SBP, Hb
  // Sum-based, max score = 29
  // ---------------------------------------------------------------------------
  {
    id: 'oakland',
    name: 'Oakland Score',
    fullName: 'Oakland Score',
    category: 'GASTROINTESTINAL',
    application: 'Risk stratifies lower GI bleeding for safe discharge.',
    applicableChiefComplaints: ['lower_gi_bleeding', 'rectal_bleeding', 'hematochezia'],
    keywords: ['Oakland score', 'lower GI bleed', 'LGIB', 'hematochezia', 'rectal bleeding', 'discharge', 'risk stratification'],
    requiredTests: ['hemoglobin', 'heart rate', 'blood pressure'],
    components: [
      {
        id: 'age_oakland',
        label: 'Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<40 years', value: 0 },
          { label: '40–69 years', value: 1 },
          { label: '≥70 years', value: 2 },
        ],
      },
      {
        id: 'sex_oakland',
        label: 'Sex',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Female', value: 0 },
          { label: 'Male', value: 1 },
        ],
      },
      {
        id: 'previous_lgib_admission',
        label: 'Previous hospital admission with lower GI bleeding',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'dre_findings',
        label: 'Digital rectal exam findings',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        options: [
          { label: 'No blood on DRE', value: 0 },
          { label: 'Blood on DRE', value: 1 },
        ],
      },
      {
        id: 'heart_rate_oakland',
        label: 'Heart rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vitals',
        options: [
          { label: 'HR <70 bpm', value: 0 },
          { label: 'HR 70–89 bpm', value: 1 },
          { label: 'HR 90–109 bpm', value: 2 },
          { label: 'HR ≥110 bpm', value: 3 },
        ],
      },
      {
        id: 'sbp_oakland',
        label: 'Systolic blood pressure',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vitals',
        options: [
          { label: 'SBP ≥160 mmHg', value: 0 },
          { label: 'SBP 130–159 mmHg', value: 1 },
          { label: 'SBP 120–129 mmHg', value: 2 },
          { label: 'SBP 90–119 mmHg', value: 3 },
          { label: 'SBP <90 mmHg', value: 5 },
        ],
      },
      {
        id: 'hemoglobin_oakland',
        label: 'Hemoglobin level',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'Hb ≥16.0 g/dL', value: 0 },
          { label: 'Hb 13.0–15.9 g/dL', value: 4 },
          { label: 'Hb 11.0–12.9 g/dL', value: 8 },
          { label: 'Hb 9.0–10.9 g/dL', value: 13 },
          { label: 'Hb 7.0–8.9 g/dL', value: 17 },
          { label: 'Hb <7.0 g/dL', value: 22 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 8, risk: 'Low', interpretation: 'Score ≤8: Safe for outpatient management (95% probability of safe discharge)' },
        { min: 9, max: 10, risk: 'Low-Moderate', interpretation: 'Score 9–10: ~90% probability safe discharge; consider outpatient management' },
        { min: 11, max: 14, risk: 'Moderate', interpretation: 'Score 11–14: Consider inpatient observation; ~75–85% safe discharge probability' },
        { min: 15, max: 20, risk: 'High', interpretation: 'Score 15–20: Admit for observation and workup; significant rebleed risk' },
        { min: 21, max: 35, risk: 'Very High', interpretation: 'Score >20: High risk; inpatient management with possible intervention required' },
      ],
    },
    suggestedTreatments: {
      'Very High': ['admission', 'gi_consult', 'type_and_crossmatch', 'colonoscopy_when_stable', 'transfusion_if_indicated'],
      High: ['admission', 'gi_consult', 'serial_hemoglobin', 'type_and_crossmatch'],
      Moderate: ['observation', 'serial_hemoglobin', 'gi_consult', 'outpatient_colonoscopy'],
      'Low-Moderate': ['consider_discharge', 'outpatient_colonoscopy', 'return_precautions'],
      Low: ['discharge_with_follow_up', 'outpatient_colonoscopy', 'return_precautions'],
    },
  },

  // ---------------------------------------------------------------------------
  // PAS — Pediatric Appendicitis Score
  // Samuel, J Pediatr Surg 2002
  // 8 criteria, some binary (1 pt) and some weighted (2 pts)
  // Sum-based, max score = 10
  // ---------------------------------------------------------------------------
  {
    id: 'pas_appendicitis',
    name: 'PAS',
    fullName: 'Pediatric Appendicitis Score (PAS)',
    category: 'GASTROINTESTINAL',
    application: 'Appendicitis prediction in children (3–18 years).',
    applicableChiefComplaints: ['right_lower_quadrant_pain', 'abdominal_pain', 'appendicitis', 'pediatric_abdominal_pain'],
    keywords: ['PAS', 'pediatric appendicitis score', 'appendicitis', 'children', 'pediatric', 'RLQ pain', 'leukocytosis', 'neutrophilia'],
    requiredTests: ['WBC', 'ANC'],
    components: [
      {
        id: 'rlq_tenderness',
        label: 'Right lower quadrant tenderness to cough, hopping, or percussion',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 2,
      },
      {
        id: 'anorexia',
        label: 'Anorexia',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'fever_pas',
        label: 'Fever (temperature ≥38°C / 100.4°F)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'vitals',
        value: 1,
      },
      {
        id: 'nausea_vomiting',
        label: 'Nausea or vomiting',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'rlq_tenderness_palpation',
        label: 'Tenderness over right iliac fossa (direct RLQ palpation)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 2,
      },
      {
        id: 'migration_of_pain',
        label: 'Migration of pain to right lower quadrant',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'leukocytosis_pas',
        label: 'Leukocytosis (WBC >10,000/μL)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'left_shift',
        label: 'Neutrophilia / left shift (ANC >7,500/μL)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Very Low', interpretation: 'Appendicitis very unlikely; discharge with return precautions' },
        { min: 3, max: 6, risk: 'Equivocal', interpretation: 'Imaging recommended (ultrasound first in pediatrics)' },
        { min: 7, max: 10, risk: 'High', interpretation: 'Surgical consultation warranted' },
      ],
    },
    suggestedTreatments: {
      High: ['pediatric_surgery_consult', 'npo_status', 'iv_fluids', 'preoperative_antibiotics'],
      Equivocal: ['ultrasound_abdomen', 'serial_abdominal_exams', 'observation', 'surgical_consult_if_worsening'],
      'Very Low': ['discharge_with_return_precautions', 'outpatient_follow_up'],
    },
  },
]
