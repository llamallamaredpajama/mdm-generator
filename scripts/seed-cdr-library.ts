/**
 * Seed CDR Library
 * Populates the `cdrLibrary` Firestore collection with 13 Clinical Decision Rule definitions.
 *
 * Usage: cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-cdr-library.ts
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 *
 * Idempotent: Uses deterministic doc IDs (cdr.id), so re-running overwrites identically.
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

// Initialize Firebase Admin
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  })
} else if (serviceAccountPath) {
  const content = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(content)),
  })
} else {
  admin.initializeApp()
}

const db = admin.firestore()

// ---------------------------------------------------------------------------
// Type definitions (inline to keep script self-contained)
// ---------------------------------------------------------------------------

interface CdrComponentOption {
  label: string
  value: number
}

type CdrComponentSource = 'section1' | 'section2' | 'user_input'
type CdrComponentType = 'select' | 'boolean' | 'number_range' | 'algorithm'

interface CdrComponent {
  id: string
  label: string
  type: CdrComponentType
  options?: CdrComponentOption[]
  min?: number
  max?: number
  value?: number
  source: CdrComponentSource
  autoPopulateFrom?: string
}

interface CdrScoringRange {
  min: number
  max: number
  risk: string
  interpretation: string
}

interface CdrScoring {
  method: 'sum' | 'threshold' | 'algorithm'
  ranges: CdrScoringRange[]
}

interface CdrSeed {
  id: string
  name: string
  fullName: string
  applicableChiefComplaints: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
}

// ---------------------------------------------------------------------------
// CDR Definitions (all 13)
//
// CDR-to-test mapping pattern:
// - BM-1.1 test library has `feedsCdrs: string[]` per test (test → CDR direction)
// - This library has `source` and `autoPopulateFrom` per component (CDR → data direction)
// - `source` tells the UI which Build Mode section provides data (section1/section2/user_input)
// - `autoPopulateFrom` hints at auto-fill strategy (narrative_analysis, test_result, vital_signs, physical_exam)
// - Some feedsCdrs IDs in BM-1.1 (sepsis, rumack_matthew, canadian_ct_head, sgarbossa)
//   reference the old markdown-based CDR system and are NOT covered by these 13 definitions.
//   The old system coexists until a future migration story.
// - BM-1.1 `rapid_strep` uses `feedsCdrs: ['centor_mcisaac']` matching this library's CDR id.
// ---------------------------------------------------------------------------

const cdrs: CdrSeed[] = [
  // 1. HEART Score
  {
    id: 'heart',
    name: 'HEART Score',
    fullName: 'History, ECG, Age, Risk Factors, Troponin',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'syncope'],
    components: [
      {
        id: 'history', label: 'History', type: 'select', source: 'section1', autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Slightly suspicious', value: 0 },
          { label: 'Moderately suspicious', value: 1 },
          { label: 'Highly suspicious', value: 2 },
        ],
      },
      {
        id: 'ecg', label: 'ECG', type: 'select', source: 'section2', autoPopulateFrom: 'test_result',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Non-specific repolarization abnormality', value: 1 },
          { label: 'Significant ST deviation', value: 2 },
        ],
      },
      {
        id: 'age', label: 'Age', type: 'select', source: 'section1', autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<45', value: 0 },
          { label: '45-64', value: 1 },
          { label: '>=65', value: 2 },
        ],
      },
      {
        id: 'risk_factors', label: 'Risk Factors', type: 'select', source: 'section1', autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'No known risk factors', value: 0 },
          { label: '1-2 risk factors', value: 1 },
          { label: '>=3 risk factors or history of atherosclerotic disease', value: 2 },
        ],
      },
      {
        id: 'troponin', label: 'Troponin', type: 'select', source: 'section2', autoPopulateFrom: 'test_result',
        options: [
          { label: '<=normal limit', value: 0 },
          { label: '1-3x normal limit', value: 1 },
          { label: '>3x normal limit', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: '1.7% risk of MACE at 6 weeks. Consider early discharge.' },
        { min: 4, max: 6, risk: 'Moderate', interpretation: '12-16.6% risk of MACE at 6 weeks. Consider admission for observation.' },
        { min: 7, max: 10, risk: 'High', interpretation: '50-65% risk of MACE at 6 weeks. Early invasive measures indicated.' },
      ],
    },
    suggestedTreatments: {
      High: ['aspirin_325', 'heparin_drip', 'cardiology_consult', 'admit_telemetry'],
      Moderate: ['aspirin_325', 'serial_troponins', 'observation', 'cardiology_consult'],
      Low: ['discharge_with_follow_up', 'outpatient_stress_test'],
    },
  },

  // 2. PERC Rule
  {
    id: 'perc',
    name: 'PERC Rule',
    fullName: 'Pulmonary Embolism Rule-out Criteria',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'pleuritic_chest_pain', 'tachycardia'],
    components: [
      { id: 'age_gte_50', label: 'Age >= 50', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
      { id: 'hr_gte_100', label: 'Heart rate >= 100', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
      { id: 'sao2_lt_95', label: 'SpO2 < 95% on room air', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
      { id: 'unilateral_leg_swelling', label: 'Unilateral leg swelling', type: 'boolean', source: 'section1', autoPopulateFrom: 'physical_exam', value: 1 },
      { id: 'hemoptysis', label: 'Hemoptysis', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
      { id: 'recent_surgery_trauma', label: 'Surgery or trauma within 4 weeks', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
      { id: 'prior_pe_dvt', label: 'Prior PE or DVT', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
      { id: 'hormone_use', label: 'Hormone use (OCP, HRT)', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All 8 criteria negative. PE effectively ruled out (<2% risk). No further workup needed.' },
        { min: 1, max: 8, risk: 'Not Low', interpretation: '>=1 criterion positive. PERC rule cannot exclude PE. Proceed to D-dimer or CTPA.' },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['d_dimer', 'ctpa_if_d_dimer_positive', 'anticoagulation_if_confirmed'],
    },
  },

  // 3. Wells PE
  {
    id: 'wells_pe',
    name: 'Wells PE',
    fullName: 'Wells Criteria for Pulmonary Embolism',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'pleuritic_chest_pain', 'tachycardia', 'hemoptysis'],
    components: [
      { id: 'clinical_signs_dvt', label: 'Clinical signs/symptoms of DVT', type: 'boolean', source: 'section1', value: 3 },
      { id: 'pe_most_likely', label: 'PE is #1 diagnosis or equally likely', type: 'boolean', source: 'section1', value: 3 },
      { id: 'hr_gt_100', label: 'Heart rate > 100', type: 'boolean', source: 'section1', value: 1.5 },
      { id: 'immobilization_surgery', label: 'Immobilization/surgery in previous 4 weeks', type: 'boolean', source: 'section1', value: 1.5 },
      { id: 'previous_pe_dvt', label: 'Previous PE or DVT', type: 'boolean', source: 'section1', value: 1.5 },
      { id: 'hemoptysis', label: 'Hemoptysis', type: 'boolean', source: 'section1', value: 1 },
      { id: 'malignancy', label: 'Malignancy (treatment within 6 months or palliative)', type: 'boolean', source: 'section1', value: 1 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Low probability PE (~1.3%). Consider PERC rule or D-dimer.' },
        { min: 2, max: 6, risk: 'Moderate', interpretation: 'Moderate probability PE (~16.2%). D-dimer recommended.' },
        { min: 7, max: 12.5, risk: 'High', interpretation: 'High probability PE (~37.5%). Consider empiric anticoagulation and CTPA.' },
      ],
    },
    suggestedTreatments: {
      High: ['empiric_anticoagulation', 'ctpa', 'cardiology_or_pulm_consult'],
      Moderate: ['d_dimer', 'ctpa_if_positive', 'anticoagulation_if_confirmed'],
      Low: ['d_dimer', 'perc_rule_if_low_pretest'],
    },
  },

  // 4. Wells DVT
  {
    id: 'wells_dvt',
    name: 'Wells DVT',
    fullName: 'Wells Criteria for Deep Vein Thrombosis',
    applicableChiefComplaints: ['leg_pain', 'leg_swelling', 'calf_pain', 'unilateral_edema'],
    components: [
      { id: 'active_cancer', label: 'Active cancer (treatment within 6 months or palliative)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'paralysis_paresis', label: 'Paralysis, paresis, or recent plaster immobilization of lower extremity', type: 'boolean', source: 'section1', value: 1 },
      { id: 'bedridden_gt_3days', label: 'Bedridden >3 days or major surgery within 12 weeks', type: 'boolean', source: 'section1', value: 1 },
      { id: 'tenderness_along_veins', label: 'Localized tenderness along distribution of deep venous system', type: 'boolean', source: 'section1', value: 1 },
      { id: 'entire_leg_swelling', label: 'Entire leg swollen', type: 'boolean', source: 'section1', value: 1 },
      { id: 'calf_swelling_gt_3cm', label: 'Calf swelling >3cm compared to asymptomatic leg', type: 'boolean', source: 'section1', value: 1 },
      { id: 'pitting_edema', label: 'Pitting edema confined to symptomatic leg', type: 'boolean', source: 'section1', value: 1 },
      { id: 'collateral_veins', label: 'Collateral superficial veins (non-varicose)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'previous_dvt', label: 'Previously documented DVT', type: 'boolean', source: 'section1', value: 1 },
      { id: 'alternative_diagnosis', label: 'Alternative diagnosis at least as likely as DVT', type: 'boolean', source: 'section1', value: -2 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: -2, max: 0, risk: 'Low', interpretation: 'Low probability DVT (~5%). D-dimer to rule out.' },
        { min: 1, max: 2, risk: 'Moderate', interpretation: 'Moderate probability DVT (~17%). D-dimer or ultrasound.' },
        { min: 3, max: 9, risk: 'High', interpretation: 'High probability DVT (~53%). Ultrasound recommended. Consider empiric anticoagulation.' },
      ],
    },
    suggestedTreatments: {
      High: ['lower_extremity_ultrasound', 'empiric_anticoagulation', 'hematology_consult'],
      Moderate: ['d_dimer', 'lower_extremity_ultrasound_if_positive'],
      Low: ['d_dimer'],
    },
  },

  // 5. PECARN
  {
    id: 'pecarn',
    name: 'PECARN',
    fullName: 'Pediatric Emergency Care Applied Research Network Head Injury Rule',
    applicableChiefComplaints: ['head_injury', 'head_trauma', 'fall', 'altered_mental_status'],
    components: [
      {
        id: 'age_group', label: 'Age Group', type: 'select', source: 'section1', autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<2 years', value: 0 },
          { label: '>=2 years', value: 1 },
        ],
      },
      { id: 'gcs_lte_14', label: 'GCS <= 14', type: 'boolean', source: 'section1' },
      { id: 'altered_mental_status', label: 'Altered mental status', type: 'boolean', source: 'section1' },
      { id: 'palpable_skull_fracture', label: 'Palpable skull fracture (<2y) / Signs of basilar skull fracture (>=2y)', type: 'boolean', source: 'section1' },
      { id: 'scalp_hematoma', label: 'Occipital/parietal/temporal scalp hematoma (<2y) / History of LOC (>=2y)', type: 'boolean', source: 'section1' },
      { id: 'loss_of_consciousness', label: 'LOC >= 5 seconds', type: 'boolean', source: 'section1' },
      { id: 'severe_mechanism', label: 'Severe mechanism of injury', type: 'boolean', source: 'section1' },
      { id: 'acting_abnormally', label: 'Not acting normally per parent (<2y) / Severe headache (>=2y)', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'ciTBI risk <0.02-0.05%. CT not recommended. Observation appropriate.' },
        { min: 1, max: 1, risk: 'Intermediate', interpretation: 'ciTBI risk ~0.9-1.0%. Consider CT vs observation based on clinical factors.' },
        { min: 2, max: 2, risk: 'High', interpretation: 'ciTBI risk ~4.4%. CT recommended.' },
      ],
    },
    suggestedTreatments: {
      High: ['ct_head', 'neurosurgery_consult', 'admission'],
      Intermediate: ['observation_4_6_hours', 'ct_head_if_worsening'],
    },
  },

  // 6. Ottawa Ankle
  {
    id: 'ottawa_ankle',
    name: 'Ottawa Ankle',
    fullName: 'Ottawa Ankle Rules',
    applicableChiefComplaints: ['ankle_pain', 'ankle_injury', 'foot_pain', 'foot_injury', 'ankle_swelling'],
    components: [
      { id: 'malleolar_bone_tenderness_posterior', label: 'Bone tenderness along distal 6cm of posterior edge of tibia/fibula or tip of malleolus', type: 'boolean', source: 'section1', value: 1 },
      { id: 'inability_to_bear_weight', label: 'Inability to bear weight immediately and in ED (4 steps)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'midfoot_bone_tenderness_5th_met', label: 'Bone tenderness at base of 5th metatarsal', type: 'boolean', source: 'section1', value: 1 },
      { id: 'midfoot_bone_tenderness_navicular', label: 'Bone tenderness at navicular', type: 'boolean', source: 'section1', value: 1 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria met. Fracture effectively ruled out. X-ray not indicated.' },
        { min: 1, max: 4, risk: 'Not Low', interpretation: '>=1 criterion present. Ankle or foot X-ray indicated.' },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['ankle_xray', 'foot_xray', 'splinting', 'ortho_follow_up'],
    },
  },

  // 7. Ottawa Knee
  {
    id: 'ottawa_knee',
    name: 'Ottawa Knee',
    fullName: 'Ottawa Knee Rules',
    applicableChiefComplaints: ['knee_pain', 'knee_injury', 'knee_swelling'],
    components: [
      { id: 'age_gte_55', label: 'Age >= 55', type: 'boolean', source: 'section1', value: 1 },
      { id: 'fibula_head_tenderness', label: 'Tenderness at head of fibula', type: 'boolean', source: 'section1', value: 1 },
      { id: 'isolated_patella_tenderness', label: 'Isolated patellar tenderness', type: 'boolean', source: 'section1', value: 1 },
      { id: 'inability_to_flex_90', label: 'Inability to flex to 90 degrees', type: 'boolean', source: 'section1', value: 1 },
      { id: 'inability_to_bear_weight', label: 'Inability to bear weight immediately and in ED (4 steps)', type: 'boolean', source: 'section1', value: 1 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria met. Fracture effectively ruled out. X-ray not indicated.' },
        { min: 1, max: 5, risk: 'Not Low', interpretation: '>=1 criterion present. Knee X-ray indicated.' },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['knee_xray', 'splinting', 'ortho_follow_up'],
    },
  },

  // 8. Canadian C-Spine Rule
  {
    id: 'canadian_cspine',
    name: 'Canadian C-Spine',
    fullName: 'Canadian C-Spine Rule',
    applicableChiefComplaints: ['neck_pain', 'neck_injury', 'trauma', 'mvc', 'fall'],
    components: [
      { id: 'age_gte_65', label: 'Age >= 65', type: 'boolean', source: 'section1' },
      { id: 'dangerous_mechanism', label: 'Dangerous mechanism (fall >=3ft, axial load, MVC >100km/h, bicycle collision, motorized recreational vehicle)', type: 'boolean', source: 'section1' },
      { id: 'paresthesias', label: 'Paresthesias in extremities', type: 'boolean', source: 'section1' },
      { id: 'simple_rear_end_mvc', label: 'Simple rear-end MVC (low-risk factor)', type: 'boolean', source: 'section1' },
      { id: 'sitting_in_ed', label: 'Sitting position in ED (low-risk factor)', type: 'boolean', source: 'section1' },
      { id: 'ambulatory_at_any_time', label: 'Ambulatory at any time since injury (low-risk factor)', type: 'boolean', source: 'section1' },
      { id: 'delayed_onset_neck_pain', label: 'Delayed onset of neck pain (low-risk factor)', type: 'boolean', source: 'section1' },
      { id: 'midline_tenderness_absent', label: 'Absence of midline cervical tenderness (low-risk factor)', type: 'boolean', source: 'section1' },
      { id: 'able_to_rotate_neck', label: 'Able to actively rotate neck 45 degrees left and right', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No high-risk factors, >=1 low-risk factor, able to actively rotate neck. Imaging not indicated.' },
        { min: 1, max: 1, risk: 'Not Low', interpretation: 'High-risk factor present OR unable to actively rotate neck 45 degrees. C-spine imaging indicated.' },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['cspine_ct', 'cspine_xray', 'cervical_collar', 'neurosurgery_consult_if_positive'],
    },
  },

  // 9. NEXUS Criteria
  {
    id: 'nexus',
    name: 'NEXUS',
    fullName: 'National Emergency X-Radiography Utilization Study Criteria',
    applicableChiefComplaints: ['neck_pain', 'neck_injury', 'trauma', 'mvc', 'fall'],
    components: [
      { id: 'midline_tenderness', label: 'Posterior midline cervical-spine tenderness', type: 'boolean', source: 'section1', value: 1 },
      { id: 'focal_neurologic_deficit', label: 'Focal neurologic deficit', type: 'boolean', source: 'section1', value: 1 },
      { id: 'decreased_alertness', label: 'Decreased level of alertness', type: 'boolean', source: 'section1', value: 1 },
      { id: 'intoxication', label: 'Evidence of intoxication', type: 'boolean', source: 'section1', value: 1 },
      { id: 'distracting_injury', label: 'Clinically apparent painful distracting injury', type: 'boolean', source: 'section1', value: 1 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All 5 criteria absent. C-spine fracture effectively ruled out. Imaging not indicated.' },
        { min: 1, max: 5, risk: 'Not Low', interpretation: '>=1 criterion present. C-spine imaging indicated.' },
      ],
    },
    suggestedTreatments: {
      'Not Low': ['cspine_ct', 'cspine_xray', 'cervical_collar'],
    },
  },

  // 10. Centor/McIsaac
  {
    id: 'centor_mcisaac',
    name: 'Centor/McIsaac',
    fullName: 'Modified Centor Score (McIsaac) for Strep Pharyngitis',
    applicableChiefComplaints: ['sore_throat', 'pharyngitis', 'throat_pain', 'odynophagia'],
    components: [
      { id: 'tonsillar_exudates', label: 'Tonsillar exudates or swelling', type: 'boolean', source: 'section1', value: 1 },
      { id: 'tender_anterior_cervical_lymph', label: 'Tender/swollen anterior cervical lymph nodes', type: 'boolean', source: 'section1', value: 1 },
      { id: 'fever', label: 'Temperature >38C (100.4F)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'absence_of_cough', label: 'Absence of cough', type: 'boolean', source: 'section1', value: 1 },
      {
        id: 'age_modifier', label: 'Age modifier', type: 'select', source: 'section1', autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '3-14 years', value: 1 },
          { label: '15-44 years', value: 0 },
          { label: '>=45 years', value: -1 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: -1, max: 0, risk: 'Very Low', interpretation: '1-2.5% likelihood of strep. No testing or antibiotics recommended.' },
        { min: 1, max: 1, risk: 'Low', interpretation: '5-10% likelihood of strep. Consider rapid strep test (optional).' },
        { min: 2, max: 3, risk: 'Moderate', interpretation: '11-35% likelihood of strep. Rapid strep test recommended.' },
        { min: 4, max: 5, risk: 'High', interpretation: '25-51% likelihood of strep. Empiric antibiotics or rapid strep test.' },
      ],
    },
    suggestedTreatments: {
      High: ['rapid_strep_test', 'empiric_antibiotics_penicillin_or_amoxicillin'],
      Moderate: ['rapid_strep_test', 'antibiotics_if_positive'],
      Low: ['symptomatic_treatment'],
    },
  },

  // 11. CHA2DS2-VASc
  {
    id: 'cha2ds2_vasc',
    name: 'CHA2DS2-VASc',
    fullName: 'CHA2DS2-VASc Score for Atrial Fibrillation Stroke Risk',
    applicableChiefComplaints: ['atrial_fibrillation', 'afib', 'palpitations', 'irregular_heartbeat'],
    components: [
      { id: 'chf', label: 'Congestive Heart Failure', type: 'boolean', source: 'section1', value: 1 },
      { id: 'hypertension', label: 'Hypertension', type: 'boolean', source: 'section1', value: 1 },
      { id: 'age_gte_75', label: 'Age >= 75', type: 'boolean', source: 'section1', value: 2 },
      { id: 'diabetes', label: 'Diabetes mellitus', type: 'boolean', source: 'section1', value: 1 },
      { id: 'stroke_tia', label: 'Prior stroke/TIA/thromboembolism', type: 'boolean', source: 'section1', value: 2 },
      { id: 'vascular_disease', label: 'Vascular disease (prior MI, PAD, aortic plaque)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'age_65_74', label: 'Age 65-74', type: 'boolean', source: 'section1', value: 1 },
      { id: 'sex_female', label: 'Sex category (female)', type: 'boolean', source: 'section1', value: 1 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: '0.2% annual stroke risk (males). Anticoagulation not recommended.' },
        { min: 1, max: 1, risk: 'Low-Moderate', interpretation: '0.6% annual stroke risk. Consider anticoagulation (especially if female with no other risk factors).' },
        { min: 2, max: 3, risk: 'Moderate', interpretation: '2.2-3.2% annual stroke risk. Anticoagulation recommended.' },
        { min: 4, max: 9, risk: 'High', interpretation: '4.8-15.2% annual stroke risk. Anticoagulation strongly recommended.' },
      ],
    },
    suggestedTreatments: {
      High: ['oral_anticoagulation_doac', 'rate_or_rhythm_control', 'cardiology_referral'],
      Moderate: ['oral_anticoagulation_doac', 'rate_control', 'cardiology_follow_up'],
      'Low-Moderate': ['consider_anticoagulation', 'aspirin_alternative', 'cardiology_follow_up'],
    },
  },

  // 12. CURB-65
  {
    id: 'curb65',
    name: 'CURB-65',
    fullName: 'CURB-65 Severity Score for Community-Acquired Pneumonia',
    applicableChiefComplaints: ['cough', 'dyspnea', 'fever', 'pneumonia', 'respiratory_distress'],
    components: [
      { id: 'confusion', label: 'Confusion (new mental confusion)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'bun_gt_19', label: 'BUN > 19 mg/dL (7 mmol/L)', type: 'boolean', source: 'section2', autoPopulateFrom: 'test_result', value: 1 },
      { id: 'respiratory_rate_gte_30', label: 'Respiratory rate >= 30', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
      { id: 'bp_systolic_lt_90_or_diastolic_lte_60', label: 'BP: systolic <90 or diastolic <=60 mmHg', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
      { id: 'age_gte_65', label: 'Age >= 65', type: 'boolean', source: 'section1', autoPopulateFrom: 'narrative_analysis', value: 1 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: '0.6-2.7% 30-day mortality. Consider outpatient treatment.' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '6.8% 30-day mortality. Consider short inpatient stay or closely supervised outpatient treatment.' },
        { min: 3, max: 5, risk: 'High', interpretation: '14-27.8% 30-day mortality. Hospitalize. Consider ICU admission if score 4-5.' },
      ],
    },
    suggestedTreatments: {
      High: ['iv_antibiotics', 'icu_admission_if_4_5', 'blood_cultures', 'respiratory_support'],
      Moderate: ['oral_or_iv_antibiotics', 'inpatient_observation', 'blood_cultures'],
      Low: ['oral_antibiotics', 'outpatient_follow_up_48h'],
    },
  },

  // 13. qSOFA
  {
    id: 'qsofa',
    name: 'qSOFA',
    fullName: 'Quick Sequential Organ Failure Assessment',
    applicableChiefComplaints: ['fever', 'sepsis', 'infection', 'altered_mental_status', 'hypotension', 'tachypnea'],
    components: [
      { id: 'altered_mentation', label: 'Altered mentation (GCS <15)', type: 'boolean', source: 'section1', value: 1 },
      { id: 'respiratory_rate_gte_22', label: 'Respiratory rate >= 22/min', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
      { id: 'systolic_bp_lte_100', label: 'Systolic blood pressure <= 100 mmHg', type: 'boolean', source: 'section1', autoPopulateFrom: 'vital_signs', value: 1 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Low risk of poor outcome. Continue standard evaluation.' },
        { min: 2, max: 3, risk: 'High', interpretation: '>=2 criteria met. High risk of poor outcome (3-14x increased mortality). Assess for organ dysfunction, consider sepsis workup, and escalate care.' },
      ],
    },
    suggestedTreatments: {
      High: ['blood_cultures', 'lactate', 'iv_fluids_30ml_kg', 'broad_spectrum_antibiotics', 'icu_consult'],
    },
  },
]

// ---------------------------------------------------------------------------
// Seed Firestore
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`Seeding ${cdrs.length} CDR definitions to cdrLibrary collection...`)

  const batch = db.batch()

  for (const cdr of cdrs) {
    const docRef = db.collection('cdrLibrary').doc(cdr.id)
    batch.set(docRef, cdr)
  }

  await batch.commit()
  console.log(`✅ Successfully seeded ${cdrs.length} CDR definitions.`)

  // Print summary
  const byMethod: Record<string, number> = {}
  for (const cdr of cdrs) {
    byMethod[cdr.scoring.method] = (byMethod[cdr.scoring.method] || 0) + 1
  }
  console.log('Scoring methods:', byMethod)
  console.log('CDR IDs:', cdrs.map(c => c.id).join(', '))
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
