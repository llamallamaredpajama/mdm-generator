# Orders Card UI Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Orders Card for visual clarity: consistent headers, visible dropdown states, proper checkbox colors, imaging reorganized by modality, and expanded MRI/Fluoroscopy/Nuclear Medicine catalogs.

**Architecture:** Pure frontend changes — CSS styling updates, component restructuring for split title bars, and seed data expansion. No backend changes needed. SubcategoryGroup gets multi-column support.

**Tech Stack:** React 19, CSS (BEM), TypeScript, Vitest/RTL

**Design Doc:** `docs/plans/2026-03-01-orders-card-ui-cleanup-design.md`

---

## Task 1: Update subcategoryUtils with modality-based imaging subcategories

**Files:**
- Modify: `frontend/src/components/build-mode/shared/subcategoryUtils.ts`

**Step 1: Update SUBCATEGORY_DISPLAY with new imaging modality labels**

Replace the old body-region imaging subcategories with modality-based ones. Keep lab/procedure subcategories untouched.

```typescript
const SUBCATEGORY_DISPLAY: Record<string, string> = {
  // Labs (unchanged)
  hematology: 'Hematology',
  chemistry: 'Chemistry',
  cardiac: 'Cardiac',
  genitourinary: 'Genitourinary',
  infectious: 'Infectious',
  inflammatory: 'Inflammatory',
  endocrine: 'Endocrine',
  hepatic: 'Hepatic',
  toxicology: 'Toxicology',
  neurologic: 'Neurologic',
  gastrointestinal: 'Gastrointestinal',
  rheumatologic: 'Rheumatologic',
  obstetric: 'Obstetric',
  pulmonary: 'Pulmonary',
  // Imaging — modality-based
  xray: 'X-ray',
  ct: 'CT',
  ultrasound: 'Ultrasound',
  mri: 'MRI',
  fluoroscopy: 'Fluoroscopy',
  nuclear_medicine: 'Nuclear Medicine',
  // MRI sub-sections
  mri_brain_head: 'Brain / Head',
  mri_neck_vascular: 'Neck / Vascular',
  mri_spine: 'Spine',
  mri_chest: 'Chest',
  mri_cardiac: 'Cardiac',
  mri_abdomen_pelvis: 'Abdomen / Pelvis',
  mri_extremity_msk: 'Extremity / MSK',
  mri_pediatric: 'Pediatric',
  mri_special_protocols: 'Special Protocols',
  // Procedures (unchanged)
  abdominal: 'Abdominal',
  wound: 'Wound',
  point_of_care: 'Point of Care',
  orthopedic: 'Orthopedic',
  airway: 'Airway',
}
```

**Step 2: Add IMAGING_SUBCATEGORY_ORDER constant**

Add after `CATEGORY_LABELS`:

```typescript
/** Display order for imaging modality subcategories */
export const IMAGING_SUBCATEGORY_ORDER = [
  'xray', 'ct', 'ultrasound', 'mri', 'fluoroscopy', 'nuclear_medicine',
] as const
```

**Step 3: Run typecheck**

Run: `cd frontend && pnpm typecheck`
Expected: PASS (no type errors — these are just string records)

**Step 4: Commit**

```bash
git add frontend/src/components/build-mode/shared/subcategoryUtils.ts
git commit -m "refactor(orders): update subcategoryUtils with modality-based imaging subcategories"
```

---

## Task 2: Expand seed-test-library.ts with new imaging studies

**Files:**
- Modify: `scripts/seed-test-library.ts`

**Step 1: Reclassify existing imaging tests**

Change subcategories on existing tests to match new modality scheme. Key changes:
- All `head_neck` CT/CTA tests → `ct` subcategory
- All X-ray tests → `xray` subcategory
- All US tests → `ultrasound` subcategory
- `vq_scan` → `nuclear_medicine` subcategory
- `esophagram`, `upper_gi_sbft` → `fluoroscopy` subcategory
- `fluoro` (generic) → remove entirely
- `mri_brain`, `mri_spine`, `mri_extremity` → remove (replaced by specific entries)
- Keep `echo_tte` → `ultrasound`
- `us_ivc` → `ultrasound`

For each existing imaging test, update the `subcategory` field to one of: `xray`, `ct`, `ultrasound`, `mri`, `fluoroscopy`, `nuclear_medicine`.

**Step 2: Add Nuclear Medicine tests** (5 new entries)

```typescript
// Nuclear Medicine
{ id: 'myocardial_perfusion_imaging', name: 'Myocardial Perfusion Imaging (MPI)', category: 'imaging', subcategory: 'nuclear_medicine', commonIndications: ['chest pain', 'ACS evaluation', 'stress test', 'ischemia evaluation'], unit: null, normalRange: null, quickFindings: ['Normal perfusion', 'Reversible defect (ischemia)', 'Fixed defect (infarct)', 'Mixed defect'], feedsCdrs: ['heart'] },
{ id: 'hida_scan', name: 'HIDA Scan (Cholescintigraphy)', category: 'imaging', subcategory: 'nuclear_medicine', commonIndications: ['acute cholecystitis', 'biliary dyskinesia', 'bile leak', 'biliary atresia'], unit: null, normalRange: null, quickFindings: ['Normal gallbladder visualization', 'Non-visualization (acute cholecystitis)', 'Low ejection fraction', 'Bile leak'], feedsCdrs: [] },
{ id: 'bone_scan', name: 'Bone Scan (Tc-99m MDP)', category: 'imaging', subcategory: 'nuclear_medicine', commonIndications: ['occult fracture', 'metastatic disease', 'osteomyelitis', 'stress fracture'], unit: null, normalRange: null, quickFindings: ['Normal', 'Focal uptake', 'Multiple foci (metastatic)', 'Linear uptake (fracture)'], feedsCdrs: [] },
{ id: 'gi_bleeding_scan', name: 'GI Bleeding Scan (Tagged RBC)', category: 'imaging', subcategory: 'nuclear_medicine', commonIndications: ['GI hemorrhage', 'occult GI bleed', 'lower GI bleed localization'], unit: null, normalRange: null, quickFindings: ['No active bleeding', 'Active extravasation localized', 'Intermittent bleeding'], feedsCdrs: [] },
{ id: 'meckels_scan', name: "Meckel's Scan (Tc-99m Pertechnetate)", category: 'imaging', subcategory: 'nuclear_medicine', commonIndications: ['pediatric GI bleeding', 'ectopic gastric mucosa', 'Meckel diverticulum'], unit: null, normalRange: null, quickFindings: ['Normal', 'Ectopic gastric mucosa present'], feedsCdrs: [] },
```

**Step 3: Add Fluoroscopy tests** (8 new entries)

```typescript
// Fluoroscopy
{ id: 'air_contrast_enema', name: 'Air/Contrast Enema (Intussusception)', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['intussusception', 'pediatric abdominal pain', 'currant jelly stool'], unit: null, normalRange: null, quickFindings: ['Successful reduction', 'Failed reduction', 'No intussusception'], feedsCdrs: [] },
{ id: 'upper_gi_malrotation', name: 'Upper GI (Malrotation/Volvulus)', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['bilious vomiting in neonate', 'malrotation', 'midgut volvulus'], unit: null, normalRange: null, quickFindings: ['Normal rotation', 'Malrotation', 'Volvulus'], feedsCdrs: [] },
{ id: 'upper_gi_series_esophagram', name: 'Upper GI Series / Esophagram', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['esophageal perforation', 'foreign body', 'obstruction', 'dysphagia'], unit: null, normalRange: null, quickFindings: ['Normal', 'Perforation/leak', 'Obstruction', 'Foreign body'], feedsCdrs: [] },
{ id: 'contrast_enema', name: 'Contrast Enema', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['large bowel obstruction', 'sigmoid volvulus', 'intussusception'], unit: null, normalRange: null, quickFindings: ['Normal', 'Obstruction', 'Volvulus', 'Successful reduction'], feedsCdrs: [] },
{ id: 'retrograde_urethrogram', name: 'Retrograde Urethrogram (RUG)', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['urethral injury', 'blood at meatus', 'pelvic fracture', 'high-riding prostate'], unit: null, normalRange: null, quickFindings: ['Normal urethra', 'Urethral disruption', 'Partial tear'], feedsCdrs: [] },
{ id: 'retrograde_cystogram', name: 'Retrograde Cystogram', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['bladder rupture', 'pelvic fracture', 'gross hematuria'], unit: null, normalRange: null, quickFindings: ['Normal', 'Intraperitoneal rupture', 'Extraperitoneal rupture'], feedsCdrs: [] },
{ id: 'angiography_embolization', name: 'Angiography/Embolization', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['GI bleeding', 'pelvic fracture hemorrhage', 'massive hemoptysis', 'massive epistaxis'], unit: null, normalRange: null, quickFindings: ['Active bleeding localized', 'Successful embolization', 'No active bleeding'], feedsCdrs: [] },
{ id: 'ivc_filter_placement', name: 'IVC Filter Placement', category: 'imaging', subcategory: 'fluoroscopy', commonIndications: ['PE with anticoagulation contraindicated', 'DVT with anticoagulation contraindicated', 'recurrent PE on anticoagulation'], unit: null, normalRange: null, quickFindings: ['Successful placement', 'Filter deployed'], feedsCdrs: ['wells_pe'] },
```

**Step 4: Add MRI tests** (~37 new entries)

Add all MRI entries with `subcategory: 'mri'` and a `mriSection` metadata field for sub-grouping. Since the `TestDefinition` type doesn't have a `mriSection` field, we'll use a naming convention approach — the `subcategoryUtils` will handle sub-grouping by parsing the test name prefix or we'll add a secondary grouping field.

**Approach:** Use the existing `subcategory` field with compound values for MRI sub-sections: `mri_brain_head`, `mri_neck_vascular`, `mri_spine`, `mri_chest`, `mri_cardiac`, `mri_abdomen_pelvis`, `mri_extremity_msk`, `mri_pediatric`, `mri_special_protocols`. These are already registered in `SUBCATEGORY_DISPLAY` from Task 1.

```typescript
// MRI — Brain/Head
{ id: 'mri_brain_without_contrast', name: 'MRI Brain without contrast', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['acute stroke', 'intracranial hemorrhage', 'posterior fossa pathology'], unit: null, normalRange: null, quickFindings: ['Normal', 'Acute infarct (DWI)', 'Hemorrhage', 'Mass'], feedsCdrs: [] },
{ id: 'mri_brain_with_contrast', name: 'MRI Brain with contrast', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['abscess', 'meningitis', 'encephalitis', 'tumor', 'leptomeningeal disease'], unit: null, normalRange: null, quickFindings: ['Normal', 'Ring-enhancing lesion', 'Leptomeningeal enhancement', 'Mass with enhancement'], feedsCdrs: [] },
{ id: 'mri_brain_with_without_contrast', name: 'MRI Brain with and without contrast', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['mass characterization', 'new lesion evaluation', 'metastatic workup'], unit: null, normalRange: null, quickFindings: ['Normal', 'Enhancing mass', 'Non-enhancing lesion', 'Multiple lesions'], feedsCdrs: [] },
{ id: 'mri_iac', name: 'MRI IAC (Internal Auditory Canal)', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['asymmetric sensorineural hearing loss', 'acoustic neuroma', 'vestibular schwannoma'], unit: null, normalRange: null, quickFindings: ['Normal', 'Vestibular schwannoma', 'Enhancing lesion'], feedsCdrs: [] },
{ id: 'mri_orbits_with_contrast', name: 'MRI Orbits with contrast', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['optic neuritis', 'orbital cellulitis', 'retrobulbar pathology'], unit: null, normalRange: null, quickFindings: ['Normal', 'Optic nerve enhancement', 'Orbital mass', 'Preseptal vs postseptal'], feedsCdrs: [] },
{ id: 'mri_pituitary_with_contrast', name: 'MRI Pituitary with contrast', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['pituitary apoplexy', 'macroadenoma', 'visual field changes'], unit: null, normalRange: null, quickFindings: ['Normal', 'Macroadenoma', 'Hemorrhagic apoplexy', 'Microadenoma'], feedsCdrs: [] },
{ id: 'mra_head', name: 'MRA Head (Circle of Willis)', category: 'imaging', subcategory: 'mri_brain_head', commonIndications: ['aneurysm evaluation', 'vasculitis', 'vessel occlusion', 'stroke workup'], unit: null, normalRange: null, quickFindings: ['Normal vasculature', 'Aneurysm', 'Vessel occlusion', 'Stenosis'], feedsCdrs: [] },

// MRI — Neck/Vascular
{ id: 'mra_neck', name: 'MRA Neck (Carotid/Vertebral)', category: 'imaging', subcategory: 'mri_neck_vascular', commonIndications: ['carotid dissection', 'vertebral dissection', 'stroke workup', 'vessel stenosis'], unit: null, normalRange: null, quickFindings: ['Normal', 'Dissection', 'Stenosis', 'Occlusion'], feedsCdrs: [] },
{ id: 'mri_soft_tissue_neck_with_contrast', name: 'MRI Soft Tissue Neck with contrast', category: 'imaging', subcategory: 'mri_neck_vascular', commonIndications: ['deep space neck infection', 'retropharyngeal abscess', 'parapharyngeal abscess'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abscess', 'Phlegmon', 'Deep space involvement'], feedsCdrs: [] },
{ id: 'mrv_brain', name: 'MR Venogram (MRV) Brain', category: 'imaging', subcategory: 'mri_neck_vascular', commonIndications: ['cerebral venous sinus thrombosis', 'postpartum headache', 'papilledema', 'hypercoagulable state'], unit: null, normalRange: null, quickFindings: ['Normal venous flow', 'Sinus thrombosis', 'Partial occlusion'], feedsCdrs: [] },

// MRI — Spine
{ id: 'mri_cspine_without_contrast', name: 'MRI Cervical Spine without contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['cord compression', 'central cord syndrome', 'disc herniation', 'ligamentous injury', 'SCIWORA'], unit: null, normalRange: null, quickFindings: ['Normal', 'Cord compression', 'Disc herniation', 'Ligamentous injury', 'Cord signal abnormality'], feedsCdrs: [] },
{ id: 'mri_cspine_with_contrast', name: 'MRI Cervical Spine with contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['epidural abscess', 'tumor', 'infection'], unit: null, normalRange: null, quickFindings: ['Normal', 'Epidural abscess', 'Enhancing mass', 'Osteomyelitis'], feedsCdrs: [] },
{ id: 'mri_tspine_without_contrast', name: 'MRI Thoracic Spine without contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['cord compression', 'metastatic disease', 'disc herniation', 'transverse myelitis'], unit: null, normalRange: null, quickFindings: ['Normal', 'Cord compression', 'Compression fracture', 'Transverse myelitis'], feedsCdrs: [] },
{ id: 'mri_tspine_with_contrast', name: 'MRI Thoracic Spine with contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['epidural abscess', 'spinal tumor', 'infection'], unit: null, normalRange: null, quickFindings: ['Normal', 'Epidural abscess', 'Tumor', 'Osteomyelitis'], feedsCdrs: [] },
{ id: 'mri_lspine_without_contrast', name: 'MRI Lumbar Spine without contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['cauda equina syndrome', 'severe radiculopathy', 'progressive deficit'], unit: null, normalRange: null, quickFindings: ['Normal', 'Cauda equina compression', 'Disc herniation', 'Spinal stenosis'], feedsCdrs: [] },
{ id: 'mri_lspine_with_contrast', name: 'MRI Lumbar Spine with contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['epidural abscess', 'discitis', 'osteomyelitis', 'post-surgical complications'], unit: null, normalRange: null, quickFindings: ['Normal', 'Epidural abscess', 'Discitis/osteomyelitis', 'Post-surgical changes'], feedsCdrs: [] },
{ id: 'mri_total_spine_with_contrast', name: 'MRI Total Spine with contrast', category: 'imaging', subcategory: 'mri_spine', commonIndications: ['epidural abscess uncertain level', 'metastatic disease survey', 'cord symptoms'], unit: null, normalRange: null, quickFindings: ['Normal', 'Multi-level disease', 'Epidural collection', 'Metastatic lesions'], feedsCdrs: [] },

// MRI — Chest
{ id: 'mra_chest_pulmonary', name: 'MRA Chest/Pulmonary', category: 'imaging', subcategory: 'mri_chest', commonIndications: ['PE when CT contrast contraindicated', 'pulmonary vascular evaluation'], unit: null, normalRange: null, quickFindings: ['Normal', 'PE', 'Pulmonary artery abnormality'], feedsCdrs: ['wells_pe'] },
{ id: 'mri_chest_with_contrast', name: 'MRI Chest with contrast', category: 'imaging', subcategory: 'mri_chest', commonIndications: ['aortic pathology when CTA contraindicated', 'cardiac mass', 'mediastinal mass'], unit: null, normalRange: null, quickFindings: ['Normal', 'Aortic abnormality', 'Mass', 'Pericardial disease'], feedsCdrs: [] },

// MRI — Cardiac
{ id: 'mri_cardiac_with_contrast', name: 'MRI Cardiac with contrast', category: 'imaging', subcategory: 'mri_cardiac', commonIndications: ['myocarditis', 'aortic pathology', 'dissection in pregnancy', 'cardiac mass', 'arrhythmogenic cardiomyopathy'], unit: null, normalRange: null, quickFindings: ['Normal', 'Myocarditis pattern', 'Cardiac mass', 'Cardiomyopathy'], feedsCdrs: ['heart'] },
{ id: 'mra_aorta', name: 'MRA Aorta', category: 'imaging', subcategory: 'mri_cardiac', commonIndications: ['dissection when iodinated contrast contraindicated', 'aneurysm evaluation'], unit: null, normalRange: null, quickFindings: ['Normal', 'Dissection', 'Aneurysm', 'Stenosis'], feedsCdrs: [] },

// MRI — Abdomen/Pelvis
{ id: 'mri_abdomen_without_contrast', name: 'MRI Abdomen without contrast', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['appendicitis in pregnancy', 'choledocholithiasis'], unit: null, normalRange: null, quickFindings: ['Normal', 'Appendicitis', 'Choledocholithiasis', 'Obstruction'], feedsCdrs: [] },
{ id: 'mrcp', name: 'MRCP (MR Cholangiopancreatography)', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['CBD stone', 'biliary obstruction', 'cholangitis workup'], unit: null, normalRange: null, quickFindings: ['Normal', 'CBD stone', 'Biliary dilation', 'Stricture'], feedsCdrs: [] },
{ id: 'mri_abd_pelvis_with_contrast', name: 'MRI Abdomen/Pelvis with contrast', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['liver lesion', 'renal mass', 'CT contrast contraindicated'], unit: null, normalRange: null, quickFindings: ['Normal', 'Liver lesion', 'Renal mass', 'Abscess'], feedsCdrs: [] },
{ id: 'mri_pelvis_without_contrast', name: 'MRI Pelvis without contrast', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['appendicitis in pregnancy', 'ovarian torsion when US equivocal'], unit: null, normalRange: null, quickFindings: ['Normal', 'Appendicitis', 'Ovarian pathology', 'Abscess'], feedsCdrs: [] },
{ id: 'mri_pelvis_with_contrast', name: 'MRI Pelvis with contrast', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['perianal abscess with fistula', 'complex pelvic pathology'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abscess with fistula', 'Pelvic mass', 'Complex collection'], feedsCdrs: [] },
{ id: 'mra_abdomen_mesenteric', name: 'MRA Abdomen (Mesenteric)', category: 'imaging', subcategory: 'mri_abdomen_pelvis', commonIndications: ['mesenteric ischemia when CTA contraindicated', 'renal artery stenosis'], unit: null, normalRange: null, quickFindings: ['Normal', 'Mesenteric occlusion', 'Renal artery stenosis'], feedsCdrs: [] },

// MRI — Extremity/MSK
{ id: 'mri_knee', name: 'MRI Knee', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['locked knee', 'meniscal tear', 'septic joint evaluation'], unit: null, normalRange: null, quickFindings: ['Normal', 'Meniscal tear', 'ACL tear', 'Effusion', 'Bone contusion'], feedsCdrs: [] },
{ id: 'mri_hip_without_contrast', name: 'MRI Hip without contrast', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['occult hip fracture', 'AVN', 'elderly fall negative X-ray'], unit: null, normalRange: null, quickFindings: ['Normal', 'Occult fracture', 'AVN', 'Effusion'], feedsCdrs: [] },
{ id: 'mri_ankle_foot', name: 'MRI Ankle/Foot', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['Lisfranc injury', 'occult fracture', 'osteomyelitis diabetic foot'], unit: null, normalRange: null, quickFindings: ['Normal', 'Lisfranc injury', 'Occult fracture', 'Osteomyelitis'], feedsCdrs: [] },
{ id: 'mri_wrist', name: 'MRI Wrist', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['scaphoid fracture', 'snuffbox tenderness', 'negative X-ray'], unit: null, normalRange: null, quickFindings: ['Normal', 'Scaphoid fracture', 'Other occult fracture', 'Ligament injury'], feedsCdrs: [] },
{ id: 'mri_shoulder', name: 'MRI Shoulder', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['posterior dislocation evaluation', 'occult fracture', 'rotator cuff injury'], unit: null, normalRange: null, quickFindings: ['Normal', 'Rotator cuff tear', 'Labral tear', 'Occult fracture'], feedsCdrs: [] },
{ id: 'mri_extremity_with_contrast', name: 'MRI Extremity with contrast', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['soft tissue abscess', 'necrotizing fasciitis', 'osteomyelitis'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abscess', 'Fascial enhancement (nec fasc)', 'Osteomyelitis'], feedsCdrs: [] },
{ id: 'mra_extremity', name: 'MRA Upper/Lower Extremity', category: 'imaging', subcategory: 'mri_extremity_msk', commonIndications: ['acute limb ischemia when CTA contraindicated', 'vascular injury'], unit: null, normalRange: null, quickFindings: ['Normal vasculature', 'Vessel occlusion', 'Stenosis', 'Pseudoaneurysm'], feedsCdrs: [] },

// MRI — Pediatric
{ id: 'mri_brain_nat', name: 'MRI Brain (NAT evaluation)', category: 'imaging', subcategory: 'mri_pediatric', commonIndications: ['non-accidental trauma', 'diffuse axonal injury', 'acute encephalopathy'], unit: null, normalRange: null, quickFindings: ['Normal', 'Diffuse axonal injury', 'Subdural hematoma', 'Parenchymal contusion'], feedsCdrs: [] },
{ id: 'mri_spine_sciwora', name: 'MRI Spine (SCIWORA)', category: 'imaging', subcategory: 'mri_pediatric', commonIndications: ['spinal cord injury without radiographic abnormality', 'pediatric spinal trauma'], unit: null, normalRange: null, quickFindings: ['Normal', 'Cord edema', 'Cord hemorrhage', 'Ligamentous injury'], feedsCdrs: [] },
{ id: 'mri_abd_pelvis_peds', name: 'MRI Abdomen/Pelvis (Peds)', category: 'imaging', subcategory: 'mri_pediatric', commonIndications: ['appendicitis in pediatrics', 'radiation avoidance'], unit: null, normalRange: null, quickFindings: ['Normal', 'Appendicitis', 'Other pathology'], feedsCdrs: [] },
{ id: 'rapid_brain_mri', name: 'Rapid/Quick Brain MRI', category: 'imaging', subcategory: 'mri_pediatric', commonIndications: ['VP shunt evaluation', 'hydrocephalus', 'radiation reduction in peds'], unit: null, normalRange: null, quickFindings: ['Normal ventricles', 'Ventriculomegaly', 'Shunt malfunction'], feedsCdrs: [] },

// MRI — Special Protocols
{ id: 'stroke_protocol_mri', name: 'Stroke Protocol MRI', category: 'imaging', subcategory: 'mri_special_protocols', commonIndications: ['acute stroke', 'wake-up stroke', 'unknown onset stroke', 'tissue viability'], unit: null, normalRange: null, quickFindings: ['Normal', 'Acute infarct', 'Penumbra present', 'Large vessel occlusion', 'Hemorrhage'], feedsCdrs: [] },
{ id: 'mri_with_ferumoxytol', name: 'MRI with ferumoxytol', category: 'imaging', subcategory: 'mri_special_protocols', commonIndications: ['severe renal insufficiency', 'gadolinium contraindicated'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abnormal enhancement'], feedsCdrs: [] },
{ id: 'mri_fast_protocol', name: 'MRI without sedation (fast protocols)', category: 'imaging', subcategory: 'mri_special_protocols', commonIndications: ['pediatric patients', 'claustrophobic patients', 'abbreviated sequences'], unit: null, normalRange: null, quickFindings: ['Normal', 'Abnormality detected'], feedsCdrs: [] },
```

**Step 5: Remove old generic MRI entries**

Remove these 3 entries (they're replaced by specific entries above):
- `mri_brain` (id: `mri_brain`) — replaced by `mri_brain_without_contrast`, `mri_brain_with_contrast`, etc.
- `mri_spine` (id: `mri_spine`) — replaced by specific spine entries
- `mri_extremity` (id: `mri_extremity`) — replaced by specific extremity entries
- `fluoro` (id: `fluoro`) — replaced by specific fluoroscopy entries

**Step 6: Verify seed script compiles**

Run: `cd scripts && npx tsc --noEmit seed-test-library.ts` or just `cd backend && pnpm build` (the seed script is in the scripts dir — check if it's compiled separately)

**Step 7: Commit**

```bash
git add scripts/seed-test-library.ts
git commit -m "feat(orders): expand imaging catalog with MRI, fluoroscopy, and nuclear medicine studies"
```

---

## Task 3: Update CSS for split title bars, vertical divider, and header consistency

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.css`

**Step 1: Update panel title to match other cards (1rem, 600 weight)**

Replace `.orders-card__panel-title` styles:

```css
.orders-card__panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  margin: 0;
}
```

**Step 2: Add border-bottom to panel headers to match other cards**

Update `.orders-card__panel-header`:

```css
.orders-card__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}
```

**Step 3: Add vertical divider on left panel**

Add new CSS rule:

```css
/* Vertical divider between left and right panels */
.orders-card__panel--left {
  border-right: 1px solid var(--color-border, #e2e8f0);
  padding-right: 1rem;
}

@media (max-width: 767px) {
  .orders-card__panel--left {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
    padding-bottom: 1rem;
  }
}
```

**Step 4: Add "Save as Orderset" button style (reuse action-btn pattern)**

The "Save as Orderset" button in the left title bar uses the same `.orders-card__action-btn--edit` class as "Manage" — no new CSS needed. But remove the old `.orders-card__create-orderset-btn` styles (the full-width dashed button at the bottom is going away).

**Step 5: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersCard.css
git commit -m "style(orders): update panel headers, add vertical divider, remove old create-orderset button"
```

---

## Task 4: Update CSS for dropdown open state (dark blue background)

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.css`
- Modify: `frontend/src/components/build-mode/shared/SubcategoryGroup.css`

**Step 1: Add open state styles for section headers**

Add to `OrdersCard.css`:

```css
/* ── Open State — dark blue background for expanded sections ────────────── */

.orders-card__section-header--open {
  background-color: #1e40af;
  color: #ffffff;
  border-radius: 4px;
  padding: 0.375rem 0.5rem;
}

.orders-card__section-header--open:hover {
  color: #e2e8f0;
}

.orders-card__section-header--open .orders-card__chevron {
  border-left-color: #ffffff;
}
```

**Step 2: Add open state styles for subcategory headers**

Add to `SubcategoryGroup.css`:

```css
.subcategory-group__header--open {
  background-color: #1e40af;
  color: #ffffff;
  border-radius: 4px;
  padding: 0.375rem 0.5rem;
}

.subcategory-group__header--open:hover {
  color: #e2e8f0;
}

.subcategory-group__header--open .subcategory-group__chevron {
  border-left-color: #ffffff;
}

.subcategory-group__header--open .subcategory-group__count {
  color: #bfdbfe;
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersCard.css frontend/src/components/build-mode/shared/SubcategoryGroup.css
git commit -m "style(orders): add dark blue background for expanded section headers"
```

---

## Task 5: Update CSS for checkbox styling (green selected, empty unselected)

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.css`

**Step 1: Replace checkbox styles with custom appearance**

Replace the existing `.orders-card__checkbox` block:

```css
.orders-card__checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.orders-card__checkbox:checked {
  background-color: #22c55e;
  border-color: #22c55e;
}

.orders-card__checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.orders-card__checkbox:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.orders-card__checkbox--accepted {
  /* Keep same green — just used for the flash animation context */
  background-color: #22c55e;
  border-color: #22c55e;
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersCard.css
git commit -m "style(orders): custom checkboxes — green when selected, empty when unselected"
```

---

## Task 6: Update OrdersCard.tsx — split title bars, move Save as Orderset button

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.tsx`

**Step 1: Add left panel class and move "Save as Orderset" to title bar**

In the render section, update the left panel wrapper to add the `--left` modifier class, and move the Save button into the panel header:

Change the left panel block (around lines 263-283) from:

```tsx
<div className="orders-card__panel">
  <div className="orders-card__panel-header">
    <h5 className="orders-card__panel-title">Orders</h5>
  </div>
  <OrdersLeftPanel .../>
</div>
```

To:

```tsx
<div className="orders-card__panel orders-card__panel--left">
  <div className="orders-card__panel-header">
    <h5 className="orders-card__panel-title">Orders</h5>
    {onSaveOrderSet && onUpdateOrderSet && (
      <button
        type="button"
        className="orders-card__action-btn orders-card__action-btn--edit"
        onClick={handleCreateOrderset}
        disabled={selectedTests.length === 0}
      >
        Save as Orderset
      </button>
    )}
  </div>
  <OrdersLeftPanel .../>
</div>
```

**Step 2: Remove onCreateOrderset prop from OrdersLeftPanel call**

Remove the `onCreateOrderset` prop since the button is now in the title bar:

```tsx
<OrdersLeftPanel
  enrichedTests={enrichedTests}
  recommendedTestIds={recommendedTestIds}
  selectedTests={selectedTests}
  frequentlyUsedTests={frequentlyUsedTests}
  frequentlyUsedOrderSet={frequentlyUsedOrderSet}
  testsByCategory={testsByCategory}
  openSections={openSections}
  checkboxClass={checkboxClass}
  testCdrMap={testCdrMap}
  onToggle={handleToggle}
  onToggleSection={toggleSection}
  onToggleAllRecommended={handleToggleAllRecommended}
  onOpenOrdersetManager={onOpenOrdersetManager}
/>
```

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersCard.tsx
git commit -m "feat(orders): move 'Save as Orderset' to title bar, add left panel divider class"
```

---

## Task 7: Update OrdersLeftPanel.tsx — remove bottom button, add open state classes

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx`

**Step 1: Remove onCreateOrderset prop and bottom button**

Remove `onCreateOrderset` from the props interface and destructuring. Remove the entire "Section 6: Create Orderset Button" block at the bottom.

**Step 2: Add `--open` modifier to section headers**

For each `<button>` with `className="orders-card__section-header"`, add the `--open` modifier when the section is open:

```tsx
className={`orders-card__section-header${openSections.has('recommended') ? ' orders-card__section-header--open' : ''}`}
```

Apply this pattern to all section headers: recommended, frequentlyUsed, and each category section.

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx
git commit -m "feat(orders): remove bottom create button, add open state class to section headers"
```

---

## Task 8: Update SubcategoryGroup.tsx — add open state class, multi-column layout

**Files:**
- Modify: `frontend/src/components/build-mode/shared/SubcategoryGroup.tsx`
- Modify: `frontend/src/components/build-mode/shared/SubcategoryGroup.css`

**Step 1: Add --open modifier to subcategory header**

Change the header button class:

```tsx
className={`subcategory-group__header${open ? ' subcategory-group__header--open' : ''}`}
```

**Step 2: Add multi-column layout for lists with >8 items**

Add conditional class to the list div:

```tsx
<div className={`subcategory-group__list${tests.length > 8 ? ' subcategory-group__list--multi-col' : ''}`}>
```

**Step 3: Add multi-column CSS**

Add to `SubcategoryGroup.css`:

```css
.subcategory-group__list--multi-col {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.25rem 1rem;
}

@media (max-width: 767px) {
  .subcategory-group__list--multi-col {
    grid-template-columns: 1fr;
  }
}
```

**Step 4: Commit**

```bash
git add frontend/src/components/build-mode/shared/SubcategoryGroup.tsx frontend/src/components/build-mode/shared/SubcategoryGroup.css
git commit -m "feat(orders): add open state class and multi-column layout to SubcategoryGroup"
```

---

## Task 9: Update OrdersRightPanel.tsx — add open state classes to section headers

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersRightPanel.tsx`

**Step 1: Add --open modifier to right panel section headers**

Same pattern as left panel. For `freqOrderSets` and `allOrderSets` section headers:

```tsx
className={`orders-card__section-header${openSections.has('freqOrderSets') ? ' orders-card__section-header--open' : ''}`}
```

**Step 2: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersRightPanel.tsx
git commit -m "feat(orders): add open state class to right panel section headers"
```

---

## Task 10: Handle MRI sub-sections in the display logic

**Files:**
- Modify: `frontend/src/components/build-mode/shared/subcategoryUtils.ts`
- Modify: `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx`

**Step 1: Add MRI_SUBSECTION_ORDER to subcategoryUtils**

```typescript
/** MRI sub-section display order (these are subcategory values for MRI tests) */
export const MRI_SUBSECTION_ORDER = [
  'mri_brain_head', 'mri_neck_vascular', 'mri_spine', 'mri_chest',
  'mri_cardiac', 'mri_abdomen_pelvis', 'mri_extremity_msk',
  'mri_pediatric', 'mri_special_protocols',
] as const

/** Check if a subcategory is an MRI sub-section */
export function isMriSubsection(subcategory: string): boolean {
  return subcategory.startsWith('mri_')
}
```

**Step 2: Update groupBySubcategory to support ordered output**

Add a new function that groups and orders by a provided order:

```typescript
export function groupBySubcategoryOrdered(
  tests: TestDefinition[],
  order?: readonly string[],
): Map<string, TestDefinition[]> {
  const map = groupBySubcategory(tests)
  if (!order) return map
  const ordered = new Map<string, TestDefinition[]>()
  for (const key of order) {
    const group = map.get(key)
    if (group) ordered.set(key, group)
  }
  // Append any remaining keys not in the order
  for (const [key, group] of map) {
    if (!ordered.has(key)) ordered.set(key, group)
  }
  return ordered
}
```

**Step 3: In OrdersLeftPanel, use IMAGING_SUBCATEGORY_ORDER for imaging category**

When rendering the imaging category, the subcategory groups should combine all `mri_*` subcategories into a single "MRI" parent group with nested sub-sections. Update the rendering logic in the CATEGORY_ORDER map to handle this:

For imaging, instead of flat subcategory groups, display:
- X-ray (direct SubcategoryGroup)
- CT (direct SubcategoryGroup)
- Ultrasound (direct SubcategoryGroup)
- MRI (parent group that contains sub-section SubcategoryGroups)
- Fluoroscopy (direct SubcategoryGroup)
- Nuclear Medicine (direct SubcategoryGroup)

This requires grouping tests first by modality, then for MRI, further grouping by mri subsection.

**Step 4: Commit**

```bash
git add frontend/src/components/build-mode/shared/subcategoryUtils.ts frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx
git commit -m "feat(orders): add MRI sub-section support and ordered imaging display"
```

---

## Task 11: Update tests

**Files:**
- Modify: `frontend/src/__tests__/OrdersCard.test.tsx`

**Step 1: Update mock data**

Update `mockTests` to include test with new modality subcategory:

```typescript
{
  id: 'ct_head',
  name: 'CT Head',
  category: 'imaging',
  subcategory: 'ct',  // changed from 'head_neck'
  commonIndications: ['head injury'],
  unit: null,
  normalRange: null,
  quickFindings: null,
  feedsCdrs: [],
},
```

**Step 2: Update test expectations**

- Update test `'Shows Create Orderset button...'` → change expected text to `'Save as Orderset'`
- Update test `'hides Create Orderset button...'` → change expected text to `'Save as Orderset'`
- Add test for open section header class
- Verify "Save as Orderset" appears in the panel header, not at the bottom

**Step 3: Run tests**

Run: `cd frontend && pnpm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add frontend/src/__tests__/OrdersCard.test.tsx
git commit -m "test(orders): update OrdersCard tests for UI redesign"
```

---

## Task 12: Run full quality gates and seed the database

**Step 1: Run frontend checks**

Run: `cd frontend && pnpm check`
Expected: typecheck + lint + test all pass

**Step 2: Run backend build**

Run: `cd backend && pnpm build`
Expected: Compiles clean

**Step 3: Seed the test library** (if Firestore seed script is available)

Run the seed script to update Firestore with the new imaging studies. Check how the existing seed script is run (likely `npx ts-node scripts/seed-test-library.ts` or similar).

**Step 4: Final commit**

If any fixes were needed, commit them. Then do a final visual check in the browser.

**Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix(orders): final adjustments from quality gate review"
```
