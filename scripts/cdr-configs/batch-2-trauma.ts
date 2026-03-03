import type { CdrSeed } from './types'

export const batch2TraumaCdrs: CdrSeed[] = [

  // =========================================================================
  // TRAUMA — Canadian CT Head Rule (CCHR)
  // Stiell et al. Lancet 2001; 357:1391-1396
  // Applies to adults ≥16 with minor head injury (GCS 13–15) + witnessed LOC,
  // amnesia, or disorientation. NOT for: anticoagulants, age <16, no LOC/amnesia.
  // 5 high-risk factors (for neurosurgical intervention) + 2 medium-risk factors
  // (for brain injury on CT). Any high-risk → CT. Any medium-risk → CT.
  // =========================================================================
  {
    id: 'canadian_ct_head',
    name: 'CCHR',
    fullName: 'Canadian CT Head Rule (CCHR)',
    category: 'TRAUMA',
    application: 'Determines if CT is needed in patients with minor head injury (GCS 13–15, witnessed LOC, amnesia, or disorientation). NOT for patients on anticoagulants, age <16, or with no LOC/amnesia/disorientation.',
    applicableChiefComplaints: ['head_trauma', 'head_injury', 'loss_of_consciousness', 'altered_mental_status'],
    keywords: ['canadian ct head rule', 'CCHR', 'head CT', 'minor head injury', 'GCS', 'LOC', 'skull fracture', 'CT head decision'],
    requiredTests: ['ct_head'],
    components: [
      // HIGH-RISK criteria (for neurosurgical intervention)
      {
        id: 'gcs_lt_15_at_2h',
        label: 'GCS score <15 at 2 hours after injury',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'suspected_open_depressed_skull_fx',
        label: 'Suspected open or depressed skull fracture',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'any_sign_basal_skull_fx',
        label: 'Any sign of basal skull fracture (hemotympanum, "raccoon" eyes, cerebrospinal fluid oto/rhinorrhea, Battle\'s sign)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'vomiting_gte_2_episodes',
        label: 'Vomiting ≥2 episodes',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'age_gte_65',
        label: 'Age ≥65 years',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      // MEDIUM-RISK criteria (for brain injury on CT, not necessarily neurosurgical)
      {
        id: 'amnesia_before_impact_gte_30min',
        label: 'Amnesia before impact ≥30 minutes',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'dangerous_mechanism',
        label: 'Dangerous mechanism (pedestrian struck by motor vehicle, occupant ejected from motor vehicle, fall from >3 feet or 5 stairs)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria met — CT not required. Low risk of significant intracranial injury.' },
        { min: 1, max: 5, risk: 'High', interpretation: 'High-risk criterion present — CT indicated to rule out neurosurgical intervention.' },
        { min: 6, max: 7, risk: 'Intermediate', interpretation: 'Medium-risk criterion present — CT indicated to detect brain injury. No high-risk criteria.' },
      ],
    },
    suggestedTreatments: {
      High: ['stat_ct_head', 'neurosurgery_consult', 'admit_for_observation'],
      Intermediate: ['ct_head', 'neurology_consult_if_abnormal', 'observation_period'],
      Low: ['discharge_with_head_injury_precautions', 'return_precautions_given'],
    },
  },

  // =========================================================================
  // TRAUMA — NEXUS Head CT Rule
  // Mower et al. Ann Emerg Med 1996; Mower et al. J Trauma 2005
  // 8 criteria for blunt head trauma in adults ≥16.
  // Sensitivity ~99% for clinically significant intracranial injury.
  // CT required if ANY criterion is present.
  // =========================================================================
  {
    id: 'nexus_head_ct',
    name: 'NEXUS Head CT',
    fullName: 'NEXUS Head CT Rule',
    category: 'TRAUMA',
    application: 'Decision instrument for CT after blunt head trauma. Age ≥16. Applied to patients with blunt head trauma.',
    applicableChiefComplaints: ['head_trauma', 'head_injury', 'altered_mental_status'],
    keywords: ['NEXUS head CT', 'head CT rule', 'blunt head trauma', 'skull fracture', 'CT indication', 'neurological deficit'],
    requiredTests: ['ct_head'],
    components: [
      {
        id: 'evidence_skull_fracture',
        label: 'Evidence of skull fracture (palpable depression, hemotympanum, Battle\'s sign, periorbital ecchymosis, cerebrospinal fluid leak)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'scalp_hematoma',
        label: 'Scalp hematoma',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'neurological_deficit',
        label: 'Neurological deficit (any focal neurological finding on exam)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'altered_level_of_alertness',
        label: 'Altered level of alertness (GCS <15, combativeness, agitation, somnolence)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'abnormal_behavior',
        label: 'Abnormal behavior (agitation, confusion, combativeness)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'coagulopathy',
        label: 'Coagulopathy (anticoagulant use, known bleeding disorder, cirrhosis)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'age_gte_65_nexus',
        label: 'Age ≥65 years',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'vomiting_nexus',
        label: 'Vomiting',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All 8 criteria absent — CT not indicated. Sensitivity ~99% for clinically significant intracranial injury.' },
        { min: 1, max: 8, risk: 'High', interpretation: 'Any criterion present — CT head is indicated.' },
      ],
    },
    suggestedTreatments: {
      High: ['stat_ct_head', 'neurosurgery_consult_if_abnormal', 'observation'],
      Low: ['discharge_with_head_injury_precautions', 'return_precautions_given'],
    },
  },

  // =========================================================================
  // TRAUMA — CATCH Rule
  // Osmond et al. CMAJ 2010; 182(4):341-348
  // Pediatric head injury CT decision rule. Children 0–16 with minor head injury
  // (GCS 13–15) and LOC, disorientation, persistent vomiting, or irritability.
  // 4 high-risk + 3 medium-risk criteria.
  // High-risk: 100% sensitive for neurosurgical intervention.
  // =========================================================================
  {
    id: 'catch_rule',
    name: 'CATCH',
    fullName: 'CATCH Rule (Canadian Assessment of Tomography for Childhood Head Injury)',
    category: 'TRAUMA',
    application: 'CT decision for children (0–16 years) with minor head injury (GCS 13–15) and witnessed LOC, disorientation, irritability, or vomiting.',
    applicableChiefComplaints: ['pediatric_head_trauma', 'head_injury', 'pediatric_altered_mental_status'],
    keywords: ['CATCH', 'Canadian assessment tomography childhood', 'pediatric head CT', 'minor head injury child', 'CT head pediatric', 'skull fracture child'],
    requiredTests: ['ct_head'],
    components: [
      // HIGH-RISK criteria (100% sensitive for neurosurgical intervention)
      {
        id: 'gcs_lt_15_30min',
        label: 'GCS <15 at 2 hours after injury',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'suspected_open_depressed_fx_catch',
        label: 'Suspected open or depressed skull fracture',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'worsening_headache',
        label: 'History of worsening headache',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'irritability',
        label: 'Irritability on examination',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      // MEDIUM-RISK criteria (for any brain injury on CT)
      {
        id: 'basal_skull_fx_signs_catch',
        label: 'Sign of basal skull fracture (hemotympanum, "raccoon" eyes, otorrhea/rhinorrhea of CSF, Battle\'s sign)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'large_boggy_scalp_hematoma',
        label: 'Large boggy scalp hematoma',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'dangerous_mechanism_catch',
        label: 'Dangerous mechanism (MVC, fall from >3 feet or 5 stairs, fall from bicycle without helmet)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'None present — CT not required (high-risk sensitivity 100%, any-CT sensitivity 98.1%).' },
        { min: 1, max: 4, risk: 'High', interpretation: 'High-risk criterion present (GCS <15, suspected skull fracture, worsening headache, or irritability) — CT indicated for neurosurgical intervention.' },
        { min: 5, max: 7, risk: 'Intermediate', interpretation: 'Medium-risk criterion present (basal skull fracture sign, large boggy hematoma, dangerous mechanism) — CT indicated for brain injury on CT.' },
      ],
    },
    suggestedTreatments: {
      High: ['stat_ct_head', 'pediatric_neurosurgery_consult', 'admit_pediatric_ward'],
      Intermediate: ['ct_head', 'pediatric_observation', 'neurology_consult_if_abnormal'],
      Low: ['discharge_with_head_injury_precautions', 'return_precautions_given', 'parent_education'],
    },
  },

  // =========================================================================
  // TRAUMA — PECARN Blunt Abdominal Trauma Rule (Pediatric)
  // Holmes et al. Ann Emerg Med 2013; 61(2):107-116
  // Identifies children <18 with blunt torso trauma at very low risk of
  // intra-abdominal injury requiring acute intervention (IAI-AI).
  // 7 independent predictors; absence of ALL → <0.1% risk (very low).
  // =========================================================================
  {
    id: 'pecarn_abdominal',
    name: 'PECARN Abdominal',
    fullName: 'PECARN Blunt Abdominal Trauma Rule (Pediatric)',
    category: 'TRAUMA',
    application: 'Identifies children (<18 years) with blunt torso trauma at very low risk of intra-abdominal injury requiring acute intervention (IAI-AI). Helps guide CT decision-making.',
    applicableChiefComplaints: ['pediatric_abdominal_trauma', 'blunt_abdominal_trauma', 'mvc_pediatric'],
    keywords: ['PECARN abdominal', 'pediatric blunt abdominal trauma', 'IAI', 'intra-abdominal injury', 'pediatric CT abdomen', 'seatbelt sign', 'femur fracture'],
    requiredTests: ['liver enzymes (AST/ALT)', 'urinalysis', 'hematocrit', 'FAST exam'],
    components: [
      {
        id: 'gcs_lt_14',
        label: 'GCS <14 (altered mental status)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'abdominal_tenderness',
        label: 'Abdominal tenderness on exam',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'thoracic_wall_trauma',
        label: 'Evidence of thoracic wall trauma (rib fractures, decreased breath sounds, contusion)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'complaints_abdominal_pain',
        label: 'Complaint of abdominal pain',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'decreased_breath_sounds',
        label: 'Decreased or absent breath sounds',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'vomiting_pecarn_abd',
        label: 'Vomiting',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'femur_fracture',
        label: 'Femur fracture',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'None of 7 predictors present — very low risk of IAI-AI (<0.1%); CT abdomen/pelvis can generally be avoided. Consider observation.' },
        { min: 1, max: 2, risk: 'Low-Intermediate', interpretation: '1–2 predictors present — elevated risk. Consider FAST, labs (AST/ALT, UA, Hct). CT indicated if labs abnormal or FAST positive.' },
        { min: 3, max: 7, risk: 'High', interpretation: '≥3 predictors present — significant risk of IAI-AI. CT abdomen/pelvis with contrast indicated.' },
      ],
    },
    suggestedTreatments: {
      High: ['ct_abdomen_pelvis_contrast', 'trauma_surgery_consult', 'iv_access_fluid_resuscitation', 'npo'],
      'Low-Intermediate': ['fast_exam', 'ast_alt_labs', 'urinalysis', 'serial_abdominal_exams', 'ct_if_labs_abnormal'],
      'Very Low': ['observation_period', 'discharge_with_return_precautions'],
    },
  },

  // =========================================================================
  // TRAUMA — Ottawa Foot Rules
  // Stiell et al. JAMA 1992; 268(12):1576-1578
  // Radiograph indicated if midfoot pain AND any of the following.
  // Sensitivity >95% for midfoot fractures. Reduces unnecessary x-rays ~30%.
  // =========================================================================
  {
    id: 'ottawa_foot',
    name: 'Ottawa Foot',
    fullName: 'Ottawa Foot Rules',
    category: 'TRAUMA',
    application: 'Determines need for foot radiography in midfoot injuries. Applied when there is pain in the midfoot zone.',
    applicableChiefComplaints: ['foot_injury', 'foot_pain', 'midfoot_pain', 'ankle_injury'],
    keywords: ['Ottawa foot rules', 'foot x-ray', 'midfoot fracture', '5th metatarsal', 'navicular', 'foot radiograph decision'],
    requiredTests: ['foot_xray'],
    components: [
      {
        id: 'bone_tenderness_5th_metatarsal',
        label: 'Bone tenderness at base of 5th metatarsal (lateral midfoot)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'bone_tenderness_navicular',
        label: 'Bone tenderness at navicular (medial midfoot)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'unable_to_bear_weight_foot',
        label: 'Unable to bear weight both immediately after injury and in ED (4 steps)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'None present — radiograph not indicated. Sensitivity >95% for midfoot fracture. Treat as soft tissue injury.' },
        { min: 1, max: 3, risk: 'High', interpretation: 'Any criterion present — foot radiograph indicated. Significant risk of midfoot fracture (navicular or 5th metatarsal).' },
      ],
    },
    suggestedTreatments: {
      High: ['foot_xray_ap_lateral_oblique', 'orthopedic_referral_if_fracture', 'short_leg_cast_if_fracture', 'non_weight_bearing_instructions'],
      Low: ['soft_tissue_management', 'compression_ice_elevation', 'analgesia', 'return_precautions'],
    },
  },

  // =========================================================================
  // TRAUMA — Pittsburgh Knee Rules
  // Seaberg et al. Ann Emerg Med 1994; 23(3):536-541
  // More sensitive but less specific than Ottawa Knee Rules.
  // Apply to any acute knee injury (not limited by age unlike Ottawa).
  // Two mechanism criteria OR age criterion → radiograph indicated.
  // =========================================================================
  {
    id: 'pittsburgh_knee',
    name: 'Pittsburgh Knee',
    fullName: 'Pittsburgh Knee Rules',
    category: 'TRAUMA',
    application: 'Determines need for knee radiography in acute knee injury. Alternative to Ottawa Knee Rules; applies to all ages and any mechanism.',
    applicableChiefComplaints: ['knee_injury', 'knee_pain', 'knee_trauma'],
    keywords: ['Pittsburgh knee rules', 'knee x-ray', 'knee radiograph', 'knee fracture', 'weight bearing knee', 'knee injury decision'],
    requiredTests: ['knee_xray'],
    components: [
      {
        id: 'blunt_trauma_or_fall',
        label: 'Mechanism: blunt trauma or fall as mechanism of injury (vs. twisting alone)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'age_lt_12_or_gte_50',
        label: 'Age <12 or age ≥50 years',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'unable_to_bear_weight_knee',
        label: 'Unable to walk 4 weight-bearing steps in the emergency department',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria met — radiograph not indicated (sensitivity >99% for fracture when all absent). Manage as soft tissue injury.' },
        { min: 1, max: 3, risk: 'High', interpretation: 'Mechanism of blunt trauma/fall AND (age <12 or ≥50, OR inability to bear weight) → radiograph indicated.' },
      ],
    },
    suggestedTreatments: {
      High: ['knee_xray_ap_lateral', 'orthopedic_consult_if_fracture', 'immobilization_if_fracture', 'analgesia'],
      Low: ['soft_tissue_management', 'rice_therapy', 'analgesia', 'return_precautions'],
    },
  },

  // =========================================================================
  // TRAUMA — Shock Index (SI)
  // Allgower & Burri 1967; validated by multiple trauma studies
  // SI = Heart Rate / Systolic Blood Pressure
  // Normal ~0.5–0.7. SI ≥1.0 associated with significant hemorrhage.
  // Identifies occult shock when traditional vitals appear normal.
  // =========================================================================
  {
    id: 'shock_index',
    name: 'Shock Index',
    fullName: 'Shock Index',
    category: 'TRAUMA',
    application: 'Rapid bedside assessment of hemodynamic status. Identifies occult shock in trauma and hemorrhage before traditional vital signs are abnormal.',
    applicableChiefComplaints: ['trauma', 'hemorrhage', 'shock', 'hypotension', 'major_trauma'],
    keywords: ['shock index', 'SI', 'heart rate SBP ratio', 'occult shock', 'hemorrhagic shock', 'massive transfusion', 'hemodynamic instability'],
    components: [
      {
        id: 'heart_rate',
        label: 'Heart rate (bpm)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        options: [
          { label: '<60 (bradycardia)', value: 0 },
          { label: '60–79', value: 1 },
          { label: '80–99', value: 2 },
          { label: '100–119', value: 3 },
          { label: '≥120 (severe tachycardia)', value: 4 },
        ],
      },
      {
        id: 'systolic_bp',
        label: 'Systolic blood pressure (mmHg)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        options: [
          { label: '≥120 (normal)', value: 0 },
          { label: '100–119 (low-normal)', value: 1 },
          { label: '80–99 (hypotension)', value: 2 },
          { label: '<80 (severe hypotension)', value: 3 },
        ],
      },
      {
        id: 'calculated_si',
        label: 'Calculated Shock Index = HR ÷ SBP (physician calculates)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: '<0.7 (normal)', value: 0 },
          { label: '0.7–0.9 (borderline)', value: 1 },
          { label: '1.0–1.3 (moderate shock)', value: 2 },
          { label: '≥1.4 (severe shock)', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Normal', interpretation: 'SI <0.7: Normal hemodynamics. No immediate hemorrhage intervention indicated.' },
        { min: 1, max: 1, risk: 'Mild', interpretation: 'SI 0.7–0.9: Borderline — close monitoring, low threshold for resuscitation.' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'SI 1.0–1.3: Moderate shock — likely significant hemorrhage. Consider blood transfusion, emergent hemorrhage control.' },
        { min: 3, max: 3, risk: 'Severe', interpretation: 'SI ≥1.4: Severe shock — massive hemorrhage likely. Activate Massive Transfusion Protocol. Emergent surgical/IR consultation.' },
      ],
    },
    suggestedTreatments: {
      Severe: ['massive_transfusion_protocol', 'trauma_surgery_consult', 'emergent_ir_if_indicated', 'permissive_hypotension', 'txa_within_3h'],
      Moderate: ['type_and_crossmatch', 'iv_access_x2_large_bore', 'blood_transfusion', 'trauma_surgery_consult', 'txa_within_3h'],
      Mild: ['iv_access', 'crystalloid_bolus', 'serial_vital_signs', 'close_monitoring'],
      Normal: ['monitoring', 'reassess_if_vitals_change'],
    },
  },

  // =========================================================================
  // TRAUMA — ABC Score (Assessment of Blood Consumption)
  // Nunez et al. Transfusion 2009; 49(10):2128-2137
  // Predicts need for massive transfusion (≥10 units pRBC in 24h).
  // Score 0–4; all 4 variables are bedside (no labs required).
  // Score ≥2 → activate MTP (sensitivity 75%, specificity 86%).
  // =========================================================================
  {
    id: 'abc_score',
    name: 'ABC Score',
    fullName: 'ABC Score (Assessment of Blood Consumption)',
    category: 'TRAUMA',
    application: 'Rapid bedside assessment to predict need for massive transfusion in trauma. Requires no lab values — entirely bedside assessment.',
    applicableChiefComplaints: ['major_trauma', 'hemorrhage', 'penetrating_trauma', 'shock'],
    keywords: ['ABC score', 'assessment blood consumption', 'massive transfusion', 'trauma transfusion', 'FAST exam', 'penetrating trauma', 'MTP activation'],
    requiredTests: ['FAST exam'],
    components: [
      {
        id: 'penetrating_mechanism',
        label: 'Penetrating mechanism of injury',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'sbp_lte_90',
        label: 'Systolic blood pressure ≤90 mmHg in ED',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        value: 1,
      },
      {
        id: 'hr_gte_120',
        label: 'Heart rate ≥120 bpm in ED',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'vital_signs',
        value: 1,
      },
      {
        id: 'fast_positive',
        label: 'FAST exam positive (free fluid in abdomen/pelvis or pericardium)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'Score 0: ~1% probability of massive transfusion. MTP activation not indicated.' },
        { min: 1, max: 1, risk: 'Low', interpretation: 'Score 1: ~10% probability of massive transfusion. Prepare blood products; close monitoring.' },
        { min: 2, max: 4, risk: 'High', interpretation: 'Score ≥2: 41–100% probability of massive transfusion. Activate Massive Transfusion Protocol immediately.' },
      ],
    },
    suggestedTreatments: {
      High: ['massive_transfusion_protocol', 'trauma_surgery_consult', 'txa_within_3h', 'permissive_hypotension_target_sbp_80_90', 'emergent_ir_or_or'],
      Low: ['type_and_crossmatch', 'iv_access_x2_large_bore', 'blood_products_standby', 'trauma_surgery_consult', 'serial_reassessment'],
      'Very Low': ['iv_access', 'crystalloid_bolus', 'monitoring', 'repeat_exam_and_vitals'],
    },
  },

  // =========================================================================
  // TRAUMA — Denver Criteria (Blunt Cerebrovascular Injury Screening)
  // Biffl et al. J Trauma 1999 (original); updated 2010
  // Identifies patients at risk for BCVI (carotid/vertebral artery injury).
  // Any criterion → CTA of head/neck. Sensitivity >95% for clinically significant BCVI.
  // =========================================================================
  {
    id: 'denver_bcvi',
    name: 'Denver Criteria',
    fullName: 'Denver Criteria (Blunt Cerebrovascular Injury Screening)',
    category: 'TRAUMA',
    application: 'Identifies patients at risk for blunt cerebrovascular injury (BCVI) who need CT angiography of the neck.',
    applicableChiefComplaints: ['neck_trauma', 'cervical_spine_injury', 'facial_trauma', 'major_trauma', 'stroke_like_symptoms'],
    keywords: ['Denver criteria', 'BCVI', 'blunt cerebrovascular injury', 'carotid dissection', 'vertebral artery injury', 'CTA neck', 'stroke trauma', 'LeForte fracture'],
    requiredTests: ['CT angiography neck/head'],
    components: [
      // Signs/Symptoms of BCVI
      {
        id: 'arterial_hemorrhage',
        label: 'Arterial hemorrhage from neck/nose/mouth',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'expanding_cervical_hematoma',
        label: 'Expanding cervical hematoma',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'cervical_bruit_in_young_patient',
        label: 'Cervical bruit in patient <50 years',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'focal_neurological_deficit',
        label: 'Focal neurological deficit (TIA, hemiplegia, vertebrobasilar symptoms, Horner syndrome)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'neurological_deficit_unexplained_by_ct',
        label: 'Neurological deficit incongruous with CT head findings',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'stroke_on_ct_or_mri',
        label: 'Stroke on CT/MRI not explained by intracranial injury',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      // Risk Factors / Injury Patterns for BCVI
      {
        id: 'high_energy_transfer_mechanism',
        label: 'High-energy transfer mechanism (displaced mid-face fracture, orbital fracture, mandible fracture)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'leforte_fracture',
        label: 'LeFort II or III fracture',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'skull_base_fracture_carotid_canal',
        label: 'Skull base fracture involving carotid canal',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'diffuse_axonal_injury',
        label: 'Diffuse axonal injury (GCS <6)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'cervical_spine_fracture',
        label: 'Cervical spine fracture (subluxation, fracture through transverse foramen, fractures at C1–C3)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'near_hanging_with_anoxia',
        label: 'Near hanging with anoxic brain injury',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No Denver criteria present — CTA of head/neck not required.' },
        { min: 1, max: 12, risk: 'High', interpretation: 'Any criterion present — CTA of head/neck recommended. Sensitivity >95% for clinically significant BCVI. Start antiplatelet or anticoagulation if BCVI confirmed and no contraindication.' },
      ],
    },
    suggestedTreatments: {
      High: ['cta_head_neck', 'neurosurgery_or_vascular_consult', 'antiplatelet_or_anticoagulation_if_bcvi_confirmed', 'stroke_team_consult_if_neurological_deficit', 'serial_neuro_checks'],
      Low: ['no_cta_required', 'standard_trauma_evaluation', 'reassess_if_new_neurological_findings'],
    },
  },

  // =========================================================================
  // TRAUMA — NEXUS Blunt Cerebrovascular Screening Criteria
  // Bromberg et al. J Trauma 2010; 68(6):1491-1497; updated Biffl 2013
  // Alternative to Denver criteria; any criterion → CTA of neck.
  // Derived from NEXUS data; 13 criteria; sensitivity 96.2% for BCVI.
  // =========================================================================
  {
    id: 'nexus_bcvi',
    name: 'NEXUS BCVI',
    fullName: 'NEXUS Blunt Cerebrovascular Screening Criteria',
    category: 'TRAUMA',
    application: 'Alternative to Denver criteria for BCVI screening. Any criterion triggers CTA of neck.',
    applicableChiefComplaints: ['neck_trauma', 'cervical_spine_injury', 'major_trauma', 'stroke_like_symptoms'],
    keywords: ['NEXUS BCVI', 'blunt cerebrovascular screening', 'carotid dissection', 'vertebral artery injury', 'CTA neck', 'cervical fracture', 'diffuse axonal injury'],
    requiredTests: ['CT angiography neck/head'],
    components: [
      {
        id: 'leforte_ii_or_iii_nexus',
        label: 'LeFort II or III midface fracture',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'mandible_fracture',
        label: 'Mandible fracture',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'complex_skull_base_fracture',
        label: 'Complex skull base fracture (occipital condyle fracture, involvement of carotid canal)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'severe_traumatic_brain_injury',
        label: 'Severe traumatic brain injury (GCS ≤8 or diffuse axonal injury)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        value: 1,
      },
      {
        id: 'cervical_spine_fracture_nexus',
        label: 'Cervical spine fracture (any fracture from C1–C3, subluxation, or fracture through transverse foramen at any level)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'neck_soft_tissue_injury',
        label: 'Significant neck soft tissue injury (seat belt sign, blunt hanging injury, decapitating force)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'thoracic_vascular_injury',
        label: 'Thoracic vascular injury (aortic injury, subclavian injury)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'upper_rib_fracture',
        label: 'Upper rib fracture (1st or 2nd rib)',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'arterial_hemorrhage_nexus',
        label: 'Arterial hemorrhage from neck or face',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'focal_neurological_deficit_nexus',
        label: 'Focal neurological deficit (hemiplegia, Horner syndrome, TIA, monocular vision loss)',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'stroke_on_imaging_nexus',
        label: 'Stroke identified on CT or MRI',
        type: 'boolean',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        value: 1,
      },
      {
        id: 'expanding_neck_hematoma_nexus',
        label: 'Expanding cervical hematoma',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
      {
        id: 'seat_belt_abrasion_neck',
        label: 'Seat belt sign or other abrasion across anterior neck',
        type: 'boolean',
        source: 'section1',
        autoPopulateFrom: 'physical_exam',
        value: 1,
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No NEXUS BCVI criteria present — CTA of head/neck not required. Low risk of clinically significant BCVI.' },
        { min: 1, max: 13, risk: 'High', interpretation: 'Any criterion present — CTA of head/neck indicated (sensitivity 96.2% for BCVI). If BCVI confirmed, initiate antiplatelet or anticoagulation therapy if no contraindication.' },
      ],
    },
    suggestedTreatments: {
      High: ['cta_head_neck', 'neurosurgery_or_vascular_surgery_consult', 'antiplatelet_if_bcvi_no_hemorrhage', 'anticoagulation_if_bcvi_and_indicated', 'stroke_neurology_consult_if_neurological_deficit', 'serial_neuro_checks'],
      Low: ['no_cta_required', 'standard_trauma_evaluation', 'reassess_if_new_neurological_findings'],
    },
  },

]
