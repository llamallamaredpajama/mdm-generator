/**
 * Seed CDR Library
 * Populates the `cdrLibrary` Firestore collection with 216 Clinical Decision Rule definitions.
 *
 * Usage: cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-cdr-library.ts [--skip-embeddings]
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 *
 * Flags:
 * - --skip-embeddings  Skip embedding generation (faster, for dev/testing)
 *
 * Idempotent: Uses deterministic doc IDs (cdr.id), so re-running overwrites identically.
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'
import { generateEmbeddings } from '../backend/src/services/embeddingService'

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
  category: string
  application: string
  applicableChiefComplaints: string[]
  keywords: string[]
  requiredTests?: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
}

// ---------------------------------------------------------------------------
// Embedding text builder
// ---------------------------------------------------------------------------

function buildEmbeddingText(cdr: CdrSeed): string {
  return [cdr.name, cdr.fullName, cdr.application, ...cdr.applicableChiefComplaints, ...cdr.keywords].join(' ')
}

// ---------------------------------------------------------------------------
// CDR Definitions (216 total)
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
  // =========================================================================
  // ORIGINAL 13 CDRs (full component definitions retained)
  // =========================================================================

  // CARDIOVASCULAR — HEART Score
  {
    id: 'heart',
    name: 'HEART Score',
    fullName: 'History, ECG, Age, Risk Factors, Troponin',
    category: 'CARDIOVASCULAR',
    application: 'Risk stratifies emergency department chest pain patients for 6-week risk of major adverse cardiac events (MACE).',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'syncope'],
    keywords: ['HEART', 'chest pain', 'ACS', 'MACE', 'troponin', 'cardiac risk', 'acute coronary syndrome'],
    requiredTests: ['troponin', 'ecg'],
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

  // CARDIOVASCULAR — PERC Rule
  {
    id: 'perc',
    name: 'PERC Rule',
    fullName: 'Pulmonary Embolism Rule-out Criteria',
    category: 'CARDIOVASCULAR',
    application: 'Rules out pulmonary embolism in low-risk patients without further testing.',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'pleuritic_chest_pain', 'tachycardia'],
    keywords: ['PERC', 'pulmonary embolism', 'PE rule-out', 'chest pain', 'dyspnea', 'VTE'],
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

  // CARDIOVASCULAR — Wells PE
  {
    id: 'wells_pe',
    name: 'Wells PE',
    fullName: 'Wells Criteria for Pulmonary Embolism',
    category: 'CARDIOVASCULAR',
    application: 'Estimates pretest probability of pulmonary embolism.',
    applicableChiefComplaints: ['chest_pain', 'dyspnea', 'pleuritic_chest_pain', 'tachycardia', 'hemoptysis'],
    keywords: ['Wells', 'PE', 'pulmonary embolism', 'DVT', 'VTE', 'pretest probability'],
    requiredTests: ['d_dimer', 'ctpa'],
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

  // CARDIOVASCULAR — Wells DVT
  {
    id: 'wells_dvt',
    name: 'Wells DVT',
    fullName: 'Wells Criteria for Deep Vein Thrombosis',
    category: 'CARDIOVASCULAR',
    application: 'Estimates pretest probability of deep vein thrombosis.',
    applicableChiefComplaints: ['leg_pain', 'leg_swelling', 'calf_pain', 'unilateral_edema'],
    keywords: ['Wells', 'DVT', 'deep vein thrombosis', 'leg swelling', 'VTE', 'venous thromboembolism'],
    requiredTests: ['d_dimer', 'lower_extremity_ultrasound'],
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

  // TRAUMA — PECARN
  {
    id: 'pecarn',
    name: 'PECARN',
    fullName: 'Pediatric Emergency Care Applied Research Network Head Injury Rule',
    category: 'TRAUMA',
    application: 'Identifies children at very low risk of clinically important traumatic brain injury after blunt head trauma.',
    applicableChiefComplaints: ['head_injury', 'head_trauma', 'fall', 'altered_mental_status'],
    keywords: ['PECARN', 'pediatric head injury', 'head CT', 'ciTBI', 'pediatric trauma', 'blunt head trauma'],
    requiredTests: ['ct_head'],
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

  // TRAUMA — Ottawa Ankle
  {
    id: 'ottawa_ankle',
    name: 'Ottawa Ankle',
    fullName: 'Ottawa Ankle Rules',
    category: 'TRAUMA',
    application: 'Determines need for ankle and foot radiography after injury.',
    applicableChiefComplaints: ['ankle_pain', 'ankle_injury', 'foot_pain', 'foot_injury', 'ankle_swelling'],
    keywords: ['Ottawa', 'ankle', 'foot', 'fracture', 'x-ray', 'radiography', 'ankle rules'],
    requiredTests: ['ankle_xray', 'foot_xray'],
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

  // TRAUMA — Ottawa Knee
  {
    id: 'ottawa_knee',
    name: 'Ottawa Knee',
    fullName: 'Ottawa Knee Rules',
    category: 'TRAUMA',
    application: 'Determines need for knee radiography after injury.',
    applicableChiefComplaints: ['knee_pain', 'knee_injury', 'knee_swelling'],
    keywords: ['Ottawa', 'knee', 'fracture', 'x-ray', 'radiography', 'knee rules'],
    requiredTests: ['knee_xray'],
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

  // TRAUMA — Canadian C-Spine
  {
    id: 'canadian_cspine',
    name: 'Canadian C-Spine',
    fullName: 'Canadian C-Spine Rule',
    category: 'TRAUMA',
    application: 'Determines need for cervical spine imaging in alert, stable trauma patients.',
    applicableChiefComplaints: ['neck_pain', 'neck_injury', 'trauma', 'mvc', 'fall'],
    keywords: ['Canadian C-Spine', 'CCR', 'cervical spine', 'neck injury', 'c-spine clearance', 'trauma'],
    requiredTests: ['cspine_ct', 'cspine_xray'],
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

  // TRAUMA — NEXUS
  {
    id: 'nexus',
    name: 'NEXUS',
    fullName: 'National Emergency X-Radiography Utilization Study Criteria',
    category: 'TRAUMA',
    application: 'Rules out cervical spine injury in trauma patients.',
    applicableChiefComplaints: ['neck_pain', 'neck_injury', 'trauma', 'mvc', 'fall'],
    keywords: ['NEXUS', 'NLC', 'cervical spine', 'c-spine clearance', 'neck injury', 'trauma'],
    requiredTests: ['cspine_ct', 'cspine_xray'],
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

  // INFECTIOUS DISEASE — Centor/McIsaac
  {
    id: 'centor_mcisaac',
    name: 'Centor/McIsaac',
    fullName: 'Modified Centor Score (McIsaac) for Strep Pharyngitis',
    category: 'INFECTIOUS DISEASE',
    application: 'Estimates likelihood of strep pharyngitis to guide testing and treatment.',
    applicableChiefComplaints: ['sore_throat', 'pharyngitis', 'throat_pain', 'odynophagia'],
    keywords: ['Centor', 'McIsaac', 'strep throat', 'pharyngitis', 'GAS', 'rapid strep', 'group A strep'],
    requiredTests: ['rapid_strep_test'],
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

  // CARDIOVASCULAR — CHA2DS2-VASc
  {
    id: 'cha2ds2_vasc',
    name: 'CHA2DS2-VASc',
    fullName: 'CHA2DS2-VASc Score for Atrial Fibrillation Stroke Risk',
    category: 'CARDIOVASCULAR',
    application: 'Estimates annual stroke risk in atrial fibrillation to guide anticoagulation.',
    applicableChiefComplaints: ['atrial_fibrillation', 'afib', 'palpitations', 'irregular_heartbeat'],
    keywords: ['CHA2DS2-VASc', 'atrial fibrillation', 'stroke risk', 'anticoagulation', 'afib', 'AF'],
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

  // PULMONARY — CURB-65
  {
    id: 'curb65',
    name: 'CURB-65',
    fullName: 'CURB-65 Severity Score for Community-Acquired Pneumonia',
    category: 'PULMONARY',
    application: 'Estimates mortality risk in community-acquired pneumonia to guide disposition.',
    applicableChiefComplaints: ['cough', 'dyspnea', 'fever', 'pneumonia', 'respiratory_distress'],
    keywords: ['CURB-65', 'pneumonia', 'CAP', 'community-acquired pneumonia', 'mortality risk', 'severity'],
    requiredTests: ['bun', 'chest_xray'],
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

  // INFECTIOUS DISEASE — qSOFA
  {
    id: 'qsofa',
    name: 'qSOFA',
    fullName: 'Quick Sequential Organ Failure Assessment',
    category: 'INFECTIOUS DISEASE',
    application: 'Identifies patients with suspected infection at risk for poor outcomes.',
    applicableChiefComplaints: ['fever', 'sepsis', 'infection', 'altered_mental_status', 'hypotension', 'tachypnea'],
    keywords: ['qSOFA', 'sepsis', 'quick SOFA', 'organ failure', 'infection', 'mortality', 'sepsis screening'],
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

  // =========================================================================
  // NEW CDRs (203 entries with simplified component structure)
  // =========================================================================

// === TRAUMA ===

  // TRAUMA — CCHR
  {
    id: 'canadian_ct_head',
    name: 'CCHR',
    fullName: 'Canadian CT Head Rule (CCHR)',
    category: 'TRAUMA',
    application: 'Determines if CT is needed in patients with minor head injury (GCS 13–15, witnessed LOC, amnesia, or disorientation). NOT for patients on anticoagulants, age <16, or with no LOC/amnesia/disorientation.',
    applicableChiefComplaints: ['head_trauma', 'head_injury', 'loss_of_consciousness', 'altered_mental_status'],
    keywords: ['canadian ct head rule', 'CCHR', 'head CT', 'minor head injury', 'GCS', 'LOC', 'skull fracture', 'CT head decision'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — CT not required' },
        { min: 1, max: 5, risk: 'High', interpretation: 'Any high-risk criterion → CT indicated for neurosurgical intervention; any medium-risk criterion → CT indicated for brain injury' },
      ],
    },
  },

  // TRAUMA — NEXUS Head CT Rule
  {
    id: 'nexus_head_ct',
    name: 'NEXUS Head CT',
    fullName: 'NEXUS Head CT Rule',
    category: 'TRAUMA',
    application: 'Decision instrument for CT after blunt head trauma. Age ≥16. Applied to patients with blunt head trauma.',
    applicableChiefComplaints: ['head_trauma', 'head_injury', 'altered_mental_status'],
    keywords: ['NEXUS head CT', 'head CT rule', 'blunt head trauma', 'skull fracture', 'CT indication', 'neurological deficit'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent — CT not indicated (sensitivity ~99%)' },
        { min: 1, max: 8, risk: 'High', interpretation: 'Any criterion present — CT is indicated' },
      ],
    },
  },

  // TRAUMA — CATCH Rule
  {
    id: 'catch_rule',
    name: 'CATCH',
    fullName: 'CATCH Rule (Canadian Assessment of Tomography for Childhood Head Injury)',
    category: 'TRAUMA',
    application: 'CT decision for children (0–16 years) with minor head injury (GCS 13–15) and witnessed LOC, disorientation, irritability, or vomiting.',
    applicableChiefComplaints: ['pediatric_head_trauma', 'head_injury', 'pediatric_altered_mental_status'],
    keywords: ['CATCH', 'Canadian assessment tomography childhood', 'pediatric head CT', 'minor head injury child', 'CT head pediatric', 'skull fracture child'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'None present — CT not required' },
        { min: 1, max: 4, risk: 'High', interpretation: 'Any high-risk criterion — CT indicated (100% sensitive for neurosurgical intervention)' },
        { min: 5, max: 7, risk: 'Intermediate', interpretation: 'Any medium-risk criterion — CT indicated for brain injury on CT' },
      ],
    },
  },

  // TRAUMA — CHALICE Rule
  {
    id: 'chalice_rule',
    name: 'CHALICE',
    fullName: 'CHALICE Rule (Children\'s Head injury ALgorithm for the prediction of Important Clinical Events)',
    category: 'TRAUMA',
    application: 'UK-derived rule for children (<16 years) presenting with any severity of head injury (not limited to GCS 13–15).',
    applicableChiefComplaints: ['pediatric_head_trauma', 'head_injury', 'pediatric_loss_of_consciousness'],
    keywords: ['CHALICE', 'children head injury algorithm', 'pediatric head CT', 'UK head injury rule', 'CT head child', 'non-accidental injury'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 14 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — CT not required (sensitivity 98% for clinically significant intracranial pathology)' },
        { min: 1, max: 14, risk: 'High', interpretation: 'Any criterion present — CT indicated' },
      ],
    },
  },

  // TRAUMA — NEXUS Chest CT Rule
  {
    id: 'nexus_chest_ct',
    name: 'NEXUS Chest CT',
    fullName: 'NEXUS Chest CT Rule',
    category: 'TRAUMA',
    application: 'Identifies blunt trauma patients who require chest CT.',
    applicableChiefComplaints: ['chest_trauma', 'blunt_trauma', 'chest_pain_trauma', 'mvc'],
    keywords: ['NEXUS chest CT', 'chest CT trauma', 'blunt trauma chest', 'mediastinum widened', 'chest wall tenderness', 'sternal tenderness'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent — Chest CT not indicated (sensitivity ~99%)' },
        { min: 1, max: 7, risk: 'High', interpretation: 'Any criterion present — Chest CT indicated' },
      ],
    },
  },

  // TRAUMA — NEXUS Chest X-Ray Rule
  {
    id: 'nexus_chest_xray',
    name: 'NEXUS Chest X-Ray',
    fullName: 'NEXUS Chest X-Ray Rule',
    category: 'TRAUMA',
    application: 'Identifies blunt trauma patients who require chest radiography.',
    applicableChiefComplaints: ['chest_trauma', 'blunt_trauma', 'chest_pain_trauma'],
    keywords: ['NEXUS chest x-ray', 'CXR trauma', 'blunt trauma chest radiograph', 'chest tenderness', 'chest radiography decision'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent — CXR not indicated' },
        { min: 1, max: 7, risk: 'High', interpretation: 'Any criterion present — CXR indicated' },
      ],
    },
  },

  // TRAUMA — PECARN Blunt Abdominal Trauma Rule
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
      { id: 'score', label: 'Predictors Count', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'None of the findings present — very low risk of IAI-AI (<0.1%); CT can generally be avoided' },
        { min: 1, max: 7, risk: 'Elevated', interpretation: 'Any finding present — risk increases; CT abdomen/pelvis should be considered. Presence of ≥2 predictors significantly increases risk.' },
      ],
    },
  },

  // TRAUMA — Ottawa Foot Rules
  {
    id: 'ottawa_foot',
    name: 'Ottawa Foot',
    fullName: 'Ottawa Foot Rules',
    category: 'TRAUMA',
    application: 'Determines need for foot radiography in midfoot injuries. Applied when there is pain in the midfoot zone.',
    applicableChiefComplaints: ['foot_injury', 'foot_pain', 'midfoot_pain', 'ankle_injury'],
    keywords: ['Ottawa foot rules', 'foot x-ray', 'midfoot fracture', '5th metatarsal', 'navicular', 'foot radiograph decision'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'None present — X-ray not indicated' },
        { min: 1, max: 3, risk: 'High', interpretation: 'Any criterion present — X-ray indicated' },
      ],
    },
  },

  // TRAUMA — Pittsburgh Knee Rules
  {
    id: 'pittsburgh_knee',
    name: 'Pittsburgh Knee',
    fullName: 'Pittsburgh Knee Rules',
    category: 'TRAUMA',
    application: 'Alternative to Ottawa Knee Rules for determining need for knee radiography.',
    applicableChiefComplaints: ['knee_injury', 'knee_pain', 'knee_trauma'],
    keywords: ['Pittsburgh knee rules', 'knee x-ray', 'knee radiograph', 'knee fracture', 'weight bearing knee', 'knee injury decision'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 2 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Neither criterion met — X-ray not indicated' },
        { min: 1, max: 2, risk: 'High', interpretation: 'Either criterion met — X-ray indicated' },
      ],
    },
  },

  // TRAUMA — Shock Index
  {
    id: 'shock_index',
    name: 'Shock Index',
    fullName: 'Shock Index',
    category: 'TRAUMA',
    application: 'Rapid bedside assessment of hemodynamic status. Identifies occult shock in trauma and hemorrhage before traditional vital signs are abnormal.',
    applicableChiefComplaints: ['trauma', 'hemorrhage', 'shock', 'hypotension', 'major_trauma'],
    keywords: ['shock index', 'SI', 'heart rate SBP ratio', 'occult shock', 'hemorrhagic shock', 'massive transfusion', 'hemodynamic instability'],
    components: [
      { id: 'score', label: 'Shock Index (HR/SBP)', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0.7, risk: 'Normal', interpretation: 'SI 0.5–0.7: Normal hemodynamics' },
        { min: 0.7, max: 1.0, risk: 'Mild', interpretation: 'SI 0.7–1.0: Mild shock / borderline — close monitoring' },
        { min: 1.0, max: 1.4, risk: 'Moderate', interpretation: 'SI 1.0–1.4: Moderate shock — likely significant hemorrhage, consider transfusion' },
        { min: 1.4, max: 3, risk: 'Severe', interpretation: 'SI >1.4: Severe shock — massive hemorrhage likely, activate massive transfusion protocol' },
      ],
    },
  },

  // TRAUMA — ABC Score
  {
    id: 'abc_score',
    name: 'ABC Score',
    fullName: 'ABC Score (Assessment of Blood Consumption)',
    category: 'TRAUMA',
    application: 'Rapid bedside assessment to predict need for massive transfusion in trauma. Requires no lab values — entirely bedside assessment.',
    applicableChiefComplaints: ['major_trauma', 'hemorrhage', 'penetrating_trauma', 'shock'],
    keywords: ['ABC score', 'assessment blood consumption', 'massive transfusion', 'trauma transfusion', 'FAST exam', 'penetrating trauma', 'MTP activation'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Score 0: 1% need massive transfusion; Score 1: 10% need massive transfusion' },
        { min: 2, max: 4, risk: 'High', interpretation: 'Score ≥2: Activate massive transfusion protocol (41–100% probability)' },
      ],
    },
  },

  // TRAUMA — TASH Score
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
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 31 },
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
  },

  // TRAUMA — BIG Score
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
      { id: 'score', label: 'BIG Score', type: 'number_range', source: 'section1', min: 0, max: 60 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 9, risk: 'Low', interpretation: 'BIG <10: <5% predicted mortality' },
        { min: 10, max: 15, risk: 'Moderate', interpretation: 'BIG 10–15: ~10% predicted mortality' },
        { min: 16, max: 25, risk: 'High', interpretation: 'BIG 16–25: ~30% predicted mortality' },
        { min: 26, max: 35, risk: 'Very High', interpretation: 'BIG 26–35: ~60% predicted mortality' },
        { min: 36, max: 60, risk: 'Critical', interpretation: 'BIG >35: >80% predicted mortality' },
      ],
    },
  },

  // TRAUMA — Denver Criteria
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
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — CTA not required' },
        { min: 1, max: 12, risk: 'High', interpretation: 'Any criterion present — CTA of head/neck recommended (sensitivity >95% for clinically significant BCVI)' },
      ],
    },
  },

  // TRAUMA — NEXUS Blunt Cerebrovascular Screening
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
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 13 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — CTA not required' },
        { min: 1, max: 13, risk: 'High', interpretation: 'Any criterion present — CTA indicated (sensitivity 96.2% for BCVI)' },
      ],
    },
  },

// === CARDIOVASCULAR ===

  // CARDIOVASCULAR — HEART Pathway
  {
    id: 'heart_pathway',
    name: 'HEART Pathway',
    fullName: 'HEART Pathway',
    category: 'CARDIOVASCULAR',
    application: 'Accelerated diagnostic protocol combining HEART score with serial troponins (0 and 3 hours) to identify low-risk chest pain patients for early discharge.',
    applicableChiefComplaints: ['chest_pain', 'chest_tightness', 'atypical_chest_pain', 'acs_rule_out'],
    keywords: ['HEART pathway', 'accelerated diagnostic protocol', 'ADP', 'serial troponin', 'chest pain low risk', 'early discharge', 'MACE', '0 hour 3 hour troponin'],
    requiredTests: ['troponin (0h and 3h)', 'ECG'],
    components: [
      { id: 'score', label: 'HEART Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: 'HEART 0–3 + two negative troponins → ~0.4% 30-day MACE rate; candidate for early discharge' },
        { min: 4, max: 10, risk: 'Not Low Risk', interpretation: 'HEART ≥4 OR any troponin elevated → Not low risk, requires further workup' },
      ],
    },
  },

  // CARDIOVASCULAR — TIMI Risk Score (UA/NSTEMI)
  {
    id: 'timi_ua_nstemi',
    name: 'TIMI UA/NSTEMI',
    fullName: 'TIMI Risk Score (UA/NSTEMI)',
    category: 'CARDIOVASCULAR',
    application: 'Predicts 14-day risk of all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization in patients with UA/NSTEMI.',
    applicableChiefComplaints: ['chest_pain', 'acs', 'nstemi', 'unstable_angina'],
    keywords: ['TIMI', 'UA NSTEMI risk', 'acute coronary syndrome', 'ACS risk score', 'unstable angina', 'NSTEMI', 'CAD risk factors', 'troponin elevated', 'ST deviation'],
    requiredTests: ['troponin', 'ECG'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Score 0–2: ~5–8% 14-day event rate — consider noninvasive testing' },
        { min: 3, max: 4, risk: 'Intermediate', interpretation: 'Score 3–4: ~13–20% 14-day event rate — benefit from early invasive strategy' },
        { min: 5, max: 7, risk: 'High', interpretation: 'Score 5–7: ~26–41% 14-day event rate — strong benefit from early invasive strategy / aggressive medical therapy' },
      ],
    },
  },

  // CARDIOVASCULAR — Vancouver Chest Pain Rule
  {
    id: 'vancouver_chest_pain',
    name: 'Vancouver Chest Pain',
    fullName: 'Vancouver Chest Pain Rule',
    category: 'CARDIOVASCULAR',
    application: 'Identifies low-risk chest pain patients suitable for early ED discharge.',
    applicableChiefComplaints: ['chest_pain', 'atypical_chest_pain', 'acs_rule_out'],
    keywords: ['Vancouver chest pain rule', 'low risk chest pain discharge', 'ACS rule out', 'early discharge chest pain', 'troponin chest pain', 'ECG ischemia'],
    requiredTests: ['troponin', 'ECG'],
    components: [
      { id: 'score', label: 'Criteria Count (absent)', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 5, max: 5, risk: 'Low', interpretation: 'All 5 criteria met — Low risk for ACS, safe for early discharge consideration' },
        { min: 0, max: 4, risk: 'Elevated', interpretation: 'Any criterion not met — Further workup needed' },
      ],
    },
  },

  // CARDIOVASCULAR — EDACS
  {
    id: 'edacs',
    name: 'EDACS',
    fullName: 'EDACS (Emergency Department Assessment of Chest Pain Score)',
    category: 'CARDIOVASCULAR',
    application: 'Identifies low-risk chest pain for accelerated disposition combined with 0 and 2-hour troponins.',
    applicableChiefComplaints: ['chest_pain', 'acs_rule_out', 'atypical_chest_pain'],
    keywords: ['EDACS', 'emergency department assessment chest pain', 'EDACS-ADP', 'accelerated diagnostic protocol', 'chest pain score', 'low risk chest pain', '0 hour 2 hour troponin'],
    requiredTests: ['troponin (0h and 2h)', 'ECG'],
    components: [
      { id: 'score', label: 'EDACS Score', type: 'number_range', source: 'section1', min: -6, max: 46 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: -6, max: 15, risk: 'Low', interpretation: 'EDACS <16 AND no ECG ischemia AND both troponins negative → Low risk (~1% 30-day MACE); candidate for discharge' },
        { min: 16, max: 46, risk: 'Not Low Risk', interpretation: 'EDACS ≥16 or any above criteria not met → Not low risk; further evaluation required' },
      ],
    },
  },

  // CARDIOVASCULAR — High-Sensitivity Troponin Algorithms (ESC)
  {
    id: 'esc_hs_troponin',
    name: 'ESC hs-Troponin Algorithm',
    fullName: 'High-Sensitivity Troponin 0/1-Hour and 0/3-Hour Algorithms (ESC)',
    category: 'CARDIOVASCULAR',
    application: 'Rapid rule-in/rule-out of acute MI using high-sensitivity troponin (hs-cTn).',
    applicableChiefComplaints: ['chest_pain', 'acs_rule_out', 'nstemi'],
    keywords: ['high sensitivity troponin', 'hs-cTn', 'ESC troponin algorithm', '0/1 hour algorithm', '0/3 hour algorithm', 'rapid rule out MI', 'delta troponin', 'hs-cTnT', 'hs-cTnI'],
    requiredTests: ['high-sensitivity troponin (0h and 1h or 3h)'],
    components: [
      { id: 'score', label: 'Algorithm Result', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Rule-Out', interpretation: 'Baseline hs-cTn very low AND 1h delta below threshold → MI ruled out' },
        { min: 1, max: 1, risk: 'Observe', interpretation: 'Neither ruled in nor ruled out → Serial troponin at 3 hours, clinical reassessment' },
        { min: 2, max: 3, risk: 'Rule-In', interpretation: 'Baseline hs-cTn markedly elevated OR 1h delta above threshold → MI rule-in; treat as ACS' },
      ],
    },
  },

  // CARDIOVASCULAR — Revised Geneva Score
  {
    id: 'revised_geneva',
    name: 'Revised Geneva',
    fullName: 'Revised Geneva Score',
    category: 'CARDIOVASCULAR',
    application: 'Alternative pre-test probability assessment for PE. Does not include subjective "PE most likely diagnosis" criterion.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pe_rule_out', 'hypoxia', 'tachycardia'],
    keywords: ['revised Geneva score', 'Geneva PE', 'pulmonary embolism pre-test probability', 'PE risk stratification', 'DVT history', 'malignancy PE', 'hemoptysis'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 25 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: 'Score 0–3: Low pre-test probability (~8% PE prevalence)' },
        { min: 4, max: 10, risk: 'Intermediate', interpretation: 'Score 4–10: Intermediate pre-test probability (~29% PE prevalence)' },
        { min: 11, max: 25, risk: 'High', interpretation: 'Score ≥11: High pre-test probability (~74% PE prevalence)' },
      ],
    },
  },

  // CARDIOVASCULAR — PESI
  {
    id: 'pesi',
    name: 'PESI',
    fullName: 'PESI (Pulmonary Embolism Severity Index)',
    category: 'CARDIOVASCULAR',
    application: 'Risk stratifies patients with CONFIRMED PE to predict 30-day mortality and guide disposition (inpatient vs. outpatient).',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism', 'shortness_of_breath'],
    keywords: ['PESI', 'pulmonary embolism severity index', 'PE severity', 'PE mortality', 'PE disposition', 'outpatient PE treatment', 'PE risk class'],
    components: [
      { id: 'score', label: 'PESI Score', type: 'number_range', source: 'section1', min: 0, max: 300 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 65, risk: 'Class I — Very Low', interpretation: 'Score ≤65: 0–1.6% 30-day mortality — consider outpatient treatment' },
        { min: 66, max: 85, risk: 'Class II — Low', interpretation: 'Score 66–85: 1.7–3.5% 30-day mortality — consider outpatient treatment' },
        { min: 86, max: 105, risk: 'Class III — Intermediate', interpretation: 'Score 86–105: 3.2–7.1% 30-day mortality — inpatient management' },
        { min: 106, max: 125, risk: 'Class IV — High', interpretation: 'Score 106–125: 4–11.4% 30-day mortality — inpatient management' },
        { min: 126, max: 300, risk: 'Class V — Very High', interpretation: 'Score >125: 10–24.5% 30-day mortality — inpatient management' },
      ],
    },
  },

  // CARDIOVASCULAR — sPESI
  {
    id: 'spesi',
    name: 'sPESI',
    fullName: 'sPESI (Simplified PESI)',
    category: 'CARDIOVASCULAR',
    application: 'Simplified version of PESI for PE risk stratification.',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism', 'shortness_of_breath'],
    keywords: ['sPESI', 'simplified PESI', 'simplified pulmonary embolism severity index', 'PE severity simplified', 'PE disposition', 'outpatient PE'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Score 0: Low risk (1.0% 30-day mortality) — consider outpatient management' },
        { min: 1, max: 6, risk: 'High', interpretation: 'Score ≥1: High risk (10.9% 30-day mortality) — inpatient management' },
      ],
    },
  },

  // CARDIOVASCULAR — HESTIA Criteria
  {
    id: 'hestia',
    name: 'HESTIA',
    fullName: 'HESTIA Criteria',
    category: 'CARDIOVASCULAR',
    application: 'Identifies PE patients safe for outpatient management. All items must be "No" for outpatient eligibility.',
    applicableChiefComplaints: ['confirmed_pe', 'pulmonary_embolism'],
    keywords: ['HESTIA', 'HESTIA criteria', 'PE outpatient', 'pulmonary embolism discharge', 'PE home treatment', 'outpatient anticoagulation PE'],
    requiredTests: ['creatinine clearance'],
    components: [
      { id: 'score', label: 'Criteria Count (any yes)', type: 'number_range', source: 'section1', min: 0, max: 11 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Safe for Outpatient', interpretation: 'All 11 criteria answered "No" — safe for outpatient management' },
        { min: 1, max: 11, risk: 'Inpatient Required', interpretation: 'Any criterion "Yes" — inpatient management recommended' },
      ],
    },
  },

  // CARDIOVASCULAR — YEARS Algorithm
  {
    id: 'years_algorithm',
    name: 'YEARS Algorithm',
    fullName: 'YEARS Algorithm',
    category: 'CARDIOVASCULAR',
    application: 'Simplified diagnostic pathway for suspected PE that reduces unnecessary CTPA.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pe_rule_out', 'dvt_symptoms'],
    keywords: ['YEARS algorithm', 'YEARS PE', 'pulmonary embolism YEARS', 'D-dimer threshold', 'adjusted D-dimer', 'CTPA reduction', 'DVT signs hemoptysis'],
    requiredTests: ['D-dimer'],
    components: [
      { id: 'score', label: 'YEARS Items', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: '0 YEARS items AND D-dimer <1000 ng/mL → PE excluded' },
        { min: 1, max: 3, risk: 'Elevated', interpretation: '≥1 YEARS item AND D-dimer <500 ng/mL → PE excluded; D-dimer above threshold → CTPA indicated' },
      ],
    },
  },

  // CARDIOVASCULAR — ADvISED / ADD-RS
  {
    id: 'add_rs',
    name: 'ADD-RS',
    fullName: 'ADvISED Score / ADD-RS (Aortic Dissection Detection Risk Score)',
    category: 'CARDIOVASCULAR',
    application: 'Risk stratifies patients for acute aortic dissection, often combined with D-dimer.',
    applicableChiefComplaints: ['chest_pain', 'back_pain', 'tearing_chest_pain', 'aortic_dissection'],
    keywords: ['ADD-RS', 'ADvISED', 'aortic dissection detection risk score', 'acute aortic dissection', 'tearing chest pain', 'Marfan syndrome', 'pulse deficit', 'D-dimer dissection'],
    requiredTests: ['D-dimer', 'CT angiography aorta (if indicated)'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'ADD-RS 0 + D-dimer <500 ng/mL → Aortic dissection effectively ruled out; D-dimer ≥500 → advanced imaging indicated' },
        { min: 1, max: 1, risk: 'Intermediate', interpretation: 'ADD-RS 1 + D-dimer <500 ng/mL → Consider further imaging (low risk but not zero)' },
        { min: 2, max: 3, risk: 'High', interpretation: 'ADD-RS ≥2 → Advanced imaging indicated regardless of D-dimer (CTA aorta)' },
      ],
    },
  },

  // CARDIOVASCULAR — San Francisco Syncope Rule
  {
    id: 'sfsr',
    name: 'SFSR',
    fullName: 'San Francisco Syncope Rule (SFSR)',
    category: 'CARDIOVASCULAR',
    application: 'Predicts short-term (7-day) serious outcomes in patients with syncope (true LOC with spontaneous return).',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness', 'presyncope'],
    keywords: ['San Francisco syncope rule', 'SFSR', 'CHESS', 'syncope risk', 'syncope serious outcome', 'CHF syncope', 'ECG syncope', 'hematocrit syncope'],
    requiredTests: ['ECG', 'hematocrit/CBC'],
    components: [
      { id: 'score', label: 'CHESS Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria absent → Low risk (~2% 7-day serious outcome rate)' },
        { min: 1, max: 5, risk: 'High', interpretation: 'Any criterion present → Not low risk; consider further workup/admission' },
      ],
    },
  },

  // CARDIOVASCULAR — Canadian Syncope Risk Score
  {
    id: 'csrs',
    name: 'CSRS',
    fullName: 'Canadian Syncope Risk Score (CSRS)',
    category: 'CARDIOVASCULAR',
    application: 'Predicts 30-day serious adverse events after syncope in ED patients (age ≥16, presenting within 24 hours of syncope).',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness', 'presyncope'],
    keywords: ['Canadian syncope risk score', 'CSRS', 'syncope 30 day risk', 'vasovagal syncope', 'cardiac syncope', 'QTc prolonged syncope', 'troponin syncope', 'syncope disposition'],
    requiredTests: ['ECG', 'troponin', 'blood pressure'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: -3, max: 11 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: -3, max: 0, risk: 'Very Low', interpretation: 'Score −3 to 0: ~0.4–0.7% 30-day risk — consider safe discharge with outpatient follow-up' },
        { min: 1, max: 3, risk: 'Low', interpretation: 'Score 1–3: ~2.7–5.1% 30-day risk' },
        { min: 4, max: 5, risk: 'Medium', interpretation: 'Score 4–5: ~9.4–12.0% 30-day risk — consider admission or expedited cardiac workup' },
        { min: 6, max: 8, risk: 'High', interpretation: 'Score 6–8: ~17.2–25.9% 30-day risk' },
        { min: 9, max: 11, risk: 'Very High', interpretation: 'Score ≥9: ~34.8% 30-day risk' },
      ],
    },
  },

  // CARDIOVASCULAR — OESIL Score
  {
    id: 'oesil',
    name: 'OESIL Score',
    fullName: 'OESIL Score',
    category: 'CARDIOVASCULAR',
    application: 'Predicts 1-year all-cause mortality in patients presenting with syncope.',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
    keywords: ['OESIL', 'OESIL score', 'syncope mortality', '1 year syncope mortality', 'cardiovascular disease syncope', 'ECG syncope abnormal'],
    requiredTests: ['ECG'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'Score 0: 0% 1-year mortality' },
        { min: 1, max: 1, risk: 'Low', interpretation: 'Score 1: 0.8% 1-year mortality' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'Score 2: 19.6% 1-year mortality' },
        { min: 3, max: 3, risk: 'High', interpretation: 'Score 3: 34.7% 1-year mortality' },
        { min: 4, max: 4, risk: 'Very High', interpretation: 'Score 4: 57.1% 1-year mortality' },
      ],
    },
  },

  // CARDIOVASCULAR — Boston Syncope Rule
  {
    id: 'boston_syncope',
    name: 'Boston Syncope',
    fullName: 'Boston Syncope Rule',
    category: 'CARDIOVASCULAR',
    application: 'Identifies need for hospital admission after syncope based on risk of adverse outcomes.',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
    keywords: ['Boston syncope rule', 'syncope admission', 'syncope ACS', 'syncope heart failure', 'syncope CNS', 'troponin syncope', 'cardiac syncope admission'],
    requiredTests: ['ECG', 'troponin'],
    components: [
      { id: 'score', label: 'Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No criteria present — consider discharge (sensitivity ~97% for 30-day serious outcomes)' },
        { min: 1, max: 8, risk: 'High', interpretation: 'Any criterion present — admission indicated' },
      ],
    },
  },

  // CARDIOVASCULAR — FAINT Score
  {
    id: 'faint_score',
    name: 'FAINT Score',
    fullName: 'FAINT Score',
    category: 'CARDIOVASCULAR',
    application: 'Risk stratification for syncope, incorporating BNP.',
    applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
    keywords: ['FAINT score', 'syncope BNP', 'NT-proBNP syncope', 'heart failure syncope', 'arrhythmia syncope', 'troponin syncope', 'ECG syncope'],
    requiredTests: ['ECG', 'troponin', 'NT-proBNP'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Score 0: Low risk (~4% 30-day adverse event rate)' },
        { min: 1, max: 5, risk: 'Elevated', interpretation: 'Score ≥1: Increasing risk; further evaluation recommended' },
      ],
    },
  },

  // CARDIOVASCULAR — HAS-BLED Score
  {
    id: 'has_bled',
    name: 'HAS-BLED',
    fullName: 'HAS-BLED Score',
    category: 'CARDIOVASCULAR',
    application: 'Assesses risk of major bleeding in patients on anticoagulation for atrial fibrillation. Helps weigh bleeding risk against stroke risk.',
    applicableChiefComplaints: ['atrial_fibrillation', 'anticoagulation_management', 'afib'],
    keywords: ['HAS-BLED', 'bleeding risk score', 'anticoagulation bleeding', 'atrial fibrillation bleeding', 'warfarin bleeding risk', 'major hemorrhage atrial fibrillation'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 9 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Score 0–2: Annual major bleeding risk 1.1–1.9%' },
        { min: 3, max: 4, risk: 'Moderate-High', interpretation: 'Score 3–4: Annual major bleeding risk 3.7–8.7% — flag for closer monitoring and modifiable risk factor reduction' },
        { min: 5, max: 9, risk: 'Very High', interpretation: 'Score ≥5: Annual major bleeding risk 12.5% — does NOT necessarily mean withhold anticoagulation; address modifiable risks' },
      ],
    },
  },

  // CARDIOVASCULAR — Ottawa Aggressive Protocol (Acute AF)
  {
    id: 'ottawa_af_protocol',
    name: 'Ottawa AF Protocol',
    fullName: 'Ottawa Aggressive Protocol (Acute Atrial Fibrillation)',
    category: 'CARDIOVASCULAR',
    application: 'Guides ED management of recent-onset atrial fibrillation (<48 hours duration).',
    applicableChiefComplaints: ['atrial_fibrillation', 'palpitations', 'afib_with_rvr', 'new_onset_afib'],
    keywords: ['Ottawa aggressive protocol', 'Ottawa AF', 'acute atrial fibrillation', 'AF cardioversion', 'chemical cardioversion', 'procainamide AF', 'recent onset AF', 'rate control AF', 'electrical cardioversion'],
    components: [
      { id: 'score', label: 'Algorithm Step', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Unstable', interpretation: 'Hemodynamically unstable → Electrical cardioversion immediately' },
        { min: 2, max: 3, risk: 'Stable <48h', interpretation: 'Stable AND onset <48 hours — chemical cardioversion (procainamide preferred); ~60% convert; electrical cardioversion if chemical fails; can discharge if converted' },
        { min: 4, max: 4, risk: 'Onset >48h', interpretation: 'Onset >48 hours or uncertain duration → Rate control + anticoagulation; TEE-guided cardioversion if desired' },
      ],
    },
  },

  // CARDIOVASCULAR — Ottawa Heart Failure Risk Scale
  {
    id: 'ohfrs',
    name: 'OHFRS',
    fullName: 'Ottawa Heart Failure Risk Scale (OHFRS)',
    category: 'CARDIOVASCULAR',
    application: 'Predicts short-term (14-day) serious adverse events in ED heart failure patients being considered for discharge.',
    applicableChiefComplaints: ['heart_failure', 'shortness_of_breath', 'dyspnea', 'acute_decompensated_heart_failure'],
    keywords: ['Ottawa heart failure risk scale', 'OHFRS', 'heart failure disposition', 'HF discharge risk', 'BNP heart failure', 'troponin heart failure', 'ischemic ECG heart failure'],
    requiredTests: ['ECG', 'troponin', 'BUN/urea', 'NT-proBNP', 'serum CO2'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 14 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'Score 0: ~2.8% 14-day serious adverse event risk — consider discharge' },
        { min: 1, max: 1, risk: 'Low', interpretation: 'Score 1: ~5.3% 14-day risk — consider discharge with close follow-up' },
        { min: 2, max: 3, risk: 'Moderate', interpretation: 'Score 2–3: ~10–15% 14-day risk — observation / short stay' },
        { min: 4, max: 14, risk: 'High', interpretation: 'Score ≥4: ~20%+ 14-day risk — admission recommended' },
      ],
    },
  },

  // CARDIOVASCULAR — Modified Duke Criteria
  {
    id: 'modified_duke',
    name: 'Modified Duke',
    fullName: 'Modified Duke Criteria (Infective Endocarditis)',
    category: 'CARDIOVASCULAR',
    application: 'Diagnostic criteria for infective endocarditis.',
    applicableChiefComplaints: ['fever_with_bacteremia', 'endocarditis', 'fever_ivdu', 'new_murmur_fever'],
    keywords: ['Duke criteria', 'modified Duke criteria', 'infective endocarditis', 'endocarditis diagnosis', 'blood culture endocarditis', 'echocardiogram vegetation', 'HACEK endocarditis', 'Staph aureus bacteremia'],
    requiredTests: ['blood cultures (×2 or more)', 'echocardiogram'],
    components: [
      { id: 'score', label: 'Criteria Classification', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 2, risk: 'Rejected/Possible', interpretation: 'Firm alternative diagnosis, or does not meet criteria, or ≤3 minor criteria without major → Rejected or requires further evaluation' },
        { min: 3, max: 4, risk: 'Possible', interpretation: '1 major + 1 minor; OR 3 minor criteria → Possible IE' },
        { min: 5, max: 7, risk: 'Definite', interpretation: '2 major; OR 1 major + 3 minor; OR 5 minor criteria → Definite IE' },
      ],
    },
  },

  // CARDIOVASCULAR — GRACE 2.0 Score
  {
    id: 'grace_score',
    name: 'GRACE 2.0',
    fullName: 'GRACE 2.0 Score (Global Registry of Acute Coronary Events)',
    category: 'CARDIOVASCULAR',
    application: 'Predicts in-hospital and 6-month mortality in patients with acute coronary syndrome (NSTEMI/STEMI). Used for risk stratification and treatment decisions.',
    applicableChiefComplaints: ['chest_pain', 'acs', 'nstemi', 'stemi'],
    keywords: ['GRACE score', 'GRACE 2.0', 'global registry acute coronary events', 'ACS mortality', 'NSTEMI risk', 'STEMI risk', 'Killip class', 'cardiac arrest ACS', 'invasive strategy ACS'],
    requiredTests: ['troponin/cardiac biomarkers', 'ECG', 'creatinine'],
    components: [
      { id: 'score', label: 'GRACE Score', type: 'number_range', source: 'section1', min: 0, max: 300 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 108, risk: 'Low', interpretation: 'GRACE ≤108: Low in-hospital mortality (<1%); 6-month low if ≤88 (<3%)' },
        { min: 109, max: 140, risk: 'Intermediate', interpretation: 'GRACE 109–140: Intermediate in-hospital mortality (1–3%)' },
        { min: 141, max: 300, risk: 'High', interpretation: 'GRACE >140: High in-hospital mortality (>3%) — high-risk patients benefit most from early invasive strategy' },
      ],
    },
  },

  // CARDIOVASCULAR — CRUSADE Bleeding Score
  {
    id: 'crusade',
    name: 'CRUSADE',
    fullName: 'CRUSADE Bleeding Score',
    category: 'CARDIOVASCULAR',
    application: 'Predicts in-hospital major bleeding risk in NSTEMI patients. Guides decisions about anticoagulation intensity and invasive strategy.',
    applicableChiefComplaints: ['nstemi', 'acs', 'chest_pain'],
    keywords: ['CRUSADE', 'CRUSADE bleeding score', 'NSTEMI bleeding risk', 'ACS bleeding risk', 'anticoagulation bleeding NSTEMI', 'hematocrit bleeding', 'creatinine clearance bleeding'],
    requiredTests: ['hematocrit', 'creatinine clearance', 'heart rate', 'blood pressure'],
    components: [
      { id: 'score', label: 'CRUSADE Score', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 20, risk: 'Very Low', interpretation: 'Score ≤20: 3.1% major in-hospital bleeding rate' },
        { min: 21, max: 30, risk: 'Low', interpretation: 'Score 21–30: 5.5% major in-hospital bleeding rate' },
        { min: 31, max: 40, risk: 'Moderate', interpretation: 'Score 31–40: 8.6% major in-hospital bleeding rate' },
        { min: 41, max: 50, risk: 'High', interpretation: 'Score 41–50: 11.9% major in-hospital bleeding rate' },
        { min: 51, max: 100, risk: 'Very High', interpretation: 'Score >50: 19.5% major in-hospital bleeding rate' },
      ],
    },
  },

  // CARDIOVASCULAR — Sgarbossa Criteria
  {
    id: 'sgarbossa',
    name: 'Sgarbossa Criteria',
    fullName: 'Sgarbossa Criteria (STEMI Diagnosis in LBBB)',
    category: 'CARDIOVASCULAR',
    application: 'Identifies acute MI in the presence of left bundle branch block (LBBB), where standard ST criteria are unreliable.',
    applicableChiefComplaints: ['chest_pain', 'lbbb', 'stemi_equivalent', 'ventricular_paced_rhythm'],
    keywords: ['Sgarbossa criteria', 'Smith-modified Sgarbossa', 'LBBB MI', 'STEMI LBBB', 'concordant ST elevation', 'discordant ST', 'left bundle branch block ACS', 'paced rhythm MI'],
    requiredTests: ['ECG (12-lead)'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 2, risk: 'Non-Diagnostic', interpretation: 'Score <3 (original): Non-diagnostic for acute MI in LBBB' },
        { min: 3, max: 10, risk: 'STEMI Equivalent', interpretation: 'Score ≥3 (original): Highly specific for acute MI (specificity ~90%). Smith-Modified: ANY one criterion present → treat as STEMI equivalent (sensitivity ~91%, specificity ~90%)' },
      ],
    },
  },

  // CARDIOVASCULAR — Framingham Heart Failure Criteria
  {
    id: 'framingham_hf',
    name: 'Framingham HF',
    fullName: 'Framingham Heart Failure Criteria',
    category: 'CARDIOVASCULAR',
    application: 'Clinical diagnosis of congestive heart failure. Requires 2 major criteria OR 1 major + 2 minor criteria.',
    applicableChiefComplaints: ['heart_failure', 'shortness_of_breath', 'dyspnea', 'edema', 'orthopnea'],
    keywords: ['Framingham heart failure criteria', 'CHF diagnosis', 'congestive heart failure criteria', 'paroxysmal nocturnal dyspnea', 'S3 gallop', 'cardiomegaly', 'JVD CHF', 'rales CHF'],
    components: [
      { id: 'score', label: 'Criteria Classification', type: 'number_range', source: 'section1', min: 0, max: 16 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Non-Diagnostic', interpretation: 'Insufficient criteria — CHF not diagnosed by these criteria' },
        { min: 2, max: 16, risk: 'CHF Diagnosed', interpretation: '2 major criteria OR 1 major + 2 minor criteria → CHF diagnosis (sensitivity ~97%, specificity ~78%)' },
      ],
    },
  },

  // CARDIOVASCULAR — Duke Activity Status Index
  {
    id: 'dasi',
    name: 'DASI',
    fullName: 'Duke Activity Status Index (DASI)',
    category: 'CARDIOVASCULAR',
    application: 'Estimates functional capacity in METs (metabolic equivalents) from self-reported activities. Used for preoperative cardiac risk assessment.',
    applicableChiefComplaints: ['preoperative_evaluation', 'cardiac_risk_assessment', 'chest_pain', 'dyspnea_on_exertion'],
    keywords: ['DASI', 'Duke activity status index', 'functional capacity METs', 'preoperative cardiac risk', 'metabolic equivalents', 'perioperative cardiac assessment', 'exercise capacity'],
    components: [
      { id: 'score', label: 'DASI Score', type: 'number_range', source: 'section1', min: 0, max: 58 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 11, risk: 'Poor', interpretation: 'DASI <12 (approximately <4 METs): Poor functional capacity — consider further cardiac testing' },
        { min: 12, max: 33, risk: 'Moderate', interpretation: 'DASI 12–33 (approximately 4–7 METs): Increased perioperative cardiac risk' },
        { min: 34, max: 58, risk: 'Adequate', interpretation: 'DASI ≥34 (approximately ≥7 METs): Adequate functional capacity; generally low perioperative risk' },
      ],
    },
  },

  // CARDIOVASCULAR — ATRIA Bleeding Risk Score
  {
    id: 'atria_bleeding',
    name: 'ATRIA Bleeding',
    fullName: 'ATRIA Bleeding Risk Score',
    category: 'CARDIOVASCULAR',
    application: 'Predicts major hemorrhage risk in patients on warfarin for atrial fibrillation.',
    applicableChiefComplaints: ['atrial_fibrillation', 'anticoagulation_management', 'afib'],
    keywords: ['ATRIA bleeding', 'ATRIA bleeding risk', 'warfarin hemorrhage risk', 'atrial fibrillation bleeding warfarin', 'anticoagulation major bleeding', 'anemia bleeding risk', 'renal disease bleeding'],
    requiredTests: ['hemoglobin', 'eGFR/creatinine'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: 'Score 0–3: Low risk — 0.8% annual hemorrhage rate' },
        { min: 4, max: 4, risk: 'Intermediate', interpretation: 'Score 4: Intermediate risk — 2.6% annual hemorrhage rate' },
        { min: 5, max: 10, risk: 'High', interpretation: 'Score 5–10: High risk — 5.8% annual hemorrhage rate' },
      ],
    },
  },
  // CARDIOVASCULAR — STRATIFY
  {
    id: 'stratify_ahf',
    name: 'STRATIFY',
    fullName: 'STRATIFY Decision Rule (Acute Heart Failure)',
    category: 'CARDIOVASCULAR',
    application: 'Aids disposition decision-making for acute heart failure. Identifies patients safe for discharge.',
    applicableChiefComplaints: ['dyspnea', 'heart_failure', 'chf_exacerbation', 'edema', 'shortness_of_breath'],
    keywords: ['STRATIFY', 'acute heart failure', 'CHF', 'disposition', 'discharge', 'heart failure exacerbation'],
    requiredTests: ['troponin', 'bmp', 'ecg', 'chest_xray'],
    components: [
      { id: 'score', label: 'Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'All criteria met (no troponin elevation, no renal dysfunction, no ischemic ECG changes, adequate oxygenation, adequate diuresis, stable vitals, no IV vasodilators/inotropes). Safe for discharge consideration.' },
        { min: 1, max: 7, risk: 'Not Low', interpretation: 'One or more criteria not met. Not safe for early discharge. Continued inpatient management recommended.' },
      ],
    },
  },
// === PULMONARY ===

  // PULMONARY — CRB-65
  {
    id: 'crb_65',
    name: 'CRB-65',
    fullName: 'CRB-65',
    category: 'PULMONARY',
    application: 'Simplified CURB-65 without urea (for use in outpatient/clinic settings without labs).',
    applicableChiefComplaints: ['cough', 'shortness_of_breath', 'fever', 'pneumonia'],
    keywords: ['CRB-65', 'pneumonia', 'community-acquired pneumonia', 'CAP', 'severity', 'outpatient', 'no labs'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Low risk; outpatient treatment appropriate' },
        { min: 1, max: 2, risk: 'Moderate', interpretation: 'Consider hospital referral' },
        { min: 3, max: 4, risk: 'High', interpretation: 'Urgent hospital admission required' },
      ],
    },
  },

  // PULMONARY — PSI/PORT Score
  {
    id: 'psi_port',
    name: 'PSI/PORT',
    fullName: 'Pneumonia Severity Index (PSI / PORT Score)',
    category: 'PULMONARY',
    application: 'Risk stratification for CAP mortality; guides inpatient vs. outpatient treatment. Uses a two-step process: clinical screening for Class I, then point calculation for Classes II–V.',
    applicableChiefComplaints: ['cough', 'shortness_of_breath', 'fever', 'pneumonia'],
    keywords: ['PSI', 'PORT', 'pneumonia severity index', 'community-acquired pneumonia', 'CAP', 'mortality', 'disposition'],
    requiredTests: ['BUN', 'sodium', 'glucose', 'hematocrit', 'arterial blood gas', 'chest x-ray'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 395 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Class I', interpretation: 'Step 1 screen negative — 0.1% mortality; outpatient treatment' },
        { min: 1, max: 70, risk: 'Class II', interpretation: '0.6% mortality; outpatient treatment' },
        { min: 71, max: 90, risk: 'Class III', interpretation: '0.9–2.8% mortality; outpatient or brief observation' },
        { min: 91, max: 130, risk: 'Class IV', interpretation: '8.2–9.3% mortality; inpatient admission' },
        { min: 131, max: 395, risk: 'Class V', interpretation: '27–31% mortality; inpatient, consider ICU' },
      ],
    },
  },

  // PULMONARY — Ottawa COPD Risk Scale
  {
    id: 'ottawa_copd',
    name: 'Ottawa COPD Risk Scale',
    fullName: 'Ottawa COPD Risk Scale',
    category: 'PULMONARY',
    application: 'Predicts short-term serious adverse events in patients presenting to the ED with acute COPD exacerbation.',
    applicableChiefComplaints: ['shortness_of_breath', 'copd_exacerbation', 'wheezing', 'dyspnea'],
    keywords: ['COPD', 'Ottawa', 'exacerbation', 'adverse events', 'disposition', 'discharge'],
    requiredTests: ['ECG', 'chest x-ray', 'hemoglobin', 'BUN', 'CO2'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 16 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: '~2.2% risk of serious adverse event; consider safe discharge with close follow-up' },
        { min: 1, max: 1, risk: 'Low', interpretation: '~4.0% risk of serious adverse event' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '~7.2% risk of serious adverse event' },
        { min: 3, max: 16, risk: 'High', interpretation: '~12%+ risk of serious adverse event; consider observation or admission' },
      ],
    },
  },

  // PULMONARY — DECAF Score
  {
    id: 'decaf',
    name: 'DECAF',
    fullName: 'DECAF Score',
    category: 'PULMONARY',
    application: 'Predicts in-hospital mortality from acute exacerbation of COPD.',
    applicableChiefComplaints: ['shortness_of_breath', 'copd_exacerbation', 'dyspnea'],
    keywords: ['DECAF', 'COPD', 'exacerbation', 'mortality', 'eosinopenia', 'atrial fibrillation', 'acidemia', 'consolidation'],
    requiredTests: ['eosinophil count', 'arterial blood gas', 'chest x-ray', 'ECG'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: '0–1.4% in-hospital mortality' },
        { min: 2, max: 2, risk: 'Intermediate', interpretation: '5.3% in-hospital mortality' },
        { min: 3, max: 3, risk: 'High', interpretation: '15.3% in-hospital mortality' },
        { min: 4, max: 6, risk: 'Very High', interpretation: '31–50% in-hospital mortality' },
      ],
    },
  },

  // PULMONARY — PASS (Pediatric Asthma Severity Score)
  {
    id: 'pass_asthma',
    name: 'PASS',
    fullName: 'PASS (Pediatric Asthma Severity Score)',
    category: 'PULMONARY',
    application: 'Standardized assessment of acute asthma severity in children to guide treatment.',
    applicableChiefComplaints: ['wheezing', 'shortness_of_breath', 'asthma_exacerbation', 'respiratory_distress'],
    keywords: ['PASS', 'pediatric asthma', 'asthma severity', 'children', 'wheezing', 'bronchospasm'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 3, max: 9 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 3, max: 4, risk: 'Mild', interpretation: 'Standard bronchodilator therapy' },
        { min: 5, max: 6, risk: 'Moderate', interpretation: 'Aggressive bronchodilator therapy, consider systemic corticosteroids' },
        { min: 7, max: 9, risk: 'Severe', interpretation: 'Continuous nebulization, IV magnesium, consider escalation' },
      ],
    },
  },

  // PULMONARY — Light's Criteria
  {
    id: 'lights_criteria',
    name: "Light's Criteria",
    fullName: "Light's Criteria (Pleural Effusion)",
    category: 'PULMONARY',
    application: 'Differentiates transudative from exudative pleural effusions. Essential for determining the etiology of pleural effusion.',
    applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pleural_effusion'],
    keywords: ["Light's criteria", 'pleural effusion', 'transudate', 'exudate', 'LDH', 'protein', 'thoracentesis'],
    requiredTests: ['pleural fluid protein', 'serum protein', 'pleural fluid LDH', 'serum LDH'],
    components: [
      { id: 'score', label: 'Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Transudate', interpretation: 'None of the three criteria met; caused by systemic factors (CHF, cirrhosis, nephrotic syndrome) — treat underlying cause' },
        { min: 1, max: 3, risk: 'Exudate', interpretation: 'One or more criteria met; caused by local/inflammatory processes — infection, malignancy, PE, autoimmune; requires further workup' },
      ],
    },
  },

  // PULMONARY — Berlin Criteria (ARDS)
  {
    id: 'berlin_ards',
    name: 'Berlin Criteria',
    fullName: 'Berlin Criteria (ARDS Definition)',
    category: 'PULMONARY',
    application: 'Defines Acute Respiratory Distress Syndrome (ARDS) and classifies severity to guide ventilator management.',
    applicableChiefComplaints: ['shortness_of_breath', 'respiratory_failure', 'hypoxia', 'respiratory_distress'],
    keywords: ['Berlin criteria', 'ARDS', 'acute respiratory distress syndrome', 'PaO2/FiO2', 'P/F ratio', 'ventilator', 'PEEP'],
    requiredTests: ['arterial blood gas', 'chest x-ray', 'PaO2/FiO2 ratio'],
    components: [
      { id: 'score', label: 'PaO2/FiO2 Ratio', type: 'number_range', source: 'section1', min: 0, max: 300 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 200, max: 300, risk: 'Mild ARDS', interpretation: '27% mortality; consider noninvasive ventilation, PEEP ≥5 cmH2O' },
        { min: 100, max: 199, risk: 'Moderate ARDS', interpretation: '32% mortality; lung-protective ventilation (6 mL/kg IBW), higher PEEP strategy' },
        { min: 0, max: 99, risk: 'Severe ARDS', interpretation: '45% mortality; lung-protective ventilation, prone positioning ≥16 hr/day, consider ECMO' },
      ],
    },
  },

  // PULMONARY — SMART-COP
  {
    id: 'smart_cop',
    name: 'SMART-COP',
    fullName: 'SMART-COP (Pneumonia ICU Admission)',
    category: 'PULMONARY',
    application: 'Predicts need for intensive respiratory or vasopressor support (IRVS) in community-acquired pneumonia. Identifies patients who need ICU admission.',
    applicableChiefComplaints: ['cough', 'shortness_of_breath', 'fever', 'pneumonia'],
    keywords: ['SMART-COP', 'pneumonia', 'ICU', 'vasopressor', 'intensive respiratory support', 'CAP', 'IRVS'],
    requiredTests: ['chest x-ray', 'albumin', 'arterial blood gas'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 11 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: '~5% need for intensive respiratory or vasopressor support' },
        { min: 3, max: 4, risk: 'Moderate', interpretation: '~18% need for IRVS; consider ICU or step-down unit' },
        { min: 5, max: 6, risk: 'High', interpretation: '~36% need for IRVS; strongly consider ICU admission' },
        { min: 7, max: 11, risk: 'Very High', interpretation: '~62% need for IRVS; ICU admission recommended' },
      ],
    },
  },

  // PULMONARY — ROX Index
  {
    id: 'rox_index',
    name: 'ROX Index',
    fullName: 'ROX Index (HFNC Failure Prediction)',
    category: 'PULMONARY',
    application: 'Predicts failure of high-flow nasal cannula (HFNC) oxygen therapy, identifying patients who may need intubation.',
    applicableChiefComplaints: ['shortness_of_breath', 'respiratory_failure', 'hypoxia'],
    keywords: ['ROX index', 'HFNC', 'high flow nasal cannula', 'intubation', 'respiratory failure', 'oxygen therapy'],
    components: [
      { id: 'score', label: 'ROX Index Value', type: 'number_range', source: 'section1', min: 0, max: 20 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 3, risk: 'High Risk', interpretation: 'High risk of HFNC failure; consider intubation (ROX <3.85 at 2h, <3.47 at 6h)' },
        { min: 3, max: 4, risk: 'Intermediate', interpretation: 'Intermediate risk; reassess frequently and trend ROX index' },
        { min: 4, max: 20, risk: 'Low Risk', interpretation: 'ROX ≥4.88 at 2, 6, or 12 hours: Low risk of HFNC failure; continue HFNC' },
      ],
    },
  },

  // PULMONARY — BODE Index
  {
    id: 'bode_index',
    name: 'BODE Index',
    fullName: 'BODE Index (COPD Prognosis)',
    category: 'PULMONARY',
    application: 'Multidimensional assessment of COPD prognosis. Predicts mortality better than FEV1 alone.',
    applicableChiefComplaints: ['shortness_of_breath', 'copd', 'dyspnea', 'exercise_intolerance'],
    keywords: ['BODE', 'COPD', 'prognosis', 'mortality', 'FEV1', 'BMI', 'dyspnea', 'mMRC', '6-minute walk'],
    requiredTests: ['FEV1', '6-minute walk test', 'BMI'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: '~15% 4-year mortality' },
        { min: 3, max: 4, risk: 'Moderate', interpretation: '~25% 4-year mortality' },
        { min: 5, max: 6, risk: 'High', interpretation: '~45% 4-year mortality' },
        { min: 7, max: 10, risk: 'Very High', interpretation: '~80% 4-year mortality' },
      ],
    },
  },

  // PULMONARY — RSBI
  {
    id: 'rsbi',
    name: 'RSBI',
    fullName: 'Rapid Shallow Breathing Index (RSBI)',
    category: 'PULMONARY',
    application: 'Predicts success of weaning from mechanical ventilation (spontaneous breathing trial).',
    applicableChiefComplaints: ['mechanical_ventilation', 'respiratory_failure', 'icu'],
    keywords: ['RSBI', 'rapid shallow breathing index', 'weaning', 'extubation', 'mechanical ventilation', 'spontaneous breathing trial', 'SBT'],
    components: [
      { id: 'score', label: 'RSBI (breaths/min/L)', type: 'number_range', source: 'section1', min: 0, max: 300 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 104, risk: 'Favorable', interpretation: 'RSBI <105: Likely to tolerate extubation (PPV ~78%)' },
        { min: 105, max: 300, risk: 'Unfavorable', interpretation: 'RSBI ≥105: Likely to fail extubation (NPV ~95%)' },
      ],
    },
  },

  // PULMONARY — Murray Lung Injury Score
  {
    id: 'murray_lung_injury',
    name: 'Murray Lung Injury Score',
    fullName: 'Murray Lung Injury Score',
    category: 'PULMONARY',
    application: 'Quantifies severity of acute lung injury. Can be used to identify patients who may benefit from ECMO.',
    applicableChiefComplaints: ['respiratory_failure', 'shortness_of_breath', 'hypoxia', 'ards'],
    keywords: ['Murray score', 'lung injury score', 'ARDS', 'ECMO', 'acute lung injury', 'PaO2/FiO2', 'PEEP', 'compliance'],
    requiredTests: ['arterial blood gas', 'chest x-ray', 'PaO2/FiO2 ratio', 'lung compliance', 'PEEP'],
    components: [
      { id: 'score', label: 'Murray Score (sum / components)', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'None', interpretation: 'Score 0: No lung injury' },
        { min: 1, max: 2, risk: 'Mild-Moderate', interpretation: 'Score 0.1–2.5: Mild to moderate lung injury' },
        { min: 3, max: 4, risk: 'Severe', interpretation: 'Score >2.5: Severe lung injury (ARDS); consider ECMO referral' },
      ],
    },
  },

// === NEUROLOGY ===

  // NEUROLOGY — NIHSS
  {
    id: 'nihss',
    name: 'NIHSS',
    fullName: 'NIHSS (National Institutes of Health Stroke Scale)',
    category: 'NEUROLOGY',
    application: 'Quantifies stroke deficit severity to guide treatment decisions (especially thrombolysis eligibility) and predict outcomes.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness', 'speech_difficulty', 'focal_neurological_deficit'],
    keywords: ['NIHSS', 'NIH stroke scale', 'stroke severity', 'thrombolysis', 'alteplase', 'tPA', 'thrombectomy', 'LVO'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 42 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'None', interpretation: 'No stroke symptoms' },
        { min: 1, max: 4, risk: 'Minor', interpretation: 'Minor stroke' },
        { min: 5, max: 15, risk: 'Moderate', interpretation: 'Moderate stroke; generally supports IV alteplase consideration' },
        { min: 16, max: 20, risk: 'Moderate-Severe', interpretation: 'Moderate to severe stroke' },
        { min: 21, max: 42, risk: 'Severe', interpretation: 'Severe stroke; strong consideration for thrombectomy evaluation if LVO suspected' },
      ],
    },
  },

  // NEUROLOGY — Cincinnati Prehospital Stroke Scale
  {
    id: 'cpss',
    name: 'CPSS',
    fullName: 'Cincinnati Prehospital Stroke Scale (CPSS)',
    category: 'NEUROLOGY',
    application: 'Rapid prehospital stroke screening tool using three bedside assessments.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness', 'speech_difficulty'],
    keywords: ['Cincinnati', 'CPSS', 'prehospital stroke', 'stroke screen', 'facial droop', 'arm drift', 'speech', 'BE-FAST'],
    components: [
      { id: 'score', label: 'Abnormal Findings', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No abnormal findings; stroke less likely but does not rule out' },
        { min: 1, max: 2, risk: 'High', interpretation: 'Any 1 finding abnormal: ~72% probability of stroke; activate stroke alert' },
        { min: 3, max: 3, risk: 'Very High', interpretation: 'All 3 abnormal: >85% probability of stroke; activate stroke alert immediately' },
      ],
    },
  },

  // NEUROLOGY — RACE Scale
  {
    id: 'race_scale',
    name: 'RACE Scale',
    fullName: 'RACE Scale (Rapid Arterial oCclusion Evaluation)',
    category: 'NEUROLOGY',
    application: 'Prehospital large vessel occlusion (LVO) detection for field triage to thrombectomy-capable center.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness', 'aphasia', 'gaze_deviation'],
    keywords: ['RACE', 'LVO', 'large vessel occlusion', 'thrombectomy', 'prehospital', 'stroke triage', 'facial palsy', 'aphasia'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 9 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low LVO Probability', interpretation: 'Transport to nearest stroke center' },
        { min: 5, max: 9, risk: 'High LVO Probability', interpretation: '~85% sensitivity for LVO; transport to comprehensive/thrombectomy-capable center' },
      ],
    },
  },

  // NEUROLOGY — LAMS
  {
    id: 'lams',
    name: 'LAMS',
    fullName: 'LAMS (Los Angeles Motor Scale)',
    category: 'NEUROLOGY',
    application: 'Prehospital LVO detection using 3 motor assessments.',
    applicableChiefComplaints: ['stroke', 'facial_droop', 'arm_weakness'],
    keywords: ['LAMS', 'Los Angeles Motor Scale', 'LVO', 'large vessel occlusion', 'prehospital', 'stroke', 'thrombectomy', 'motor'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Lower LVO Probability', interpretation: 'Lower probability of LVO; does not exclude LVO' },
        { min: 4, max: 5, risk: 'High LVO Probability', interpretation: 'LAMS ≥4: Highly suggestive of LVO; transport to thrombectomy-capable center' },
      ],
    },
  },

  // NEUROLOGY — BE-FAST
  {
    id: 'be_fast',
    name: 'BE-FAST',
    fullName: 'BE-FAST Mnemonic',
    category: 'NEUROLOGY',
    application: 'Public and prehospital stroke recognition mnemonic covering Balance, Eyes, Face, Arms, Speech, and Time.',
    applicableChiefComplaints: ['stroke', 'balance_problems', 'vision_changes', 'facial_droop', 'arm_weakness', 'speech_difficulty'],
    keywords: ['BE-FAST', 'BEFAST', 'FAST', 'stroke', 'prehospital', 'stroke recognition', 'balance', 'eyes', 'face', 'arms', 'speech'],
    components: [
      { id: 'score', label: 'Positive Signs', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No positive signs; stroke less likely' },
        { min: 1, max: 6, risk: 'High', interpretation: 'Any positive sign: activate emergency response immediately; note time of last known well' },
      ],
    },
  },

  // NEUROLOGY — Ottawa SAH Rule
  {
    id: 'ottawa_sah',
    name: 'Ottawa SAH Rule',
    fullName: 'Ottawa SAH Rule',
    category: 'NEUROLOGY',
    application: 'Identifies which patients presenting with acute headache need investigation for subarachnoid hemorrhage. Applied to alert (GCS 15) patients ≥15 years with new severe non-traumatic headache reaching maximum intensity within 1 hour.',
    applicableChiefComplaints: ['headache', 'thunderclap_headache', 'worst_headache_of_life'],
    keywords: ['Ottawa SAH', 'subarachnoid hemorrhage', 'SAH', 'headache', 'thunderclap headache', 'lumbar puncture', 'CT head'],
    components: [
      { id: 'score', label: 'High-Risk Criteria Present', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low Risk', interpretation: 'All criteria absent: very low risk; SAH investigation may not be required' },
        { min: 1, max: 6, risk: 'High Risk', interpretation: 'ANY criterion present: investigate for SAH (CT head ± LP or CTA); sensitivity 100%' },
      ],
    },
  },

  // NEUROLOGY — 6-Hour CT Rule for SAH
  {
    id: 'six_hour_ct_sah',
    name: '6-Hour CT Rule',
    fullName: '6-Hour CT Rule for SAH',
    category: 'NEUROLOGY',
    application: 'CT head within 6 hours of headache ictus has near-100% sensitivity for SAH in patients with GCS 15, when interpreted by experienced radiologist on modern scanner.',
    applicableChiefComplaints: ['headache', 'thunderclap_headache', 'worst_headache_of_life'],
    keywords: ['6-hour CT', 'SAH', 'subarachnoid hemorrhage', 'CT sensitivity', 'Perry', 'headache', 'lumbar puncture'],
    requiredTests: ['CT head non-contrast'],
    components: [
      { id: 'score', label: 'Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 4, max: 4, risk: 'Rule Applicable', interpretation: 'Negative CT within 6 hours of ictus with GCS 15: ~100% sensitivity for SAH; may be sufficient to rule out without LP' },
        { min: 0, max: 3, risk: 'Rule Not Applicable', interpretation: 'CT >6 hours from onset or GCS <15: LP or CTA still recommended if clinical suspicion persists' },
      ],
    },
  },

  // NEUROLOGY — ABCD2 Score
  {
    id: 'abcd2',
    name: 'ABCD2',
    fullName: 'ABCD\u00b2 Score',
    category: 'NEUROLOGY',
    application: 'Predicts 2-, 7-, and 90-day stroke risk after TIA.',
    applicableChiefComplaints: ['tia', 'transient_ischemic_attack', 'focal_neurological_deficit', 'speech_difficulty', 'arm_weakness'],
    keywords: ['ABCD2', 'TIA', 'transient ischemic attack', 'stroke risk', 'hypertension', 'diabetes', 'weakness', 'speech'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: '1.0% 2-day and 1.2% 7-day stroke risk' },
        { min: 4, max: 5, risk: 'Moderate', interpretation: '4.1% 2-day and 5.9% 7-day stroke risk; urgent evaluation within 24–48 hours' },
        { min: 6, max: 7, risk: 'High', interpretation: '8.1% 2-day and 11.7% 7-day stroke risk; urgent evaluation indicated' },
      ],
    },
  },

  // NEUROLOGY — Canadian TIA Score
  {
    id: 'canadian_tia',
    name: 'Canadian TIA Score',
    fullName: 'Canadian TIA Score',
    category: 'NEUROLOGY',
    application: 'Predicts 7-day stroke risk after TIA. More discriminating than ABCD2 alone.',
    applicableChiefComplaints: ['tia', 'transient_ischemic_attack', 'focal_neurological_deficit'],
    keywords: ['Canadian TIA', 'TIA score', 'stroke risk', 'transient ischemic attack', 'carotid stenosis', 'antiplatelet', 'atrial fibrillation'],
    requiredTests: ['platelet count', 'glucose', 'blood pressure'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: -3, max: 23 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: -3, max: 3, risk: 'Very Low', interpretation: '<1% 7-day stroke risk' },
        { min: 4, max: 8, risk: 'Low', interpretation: '~2% 7-day stroke risk; potentially safe for outpatient rapid evaluation (score ≤5)' },
        { min: 9, max: 13, risk: 'Medium', interpretation: '~7% 7-day stroke risk; consider admission for expedited workup (score ≥6)' },
        { min: 14, max: 23, risk: 'High', interpretation: '~14% 7-day stroke risk; admission for expedited workup recommended' },
      ],
    },
  },

  // NEUROLOGY — HINTS Exam
  {
    id: 'hints_exam',
    name: 'HINTS Exam',
    fullName: 'HINTS Exam',
    category: 'NEUROLOGY',
    application: 'Bedside exam to differentiate central (stroke) from peripheral (vestibular neuritis/BPPV) cause of acute vestibular syndrome (acute onset, persistent vertigo, nystagmus, gait instability). Applied to continuous vertigo with nystagmus, not episodic positional vertigo.',
    applicableChiefComplaints: ['vertigo', 'dizziness', 'nystagmus', 'gait_instability'],
    keywords: ['HINTS', 'head impulse test', 'nystagmus', 'skew deviation', 'vertigo', 'vestibular', 'central', 'peripheral', 'stroke', 'INFARCT'],
    components: [
      { id: 'score', label: 'Central Features Present', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Peripheral (Benign)', interpretation: 'All 3 benign (abnormal impulse + direction-fixed nystagmus + no skew): peripheral cause likely; sensitivity ~97% for central cause, superior to early MRI in first 48 hours' },
        { min: 1, max: 3, risk: 'Central (Concerning)', interpretation: 'Any ONE central feature (normal head impulse, direction-changing nystagmus, or skew deviation): concerning for stroke; urgent MRI recommended' },
      ],
    },
  },

  // NEUROLOGY — STANDING Algorithm
  {
    id: 'standing_algorithm',
    name: 'STANDING Algorithm',
    fullName: 'STANDING Algorithm',
    category: 'NEUROLOGY',
    application: 'Bedside evaluation approach for acute vertigo combining orthostatic assessment, nystagmus analysis, and HINTS components.',
    applicableChiefComplaints: ['vertigo', 'dizziness', 'nystagmus'],
    keywords: ['STANDING', 'vertigo', 'HINTS', 'nystagmus', 'orthostatic', 'gait', 'central vs peripheral'],
    components: [
      { id: 'score', label: 'Algorithm Step', type: 'number_range', source: 'section1', min: 1, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 5, risk: 'Clinical Assessment', interpretation: 'Structured clinical approach: assess vitals/orthostatics, characterize nystagmus, perform HINTS exam, assess gait, integrate findings' },
      ],
    },
  },

  // NEUROLOGY — STESS
  {
    id: 'stess',
    name: 'STESS',
    fullName: 'Status Epilepticus Severity Score (STESS)',
    category: 'NEUROLOGY',
    application: 'Predicts outcomes (return to baseline) in patients with status epilepticus.',
    applicableChiefComplaints: ['seizure', 'status_epilepticus', 'altered_mental_status'],
    keywords: ['STESS', 'status epilepticus', 'seizure', 'outcome', 'prognosis', 'consciousness', 'nonconvulsive'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Favorable', interpretation: 'Return to baseline neurological status likely' },
        { min: 3, max: 6, risk: 'Unfavorable', interpretation: 'Higher mortality and poor functional outcome expected' },
      ],
    },
  },

  // NEUROLOGY — Hunt and Hess Scale
  {
    id: 'hunt_hess',
    name: 'Hunt and Hess Scale',
    fullName: 'Hunt and Hess Scale (Subarachnoid Hemorrhage)',
    category: 'NEUROLOGY',
    application: 'Clinical grading of subarachnoid hemorrhage (SAH) severity at presentation. Predicts surgical risk and outcome.',
    applicableChiefComplaints: ['headache', 'thunderclap_headache', 'subarachnoid_hemorrhage', 'altered_mental_status'],
    keywords: ['Hunt and Hess', 'SAH', 'subarachnoid hemorrhage', 'grading', 'surgical risk', 'aneurysm', 'nuchal rigidity'],
    components: [
      { id: 'score', label: 'Grade', type: 'number_range', source: 'section1', min: 1, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Grade I', interpretation: '~1% surgical mortality; asymptomatic or mild headache with slight nuchal rigidity; early surgical/endovascular intervention indicated' },
        { min: 2, max: 2, risk: 'Grade II', interpretation: '~5% surgical mortality; moderate-severe headache, nuchal rigidity, no neurological deficit except CN palsy' },
        { min: 3, max: 3, risk: 'Grade III', interpretation: '~19% surgical mortality; drowsiness, confusion, or mild focal deficit' },
        { min: 4, max: 4, risk: 'Grade IV', interpretation: '~42% surgical mortality; stupor, moderate to severe hemiparesis; complex management decisions' },
        { min: 5, max: 5, risk: 'Grade V', interpretation: '~77% surgical mortality; deep coma, decerebrate rigidity, moribund; requires stabilization before intervention' },
      ],
    },
  },

  // NEUROLOGY — Modified Fisher Scale
  {
    id: 'modified_fisher',
    name: 'Modified Fisher Scale',
    fullName: 'Modified Fisher Scale (SAH CT Grading)',
    category: 'NEUROLOGY',
    application: 'CT-based classification of subarachnoid hemorrhage. Predicts risk of delayed cerebral ischemia (vasospasm).',
    applicableChiefComplaints: ['headache', 'subarachnoid_hemorrhage', 'thunderclap_headache'],
    keywords: ['Modified Fisher', 'Fisher scale', 'SAH', 'subarachnoid hemorrhage', 'vasospasm', 'CT', 'IVH', 'intraventricular hemorrhage', 'delayed cerebral ischemia'],
    requiredTests: ['CT head non-contrast'],
    components: [
      { id: 'score', label: 'Grade', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Low Vasospasm Risk', interpretation: 'Grade 0: No SAH or IVH (very low risk); Grade 1: Thin SAH, no IVH (~15% vasospasm risk); standard monitoring' },
        { min: 2, max: 2, risk: 'Moderate Vasospasm Risk', interpretation: 'Grade 2: Thin SAH with IVH (~20% vasospasm risk)' },
        { min: 3, max: 4, risk: 'High Vasospasm Risk', interpretation: 'Grade 3: Thick SAH, no IVH (~30%); Grade 4: Thick SAH with IVH (~40%); aggressive monitoring with TCD, possible prophylactic therapy; all grades receive nimodipine 60 mg q4h x 21 days' },
      ],
    },
  },

  // NEUROLOGY — ICH Score
  {
    id: 'ich_score',
    name: 'ICH Score',
    fullName: 'ICH Score (Intracerebral Hemorrhage)',
    category: 'NEUROLOGY',
    application: 'Predicts 30-day mortality in spontaneous intracerebral hemorrhage. Simple bedside tool for prognosis discussion.',
    applicableChiefComplaints: ['altered_mental_status', 'focal_neurological_deficit', 'intracerebral_hemorrhage', 'headache'],
    keywords: ['ICH score', 'intracerebral hemorrhage', 'ICH', 'mortality', 'GCS', 'intraventricular hemorrhage', 'prognosis', 'ABC/2'],
    requiredTests: ['CT head non-contrast', 'GCS'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: '0% 30-day mortality' },
        { min: 1, max: 1, risk: 'Low', interpretation: '13% 30-day mortality' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '26% 30-day mortality' },
        { min: 3, max: 3, risk: 'High', interpretation: '72% 30-day mortality' },
        { min: 4, max: 6, risk: 'Very High', interpretation: '97–100% 30-day mortality' },
      ],
    },
  },

  // NEUROLOGY — FOUR Score
  {
    id: 'four_score',
    name: 'FOUR Score',
    fullName: 'FOUR Score (Full Outline of UnResponsiveness)',
    category: 'NEUROLOGY',
    application: 'Alternative to GCS for comatose patients, especially those who are intubated (cannot assess verbal). Assesses brainstem reflexes and respiration.',
    applicableChiefComplaints: ['altered_mental_status', 'coma', 'decreased_consciousness', 'intubated_patient'],
    keywords: ['FOUR score', 'coma', 'GCS', 'Glasgow Coma Scale', 'brainstem', 'intubated', 'unresponsive', 'brain death'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 16 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Critical', interpretation: 'Score 0 in all categories may indicate brain death; warrants formal brain death evaluation' },
        { min: 1, max: 7, risk: 'Severe', interpretation: 'Severe impairment; used for trending and communication rather than direct mortality cutoffs' },
        { min: 8, max: 12, risk: 'Moderate', interpretation: 'Moderate impairment; assess brainstem reflexes and ventilatory pattern' },
        { min: 13, max: 16, risk: 'Mild-Normal', interpretation: 'Mild or no coma; reassess for locked-in syndrome if E4 with low motor score' },
      ],
    },
  },

  // NEUROLOGY — ASPECTS
  {
    id: 'aspects',
    name: 'ASPECTS',
    fullName: 'ASPECTS (Alberta Stroke Program Early CT Score)',
    category: 'NEUROLOGY',
    application: 'Standardized CT scoring system for quantifying early ischemic changes in MCA territory stroke. Used in endovascular thrombectomy eligibility.',
    applicableChiefComplaints: ['stroke', 'focal_neurological_deficit', 'mca_stroke'],
    keywords: ['ASPECTS', 'Alberta Stroke', 'CT score', 'ischemic changes', 'MCA', 'thrombectomy', 'infarct core', 'endovascular'],
    requiredTests: ['CT head non-contrast'],
    components: [
      { id: 'score', label: 'ASPECTS Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 8, max: 10, risk: 'Favorable', interpretation: 'Small infarct core — favorable for reperfusion therapy (thrombectomy)' },
        { min: 6, max: 7, risk: 'Moderate', interpretation: 'Moderate infarct — treatment decision based on clinical factors' },
        { min: 0, max: 5, risk: 'Unfavorable', interpretation: 'Large infarct core — generally unfavorable for thrombectomy; higher risk of hemorrhagic transformation' },
      ],
    },
  },

  // NEUROLOGY — Modified Rankin Scale
  {
    id: 'modified_rankin',
    name: 'Modified Rankin Scale',
    fullName: 'Modified Rankin Scale (mRS)',
    category: 'NEUROLOGY',
    application: 'Measures degree of disability/dependence after stroke. Primary outcome measure in stroke clinical trials.',
    applicableChiefComplaints: ['stroke', 'neurological_disability', 'functional_impairment'],
    keywords: ['mRS', 'modified Rankin scale', 'disability', 'stroke outcome', 'functional independence', 'dependence', 'clinical trial'],
    components: [
      { id: 'score', label: 'mRS Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Excellent Outcome', interpretation: 'mRS 0–1: No symptoms to no significant disability; excellent outcome' },
        { min: 2, max: 2, risk: 'Good Outcome', interpretation: 'mRS 2: Slight disability; independent but unable to carry out all previous activities' },
        { min: 3, max: 5, risk: 'Poor Outcome', interpretation: 'mRS 3–5: Dependent / poor outcome; requires assistance to varying degrees' },
        { min: 6, max: 6, risk: 'Dead', interpretation: 'mRS 6: Death' },
      ],
    },
  },

// === GASTROINTESTINAL ===

  // GASTROINTESTINAL — Glasgow-Blatchford Bleeding Score
  {
    id: 'glasgow_blatchford',
    name: 'Glasgow-Blatchford Score',
    fullName: 'Glasgow-Blatchford Bleeding Score (GBS)',
    category: 'GASTROINTESTINAL',
    application: 'Pre-endoscopic risk stratification for upper GI bleeding. Identifies patients at very low risk who may not need hospital-based intervention.',
    applicableChiefComplaints: ['upper_gi_bleeding', 'hematemesis', 'melena', 'blood_in_stool'],
    keywords: ['Glasgow-Blatchford', 'GBS', 'upper GI bleed', 'UGIB', 'hematemesis', 'melena', 'endoscopy', 'risk stratification', 'discharge'],
    requiredTests: ['BUN', 'hemoglobin', 'blood pressure', 'heart rate'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 23 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: '<1% need for intervention; safe for outpatient management without endoscopy' },
        { min: 1, max: 2, risk: 'Low', interpretation: 'Consider early discharge with outpatient endoscopy' },
        { min: 3, max: 5, risk: 'Moderate', interpretation: 'Inpatient management with endoscopy indicated' },
        { min: 6, max: 23, risk: 'High', interpretation: 'High risk; urgent/emergent endoscopy required' },
      ],
    },
  },

  // GASTROINTESTINAL — AIMS65 Score
  {
    id: 'aims65',
    name: 'AIMS65',
    fullName: 'AIMS65 Score',
    category: 'GASTROINTESTINAL',
    application: 'Predicts in-hospital mortality in upper GI bleeding.',
    applicableChiefComplaints: ['upper_gi_bleeding', 'hematemesis', 'melena'],
    keywords: ['AIMS65', 'upper GI bleed', 'UGIB', 'mortality', 'albumin', 'INR', 'altered mental status', 'hematemesis'],
    requiredTests: ['albumin', 'INR', 'blood pressure'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: '0.3% in-hospital mortality' },
        { min: 1, max: 1, risk: 'Low', interpretation: '1.2% in-hospital mortality' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '5.3% in-hospital mortality' },
        { min: 3, max: 3, risk: 'High', interpretation: '10.3% in-hospital mortality' },
        { min: 4, max: 5, risk: 'Very High', interpretation: '16.5–24.5% in-hospital mortality' },
      ],
    },
  },

  // GASTROINTESTINAL — Rockall Score
  {
    id: 'rockall',
    name: 'Rockall Score',
    fullName: 'Rockall Score',
    category: 'GASTROINTESTINAL',
    application: 'Predicts rebleeding and mortality in upper GI bleeding. Available in pre-endoscopic (clinical) and full (endoscopic) versions.',
    applicableChiefComplaints: ['upper_gi_bleeding', 'hematemesis', 'melena'],
    keywords: ['Rockall', 'upper GI bleed', 'UGIB', 'rebleeding', 'mortality', 'endoscopy', 'stigmata of hemorrhage', 'Mallory-Weiss'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 11 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Pre-endoscopic 0: 0.2% rebleeding, 0% mortality; full score 0–2: ~4–5% rebleeding, 0% mortality' },
        { min: 3, max: 5, risk: 'Moderate', interpretation: 'Pre-endoscopic ≥3: moderate-high risk; full score 3–5: 11–25% rebleeding, 3–11% mortality' },
        { min: 6, max: 11, risk: 'High', interpretation: 'Full score 6–8+: 33–42% rebleeding, 17–41% mortality' },
      ],
    },
  },

  // GASTROINTESTINAL — Oakland Score
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
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 29 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 8, risk: 'Low', interpretation: 'Score ≤8: Safe for outpatient management (95% probability of safe discharge)' },
        { min: 9, max: 29, risk: 'High', interpretation: 'Score >8: Consider inpatient management' },
      ],
    },
  },

  // GASTROINTESTINAL — Alvarado Score
  {
    id: 'alvarado',
    name: 'Alvarado Score',
    fullName: 'Alvarado Score (MANTRELS)',
    category: 'GASTROINTESTINAL',
    application: 'Clinical prediction of acute appendicitis.',
    applicableChiefComplaints: ['right_lower_quadrant_pain', 'abdominal_pain', 'appendicitis'],
    keywords: ['Alvarado', 'MANTRELS', 'appendicitis', 'RLQ pain', 'right lower quadrant', 'leukocytosis', 'rebound tenderness'],
    requiredTests: ['WBC', 'differential'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low', interpretation: '~7% probability of appendicitis; observe or discharge' },
        { min: 5, max: 6, risk: 'Intermediate', interpretation: '~57% probability; equivocal — imaging recommended (CT or US)' },
        { min: 7, max: 8, risk: 'High', interpretation: '~83% probability; surgical consultation warranted' },
        { min: 9, max: 10, risk: 'Very High', interpretation: '~95% probability; near-certain appendicitis — surgical intervention' },
      ],
    },
  },

  // GASTROINTESTINAL — AIR Score
  {
    id: 'air_score',
    name: 'AIR Score',
    fullName: 'AIR Score (Appendicitis Inflammatory Response Score)',
    category: 'GASTROINTESTINAL',
    application: 'Risk stratification for appendicitis using clinical and lab findings.',
    applicableChiefComplaints: ['right_lower_quadrant_pain', 'abdominal_pain', 'appendicitis'],
    keywords: ['AIR score', 'appendicitis', 'inflammatory response', 'CRP', 'WBC', 'rebound tenderness', 'RLQ pain'],
    requiredTests: ['WBC', 'CRP'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low', interpretation: 'Low probability of appendicitis; outpatient follow-up' },
        { min: 5, max: 8, risk: 'Intermediate', interpretation: 'Intermediate risk; observation, imaging, or diagnostic laparoscopy' },
        { min: 9, max: 12, risk: 'High', interpretation: 'High probability of appendicitis; surgical intervention indicated' },
      ],
    },
  },

  // GASTROINTESTINAL — Pediatric Appendicitis Score
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
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Very Low', interpretation: 'Appendicitis very unlikely; discharge with return precautions' },
        { min: 3, max: 6, risk: 'Equivocal', interpretation: 'Imaging recommended (ultrasound first in pediatrics)' },
        { min: 7, max: 10, risk: 'High', interpretation: 'Surgical consultation warranted' },
      ],
    },
  },

  // GASTROINTESTINAL — Ranson's Criteria
  {
    id: 'ransons_criteria',
    name: "Ranson's Criteria",
    fullName: "Ranson's Criteria",
    category: 'GASTROINTESTINAL',
    application: 'Predicts severity and mortality in acute pancreatitis. Assessed at admission AND at 48 hours.',
    applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
    keywords: ["Ranson's criteria", 'pancreatitis', 'acute pancreatitis', 'severity', 'mortality', 'LDH', 'AST', 'calcium', 'hematocrit'],
    requiredTests: ['WBC', 'glucose', 'LDH', 'AST', 'hematocrit', 'BUN', 'calcium', 'arterial blood gas'],
    components: [
      { id: 'score', label: 'Total Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 11 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Mild', interpretation: '~1% mortality; mild pancreatitis' },
        { min: 3, max: 4, risk: 'Moderate', interpretation: '~15% mortality' },
        { min: 5, max: 6, risk: 'Severe', interpretation: '~40% mortality' },
        { min: 7, max: 11, risk: 'Critical', interpretation: '~100% mortality; requires ICU-level care' },
      ],
    },
  },

  // GASTROINTESTINAL — BISAP Score
  {
    id: 'bisap',
    name: 'BISAP',
    fullName: 'BISAP Score',
    category: 'GASTROINTESTINAL',
    application: 'Early bedside severity assessment for acute pancreatitis (can be calculated within first 24 hours).',
    applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
    keywords: ['BISAP', 'pancreatitis', 'acute pancreatitis', 'severity', 'early assessment', 'SIRS', 'BUN', 'pleural effusion'],
    requiredTests: ['BUN', 'imaging'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Mild', interpretation: '<1–~1% mortality; mild pancreatitis' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '~2% mortality' },
        { min: 3, max: 5, risk: 'Severe', interpretation: '~5–27% mortality; consider ICU admission; increased risk of organ failure and pancreatic necrosis' },
      ],
    },
  },

  // GASTROINTESTINAL — Atlanta Classification
  {
    id: 'atlanta_pancreatitis',
    name: 'Atlanta Classification',
    fullName: 'Atlanta Classification (Revised 2012)',
    category: 'GASTROINTESTINAL',
    application: 'Classifies severity of acute pancreatitis into mild, moderately severe, and severe categories based on organ failure and local complications.',
    applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
    keywords: ['Atlanta classification', 'pancreatitis', 'organ failure', 'pancreatic necrosis', 'pseudocyst', 'severity', 'Marshall score'],
    components: [
      { id: 'score', label: 'Severity Category', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Mild', interpretation: 'No organ failure AND no local/systemic complications' },
        { min: 2, max: 2, risk: 'Moderately Severe', interpretation: 'Transient organ failure (<48 hours) AND/OR local complications (peripancreatic fluid, necrosis, pseudocyst, walled-off necrosis)' },
        { min: 3, max: 3, risk: 'Severe', interpretation: 'Persistent organ failure (>48 hours) — defined by modified Marshall score ≥2 in any organ system' },
      ],
    },
  },

  // GASTROINTESTINAL — Charcot's Triad / Reynolds' Pentad
  {
    id: 'charcot_reynolds',
    name: "Charcot's Triad / Reynolds' Pentad",
    fullName: "Charcot's Triad / Reynolds' Pentad",
    category: 'GASTROINTESTINAL',
    application: 'Clinical diagnosis of ascending cholangitis using the presence of characteristic symptom clusters.',
    applicableChiefComplaints: ['right_upper_quadrant_pain', 'jaundice', 'fever', 'abdominal_pain'],
    keywords: ["Charcot's triad", "Reynolds' pentad", 'cholangitis', 'ascending cholangitis', 'jaundice', 'fever', 'RUQ pain', 'ERCP', 'biliary'],
    components: [
      { id: 'score', label: 'Criteria Present', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 2, risk: 'Low Suspicion', interpretation: 'Absence of triad does NOT exclude cholangitis; consider alternative diagnosis' },
        { min: 3, max: 3, risk: "Charcot's Triad", interpretation: 'RUQ pain + fever + jaundice: high suspicion for cholangitis; initiate antibiotics and biliary imaging' },
        { min: 4, max: 5, risk: "Reynolds' Pentad", interpretation: 'Charcot\'s Triad + mental status changes + hypotension: toxic/suppurative cholangitis; emergent biliary decompression (ERCP) required' },
      ],
    },
  },

// === GENITOURINARY ===

  // GENITOURINARY — STONE Score
  {
    id: 'stone_score',
    name: 'STONE Score',
    fullName: 'STONE Score',
    category: 'GENITOURINARY',
    application: 'Predicts likelihood of ureteral stone in patients presenting with flank pain suspicious for renal colic.',
    applicableChiefComplaints: ['flank_pain', 'renal_colic', 'hematuria', 'abdominal_pain'],
    keywords: ['STONE score', 'ureteral stone', 'kidney stone', 'nephrolithiasis', 'renal colic', 'flank pain', 'hematuria', 'CT'],
    requiredTests: ['urinalysis'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 5, max: 13 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 5, max: 7, risk: 'Low', interpretation: '~9% probability of ureteral stone; consider alternative diagnoses; imaging may still be warranted' },
        { min: 8, max: 9, risk: 'Moderate', interpretation: '~52% probability of ureteral stone' },
        { min: 10, max: 13, risk: 'High', interpretation: '~89% probability of ureteral stone; may influence imaging choice for known stone-formers' },
      ],
    },
  },

  // GENITOURINARY — TWIST Score
  {
    id: 'twist_score',
    name: 'TWIST Score',
    fullName: 'TWIST Score (Testicular Workup for Ischemia and Suspected Torsion)',
    category: 'GENITOURINARY',
    application: 'Risk stratification for testicular torsion in males presenting with acute scrotal pain.',
    applicableChiefComplaints: ['scrotal_pain', 'testicular_pain', 'testicular_torsion'],
    keywords: ['TWIST', 'testicular torsion', 'scrotal pain', 'cremasteric reflex', 'high-riding testicle', 'torsion', 'urologic emergency'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Torsion unlikely; ultrasound if clinically concerned' },
        { min: 3, max: 4, risk: 'Intermediate', interpretation: 'Urgent ultrasound with Doppler required' },
        { min: 5, max: 7, risk: 'High', interpretation: 'Immediate surgical exploration required — do not delay for ultrasound' },
      ],
    },
  },
// === INFECTIOUS DISEASE ===

  // INFECTIOUS DISEASE — SOFA
  {
    id: 'sofa',
    name: 'SOFA Score',
    fullName: 'SOFA Score (Sequential Organ Failure Assessment)',
    category: 'INFECTIOUS DISEASE',
    application: 'Quantifies organ dysfunction in critically ill patients. An increase of ≥2 from baseline defines sepsis (Sepsis-3).',
    applicableChiefComplaints: ['sepsis', 'infection', 'fever', 'altered_mental_status', 'hypotension', 'shortness_of_breath'],
    keywords: ['SOFA', 'sequential organ failure assessment', 'sepsis', 'organ dysfunction', 'ICU', 'Sepsis-3', 'critically ill'],
    requiredTests: ['PaO2', 'FiO2', 'platelets', 'bilirubin', 'creatinine', 'vasopressors', 'GCS', 'urine output'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 24 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 6, risk: 'Low', interpretation: 'Baseline SOFA assumed 0 without prior organ dysfunction; SOFA 0–6 associated with <10% mortality' },
        { min: 7, max: 9, risk: 'Moderate', interpretation: 'SOFA 7–9: ~15–20% mortality' },
        { min: 10, max: 12, risk: 'High', interpretation: 'SOFA 10–12: ~40–50% mortality' },
        { min: 13, max: 24, risk: 'Very High', interpretation: 'SOFA >12: >80% mortality; acute change of ≥2 from baseline = sepsis in context of infection' },
      ],
    },
  },

  // INFECTIOUS DISEASE — SIRS Criteria
  {
    id: 'sirs',
    name: 'SIRS Criteria',
    fullName: 'SIRS Criteria',
    category: 'INFECTIOUS DISEASE',
    application: 'Traditional criteria for systemic inflammatory response. ≥2 criteria defines SIRS. When SIRS is caused by infection, it was historically termed "sepsis" (pre-Sepsis-3 definition).',
    applicableChiefComplaints: ['fever', 'infection', 'sepsis', 'tachycardia', 'shortness_of_breath'],
    keywords: ['SIRS', 'systemic inflammatory response', 'sepsis', 'fever', 'tachycardia', 'leukocytosis', 'bands'],
    requiredTests: ['WBC', 'differential', 'temperature', 'heart rate', 'respiratory rate', 'PaCO2'],
    components: [
      { id: 'score', label: 'Number of Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Does not meet SIRS; clinical judgment still required' },
        { min: 2, max: 4, risk: 'High', interpretation: '≥2 criteria = SIRS (sensitive but not specific); SIRS + confirmed infection = sepsis by old definition' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Rochester Criteria
  {
    id: 'rochester_criteria',
    name: 'Rochester Criteria',
    fullName: 'Rochester Criteria',
    category: 'INFECTIOUS DISEASE',
    application: 'Identifies febrile infants ≤60 days old at low risk of serious bacterial infection (SBI). All criteria must be met for low-risk classification.',
    applicableChiefComplaints: ['fever', 'neonatal_fever', 'infant_fever', 'irritability'],
    keywords: ['Rochester', 'febrile infant', 'serious bacterial infection', 'SBI', 'neonatal fever', 'infant', 'low risk'],
    requiredTests: ['WBC', 'bands', 'urinalysis', 'stool WBC'],
    components: [
      { id: 'score', label: 'All Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 7, max: 7, risk: 'Low', interpretation: 'ALL criteria met → Low risk (~1% SBI rate); may be managed as outpatient with close follow-up' },
        { min: 0, max: 6, risk: 'High', interpretation: 'ANY criterion NOT met → Not low risk; further workup and likely admission with empiric antibiotics' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Philadelphia Criteria
  {
    id: 'philadelphia_criteria',
    name: 'Philadelphia Criteria',
    fullName: 'Philadelphia Criteria',
    category: 'INFECTIOUS DISEASE',
    application: 'Risk stratification for febrile infants 29–60 days old. All criteria must be met for low-risk classification; NPV >98%.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever', 'irritability'],
    keywords: ['Philadelphia criteria', 'febrile infant', 'serious bacterial infection', 'SBI', '29-60 days', 'CSF', 'low risk'],
    requiredTests: ['WBC', 'bands', 'urinalysis', 'CSF WBC', 'CSF gram stain', 'CXR'],
    components: [
      { id: 'score', label: 'All Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 9 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 9, max: 9, risk: 'Low', interpretation: 'ALL criteria met → Low risk; NPV >98%; may consider outpatient management' },
        { min: 0, max: 8, risk: 'High', interpretation: 'ANY criterion not met → Not low risk; admit and treat empirically' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Boston Criteria (Febrile Infant)
  {
    id: 'boston_criteria_febrile_infant',
    name: 'Boston Criteria',
    fullName: 'Boston Criteria (Febrile Infant)',
    category: 'INFECTIOUS DISEASE',
    application: 'Risk stratification for febrile infants 28–89 days old. NPV 94.6% for SBI when all low-risk criteria are met.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: ['Boston criteria', 'febrile infant', 'serious bacterial infection', 'SBI', '28-89 days', 'ceftriaxone', 'low risk'],
    requiredTests: ['WBC', 'CSF WBC', 'urinalysis', 'CXR'],
    components: [
      { id: 'score', label: 'All Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 6, max: 6, risk: 'Low', interpretation: 'ALL criteria met → Low risk; NPV 94.6% for SBI; may consider outpatient management with ceftriaxone and 24-hour follow-up' },
        { min: 0, max: 5, risk: 'High', interpretation: 'ANY criterion not met → Not low risk; further workup required' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Step-by-Step Approach (European Febrile Infant Algorithm)
  {
    id: 'step_by_step_febrile_infant',
    name: 'Step-by-Step Algorithm',
    fullName: 'Step-by-Step Approach (European Febrile Infant Algorithm)',
    category: 'INFECTIOUS DISEASE',
    application: 'Risk stratification for febrile infants ≤90 days using sequential assessment including procalcitonin. Studies show excellent sensitivity (~92%) and NPV for invasive bacterial infection.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: ['Step-by-Step', 'European febrile infant', 'procalcitonin', 'febrile infant', '≤90 days', 'sequential algorithm', 'invasive bacterial infection'],
    requiredTests: ['procalcitonin', 'CRP', 'ANC', 'urinalysis'],
    components: [
      { id: 'score', label: 'Step Reached', type: 'number_range', source: 'section1', min: 1, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'High', interpretation: 'Ill-appearing → Full sepsis workup + empiric antibiotics + admit' },
        { min: 2, max: 3, risk: 'High', interpretation: 'Leukocyturia or procalcitonin ≥0.5 ng/mL → High risk; full workup + treat' },
        { min: 4, max: 4, risk: 'Intermediate', interpretation: 'CRP ≥20 mg/L or ANC >10,000/µL → Intermediate risk; consider LP, treat, observe' },
        { min: 5, max: 5, risk: 'Low', interpretation: 'All negative → Low risk; close outpatient follow-up may be appropriate' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Lab-Score
  {
    id: 'lab_score',
    name: 'Lab-Score',
    fullName: 'Lab-Score',
    category: 'INFECTIOUS DISEASE',
    application: 'Biomarker-based risk stratification for febrile infants (7–90 days). Uses procalcitonin, CRP, and urine dipstick to estimate serious bacterial infection risk.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: ['Lab-Score', 'febrile infant', 'procalcitonin', 'CRP', 'serious bacterial infection', 'SBI', '7-90 days', 'biomarker'],
    requiredTests: ['procalcitonin', 'CRP', 'urinalysis'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: 'Score 0: Very low risk of SBI (<3%)' },
        { min: 1, max: 2, risk: 'Low', interpretation: 'Score 1–2: Low-intermediate risk' },
        { min: 3, max: 7, risk: 'High', interpretation: 'Score ≥3: High risk of SBI; full workup and empiric treatment indicated' },
      ],
    },
  },

  // INFECTIOUS DISEASE — AAP 2021 Febrile Infant Guidelines
  {
    id: 'aap_2021_febrile_infant',
    name: 'AAP 2021 Febrile Infant',
    fullName: 'AAP 2021 Febrile Infant Guidelines',
    category: 'INFECTIOUS DISEASE',
    application: 'Age-stratified management of febrile (≥38.0°C) well-appearing infants 8–60 days old. Stratifies by age group (8–21, 22–28, 29–60 days) and inflammatory markers.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
    keywords: ['AAP 2021', 'febrile infant', 'procalcitonin', 'CRP', 'ANC', 'low risk', '8-60 days', 'American Academy of Pediatrics'],
    requiredTests: ['procalcitonin', 'CRP', 'ANC', 'urinalysis', 'blood culture', 'CSF'],
    components: [
      { id: 'score', label: 'Age Group', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'High', interpretation: 'Age 8–21 days: Admit and empiric antibiotics for all; urinalysis, blood culture, LP recommended' },
        { min: 2, max: 2, risk: 'High', interpretation: 'Age 22–28 days: Admit and treat; if well-appearing + normal inflammatory markers + negative UA → may observe without antibiotics (shared decision)' },
        { min: 3, max: 3, risk: 'Variable', interpretation: 'Age 29–60 days: If low risk (well-appearing, normal UA, normal inflammatory markers) → outpatient 24h follow-up; any abnormality → admit' },
      ],
    },
  },

  // INFECTIOUS DISEASE — MASCC Score
  {
    id: 'mascc',
    name: 'MASCC Score',
    fullName: 'MASCC Score (Multinational Association for Supportive Care in Cancer)',
    category: 'INFECTIOUS DISEASE',
    application: 'Identifies low-risk febrile neutropenic cancer patients who may be candidates for outpatient management. Score ≥21 indicates low risk (~5% complication rate).',
    applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenic_fever', 'cancer_fever'],
    keywords: ['MASCC', 'febrile neutropenia', 'cancer', 'outpatient', 'low risk', 'neutropenia', 'Multinational Association Supportive Care Cancer'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 26 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 20, risk: 'High', interpretation: 'Score <21: High risk; inpatient IV antibiotics required' },
        { min: 21, max: 26, risk: 'Low', interpretation: 'Score ≥21: Low risk (~5% complication rate); consider outpatient oral antibiotics with close follow-up' },
      ],
    },
  },

  // INFECTIOUS DISEASE — CISNE Score
  {
    id: 'cisne',
    name: 'CISNE Score',
    fullName: 'CISNE Score (Clinical Index of Stable Febrile Neutropenia)',
    category: 'INFECTIOUS DISEASE',
    application: 'Further risk-stratifies apparently stable febrile neutropenic patients (those who appear well at presentation). Score ≥3 indicates high risk (~36% complications).',
    applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenic_fever', 'cancer_fever'],
    keywords: ['CISNE', 'febrile neutropenia', 'stable', 'cancer', 'ECOG', 'monocytes', 'hyperglycemia', 'outpatient'],
    requiredTests: ['monocyte count', 'blood glucose', 'ECOG performance status'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Score 0: Low risk (1.1% complications); outpatient management may be appropriate' },
        { min: 1, max: 2, risk: 'Intermediate', interpretation: 'Score 1–2: Intermediate risk (~6%); consider individual risk/benefit' },
        { min: 3, max: 8, risk: 'High', interpretation: 'Score ≥3: High risk (~36%); inpatient management required' },
      ],
    },
  },

  // INFECTIOUS DISEASE — FeverPAIN Score
  {
    id: 'feverpain',
    name: 'FeverPAIN Score',
    fullName: 'FeverPAIN Score',
    category: 'INFECTIOUS DISEASE',
    application: 'UK alternative for assessment of streptococcal pharyngitis. Guides antibiotic prescribing with scores 4–5 indicating 62–65% strep probability.',
    applicableChiefComplaints: ['sore_throat', 'pharyngitis', 'throat_pain', 'fever'],
    keywords: ['FeverPAIN', 'pharyngitis', 'streptococcal', 'sore throat', 'antibiotics', 'UK', 'tonsillitis'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Score 0–1: Strep probability 13–18%; no antibiotics recommended' },
        { min: 2, max: 3, risk: 'Intermediate', interpretation: 'Score 2–3: Strep probability 34–40%; delayed antibiotics (backup prescription) or RADT' },
        { min: 4, max: 5, risk: 'High', interpretation: 'Score 4–5: Strep probability 62–65%; immediate antibiotics OR RADT' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Kocher Criteria
  {
    id: 'kocher_criteria',
    name: 'Kocher Criteria',
    fullName: 'Kocher Criteria',
    category: 'INFECTIOUS DISEASE',
    application: 'Predicts septic arthritis of the hip in children (typically age 3 months to 18 years) presenting with hip pain and/or refusal to bear weight.',
    applicableChiefComplaints: ['hip_pain', 'limp', 'joint_pain', 'fever', 'refusal_to_bear_weight'],
    keywords: ['Kocher', 'septic arthritis', 'hip', 'pediatric', 'Caird', 'ESR', 'CRP', 'non-weight-bearing'],
    requiredTests: ['ESR', 'WBC', 'CRP'],
    components: [
      { id: 'score', label: 'Number of Criteria', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Very Low', interpretation: '0 predictors: ~0.2% probability; observation appropriate' },
        { min: 1, max: 1, risk: 'Low', interpretation: '1 predictor: ~3% probability; consider observation vs. aspiration based on clinical picture' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: '2 predictors: ~40% probability; joint aspiration recommended' },
        { min: 3, max: 4, risk: 'High', interpretation: '3–4 predictors: ~93–99.6% probability; aspiration +/- operative intervention' },
      ],
    },
  },

  // INFECTIOUS DISEASE — LRINEC Score
  {
    id: 'lrinec',
    name: 'LRINEC Score',
    fullName: 'LRINEC Score (Laboratory Risk Indicator for Necrotizing Fasciitis)',
    category: 'INFECTIOUS DISEASE',
    application: 'Distinguishes necrotizing fasciitis from other soft tissue infections based on laboratory values. A low score does NOT exclude necrotizing fasciitis — clinical suspicion always trumps the score.',
    applicableChiefComplaints: ['soft_tissue_infection', 'cellulitis', 'wound_infection', 'pain_out_of_proportion', 'necrotizing_fasciitis'],
    keywords: ['LRINEC', 'necrotizing fasciitis', 'soft tissue infection', 'CRP', 'WBC', 'sodium', 'creatinine', 'glucose', 'necrotizing'],
    requiredTests: ['CRP', 'WBC', 'hemoglobin', 'sodium', 'creatinine', 'glucose'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 13 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 5, risk: 'Low', interpretation: 'Score ≤5: Low risk; PPV <50% for necrotizing fasciitis — but low score does NOT exclude; do not delay surgery if clinical suspicion is high' },
        { min: 6, max: 7, risk: 'Intermediate', interpretation: 'Score 6–7: Intermediate risk; ~73% PPV for necrotizing fasciitis' },
        { min: 8, max: 13, risk: 'High', interpretation: 'Score ≥8: High risk; ~93% PPV for necrotizing fasciitis; strong suspicion warrants surgical exploration' },
      ],
    },
  },

  // INFECTIOUS DISEASE — Bacterial Meningitis Score
  {
    id: 'bacterial_meningitis_score',
    name: 'Bacterial Meningitis Score',
    fullName: 'Bacterial Meningitis Score',
    category: 'INFECTIOUS DISEASE',
    application: 'Differentiates bacterial from aseptic (viral) meningitis in children (≥2 months old) with CSF pleocytosis (CSF WBC ≥10/µL). NPV 99.7–100% when all criteria negative.',
    applicableChiefComplaints: ['headache', 'meningitis', 'fever', 'altered_mental_status', 'stiff_neck', 'seizure'],
    keywords: ['bacterial meningitis score', 'meningitis', 'CSF', 'pleocytosis', 'bacterial vs viral', 'pediatric', 'gram stain', 'aseptic meningitis'],
    requiredTests: ['CSF gram stain', 'CSF ANC', 'CSF protein', 'peripheral ANC'],
    components: [
      { id: 'score', label: 'Number of Criteria Positive', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'ALL 5 criteria NEGATIVE → Very low risk of bacterial meningitis (NPV 99.7–100%); aseptic meningitis likely; may consider outpatient management' },
        { min: 1, max: 5, risk: 'High', interpretation: 'ANY criterion POSITIVE → Cannot classify as low risk; treat empirically for bacterial meningitis' },
      ],
    },
  },

// === TOXICOLOGY ===

  // TOXICOLOGY — Rumack-Matthew Nomogram
  {
    id: 'rumack_matthew',
    name: 'Rumack-Matthew Nomogram',
    fullName: 'Rumack-Matthew Nomogram',
    category: 'TOXICOLOGY',
    application: 'Determines need for N-acetylcysteine (NAC) treatment in acute acetaminophen overdose based on serum APAP level and time since ingestion. Only valid for single acute ingestion with known time.',
    applicableChiefComplaints: ['overdose', 'acetaminophen_overdose', 'APAP_overdose', 'intentional_ingestion', 'toxic_ingestion'],
    keywords: ['Rumack-Matthew', 'acetaminophen', 'APAP', 'NAC', 'N-acetylcysteine', 'overdose', 'nomogram', 'hepatotoxicity', 'Tylenol'],
    requiredTests: ['serum acetaminophen level', 'LFTs', 'INR'],
    components: [
      { id: 'score', label: 'APAP Level vs Treatment Line', type: 'number_range', source: 'section1', min: 0, max: 1 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Level BELOW treatment line → NAC not indicated for single acute ingestion' },
        { min: 1, max: 1, risk: 'High', interpretation: 'Level AT or ABOVE treatment line → Start NAC; treatment threshold: 150 µg/mL at 4h, 75 µg/mL at 8h, 37.5 µg/mL at 12h' },
      ],
    },
  },

  // TOXICOLOGY — King's College Criteria
  {
    id: 'kings_college_criteria',
    name: "King's College Criteria",
    fullName: "King's College Criteria",
    category: 'TOXICOLOGY',
    application: 'Identifies acetaminophen-induced (and non-acetaminophen) fulminant hepatic failure patients who should be referred for liver transplant evaluation.',
    applicableChiefComplaints: ['liver_failure', 'acetaminophen_overdose', 'hepatic_encephalopathy', 'jaundice', 'coagulopathy'],
    keywords: ["King's College", 'liver failure', 'transplant', 'acetaminophen', 'hepatic failure', 'INR', 'encephalopathy', 'creatinine', 'fulminant'],
    requiredTests: ['arterial pH', 'INR', 'creatinine', 'bilirubin'],
    components: [
      { id: 'score', label: 'Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 1 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Does not meet criteria; some patients not meeting criteria may still deteriorate — monitor closely' },
        { min: 1, max: 1, risk: 'High', interpretation: 'Criteria met → Refer urgently for liver transplant evaluation; good specificity (~95%) but moderate sensitivity (~58–69%)' },
      ],
    },
  },

  // TOXICOLOGY — Done Nomogram
  {
    id: 'done_nomogram',
    name: 'Done Nomogram',
    fullName: 'Done Nomogram',
    category: 'TOXICOLOGY',
    application: 'Historically used to predict salicylate toxicity severity based on serum salicylate level and time since ingestion. Now considered unreliable and NOT recommended for clinical decision-making.',
    applicableChiefComplaints: ['salicylate_overdose', 'aspirin_overdose', 'toxic_ingestion', 'tinnitus', 'tachypnea'],
    keywords: ['Done nomogram', 'salicylate', 'aspirin', 'overdose', 'toxicity', 'hemodialysis', 'historical'],
    requiredTests: ['serum salicylate level', 'arterial blood gas', 'pH'],
    components: [
      { id: 'score', label: 'Clinical Severity', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 3, risk: 'Variable', interpretation: 'Treat based on clinical findings: altered mental status, tinnitus, tachypnea, acid-base status; hemodialysis if salicylate >100 mg/dL, renal failure, pulmonary edema, CNS toxicity, or severe acidosis (pH <7.2)' },
      ],
    },
  },

  // TOXICOLOGY — CIWA-Ar
  {
    id: 'ciwa_ar',
    name: 'CIWA-Ar',
    fullName: 'CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol — Revised)',
    category: 'TOXICOLOGY',
    application: 'Standardized assessment of alcohol withdrawal severity to guide benzodiazepine dosing. Scored by clinical assessment of 10 components.',
    applicableChiefComplaints: ['alcohol_withdrawal', 'tremor', 'agitation', 'seizure', 'delirium_tremens', 'altered_mental_status'],
    keywords: ['CIWA-Ar', 'alcohol withdrawal', 'delirium tremens', 'benzodiazepine', 'AWS', 'tremor', 'seizure', 'hallucinations', 'DTs'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 67 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Low', interpretation: 'Score <10: Mild withdrawal; supportive care, may not need pharmacotherapy; reassess frequently' },
        { min: 10, max: 18, risk: 'Moderate', interpretation: 'Score 10–18: Moderate withdrawal; benzodiazepine treatment indicated (symptom-triggered protocol)' },
        { min: 19, max: 35, risk: 'High', interpretation: 'Score >18: Severe withdrawal; aggressive benzodiazepine treatment; monitor closely; consider ICU' },
        { min: 36, max: 67, risk: 'Very High', interpretation: 'Score >35: Very severe; high risk for seizures and delirium tremens; ICU recommended' },
      ],
    },
  },

  // TOXICOLOGY — PAWSS
  {
    id: 'pawss',
    name: 'PAWSS',
    fullName: 'PAWSS (Prediction of Alcohol Withdrawal Severity Scale)',
    category: 'TOXICOLOGY',
    application: 'Predicts which hospitalized patients are at risk for complicated alcohol withdrawal (seizures, delirium tremens) to guide prophylactic treatment.',
    applicableChiefComplaints: ['alcohol_withdrawal', 'alcohol_use_disorder', 'substance_use', 'tremor', 'anxiety'],
    keywords: ['PAWSS', 'alcohol withdrawal', 'prediction', 'complicated withdrawal', 'delirium tremens', 'seizure', 'prophylaxis', 'benzodiazepine'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: 'Score 0–3: Low risk; unlikely to need pharmacologic withdrawal prophylaxis' },
        { min: 4, max: 10, risk: 'High', interpretation: 'Score ≥4: High risk; initiate withdrawal prophylaxis; CIWA monitoring recommended' },
      ],
    },
  },

  // TOXICOLOGY — Naranjo Adverse Drug Reaction Scale
  {
    id: 'naranjo_adr',
    name: 'Naranjo Scale',
    fullName: 'Naranjo Adverse Drug Reaction Scale',
    category: 'TOXICOLOGY',
    application: 'Assesses probability that an adverse event is caused by a drug rather than other factors. Uses 10 standardized questions to classify ADR likelihood.',
    applicableChiefComplaints: ['adverse_drug_reaction', 'drug_reaction', 'allergic_reaction', 'medication_side_effect'],
    keywords: ['Naranjo', 'adverse drug reaction', 'ADR', 'causality', 'drug reaction', 'pharmacovigilance'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: -4, max: 13 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: -4, max: 0, risk: 'Doubtful', interpretation: 'Score ≤0: Doubtful ADR causality' },
        { min: 1, max: 4, risk: 'Possible', interpretation: 'Score 1–4: Possible ADR' },
        { min: 5, max: 8, risk: 'Probable', interpretation: 'Score 5–8: Probable ADR' },
        { min: 9, max: 13, risk: 'Definite', interpretation: 'Score ≥9: Definite ADR' },
      ],
    },
  },

  // TOXICOLOGY — QTc Calculation
  {
    id: 'qtc_calculation',
    name: 'QTc Calculation',
    fullName: 'QTc Calculation (Bazett and Fridericia)',
    category: 'TOXICOLOGY',
    application: 'Corrects QT interval for heart rate. Prolonged QTc increases risk of torsades de pointes. QTc >500 ms carries significant risk for TdP.',
    applicableChiefComplaints: ['palpitations', 'syncope', 'overdose', 'arrhythmia', 'QT_prolongation', 'torsades_de_pointes'],
    keywords: ['QTc', 'QT prolongation', 'Bazett', 'Fridericia', 'torsades de pointes', 'TdP', 'arrhythmia', 'corrected QT', 'ECG'],
    requiredTests: ['ECG', 'QT interval measurement', 'heart rate'],
    components: [
      { id: 'score', label: 'QTc (ms)', type: 'number_range', source: 'section1', min: 200, max: 700 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 200, max: 449, risk: 'Normal', interpretation: 'Normal QTc (Male <430, Female <450); borderline 430–470 ms depending on sex' },
        { min: 450, max: 499, risk: 'Borderline', interpretation: 'Borderline-prolonged QTc; review QT-prolonging medications and electrolytes' },
        { min: 500, max: 700, risk: 'High', interpretation: 'QTc >500 ms: Significant risk for torsades de pointes; discontinue offending drugs, correct electrolytes (Mg²⁺, K⁺, Ca²⁺); increase >60 ms from baseline is also concerning' },
      ],
    },
  },

  // TOXICOLOGY — Poisoning Severity Score (PSS)
  {
    id: 'poisoning_severity_score',
    name: 'Poisoning Severity Score',
    fullName: 'Poisoning Severity Score (PSS)',
    category: 'TOXICOLOGY',
    application: 'Standardized grading of acute poisoning severity. Used for clinical communication and outcome tracking. Score the worst-affected organ system to determine overall grade.',
    applicableChiefComplaints: ['overdose', 'toxic_ingestion', 'poisoning', 'ingestion'],
    keywords: ['PSS', 'poisoning severity score', 'toxicology', 'grading', 'overdose', 'severity'],
    components: [
      { id: 'score', label: 'Severity Grade', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Grade 0–1: None/minor symptoms; generally safe for outpatient management or brief observation' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'Grade 2: Moderate symptoms; requires inpatient management and monitoring' },
        { min: 3, max: 3, risk: 'High', interpretation: 'Grade 3: Severe/life-threatening symptoms; ICU admission required' },
        { min: 4, max: 4, risk: 'Fatal', interpretation: 'Grade 4: Fatal outcome' },
      ],
    },
  },

// === ENDOCRINE ===

  // ENDOCRINE — Burch-Wartofsky Point Scale (BWPS)
  {
    id: 'bwps',
    name: 'Burch-Wartofsky Scale',
    fullName: 'Burch-Wartofsky Point Scale (BWPS)',
    category: 'ENDOCRINE',
    application: 'Differentiates thyroid storm from uncomplicated thyrotoxicosis. Score ≥45 indicates thyroid storm and warrants aggressive treatment.',
    applicableChiefComplaints: ['thyroid_storm', 'hyperthyroidism', 'fever', 'altered_mental_status', 'tachycardia', 'heart_failure'],
    keywords: ['Burch-Wartofsky', 'BWPS', 'thyroid storm', 'thyrotoxicosis', 'hyperthyroidism', 'atrial fibrillation', 'fever', 'thyroid crisis'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 140 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 24, risk: 'Low', interpretation: 'Score <25: Thyroid storm unlikely' },
        { min: 25, max: 44, risk: 'Intermediate', interpretation: 'Score 25–44: Impending thyroid storm; consider treatment' },
        { min: 45, max: 140, risk: 'High', interpretation: 'Score ≥45: Thyroid storm highly likely; treat aggressively' },
      ],
    },
  },

  // ENDOCRINE — ADA DKA Severity Criteria
  {
    id: 'ada_dka_severity',
    name: 'ADA DKA Severity',
    fullName: 'ADA DKA Severity Criteria',
    category: 'ENDOCRINE',
    application: 'Classifies diabetic ketoacidosis (DKA) as mild, moderate, or severe to guide management intensity. Based on arterial pH, bicarbonate, and mental status.',
    applicableChiefComplaints: ['DKA', 'diabetic_ketoacidosis', 'hyperglycemia', 'nausea_vomiting', 'altered_mental_status', 'abdominal_pain'],
    keywords: ['DKA', 'diabetic ketoacidosis', 'ADA', 'severity', 'pH', 'bicarbonate', 'anion gap', 'insulin', 'glucose', 'SGLT2'],
    requiredTests: ['arterial blood gas', 'serum bicarbonate', 'blood glucose', 'anion gap', 'urine ketones', 'serum ketones', 'sodium'],
    components: [
      { id: 'score', label: 'Severity Classification', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Low', interpretation: 'Mild DKA: pH 7.25–7.30, bicarb 15–18, alert; may be treated in ED/observation with IV fluids + insulin' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'Moderate DKA: pH 7.00–7.24, bicarb 10–14.9, alert/drowsy; requires close monitoring, likely admission' },
        { min: 3, max: 3, risk: 'High', interpretation: 'Severe DKA: pH <7.00, bicarb <10, stupor/coma; ICU admission, aggressive IV insulin + fluid resuscitation' },
      ],
    },
  },

// === HEMATOLOGY / COAGULATION ===

  // HEMATOLOGY / COAGULATION — HEMORR2HAGES Score
  {
    id: 'hemorr2hages',
    name: 'HEMORR₂HAGES',
    fullName: 'HEMORR₂HAGES Score',
    category: 'HEMATOLOGY / COAGULATION',
    application: 'Predicts risk of major hemorrhage in elderly patients with atrial fibrillation on anticoagulation. Score ≥5 associated with 12.3% annual hemorrhage rate.',
    applicableChiefComplaints: ['atrial_fibrillation', 'anticoagulation', 'bleeding_risk', 'bleeding', 'fall'],
    keywords: ['HEMORR2HAGES', 'hemorrhage', 'bleeding risk', 'atrial fibrillation', 'anticoagulation', 'warfarin', 'elderly'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Score 0–1: Annual hemorrhage rate 1.9–2.5%; benefits of anticoagulation likely outweigh risks' },
        { min: 2, max: 3, risk: 'Moderate', interpretation: 'Score 2–3: Annual hemorrhage rate 5.3–8.4%; weigh risks and benefits carefully' },
        { min: 4, max: 12, risk: 'High', interpretation: 'Score ≥4: Annual hemorrhage rate ≥10.4%; high bleeding risk; reassess anticoagulation indication' },
      ],
    },
  },

  // HEMATOLOGY / COAGULATION — 4Ts Score
  {
    id: 'four_ts',
    name: '4Ts Score',
    fullName: '4Ts Score',
    category: 'HEMATOLOGY / COAGULATION',
    application: 'Estimates pre-test probability of heparin-induced thrombocytopenia (HIT). Score 6–8 carries ~64% HIT probability and warrants immediate heparin cessation.',
    applicableChiefComplaints: ['thrombocytopenia', 'HIT', 'heparin_induced_thrombocytopenia', 'thrombosis', 'skin_necrosis'],
    keywords: ['4Ts', 'HIT', 'heparin-induced thrombocytopenia', 'platelets', 'thrombocytopenia', 'PF4', 'anticoagulation', 'thrombosis'],
    requiredTests: ['platelet count', 'PF4/H-PF4 antibody'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Low', interpretation: 'Score 0–3: Low probability (~5% HIT); consider other causes; PF4 antibody testing usually unnecessary' },
        { min: 4, max: 5, risk: 'Intermediate', interpretation: 'Score 4–5: Intermediate probability (~14%); send immunoassay (PF4); consider switching anticoagulation pending results' },
        { min: 6, max: 8, risk: 'High', interpretation: 'Score 6–8: High probability (~64%); stop heparin immediately; start alternative anticoagulation; send confirmatory testing' },
      ],
    },
  },

  // HEMATOLOGY / COAGULATION — ISTH DIC Score
  {
    id: 'isth_dic',
    name: 'ISTH DIC Score',
    fullName: 'ISTH DIC Score',
    category: 'HEMATOLOGY / COAGULATION',
    application: 'Diagnoses overt disseminated intravascular coagulation. Requires underlying condition known to be associated with DIC (sepsis, trauma, malignancy, obstetric complications).',
    applicableChiefComplaints: ['DIC', 'coagulopathy', 'sepsis', 'bleeding', 'thrombocytopenia'],
    keywords: ['ISTH', 'DIC', 'disseminated intravascular coagulation', 'coagulopathy', 'platelets', 'D-dimer', 'fibrinogen', 'PT'],
    requiredTests: ['platelet count', 'D-dimer', 'fibrin degradation products', 'PT', 'fibrinogen'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low', interpretation: 'Score <5: Not suggestive of overt DIC; repeat in 1–2 days if suspicion remains' },
        { min: 5, max: 8, risk: 'High', interpretation: 'Score ≥5: Compatible with overt DIC; treat underlying cause + supportive care' },
      ],
    },
  },

  // HEMATOLOGY / COAGULATION — ANC Calculation
  {
    id: 'anc_calculation',
    name: 'ANC Calculation',
    fullName: 'Absolute Neutrophil Count (ANC) Calculation',
    category: 'HEMATOLOGY / COAGULATION',
    application: 'Determines severity of neutropenia to guide infection risk assessment and management. ANC <500 triggers febrile neutropenia protocol.',
    applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenia', 'immunocompromised', 'cancer'],
    keywords: ['ANC', 'absolute neutrophil count', 'neutropenia', 'febrile neutropenia', 'infection risk', 'neutrophils', 'bands', 'WBC'],
    requiredTests: ['CBC with differential'],
    components: [
      { id: 'score', label: 'ANC (/µL)', type: 'number_range', source: 'section1', min: 0, max: 10000 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1500, max: 10000, risk: 'Normal', interpretation: 'ANC >1500/µL: Normal; baseline infection risk' },
        { min: 1000, max: 1499, risk: 'Low', interpretation: 'ANC 1000–1500/µL: Mild neutropenia; slight increase in infection risk' },
        { min: 500, max: 999, risk: 'Moderate', interpretation: 'ANC 500–1000/µL: Moderate neutropenia; moderate infection risk' },
        { min: 100, max: 499, risk: 'High', interpretation: 'ANC 100–500/µL: Severe neutropenia; high risk — febrile neutropenia protocol: blood cultures + empiric antipseudomonal beta-lactam' },
        { min: 0, max: 99, risk: 'Very High', interpretation: 'ANC <100/µL: Profound neutropenia; very high risk; consider empiric antifungal if >7 days duration' },
      ],
    },
  },

  // HEMATOLOGY / COAGULATION — Reticulocyte Production Index (RPI)
  {
    id: 'rpi',
    name: 'Reticulocyte Production Index',
    fullName: 'Reticulocyte Production Index (RPI)',
    category: 'HEMATOLOGY / COAGULATION',
    application: 'Corrects reticulocyte count for anemia severity and reticulocyte maturation time. Distinguishes hypoproliferative vs. hyperproliferative anemia.',
    applicableChiefComplaints: ['anemia', 'fatigue', 'weakness', 'pallor'],
    keywords: ['RPI', 'reticulocyte production index', 'anemia', 'reticulocyte', 'hemolysis', 'bone marrow', 'hypoproliferative', 'hyperproliferative'],
    requiredTests: ['CBC', 'reticulocyte count', 'hematocrit'],
    components: [
      { id: 'score', label: 'RPI Value', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Hypoproliferative', interpretation: 'RPI <2: Inadequate bone marrow response (hypoproliferative) — consider iron deficiency, B12/folate deficiency, anemia of chronic disease, bone marrow failure' },
        { min: 2, max: 10, risk: 'Hyperproliferative', interpretation: 'RPI >2: Appropriate bone marrow response (hyperproliferative) — hemolysis or acute blood loss' },
      ],
    },
  },

// === PEDIATRIC ===

  // PEDIATRIC — TEN-4-FACESp Rule
  {
    id: 'ten_4_faces_p',
    name: 'TEN-4-FACESp',
    fullName: 'TEN-4-FACESp Rule',
    category: 'PEDIATRIC',
    application: 'Identifies bruising patterns in young children (<4 years) suspicious for child abuse/non-accidental trauma. Any bruising in listed locations warrants evaluation.',
    applicableChiefComplaints: ['bruising', 'child_abuse', 'non_accidental_trauma', 'injury', 'infant_injury'],
    keywords: ['TEN-4-FACESp', 'child abuse', 'non-accidental trauma', 'bruising', 'pediatric', 'NAT', 'infant', 'physical abuse', 'patterned bruising'],
    components: [
      { id: 'score', label: 'Suspicious Location Present', type: 'number_range', source: 'section1', min: 0, max: 1 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'No bruising in suspicious locations; standard clinical judgment applies' },
        { min: 1, max: 1, risk: 'High', interpretation: 'Bruising in ANY suspicious location (torso, ear, neck, frenulum, jaw angle, cheek, eyelid, subconjunctival) OR any bruising in infant <4 months → High suspicion for non-accidental trauma; refer for child protective evaluation and skeletal survey' },
      ],
    },
  },

  // PEDIATRIC — Pittsburgh Infant Brain Injury Score (PIBS)
  {
    id: 'pibs',
    name: 'PIBS',
    fullName: 'Pittsburgh Infant Brain Injury Score (PIBS)',
    category: 'PEDIATRIC',
    application: 'Identifies infants (<12 months) at risk for abusive head trauma. Score ≥2 warrants neuroimaging and full abuse evaluation.',
    applicableChiefComplaints: ['infant_altered_mental_status', 'child_abuse', 'non_accidental_trauma', 'seizure', 'vomiting', 'irritability'],
    keywords: ['PIBS', 'Pittsburgh infant brain injury', 'abusive head trauma', 'shaken baby', 'child abuse', 'infant', 'non-accidental trauma', 'AHT'],
    requiredTests: ['hemoglobin', 'head circumference'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Score 0–1: Lower risk; clinical judgment always applies' },
        { min: 2, max: 6, risk: 'High', interpretation: 'Score ≥2: Consider neuroimaging (CT or MRI) and full abuse evaluation' },
      ],
    },
  },

  // PEDIATRIC — Westley Croup Score
  {
    id: 'westley_croup',
    name: 'Westley Croup Score',
    fullName: 'Westley Croup Score',
    category: 'PEDIATRIC',
    application: 'Quantifies croup severity to guide treatment (dexamethasone, nebulized epinephrine). Score ≥12 indicates impending respiratory failure.',
    applicableChiefComplaints: ['croup', 'stridor', 'barking_cough', 'respiratory_distress', 'upper_airway_obstruction'],
    keywords: ['Westley', 'croup', 'laryngotracheobronchitis', 'stridor', 'dexamethasone', 'epinephrine', 'respiratory distress', 'barking cough'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 17 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Mild', interpretation: 'Score ≤2: Mild croup; dexamethasone 0.6 mg/kg PO/IM; discharge likely' },
        { min: 3, max: 5, risk: 'Moderate', interpretation: 'Score 3–5: Moderate croup; dexamethasone + consider nebulized epinephrine; observe' },
        { min: 6, max: 11, risk: 'Severe', interpretation: 'Score 6–11: Severe croup; dexamethasone + nebulized epinephrine; admit' },
        { min: 12, max: 17, risk: 'Critical', interpretation: 'Score ≥12: Impending respiratory failure; dexamethasone + nebulized epinephrine; prepare for intubation; ICU' },
      ],
    },
  },

  // PEDIATRIC — Tal Score / Modified Tal Score
  {
    id: 'tal_score',
    name: 'Tal Score',
    fullName: 'Tal Score / Modified Tal Score',
    category: 'PEDIATRIC',
    application: 'Severity scoring for bronchiolitis in infants. Score ≥9 indicates severe bronchiolitis.',
    applicableChiefComplaints: ['bronchiolitis', 'wheezing', 'respiratory_distress', 'infant_respiratory'],
    keywords: ['Tal score', 'bronchiolitis', 'RSV', 'infant', 'wheezing', 'retractions', 'respiratory rate', 'SpO2'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Mild', interpretation: 'Score ≤4: Mild bronchiolitis' },
        { min: 5, max: 8, risk: 'Moderate', interpretation: 'Score 5–8: Moderate bronchiolitis; consider admission' },
        { min: 9, max: 12, risk: 'Severe', interpretation: 'Score 9–12: Severe bronchiolitis; admission required' },
      ],
    },
  },

  // PEDIATRIC — Gorelick Dehydration Scale
  {
    id: 'gorelick_dehydration',
    name: 'Gorelick Dehydration Scale',
    fullName: 'Gorelick Dehydration Scale',
    category: 'PEDIATRIC',
    application: 'Estimates degree of dehydration in children (1 month to 5 years). Score ≥7 indicates severe dehydration (>10% fluid deficit).',
    applicableChiefComplaints: ['dehydration', 'vomiting', 'diarrhea', 'gastroenteritis', 'poor_oral_intake'],
    keywords: ['Gorelick', 'dehydration', 'pediatric', 'gastroenteritis', 'vomiting', 'diarrhea', 'fluid deficit', 'rehydration'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Minimal', interpretation: 'Score 0: <5% dehydration; <50 mL/kg fluid deficit; oral rehydration' },
        { min: 1, max: 2, risk: 'Mild', interpretation: 'Score 1–2: ~5% dehydration; ~50 mL/kg deficit; oral rehydration' },
        { min: 3, max: 6, risk: 'Moderate', interpretation: 'Score 3–6: ~5–10% dehydration; ~50–100 mL/kg deficit; consider IV fluids' },
        { min: 7, max: 10, risk: 'Severe', interpretation: 'Score ≥7: >10% dehydration; >100 mL/kg deficit; IV fluid resuscitation required' },
      ],
    },
  },

  // PEDIATRIC — Clinical Dehydration Scale (CDS)
  {
    id: 'cds_pediatric',
    name: 'Clinical Dehydration Scale',
    fullName: 'CDS (Clinical Dehydration Scale)',
    category: 'PEDIATRIC',
    application: 'Simpler pediatric dehydration assessment validated for children 1 month to 3 years with gastroenteritis. Score 5–8 indicates moderate/severe dehydration.',
    applicableChiefComplaints: ['dehydration', 'vomiting', 'diarrhea', 'gastroenteritis'],
    keywords: ['CDS', 'clinical dehydration scale', 'pediatric', 'dehydration', 'gastroenteritis', 'vomiting', 'mucous membranes', 'tears'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'None', interpretation: 'Score 0: No dehydration' },
        { min: 1, max: 4, risk: 'Mild', interpretation: 'Score 1–4: Some dehydration (~3–6%)' },
        { min: 5, max: 8, risk: 'Severe', interpretation: 'Score 5–8: Moderate/severe dehydration (~6–9%+)' },
      ],
    },
  },

  // PEDIATRIC — Yale Observation Scale (YOS)
  {
    id: 'yos',
    name: 'Yale Observation Scale',
    fullName: 'Yale Observation Scale (YOS)',
    category: 'PEDIATRIC',
    application: 'Assesses severity of illness in febrile children aged 3–36 months based on observation. Score ≥16 has ~92% sensitivity for serious bacterial illness.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'irritability', 'ill_appearing_child'],
    keywords: ['Yale Observation Scale', 'YOS', 'febrile child', 'observation', 'serious bacterial illness', 'pediatric', 'ill-appearing', 'toddler'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 6, max: 30 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 6, max: 10, risk: 'Low', interpretation: 'Score 6–10: Low risk of serious bacterial illness (<3%)' },
        { min: 11, max: 15, risk: 'Moderate', interpretation: 'Score 11–15: Moderate risk; further evaluation recommended' },
        { min: 16, max: 30, risk: 'High', interpretation: 'Score ≥16: High risk of serious bacterial illness (~92% sensitivity); full sepsis workup indicated' },
      ],
    },
  },

  // PEDIATRIC — PEWS
  {
    id: 'pews',
    name: 'PEWS',
    fullName: 'PEWS (Pediatric Early Warning Score)',
    category: 'PEDIATRIC',
    application: 'Identifies pediatric inpatients at risk for clinical deterioration. Score ≥5 warrants immediate physician evaluation and consideration of PICU transfer.',
    applicableChiefComplaints: ['clinical_deterioration', 'respiratory_distress', 'altered_mental_status', 'shock'],
    keywords: ['PEWS', 'pediatric early warning score', 'deterioration', 'pediatric', 'inpatient', 'PICU', 'rapid response', 'escalation'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 13 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Score 0–2: Routine monitoring' },
        { min: 3, max: 3, risk: 'Low-Moderate', interpretation: 'Score 3: Increase monitoring frequency; bedside nurse assessment' },
        { min: 4, max: 4, risk: 'Moderate', interpretation: 'Score 4: Notify physician/rapid response team evaluation' },
        { min: 5, max: 13, risk: 'High', interpretation: 'Score ≥5: Immediate physician evaluation; consider PICU transfer; reassess q1h' },
      ],
    },
  },

  // PEDIATRIC — Bhutani Nomogram (Neonatal Jaundice)
  {
    id: 'bhutani_nomogram',
    name: 'Bhutani Nomogram',
    fullName: 'Bhutani Nomogram (Neonatal Jaundice)',
    category: 'PEDIATRIC',
    application: 'Risk-stratifies neonatal hyperbilirubinemia by plotting total serum bilirubin (TSB) against postnatal age in hours. Guides need for phototherapy.',
    applicableChiefComplaints: ['neonatal_jaundice', 'hyperbilirubinemia', 'jaundice', 'newborn_jaundice'],
    keywords: ['Bhutani', 'neonatal jaundice', 'hyperbilirubinemia', 'bilirubin', 'phototherapy', 'newborn', 'nomogram', 'kernicterus', 'AAP 2022'],
    requiredTests: ['total serum bilirubin', 'postnatal age in hours'],
    components: [
      { id: 'score', label: 'TSB Risk Zone', type: 'number_range', source: 'section1', min: 1, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 4, max: 4, risk: 'Low', interpretation: 'Low-risk zone (<40th percentile): ~0% risk of subsequent significant hyperbilirubinemia; routine follow-up' },
        { min: 3, max: 3, risk: 'Low-Intermediate', interpretation: 'Low-intermediate zone (40th–75th percentile): ~2.2% risk; follow-up within 48 hours' },
        { min: 2, max: 2, risk: 'High-Intermediate', interpretation: 'High-intermediate zone (75th–95th percentile): ~13% risk; follow-up within 24–48 hours; consider phototherapy if rising' },
        { min: 1, max: 1, risk: 'High', interpretation: 'High-risk zone (>95th percentile): ~40% risk; initiate phototherapy; close follow-up within 24 hours' },
      ],
    },
  },

  // PEDIATRIC — Phoenix Sepsis Criteria (2024)
  {
    id: 'phoenix_sepsis',
    name: 'Phoenix Sepsis',
    fullName: 'Phoenix Sepsis Criteria (2024)',
    category: 'PEDIATRIC',
    application: 'New international consensus criteria for pediatric sepsis, replacing previous SIRS-based definitions. Phoenix Sepsis = suspected infection + score ≥2 (≥1 point from ≥2 organ systems).',
    applicableChiefComplaints: ['sepsis', 'pediatric_sepsis', 'fever', 'altered_mental_status', 'shock'],
    keywords: ['Phoenix sepsis', 'pediatric sepsis', '2024', 'organ dysfunction', 'Phoenix score', 'septic shock', 'JAMA 2024', 'Schlapbach'],
    requiredTests: ['PaO2', 'SpO2', 'FiO2', 'lactate', 'MAP', 'platelets', 'INR', 'D-dimer', 'GCS'],
    components: [
      { id: 'score', label: 'Total Phoenix Score', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low', interpretation: 'Score <2 with ≥2 organ systems: Does not meet Phoenix Sepsis criteria' },
        { min: 2, max: 12, risk: 'High', interpretation: 'Score ≥2 (≥1 point from ≥2 organ systems) + suspected infection = Phoenix Sepsis (~3.5% mortality); cardiovascular score ≥1 = Phoenix Septic Shock (~10–15% mortality)' },
      ],
    },
  },

// === PROCEDURAL / AIRWAY ===

  // PROCEDURAL / AIRWAY — LEMON Assessment
  {
    id: 'lemon',
    name: 'LEMON Assessment',
    fullName: 'LEMON Assessment',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Predicts difficult intubation using five components: Look externally, Evaluate 3-3-2, Mallampati score, Obstruction, Neck mobility.',
    applicableChiefComplaints: ['airway_management', 'intubation', 'respiratory_failure', 'RSI', 'airway_obstruction'],
    keywords: ['LEMON', 'difficult intubation', 'airway', 'Mallampati', 'RSI', 'intubation', 'laryngoscopy', 'airway management'],
    components: [
      { id: 'score', label: 'Number of Positive Factors', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Standard', interpretation: 'No positive components: Standard airway; proceed with caution but no specific difficult airway preparation required' },
        { min: 1, max: 5, risk: 'High', interpretation: 'ANY positive component warrants preparation for difficult airway; Class III–IV Mallampati predicts more difficult laryngoscopy' },
      ],
    },
  },

  // PROCEDURAL / AIRWAY — MOANS
  {
    id: 'moans',
    name: 'MOANS',
    fullName: 'MOANS',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Predicts difficult bag-valve-mask (BVM) ventilation. Any positive factor warrants preparation with adjuncts (OPA/NPA, two-person technique, supraglottic device backup).',
    applicableChiefComplaints: ['airway_management', 'BVM_ventilation', 'respiratory_failure', 'apnea'],
    keywords: ['MOANS', 'bag-valve-mask', 'BVM', 'difficult ventilation', 'airway', 'mask seal', 'obesity', 'COPD', 'sleep apnea'],
    components: [
      { id: 'score', label: 'Number of Positive Factors', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Standard', interpretation: 'No positive factors: Standard BVM ventilation expected' },
        { min: 1, max: 5, risk: 'High', interpretation: 'Any positive factor → Anticipate difficult BVM ventilation; have adjuncts ready (OPA/NPA, two-person technique, supraglottic device backup)' },
      ],
    },
  },

  // PROCEDURAL / AIRWAY — RODS
  {
    id: 'rods',
    name: 'RODS',
    fullName: 'RODS',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Predicts difficult extraglottic device (EGD/supraglottic airway) placement. Any positive factor suggests EGD may not be a reliable rescue and surgical airway should be planned.',
    applicableChiefComplaints: ['airway_management', 'cannot_intubate', 'respiratory_failure', 'airway_obstruction'],
    keywords: ['RODS', 'extraglottic device', 'EGD', 'supraglottic airway', 'LMA', 'difficult airway', 'surgical airway'],
    components: [
      { id: 'score', label: 'Number of Positive Factors', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Standard', interpretation: 'No positive factors: EGD likely to be effective rescue device' },
        { min: 1, max: 4, risk: 'High', interpretation: 'Any positive factor → EGD may not be a reliable rescue; plan for surgical airway' },
      ],
    },
  },

  // PROCEDURAL / AIRWAY — SHORT
  {
    id: 'short',
    name: 'SHORT',
    fullName: 'SHORT',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Predicts difficult cricothyrotomy (surgical airway). Any positive factor suggests the procedure may be technically challenging.',
    applicableChiefComplaints: ['airway_management', 'cannot_intubate_cannot_oxygenate', 'surgical_airway', 'neck_trauma'],
    keywords: ['SHORT', 'cricothyrotomy', 'surgical airway', 'difficult airway', 'neck hematoma', 'obesity', 'cannot intubate', 'CICO'],
    components: [
      { id: 'score', label: 'Number of Positive Factors', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Standard', interpretation: 'No positive factors: Standard cricothyrotomy expected' },
        { min: 1, max: 5, risk: 'High', interpretation: 'Any positive factor → Cricothyrotomy may be technically difficult; consider awake intubation; have backup plans; consider patient positioning' },
      ],
    },
  },

  // PROCEDURAL / AIRWAY — 3-3-2 Rule
  {
    id: 'three_three_two',
    name: '3-3-2 Rule',
    fullName: '3-3-2 Rule',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Quick bedside airway geometry assessment to predict difficulty with direct laryngoscopy. Evaluates three distances: mouth opening, submandibular space, and thyromental distance.',
    applicableChiefComplaints: ['airway_management', 'intubation', 'difficult_airway', 'RSI'],
    keywords: ['3-3-2 rule', 'airway geometry', 'thyromental distance', 'mouth opening', 'submandibular space', 'direct laryngoscopy', 'difficult airway'],
    components: [
      { id: 'score', label: 'Number of Adequate Measurements', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 3, max: 3, risk: 'Standard', interpretation: 'All measurements adequate: Likely adequate space for laryngoscopy' },
        { min: 0, max: 2, risk: 'High', interpretation: 'Any measurement reduced → Predicts difficulty; plan for difficult airway accordingly' },
      ],
    },
  },

  // PROCEDURAL / AIRWAY — ASA Physical Status Classification
  {
    id: 'asa_classification',
    name: 'ASA Classification',
    fullName: 'ASA Physical Status Classification',
    category: 'PROCEDURAL / AIRWAY',
    application: 'Pre-procedural risk stratification; standardized communication about patient baseline health. ASA I–II generally safe for ED procedural sedation by emergency physicians.',
    applicableChiefComplaints: ['procedural_sedation', 'procedure', 'sedation', 'anesthesia'],
    keywords: ['ASA', 'physical status', 'anesthesia', 'procedural sedation', 'pre-procedural', 'risk stratification', 'ASA I', 'ASA II', 'ASA III'],
    components: [
      { id: 'score', label: 'ASA Class', type: 'number_range', source: 'section1', min: 1, max: 6 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 2, risk: 'Low', interpretation: 'ASA I–II: Generally safe for ED procedural sedation by emergency physicians' },
        { min: 3, max: 3, risk: 'Moderate', interpretation: 'ASA III: Increased risk; careful risk-benefit analysis; consider anesthesia involvement' },
        { min: 4, max: 6, risk: 'High', interpretation: 'ASA IV–V: High risk; strong consideration for anesthesia-managed sedation or operating room' },
      ],
    },
  },

// === ENVIRONMENTAL ===

  // ENVIRONMENTAL — Swiss Staging System (Hypothermia)
  {
    id: 'swiss_staging_hypothermia',
    name: 'Swiss Staging System',
    fullName: 'Swiss Staging System (Hypothermia)',
    category: 'ENVIRONMENTAL',
    application: 'Classifies hypothermia severity based on clinical signs, applicable in the field when core temperature measurement may not be available.',
    applicableChiefComplaints: ['hypothermia', 'cold_exposure', 'altered_mental_status', 'cold_water_immersion', 'frostbite'],
    keywords: ['Swiss staging', 'hypothermia', 'HT I', 'HT II', 'HT III', 'HT IV', 'ECMO', 'rewarming', 'cardiac arrest'],
    components: [
      { id: 'score', label: 'Hypothermia Stage', type: 'number_range', source: 'section1', min: 1, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Mild', interpretation: 'HT I (32–35°C): Mild; shivering, conscious; passive external rewarming (remove wet clothes, blankets)' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'HT II (28–32°C): Moderate; impaired consciousness; active external rewarming; minimize movement (dysrhythmia risk)' },
        { min: 3, max: 3, risk: 'Severe', interpretation: 'HT III (24–28°C): Severe; unconscious with vital signs; active internal rewarming; limit to 3 defibrillation attempts if VF' },
        { min: 4, max: 4, risk: 'Critical', interpretation: 'HT IV (<24°C): Profound; no vital signs; ECMO/cardiopulmonary bypass if available; "Not dead until warm and dead"' },
        { min: 5, max: 5, risk: 'Fatal', interpretation: 'HT V (<13.7°C): Death from irreversible hypothermia' },
      ],
    },
  },

  // ENVIRONMENTAL — Bouchama Criteria (Heat Stroke)
  {
    id: 'bouchama_heat_stroke',
    name: 'Bouchama Criteria',
    fullName: 'Bouchama Criteria (Heat Stroke)',
    category: 'ENVIRONMENTAL',
    application: 'Diagnostic criteria for classic and exertional heat stroke. Requires core temperature >40°C plus CNS dysfunction — medical emergency requiring aggressive cooling.',
    applicableChiefComplaints: ['heat_stroke', 'hyperthermia', 'altered_mental_status', 'heat_exposure', 'exertional_heat_illness'],
    keywords: ['Bouchama', 'heat stroke', 'hyperthermia', 'heat exhaustion', 'cooling', 'exertional', 'CNS dysfunction', 'cold water immersion'],
    components: [
      { id: 'score', label: 'Criteria Met', type: 'number_range', source: 'section1', min: 0, max: 3 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 2, risk: 'Heat Exhaustion', interpretation: 'Does not meet heat stroke criteria; temperature typically <40°C with normal mental status = heat exhaustion; treat with cooling and rehydration' },
        { min: 3, max: 3, risk: 'Heat Stroke', interpretation: 'ALL 3 criteria met (temp >40°C, CNS dysfunction, heat exposure): Heat stroke — medical emergency; aggressive cooling targeting <39°C within 30 minutes; cold water immersion gold standard for exertional heat stroke' },
      ],
    },
  },

// === DISPOSITION / RISK STRATIFICATION ===

  // DISPOSITION / RISK STRATIFICATION — APACHE II
  {
    id: 'apache_ii',
    name: 'APACHE II',
    fullName: 'APACHE II (Acute Physiology and Chronic Health Evaluation II)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'ICU mortality prediction; calculated within first 24 hours of ICU admission using worst physiological values. Score >34 associated with >85% mortality.',
    applicableChiefComplaints: ['ICU_admission', 'critical_illness', 'sepsis', 'multi_organ_failure'],
    keywords: ['APACHE II', 'ICU mortality', 'critical illness', 'severity of illness', 'prognosis', 'acute physiology', 'mortality prediction'],
    requiredTests: ['temperature', 'MAP', 'heart rate', 'respiratory rate', 'PaO2', 'FiO2', 'arterial pH', 'sodium', 'potassium', 'creatinine', 'hematocrit', 'WBC', 'GCS'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 71 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low', interpretation: 'Score 0–4: ~4% mortality' },
        { min: 5, max: 9, risk: 'Low-Moderate', interpretation: 'Score 5–9: ~8% mortality' },
        { min: 10, max: 14, risk: 'Moderate', interpretation: 'Score 10–14: ~15% mortality' },
        { min: 15, max: 19, risk: 'Moderate-High', interpretation: 'Score 15–19: ~25% mortality' },
        { min: 20, max: 24, risk: 'High', interpretation: 'Score 20–24: ~40% mortality' },
        { min: 25, max: 29, risk: 'High', interpretation: 'Score 25–29: ~55% mortality' },
        { min: 30, max: 34, risk: 'Very High', interpretation: 'Score 30–34: ~75% mortality' },
        { min: 35, max: 71, risk: 'Critical', interpretation: 'Score >34: ~85%+ mortality' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — NEWS2
  {
    id: 'news2',
    name: 'NEWS2',
    fullName: 'NEWS2 (National Early Warning Score 2)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Detects clinical deterioration and identifies need for escalation of care. Used for inpatient monitoring. Score ≥7 warrants emergency response and critical care assessment.',
    applicableChiefComplaints: ['clinical_deterioration', 'inpatient_monitoring', 'sepsis', 'respiratory_failure'],
    keywords: ['NEWS2', 'National Early Warning Score', 'deterioration', 'inpatient', 'escalation', 'sepsis', 'respiratory rate', 'SpO2', 'COPD'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 20 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low', interpretation: 'Score 0–4: Low risk; routine monitoring' },
        { min: 3, max: 4, risk: 'Low-Medium', interpretation: 'Score 3 in single parameter: Low-medium; urgent bedside assessment' },
        { min: 5, max: 6, risk: 'Medium', interpretation: 'Score 5–6: Medium risk; urgent response; consider escalation' },
        { min: 7, max: 20, risk: 'High', interpretation: 'Score ≥7: High risk; emergency response; critical care assessment required' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — MEWS
  {
    id: 'mews',
    name: 'MEWS',
    fullName: 'MEWS (Modified Early Warning Score)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Simplified deterioration detection tool for inpatient monitoring. Score ≥5 warrants urgent medical review and critical care consultation.',
    applicableChiefComplaints: ['clinical_deterioration', 'inpatient_monitoring', 'vital_sign_abnormality'],
    keywords: ['MEWS', 'Modified Early Warning Score', 'deterioration', 'inpatient', 'vital signs', 'escalation', 'AVPU'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 15 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'Score 0–2: Continue routine monitoring' },
        { min: 3, max: 4, risk: 'Moderate', interpretation: 'Score 3–4: Increase monitoring frequency; notify primary team' },
        { min: 5, max: 15, risk: 'High', interpretation: 'Score ≥5: Urgent medical review; consider ICU/critical care consultation' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — Glasgow Coma Scale (GCS)
  {
    id: 'gcs',
    name: 'GCS',
    fullName: 'Glasgow Coma Scale (GCS)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Standardized assessment of level of consciousness. GCS ≤8 generally indicates need for intubation. Report as total and component subscores (E V M).',
    applicableChiefComplaints: ['altered_mental_status', 'head_trauma', 'traumatic_brain_injury', 'unresponsive', 'coma', 'seizure'],
    keywords: ['GCS', 'Glasgow Coma Scale', 'level of consciousness', 'LOC', 'TBI', 'head injury', 'eye opening', 'verbal', 'motor', 'intubation threshold'],
    components: [
      { id: 'score', label: 'Total GCS', type: 'number_range', source: 'section1', min: 3, max: 15 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 13, max: 15, risk: 'Mild', interpretation: 'GCS 13–15: Mild brain injury' },
        { min: 9, max: 12, risk: 'Moderate', interpretation: 'GCS 9–12: Moderate brain injury' },
        { min: 3, max: 8, risk: 'Severe', interpretation: 'GCS ≤8: Severe brain injury; generally indicates need for intubation' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — Revised Trauma Score (RTS)
  {
    id: 'rts',
    name: 'Revised Trauma Score',
    fullName: 'Revised Trauma Score (RTS)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Prehospital and ED triage tool; predicts survival in trauma. T-RTS ≤11 indicates need for trauma center transport.',
    applicableChiefComplaints: ['trauma', 'MVC', 'fall', 'penetrating_trauma', 'multi_system_trauma'],
    keywords: ['RTS', 'Revised Trauma Score', 'trauma triage', 'T-RTS', 'GCS', 'SBP', 'respiratory rate', 'TRISS', 'trauma center'],
    components: [
      { id: 'score', label: 'Triage RTS (T-RTS)', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 11, risk: 'High', interpretation: 'T-RTS ≤11: Consider trauma center transport; RTS <4 associated with ~30% predicted survival' },
        { min: 12, max: 12, risk: 'Low', interpretation: 'T-RTS 12: Normal physiology; standard triage' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — Injury Severity Score (ISS)
  {
    id: 'iss',
    name: 'ISS',
    fullName: 'Injury Severity Score (ISS)',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Anatomic injury severity measure calculated after injuries are identified. Uses the three highest AIS scores from three different body regions; ISS ≥16 = major trauma.',
    applicableChiefComplaints: ['trauma', 'multi_system_trauma', 'MVC', 'penetrating_trauma', 'blunt_trauma'],
    keywords: ['ISS', 'Injury Severity Score', 'AIS', 'Abbreviated Injury Scale', 'trauma', 'major trauma', 'mortality', 'TRISS', 'anatomic scoring'],
    components: [
      { id: 'score', label: 'Total ISS', type: 'number_range', source: 'section1', min: 1, max: 75 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 8, risk: 'Minor', interpretation: 'ISS <9: Minor trauma' },
        { min: 9, max: 15, risk: 'Moderate', interpretation: 'ISS 9–15: Moderate trauma' },
        { min: 16, max: 24, risk: 'Severe', interpretation: 'ISS 16–24: Severe trauma (major trauma); trauma center care recommended' },
        { min: 25, max: 74, risk: 'Critical', interpretation: 'ISS ≥25: Critical trauma; high mortality' },
        { min: 75, max: 75, risk: 'Unsurvivable', interpretation: 'ISS 75: Unsurvivable injury present (any AIS = 6 automatically scores 75)' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — MELD Score / MELD-Na
  {
    id: 'meld',
    name: 'MELD Score',
    fullName: 'MELD Score / MELD-Na',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'End-stage liver disease severity; transplant prioritization; predicts 90-day mortality. MELD >15 generally indicates transplant evaluation.',
    applicableChiefComplaints: ['liver_failure', 'cirrhosis', 'ascites', 'hepatic_encephalopathy', 'jaundice', 'GI_bleed'],
    keywords: ['MELD', 'MELD-Na', 'liver disease', 'transplant', 'cirrhosis', 'creatinine', 'bilirubin', 'INR', 'sodium', '90-day mortality'],
    requiredTests: ['creatinine', 'bilirubin', 'INR', 'sodium'],
    components: [
      { id: 'score', label: 'MELD Score', type: 'number_range', source: 'section1', min: 6, max: 40 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 6, max: 9, risk: 'Low', interpretation: 'MELD <10: ~2% 90-day mortality' },
        { min: 10, max: 19, risk: 'Moderate', interpretation: 'MELD 10–19: ~6% 90-day mortality' },
        { min: 20, max: 29, risk: 'High', interpretation: 'MELD 20–29: ~20% 90-day mortality; transplant evaluation strongly considered' },
        { min: 30, max: 39, risk: 'Very High', interpretation: 'MELD 30–39: ~53% 90-day mortality; high transplant priority' },
        { min: 40, max: 40, risk: 'Critical', interpretation: 'MELD ≥40: ~71% 90-day mortality; urgent transplant priority' },
      ],
    },
  },

  // DISPOSITION / RISK STRATIFICATION — Child-Pugh Score
  {
    id: 'child_pugh',
    name: 'Child-Pugh Score',
    fullName: 'Child-Pugh Score',
    category: 'DISPOSITION / RISK STRATIFICATION',
    application: 'Classifies cirrhosis severity; predicts surgical risk and survival. Class C (score 10–15) associated with 45% 1-year and 35% 2-year survival.',
    applicableChiefComplaints: ['cirrhosis', 'liver_disease', 'ascites', 'hepatic_encephalopathy', 'jaundice', 'GI_bleed'],
    keywords: ['Child-Pugh', 'cirrhosis', 'liver failure', 'surgical risk', 'ascites', 'encephalopathy', 'bilirubin', 'albumin', 'INR', 'hepatic'],
    requiredTests: ['bilirubin', 'albumin', 'INR', 'clinical assessment of ascites and encephalopathy'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 5, max: 15 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 5, max: 6, risk: 'Low', interpretation: 'Class A (5–6): Well-compensated cirrhosis; 1-year survival 100%, 2-year 85%' },
        { min: 7, max: 9, risk: 'Moderate', interpretation: 'Class B (7–9): Significant compromise; 1-year survival 81%, 2-year 57%' },
        { min: 10, max: 15, risk: 'High', interpretation: 'Class C (10–15): Decompensated cirrhosis; 1-year survival 45%, 2-year 35%; high surgical mortality' },
      ],
    },
  },
// === OB/GYN & OBSTETRIC EMERGENCY ===

  // OB/GYN & OBSTETRIC EMERGENCY — Bishop Score
  {
    id: 'bishop_score',
    name: 'Bishop Score',
    fullName: 'Bishop Score',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Assesses cervical readiness for induction of labor. Higher scores predict successful vaginal delivery with induction.',
    applicableChiefComplaints: ['labor_induction', 'obstetric_emergency', 'pregnancy_complications'],
    keywords: ['bishop', 'cervical ripening', 'labor induction', 'effacement', 'dilation', 'station', 'cervix', 'obstetrics'],
    components: [
      { id: 'score', label: 'Total Score', type: 'number_range', source: 'section1', min: 0, max: 13 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 5, risk: 'Unfavorable', interpretation: 'Unfavorable cervix; cervical ripening recommended before induction' },
        { min: 6, max: 7, risk: 'Moderate', interpretation: 'Moderately favorable; induction may proceed' },
        { min: 8, max: 13, risk: 'Favorable', interpretation: 'Favorable cervix; high likelihood of successful induction' },
      ],
    },
  },

  // OB/GYN & OBSTETRIC EMERGENCY — Preeclampsia Severe Features (ACOG)
  {
    id: 'preeclampsia_severe_features',
    name: 'Preeclampsia Severe Features',
    fullName: 'Preeclampsia with Severe Features Criteria (ACOG)',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Identifies preeclampsia with severe features requiring urgent management, typically delivery if ≥34 weeks gestation. Requires hypertension plus proteinuria OR hypertension plus at least one severe feature.',
    applicableChiefComplaints: ['hypertension_in_pregnancy', 'preeclampsia', 'headache_in_pregnancy', 'epigastric_pain', 'obstetric_emergency', 'visual_disturbance'],
    keywords: ['preeclampsia', 'severe features', 'ACOG', 'gestational hypertension', 'HELLP', 'eclampsia', 'proteinuria', 'thrombocytopenia', 'pulmonary edema', 'obstetrics'],
    requiredTests: ['blood pressure', 'urinalysis', 'CBC', 'BMP', 'LFTs', 'urine protein'],
    components: [
      { id: 'severe_feature', label: 'Severe Feature Present', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Without Severe Features', interpretation: 'Preeclampsia without severe features; close monitoring, delivery at 37 weeks' },
        { min: 1, max: 1, risk: 'With Severe Features', interpretation: 'Preeclampsia with severe features; delivery recommended at ≥34 weeks, expectant management may be considered at <34 weeks' },
      ],
    },
  },

  // OB/GYN & OBSTETRIC EMERGENCY — HELLP Syndrome Classification (Mississippi/Martin)
  {
    id: 'hellp_mississippi',
    name: 'HELLP Classification',
    fullName: 'HELLP Syndrome Classification (Mississippi / Martin)',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Classifies severity of HELLP syndrome (Hemolysis, Elevated Liver enzymes, Low Platelets) to guide management intensity. All classes typically require delivery.',
    applicableChiefComplaints: ['preeclampsia', 'epigastric_pain', 'obstetric_emergency', 'thrombocytopenia', 'right_upper_quadrant_pain'],
    keywords: ['HELLP', 'Mississippi classification', 'Martin', 'hemolysis', 'elevated liver enzymes', 'low platelets', 'LDH', 'AST', 'obstetrics', 'preeclampsia'],
    requiredTests: ['CBC', 'LFTs', 'LDH', 'peripheral blood smear'],
    components: [
      { id: 'hellp_class', label: 'HELLP Class', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Class 1 - Severe', interpretation: 'Platelets ≤50,000; highest maternal morbidity; most aggressive management required' },
        { min: 2, max: 2, risk: 'Class 2 - Moderate', interpretation: 'Platelets >50,000–100,000; intermediate risk' },
        { min: 3, max: 3, risk: 'Class 3 - Mild', interpretation: 'Platelets >100,000–150,000; lower risk but still requires close monitoring' },
      ],
    },
  },

  // OB/GYN & OBSTETRIC EMERGENCY — Maternal Early Warning Criteria (MEWC)
  {
    id: 'mewc',
    name: 'MEWC',
    fullName: 'Maternal Early Warning Criteria (MEWC)',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Identifies obstetric patients at risk for clinical deterioration requiring urgent evaluation. Any single trigger parameter mandates bedside evaluation by an obstetric provider within 30 minutes.',
    applicableChiefComplaints: ['obstetric_emergency', 'maternal_deterioration', 'pregnancy_complications', 'altered_mental_status'],
    keywords: ['MEWC', 'maternal early warning', 'obstetric deterioration', 'maternal safety', 'rapid response', 'maternal mortality'],
    components: [
      { id: 'trigger', label: 'Trigger Parameter Present', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'No Trigger', interpretation: 'No trigger criteria met; routine monitoring' },
        { min: 1, max: 1, risk: 'Triggered', interpretation: 'Single trigger → bedside evaluation within 30 min; multiple triggers or persistence → immediate evaluation' },
      ],
    },
  },

  // OB/GYN & OBSTETRIC EMERGENCY — Kleihauer-Betke / RhIG Dosing
  {
    id: 'kleihauer_betke',
    name: 'Kleihauer-Betke / RhIG Dosing',
    fullName: 'Kleihauer-Betke Interpretation & RhIG Dosing',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Quantifies fetal-maternal hemorrhage (FMH) volume to determine adequate RhIG (RhoGAM) dosing in Rh-negative mothers. Standard dose of 300 μg covers 30 mL of fetal whole blood.',
    applicableChiefComplaints: ['trauma_in_pregnancy', 'vaginal_bleeding_in_pregnancy', 'obstetric_emergency', 'placental_abruption'],
    keywords: ['Kleihauer-Betke', 'KB test', 'RhIG', 'RhoGAM', 'fetal-maternal hemorrhage', 'FMH', 'Rh negative', 'alloimmunization', 'anti-D'],
    requiredTests: ['Kleihauer-Betke test', 'blood type', 'Rh factor'],
    components: [
      { id: 'fmh_volume', label: 'FMH Volume (mL)', type: 'number_range', source: 'section1', min: 0, max: 500 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 30, risk: 'Standard Dose', interpretation: 'FMH ≤30 mL: 1 standard dose (300 μg) RhIG adequate' },
        { min: 31, max: 500, risk: 'Additional Doses', interpretation: 'FMH >30 mL: Calculate number of vials = FMH ÷ 30, round up and add 1 vial' },
      ],
    },
  },

  // OB/GYN & OBSTETRIC EMERGENCY — Apgar Score
  {
    id: 'apgar',
    name: 'Apgar Score',
    fullName: 'Apgar Score',
    category: 'OB/GYN & OBSTETRIC EMERGENCY',
    application: 'Rapid assessment of newborn clinical status at 1 and 5 minutes after birth. Guides need for resuscitation; 1-minute score guides immediate interventions, 5-minute score is a better predictor of neonatal outcomes.',
    applicableChiefComplaints: ['newborn_resuscitation', 'delivery', 'neonatal_distress', 'obstetric_emergency'],
    keywords: ['Apgar', 'newborn', 'neonatal resuscitation', 'appearance', 'pulse', 'grimace', 'activity', 'respiration', 'birth assessment'],
    components: [
      { id: 'score', label: 'Apgar Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Severely Depressed', interpretation: 'Severely depressed; immediate resuscitation required' },
        { min: 4, max: 6, risk: 'Moderately Depressed', interpretation: 'Moderately depressed; may need stimulation, suctioning, oxygen' },
        { min: 7, max: 10, risk: 'Normal', interpretation: 'Normal; routine care' },
      ],
    },
  },

// === PSYCHIATRY & BEHAVIORAL HEALTH ===

  // PSYCHIATRY & BEHAVIORAL HEALTH — C-SSRS Screening
  {
    id: 'cssrs_screening',
    name: 'C-SSRS',
    fullName: 'Columbia Suicide Severity Rating Scale (C-SSRS) — Screening Version',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Standardized screening for suicidal ideation and behavior used in emergency departments, primary care, and crisis settings. Questions asked sequentially; stop when criteria met.',
    applicableChiefComplaints: ['suicidal_ideation', 'suicide_attempt', 'psychiatric_emergency', 'depression', 'self_harm'],
    keywords: ['C-SSRS', 'Columbia', 'suicide', 'suicidal ideation', 'suicidal behavior', 'risk assessment', 'safety planning', 'psychiatric screening'],
    components: [
      { id: 'highest_question', label: 'Highest Positive Question (1–6)', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Low', interpretation: 'Wish to be dead only; brief intervention and safety planning' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'Non-specific suicidal thoughts; safety assessment, consider psychiatric evaluation' },
        { min: 3, max: 5, risk: 'High', interpretation: 'Active suicidal ideation with method/intent; psychiatric evaluation required, consider hospitalization' },
        { min: 6, max: 6, risk: 'Highest', interpretation: 'Suicidal behavior present; immediate psychiatric evaluation, 1:1 observation, likely hospitalization' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — PHQ-9
  {
    id: 'phq9',
    name: 'PHQ-9',
    fullName: 'PHQ-9 (Patient Health Questionnaire-9)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Screens for and measures severity of depression. Each of 9 items rates frequency of symptoms over the past 2 weeks on a 0–3 scale.',
    applicableChiefComplaints: ['depression', 'mood_disorder', 'psychiatric_evaluation', 'suicidal_ideation', 'anxiety'],
    keywords: ['PHQ-9', 'PHQ9', 'depression screening', 'Patient Health Questionnaire', 'depression severity', 'anhedonia', 'mood'],
    components: [
      { id: 'score', label: 'PHQ-9 Total Score', type: 'number_range', source: 'section1', min: 0, max: 27 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Minimal', interpretation: 'Minimal or no depression' },
        { min: 5, max: 9, risk: 'Mild', interpretation: 'Mild depression' },
        { min: 10, max: 14, risk: 'Moderate', interpretation: 'Moderate depression; consider treatment plan' },
        { min: 15, max: 19, risk: 'Moderately Severe', interpretation: 'Moderately severe depression; active treatment recommended' },
        { min: 20, max: 27, risk: 'Severe', interpretation: 'Severe depression; immediate treatment, consider psychiatry referral' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — PHQ-2
  {
    id: 'phq2',
    name: 'PHQ-2',
    fullName: 'PHQ-2 (Patient Health Questionnaire-2)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Ultra-brief depression screening using the first 2 items of the PHQ-9. Used as initial screen; a positive result triggers administration of the full PHQ-9.',
    applicableChiefComplaints: ['depression', 'mood_disorder', 'psychiatric_evaluation'],
    keywords: ['PHQ-2', 'PHQ2', 'depression screening', 'ultra-brief', 'Patient Health Questionnaire', 'anhedonia'],
    components: [
      { id: 'score', label: 'PHQ-2 Total Score', type: 'number_range', source: 'section1', min: 0, max: 6 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Negative Screen', interpretation: 'Negative screen (sensitivity 83%, specificity 92% for major depression)' },
        { min: 3, max: 6, risk: 'Positive Screen', interpretation: 'Positive screen; administer full PHQ-9' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — GAD-7
  {
    id: 'gad7',
    name: 'GAD-7',
    fullName: 'GAD-7 (Generalized Anxiety Disorder-7)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Screens for and measures severity of generalized anxiety disorder. Also sensitive for panic disorder, social anxiety, and PTSD.',
    applicableChiefComplaints: ['anxiety', 'panic_attack', 'psychiatric_evaluation', 'ptsd'],
    keywords: ['GAD-7', 'GAD7', 'anxiety screening', 'generalized anxiety disorder', 'panic', 'PTSD', 'worry'],
    components: [
      { id: 'score', label: 'GAD-7 Total Score', type: 'number_range', source: 'section1', min: 0, max: 21 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Minimal', interpretation: 'Minimal anxiety' },
        { min: 5, max: 9, risk: 'Mild', interpretation: 'Mild anxiety' },
        { min: 10, max: 14, risk: 'Moderate', interpretation: 'Moderate anxiety; consider treatment' },
        { min: 15, max: 21, risk: 'Severe', interpretation: 'Severe anxiety; active treatment recommended' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — CAGE
  {
    id: 'cage',
    name: 'CAGE',
    fullName: 'CAGE Questionnaire',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Screens for alcohol use disorder using a simple 4-question mnemonic tool.',
    applicableChiefComplaints: ['alcohol_use_disorder', 'substance_abuse', 'psychiatric_evaluation', 'alcohol_withdrawal'],
    keywords: ['CAGE', 'alcohol screening', 'alcohol use disorder', 'alcohol dependence', 'cut down', 'annoyed', 'guilty', 'eye-opener'],
    components: [
      { id: 'score', label: 'CAGE Score', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Low', interpretation: 'Low suspicion for alcohol use disorder' },
        { min: 1, max: 1, risk: 'Low-Moderate', interpretation: 'Low-moderate suspicion' },
        { min: 2, max: 3, risk: 'High', interpretation: '≥2 is clinically significant; high suspicion for alcohol use disorder (sensitivity 93%, specificity 76%)' },
        { min: 4, max: 4, risk: 'Very High', interpretation: 'Score 4 is nearly diagnostic of alcohol dependence' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — AUDIT
  {
    id: 'audit',
    name: 'AUDIT',
    fullName: 'AUDIT (Alcohol Use Disorders Identification Test)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'WHO-developed comprehensive screening for hazardous drinking, harmful drinking, and alcohol dependence using 10 items scored 0–4 each.',
    applicableChiefComplaints: ['alcohol_use_disorder', 'substance_abuse', 'psychiatric_evaluation'],
    keywords: ['AUDIT', 'alcohol screening', 'WHO', 'hazardous drinking', 'alcohol dependence', 'AUDIT-C', 'alcohol use disorders'],
    components: [
      { id: 'score', label: 'AUDIT Total Score', type: 'number_range', source: 'section1', min: 0, max: 40 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 7, risk: 'Low Risk', interpretation: 'Low risk drinking' },
        { min: 8, max: 15, risk: 'Hazardous', interpretation: 'Hazardous drinking; brief intervention recommended' },
        { min: 16, max: 19, risk: 'Harmful', interpretation: 'Harmful drinking; brief intervention plus continued monitoring' },
        { min: 20, max: 40, risk: 'Probable Dependence', interpretation: 'Probable alcohol dependence; referral for diagnostic evaluation and treatment' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — COWS
  {
    id: 'cows',
    name: 'COWS',
    fullName: 'COWS (Clinical Opiate Withdrawal Scale)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Measures severity of opioid withdrawal to guide medication-assisted treatment (buprenorphine, methadone) initiation. Buprenorphine initiation typically requires a COWS score of ≥8–12.',
    applicableChiefComplaints: ['opioid_withdrawal', 'substance_abuse', 'drug_withdrawal'],
    keywords: ['COWS', 'opioid withdrawal', 'Clinical Opiate Withdrawal Scale', 'buprenorphine', 'methadone', 'MAT', 'MOUD', 'suboxone'],
    components: [
      { id: 'score', label: 'COWS Total Score', type: 'number_range', source: 'section1', min: 0, max: 48 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 5, max: 12, risk: 'Mild', interpretation: 'Mild withdrawal' },
        { min: 13, max: 24, risk: 'Moderate', interpretation: 'Moderate withdrawal; can initiate buprenorphine' },
        { min: 25, max: 36, risk: 'Moderately Severe', interpretation: 'Moderately severe withdrawal' },
        { min: 37, max: 48, risk: 'Severe', interpretation: 'Severe withdrawal' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — RASS
  {
    id: 'rass',
    name: 'RASS',
    fullName: 'RASS (Richmond Agitation-Sedation Scale)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Standardized assessment of agitation and sedation level in ICU and ED patients. Used to titrate sedation and assess for delirium; target RASS for most ICU patients is 0 to −2.',
    applicableChiefComplaints: ['agitation', 'altered_mental_status', 'sedation', 'icu_management'],
    keywords: ['RASS', 'Richmond Agitation Sedation Scale', 'sedation', 'agitation', 'ICU', 'delirium', 'sedation titration'],
    components: [
      { id: 'score', label: 'RASS Score', type: 'number_range', source: 'section1', min: -5, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: -5, max: -5, risk: 'Unarousable', interpretation: 'No response to voice or physical stimulation' },
        { min: -4, max: -4, risk: 'Deep Sedation', interpretation: 'No response to voice; movement to physical stimulation only' },
        { min: -3, max: -3, risk: 'Moderate Sedation', interpretation: 'Movement or eye opening to voice but no eye contact' },
        { min: -2, max: -1, risk: 'Light Sedation', interpretation: 'Briefly awakens or has sustained awakening to voice; typical ICU target range' },
        { min: 0, max: 0, risk: 'Alert & Calm', interpretation: 'Alert and calm; target state' },
        { min: 1, max: 1, risk: 'Restless', interpretation: 'Anxious but movements not aggressive or vigorous' },
        { min: 2, max: 3, risk: 'Agitated', interpretation: 'Frequent non-purposeful movement, fights ventilator, or pulls at tubes' },
        { min: 4, max: 4, risk: 'Combative', interpretation: 'Overtly combative, violent, immediate danger to staff' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — DAST-10
  {
    id: 'dast10',
    name: 'DAST-10',
    fullName: 'DAST-10 (Drug Abuse Screening Test)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Screens for drug use problems (excluding alcohol and tobacco) using a 10-item self-report questionnaire referring to the past 12 months.',
    applicableChiefComplaints: ['substance_abuse', 'drug_use', 'psychiatric_evaluation'],
    keywords: ['DAST-10', 'DAST10', 'drug abuse screening', 'substance use disorder', 'drug screening'],
    components: [
      { id: 'score', label: 'DAST-10 Total Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'No Problem', interpretation: 'No drug problems reported' },
        { min: 1, max: 2, risk: 'Low', interpretation: 'Low level; monitor' },
        { min: 3, max: 5, risk: 'Moderate', interpretation: 'Moderate level; further investigation needed' },
        { min: 6, max: 8, risk: 'Substantial', interpretation: 'Substantial level; intensive assessment' },
        { min: 9, max: 10, risk: 'Severe', interpretation: 'Severe level; intensive assessment and likely treatment needed' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — SAD PERSONS
  {
    id: 'sad_persons',
    name: 'SAD PERSONS',
    fullName: 'SAD PERSONS Scale',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Mnemonic-based suicide risk assessment tool for emergency settings using 10 dichotomous risk factor items.',
    applicableChiefComplaints: ['suicidal_ideation', 'suicide_attempt', 'psychiatric_emergency'],
    keywords: ['SAD PERSONS', 'suicide risk', 'suicide assessment', 'mnemonic', 'psychiatric emergency'],
    components: [
      { id: 'score', label: 'SAD PERSONS Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low', interpretation: 'May be safe for discharge with outpatient follow-up' },
        { min: 3, max: 4, risk: 'Moderate', interpretation: 'Close follow-up; consider hospitalization' },
        { min: 5, max: 6, risk: 'High', interpretation: 'Strongly consider hospitalization' },
        { min: 7, max: 10, risk: 'Very High', interpretation: 'Hospitalize or commit' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — MMSE
  {
    id: 'mmse',
    name: 'MMSE',
    fullName: 'MMSE (Mini-Mental State Examination)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Brief standardized assessment of cognitive function. Screens for dementia and delirium with a total score of 0–30.',
    applicableChiefComplaints: ['altered_mental_status', 'dementia', 'cognitive_impairment', 'delirium'],
    keywords: ['MMSE', 'Mini-Mental State Examination', 'cognitive screening', 'dementia', 'delirium', 'orientation', 'recall', 'Folstein'],
    components: [
      { id: 'score', label: 'MMSE Total Score', type: 'number_range', source: 'section1', min: 0, max: 30 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Severe', interpretation: 'Severe cognitive impairment' },
        { min: 10, max: 18, risk: 'Moderate', interpretation: 'Moderate cognitive impairment' },
        { min: 19, max: 23, risk: 'Mild', interpretation: 'Mild cognitive impairment' },
        { min: 24, max: 30, risk: 'Normal', interpretation: 'Normal (adjust for education level)' },
      ],
    },
  },

  // PSYCHIATRY & BEHAVIORAL HEALTH — MoCA
  {
    id: 'moca',
    name: 'MoCA',
    fullName: 'MoCA (Montreal Cognitive Assessment)',
    category: 'PSYCHIATRY & BEHAVIORAL HEALTH',
    application: 'Screens for mild cognitive impairment (MCI). More sensitive than MMSE for MCI and early dementia; add 1 point if ≤12 years of education.',
    applicableChiefComplaints: ['cognitive_impairment', 'dementia', 'altered_mental_status', 'memory_loss'],
    keywords: ['MoCA', 'Montreal Cognitive Assessment', 'mild cognitive impairment', 'MCI', 'dementia screening', 'executive function', 'Nasreddine'],
    components: [
      { id: 'score', label: 'MoCA Total Score', type: 'number_range', source: 'section1', min: 0, max: 30 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 9, risk: 'Severe', interpretation: 'Severe cognitive impairment' },
        { min: 10, max: 17, risk: 'Moderate', interpretation: 'Moderate cognitive impairment' },
        { min: 18, max: 25, risk: 'Mild', interpretation: 'Mild cognitive impairment' },
        { min: 26, max: 30, risk: 'Normal', interpretation: 'Normal cognitive function' },
      ],
    },
  },

// === NEPHROLOGY & ELECTROLYTES ===

  // NEPHROLOGY & ELECTROLYTES — KDIGO AKI Staging
  {
    id: 'kdigo_aki',
    name: 'KDIGO AKI',
    fullName: 'KDIGO AKI Staging',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Standardized staging of Acute Kidney Injury (AKI) severity to guide management based on serum creatinine rise relative to baseline and/or urine output criteria.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'renal_failure', 'elevated_creatinine'],
    keywords: ['KDIGO', 'AKI', 'acute kidney injury', 'creatinine', 'urine output', 'oliguria', 'RRT', 'renal replacement therapy', 'nephrology'],
    requiredTests: ['serum creatinine', 'urine output measurement'],
    components: [
      { id: 'stage', label: 'AKI Stage', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Stage 1', interpretation: 'Creatinine 1.5–1.9× baseline or ≥0.3 mg/dL rise; identify cause, avoid nephrotoxins, monitor closely' },
        { min: 2, max: 2, risk: 'Stage 2', interpretation: 'Creatinine 2.0–2.9× baseline; above measures plus consider nephrology consultation' },
        { min: 3, max: 3, risk: 'Stage 3', interpretation: 'Creatinine ≥3× baseline or ≥4.0 mg/dL or RRT initiation; nephrology consultation, evaluate RRT indications' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — CKD-EPI (2021)
  {
    id: 'ckd_epi',
    name: 'CKD-EPI',
    fullName: 'CKD-EPI Equation (2021 Race-Free)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Estimates GFR for classification of chronic kidney disease using the 2021 race-free creatinine equation based on serum creatinine, age, and sex.',
    applicableChiefComplaints: ['chronic_kidney_disease', 'renal_failure', 'elevated_creatinine', 'drug_dosing'],
    keywords: ['CKD-EPI', 'eGFR', 'GFR', 'chronic kidney disease', 'renal function', 'creatinine clearance', 'CKD staging', '2021'],
    requiredTests: ['serum creatinine'],
    components: [
      { id: 'egfr', label: 'eGFR (mL/min/1.73m²)', type: 'number_range', source: 'section1', min: 0, max: 200 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 14, risk: 'G5 - Kidney Failure', interpretation: 'eGFR <15: Kidney failure; dialysis or transplant evaluation' },
        { min: 15, max: 29, risk: 'G4 - Severely Decreased', interpretation: 'eGFR 15–29: Severely decreased; nephrology follow-up, dialysis preparation' },
        { min: 30, max: 44, risk: 'G3b - Moderately-Severely Decreased', interpretation: 'eGFR 30–44: Moderately to severely decreased' },
        { min: 45, max: 59, risk: 'G3a - Mildly-Moderately Decreased', interpretation: 'eGFR 45–59: Mildly to moderately decreased' },
        { min: 60, max: 89, risk: 'G2 - Mildly Decreased', interpretation: 'eGFR 60–89: Mildly decreased (CKD only if other markers present)' },
        { min: 90, max: 200, risk: 'G1 - Normal/High', interpretation: 'eGFR ≥90: Normal or high (CKD only if other markers of kidney damage present)' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Cockcroft-Gault
  {
    id: 'cockcroft_gault',
    name: 'Cockcroft-Gault',
    fullName: 'Cockcroft-Gault Equation',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Estimates creatinine clearance (CrCl) for drug dosing. Still widely used for medication dose adjustments when package inserts reference CrCl.',
    applicableChiefComplaints: ['drug_dosing', 'renal_dosing', 'chronic_kidney_disease'],
    keywords: ['Cockcroft-Gault', 'creatinine clearance', 'CrCl', 'drug dosing', 'renal dosing', 'medication adjustment'],
    requiredTests: ['serum creatinine', 'weight'],
    components: [
      { id: 'crcl', label: 'CrCl (mL/min)', type: 'number_range', source: 'section1', min: 0, max: 200 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 15, risk: 'Severe Impairment', interpretation: 'CrCl <15: Severe impairment; most renally-cleared drugs require significant dose reduction or avoidance' },
        { min: 16, max: 29, risk: 'Moderate-Severe', interpretation: 'CrCl 16–29: Moderate-severe impairment; substantial dose adjustment required' },
        { min: 30, max: 59, risk: 'Moderate', interpretation: 'CrCl 30–59: Moderate impairment; dose adjustment per drug-specific guidance' },
        { min: 60, max: 200, risk: 'Mild/Normal', interpretation: 'CrCl ≥60: Mild impairment or normal; standard dosing or minor adjustment per drug label' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — FENa
  {
    id: 'fena',
    name: 'FENa',
    fullName: 'Fractional Excretion of Sodium (FENa)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Differentiates prerenal azotemia from intrinsic renal injury (ATN) in oliguric AKI. Unreliable with diuretic use; use FEUrea instead in those cases.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
    keywords: ['FENa', 'fractional excretion of sodium', 'prerenal', 'ATN', 'acute tubular necrosis', 'AKI differentiation', 'urine sodium'],
    requiredTests: ['urine sodium', 'serum sodium', 'urine creatinine', 'serum creatinine'],
    components: [
      { id: 'fena_pct', label: 'FENa (%)', type: 'number_range', source: 'section1', min: 0, max: 20 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Prerenal', interpretation: 'FENa <1%: Prerenal azotemia; kidney retaining sodium appropriately' },
        { min: 1, max: 2, risk: 'Indeterminate', interpretation: 'FENa 1–2%: Indeterminate; clinical correlation required' },
        { min: 2, max: 20, risk: 'Intrinsic Renal', interpretation: 'FENa >2%: Intrinsic renal disease (ATN); tubular sodium wasting' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — FEUrea
  {
    id: 'feurea',
    name: 'FEUrea',
    fullName: 'Fractional Excretion of Urea (FEUrea)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Alternative to FENa when the patient is on diuretics. Urea handling is less affected by diuretics than sodium, making this the preferred test in diuretic-treated patients.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
    keywords: ['FEUrea', 'fractional excretion of urea', 'prerenal', 'ATN', 'diuretics', 'AKI differentiation'],
    requiredTests: ['urine urea', 'plasma urea', 'urine creatinine', 'serum creatinine'],
    components: [
      { id: 'feurea_pct', label: 'FEUrea (%)', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 35, risk: 'Prerenal', interpretation: 'FEUrea <35%: Prerenal azotemia' },
        { min: 35, max: 50, risk: 'Indeterminate', interpretation: 'FEUrea 35–50%: Indeterminate' },
        { min: 50, max: 100, risk: 'Intrinsic Renal', interpretation: 'FEUrea >50%: Intrinsic renal disease' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Anion Gap
  {
    id: 'anion_gap',
    name: 'Anion Gap',
    fullName: 'Anion Gap Calculation',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Essential for evaluating metabolic acidosis. Identifies unmeasured anions suggesting specific etiologies (DKA, lactic acidosis, toxins). Correct for hypoalbuminemia using the albumin-corrected AG formula.',
    applicableChiefComplaints: ['metabolic_acidosis', 'altered_mental_status', 'toxic_ingestion', 'dka', 'sepsis'],
    keywords: ['anion gap', 'AGMA', 'metabolic acidosis', 'MUDPILES', 'delta-delta', 'corrected anion gap', 'hypoalbuminemia', 'lactic acidosis', 'DKA'],
    requiredTests: ['serum sodium', 'serum chloride', 'serum bicarbonate', 'albumin'],
    components: [
      { id: 'anion_gap_value', label: 'Anion Gap (mEq/L)', type: 'number_range', source: 'section1', min: 0, max: 40 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 12, risk: 'Normal', interpretation: 'Normal AG: 8–12 mEq/L; non-anion gap metabolic acidosis if acidemic (HARDUP mnemonic)' },
        { min: 13, max: 40, risk: 'Elevated', interpretation: 'Elevated AG >12: AGMA; consider MUDPILES (Methanol, Uremia, DKA, Propylene glycol, Isoniazid/Iron, Lactic acidosis, Ethylene glycol, Salicylates)' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Osmolar Gap
  {
    id: 'osmolar_gap',
    name: 'Osmolar Gap',
    fullName: 'Osmolar Gap',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Detects unmeasured osmotically active substances, particularly toxic alcohols (methanol, ethylene glycol, isopropanol). A normal osmolar gap does NOT exclude toxic alcohol ingestion if metabolites have already formed.',
    applicableChiefComplaints: ['toxic_ingestion', 'altered_mental_status', 'methanol_ingestion', 'ethylene_glycol_ingestion', 'metabolic_acidosis'],
    keywords: ['osmolar gap', 'osmol gap', 'toxic alcohol', 'methanol', 'ethylene glycol', 'isopropanol', 'calculated osmolality', 'measured osmolality'],
    requiredTests: ['serum osmolality (measured)', 'serum sodium', 'glucose', 'BUN', 'ethanol level'],
    components: [
      { id: 'osmolar_gap_value', label: 'Osmolar Gap (mOsm/kg)', type: 'number_range', source: 'section1', min: -10, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: -10, max: 10, risk: 'Normal', interpretation: 'Osmolar gap <10: Normal; does not exclude toxic alcohol (may have already metabolized)' },
        { min: 11, max: 25, risk: 'Elevated', interpretation: 'Osmolar gap >10: Suggests unmeasured osmoles; consider toxic alcohol ingestion' },
        { min: 26, max: 100, risk: 'Highly Elevated', interpretation: 'Osmolar gap >25: Highly suggestive of toxic alcohol ingestion; treat empirically' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Calcium Correction for Albumin
  {
    id: 'calcium_correction',
    name: 'Calcium Correction',
    fullName: 'Calcium Correction for Albumin',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Corrects total serum calcium for hypoalbuminemia, since approximately 40% of calcium is protein-bound. Each 1 g/dL decrease in albumin below 4.0 causes total calcium to appear ~0.8 mg/dL lower than the true value.',
    applicableChiefComplaints: ['hypocalcemia', 'hypercalcemia', 'electrolyte_abnormality'],
    keywords: ['calcium correction', 'corrected calcium', 'albumin', 'hypocalcemia', 'hypercalcemia', 'ionized calcium', 'protein-bound calcium'],
    requiredTests: ['serum calcium', 'serum albumin'],
    components: [
      { id: 'corrected_ca', label: 'Corrected Calcium (mg/dL)', type: 'number_range', source: 'section1', min: 0, max: 20 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 8.4, risk: 'Hypocalcemia', interpretation: 'Corrected calcium <8.5 mg/dL: Hypocalcemia; evaluate and treat based on symptoms and severity' },
        { min: 8.5, max: 10.5, risk: 'Normal', interpretation: 'Corrected calcium 8.5–10.5 mg/dL: Normal range' },
        { min: 10.6, max: 20, risk: 'Hypercalcemia', interpretation: 'Corrected calcium >10.5 mg/dL: Hypercalcemia; evaluate etiology and treat' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Winter's Formula
  {
    id: 'winters_formula',
    name: "Winter's Formula",
    fullName: "Winter's Formula",
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: "Predicts expected PaCO₂ compensation for metabolic acidosis to identify concurrent respiratory acid-base disorders. Formula: Expected PaCO₂ = (1.5 × HCO₃⁻) + 8 ± 2.",
    applicableChiefComplaints: ['metabolic_acidosis', 'respiratory_failure', 'acid_base_disorder'],
    keywords: ["Winter's formula", 'metabolic acidosis', 'respiratory compensation', 'PaCO2', 'acid-base', 'bicarbonate', 'mixed disorder'],
    requiredTests: ['ABG', 'serum bicarbonate'],
    components: [
      { id: 'measured_paco2', label: 'Measured PaCO₂ (mmHg)', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 100, risk: 'Calculated', interpretation: 'Compare measured PaCO₂ to expected: within range = appropriate compensation; above range = concurrent respiratory acidosis; below range = concurrent respiratory alkalosis' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — TTKG
  {
    id: 'ttkg',
    name: 'TTKG',
    fullName: 'Transtubular Potassium Gradient (TTKG)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Assesses renal potassium handling to distinguish renal from extrarenal causes of hyperkalemia or hypokalemia. Requires urine osmolality > plasma osmolality and urine Na⁺ >25 mEq/L.',
    applicableChiefComplaints: ['hyperkalemia', 'hypokalemia', 'electrolyte_abnormality'],
    keywords: ['TTKG', 'transtubular potassium gradient', 'hyperkalemia', 'hypokalemia', 'aldosterone', 'renal potassium wasting'],
    requiredTests: ['urine potassium', 'serum potassium', 'urine osmolality', 'plasma osmolality', 'urine sodium'],
    components: [
      { id: 'ttkg_value', label: 'TTKG Value', type: 'number_range', source: 'section1', min: 0, max: 20 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 2, risk: 'Appropriate Conservation', interpretation: 'In hypokalemia: TTKG <2 = appropriate renal K⁺ conservation (extrarenal loss: GI, skin)' },
        { min: 3, max: 5, risk: 'Renal Wasting (Hypokalemia)', interpretation: 'In hypokalemia: TTKG >3 = renal potassium wasting (hyperaldosteronism, diuretics)' },
        { min: 6, max: 7, risk: 'Indeterminate (Hyperkalemia)', interpretation: 'In hyperkalemia: TTKG 6–8 is borderline; clinical correlation required' },
        { min: 8, max: 20, risk: 'Appropriate Excretion (Hyperkalemia)', interpretation: 'In hyperkalemia: TTKG >8 = appropriate renal K⁺ excretion (extrarenal cause: cell shift, dietary intake)' },
      ],
    },
  },

  // NEPHROLOGY & ELECTROLYTES — Schwartz Equation (Pediatric GFR)
  {
    id: 'schwartz_equation',
    name: 'Schwartz Equation',
    fullName: 'Schwartz Equation (Pediatric GFR)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application: 'Estimates GFR in children using serum creatinine and height. Use the 2009 bedside formula (0.413 constant) with enzymatic creatinine assays.',
    applicableChiefComplaints: ['pediatric_renal_failure', 'pediatric_chronic_kidney_disease', 'elevated_creatinine'],
    keywords: ['Schwartz', 'pediatric GFR', 'eGFR children', 'creatinine clearance pediatric', 'renal function pediatrics'],
    requiredTests: ['serum creatinine', 'height'],
    components: [
      { id: 'egfr', label: 'Estimated GFR (mL/min/1.73m²)', type: 'number_range', source: 'section1', min: 0, max: 200 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 14, risk: 'Kidney Failure', interpretation: 'eGFR <15: Kidney failure; dialysis evaluation' },
        { min: 15, max: 29, risk: 'Severely Decreased', interpretation: 'eGFR 15–29: Severely decreased renal function' },
        { min: 30, max: 59, risk: 'Moderately Decreased', interpretation: 'eGFR 30–59: Moderately decreased renal function' },
        { min: 60, max: 89, risk: 'Mildly Decreased', interpretation: 'eGFR 60–89: Mildly decreased; monitor for CKD progression' },
        { min: 90, max: 200, risk: 'Normal', interpretation: 'eGFR ≥90: Normal GFR for age' },
      ],
    },
  },

// === BURNS & WOUND MANAGEMENT ===

  // BURNS & WOUND MANAGEMENT — Rule of Nines
  {
    id: 'rule_of_nines',
    name: 'Rule of Nines',
    fullName: 'Rule of Nines (Wallace)',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Rapid estimation of total body surface area (TBSA) burned in adults. Used for initial fluid resuscitation calculations with the Parkland formula.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury'],
    keywords: ['rule of nines', 'Wallace', 'TBSA', 'total body surface area', 'burn estimation', 'Parkland', 'burn resuscitation', 'palm method'],
    components: [
      { id: 'tbsa_pct', label: 'TBSA Burned (%)', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 9, risk: 'Minor', interpretation: 'TBSA <10%: Minor burn; outpatient management may be appropriate' },
        { min: 10, max: 19, risk: 'Moderate', interpretation: 'TBSA 10–19%: Moderate burn; admission required, Parkland formula for fluid resuscitation' },
        { min: 20, max: 100, risk: 'Major', interpretation: 'TBSA ≥20%: Major burn; burn center referral, aggressive resuscitation per Parkland formula' },
      ],
    },
  },

  // BURNS & WOUND MANAGEMENT — Lund-Browder Chart
  {
    id: 'lund_browder',
    name: 'Lund-Browder',
    fullName: 'Lund-Browder Chart',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Most accurate method for TBSA burn estimation, accounting for age-related body proportion changes. Especially important in pediatrics where head and lower extremity proportions differ from adults.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'pediatric_burns', 'thermal_injury'],
    keywords: ['Lund-Browder', 'TBSA', 'burn estimation', 'pediatric burns', 'total body surface area', 'age-adjusted'],
    components: [
      { id: 'tbsa_pct', label: 'TBSA Burned (%)', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 100, risk: 'Calculated', interpretation: 'Use age-adjusted chart values to sum regional TBSA percentages; feeds into Parkland formula for fluid resuscitation' },
      ],
    },
  },

  // BURNS & WOUND MANAGEMENT — Parkland Formula
  {
    id: 'parkland_formula',
    name: 'Parkland Formula',
    fullName: 'Parkland Formula (Baxter Formula)',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Calculates IV fluid resuscitation volume for burn patients in the first 24 hours. Formula: 4 mL × weight (kg) × %TBSA. Give first half over first 8 hours from time of burn, second half over next 16 hours.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'burn_resuscitation'],
    keywords: ['Parkland formula', 'Baxter formula', 'burn resuscitation', 'fluid resuscitation', 'LR', 'lactated ringers', 'TBSA', 'burn fluid'],
    components: [
      { id: 'fluid_volume', label: 'Total 24-hr Fluid Volume (mL)', type: 'number_range', source: 'section1', min: 0, max: 50000 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 50000, risk: 'Calculated', interpretation: 'Titrate to urine output: 0.5–1.0 mL/kg/hr adults, 1.0–1.5 mL/kg/hr children; applies to partial/full thickness burns ≥20% TBSA adults or ≥10% TBSA children' },
      ],
    },
  },

  // BURNS & WOUND MANAGEMENT — SCORTEN
  {
    id: 'scorten',
    name: 'SCORTEN',
    fullName: 'SCORTEN (Toxic Epidermal Necrolysis Severity Score)',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Predicts mortality in Stevens-Johnson Syndrome (SJS) and Toxic Epidermal Necrolysis (TEN). Assessed within first 24 hours and reassessed at 72 hours.',
    applicableChiefComplaints: ['stevens_johnson_syndrome', 'toxic_epidermal_necrolysis', 'drug_reaction', 'skin_sloughing'],
    keywords: ['SCORTEN', 'SJS', 'TEN', 'Stevens-Johnson', 'toxic epidermal necrolysis', 'drug reaction', 'skin mortality'],
    requiredTests: ['BUN', 'serum bicarbonate', 'serum glucose', 'heart rate', 'BSA involvement assessment'],
    components: [
      { id: 'score', label: 'SCORTEN Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 1, risk: 'Low Mortality', interpretation: 'Score 0–1: Predicted mortality 3.2%' },
        { min: 2, max: 2, risk: 'Moderate Mortality', interpretation: 'Score 2: Predicted mortality 12.1%' },
        { min: 3, max: 3, risk: 'High Mortality', interpretation: 'Score 3: Predicted mortality 35.3%; consider burn center/ICU transfer' },
        { min: 4, max: 4, risk: 'Very High Mortality', interpretation: 'Score 4: Predicted mortality 58.3%' },
        { min: 5, max: 7, risk: 'Extreme Mortality', interpretation: 'Score ≥5: Predicted mortality ~90%' },
      ],
    },
  },

  // BURNS & WOUND MANAGEMENT — Baux Score
  {
    id: 'baux_score',
    name: 'Baux Score',
    fullName: 'Baux Score (Burn Mortality)',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Simple predictor of mortality in burn patients. Original: Age + %TBSA. Modified version adds 17 points for inhalation injury.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'inhalation_injury'],
    keywords: ['Baux score', 'burn mortality', 'modified Baux', 'inhalation injury', 'TBSA', 'burn prognosis'],
    components: [
      { id: 'score', label: 'Baux Score', type: 'number_range', source: 'section1', min: 0, max: 200 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 79, risk: 'Generally Survivable', interpretation: 'Score <80: Generally survivable with modern burn care' },
        { min: 80, max: 109, risk: 'Significant Risk', interpretation: 'Score 80–109: Significant mortality risk; aggressive management warranted' },
        { min: 110, max: 129, risk: 'Near LD50', interpretation: 'Score 110–120: LD50 in modern burn centers; serious prognosis discussion' },
        { min: 130, max: 200, risk: 'Near-Fatal', interpretation: 'Score >130 (modified) or >140 (original): Near-uniformly fatal; consider comfort care discussion' },
      ],
    },
  },

  // BURNS & WOUND MANAGEMENT — ABSI
  {
    id: 'absi',
    name: 'ABSI',
    fullName: 'Abbreviated Burn Severity Index (ABSI)',
    category: 'BURNS & WOUND MANAGEMENT',
    application: 'Multi-variable burn mortality prediction tool that is more accurate than the Baux score, incorporating sex, age, inhalation injury, full thickness burn, and TBSA.',
    applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'inhalation_injury'],
    keywords: ['ABSI', 'Abbreviated Burn Severity Index', 'burn mortality', 'burn prognosis', 'TBSA', 'inhalation injury'],
    components: [
      { id: 'score', label: 'ABSI Score', type: 'number_range', source: 'section1', min: 2, max: 18 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 2, max: 3, risk: 'Very Low', interpretation: 'Score 2–3: Very low threat to life; ≥99% survival probability' },
        { min: 4, max: 5, risk: 'Moderate', interpretation: 'Score 4–5: Moderate threat; ~98% survival' },
        { min: 6, max: 7, risk: 'Moderately Severe', interpretation: 'Score 6–7: Moderately severe threat; 80–90% survival' },
        { min: 8, max: 9, risk: 'Serious', interpretation: 'Score 8–9: Serious threat; 50–70% survival' },
        { min: 10, max: 11, risk: 'Severe', interpretation: 'Score 10–11: Severe threat; 20–40% survival' },
        { min: 12, max: 18, risk: 'Maximum', interpretation: 'Score ≥12: Maximum threat; <10% survival' },
      ],
    },
  },

// === ONCOLOGIC EMERGENCY ===

  // ONCOLOGIC EMERGENCY — Cairo-Bishop TLS Criteria
  {
    id: 'cairo_bishop_tls',
    name: 'Cairo-Bishop TLS',
    fullName: 'Cairo-Bishop Criteria — Tumor Lysis Syndrome (TLS)',
    category: 'ONCOLOGIC EMERGENCY',
    application: 'Defines laboratory and clinical TLS to guide prophylaxis and treatment intensity. Laboratory TLS requires ≥2 metabolic abnormalities within 3 days before or 7 days after cytotoxic therapy.',
    applicableChiefComplaints: ['tumor_lysis_syndrome', 'oncologic_emergency', 'hyperkalemia', 'hyperuricemia', 'renal_failure'],
    keywords: ['Cairo-Bishop', 'tumor lysis syndrome', 'TLS', 'hyperuricemia', 'hyperkalemia', 'hyperphosphatemia', 'hypocalcemia', 'rasburicase', 'allopurinol'],
    requiredTests: ['uric acid', 'potassium', 'phosphorus', 'calcium', 'creatinine', 'LDH'],
    components: [
      { id: 'lab_tls_criteria', label: 'Lab TLS Criteria Met (0–4)', type: 'number_range', source: 'section1', min: 0, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'No TLS', interpretation: '<2 metabolic criteria: Does not meet laboratory TLS definition' },
        { min: 2, max: 4, risk: 'Laboratory TLS', interpretation: '≥2 metabolic criteria: Laboratory TLS; assess for clinical TLS (creatinine rise, arrhythmia, seizure)' },
      ],
    },
  },

  // ONCOLOGIC EMERGENCY — PLASMIC Score (TTP)
  {
    id: 'plasmic_score',
    name: 'PLASMIC Score',
    fullName: 'PLASMIC Score (for TTP)',
    category: 'ONCOLOGIC EMERGENCY',
    application: 'Predicts likelihood of ADAMTS13 severe deficiency (thrombotic thrombocytopenic purpura) to guide empiric plasma exchange before ADAMTS13 results return.',
    applicableChiefComplaints: ['thrombocytopenia', 'microangiopathic_hemolytic_anemia', 'ttp', 'tma'],
    keywords: ['PLASMIC', 'TTP', 'thrombotic thrombocytopenic purpura', 'ADAMTS13', 'plasma exchange', 'TMA', 'thrombotic microangiopathy', 'MAHA'],
    requiredTests: ['platelet count', 'reticulocyte count', 'haptoglobin', 'bilirubin', 'MCV', 'INR', 'creatinine'],
    components: [
      { id: 'score', label: 'PLASMIC Score', type: 'number_range', source: 'section1', min: 0, max: 7 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, risk: 'Low Risk', interpretation: 'ADAMTS13 severely deficient in 0–4%; TTP unlikely; consider alternative diagnoses (HUS, DIC)' },
        { min: 5, max: 5, risk: 'Intermediate Risk', interpretation: 'ADAMTS13 severely deficient in ~24%; close monitoring and repeat assessment' },
        { min: 6, max: 7, risk: 'High Risk', interpretation: 'ADAMTS13 severely deficient in 62–82%; strongly consider initiating plasma exchange empirically' },
      ],
    },
  },

  // ONCOLOGIC EMERGENCY — ECOG Performance Status
  {
    id: 'ecog_performance',
    name: 'ECOG Performance Status',
    fullName: 'ECOG Performance Status',
    category: 'ONCOLOGIC EMERGENCY',
    application: 'Standardized assessment of cancer patient functional status used for treatment decisions and clinical trial eligibility. Correlates with survival across most cancer types.',
    applicableChiefComplaints: ['oncologic_emergency', 'cancer_related_weakness', 'functional_decline'],
    keywords: ['ECOG', 'performance status', 'functional status', 'cancer', 'oncology', 'clinical trial eligibility', 'Eastern Cooperative Oncology Group'],
    components: [
      { id: 'score', label: 'ECOG Score', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 1, risk: 'Good', interpretation: 'ECOG 0–1: Generally eligible for aggressive chemotherapy and clinical trials' },
        { min: 2, max: 2, risk: 'Moderate', interpretation: 'ECOG 2: May still benefit from treatment; case-by-case decision' },
        { min: 3, max: 4, risk: 'Poor', interpretation: 'ECOG 3–4: Limited benefit from most cytotoxic therapies; consider palliative care' },
        { min: 5, max: 5, risk: 'Deceased', interpretation: 'ECOG 5: Dead' },
      ],
    },
  },

  // ONCOLOGIC EMERGENCY — Karnofsky Performance Status (KPS)
  {
    id: 'karnofsky_ps',
    name: 'Karnofsky Performance Status',
    fullName: 'Karnofsky Performance Status (KPS)',
    category: 'ONCOLOGIC EMERGENCY',
    application: 'Numeric rating of functional status on 0–100 scale. More granular than ECOG. Widely used in neuro-oncology and palliative care.',
    applicableChiefComplaints: ['oncologic_emergency', 'cancer_related_weakness', 'functional_decline', 'palliative_care'],
    keywords: ['KPS', 'Karnofsky', 'performance status', 'cancer', 'functional status', 'neuro-oncology', 'palliative'],
    components: [
      { id: 'score', label: 'KPS Score', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 40, risk: 'Significant Disability', interpretation: 'KPS <50: Significant functional limitation; palliative care focus; KPS <40 in hospice median survival ~1–3 months' },
        { min: 50, max: 60, risk: 'Moderate Disability', interpretation: 'KPS 50–60: May need some assistance; consider treatment benefit vs. burden' },
        { min: 70, max: 100, risk: 'Independent', interpretation: 'KPS ≥70: Generally able to live independently' },
      ],
    },
  },

  // ONCOLOGIC EMERGENCY — SINS Score
  {
    id: 'sins_score',
    name: 'SINS Score',
    fullName: 'Spinal Instability Neoplastic Score (SINS)',
    category: 'ONCOLOGIC EMERGENCY',
    application: 'Assesses spinal instability from metastatic disease to determine need for surgical consultation. Incorporates location, pain, bone lesion type, alignment, collapse, and posterolateral involvement.',
    applicableChiefComplaints: ['back_pain', 'spinal_metastasis', 'oncologic_emergency', 'neurologic_deficit'],
    keywords: ['SINS', 'spinal instability', 'neoplastic', 'spinal metastasis', 'spine surgery', 'vertebral collapse', 'bone metastasis'],
    components: [
      { id: 'score', label: 'SINS Score', type: 'number_range', source: 'section1', min: 0, max: 18 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 6, risk: 'Stable', interpretation: 'Score 0–6: Stable; no surgical consultation needed' },
        { min: 7, max: 12, risk: 'Indeterminate', interpretation: 'Score 7–12: Indeterminate instability; surgical consultation recommended' },
        { min: 13, max: 18, risk: 'Unstable', interpretation: 'Score 13–18: Unstable; surgical consultation required urgently' },
      ],
    },
  },

// === CRITICAL CARE & ICU ===

  // CRITICAL CARE & ICU — CAM-ICU
  {
    id: 'cam_icu',
    name: 'CAM-ICU',
    fullName: 'CAM-ICU (Confusion Assessment Method for ICU)',
    category: 'CRITICAL CARE & ICU',
    application: 'Detects delirium in ICU patients, including those who are mechanically ventilated. Requires RASS −3 to +4; patients at −4 or −5 are too sedated to assess.',
    applicableChiefComplaints: ['icu_delirium', 'altered_mental_status', 'agitation', 'confusion'],
    keywords: ['CAM-ICU', 'delirium', 'ICU delirium', 'confusion assessment method', 'inattention', 'mechanically ventilated', 'RASS'],
    components: [
      { id: 'result', label: 'CAM-ICU Result', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Negative', interpretation: 'CAM-ICU negative: Does not meet criteria for delirium' },
        { min: 1, max: 1, risk: 'Positive', interpretation: 'CAM-ICU positive: Delirium present (Feature 1 + Feature 2 + Feature 3 or 4); sensitivity 93–100%, specificity 89–100%' },
      ],
    },
  },

  // CRITICAL CARE & ICU — SAPS II
  {
    id: 'saps2',
    name: 'SAPS II',
    fullName: 'SAPS II (Simplified Acute Physiology Score II)',
    category: 'CRITICAL CARE & ICU',
    application: 'Predicts ICU mortality using the worst values in the first 24 hours of ICU admission. An alternative to APACHE II using a logistic regression equation to convert total score to predicted mortality.',
    applicableChiefComplaints: ['icu_admission', 'critical_illness', 'sepsis', 'respiratory_failure'],
    keywords: ['SAPS II', 'SAPS 2', 'ICU mortality', 'critical care scoring', 'prognosis', 'acute physiology score'],
    requiredTests: ['ABG', 'serum urea', 'WBC', 'potassium', 'sodium', 'bicarbonate', 'bilirubin', 'GCS', 'urine output'],
    components: [
      { id: 'score', label: 'SAPS II Score', type: 'number_range', source: 'section1', min: 0, max: 163 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 29, risk: 'Low Mortality', interpretation: 'Score <30: Approximate ICU mortality <10%' },
        { min: 30, max: 39, risk: 'Low-Moderate', interpretation: 'Score 30–39: Approximate mortality 10–20%' },
        { min: 40, max: 49, risk: 'Moderate', interpretation: 'Score 40–49: Approximate mortality 20–40%' },
        { min: 50, max: 59, risk: 'High', interpretation: 'Score 50–59: Approximate mortality 40–50%' },
        { min: 60, max: 79, risk: 'Very High', interpretation: 'Score 60–79: Approximate mortality 50–75%' },
        { min: 80, max: 163, risk: 'Extreme', interpretation: 'Score ≥80: Approximate mortality >75%' },
      ],
    },
  },

// === DERMATOLOGY ===

  // DERMATOLOGY — ABCDE Rule (Melanoma)
  {
    id: 'abcde_melanoma',
    name: 'ABCDE Melanoma Rule',
    fullName: 'ABCDE Rule (Melanoma Screening)',
    category: 'DERMATOLOGY',
    application: 'Clinical criteria for identifying suspicious pigmented lesions that may be melanoma. Any single positive feature warrants referral for dermatoscopy or biopsy.',
    applicableChiefComplaints: ['skin_lesion', 'mole_change', 'pigmented_lesion', 'melanoma_screening'],
    keywords: ['ABCDE', 'melanoma', 'skin cancer', 'asymmetry', 'border', 'color', 'diameter', 'evolution', 'pigmented lesion', 'dermatology'],
    components: [
      { id: 'positive_features', label: 'Positive ABCDE Features', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Low Suspicion', interpretation: 'No ABCDE features; routine follow-up; maintain vigilance for ugly duckling sign' },
        { min: 1, max: 5, risk: 'Suspicious', interpretation: 'Any positive feature → referral for dermatoscopy or biopsy; sensitivity ~83%, specificity ~59% for melanoma' },
      ],
    },
  },

  // DERMATOLOGY — SCORAD
  {
    id: 'scorad',
    name: 'SCORAD',
    fullName: 'SCORAD (SCORing Atopic Dermatitis)',
    category: 'DERMATOLOGY',
    application: 'Measures severity of atopic dermatitis combining extent (% BSA), intensity (6 features), and subjective symptoms (pruritus and sleep disturbance). Formula: SCORAD = A/5 + 7B/2 + C.',
    applicableChiefComplaints: ['atopic_dermatitis', 'eczema', 'rash', 'pruritus'],
    keywords: ['SCORAD', 'atopic dermatitis', 'eczema severity', 'BSA', 'pruritus', 'lichenification', 'atopy'],
    components: [
      { id: 'score', label: 'SCORAD Score', type: 'number_range', source: 'section1', min: 0, max: 103 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 24, risk: 'Mild', interpretation: 'SCORAD <25: Mild atopic dermatitis' },
        { min: 25, max: 50, risk: 'Moderate', interpretation: 'SCORAD 25–50: Moderate atopic dermatitis; consider step-up therapy' },
        { min: 51, max: 103, risk: 'Severe', interpretation: 'SCORAD >50: Severe atopic dermatitis; systemic or biologic therapy consideration' },
      ],
    },
  },

  // DERMATOLOGY — PASI
  {
    id: 'pasi',
    name: 'PASI',
    fullName: 'PASI (Psoriasis Area and Severity Index)',
    category: 'DERMATOLOGY',
    application: 'Gold standard for measuring psoriasis severity combining area and intensity across 4 body regions. PASI ≥10 or BSA ≥10% typically qualifies for systemic or biologic therapy.',
    applicableChiefComplaints: ['psoriasis', 'plaque_psoriasis', 'skin_rash'],
    keywords: ['PASI', 'psoriasis', 'Psoriasis Area Severity Index', 'PASI 75', 'biologic therapy', 'psoriasis severity', 'erythema', 'induration', 'scaling'],
    components: [
      { id: 'score', label: 'PASI Score', type: 'number_range', source: 'section1', min: 0, max: 72 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Clear', interpretation: 'PASI 0: Clear skin' },
        { min: 1, max: 4, risk: 'Mild', interpretation: 'PASI <5: Mild psoriasis; topical therapy' },
        { min: 5, max: 10, risk: 'Moderate', interpretation: 'PASI 5–10: Moderate psoriasis; consider phototherapy or systemic therapy' },
        { min: 11, max: 20, risk: 'Severe', interpretation: 'PASI >10: Severe psoriasis; systemic or biologic therapy indicated' },
        { min: 21, max: 72, risk: 'Very Severe', interpretation: 'PASI >20: Very severe psoriasis; biologic therapy strongly indicated' },
      ],
    },
  },

// === ENT / OTOLARYNGOLOGY ===

  // ENT / OTOLARYNGOLOGY — STOP-BANG
  {
    id: 'stop_bang',
    name: 'STOP-BANG',
    fullName: 'STOP-BANG Questionnaire (Obstructive Sleep Apnea)',
    category: 'ENT / OTOLARYNGOLOGY',
    application: 'Screens for obstructive sleep apnea (OSA). Widely used preoperatively; score ≥3 has sensitivity 84–93% for moderate-severe OSA.',
    applicableChiefComplaints: ['sleep_apnea', 'snoring', 'daytime_sleepiness', 'preoperative_evaluation'],
    keywords: ['STOP-BANG', 'obstructive sleep apnea', 'OSA', 'snoring', 'sleep disordered breathing', 'preoperative', 'BMI', 'neck circumference'],
    components: [
      { id: 'score', label: 'STOP-BANG Score', type: 'number_range', source: 'section1', min: 0, max: 8 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 2, risk: 'Low Risk', interpretation: 'Low OSA risk; routine perioperative care' },
        { min: 3, max: 4, risk: 'Intermediate Risk', interpretation: 'Intermediate OSA risk; consider sleep study; perioperative monitoring recommended' },
        { min: 5, max: 8, risk: 'High Risk', interpretation: 'High OSA risk; sleep study recommended; enhanced perioperative monitoring' },
      ],
    },
  },

  // ENT / OTOLARYNGOLOGY — Epworth Sleepiness Scale (ESS)
  {
    id: 'epworth_sleepiness',
    name: 'Epworth Sleepiness Scale',
    fullName: 'Epworth Sleepiness Scale (ESS)',
    category: 'ENT / OTOLARYNGOLOGY',
    application: 'Measures daytime sleepiness using 8 situational questions rated 0–3. Used to screen for sleep disorders and monitor treatment response.',
    applicableChiefComplaints: ['daytime_sleepiness', 'sleep_disorder', 'fatigue', 'sleep_apnea'],
    keywords: ['Epworth', 'ESS', 'daytime sleepiness', 'sleep disorder', 'narcolepsy', 'sleep apnea', 'somnolence'],
    components: [
      { id: 'score', label: 'ESS Total Score', type: 'number_range', source: 'section1', min: 0, max: 24 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 5, risk: 'Lower Normal', interpretation: 'Lower normal daytime sleepiness' },
        { min: 6, max: 10, risk: 'Higher Normal', interpretation: 'Higher normal daytime sleepiness' },
        { min: 11, max: 12, risk: 'Mild Excessive', interpretation: 'Mild excessive daytime sleepiness; evaluate for sleep disorder' },
        { min: 13, max: 15, risk: 'Moderate Excessive', interpretation: 'Moderate excessive daytime sleepiness; sleep study indicated' },
        { min: 16, max: 24, risk: 'Severe Excessive', interpretation: 'Severe excessive daytime sleepiness; strongly suggests sleep disorder requiring evaluation' },
      ],
    },
  },

  // ENT / OTOLARYNGOLOGY — Lund-Mackay Score
  {
    id: 'lund_mackay',
    name: 'Lund-Mackay Score',
    fullName: 'Lund-Mackay Score (Sinus CT)',
    category: 'ENT / OTOLARYNGOLOGY',
    application: 'Standardized scoring of sinus CT opacification used to assess chronic rhinosinusitis severity. Scores each sinus bilaterally 0–2, with total bilateral score 0–24.',
    applicableChiefComplaints: ['sinusitis', 'chronic_rhinosinusitis', 'nasal_congestion', 'facial_pain'],
    keywords: ['Lund-Mackay', 'sinus CT', 'rhinosinusitis', 'chronic sinusitis', 'CT scoring', 'opacification', 'FESS', 'ostiomeatal complex'],
    requiredTests: ['CT sinuses'],
    components: [
      { id: 'score', label: 'Lund-Mackay Total Score', type: 'number_range', source: 'section1', min: 0, max: 24 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Normal', interpretation: 'Score 0: Normal; does not exclude chronic sinusitis (clinical diagnosis)' },
        { min: 1, max: 4, risk: 'Mild', interpretation: 'Score 1–4: Mild disease' },
        { min: 5, max: 12, risk: 'Moderate', interpretation: 'Score 5–12: Moderate disease' },
        { min: 13, max: 24, risk: 'Severe', interpretation: 'Score >12: Severe disease; may support surgical intervention if medical therapy fails' },
      ],
    },
  },

// === ORTHOPEDIC & MUSCULOSKELETAL ===

  // ORTHOPEDIC & MUSCULOSKELETAL — Beighton Hypermobility Score
  {
    id: 'beighton_score',
    name: 'Beighton Score',
    fullName: 'Beighton Hypermobility Score',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application: 'Screens for generalized joint hypermobility used in evaluation of hypermobility spectrum disorders and Ehlers-Danlos syndrome (hypermobile type). Positive Beighton alone does not diagnose hEDS.',
    applicableChiefComplaints: ['joint_hypermobility', 'joint_pain', 'connective_tissue_disorder', 'ehlers_danlos'],
    keywords: ['Beighton', 'joint hypermobility', 'hEDS', 'Ehlers-Danlos', 'hypermobility spectrum', 'generalized joint hypermobility', 'GJH'],
    components: [
      { id: 'score', label: 'Beighton Score', type: 'number_range', source: 'section1', min: 0, max: 9 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3, risk: 'Not Hypermobile', interpretation: 'Score <4 (adults): Does not meet criteria for generalized joint hypermobility' },
        { min: 4, max: 5, risk: 'Hypermobile (Adult Threshold)', interpretation: 'Score ≥4 adults / ≥5 children: Generalized joint hypermobility; requires additional hEDS criteria for diagnosis' },
        { min: 6, max: 9, risk: 'Strongly Hypermobile', interpretation: 'Score ≥6: Strong evidence of generalized hypermobility; evaluate for EDS and hypermobility spectrum disorder' },
      ],
    },
  },

  // ORTHOPEDIC & MUSCULOSKELETAL — Salter-Harris Classification
  {
    id: 'salter_harris',
    name: 'Salter-Harris',
    fullName: 'Salter-Harris Classification (Pediatric Fractures)',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application: 'Classifies physeal (growth plate) fractures in children to guide management and predict growth disturbance risk. Type II is the most common (~75% of all Salter-Harris fractures).',
    applicableChiefComplaints: ['pediatric_fracture', 'growth_plate_injury', 'extremity_injury', 'trauma'],
    keywords: ['Salter-Harris', 'growth plate', 'physis', 'epiphysis', 'physeal fracture', 'pediatric fracture', 'SALTR', 'avascular necrosis'],
    requiredTests: ['plain radiographs'],
    components: [
      { id: 'type', label: 'Salter-Harris Type', type: 'number_range', source: 'section1', min: 1, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 2, risk: 'Low Growth Disturbance Risk', interpretation: 'Type I–II: Good prognosis; closed reduction usually adequate; low risk of growth arrest' },
        { min: 3, max: 4, risk: 'Moderate-High Growth Disturbance Risk', interpretation: 'Type III–IV: Anatomic reduction required (often surgical); higher risk of growth arrest' },
        { min: 5, max: 5, risk: 'Highest Growth Disturbance Risk', interpretation: 'Type V: Crush injury to physis; often diagnosed retrospectively; worst prognosis for growth arrest' },
      ],
    },
  },

  // ORTHOPEDIC & MUSCULOSKELETAL — Weber Classification (Ankle)
  {
    id: 'weber_ankle',
    name: 'Weber Classification',
    fullName: 'Weber Classification (Ankle Fractures)',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application: 'Classifies lateral malleolus fractures by location relative to the syndesmosis to determine stability and need for surgical fixation.',
    applicableChiefComplaints: ['ankle_fracture', 'ankle_injury', 'ankle_pain', 'trauma'],
    keywords: ['Weber', 'ankle fracture', 'fibula fracture', 'syndesmosis', 'lateral malleolus', 'infrasyndesmotic', 'transsyndesmotic', 'suprasyndesmotic'],
    requiredTests: ['plain radiographs (ankle AP, lateral, mortise)'],
    components: [
      { id: 'type', label: 'Weber Type (A/B/C)', type: 'number_range', source: 'section1', min: 1, max: 3 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 1, risk: 'Weber A - Stable', interpretation: 'Below syndesmosis; tibiofibular ligaments intact; typically non-operative (walking boot or cast)' },
        { min: 2, max: 2, risk: 'Weber B - Potentially Unstable', interpretation: 'At level of syndesmosis; may be disrupted; stress test to determine stability; fixation if unstable' },
        { min: 3, max: 3, risk: 'Weber C - Unstable', interpretation: 'Above syndesmosis; obligatory syndesmotic disruption; almost always requires operative fixation' },
      ],
    },
  },

  // ORTHOPEDIC & MUSCULOSKELETAL — Garden Classification (Hip)
  {
    id: 'garden_hip',
    name: 'Garden Classification',
    fullName: 'Garden Classification (Hip Fractures)',
    category: 'ORTHOPEDIC & MUSCULOSKELETAL',
    application: 'Classifies femoral neck fractures by displacement to guide surgical management (internal fixation vs. arthroplasty). Garden III–IV carry high risk of avascular necrosis.',
    applicableChiefComplaints: ['hip_fracture', 'hip_pain', 'fall_injury', 'trauma'],
    keywords: ['Garden', 'femoral neck fracture', 'hip fracture', 'avascular necrosis', 'AVN', 'hemiarthroplasty', 'total hip arthroplasty', 'intracapsular fracture'],
    requiredTests: ['plain radiographs (hip AP and lateral)'],
    components: [
      { id: 'grade', label: 'Garden Grade', type: 'number_range', source: 'section1', min: 1, max: 4 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 1, max: 2, risk: 'Non-Displaced', interpretation: 'Garden I–II: Non-displaced; lower AVN risk; internal fixation with cannulated screws preferred' },
        { min: 3, max: 4, risk: 'Displaced', interpretation: 'Garden III–IV: Displaced; high AVN risk (20–35%); arthroplasty (hemiarthroplasty vs THA based on age/activity)' },
      ],
    },
  },

// === RHEUMATOLOGY ===

  // RHEUMATOLOGY — ACR/EULAR 2010 RA Classification Criteria
  {
    id: 'acr_eular_ra',
    name: 'ACR/EULAR RA Criteria',
    fullName: 'ACR/EULAR 2010 Rheumatoid Arthritis Classification Criteria',
    category: 'RHEUMATOLOGY',
    application: 'Classifies definite RA in patients with at least 1 joint with synovitis not better explained by another disease. Score ≥6/10 defines definite RA.',
    applicableChiefComplaints: ['joint_swelling', 'polyarthritis', 'rheumatoid_arthritis', 'inflammatory_arthritis'],
    keywords: ['ACR', 'EULAR', 'rheumatoid arthritis', 'RA classification', 'RF', 'anti-CCP', 'synovitis', 'DMARD', '2010 criteria'],
    requiredTests: ['RF', 'anti-CCP', 'CRP', 'ESR', 'joint examination'],
    components: [
      { id: 'score', label: 'ACR/EULAR RA Score', type: 'number_range', source: 'section1', min: 0, max: 10 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 5, risk: 'Not Classifiable', interpretation: 'Score <6: Not classifiable as RA at this time; monitor and reassess' },
        { min: 6, max: 10, risk: 'Definite RA', interpretation: 'Score ≥6: Definite RA; initiate disease-modifying therapy (DMARD)' },
      ],
    },
  },

  // RHEUMATOLOGY — Jones Criteria (Acute Rheumatic Fever)
  {
    id: 'jones_criteria',
    name: 'Jones Criteria',
    fullName: 'Jones Criteria (Acute Rheumatic Fever)',
    category: 'RHEUMATOLOGY',
    application: 'Diagnoses initial attack of acute rheumatic fever (ARF) following Group A streptococcal pharyngitis. Requires evidence of preceding GAS infection plus major/minor criteria.',
    applicableChiefComplaints: ['joint_pain', 'fever', 'carditis', 'chorea', 'rheumatic_fever'],
    keywords: ['Jones criteria', 'acute rheumatic fever', 'ARF', 'Group A strep', 'carditis', 'chorea', 'Sydenham', 'erythema marginatum', 'ASO', 'anti-DNase B'],
    requiredTests: ['throat culture', 'rapid strep test', 'ASO titer', 'anti-DNase B', 'ESR', 'CRP', 'ECG', 'echo'],
    components: [
      { id: 'major_criteria', label: 'Major Criteria Count', type: 'number_range', source: 'section1', min: 0, max: 5 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'Not Met', interpretation: 'Criteria not met for ARF diagnosis' },
        { min: 1, max: 5, risk: 'Meets Criteria', interpretation: 'Initial ARF: 2 major OR 1 major + 2 minor criteria with evidence of GAS infection; chorea alone is sufficient if other causes excluded' },
      ],
    },
  },

  // RHEUMATOLOGY — Anaphylaxis Diagnostic Criteria (WAO/ACAAI)
  {
    id: 'anaphylaxis_criteria',
    name: 'Anaphylaxis Criteria',
    fullName: 'Anaphylaxis Diagnostic Criteria (WAO/ACAAI)',
    category: 'RHEUMATOLOGY',
    application: 'Clinical criteria for diagnosing anaphylaxis. Anaphylaxis is highly likely when any of the 3 criteria are met; immediate epinephrine administration is indicated.',
    applicableChiefComplaints: ['anaphylaxis', 'allergic_reaction', 'urticaria', 'angioedema', 'hypotension'],
    keywords: ['anaphylaxis', 'WAO', 'ACAAI', 'epinephrine', 'allergic reaction', 'urticaria', 'angioedema', 'biphasic', 'allergen exposure'],
    components: [
      { id: 'criteria_met', label: 'Anaphylaxis Criterion Met', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        { min: 0, max: 0, risk: 'Not Anaphylaxis', interpretation: 'No criterion met; consider alternative diagnosis' },
        { min: 1, max: 1, risk: 'Anaphylaxis', interpretation: 'Any criterion met: diagnose anaphylaxis; administer epinephrine IM immediately; observe minimum 4–6 hours for biphasic reaction' },
      ],
    },
  },

// === GERIATRICS & DELIRIUM ===

  // GERIATRICS & DELIRIUM — 4AT
  {
    id: '4at',
    name: '4AT',
    fullName: '4AT (Rapid Clinical Test for Delirium)',
    category: 'GERIATRICS & DELIRIUM',
    application: 'Rapid (<2 minutes) bedside delirium screening tool that does not require special training to administer. Assesses alertness, orientation, attention, and acute change.',
    applicableChiefComplaints: ['delirium', 'altered_mental_status', 'confusion', 'cognitive_impairment'],
    keywords: ['4AT', 'delirium screening', 'rapid delirium', 'AMT4', 'alertness', 'attention', 'months backward', 'acute confusion'],
    components: [
      { id: 'score', label: '4AT Score', type: 'number_range', source: 'section1', min: 0, max: 12 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 0, risk: 'Unlikely', interpretation: 'Score 0: Delirium or severe cognitive impairment unlikely' },
        { min: 1, max: 3, risk: 'Possible Cognitive Impairment', interpretation: 'Score 1–3: Possible cognitive impairment; further assessment needed' },
        { min: 4, max: 12, risk: 'Possible Delirium', interpretation: 'Score ≥4: Possible delirium (± cognitive impairment); sensitivity ~89%, specificity ~88%; full clinical assessment required' },
      ],
    },
  },

  // GERIATRICS & DELIRIUM — CAM (Non-ICU)
  {
    id: 'cam_non_icu',
    name: 'CAM',
    fullName: 'Confusion Assessment Method (CAM) — Non-ICU',
    category: 'GERIATRICS & DELIRIUM',
    application: 'Standard tool for delirium detection in non-ICU hospitalized patients. Sensitivity 94–100%, specificity 90–95% when used by trained assessors.',
    applicableChiefComplaints: ['delirium', 'altered_mental_status', 'confusion', 'cognitive_impairment'],
    keywords: ['CAM', 'Confusion Assessment Method', 'delirium', 'inattention', 'disorganized thinking', 'altered consciousness', 'Inouye'],
    components: [
      { id: 'result', label: 'CAM Result', type: 'boolean', source: 'section1' },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'No Delirium', interpretation: 'CAM negative: Does not meet criteria for delirium' },
        { min: 1, max: 1, risk: 'Delirium', interpretation: 'CAM positive (Feature 1 + Feature 2 + Feature 3 or 4): Delirium present; identify and treat underlying cause' },
      ],
    },
  },

  // GERIATRICS & DELIRIUM — Braden Scale
  {
    id: 'braden_scale',
    name: 'Braden Scale',
    fullName: 'Braden Scale (Pressure Injury Risk)',
    category: 'GERIATRICS & DELIRIUM',
    application: 'Predicts risk of pressure injury (pressure ulcer) development in hospitalized and long-term care patients using 6 subscales. Lower scores indicate higher risk.',
    applicableChiefComplaints: ['pressure_injury', 'immobility', 'wound_prevention', 'long_term_care'],
    keywords: ['Braden', 'pressure ulcer', 'pressure injury', 'decubitus', 'sensory perception', 'moisture', 'mobility', 'nutrition', 'friction shear'],
    components: [
      { id: 'score', label: 'Braden Score', type: 'number_range', source: 'section1', min: 6, max: 23 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 6, max: 9, risk: 'Very High Risk', interpretation: 'Score ≤9: Very high risk; aggressive pressure injury prevention protocol' },
        { min: 10, max: 12, risk: 'High Risk', interpretation: 'Score 10–12: High risk; implement pressure injury prevention protocol' },
        { min: 13, max: 14, risk: 'Moderate Risk', interpretation: 'Score 13–14: Moderate risk; prevention measures indicated' },
        { min: 15, max: 18, risk: 'Mild Risk', interpretation: 'Score 15–18: Mild risk; standard prevention; reassess regularly' },
        { min: 19, max: 23, risk: 'Low Risk', interpretation: 'Score 19–23: No or minimal risk; routine care' },
      ],
    },
  },

  // GERIATRICS & DELIRIUM — Morse Fall Scale
  {
    id: 'morse_fall_scale',
    name: 'Morse Fall Scale',
    fullName: 'Morse Fall Scale',
    category: 'GERIATRICS & DELIRIUM',
    application: 'Identifies hospitalized patients at risk for falls using 6 items in a quick bedside assessment. Score ≥45 indicates high fall risk requiring enhanced prevention protocol.',
    applicableChiefComplaints: ['fall_risk', 'falls', 'gait_instability', 'hospitalized_patient'],
    keywords: ['Morse Fall Scale', 'fall risk', 'fall prevention', 'gait', 'ambulatory aid', 'history of falls', 'mental status'],
    components: [
      { id: 'score', label: 'Morse Fall Scale Score', type: 'number_range', source: 'section1', min: 0, max: 125 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 24, risk: 'Low Risk', interpretation: 'Score 0–24: Low fall risk; standard fall prevention measures' },
        { min: 25, max: 44, risk: 'Moderate Risk', interpretation: 'Score 25–44: Moderate fall risk; implement fall prevention interventions' },
        { min: 45, max: 125, risk: 'High Risk', interpretation: 'Score ≥45: High fall risk; implement high-risk fall prevention protocol' },
      ],
    },
  },

// === SPORTS MEDICINE & CONCUSSION ===

  // SPORTS MEDICINE & CONCUSSION — SCAT6
  {
    id: 'scat6',
    name: 'SCAT6',
    fullName: 'SCAT6 (Sport Concussion Assessment Tool, 6th Edition)',
    category: 'SPORTS MEDICINE & CONCUSSION',
    application: 'Standardized sideline and office assessment tool for evaluating sport-related concussion (SRC) in athletes ≥13 years. Not a pass/fail test — establishes a clinical profile. Any positive red flag warrants immediate Emergency Department evaluation.',
    applicableChiefComplaints: ['concussion', 'head_injury', 'sports_injury', 'traumatic_brain_injury'],
    keywords: ['SCAT6', 'sport concussion', 'concussion assessment', 'SRC', 'Maddocks questions', 'return to sport', 'sideline assessment', 'BESS', 'balance', 'cognitive screening'],
    components: [
      { id: 'symptom_number', label: 'Symptom Number (0–22)', type: 'number_range', source: 'section1', min: 0, max: 22 },
      { id: 'symptom_severity', label: 'Symptom Severity (0–132)', type: 'number_range', source: 'section1', min: 0, max: 132 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 0, risk: 'No Symptoms', interpretation: 'No symptoms; symptom-free does not equal recovered — full return-to-play protocol still required' },
        { min: 1, max: 22, risk: 'Symptomatic', interpretation: 'Symptoms present; manage per graded 6-step return-to-sport protocol with minimum 6 days (24 hours per step if asymptomatic); any red flag → ED immediately' },
      ],
    },
  },

// === PALLIATIVE CARE & PROGNOSIS ===

  // PALLIATIVE CARE & PROGNOSIS — Palliative Prognostic Index (PPI)
  {
    id: 'ppi',
    name: 'PPI',
    fullName: 'Palliative Prognostic Index (PPI)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application: 'Predicts survival in terminally ill cancer patients using entirely clinical variables (no laboratory data required). PPI >6 predicts survival <3 weeks and is a strong consideration for hospice referral.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'hospice_referral', 'goals_of_care'],
    keywords: ['PPI', 'Palliative Prognostic Index', 'survival prediction', 'terminal cancer', 'hospice', 'palliative performance scale', 'dyspnea', 'delirium', 'edema'],
    components: [
      { id: 'score', label: 'PPI Score', type: 'number_range', source: 'section1', min: 0, max: 15 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 3.9, risk: 'Longer Survival', interpretation: 'PPI <4.0: Predicted survival >6 weeks (sensitivity 79%, specificity 77%)' },
        { min: 4, max: 6, risk: 'Intermediate', interpretation: 'PPI 4.0–6.0: Predicted survival 3–6 weeks' },
        { min: 6.1, max: 15, risk: 'Short Survival', interpretation: 'PPI >6.0: Predicted survival <3 weeks (sensitivity 83%, specificity 85%); strong consideration for hospice referral' },
      ],
    },
  },

  // PALLIATIVE CARE & PROGNOSIS — Palliative Performance Scale (PPS)
  {
    id: 'pps',
    name: 'PPS',
    fullName: 'Palliative Performance Scale (PPS)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application: 'Measures functional status in palliative care patients on a 0–100% scale across ambulation, activity, self-care, intake, and conscious level. Component of PPI; decline ≥30% over 1–2 months suggests weeks prognosis.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'functional_decline', 'palliative_care'],
    keywords: ['PPS', 'Palliative Performance Scale', 'functional status', 'end of life', 'palliative', 'hospice', 'ambulation', 'self-care', 'intake'],
    components: [
      { id: 'pps_pct', label: 'PPS (%)', type: 'number_range', source: 'section1', min: 0, max: 100 },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        { min: 0, max: 30, risk: 'Nearing End of Life', interpretation: 'PPS 10–30%: Nearing end of life; hospice appropriate' },
        { min: 40, max: 60, risk: 'Significant Decline', interpretation: 'PPS 40–60%: Significant functional decline; transition conversations appropriate' },
        { min: 70, max: 100, risk: 'Relatively Preserved', interpretation: 'PPS 70–100%: Relatively preserved function; may continue disease-directed therapy' },
      ],
    },
  },

  // PALLIATIVE CARE & PROGNOSIS — PaP Score
  {
    id: 'pap_score',
    name: 'PaP Score',
    fullName: 'PaP Score (Palliative Prognostic Score)',
    category: 'PALLIATIVE CARE & PROGNOSIS',
    application: 'Predicts 30-day survival in terminally ill cancer patients using clinical and laboratory variables including dyspnea, anorexia, KPS, clinical prediction of survival, WBC, and lymphocyte percentage.',
    applicableChiefComplaints: ['terminal_illness', 'cancer', 'end_of_life', 'goals_of_care', 'prognosis'],
    keywords: ['PaP score', 'Palliative Prognostic Score', '30-day survival', 'terminal cancer', 'prognosis', 'hospice', 'dyspnea', 'anorexia', 'lymphocyte'],
    requiredTests: ['WBC with differential', 'clinical prediction of survival'],
    components: [
      { id: 'score', label: 'PaP Score', type: 'number_range', source: 'section1', min: 0, max: 17.5 },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 5.5, risk: 'Group A', interpretation: 'PaP 0–5.5 (Group A): >70% probability of 30-day survival' },
        { min: 5.6, max: 11, risk: 'Group B', interpretation: 'PaP 5.6–11.0 (Group B): 30–70% probability of 30-day survival' },
        { min: 11.1, max: 17.5, risk: 'Group C', interpretation: 'PaP 11.1–17.5 (Group C): <30% probability of 30-day survival; hospice referral strongly indicated' },
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// Seed Firestore
// ---------------------------------------------------------------------------

async function seed() {
  const skipEmbeddings = process.argv.includes('--skip-embeddings')

  console.log(`Seeding ${cdrs.length} CDR definitions to cdrLibrary collection...`)
  if (skipEmbeddings) {
    console.log('⏭️  Skipping embedding generation (--skip-embeddings)')
  }

  // Generate embeddings (unless skipped)
  let embeddings: number[][] = []
  if (!skipEmbeddings) {
    console.log('Generating embeddings for all CDRs...')
    const texts = cdrs.map(buildEmbeddingText)
    embeddings = await generateEmbeddings(texts, 'RETRIEVAL_DOCUMENT')
    console.log(`✅ Generated ${embeddings.length} embeddings.`)
  }

  // Firestore batch limit is 500; 216 fits in one batch
  const batch = db.batch()

  for (let i = 0; i < cdrs.length; i++) {
    const cdr = cdrs[i]
    const docRef = db.collection('cdrLibrary').doc(cdr.id)
    const docData: Record<string, unknown> = { ...cdr }

    if (!skipEmbeddings && embeddings[i]) {
      docData.embedding = admin.firestore.FieldValue.vector(embeddings[i])
    }

    batch.set(docRef, docData)
  }

  await batch.commit()
  console.log(`✅ Successfully seeded ${cdrs.length} CDR definitions.`)

  // Print summary
  const byMethod: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  for (const cdr of cdrs) {
    byMethod[cdr.scoring.method] = (byMethod[cdr.scoring.method] || 0) + 1
    byCategory[cdr.category] = (byCategory[cdr.category] || 0) + 1
  }
  console.log('Scoring methods:', byMethod)
  console.log('Categories:', byCategory)
  console.log('CDR IDs:', cdrs.map(c => c.id).join(', '))
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
