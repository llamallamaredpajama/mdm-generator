# ER Test Library Catalog

This is the canonical test catalog (241 tests) used by the MDM Generator's Orders Card and AI recommendation system. These tests are stored in the Firestore `testLibrary` collection and seeded by `backend/scripts/seed-test-library.ts`.

> Last synced from Firestore: 2026-02-28

## Summary

| Category | Count |
|----------|------:|
| Labs | 85 |
| Imaging | 45 |
| Procedures & Point-of-Care | 111 |
| **Total** | **241** |

---

## Labs

### Cardiac

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `bnp` | BNP/proBNP | dyspnea, CHF, volume overload | — | <100 pg/mL | heart |
| `troponin` | Troponin | chest pain, ACS, myocardial injury | — | <0.04 ng/mL | heart |

### Chemistry

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ammonia` | Ammonia | hepatic encephalopathy, altered mental status | — | 15-45 umol/L | — |
| `beta_hydroxybutyrate` | Beta-Hydroxybutyrate | DKA, ketoacidosis, alcoholic ketoacidosis, starvation ketosis | — | <0.6 mmol/L | — |
| `bmp` | BMP | electrolytes, renal function, glucose | — | — | — |
| `ck_cpk` | CK/CPK | rhabdomyolysis, muscle injury, cardiac | — | 22-198 U/L | — |
| `cmp` | CMP | liver function, electrolytes, renal function | — | — | — |
| `folate_b12` | Folate/Vitamin B12 | macrocytic anemia, altered mental status, neuropathy, malnutrition | — | — | — |
| `ionized_calcium` | Ionized Calcium | hypocalcemia, hypercalcemia, hypoalbuminemia, cardiac arrest, massive transfusion | — | 4.8-5.6 mg/dL | — |
| `lactate` | Lactate | sepsis, shock, tissue hypoperfusion | — | 0.5-2.0 mmol/L | sepsis |
| `ldh` | LDH | hemolysis, tissue damage, malignancy | — | 140-280 U/L | — |
| `mag` | Magnesium | electrolyte abnormality, seizure, arrhythmia | — | 1.7-2.2 mEq/L | — |
| `myoglobin` | Myoglobin | rhabdomyolysis, crush injury, compartment syndrome | — | <85 ng/mL | — |
| `osmolality` | Osmolality | hyponatremia, toxic ingestion, osmolar gap | — | 275-295 mOsm/kg | — |
| `phos` | Phosphorus | electrolyte abnormality, renal disease | — | 2.5-4.5 mg/dL | — |
| `uric_acid` | Uric Acid | gout, tumor lysis syndrome, renal disease, joint pain | — | 3.5-7.2 mg/dL | — |
| `urine_electrolytes` | Urine Electrolytes (FeNa) | acute kidney injury, hyponatremia, prerenal vs renal AKI | FeNa <1% (prerenal), FeNa >2% (intrinsic renal), FeNa 1-2% (indeterminate) | — | — |
| `vbg_abg` | VBG/ABG | respiratory distress, acid-base, metabolic | — | — | — |

### Endocrine

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `cortisol` | Random Cortisol | adrenal crisis, refractory hypotension, septic shock, altered mental status | — | 6-23 ug/dL | — |
| `free_t4` | Free T4 | thyroid storm, myxedema coma, abnormal TSH, thyrotoxicosis | — | 0.8-1.8 ng/dL | burch_wartofsky |
| `hba1c` | Hemoglobin A1c | diabetes evaluation, DKA, hyperglycemia, glycemic control | — | <5.7 % | — |
| `pth` | Parathyroid Hormone (PTH) | hypercalcemia, hypocalcemia, renal disease, bone pain | — | 15-65 pg/mL | — |
| `tsh` | TSH | thyroid disease, fatigue, weight change | — | 0.4-4.0 mIU/L | — |
| `vitamin_d` | Vitamin D (25-OH) | hypocalcemia, bone disease, fatigue, muscle weakness | — | 30-100 ng/mL | — |

### Gastrointestinal

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `fobt` | Fecal Occult Blood Test | GI bleed, anemia, melena, occult blood loss | Positive, Negative | — | — |

### Genitourinary

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `hcg_quant` | Quantitative beta-HCG | ectopic pregnancy, pregnancy quantification, vaginal bleeding | — | — | — |
| `ua` | Urinalysis | UTI, hematuria, renal disease | — | — | — |
| `ucg` | UCG (Urine Pregnancy) | pregnancy, abdominal pain, vaginal bleeding | — | — | — |

### Hematology

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `anti_xa` | Anti-Xa Level | LMWH monitoring, DOAC level assessment, bleeding on anticoagulation, renal dosing | Therapeutic, Subtherapeutic, Supratherapeutic | — | — |
| `blood_type_crossmatch` | Type & Crossmatch | massive transfusion, surgical prep, GI bleed | — | — | — |
| `cbc` | CBC | anemia, infection, bleeding | — | — | — |
| `coags_inr` | Coags/INR | bleeding, anticoagulation, liver disease | — | — | wells_dvt |
| `d_dimer` | D-dimer | PE, DVT, DIC | — | <500 ng/mL FEU | wells_pe, wells_dvt |
| `direct_coombs` | Direct Coombs (DAT) | autoimmune hemolytic anemia, hemolysis, transfusion reaction, neonatal jaundice | Positive, Negative | — | — |
| `fibrinogen` | Fibrinogen | DIC, bleeding, coagulopathy | — | 200-400 mg/dL | — |
| `haptoglobin` | Haptoglobin | hemolysis, anemia | — | 30-200 mg/dL | — |
| `peripheral_smear` | Peripheral Blood Smear | TTP/HUS, hemolysis, thrombocytopenia, anemia workup, DIC | Normal morphology, Schistocytes, Sickle cells, Spherocytes, Blasts | — | — |
| `retic_ct` | Reticulocyte Count | anemia, bone marrow response | — | 0.5-2.5 % | — |
| `thromboelastography` | TEG/ROTEM | massive transfusion, coagulopathy, trauma, DIC, liver disease | Normal, Hypercoagulable, Hypocoagulable, Fibrinolysis | — | — |
| `type_screen` | Type & Screen | transfusion, bleeding, surgical prep | — | — | — |

### Hepatic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `amylase` | Amylase | pancreatitis, abdominal pain | — | 30-110 U/L | — |
| `gg_tp` | GGT | biliary obstruction, alcohol use, elevated alkaline phosphatase | — | 8-61 U/L | — |
| `lfts` | LFTs | liver disease, abdominal pain, jaundice | — | — | — |
| `lipase` | Lipase | pancreatitis, abdominal pain | — | 0-160 U/L | — |

### Infectious

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `blood_cx` | Blood Cultures | sepsis, fever, bacteremia | — | — | sepsis |
| `gc_chlamydia` | GC/Chlamydia NAAT | STI screening, pelvic pain, urethritis, cervicitis, vaginal discharge | GC positive, Chlamydia positive, Both positive, Both negative | — | — |
| `hepatitis_panel` | Hepatitis Panel | elevated LFTs, jaundice, liver failure, needle stick, cirrhosis | Hep A IgM positive, Hep B sAg positive, Hep C Ab positive, All negative | — | — |
| `hiv_rapid` | Rapid HIV | HIV screening, needle stick, opportunistic infection, STI screening | Positive, Negative | — | — |
| `lyme_titer` | Lyme Disease Titer | tick bite, erythema migrans, facial palsy, arthritis, heart block | IgM positive, IgG positive, Negative | — | — |
| `malaria_smear` | Malaria Smear/RDT | travel fever, malaria endemic exposure, cyclic fevers, thrombocytopenia after travel | P. falciparum, P. vivax, P. malariae, Negative | — | — |
| `mono_spot` | Monospot (Heterophile Ab) | pharyngitis, fatigue, lymphadenopathy, splenomegaly | Positive, Negative | — | — |
| `procalcitonin` | Procalcitonin | sepsis, infection differentiation, antibiotic stewardship | — | <0.1 ng/mL | — |
| `gi_pathogen_panel` | GI Pathogen Panel (PCR) | acute gastroenteritis, bloody diarrhea, traveler diarrhea, immunocompromised with diarrhea, food poisoning, prolonged diarrhea | C. difficile positive, Campylobacter positive, Salmonella positive, Norovirus positive, Shigella/EIEC positive, STEC/E. coli O157 positive, Giardia positive, Rotavirus positive, Negative (no pathogens detected) | — | — |
| `respiratory_panel` | Respiratory Pathogen Panel (PCR) | respiratory illness, fever, pneumonia, bronchiolitis, immunocompromised, upper respiratory infection, coinfection evaluation | Influenza A, Influenza B, RSV, SARS-CoV-2, Rhinovirus/Enterovirus, Adenovirus, Parainfluenza, Metapneumovirus, Coronavirus (seasonal), Bordetella pertussis, Mycoplasma pneumoniae, Negative | — | — |
| `stool_studies` | Stool Studies | C. diff, diarrhea, O&P, infectious colitis | C. diff positive, C. diff negative, O&P positive | — | — |
| `syphilis_rpr` | Syphilis RPR/VDRL | STI screening, rash, neurologic symptoms, pregnancy screening | Reactive, Non-reactive | — | — |
| `tb_quantiferon` | TB QuantiFERON Gold | tuberculosis screening, immunocompromised, exposure, cavitary lung disease | Positive, Negative, Indeterminate | — | — |
| `throat_cx` | Throat Culture | pharyngitis, negative rapid strep, peritonsillar abscess | GAS positive, Negative, Normal flora | — | centor_mcisaac |
| `urine_cx` | Urine Culture | UTI confirmation, recurrent UTI, pyelonephritis | No growth, Growth >100k CFU, Mixed flora | — | — |
| `wound_cx` | Wound Culture | wound infection, abscess, cellulitis, bite wound | No growth, MRSA, MSSA, Strep, Polymicrobial | — | — |

### Inflammatory

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `esr_crp` | ESR/CRP | inflammation, infection, autoimmune | — | — | — |
| `tryptase` | Serum Tryptase | anaphylaxis confirmation, mast cell activation, post-resuscitation | — | <11.4 ng/mL | — |

### Neurologic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `csf_analysis` | CSF Analysis | meningitis, encephalitis, SAH, CNS infection | Normal, Bacterial pattern, Viral pattern, Xanthochromia, Elevated protein, Elevated WBC | — | — |

### Obstetric

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `kleihauer_betke` | Kleihauer-Betke Test | fetomaternal hemorrhage, Rh-negative mother, trauma in pregnancy, vaginal bleeding in pregnancy | Positive (fetal cells detected), Negative | — | — |

### Pulmonary

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `pleural_fluid_analysis` | Pleural Fluid Analysis | pleural effusion, empyema, malignant effusion, parapneumonic effusion | Transudative (Light criteria), Exudative (Light criteria), Empyema, Bloody, Chylous | — | — |

### Rheumatologic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `synovial_fluid` | Synovial Fluid Analysis | septic arthritis, gout, pseudogout, joint effusion | Non-inflammatory (<2k WBC), Inflammatory (2-50k WBC), Septic (>50k WBC), MSU crystals (gout), CPPD crystals (pseudogout) | — | kocher_criteria |

### Toxicology

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `apap` | Acetaminophen Level | overdose, liver injury | — | <20 ug/mL | rumack_matthew |
| `carbamazepine_level` | Carbamazepine Level | carbamazepine toxicity, seizure management, ataxia, diplopia | — | 4-12 ug/mL | — |
| `carboxyhemoglobin` | Carboxyhemoglobin (CO) | carbon monoxide exposure, headache, smoke inhalation, altered mental status | — | <3 % | — |
| `cholinesterase` | Cholinesterase Level | organophosphate poisoning, nerve agent exposure, SLUDGE symptoms | — | 5320-12920 U/L | — |
| `cyanide_level` | Cyanide Level | smoke inhalation, cyanide exposure, lactic acidosis with fire exposure | — | <0.1 mg/L | — |
| `digoxin_level` | Digoxin Level | digoxin toxicity, arrhythmia, nausea on digoxin, bradycardia | — | 0.8-2.0 ng/mL | — |
| `ethanol` | Ethanol Level | intoxication, altered mental status | — | 0 mg/dL | — |
| `ethylene_glycol` | Ethylene Glycol Level | toxic alcohol ingestion, osmolar gap, anion gap acidosis, renal failure | — | 0 mg/dL | — |
| `iron_studies` | Iron/TIBC/Ferritin | iron overdose, iron deficiency anemia, anemia workup | — | 60-170 ug/dL | — |
| `lithium_level` | Lithium Level | lithium toxicity, tremor, altered mental status, renal impairment on lithium | — | 0.6-1.2 mEq/L | — |
| `methanol_level` | Methanol Level | toxic alcohol ingestion, vision loss, osmolar gap, anion gap acidosis | — | 0 mg/dL | — |
| `methemoglobin` | Methemoglobin Level | cyanosis, dapsone toxicity, benzocaine exposure, SpO2 gap | — | <1.5 % | — |
| `phenobarbital_level` | Phenobarbital Level | seizure management, barbiturate toxicity, status epilepticus | — | 15-40 ug/mL | — |
| `phenytoin_level` | Phenytoin Level | seizure management, phenytoin toxicity, nystagmus, ataxia | — | 10-20 ug/mL | — |
| `salicylate` | Salicylate Level | overdose, tinnitus, metabolic acidosis | — | <30 mg/dL | — |
| `theophylline_level` | Theophylline Level | theophylline toxicity, seizure, tachycardia, COPD management | — | 10-20 ug/mL | — |
| `uds` | Urine Drug Screen | overdose, altered mental status, drug screening | — | — | — |
| `urine_tox` | Urine Tox Screen | overdose, altered mental status, drug screening | — | — | — |
| `valproic_acid_level` | Valproic Acid Level | VPA toxicity, seizure management, altered mental status, hepatotoxicity | — | 50-100 ug/mL | — |

---

## Imaging

### Abdomen

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_abd_pelv` | CT Abdomen/Pelvis | abdominal pain, appendicitis, obstruction | Normal, Appendicitis, Obstruction, Free fluid, Mass | — | — |
| `cta_abd` | CTA Abdomen/Pelvis | mesenteric ischemia, AAA, GI bleed, vascular emergency | Normal, Mesenteric occlusion, AAA, Active extravasation | — | — |
| `us_aorta` | US Aorta | abdominal pain, AAA screening, hypotension | Normal, AAA, Dissection flap | — | — |
| `us_fast` | US FAST | trauma, hypotension, abdominal pain | Negative, Positive - free fluid, Positive - pericardial | — | — |
| `us_ruq` | US RUQ (Gallbladder) | RUQ pain, cholecystitis, biliary disease | Normal, Cholelithiasis, Cholecystitis, CBD dilation | — | — |
| `xr_abd` | X-ray Abdomen (KUB) | obstruction, foreign body, constipation, kidney stone | Normal, Obstruction, Free air, Calcification | — | — |

### Cardiac

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `echo_tte` | Echo TTE | dyspnea, chest pain, murmur, CHF | Normal EF, Reduced EF, Wall motion abnormality, Pericardial effusion, Valve abnormality | — | heart |
| `us_ivc` | US IVC (Volume Assessment) | volume status assessment, hypotension, sepsis, fluid responsiveness | Plethoric (>2.1cm, <50% collapse), Normal, Flat/collapsing (volume responsive), IVC >50% collapse with respiration | — | sepsis |

### Chest

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_chest` | CT Chest | chest pain, dyspnea, trauma | Normal, Consolidation, Effusion, Mass, Fracture | — | — |
| `cta_chest` | CTA Chest | PE, aortic dissection, chest pain | Normal, PE, Aortic dissection, Aneurysm | — | wells_pe, perc |
| `us_lung` | US Lung (POCUS) | dyspnea, pneumothorax, pleural effusion, pulmonary edema, pneumonia | A-lines (normal/COPD), B-lines (pulmonary edema), Absent lung sliding (pneumothorax), Effusion, Consolidation (hepatization) | — | — |
| `vq_scan` | V/Q Scan | PE (CTA contraindicated), renal insufficiency, contrast allergy, pregnancy | Normal, Low probability, Intermediate probability, High probability | — | wells_pe |
| `xr_chest` | Chest X-ray (CXR) | dyspnea, cough, chest pain, fever | Normal, Infiltrate, Effusion, Pneumothorax, Cardiomegaly | — | — |
| `xr_ribs` | X-ray Ribs | chest wall pain, trauma, rib fracture, flail chest | Normal, Single rib fracture, Multiple rib fractures, Flail segment | — | — |

### Extremity

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_extremity` | CT Extremity | occult fracture, complex fracture, calcaneus fracture, tibial plateau fracture | Normal, Occult fracture, Comminuted fracture, Intra-articular extension, Foreign body | — | — |
| `mri_extremity` | MRI Extremity | occult hip fracture, scaphoid fracture, ligament injury, osteomyelitis, soft tissue mass | Normal, Occult fracture, Ligament tear, Osteomyelitis, Effusion, Mass | — | — |
| `xr_ext` | X-ray Extremity | injury, pain, deformity | Normal, Fracture, Dislocation, Soft tissue swelling | — | ottawa_ankle, ottawa_knee |
| `xr_pelvis` | X-ray Pelvis | hip fracture, pelvic trauma, hip pain | Normal, Fracture, Dislocation, Degenerative | — | — |

### Gastrointestinal

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `swallow_study` | Esophagram/Swallow Study | esophageal foreign body, esophageal perforation, dysphagia, Boerhaave syndrome | Normal, Foreign body, Perforation/leak, Stricture, Obstruction | — | — |
| `upper_gi_sbft` | Upper GI with Small Bowel Follow Through | bilious emesis (pediatric), malrotation, midgut volvulus, bowel obstruction, intermittent abdominal pain | Normal (DJ junction left of spine at pylorus level), Malrotation (ligament of Treitz on right), Corkscrew duodenum (volvulus), Duodenal obstruction (beak sign), Partial obstruction, Normal transit time | — | — |

### Genitourinary

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `us_renal` | US Renal | flank pain, renal colic, hematuria | Normal, Hydronephrosis, Stone, Mass | — | — |
| `us_testicular` | US Testicular/Scrotal | testicular torsion, scrotal pain, testicular mass, epididymitis | Normal, Torsion (absent flow), Epididymitis, Hydrocele, Mass | — | — |

### Head & Neck

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_face` | CT Facial Bones | facial trauma, orbital fracture, midface fracture | Normal, Orbital fracture, Nasal fracture, Le Fort fracture | — | — |
| `ct_head` | CT Head | headache, trauma, altered mental status, stroke | Normal, Bleed, Mass, Edema, Midline shift | — | canadian_ct_head |
| `ct_neck_soft` | CT Neck Soft Tissue | peritonsillar abscess, retropharyngeal abscess, Ludwig angina, deep neck space infection, neck mass | Normal, Peritonsillar abscess, Retropharyngeal abscess, Lymphadenopathy, Mass | — | — |
| `ct_orbits` | CT Orbits | orbital cellulitis, orbital abscess, globe rupture, retrobulbar hemorrhage | Normal, Orbital cellulitis, Subperiosteal abscess, Retrobulbar hemorrhage, Foreign body | — | — |
| `ct_sinuses` | CT Sinuses | sinusitis, orbital cellulitis, facial pain, periorbital swelling | Normal, Sinus opacification, Air-fluid levels, Mucosal thickening, Orbital extension | — | — |
| `cta_head` | CTA Head/Neck | stroke, vessel occlusion, dissection | Normal, Occlusion, Stenosis, Aneurysm, Dissection | — | — |
| `mri_brain` | MRI Brain | stroke, seizure, mass | Normal, Infarct, Mass, Hemorrhage | — | — |
| `panorex` | Panoramic Dental X-ray (Panorex) | mandible fracture, dental trauma, dental abscess, TMJ evaluation | Normal, Mandible fracture, Dental fracture, Periapical abscess, TMJ abnormality | — | — |
| `us_ocular` | Ocular Ultrasound | retinal detachment, vitreous hemorrhage, lens dislocation, elevated IOP concern, globe rupture | Normal, Retinal detachment, Vitreous hemorrhage, Lens dislocation, Posterior vitreous detachment | — | — |
| `xr_neck_soft` | X-ray Soft Tissue Neck | croup, epiglottitis, foreign body, retropharyngeal abscess | Normal, Steeple sign (croup), Thumbprint sign (epiglottitis), Prevertebral widening, Foreign body | — | — |

### Miscellaneous

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `fluoro` | Fluoroscopy | reduction, foreign body, swallow study | — | — | — |

### Obstetric

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `us_ob` | US OB (Obstetric) | pregnancy, vaginal bleeding, abdominal pain | IUP confirmed, No IUP, Ectopic, Free fluid | — | — |
| `us_pelvic` | Pelvic Ultrasound | ectopic pregnancy, ovarian torsion, pelvic pain, vaginal bleeding | Normal, Free fluid, Ovarian mass, Ectopic | — | — |

### Soft Tissue

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `us_soft_tissue` | US Soft Tissue | abscess, cellulitis, foreign body | Normal, Abscess, Cellulitis, Foreign body | — | — |

### Spine

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_cspine` | CT C-spine | trauma, neck pain, neurologic deficit | Normal, Fracture, Subluxation, Degenerative | — | nexus, canadian_cspine |
| `ct_tl_spine` | CT Thoracolumbar Spine | trauma, back pain, compression fracture, neurologic deficit | Normal, Compression fracture, Burst fracture, Transverse process fracture, Degenerative | — | — |
| `mri_spine` | MRI Spine | cord compression, cauda equina syndrome, epidural abscess, cancer with back pain | Normal, Cord compression, Epidural abscess, Disc herniation, Metastatic disease | — | — |
| `xr_spine` | X-ray Spine | back pain, trauma, compression fracture | Normal, Fracture, Compression, Degenerative | — | — |

### Vascular

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `ct_angio_chest_abd` | CTA Chest/Abdomen/Pelvis | aortic dissection, polytrauma, ruptured AAA, aortic emergency | Normal, Aortic dissection Type A, Aortic dissection Type B, AAA with rupture, Active hemorrhage | — | — |
| `ct_angio_extremity` | CTA Extremity | vascular injury, limb ischemia, penetrating extremity trauma, absent distal pulses | Normal vasculature, Vessel occlusion, Active extravasation, Pseudoaneurysm, AV fistula | — | — |
| `us_carotid` | Carotid Duplex | TIA, stroke, carotid bruit, amaurosis fugax | Normal, Stenosis <50%, Stenosis 50-69%, Stenosis 70-99%, Occlusion | — | abcd2 |
| `us_le_venous` | LE Venous Duplex (DVT) | DVT, leg swelling, unilateral edema | Normal, DVT present, Superficial thrombosis | — | wells_dvt |
| `us_ue_venous` | UE Venous Duplex | upper extremity DVT, arm swelling, PICC-associated thrombosis, catheter-related thrombosis | Normal, DVT present, Superficial thrombosis | — | — |

---

## Procedures & Point-of-Care

### Abdominal

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `paracentesis` | Paracentesis | ascites, SBP, abdominal distension | Transudative, Exudative, SBP (elevated PMNs), Bloody | — | — |

### Airway

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `airway_fb_removal` | Airway Foreign Body Removal | choking, airway foreign body, stridor, unable to ventilate, pediatric aspiration | Magill forceps removal, Back blows/chest thrusts (infant), Abdominal thrusts (Heimlich), Removed by direct laryngoscopy, Required surgical airway | — | — |
| `bipap_cpap` | BiPAP/CPAP (NIPPV) | COPD exacerbation, CHF/pulmonary edema, respiratory distress, obstructive sleep apnea | Improved respiratory status, Failed NIPPV, Intubation avoided | — | — |
| `bvm_ventilation` | BVM/Bag-Valve-Mask | apnea, respiratory failure, pre-oxygenation, cardiac arrest | Effective ventilation, Difficult ventilation, Two-person technique required | — | — |
| `cricothyrotomy` | Cricothyrotomy | failed intubation, cannot intubate/cannot oxygenate, facial trauma, angioedema | Surgical cric performed, Needle cric performed, Successful ventilation | — | — |
| `high_flow_nc` | High-Flow Nasal Cannula | hypoxia, respiratory distress, pre-oxygenation, post-extubation | Improved oxygenation, FiO2 and flow rate set, Weaning initiated, Escalated to NIPPV | — | — |
| `intubation` | Endotracheal Intubation | respiratory failure, airway protection, altered mental status, status epilepticus | RSI performed, Direct laryngoscopy, Video laryngoscopy, Bougie-assisted, First-pass success | — | — |
| `mechanical_ventilation` | Mechanical Ventilation Management | respiratory failure, post-intubation, ARDS, status asthmaticus | AC mode initiated, SIMV mode, Pressure support, Lung-protective settings (6 mL/kg IBW), Settings adjusted | — | — |
| `nebulizer_treatment` | Nebulizer Treatment | asthma exacerbation, COPD exacerbation, bronchospasm, croup | Albuterol given, Albuterol + ipratropium, Racemic epinephrine (croup), Improved air movement, Repeat treatment needed | — | — |
| `supraglottic_airway` | Supraglottic Airway (LMA/King) | rescue airway, failed intubation, cardiac arrest, short procedure | LMA placed, King tube placed, Adequate ventilation, Upgraded to ETT | — | — |

### Anesthesia

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `local_anesthesia` | Local Anesthesia | wound repair, abscess drainage, procedural anesthesia | Lidocaine 1%, Lidocaine with epinephrine, Bupivacaine, Buffered lidocaine | — | — |
| `nerve_block` | Nerve Block/Regional Anesthesia | laceration repair, fracture pain, abscess drainage, hip fracture, rib fractures | Digital block, Femoral nerve block, Fascia iliaca block, Hematoma block, Intercostal block, US-guided | — | — |
| `sphenopalatine_block` | Sphenopalatine Ganglion Block | migraine, cluster headache, epistaxis, trigeminal neuralgia | Performed with atomized lidocaine, Performed with cotton-tip applicator, Pain relief achieved, Partial relief | — | — |
| `trigger_point_injection` | Trigger Point Injection | myofascial pain, muscle spasm, neck pain, back pain, tension headache | Local anesthetic injected, Pain relief achieved, Twitch response elicited, Multiple trigger points treated | — | — |

### Cardiac

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `cardioversion` | Cardioversion/Defibrillation | unstable tachycardia, atrial fibrillation, SVT, ventricular fibrillation, VT with pulse | Synchronized cardioversion, Defibrillation, Return to sinus, Required repeat shock | — | — |
| `ecg_12lead` | ECG (12-lead) | chest pain, palpitations, syncope, dyspnea | Normal sinus, ST elevation, ST depression, Afib, SVT, VT, BBB, STEMI equivalent | — | heart, sgarbossa |
| `ecg_repeat` | Repeat ECG | interval change, chest pain, serial monitoring | Unchanged, New ST changes, Resolution, Interval change | — | heart |
| `pericardiocentesis` | Pericardiocentesis | cardiac tamponade, pericardial effusion, PEA arrest, Beck triad | Bloody aspirate, Serous aspirate, Hemodynamic improvement, Drain placed | — | — |
| `resuscitative_thoracotomy` | Resuscitative Thoracotomy | penetrating thoracic trauma with arrest, witnessed arrest after penetrating trauma, cardiac tamponade | Performed, Tamponade relieved, Aortic cross-clamp applied, ROSC achieved, No cardiac activity | — | — |
| `transcutaneous_pacing` | Transcutaneous Pacing | symptomatic bradycardia, heart block, asystole, pacemaker failure | Capture achieved, Failed capture, Rate set at ___ bpm | — | — |
| `transvenous_pacemaker` | Transvenous Pacemaker | symptomatic bradycardia refractory to transcutaneous pacing, complete heart block, pacemaker malfunction, overdrive pacing | Capture achieved, Wire positioned in RV, Rate and output set, Confirmed by CXR | — | — |

### Dental

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `dental_block` | Dental Block/Tooth Stabilization | dental pain, tooth fracture, avulsed tooth, dental abscess | Inferior alveolar block, Mental nerve block, Infraorbital block, Tooth reimplanted, Calcium hydroxide placed | — | — |
| `tmj_reduction` | TMJ Dislocation Reduction | TMJ dislocation, inability to close mouth, jaw locked open | Successful bilateral reduction, Successful unilateral reduction, Sedation required, Barton bandage applied | — | — |

### ENT

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `auricular_hematoma_id` | Auricular Hematoma I&D | auricular hematoma, ear trauma, cauliflower ear prevention | Hematoma drained, Bolster dressing applied, Compression dressing placed | — | — |
| `ear_irrigation` | Ear Irrigation/FB Removal | cerumen impaction, ear foreign body, hearing loss, otalgia | Cerumen removed, Foreign body removed, TM visualized and intact, TM perforation noted | — | — |
| `epistaxis_management` | Epistaxis Management | nosebleed, anterior epistaxis, posterior epistaxis, anticoagulated patient | Direct pressure controlled, Cautery performed, Anterior packing placed, Posterior packing placed, Rhino Rocket placed | — | — |
| `nasal_fb_removal` | Nasal Foreign Body Removal | nasal foreign body, pediatric FB, nasal obstruction | FB removed, Parent's kiss technique, Alligator forceps, Balloon catheter extraction | — | — |
| `peritonsillar_drainage` | Peritonsillar Abscess Drainage | peritonsillar abscess, trismus, odynophagia, uvular deviation | Aspirated purulent fluid, I&D performed, Needle aspiration, No abscess on aspiration | — | — |

### Environmental

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `cooling_measures` | Active Cooling Measures | heat stroke, hyperthermia, malignant hyperthermia, NMS | Ice bath immersion, Evaporative cooling, Cold IV fluids, Core temp decreasing | — | — |
| `tick_removal` | Tick Removal | embedded tick, tick bite, Lyme disease concern | Tick removed intact, Tick removed with mouthparts, Partial removal | — | — |
| `warming_measures` | Active Warming Measures | hypothermia, cold exposure, submersion, environmental exposure | Bair Hugger applied, Warm IV fluids, Warm blankets, Core temp improving | — | — |

### Gastrointestinal

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `hemorrhoid_thrombectomy` | Thrombosed Hemorrhoid Excision | thrombosed external hemorrhoid, acute perianal pain, perianal mass | Elliptical excision, Clot evacuated, Local anesthesia used, Pain relief achieved | — | — |
| `hernia_reduction` | Hernia Reduction | incarcerated inguinal hernia, incarcerated umbilical hernia, groin pain with bulge | Successful manual reduction, Failed reduction (surgical consult), Trendelenburg with sedation | — | — |
| `ng_og_tube` | NG/OG Tube Placement | GI bleed, bowel obstruction, gastric decompression, medication administration, overdose | Placed and confirmed, Bloody aspirate, Bilious aspirate, Decompression achieved | — | — |
| `rectal_exam` | Digital Rectal Exam | GI bleed, rectal bleeding, prostate evaluation, rectal foreign body, saddle anesthesia | Normal, Guaiac positive, Guaiac negative, Gross blood, Mass palpated, Normal tone | — | — |
| `rectal_fb_removal` | Rectal Foreign Body Removal | retained rectal foreign body, abdominal pain, rectal pain | Removed bedside, Removed with sedation, Required surgical consultation, Post-removal imaging normal | — | — |
| `rectal_prolapse_reduction` | Rectal Prolapse Reduction | rectal prolapse, rectal protrusion, elderly patient with prolapse | Manual reduction successful, Sugar granule technique, Failed reduction (surgical consult) | — | — |

### Genitourinary

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `foley_catheter` | Foley Catheter | urinary retention, urine output monitoring, hemodynamic instability, trauma | Placed without difficulty, Difficult placement, Gross hematuria, Large residual | — | — |
| `paraphimosis_reduction` | Paraphimosis Reduction | paraphimosis, foreskin entrapment, penile swelling | Manual reduction successful, Ice/compression then reduction, Dorsal slit required, Urology consulted | — | — |
| `priapism_management` | Priapism Management | priapism, ischemic priapism, sickle cell crisis, prolonged erection | Aspiration performed, Phenylephrine injection, Detumescence achieved, Urology consulted | — | — |

### Gynecologic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `bartholin_drainage` | Bartholin Abscess Drainage | Bartholin abscess, Bartholin cyst, labial swelling, vulvar pain | I&D performed, Word catheter placed, Marsupialization, Purulent drainage | — | — |
| `sexual_assault_exam` | Sexual Assault Forensic Exam | sexual assault, forensic evidence collection, SANE exam | Evidence kit collected, Prophylactic medications given, Counseling provided, Follow-up arranged | — | — |
| `speculum_exam` | Pelvic/Speculum Exam | vaginal bleeding, pelvic pain, vaginal discharge, threatened abortion, foreign body | Normal, Cervical os open, Cervical os closed, Active bleeding, Foreign body removed, Cervical motion tenderness | — | — |

### Monitoring

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `bladder_scan` | Bladder Scan (PVR) | urinary retention, post-void residual, difficulty voiding, neurogenic bladder | Normal PVR (<100 mL), Elevated PVR (>200 mL), Significant retention (>500 mL) | <100 mL | — |
| `blood_gas_interpretation` | Blood Gas Interpretation | acid-base disorder, respiratory failure, DKA, toxic ingestion, shock | Respiratory acidosis, Respiratory alkalosis, Metabolic acidosis (AG), Metabolic acidosis (non-AG), Metabolic alkalosis, Mixed disorder | — | — |
| `capnography` | End-Tidal CO2/Capnography | ETT confirmation, CPR quality monitoring, sedation monitoring, respiratory status | Normal waveform, Low EtCO2 (<10 during CPR), Rising EtCO2 (ROSC), Absent waveform (esophageal) | 35-45 mmHg | — |
| `cardiac_monitor` | Continuous Cardiac Monitor | chest pain, arrhythmia, syncope, electrolyte abnormality, overdose | Normal sinus rhythm, Sinus tachycardia, Sinus bradycardia, Atrial fibrillation, PVCs, ST changes noted | — | — |
| `peak_flow` | Peak Flow Measurement | asthma exacerbation, COPD exacerbation, dyspnea, wheezing | >80% predicted (mild), 50-80% predicted (moderate), <50% predicted (severe), Improved post-treatment | — | — |
| `pulse_oximetry` | Continuous Pulse Oximetry | respiratory distress, sedation monitoring, hypoxia, carbon monoxide | Normal >95%, Mild hypoxia 90-94%, Moderate hypoxia 85-89%, Severe hypoxia <85% | 95-100 % | — |
| `telemetry` | Telemetry Monitoring | arrhythmia monitoring, ACS observation, syncope workup, post-cardioversion | No events, Intermittent PVCs, PACs noted, SVT episode captured, AF with RVR captured | — | — |

### Neurologic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `cranial_burr_hole` | Emergency Cranial Burr Hole | epidural hematoma with herniation, no neurosurgery available, uncal herniation, fixed dilated pupil | Hematoma evacuated, Clinical improvement, Awaiting neurosurgical transfer | — | — |
| `dix_hallpike_epley` | Dix-Hallpike/Epley Maneuver | vertigo, BPPV, dizziness, positional nystagmus | Positive Dix-Hallpike (upbeat torsional nystagmus), Negative Dix-Hallpike, Epley performed - symptoms resolved, Epley performed - persistent symptoms | — | — |
| `lp` | Lumbar Puncture | meningitis, SAH, headache | Normal, Elevated WBC, Elevated protein, Xanthochromia, Elevated opening pressure | — | — |

### Obstetric

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `postpartum_hemorrhage` | Postpartum Hemorrhage Management | postpartum hemorrhage, uterine atony, retained placenta, vaginal delivery complications | Uterine massage, Uterotonics administered, Intrauterine balloon placed, Manual placenta removal, OB consulted | — | — |
| `resuscitative_hysterotomy` | Resuscitative Hysterotomy | maternal cardiac arrest, perimortem cesarean, gravid uterus >20 weeks | Performed, ROSC achieved, Infant delivered | — | — |
| `vaginal_delivery` | Emergency Vaginal Delivery | precipitous delivery, imminent delivery, crowning | Spontaneous vaginal delivery, Nuchal cord reduced, Apgar _/_, Placenta delivered | — | — |

### Ophthalmologic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `eye_foreign_body` | Eye Foreign Body Removal | corneal foreign body, metallic FB, rust ring, eye pain after grinding | FB removed with needle/burr, Rust ring removed, Seidel test negative, Fluorescein uptake resolved | — | — |
| `fundoscopic_exam` | Fundoscopic Exam | headache, papilledema evaluation, vision loss, hypertensive emergency, increased ICP | Normal, Papilledema, Retinal hemorrhages, Cotton-wool spots, Disc pallor, CRVO/CRAO pattern | — | — |
| `lateral_canthotomy` | Lateral Canthotomy | orbital compartment syndrome, retrobulbar hemorrhage, proptosis with vision loss | Canthotomy and cantholysis performed, IOP decreased, Vision improved | — | — |
| `ocular_irrigation` | Ocular/Eye Irrigation | chemical exposure to eye, alkali burn, acid burn, foreign body in eye | pH normalized (7.0-7.4), Irrigation with 1L NS, Irrigation with 2L NS, Slit lamp post-irrigation normal | — | — |
| `slit_lamp` | Slit Lamp Exam | eye pain, red eye, foreign body sensation, vision change, chemical exposure | Normal, Corneal abrasion, Corneal ulcer, Foreign body, Hyphema, Cell/flare (iritis) | — | — |
| `tonometry` | Tonometry (IOP Measurement) | acute glaucoma, eye pain, blurred vision, red eye, post-lateral canthotomy | Normal IOP, Elevated IOP (>21 mmHg), Critically elevated (>40 mmHg), IOP decreased post-treatment | 10-21 mmHg | — |

### Orthopedic

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `compartment_pressure` | Compartment Pressure Measurement | compartment syndrome, crush injury, fracture with severe pain, tight cast/splint | Normal pressure, Elevated (>30 mmHg), Delta pressure <30 (surgical) | <20 mmHg | — |
| `fracture_reduction` | Fracture/Dislocation Reduction | displaced fracture, joint dislocation, deformity, neurovascular compromise | Successful reduction, Post-reduction films adequate, Neurovascular intact post-reduction, Failed closed reduction | — | — |
| `ganglion_aspiration` | Ganglion Cyst Aspiration | ganglion cyst, wrist mass, hand mass, dorsal wrist swelling | Aspirated clear gelatinous fluid, Steroid injected, Cyst decompressed, Recurrence counseling given | — | — |
| `joint_aspiration` | Arthrocentesis | septic joint, gout, effusion, joint pain | Clear, Turbid/purulent, Bloody, Crystal positive | — | — |
| `nursemaids_elbow` | Nursemaid's Elbow Reduction | radial head subluxation, pediatric arm not moving, mechanism of pulling on arm, toddler elbow injury | Hyperpronation technique - successful, Supination/flexion technique - successful, Palpable click, Child using arm post-reduction | — | — |
| `pelvic_binder` | Pelvic Binder Application | pelvic fracture, open-book pelvis, hemodynamic instability with pelvic trauma | Binder applied at greater trochanters, Hemodynamic improvement, Maintained pending OR | — | — |
| `procedural_sedation` | Procedural Sedation | fracture reduction, dislocation reduction, abscess drainage, cardioversion | Ketamine used, Propofol used, Etomidate used, Adequate sedation achieved, No complications | — | — |
| `shoulder_reduction` | Shoulder Dislocation Reduction | anterior shoulder dislocation, posterior shoulder dislocation, recurrent dislocation | External rotation technique, Cunningham technique, Traction-countertraction, Stimson technique, Post-reduction films confirmed | — | — |
| `splint_cast` | Splint/Cast | fracture, sprain, immobilization | Splint applied, Cast applied, Reduction performed | — | — |
| `traction_splint` | Traction Splint | femur fracture, mid-shaft femur, pre-hospital stabilization | Hare traction applied, Thomas splint applied, Neurovascular intact post-application | — | — |

### Point of Care

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `bedside_us` | Bedside Ultrasound | procedural guidance, rapid assessment | — | — | — |
| `covid_rapid` | COVID Rapid Test | respiratory illness, fever, exposure | Positive, Negative | — | — |
| `istat` | iSTAT (POC Blood Gas) | acid-base, electrolytes, respiratory | — | — | — |
| `poc_glucose` | POC Glucose | altered mental status, diabetes, DKA, hypoglycemia | Normal, Hypoglycemia, Hyperglycemia, Critical high | 70-140 mg/dL | — |
| `rapid_flu` | Rapid Influenza | fever, myalgia, respiratory illness | Positive Flu A, Positive Flu B, Negative | — | — |
| `rapid_strep` | Rapid Strep | sore throat, pharyngitis | Positive, Negative | — | centor_mcisaac |
| `rsv_rapid` | RSV Rapid Test | respiratory illness, pediatric, bronchiolitis, wheezing | Positive, Negative | — | — |

### Pulmonary

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `chest_tube` | Chest Tube (Tube Thoracostomy) | pneumothorax, hemothorax, empyema, traumatic hemopneumothorax | Air evacuated, Blood evacuated, Lung re-expanded, Continuous air leak, Output ___ mL | — | — |
| `needle_decompression` | Needle Decompression | tension pneumothorax, traumatic arrest, sudden decompensation | Rush of air, Hemodynamic improvement, Followed by chest tube | — | — |
| `thoracentesis` | Thoracentesis | pleural effusion, dyspnea, empyema | Transudative, Exudative, Empyema, Bloody | — | — |

### Resuscitation

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `autotransfusion` | Autotransfusion (Cell Saver) | massive hemothorax, autologous blood recovery, Jehovah's Witness patient | Collected and reinfused ___ mL, Successful autotransfusion | — | — |
| `blood_warmer` | Blood/Fluid Warmer | massive transfusion, hypothermia prevention, rapid fluid resuscitation | Level 1 infuser used, Belmont rapid infuser, Warm fluids administered | — | — |
| `cpr` | CPR/Code Management | cardiac arrest, PEA, asystole, VFib, pulseless VT | ROSC achieved, Asystole - pronounced, PEA - ongoing, Total arrest time ___ | — | — |
| `push_dose_pressors` | Push-Dose Pressors | peri-intubation hypotension, transient hypotension, bridge to vasopressor drip | Phenylephrine push-dose, Epinephrine push-dose, Hemodynamic improvement | — | — |
| `rapid_infuser` | Rapid Infuser/Massive Transfusion | hemorrhagic shock, massive transfusion protocol, GI bleed, trauma | MTP activated, pRBC transfused ___ units, FFP given, Platelets given, Cryoprecipitate given | — | — |
| `reboa` | REBOA | non-compressible torso hemorrhage, traumatic arrest, hemorrhagic shock | Zone 1 occlusion, Zone 3 occlusion, Hemodynamic improvement, Bridge to OR | — | — |
| `targeted_temp_mgmt` | Targeted Temperature Management | post-cardiac arrest, ROSC, neuroprotection | Cooling initiated, Target temp achieved 33°C, Target temp achieved 36°C, Rewarming phase | — | — |
| `vasopressor_infusion` | Vasopressor/Inotrope Infusion | septic shock, cardiogenic shock, refractory hypotension, post-arrest | Norepinephrine started, Vasopressin added, Epinephrine started, Dobutamine for inotropy, MAP >65 achieved | — | sepsis |

### Toxicology

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `activated_charcoal` | Activated Charcoal | acute ingestion, overdose within 1-2 hours, decontamination | Administered PO, Administered via NG, Tolerated well, Vomited | — | — |
| `skin_decontamination` | Skin Decontamination | chemical exposure, hazmat, organophosphate exposure, caustic exposure | Full body decontamination, Partial decontamination, Copious water irrigation | — | — |
| `whole_bowel_irrigation` | Whole Bowel Irrigation | sustained-release ingestion, iron overdose, body packing, lithium overdose | GoLYTELY administered, Clear rectal effluent achieved, Ongoing irrigation | — | — |

### Vascular Access

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `arterial_line` | Arterial Line | continuous BP monitoring, hemodynamic instability, frequent ABG sampling, vasopressor titration | Radial placed, Femoral placed, Brachial placed, US-guided | — | — |
| `central_line` | Central Line Placement | vasopressor administration, difficult IV access, CVP monitoring, rapid fluid resuscitation | IJ placed, Subclavian placed, Femoral placed, US-guided, Confirmed by CXR | — | — |
| `io_access` | Intraosseous Access | cardiac arrest, failed IV access, pediatric emergency, critical access needed | Tibial IO placed, Humeral IO placed, Sternal IO placed, Good flow confirmed | — | — |
| `us_guided_piv` | Ultrasound-Guided Peripheral IV | difficult IV access, obesity, IV drug use, dehydration, ESRD, failed blind attempts | Successful first-attempt, Long catheter placed (basilic/brachial), Short-axis technique, Long-axis technique, Multiple attempts required | — | — |
| `ej_iv` | External Jugular IV | difficult peripheral access, failed peripheral IV, emergency vascular access, volume resuscitation | Successful cannulation, Trendelenburg positioning used, Good flow confirmed, Dislodged/positional | — | — |

### Wound

| ID | Name | Common Indications | Quick Findings | Normal Range | Feeds CDRs |
|----|------|--------------------|----------------|--------------|------------|
| `abscess_packing` | Abscess Repacking | abscess follow-up, wound packing change, healing assessment | Repacked, Healing well, Persistent drainage, Cavity closing | — | — |
| `burn_care` | Burn Wound Care | thermal burn, chemical burn, electrical burn, scald burn | Superficial (1st degree), Partial thickness (2nd degree), Full thickness (3rd degree), Debrided and dressed | — | — |
| `escharotomy` | Escharotomy | circumferential burn, compartment syndrome from burn, vascular compromise | Performed on extremity, Performed on chest, Improved perfusion, Improved ventilation | — | — |
| `fishhook_removal` | Fishhook Removal | embedded fishhook, puncture wound, retained foreign body | Retrograde technique, Advance and cut, String-yank technique, Needle cover technique | — | — |
| `foreign_body_removal` | Foreign Body Removal | embedded foreign body, splinter, glass, metal fragment | Foreign body removed, Partially removed, Retained foreign body | — | — |
| `incision_drainage` | Incision & Drainage | abscess, wound infection | Simple abscess, Complex abscess, Wound packing | — | — |
| `ingrown_toenail` | Ingrown Toenail/Partial Nail Avulsion | ingrown toenail, paronychia, infected nail border | Partial nail avulsion, Complete nail removal, Digital block performed, Phenol matrixectomy | — | — |
| `laceration_repair` | Laceration Repair | laceration, wound closure, traumatic wound, facial laceration | Simple suture repair, Layered closure, Staples, Dermabond/tissue adhesive, Steri-strips | — | — |
| `nail_bed_repair` | Nail Bed Repair | nail bed laceration, finger crush, nail avulsion with laceration, tuft fracture | Nail removed and bed repaired, Absorbable sutures placed, Nail replaced as splint, Digital block performed | — | — |
| `nail_trephination` | Nail Trephination | subungual hematoma, nail bed injury, finger crush injury | Hematoma drained, Pain relief achieved, Nail bed intact | — | — |
| `ring_removal` | Ring Removal | finger swelling, ring constriction, vascular compromise | String wrap technique, Ring cutter used, Lubrication/elevation, Intact ring removed | — | — |
| `wound_care` | Wound Irrigation/Debridement | contaminated wound, bite wound, crush injury, abrasion | Irrigated and dressed, Debridement performed, Foreign body removed | — | — |
| `wound_exploration` | Wound Exploration | deep laceration, tendon injury evaluation, nerve injury evaluation, foreign body concern, hand laceration | Tendon intact, Partial tendon laceration, Complete tendon laceration, Nerve intact, Foreign body found, No deep structure injury | — | — |

