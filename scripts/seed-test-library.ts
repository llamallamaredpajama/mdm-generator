/**
 * Seed Test Library
 * Populates the `testLibrary` Firestore collection with the canonical ER test catalog.
 *
 * Usage: cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-test-library.ts
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 *
 * Idempotent: Uses deterministic doc IDs (test.id), so re-running overwrites identically.
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

type TestCategory = 'labs' | 'imaging' | 'procedures_poc'

interface TestSeed {
  id: string
  name: string
  category: TestCategory
  subcategory: string
  commonIndications: string[]
  unit: string | null
  normalRange: string | null
  quickFindings: string[] | null
  feedsCdrs: string[]
}

// ---------------------------------------------------------------------------
// Complete Test Catalog (~76 tests)
// ---------------------------------------------------------------------------

const tests: TestSeed[] = [
  // ===== LABS =====
  { id: 'cbc', name: 'CBC', category: 'labs', subcategory: 'hematology', commonIndications: ['anemia', 'infection', 'bleeding'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'bmp', name: 'BMP', category: 'labs', subcategory: 'chemistry', commonIndications: ['electrolytes', 'renal function', 'glucose'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'cmp', name: 'CMP', category: 'labs', subcategory: 'chemistry', commonIndications: ['liver function', 'electrolytes', 'renal function'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'mag', name: 'Magnesium', category: 'labs', subcategory: 'chemistry', commonIndications: ['electrolyte abnormality', 'seizure', 'arrhythmia'], unit: 'mEq/L', normalRange: '1.7-2.2', quickFindings: null, feedsCdrs: [] },
  { id: 'phos', name: 'Phosphorus', category: 'labs', subcategory: 'chemistry', commonIndications: ['electrolyte abnormality', 'renal disease'], unit: 'mg/dL', normalRange: '2.5-4.5', quickFindings: null, feedsCdrs: [] },
  { id: 'lfts', name: 'LFTs', category: 'labs', subcategory: 'hepatic', commonIndications: ['liver disease', 'abdominal pain', 'jaundice'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'lipase', name: 'Lipase', category: 'labs', subcategory: 'hepatic', commonIndications: ['pancreatitis', 'abdominal pain'], unit: 'U/L', normalRange: '0-160', quickFindings: null, feedsCdrs: [] },
  { id: 'amylase', name: 'Amylase', category: 'labs', subcategory: 'hepatic', commonIndications: ['pancreatitis', 'abdominal pain'], unit: 'U/L', normalRange: '30-110', quickFindings: null, feedsCdrs: [] },
  { id: 'coags_inr', name: 'Coags/INR', category: 'labs', subcategory: 'hematology', commonIndications: ['bleeding', 'anticoagulation', 'liver disease'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: ['wells_dvt'] },
  { id: 'troponin', name: 'Troponin', category: 'labs', subcategory: 'cardiac', commonIndications: ['chest pain', 'ACS', 'myocardial injury'], unit: 'ng/mL', normalRange: '<0.04', quickFindings: null, feedsCdrs: ['heart'] },
  { id: 'bnp', name: 'BNP/proBNP', category: 'labs', subcategory: 'cardiac', commonIndications: ['dyspnea', 'CHF', 'volume overload'], unit: 'pg/mL', normalRange: '<100', quickFindings: null, feedsCdrs: ['heart'] },
  { id: 'd_dimer', name: 'D-dimer', category: 'labs', subcategory: 'hematology', commonIndications: ['PE', 'DVT', 'DIC'], unit: 'ng/mL FEU', normalRange: '<500', quickFindings: null, feedsCdrs: ['wells_pe', 'wells_dvt'] },
  { id: 'lactate', name: 'Lactate', category: 'labs', subcategory: 'chemistry', commonIndications: ['sepsis', 'shock', 'tissue hypoperfusion'], unit: 'mmol/L', normalRange: '0.5-2.0', quickFindings: null, feedsCdrs: ['sepsis'] },
  { id: 'ua', name: 'Urinalysis', category: 'labs', subcategory: 'genitourinary', commonIndications: ['UTI', 'hematuria', 'renal disease'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'ucg', name: 'UCG (Urine Pregnancy)', category: 'labs', subcategory: 'genitourinary', commonIndications: ['pregnancy', 'abdominal pain', 'vaginal bleeding'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'blood_cx', name: 'Blood Cultures', category: 'labs', subcategory: 'infectious', commonIndications: ['sepsis', 'fever', 'bacteremia'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: ['sepsis'] },
  { id: 'type_screen', name: 'Type & Screen', category: 'labs', subcategory: 'hematology', commonIndications: ['transfusion', 'bleeding', 'surgical prep'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'vbg_abg', name: 'VBG/ABG', category: 'labs', subcategory: 'chemistry', commonIndications: ['respiratory distress', 'acid-base', 'metabolic'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'esr_crp', name: 'ESR/CRP', category: 'labs', subcategory: 'inflammatory', commonIndications: ['inflammation', 'infection', 'autoimmune'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'tsh', name: 'TSH', category: 'labs', subcategory: 'endocrine', commonIndications: ['thyroid disease', 'fatigue', 'weight change'], unit: 'mIU/L', normalRange: '0.4-4.0', quickFindings: null, feedsCdrs: [] },
  { id: 'ldh', name: 'LDH', category: 'labs', subcategory: 'chemistry', commonIndications: ['hemolysis', 'tissue damage', 'malignancy'], unit: 'U/L', normalRange: '140-280', quickFindings: null, feedsCdrs: [] },
  { id: 'fibrinogen', name: 'Fibrinogen', category: 'labs', subcategory: 'hematology', commonIndications: ['DIC', 'bleeding', 'coagulopathy'], unit: 'mg/dL', normalRange: '200-400', quickFindings: null, feedsCdrs: [] },
  { id: 'haptoglobin', name: 'Haptoglobin', category: 'labs', subcategory: 'hematology', commonIndications: ['hemolysis', 'anemia'], unit: 'mg/dL', normalRange: '30-200', quickFindings: null, feedsCdrs: [] },
  { id: 'retic_ct', name: 'Reticulocyte Count', category: 'labs', subcategory: 'hematology', commonIndications: ['anemia', 'bone marrow response'], unit: '%', normalRange: '0.5-2.5', quickFindings: null, feedsCdrs: [] },
  { id: 'ammonia', name: 'Ammonia', category: 'labs', subcategory: 'chemistry', commonIndications: ['hepatic encephalopathy', 'altered mental status'], unit: 'umol/L', normalRange: '15-45', quickFindings: null, feedsCdrs: [] },
  { id: 'ethanol', name: 'Ethanol Level', category: 'labs', subcategory: 'toxicology', commonIndications: ['intoxication', 'altered mental status'], unit: 'mg/dL', normalRange: '0', quickFindings: null, feedsCdrs: [] },
  { id: 'salicylate', name: 'Salicylate Level', category: 'labs', subcategory: 'toxicology', commonIndications: ['overdose', 'tinnitus', 'metabolic acidosis'], unit: 'mg/dL', normalRange: '<30', quickFindings: null, feedsCdrs: [] },
  { id: 'apap', name: 'Acetaminophen Level', category: 'labs', subcategory: 'toxicology', commonIndications: ['overdose', 'liver injury'], unit: 'ug/mL', normalRange: '<20', quickFindings: null, feedsCdrs: ['rumack_matthew'] },
  { id: 'urine_tox', name: 'Urine Tox Screen', category: 'labs', subcategory: 'toxicology', commonIndications: ['overdose', 'altered mental status', 'drug screening'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'uds', name: 'Urine Drug Screen', category: 'labs', subcategory: 'toxicology', commonIndications: ['overdose', 'altered mental status', 'drug screening'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'osmolality', name: 'Osmolality', category: 'labs', subcategory: 'chemistry', commonIndications: ['hyponatremia', 'toxic ingestion', 'osmolar gap'], unit: 'mOsm/kg', normalRange: '275-295', quickFindings: null, feedsCdrs: [] },
  { id: 'procalcitonin', name: 'Procalcitonin', category: 'labs', subcategory: 'infectious', commonIndications: ['sepsis', 'infection differentiation', 'antibiotic stewardship'], unit: 'ng/mL', normalRange: '<0.1', quickFindings: null, feedsCdrs: [] },
  { id: 'ck_cpk', name: 'CK/CPK', category: 'labs', subcategory: 'chemistry', commonIndications: ['rhabdomyolysis', 'muscle injury', 'cardiac'], unit: 'U/L', normalRange: '22-198', quickFindings: null, feedsCdrs: [] },
  { id: 'hcg_quant', name: 'Quantitative beta-HCG', category: 'labs', subcategory: 'genitourinary', commonIndications: ['ectopic pregnancy', 'pregnancy quantification', 'vaginal bleeding'], unit: 'mIU/mL', normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'urine_cx', name: 'Urine Culture', category: 'labs', subcategory: 'infectious', commonIndications: ['UTI confirmation', 'recurrent UTI', 'pyelonephritis'], unit: null, normalRange: null, quickFindings: ['No growth', 'Growth >100k CFU', 'Mixed flora'], feedsCdrs: [] },
  { id: 'stool_studies', name: 'Stool Studies', category: 'labs', subcategory: 'infectious', commonIndications: ['C. diff', 'diarrhea', 'O&P', 'infectious colitis'], unit: null, normalRange: null, quickFindings: ['C. diff positive', 'C. diff negative', 'O&P positive'], feedsCdrs: [] },
  { id: 'blood_type_crossmatch', name: 'Type & Crossmatch', category: 'labs', subcategory: 'hematology', commonIndications: ['massive transfusion', 'surgical prep', 'GI bleed'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },

  // ===== IMAGING =====
  { id: 'ct_head', name: 'CT Head', category: 'imaging', subcategory: 'head_neck', commonIndications: ['headache', 'trauma', 'altered mental status', 'stroke'], unit: null, normalRange: null, quickFindings: ['Normal', 'Bleed', 'Mass', 'Edema', 'Midline shift'], feedsCdrs: ['canadian_ct_head'] },
  { id: 'ct_cspine', name: 'CT C-spine', category: 'imaging', subcategory: 'spine', commonIndications: ['trauma', 'neck pain', 'neurologic deficit'], unit: null, normalRange: null, quickFindings: ['Normal', 'Fracture', 'Subluxation', 'Degenerative'], feedsCdrs: ['nexus', 'canadian_cspine'] },
  { id: 'ct_chest', name: 'CT Chest', category: 'imaging', subcategory: 'chest', commonIndications: ['chest pain', 'dyspnea', 'trauma'], unit: null, normalRange: null, quickFindings: ['Normal', 'Consolidation', 'Effusion', 'Mass', 'Fracture'], feedsCdrs: [] },
  { id: 'cta_chest', name: 'CTA Chest', category: 'imaging', subcategory: 'chest', commonIndications: ['PE', 'aortic dissection', 'chest pain'], unit: null, normalRange: null, quickFindings: ['Normal', 'PE', 'Aortic dissection', 'Aneurysm'], feedsCdrs: ['wells_pe', 'perc'] },
  { id: 'ct_abd_pelv', name: 'CT Abdomen/Pelvis', category: 'imaging', subcategory: 'abdomen', commonIndications: ['abdominal pain', 'appendicitis', 'obstruction'], unit: null, normalRange: null, quickFindings: ['Normal', 'Appendicitis', 'Obstruction', 'Free fluid', 'Mass'], feedsCdrs: [] },
  { id: 'cta_head', name: 'CTA Head/Neck', category: 'imaging', subcategory: 'head_neck', commonIndications: ['stroke', 'vessel occlusion', 'dissection'], unit: null, normalRange: null, quickFindings: ['Normal', 'Occlusion', 'Stenosis', 'Aneurysm', 'Dissection'], feedsCdrs: [] },
  { id: 'xr_chest', name: 'Chest X-ray (CXR)', category: 'imaging', subcategory: 'chest', commonIndications: ['dyspnea', 'cough', 'chest pain', 'fever'], unit: null, normalRange: null, quickFindings: ['Normal', 'Infiltrate', 'Effusion', 'Pneumothorax', 'Cardiomegaly'], feedsCdrs: [] },
  { id: 'xr_ext', name: 'X-ray Extremity', category: 'imaging', subcategory: 'extremity', commonIndications: ['injury', 'pain', 'deformity'], unit: null, normalRange: null, quickFindings: ['Normal', 'Fracture', 'Dislocation', 'Soft tissue swelling'], feedsCdrs: ['ottawa_ankle', 'ottawa_knee'] },
  { id: 'xr_spine', name: 'X-ray Spine', category: 'imaging', subcategory: 'spine', commonIndications: ['back pain', 'trauma', 'compression fracture'], unit: null, normalRange: null, quickFindings: ['Normal', 'Fracture', 'Compression', 'Degenerative'], feedsCdrs: [] },
  { id: 'us_fast', name: 'US FAST', category: 'imaging', subcategory: 'abdomen', commonIndications: ['trauma', 'hypotension', 'abdominal pain'], unit: null, normalRange: null, quickFindings: ['Negative', 'Positive - free fluid', 'Positive - pericardial'], feedsCdrs: [] },
  { id: 'us_ruq', name: 'US RUQ (Gallbladder)', category: 'imaging', subcategory: 'abdomen', commonIndications: ['RUQ pain', 'cholecystitis', 'biliary disease'], unit: null, normalRange: null, quickFindings: ['Normal', 'Cholelithiasis', 'Cholecystitis', 'CBD dilation'], feedsCdrs: [] },
  { id: 'us_aorta', name: 'US Aorta', category: 'imaging', subcategory: 'abdomen', commonIndications: ['abdominal pain', 'AAA screening', 'hypotension'], unit: null, normalRange: null, quickFindings: ['Normal', 'AAA', 'Dissection flap'], feedsCdrs: [] },
  { id: 'us_soft_tissue', name: 'US Soft Tissue', category: 'imaging', subcategory: 'soft_tissue', commonIndications: ['abscess', 'cellulitis', 'foreign body'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abscess', 'Cellulitis', 'Foreign body'], feedsCdrs: [] },
  { id: 'us_ob', name: 'US OB (Obstetric)', category: 'imaging', subcategory: 'obstetric', commonIndications: ['pregnancy', 'vaginal bleeding', 'abdominal pain'], unit: null, normalRange: null, quickFindings: ['IUP confirmed', 'No IUP', 'Ectopic', 'Free fluid'], feedsCdrs: [] },
  { id: 'us_renal', name: 'US Renal', category: 'imaging', subcategory: 'genitourinary', commonIndications: ['flank pain', 'renal colic', 'hematuria'], unit: null, normalRange: null, quickFindings: ['Normal', 'Hydronephrosis', 'Stone', 'Mass'], feedsCdrs: [] },
  { id: 'echo_tte', name: 'Echo TTE', category: 'imaging', subcategory: 'cardiac', commonIndications: ['dyspnea', 'chest pain', 'murmur', 'CHF'], unit: null, normalRange: null, quickFindings: ['Normal EF', 'Reduced EF', 'Wall motion abnormality', 'Pericardial effusion', 'Valve abnormality'], feedsCdrs: ['heart'] },
  { id: 'mri_brain', name: 'MRI Brain', category: 'imaging', subcategory: 'head_neck', commonIndications: ['stroke', 'seizure', 'mass'], unit: null, normalRange: null, quickFindings: ['Normal', 'Infarct', 'Mass', 'Hemorrhage'], feedsCdrs: [] },
  { id: 'fluoro', name: 'Fluoroscopy', category: 'imaging', subcategory: 'misc', commonIndications: ['reduction', 'foreign body', 'swallow study'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'us_le_venous', name: 'LE Venous Duplex (DVT)', category: 'imaging', subcategory: 'vascular', commonIndications: ['DVT', 'leg swelling', 'unilateral edema'], unit: null, normalRange: null, quickFindings: ['Normal', 'DVT present', 'Superficial thrombosis'], feedsCdrs: ['wells_dvt'] },
  { id: 'us_pelvic', name: 'Pelvic Ultrasound', category: 'imaging', subcategory: 'obstetric', commonIndications: ['ectopic pregnancy', 'ovarian torsion', 'pelvic pain', 'vaginal bleeding'], unit: null, normalRange: null, quickFindings: ['Normal', 'Free fluid', 'Ovarian mass', 'Ectopic'], feedsCdrs: [] },
  { id: 'cta_abd', name: 'CTA Abdomen/Pelvis', category: 'imaging', subcategory: 'abdomen', commonIndications: ['mesenteric ischemia', 'AAA', 'GI bleed', 'vascular emergency'], unit: null, normalRange: null, quickFindings: ['Normal', 'Mesenteric occlusion', 'AAA', 'Active extravasation'], feedsCdrs: [] },
  { id: 'xr_pelvis', name: 'X-ray Pelvis', category: 'imaging', subcategory: 'extremity', commonIndications: ['hip fracture', 'pelvic trauma', 'hip pain'], unit: null, normalRange: null, quickFindings: ['Normal', 'Fracture', 'Dislocation', 'Degenerative'], feedsCdrs: [] },
  { id: 'ct_face', name: 'CT Facial Bones', category: 'imaging', subcategory: 'head_neck', commonIndications: ['facial trauma', 'orbital fracture', 'midface fracture'], unit: null, normalRange: null, quickFindings: ['Normal', 'Orbital fracture', 'Nasal fracture', 'Le Fort fracture'], feedsCdrs: [] },
  { id: 'xr_abd', name: 'X-ray Abdomen (KUB)', category: 'imaging', subcategory: 'abdomen', commonIndications: ['obstruction', 'foreign body', 'constipation', 'kidney stone'], unit: null, normalRange: null, quickFindings: ['Normal', 'Obstruction', 'Free air', 'Calcification'], feedsCdrs: [] },

  // ===== PROCEDURES/POC =====
  { id: 'ecg_12lead', name: 'ECG (12-lead)', category: 'procedures_poc', subcategory: 'cardiac', commonIndications: ['chest pain', 'palpitations', 'syncope', 'dyspnea'], unit: null, normalRange: null, quickFindings: ['Normal sinus', 'ST elevation', 'ST depression', 'Afib', 'SVT', 'VT', 'BBB', 'STEMI equivalent'], feedsCdrs: ['heart', 'sgarbossa'] },
  { id: 'ecg_repeat', name: 'Repeat ECG', category: 'procedures_poc', subcategory: 'cardiac', commonIndications: ['interval change', 'chest pain', 'serial monitoring'], unit: null, normalRange: null, quickFindings: ['Unchanged', 'New ST changes', 'Resolution', 'Interval change'], feedsCdrs: ['heart'] },
  { id: 'lp', name: 'Lumbar Puncture', category: 'procedures_poc', subcategory: 'neurologic', commonIndications: ['meningitis', 'SAH', 'headache'], unit: null, normalRange: null, quickFindings: ['Normal', 'Elevated WBC', 'Elevated protein', 'Xanthochromia', 'Elevated opening pressure'], feedsCdrs: [] },
  { id: 'paracentesis', name: 'Paracentesis', category: 'procedures_poc', subcategory: 'abdominal', commonIndications: ['ascites', 'SBP', 'abdominal distension'], unit: null, normalRange: null, quickFindings: ['Transudative', 'Exudative', 'SBP (elevated PMNs)', 'Bloody'], feedsCdrs: [] },
  { id: 'thoracentesis', name: 'Thoracentesis', category: 'procedures_poc', subcategory: 'pulmonary', commonIndications: ['pleural effusion', 'dyspnea', 'empyema'], unit: null, normalRange: null, quickFindings: ['Transudative', 'Exudative', 'Empyema', 'Bloody'], feedsCdrs: [] },
  { id: 'incision_drainage', name: 'Incision & Drainage', category: 'procedures_poc', subcategory: 'wound', commonIndications: ['abscess', 'wound infection'], unit: null, normalRange: null, quickFindings: ['Simple abscess', 'Complex abscess', 'Wound packing'], feedsCdrs: [] },
  { id: 'bedside_us', name: 'Bedside Ultrasound', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['procedural guidance', 'rapid assessment'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'splint_cast', name: 'Splint/Cast', category: 'procedures_poc', subcategory: 'orthopedic', commonIndications: ['fracture', 'sprain', 'immobilization'], unit: null, normalRange: null, quickFindings: ['Splint applied', 'Cast applied', 'Reduction performed'], feedsCdrs: [] },
  { id: 'istat', name: 'iSTAT (POC Blood Gas)', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['acid-base', 'electrolytes', 'respiratory'], unit: null, normalRange: null, quickFindings: null, feedsCdrs: [] },
  { id: 'rapid_strep', name: 'Rapid Strep', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['sore throat', 'pharyngitis'], unit: null, normalRange: null, quickFindings: ['Positive', 'Negative'], feedsCdrs: ['centor_mcisaac'] },
  { id: 'rapid_flu', name: 'Rapid Influenza', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['fever', 'myalgia', 'respiratory illness'], unit: null, normalRange: null, quickFindings: ['Positive Flu A', 'Positive Flu B', 'Negative'], feedsCdrs: [] },
  { id: 'covid_rapid', name: 'COVID Rapid Test', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['respiratory illness', 'fever', 'exposure'], unit: null, normalRange: null, quickFindings: ['Positive', 'Negative'], feedsCdrs: [] },
  { id: 'poc_glucose', name: 'POC Glucose', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['altered mental status', 'diabetes', 'DKA', 'hypoglycemia'], unit: 'mg/dL', normalRange: '70-140', quickFindings: ['Normal', 'Hypoglycemia', 'Hyperglycemia', 'Critical high'], feedsCdrs: [] },
  { id: 'joint_aspiration', name: 'Arthrocentesis', category: 'procedures_poc', subcategory: 'orthopedic', commonIndications: ['septic joint', 'gout', 'effusion', 'joint pain'], unit: null, normalRange: null, quickFindings: ['Clear', 'Turbid/purulent', 'Bloody', 'Crystal positive'], feedsCdrs: [] },
  { id: 'rsv_rapid', name: 'RSV Rapid Test', category: 'procedures_poc', subcategory: 'point_of_care', commonIndications: ['respiratory illness', 'pediatric', 'bronchiolitis', 'wheezing'], unit: null, normalRange: null, quickFindings: ['Positive', 'Negative'], feedsCdrs: [] },
]

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function seedTestLibrary(): Promise<void> {
  console.log(`Seeding ${tests.length} tests into testLibrary collection...`)

  const BATCH_SIZE = 500
  let written = 0

  for (let i = 0; i < tests.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = tests.slice(i, i + BATCH_SIZE)

    for (const test of chunk) {
      const docRef = db.collection('testLibrary').doc(test.id)
      batch.set(docRef, test)
    }

    await batch.commit()
    written += chunk.length
    console.log(`Progress: ${written}/${tests.length}`)
  }

  console.log(`Done! Seeded ${written} tests into testLibrary collection.`)
}

seedTestLibrary().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
