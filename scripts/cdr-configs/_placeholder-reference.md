# CDR Configuration Reference

Extracted from `/scripts/seed-cdr-library.ts` — 70 CDR object definitions organized by batch.

---

## Batch 1 (Cardio): heart_pathway, timi_ua_nstemi, edacs, revised_geneva, pesi, spesi, grace_score, sgarbossa, has_bled, add_rs

```typescript
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
```

---

## Batch 2 (Trauma): canadian_ct_head, nexus_head_ct, catch_rule, pecarn_abdominal, ottawa_foot, pittsburgh_knee, shock_index, abc_score, denver_bcvi, nexus_bcvi

```typescript
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
```

---

## Batch 3 (Pulm/GI): psi_port, ottawa_copd, smart_cop, berlin_ards, glasgow_blatchford, aims65, rockall, alvarado, air_score, bisap

```typescript
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
```

---

## Batch 4 (Neuro): nihss, race_scale, ottawa_sah, abcd2, canadian_tia, hints_exam, hunt_hess, modified_fisher, ich_score, four_score

```typescript
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
```

---

## Batch 5 (ID/Tox): sofa, sirs, mascc, lrinec, ciwa_ar, rumack_matthew, bwps, ada_dka_severity, four_ts, anion_gap

```typescript
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
```

---

## Batch 6 (Crit/Peds): apache_ii, news2, gcs, cam_icu, westley_croup, gorelick_dehydration, pews, rochester_criteria, step_by_step_febrile_infant, lemon

```typescript
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
```

---

## Batch 7 (Misc): cssrs_screening, phq9, cage, cows, stop_bang, rule_of_nines, parkland_formula, bishop_score, apgar, 4at

```typescript
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
```
