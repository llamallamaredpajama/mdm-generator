# Clinical Decision Rules: Complete LLM Calculation & Application Reference

> **Purpose:** This document provides structured, calculable instructions for every major clinical decision rule used in emergency medicine. Each entry includes the rule's purpose, exact scoring criteria, calculation method, and clinical interpretation so that an LLM can accurately compute and apply each rule.

> **Important Disclaimer:** Clinical decision rules supplement—never replace—clinical judgment. Always interpret scores in the context of the individual patient.

---

# TABLE OF CONTENTS

1. TRAUMA
2. CARDIOVASCULAR
3. PULMONARY
4. NEUROLOGY
5. GASTROINTESTINAL
6. GENITOURINARY
7. INFECTIOUS DISEASE
8. TOXICOLOGY
9. ENDOCRINE
10. HEMATOLOGY / COAGULATION
11. PEDIATRIC — Additional
12. PROCEDURAL / AIRWAY
13. ENVIRONMENTAL
14. DISPOSITION / RISK STRATIFICATION

---

# TRAUMA

---

## Canadian CT Head Rule (CCHR)

**Application:** Determines if CT is needed in patients with minor head injury (GCS 13–15, witnessed LOC, amnesia, or disorientation). NOT for patients on anticoagulants, age <16, or with no LOC/amnesia/disorientation.

**Prerequisite criteria (all must be met to apply the rule):**

- Blunt head trauma
- GCS 13–15
- Age ≥16 years
- Witnessed loss of consciousness, definite amnesia, or witnessed disorientation

**High-Risk Criteria (for neurosurgical intervention):**

1. GCS < 15 at 2 hours post-injury
2. Suspected open or depressed skull fracture
3. Any sign of basal skull fracture (hemotympanum, raccoon eyes, Battle sign, CSF otorrhea/rhinorrhea)
4. ≥2 episodes of vomiting
5. Age ≥65 years

**Medium-Risk Criteria (for brain injury on CT):** 6. Amnesia before impact ≥30 minutes 7. Dangerous mechanism (pedestrian struck by vehicle, occupant ejected from vehicle, fall from ≥3 feet or ≥5 stairs)

**Calculation & Interpretation:**

- If ANY high-risk criterion is present → CT is indicated (high risk for neurosurgical intervention)
- If ANY medium-risk criterion is present → CT is indicated (medium risk for brain injury on CT)
- If NO criteria present → CT is not required (rule out)
- Sensitivity: ~100% for neurosurgical intervention, ~98.4% for clinically important brain injury

---

## NEXUS Head CT Rule

**Application:** Decision instrument for CT after blunt head trauma. Age ≥16. Applied to patients with blunt head trauma.

**Criteria (any ONE positive = CT indicated):**

1. Evidence of significant skull fracture
2. Scalp hematoma
3. Neurological deficit
4. Altered level of alertness
5. Abnormal behavior
6. Coagulopathy (including anticoagulant/antiplatelet use)
7. Persistent vomiting
8. Age ≥65 years

**Calculation & Interpretation:**

- If ALL criteria are absent → CT not indicated (sensitivity ~99%)
- If ANY criterion is present → CT is indicated

---

## PECARN Pediatric Head CT Rule

**Application:** Identifies children at very low risk of clinically important traumatic brain injury (ciTBI) after blunt head trauma. Two age-stratified algorithms.

### Children < 2 years old

**Step 1 — Any of these present? (Highest risk):**

- GCS ≤ 14
- Palpable skull fracture
- Altered mental status (agitation, somnolence, repetitive questioning, slow response)

→ If YES: CT recommended (4.4% risk of ciTBI)

**Step 2 — If Step 1 is NO, any of these present?**

- Occipital, parietal, or temporal scalp hematoma
- History of LOC ≥5 seconds
- Severe mechanism of injury (MVC with patient ejection/death of another passenger/rollover, pedestrian/cyclist without helmet struck by motorized vehicle, fall >3 feet, head struck by high-impact object)
- Not acting normally per parent

→ If YES: Observation vs. CT based on clinical judgment, physician experience, worsening symptoms, age <3 months, parental preference (0.9% risk of ciTBI) → If NO to both Step 1 and Step 2: CT NOT recommended (<0.02% risk of ciTBI)

### Children ≥ 2 years old

**Step 1 — Any of these present? (Highest risk):**

- GCS ≤ 14
- Altered mental status (agitation, somnolence, repetitive questioning, slow response)
- Signs of basilar skull fracture

→ If YES: CT recommended (4.3% risk of ciTBI)

**Step 2 — If Step 1 is NO, any of these present?**

- History of LOC
- History of vomiting
- Severe mechanism of injury (same definition as above)
- Severe headache

→ If YES: Observation vs. CT based on clinical judgment (0.9% risk of ciTBI) → If NO to both Step 1 and Step 2: CT NOT recommended (<0.05% risk of ciTBI)

---

## CATCH Rule (Canadian Assessment of Tomography for Childhood Head Injury)

**Application:** CT decision for children (0–16 years) with minor head injury (GCS 13–15) and witnessed LOC, disorientation, irritability, or vomiting.

**High-Risk Criteria (need for neurosurgical intervention):**

1. GCS < 15 at 2 hours post-injury
2. Suspected open or depressed skull fracture
3. Worsening headache
4. Irritability on examination

**Medium-Risk Criteria (brain injury on CT):** 5. Any sign of basal skull fracture (hemotympanum, raccoon eyes, Battle sign, CSF otorrhea/rhinorrhea) 6. Large boggy scalp hematoma 7. Dangerous mechanism (MVC, fall from ≥3 feet or ≥5 stairs, bicycle without helmet)

**Calculation & Interpretation:**

- Any high-risk criterion → CT indicated (100% sensitive for neurosurgical intervention)
- Any medium-risk criterion → CT indicated
- None present → CT not required

---

## CHALICE Rule (Children's Head injury ALgorithm for the prediction of Important Clinical Events)

**Application:** UK-derived rule for children (<16 years) presenting with any severity of head injury (not limited to GCS 13–15).

**Criteria (any ONE = CT indicated):**

_History:_

1. Witnessed LOC > 5 minutes
2. History of amnesia (anterograde or retrograde) > 5 minutes
3. Abnormal drowsiness (excess for age)
4. ≥3 discrete vomiting episodes after head injury
5. Clinical suspicion of NAI (non-accidental injury)
6. Seizure after head injury in a patient with no history of epilepsy

_Examination:_ 7. GCS < 14 (or GCS < 15 if infant < 1 year) 8. Suspicion of penetrating or depressed skull fracture, or tense fontanelle 9. Signs of basal skull fracture 10. Positive focal neurological sign 11. Bruise, swelling, or laceration > 5 cm if age < 1 year

_Mechanism:_ 12. High-speed MVC as passenger (>40 mph) 13. Fall > 3 meters 14. High-speed projectile injury

**Calculation & Interpretation:**

- ANY criterion present → CT indicated
- NONE present → CT not required (sensitivity 98% for clinically significant intracranial pathology)

---

## Canadian C-Spine Rule (CCR)

**Application:** Determines need for c-spine imaging in alert (GCS 15), stable trauma patients age ≥16 with potential c-spine injury. NOT applicable if: GCS <15, age <16, non-trauma, known vertebral disease, previous c-spine surgery, or unstable vital signs.

**Step 1 — Any High-Risk Factor? (mandates imaging)**

1. Age ≥65 years
2. Dangerous mechanism:
    - Fall from ≥3 feet / ≥5 stairs
    - Axial load to head (e.g., diving)
    - MVC high speed (>100 km/hr), rollover, ejection
    - Motorized recreational vehicle accident
    - Bicycle collision
3. Paresthesias in extremities

→ If YES to any → Imaging required. STOP.

**Step 2 — Any Low-Risk Factor? (allows safe assessment of ROM)**

1. Simple rear-end MVC (excludes: pushed into oncoming traffic, hit by bus/large truck, rollover, hit by high-speed vehicle)
2. Sitting position in ED
3. Ambulatory at any time since injury
4. Delayed onset of neck pain (not immediate)
5. Absence of midline c-spine tenderness

→ If NO low-risk factor present → Imaging required. STOP. → If ANY low-risk factor present → Proceed to Step 3.

**Step 3 — Can the patient actively rotate neck 45° left AND right?** → If YES → No imaging required → If NO → Imaging required

**Interpretation:**

- Sensitivity ~99.4% for clinically important c-spine injury
- Superior to NEXUS in direct comparison studies

---

## NEXUS Low-Risk Criteria (NLC)

**Application:** Clears the c-spine without imaging in trauma patients. All 5 criteria must be met to clear.

**The 5 Criteria (ALL must be present to clear c-spine):**

1. No posterior midline cervical spine tenderness
2. No evidence of intoxication
3. Normal level of alertness (GCS 15)
4. No focal neurological deficit
5. No painful distracting injury

**Calculation & Interpretation:**

- ALL 5 criteria met → C-spine can be cleared clinically without imaging
- ANY criterion NOT met → C-spine imaging required
- Sensitivity: ~99.6% (but lower specificity than Canadian C-Spine Rule)

---

## NEXUS Chest CT Rule

**Application:** Identifies blunt trauma patients who require chest CT.

**Criteria (any ONE present = chest CT indicated):**

1. Abnormal chest x-ray (any abnormality including widened mediastinum)
2. Distracting injury
3. Chest wall tenderness
4. Sternal tenderness
5. Thoracic spine tenderness
6. Scapular tenderness
7. Mechanism: high-speed MVC (>35 mph) or fall >20 feet

**Calculation & Interpretation:**

- ALL criteria absent → Chest CT not indicated (sensitivity ~99%)
- ANY criterion present → Chest CT indicated

---

## NEXUS Chest X-Ray Rule

**Application:** Identifies blunt trauma patients who require chest radiography.

**Criteria (any ONE present = CXR indicated):**

1. Chest tenderness
2. Altered mental status
3. Intoxication
4. Distracting injury
5. Abnormal auscultation
6. Rapid deceleration mechanism (fall >20 ft, MVC >40 mph)
7. Thoracic spine tenderness

**Calculation & Interpretation:**

- ALL criteria absent → CXR not indicated
- ANY criterion present → CXR indicated

---

## PECARN Blunt Abdominal Trauma Rule (Pediatric)

**Application:** Identifies children (<18 years) with blunt torso trauma at very low risk of intra-abdominal injury requiring acute intervention (IAI-AI). Helps guide CT decision-making.

**Predictors of IAI-AI (each scored):**

1. Low systolic blood pressure for age (age-adjusted hypotension)
2. Abdominal tenderness on exam
3. Femur fracture
4. Increased liver enzymes (AST >200 or ALT >125)
5. Microscopic hematuria (≥5 RBCs/HPF)
6. Initial hematocrit <30%

**Additional consideration:** 7. Abdominal wall trauma (abrasion, contusion, or seatbelt sign)

**Calculation & Interpretation:**

- If NONE of the above findings are present → Very low risk of IAI-AI (<0.1%); CT can generally be avoided
- If ANY finding is present → Risk increases; CT abdomen/pelvis should be considered
- Presence of ≥2 predictors significantly increases risk

---

## Ottawa Ankle Rules

**Application:** Determines need for radiography in ankle injuries (age ≥2 years, though originally validated ≥18). Ankle X-ray series required if pain in the malleolar zone AND any of the following:

**Criteria for Ankle X-Ray:**

1. Bone tenderness along the distal 6 cm of the posterior edge of the lateral malleolus (or tip)
2. Bone tenderness along the distal 6 cm of the posterior edge of the medial malleolus (or tip)
3. Inability to weight bear both immediately AND in the ED (4 steps)

**Criteria for Foot X-Ray:** (see Ottawa Foot Rules)

**Calculation & Interpretation:**

- If NONE of the above → X-ray not indicated (sensitivity ~98% for fracture)
- If ANY criterion present → X-ray indicated
- Note: Rule applies only if there is pain/tenderness in the malleolar zone

---

## Ottawa Knee Rules

**Application:** Determines need for knee radiography after acute knee injury in patients age ≥2 years.

**Criteria (any ONE = knee X-ray indicated):**

1. Age ≥55 years
2. Isolated tenderness of the patella (no other knee bone tenderness)
3. Tenderness at the head of the fibula
4. Inability to flex the knee to 90°
5. Inability to weight bear both immediately AND in the ED (4 steps, regardless of limping)

**Calculation & Interpretation:**

- If NONE present → X-ray not indicated (sensitivity ~99%)
- If ANY present → X-ray indicated

---

## Ottawa Foot Rules

**Application:** Determines need for foot radiography in midfoot injuries. Applied when there is pain in the midfoot zone.

**Criteria (any ONE = foot X-ray indicated):**

1. Bone tenderness at the base of the 5th metatarsal
2. Bone tenderness at the navicular bone
3. Inability to weight bear both immediately AND in the ED (4 steps)

**Calculation & Interpretation:**

- If NONE present → X-ray not indicated
- If ANY present → X-ray indicated

---

## Pittsburgh Knee Rules

**Application:** Alternative to Ottawa Knee Rules for determining need for knee radiography.

**X-ray indicated if EITHER:**

1. Blunt trauma or a fall as the mechanism of injury AND (age <12 or age >50)
2. Inability to walk 4 weight-bearing steps in the ED

**Calculation & Interpretation:**

- If neither criterion met → X-ray not indicated
- If either met → X-ray indicated

---

# CARDIOVASCULAR

---

## HEART Score

**Application:** Risk stratifies emergency department chest pain patients for 6-week risk of major adverse cardiac events (MACE: death, MI, revascularization).

**Criteria (each scored 0, 1, or 2):**

|Component|0 points|1 point|2 points|
|---|---|---|---|
|**H**istory|Slightly suspicious|Moderately suspicious|Highly suspicious|
|**E**CG|Normal|Non-specific repolarization abnormality (BBB, LVH, digoxin, unchanged ST depression)|Significant ST deviation (new ST depression or elevation)|
|**A**ge|<45|45–64|≥65|
|**R**isk factors|None known|1–2 risk factors (HTN, DM, hyperlipidemia, smoking, obesity, family history)|≥3 risk factors OR history of atherosclerotic disease|
|**T**roponin|≤ normal limit|1–3× normal limit|>3× normal limit|

_History interpretation: Highly suspicious = classic chest pressure with radiation, exercise-related, accompanied by diaphoresis/nausea/vomiting. Moderately suspicious = mostly typical features. Slightly suspicious = mostly atypical features._

**Total Score Range: 0–10**

**Interpretation:**

|Score|Risk Category|6-Week MACE Risk|Recommended Action|
|---|---|---|---|
|0–3|Low|0.9–1.7%|Consider discharge with outpatient follow-up|
|4–6|Moderate|12–16.6%|Admit for observation, serial troponins, further workup|
|7–10|High|50–65%|Early invasive management / cardiology consultation|

---

## HEART Pathway

**Application:** Accelerated diagnostic protocol combining HEART score with serial troponins (0 and 3 hours) to identify low-risk chest pain patients for early discharge.

**Protocol:**

1. Calculate HEART Score at presentation
2. If HEART Score 0–3 AND initial troponin negative:
    - Repeat troponin at 3 hours
    - If 3-hour troponin also negative → Low risk, candidate for early discharge
3. If HEART Score ≥4 OR any troponin elevated → Not low risk, requires further workup

**Interpretation:**

- Low-risk pathway: HEART 0–3 + two negative troponins → ~0.4% 30-day MACE rate
- Allows safe early discharge of ~40% of chest pain patients

---

## TIMI Risk Score (UA/NSTEMI)

**Application:** Predicts 14-day risk of all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization in patients with UA/NSTEMI.

**Criteria (1 point each, 7 total):**

1. Age ≥65 years
2. ≥3 CAD risk factors (family history of CAD, hypertension, hypercholesterolemia, diabetes, current smoker)
3. Known CAD (≥50% stenosis on prior cath)
4. Aspirin use in the past 7 days
5. ≥2 anginal episodes in the past 24 hours
6. ST deviation ≥0.5 mm on presenting ECG
7. Elevated cardiac biomarker (troponin or CK-MB)

**Score Range: 0–7**

**Interpretation:**

|Score|14-Day Event Rate|
|---|---|
|0–1|~5%|
|2|~8%|
|3|~13%|
|4|~20%|
|5|~26%|
|6–7|~41%|

- Score 0–2: Low risk → Consider noninvasive testing
- Score 3–4: Intermediate → Benefit from early invasive strategy
- Score 5–7: High → Strong benefit from early invasive strategy / aggressive medical therapy

---

## Vancouver Chest Pain Rule

**Application:** Identifies low-risk chest pain patients suitable for early ED discharge.

**Low risk (safe for discharge) if ALL of the following:**

1. No new ischemic ECG changes
2. No prior history of ACS or nitrate use
3. Age <40
4. No chest pain typified as pressure
5. Low to normal initial troponin

**Interpretation:**

- All criteria met → Low risk for ACS, safe for early discharge consideration
- Any criterion not met → Further workup needed

---

## EDACS (Emergency Department Assessment of Chest Pain Score)

**Application:** Identifies low-risk chest pain for accelerated disposition combined with 0 and 2-hour troponins.

**Scoring:**

|Variable|Points|
|---|---|
|Age 18–45|+2|
|Age 46–50|+4|
|Age 51–55|+6|
|Age 56–60|+8|
|Age 61–65|+10|
|Age 66–70|+12|
|Age 71–75|+14|
|Age 76–80|+16|
|Age 81–85|+18|
|Age ≥86|+20|
|Male sex|+6|
|Age 18–45 AND known CAD or ≥3 risk factors|+4|
|Age 46–50 AND known CAD or ≥3 risk factors|+2|
|Diaphoresis|+3|
|Pain radiates to arm or shoulder|+5|
|Pain occurred or worsened with inspiration|−4|
|Pain is reproduced by palpation|−6|

**EDACS-ADP (Accelerated Diagnostic Protocol):**

- EDACS score <16 AND ECG shows no new ischemia AND 0h and 2h troponins both negative → **Low risk** (~1% 30-day MACE)
- Any above criteria not met → **Not low risk**

---

## High-Sensitivity Troponin 0/1-Hour and 0/3-Hour Algorithms (ESC)

**Application:** Rapid rule-in/rule-out of acute MI using high-sensitivity troponin (hs-cTn).

### 0/1-Hour Algorithm (preferred with hs-cTnT or hs-cTnI)

**Rule-OUT (both must be met):**

- Baseline hs-cTn very low (below limit of detection or assay-specific low cutoff)
- AND 1-hour change (delta) below assay-specific threshold

**Rule-IN (either):**

- Baseline hs-cTn markedly elevated (assay-specific high cutoff)
- OR 1-hour delta above assay-specific threshold

**Observe zone:**

- Neither ruled in nor ruled out → Serial troponin at 3 hours, clinical reassessment

### 0/3-Hour Algorithm

- Similar logic with 3-hour delta cutoffs
- Rule-out: hs-cTn <99th percentile URL at 0h AND <99th percentile at 3h with delta below threshold
- Rule-in: hs-cTn rising above 99th percentile with significant delta

_Note: Exact cutoffs are assay-specific (e.g., hs-cTnT by Roche, hs-cTnI by Abbott). Refer to institutional or ESC 2020 guidelines for specific numeric thresholds._

---

## Wells Criteria for PE

**Application:** Estimates pre-test probability of pulmonary embolism.

**Criteria:**

|Variable|Points|
|---|---|
|Clinical signs/symptoms of DVT (leg swelling, pain with palpation)|3.0|
|PE is #1 diagnosis, or equally likely|3.0|
|Heart rate > 100 bpm|1.5|
|Immobilization ≥3 days or surgery in the previous 4 weeks|1.5|
|Previous PE or DVT|1.5|
|Hemoptysis|1.0|
|Malignancy (treatment within 6 months or palliative)|1.0|

**Score Range: 0–12.5**

### Traditional (Three-Tier) Interpretation:

|Score|Pre-Test Probability|PE Prevalence|
|---|---|---|
|0–1|Low|~1.3%|
|2–6|Moderate|~16.2%|
|>6|High|~40.6%|

### Simplified (Two-Tier) Interpretation:

|Score|Category|Action|
|---|---|---|
|≤4|PE unlikely|D-dimer; if negative → PE excluded|
|>4|PE likely|CTPA (or V/Q if CTPA contraindicated)|

---

## Revised Geneva Score

**Application:** Alternative pre-test probability assessment for PE. Does not include subjective "PE most likely diagnosis" criterion.

**Original Revised Geneva:**

|Variable|Points|
|---|---|
|Age > 65 years|1|
|Previous DVT or PE|3|
|Surgery or fracture within 1 month|2|
|Active malignancy|2|
|Unilateral lower limb pain|3|
|Hemoptysis|2|
|Heart rate 75–94|3|
|Heart rate ≥95|5|
|Pain on lower limb deep venous palpation AND unilateral edema|4|

**Score Range: 0–25**

**Interpretation:**

|Score|Pre-Test Probability|
|---|---|
|0–3|Low (~8%)|
|4–10|Intermediate (~29%)|
|≥11|High (~74%)|

**Simplified Revised Geneva (each variable = 1 point):**

|Score|Probability|
|---|---|
|0–1|Low|
|2–4|Intermediate|
|≥5|High|

---

## PERC Rule (Pulmonary Embolism Rule-out Criteria)

**Application:** Rules out PE in LOW PRE-TEST PROBABILITY patients (gestalt <15% or Wells ≤4) without needing D-dimer. ALL 8 criteria must be negative. Only apply if clinician's pre-test gestalt is low.

**Criteria (ALL must be present / answered "No" to rule out PE):**

1. Age < 50 years
2. Heart rate < 100 bpm
3. SpO₂ ≥ 95% on room air
4. No hemoptysis
5. No estrogen use (OCP, HRT)
6. No prior DVT/PE
7. No unilateral leg swelling
8. No surgery or trauma requiring hospitalization within the past 4 weeks

**Calculation & Interpretation:**

- ALL 8 criteria met (all negative) → PE ruled out; no further testing needed (~1% miss rate)
- ANY criterion positive → PERC cannot rule out PE; proceed with D-dimer or CTPA based on pre-test probability

---

## PESI (Pulmonary Embolism Severity Index)

**Application:** Risk stratifies patients with CONFIRMED PE to predict 30-day mortality and guide disposition (inpatient vs. outpatient).

**Criteria:**

|Variable|Points|
|---|---|
|Age|Age in years (e.g., 70 yr = 70 points)|
|Male sex|+10|
|Cancer|+30|
|Heart failure|+10|
|Chronic lung disease|+10|
|Heart rate ≥110|+20|
|Systolic BP < 100 mmHg|+30|
|Respiratory rate ≥30|+20|
|Temperature < 36°C|+20|
|Altered mental status|+60|
|SpO₂ < 90%|+20|

**Score Interpretation:**

|Class|Score|30-Day Mortality|Risk|
|---|---|---|---|
|I|≤65|0–1.6%|Very low|
|II|66–85|1.7–3.5%|Low|
|III|86–105|3.2–7.1%|Intermediate|
|IV|106–125|4–11.4%|High|
|V|>125|10–24.5%|Very high|

- Class I–II: Consider outpatient treatment
- Class III–V: Inpatient management

---

## sPESI (Simplified PESI)

**Application:** Simplified version of PESI for PE risk stratification.

**Criteria (1 point each):**

1. Age > 80 years
2. Cancer (active or within past year)
3. Heart failure or chronic lung disease
4. Heart rate ≥110 bpm
5. Systolic BP < 100 mmHg
6. SpO₂ < 90%

**Score Range: 0–6**

**Interpretation:**

|Score|Risk|30-Day Mortality|
|---|---|---|
|0|Low risk|1.0%|
|≥1|High risk|10.9%|

- Score 0: Consider outpatient management
- Score ≥1: Inpatient management

---

## HESTIA Criteria

**Application:** Identifies PE patients safe for outpatient management. All items must be "No" for outpatient eligibility.

**Criteria (any ONE "Yes" = NOT safe for outpatient):**

1. Hemodynamically unstable (SBP <100, HR >100 requiring ICU)
2. Thrombolysis or embolectomy needed
3. Active bleeding or high risk for bleeding
4. > 24 hours of supplemental oxygen needed to maintain SpO₂ >90%
    
5. PE diagnosed while on anticoagulation
6. Severe pain needing IV pain medication >24 hours
7. Medical or social reason for admission >24 hours
8. Creatinine clearance <30 mL/min
9. Severe liver impairment
10. Pregnant
11. History of heparin-induced thrombocytopenia

**Interpretation:**

- ALL criteria answered "No" → Safe for outpatient management
- ANY criterion "Yes" → Inpatient management recommended

---

## YEARS Algorithm

**Application:** Simplified diagnostic pathway for suspected PE that reduces unnecessary CTPA.

**Three YEARS Items:**

1. Clinical signs of DVT (leg swelling, pain with palpation of deep veins)
2. Hemoptysis
3. PE is the most likely diagnosis

**Algorithm:**

- If **0 YEARS items** present AND D-dimer <1000 ng/mL → PE excluded
- If **≥1 YEARS item** present AND D-dimer <500 ng/mL → PE excluded
- If D-dimer above the relevant threshold → CTPA indicated

**Interpretation:**

- Safely excludes PE with adjusted D-dimer thresholds
- Reduces CTPA use by ~14% compared to standard Wells + fixed D-dimer threshold

---

## Wells Criteria for DVT

**Application:** Estimates pre-test probability of deep vein thrombosis.

**Criteria:**

|Variable|Points|
|---|---|
|Active cancer (treatment within 6 months or palliative)|1|
|Paralysis, paresis, or recent plaster immobilization of lower extremity|1|
|Recently bedridden >3 days or major surgery within 12 weeks|1|
|Localized tenderness along distribution of deep venous system|1|
|Entire leg swelling|1|
|Calf swelling >3 cm compared to asymptomatic leg (measured 10 cm below tibial tuberosity)|1|
|Pitting edema confined to symptomatic leg|1|
|Collateral superficial veins (non-varicose)|1|
|Previously documented DVT|1|
|Alternative diagnosis at least as likely as DVT|−2|

**Score Range: −2 to 9**

**Interpretation:**

|Score|Probability|DVT Prevalence|Action|
|---|---|---|---|
|≤0|Low (unlikely)|~5%|D-dimer; if negative → DVT excluded|
|1–2|Moderate|~17%|D-dimer; if negative → DVT excluded; if positive → ultrasound|
|≥3|High (likely)|~53%|Ultrasound (D-dimer not sufficient to exclude)|

**Simplified (Two-Tier):**

- Score ≤1: DVT unlikely → D-dimer
- Score ≥2: DVT likely → Ultrasound

---

## ADvISED Score / ADD-RS (Aortic Dissection Detection Risk Score)

**Application:** Risk stratifies patients for acute aortic dissection, often combined with D-dimer.

### ADD-RS (AHA/ACC Guideline-Based)

**Three categories, 1 point each (max 3):**

**High-risk conditions (1 point if ANY present):**

- Marfan syndrome or other connective tissue disease
- Family history of aortic disease
- Known aortic valve disease
- Known thoracic aortic aneurysm
- Previous aortic manipulation/surgery

**High-risk pain features (1 point if ANY present):**

- Chest, back, or abdominal pain described as:
    - Abrupt onset
    - Severe intensity
    - Ripping or tearing quality

**High-risk exam findings (1 point if ANY present):**

- Evidence of perfusion deficit (pulse deficit, SBP differential, focal neurological deficit)
- New aortic insufficiency murmur
- Hypotension or shock

**Score Range: 0–3**

**Interpretation (combined with D-dimer):**

|ADD-RS|D-dimer|Interpretation|
|---|---|---|
|0|<500 ng/mL|Aortic dissection effectively ruled out|
|0|≥500 ng/mL|Advanced imaging indicated|
|1|<500 ng/mL|Consider further imaging (low risk but not zero)|
|≥2|Any|Advanced imaging indicated regardless of D-dimer|

_Note: D-dimer is most useful with ADD-RS 0–1. Score ≥2 should proceed directly to imaging (CTA aorta)._

---

## San Francisco Syncope Rule (SFSR)

**Application:** Predicts short-term (7-day) serious outcomes in patients with syncope (true LOC with spontaneous return).

**Criteria — "CHESS" mnemonic (any ONE = high risk):**

1. **C**ongestive heart failure history
2. **H**ematocrit < 30%
3. **E**CG abnormality (non-sinus rhythm or new changes)
4. **S**hortness of breath
5. **S**ystolic BP < 90 mmHg at triage

**Interpretation:**

- ALL criteria absent → Low risk (~2% 7-day serious outcome rate)
- ANY criterion present → Not low risk; consider further workup/admission
- Note: Subsequent validation studies have shown variable sensitivity (75–98%); this rule has been criticized and is NOT as well-validated as some alternatives

---

## Canadian Syncope Risk Score (CSRS)

**Application:** Predicts 30-day serious adverse events after syncope in ED patients (age ≥16, presenting within 24 hours of syncope).

**Criteria:**

|Variable|Points|
|---|---|
|**Predisposition**||
|Vasovagal predisposition (triggered by prolonged standing, crowded/hot place, fear/emotion/pain)|−1|
|Heart disease history (CAD, atrial fibrillation, CHF, valvular disease)|+1|
|**Presentation**||
|Any ED SBP < 90 or > 180 mmHg|+2|
|Elevated troponin (>99th percentile URL)|+2|
|**Investigations**||
|Abnormal QRS axis (<−30° or >100°)|+1|
|QRS duration >130 ms|+1|
|QTc >480 ms|+2|
|**Diagnosis in ED**||
|Vasovagal syncope|−2|
|Cardiac syncope|+2|

**Score Range: −3 to +11**

**Interpretation:**

|Score|30-Day Risk|Risk Category|
|---|---|---|
|−3 to 0|~0.4–0.7%|Very low|
|1–3|~2.7–5.1%|Low|
|4–5|~9.4–12.0%|Medium|
|6–8|~17.2–25.9%|High|
|≥9|~34.8%|Very high|

- Score ≤0: Consider safe discharge with outpatient follow-up
- Score ≥4: Consider admission or expedited cardiac workup

---

## OESIL Score

**Application:** Predicts 1-year all-cause mortality in patients presenting with syncope.

**Criteria (1 point each):**

1. Age > 65 years
2. Cardiovascular disease in clinical history
3. Syncope without prodrome
4. Abnormal ECG (any abnormality including rhythm changes, conduction abnormalities, hypertrophy)

**Score Range: 0–4**

**Interpretation:**

|Score|1-Year Mortality|
|---|---|
|0|0%|
|1|0.8%|
|2|19.6%|
|3|34.7%|
|4|57.1%|

---

## Boston Syncope Rule

**Application:** Identifies need for hospital admission after syncope based on risk of adverse outcomes.

**Criteria (any ONE = admit):**

_Signs/Symptoms:_

1. Signs/symptoms of ACS
2. Signs of conduction disease (new or not previously evaluated: BBB, prolonged QTc, 2nd or 3rd degree AV block, or sick sinus syndrome with alternating brady/tachycardia)
3. Worrisome cardiac history (history of congestive heart failure, CAD, valvular disease, or cardiomyopathy)
4. Family history of sudden death
5. Persistent vital sign abnormalities in ED
6. Volume depletion (signs or symptoms)
7. Primary CNS event (focal deficit, new or severe headache, sudden onset)
8. Positive troponin

**Interpretation:**

- Any criterion present → Admission indicated
- No criteria present → Consider discharge
- Sensitivity ~97% for 30-day serious outcomes

---

## FAINT Score

**Application:** Risk stratification for syncope, incorporating BNP.

**Criteria:**

|Variable|Points|
|---|---|
|History of heart **F**ailure|1|
|History of **A**rrhythmia|1|
|**I**nitial abnormal ECG|1|
|Elevated pro-B**N**P (NT-proBNP)|1|
|Elevated **T**roponin|1|

**Score Range: 0–5**

**Interpretation:**

- Score 0: Low risk (~4% 30-day adverse event rate)
- Score ≥1: Increasing risk; further evaluation recommended

---

## CHA₂DS₂-VASc Score

**Application:** Estimates annual stroke risk in patients with non-valvular atrial fibrillation to guide anticoagulation decisions.

**Criteria:**

|Variable|Points|
|---|---|
|**C**ongestive heart failure (or LV systolic dysfunction)|1|
|**H**ypertension|1|
|**A**ge ≥75 years|2|
|**D**iabetes mellitus|1|
|**S**troke/TIA/thromboembolism history|2|
|**V**ascular disease (prior MI, PAD, aortic plaque)|1|
|**A**ge 65–74 years|1|
|**S**ex category (female)|1|

**Score Range: 0–9**

**Interpretation:**

|Score|Annual Stroke Risk|Anticoagulation Recommendation|
|---|---|---|
|0 (male) or 1 (female)|~0% (low)|No anticoagulation needed (female sex alone does not warrant treatment)|
|1 (male)|~1.3%|Consider anticoagulation (OAC preferred over aspirin)|
|≥2|≥2.2% (increasing with score)|Oral anticoagulation recommended|

---

## HAS-BLED Score

**Application:** Assesses risk of major bleeding in patients on anticoagulation for atrial fibrillation. Helps weigh bleeding risk against stroke risk.

**Criteria (1 point each):**

|Letter|Variable|Definition|
|---|---|---|
|**H**|Hypertension|Uncontrolled SBP >160 mmHg|
|**A**|Abnormal renal/liver function|1 point each: Cr >2.26 mg/dL or dialysis/transplant; chronic liver disease or bilirubin >2× normal + ALT/AST >3× normal|
|**S**|Stroke|Prior stroke|
|**B**|Bleeding|Prior major bleeding or predisposition|
|**L**|Labile INR|Unstable/high INRs, TTR <60%|
|**E**|Elderly|Age >65|
|**D**|Drugs/alcohol|1 point each: antiplatelet/NSAID use; alcohol ≥8 drinks/week|

**Score Range: 0–9**

**Interpretation:**

|Score|Annual Major Bleeding Risk|
|---|---|
|0|1.13%|
|1|1.02%|
|2|1.88%|
|3|3.74%|
|4|8.70%|
|≥5|12.50%|

- Score ≥3: High bleeding risk → Does NOT necessarily mean "don't anticoagulate" but rather flag for closer monitoring and modifiable risk factor reduction
- HAS-BLED should not be used alone to withhold anticoagulation

---

## Ottawa Aggressive Protocol (Acute Atrial Fibrillation)

**Application:** Guides ED management of recent-onset atrial fibrillation (<48 hours duration).

**Protocol:**

1. If hemodynamically unstable → Electrical cardioversion
2. If stable AND onset <48 hours (or confirmed by ECG):
    - **Rate Control First:** Attempt rate control if symptomatic from rate
    - **Chemical Cardioversion:**
        - Procainamide 1g IV over 60 min (preferred per Ottawa protocol) OR
        - Alternative: Ibutilide, flecainide, propafenone (if no structural heart disease)
    - **If chemical cardioversion fails:** Electrical cardioversion
3. If onset >48 hours or uncertain duration → Rate control + anticoagulation; TEE-guided cardioversion if desired
4. Assess need for long-term anticoagulation using CHA₂DS₂-VASc

**Key Points:**

- ~60% convert with procainamide; ~90%+ with subsequent electrical cardioversion
- Patients successfully converted with <48h duration can often be discharged from ED

---

## Ottawa Heart Failure Risk Scale (OHFRS)

**Application:** Predicts short-term (14-day) serious adverse events in ED heart failure patients being considered for discharge.

**Criteria:**

|Variable|Points|
|---|---|
|History of stroke or TIA|+1|
|Heart rate on ED arrival ≥110 bpm|+2|
|SpO₂ <90% on assessment|+1|
|Heart rate ≥110 on 3-minute walk test (or too ill to perform)|+1|
|New ischemic ECG changes|+2|
|Urea ≥12 mmol/L (BUN ≥33.6 mg/dL)|+1|
|Serum CO₂ ≥35 mEq/L|+2|
|Elevated troponin (per local assay)|+2|
|NT-proBNP ≥5000 pg/mL|+1|
|Any prior ED visit or hospitalization for HF in prior 6 months|+1|

**Score Range: 0–14+**

**Interpretation:**

|Score|Risk|Recommendation|
|---|---|---|
|0|Very low (~2.8%)|Consider discharge|
|1|Low (~5.3%)|Consider discharge with close follow-up|
|2–3|Moderate (~10–15%)|Observation / short stay|
|≥4|High (~20%+)|Admission recommended|

---

## STRATIFY Decision Rule (Acute Heart Failure)

**Application:** Aids disposition decision-making for acute heart failure. Identifies patients safe for discharge.

**Low-risk criteria (all must be met):**

- No troponin elevation
- No significant renal dysfunction
- No ischemic ECG changes
- Adequate oxygenation after treatment
- Adequate diuretic response
- Stable vital signs
- No need for IV vasodilators or inotropes

_Note: STRATIFY is less standardized than OHFRS; it represents a clinical framework rather than a strict numeric score. Use OHFRS for quantitative scoring._

---

## Modified Duke Criteria (Infective Endocarditis)

**Application:** Diagnostic criteria for infective endocarditis.

### Major Criteria:

**1. Positive blood cultures:**

- Typical organisms from 2 separate cultures (Strep viridans, Strep bovis, HACEK, Staph aureus, or community-acquired enterococci without primary focus) OR
- Persistently positive blood cultures (≥2 cultures drawn >12 hours apart, or all of 3 or majority of ≥4 separate cultures with first and last drawn ≥1 hour apart) OR
- Single positive culture for Coxiella burnetii or anti-phase I IgG titer >1:800

**2. Evidence of endocardial involvement:**

- Positive echocardiogram (oscillating intracardiac mass, abscess, or new partial dehiscence of prosthetic valve) OR
- New valvular regurgitation

### Minor Criteria:

1. Predisposing heart condition or IV drug use
2. Fever ≥38.0°C (100.4°F)
3. Vascular phenomena (arterial emboli, septic pulmonary infarcts, mycotic aneurysm, Janeway lesions, conjunctival hemorrhage)
4. Immunologic phenomena (glomerulonephritis, Osler nodes, Roth spots, rheumatoid factor)
5. Microbiological evidence not meeting major criteria

### Diagnosis:

|Classification|Criteria|
|---|---|
|**Definite**|2 major; OR 1 major + 3 minor; OR 5 minor|
|**Possible**|1 major + 1 minor; OR 3 minor|
|**Rejected**|Firm alternative diagnosis; OR resolution of syndrome with ≤4 days of antibiotics; OR no pathological evidence at surgery/autopsy with ≤4 days of antibiotics; OR does not meet criteria above|

---

# PULMONARY

---

## CURB-65

**Application:** Severity assessment and disposition guide for community-acquired pneumonia (CAP).

**Criteria (1 point each):**

|Letter|Variable|Definition|
|---|---|---|
|**C**|Confusion|New mental confusion (AMT ≤8 or new disorientation)|
|**U**|Urea|BUN > 19 mg/dL (>7 mmol/L)|
|**R**|Respiratory rate|≥30 breaths/min|
|**B**|Blood pressure|SBP < 90 mmHg OR DBP ≤ 60 mmHg|
|**65**|Age ≥65|Age 65 years or older|

**Score Range: 0–5**

**Interpretation:**

|Score|30-Day Mortality|Recommended Disposition|
|---|---|---|
|0–1|0.6–2.7%|Outpatient treatment|
|2|6.8–13%|Consider short inpatient stay or closely supervised outpatient|
|3–5|14–27.8%|Inpatient; Score ≥4 consider ICU|

---

## CRB-65

**Application:** Simplified CURB-65 without urea (for use in outpatient/clinic settings without labs).

**Criteria (1 point each):**

1. **C**onfusion — new mental confusion
2. **R**espiratory rate ≥30
3. **B**lood pressure — SBP <90 or DBP ≤60
4. Age ≥**65**

**Score Range: 0–4**

**Interpretation:**

|Score|Recommendation|
|---|---|
|0|Low risk; outpatient|
|1–2|Consider hospital referral|
|3–4|Urgent hospital admission|

---

## Pneumonia Severity Index (PSI / PORT Score)

**Application:** Risk stratification for CAP mortality; guides inpatient vs. outpatient treatment.

### Step 1: Low-Risk Screening

If ALL of the following → Class I (low risk), treat outpatient:

- Age ≤50
- No comorbidities: neoplastic disease, liver disease, CHF, cerebrovascular disease, renal disease
- Normal mental status
- Normal or near-normal vital signs: HR <125, RR <30, SBP ≥90, Temp ≥35°C and <40°C, SpO₂ >90%

### Step 2: Point Calculation (if not Class I)

**Demographics:**

|Variable|Points|
|---|---|
|Age (male)|Age in years|
|Age (female)|Age − 10|
|Nursing home resident|+10|

**Comorbidities:**

|Variable|Points|
|---|---|
|Neoplastic disease|+30|
|Liver disease|+20|
|Congestive heart failure|+10|
|Cerebrovascular disease|+10|
|Renal disease|+10|

**Physical Exam:**

|Variable|Points|
|---|---|
|Altered mental status|+20|
|Respiratory rate ≥30|+20|
|Systolic BP <90 mmHg|+20|
|Temperature <35°C or ≥40°C|+15|
|Heart rate ≥125|+10|

**Labs/Imaging:**

|Variable|Points|
|---|---|
|Arterial pH <7.35|+30|
|BUN ≥30 mg/dL (≥11 mmol/L)|+20|
|Sodium <130 mEq/L|+20|
|Glucose ≥250 mg/dL (≥14 mmol/L)|+10|
|Hematocrit <30%|+10|
|PaO₂ <60 mmHg or SpO₂ <90%|+10|
|Pleural effusion|+10|

**Interpretation:**

|Class|Score|30-Day Mortality|Disposition|
|---|---|---|---|
|I|(Step 1 screen)|0.1%|Outpatient|
|II|≤70|0.6%|Outpatient|
|III|71–90|0.9–2.8%|Outpatient or brief observation|
|IV|91–130|8.2–9.3%|Inpatient|
|V|>130|27–31%|Inpatient (consider ICU)|

---

## Ottawa COPD Risk Scale

**Application:** Predicts short-term serious adverse events in patients presenting to the ED with acute COPD exacerbation.

**Criteria:**

|Variable|Points|
|---|---|
|Coronary bypass graft history|+1|
|Intervention for peripheral vascular disease|+1|
|Intubation for respiratory distress (ever)|+2|
|Heart rate ≥110 on arrival|+2|
|Too ill to do walk test (or SpO₂ <90% or HR ≥120 on walk test)|+2|
|Acute ischemic ECG changes|+2|
|Pulmonary congestion on chest x-ray|+1|
|Hemoglobin <10 g/dL|+3|
|Urea ≥12 mmol/L (BUN ≥34 mg/dL)|+1|
|Serum CO₂ ≥35 mEq/L|+1|

**Score Range: 0–16**

**Interpretation:**

|Score|Risk of Serious Adverse Event|
|---|---|
|0|Very low (~2.2%)|
|1|Low (~4.0%)|
|2|Moderate (~7.2%)|
|≥3|High (~12%+)|

- Score 0: Consider safe discharge with close follow-up
- Score ≥1: Consider observation or admission depending on clinical picture

---

## DECAF Score

**Application:** Predicts in-hospital mortality from acute exacerbation of COPD.

**Criteria:**

|Variable|Points|
|---|---|
|**D**yspnea: eMRCD 5a (too breathless to leave the house unassisted but independent in washing/dressing)|1|
|**D**yspnea: eMRCD 5b (too breathless to wash/dress unassisted)|2|
|**E**osinopenia (eosinophils <0.05 × 10⁹/L)|1|
|**C**onsolidation on chest x-ray|1|
|**A**cidemia (pH <7.30)|1|
|**F**ib: Atrial fibrillation (on ECG, including new or preexisting)|1|

**Score Range: 0–6**

**Interpretation:**

|Score|In-Hospital Mortality|Risk|
|---|---|---|
|0–1|0–1.4%|Low|
|2|5.3%|Intermediate|
|3|15.3%|High|
|4|31%|Very high|
|5–6|40–50%|Very high|

---

## PASS (Pediatric Asthma Severity Score)

**Application:** Standardized assessment of acute asthma severity in children to guide treatment.

**Criteria (each scored 1, 2, or 3):**

|Component|1 (Mild)|2 (Moderate)|3 (Severe)|
|---|---|---|---|
|Wheezing|End-expiratory or none|Expiratory (entire phase)|Inspiratory AND expiratory (or diminished air entry)|
|Work of breathing|Normal or mild increase|Moderate (suprasternal retractions)|Severe (nasal flaring, subcostal/intercostal retractions)|
|Prolongation of expiration|Normal or mildly prolonged|Moderately prolonged|Severely prolonged (I:E ratio ≥1:3)|

**Score Range: 3–9**

**Interpretation:**

- 3–4: Mild → Standard bronchodilator therapy
- 5–6: Moderate → Aggressive bronchodilator therapy, consider systemic corticosteroids
- 7–9: Severe → Continuous nebulization, IV magnesium, consider escalation

---

# NEUROLOGY

---

## NIHSS (National Institutes of Health Stroke Scale)

**Application:** Quantifies stroke deficit severity to guide treatment decisions (especially thrombolysis eligibility) and predict outcomes.

**Components (scored individually):**

|Item|Test|Score Range|
|---|---|---|
|1a. Level of consciousness|Alert/drowsy/stupor/coma|0–3|
|1b. LOC questions|Month and age|0–2|
|1c. LOC commands|Open/close eyes; grip/release|0–2|
|2. Best gaze|Horizontal eye movement|0–2|
|3. Visual fields|Visual field testing|0–3|
|4. Facial palsy|Show teeth/raise brows|0–3|
|5a. Motor arm—Left|Arm drift (90° sitting, 45° supine, hold 10 sec)|0–4|
|5b. Motor arm—Right|Same|0–4|
|6a. Motor leg—Left|Leg drift (30° supine, hold 5 sec)|0–4|
|6b. Motor leg—Right|Same|0–4|
|7. Limb ataxia|Finger-nose, heel-shin|0–2|
|8. Sensory|Pin prick|0–2|
|9. Best language|Naming, reading, describing|0–3|
|10. Dysarthria|Evaluate speech clarity|0–2|
|11. Extinction/inattention|Double simultaneous stimulation|0–2|

**Score Range: 0–42**

**Interpretation:**

|Score|Stroke Severity|
|---|---|
|0|No stroke symptoms|
|1–4|Minor stroke|
|5–15|Moderate stroke|
|16–20|Moderate to severe|
|21–42|Severe stroke|

**Clinical Relevance:**

- NIHSS >4 (or >6 in some protocols): Generally supports IV alteplase consideration within window
- NIHSS ≥6: Strong consideration for thrombectomy evaluation if LVO suspected
- Higher scores correlate with larger vessel occlusions

---

## Cincinnati Prehospital Stroke Scale (CPSS)

**Application:** Rapid prehospital stroke screening tool.

**Three Assessments:**

1. **Facial droop:** Ask patient to smile or show teeth
    - Normal: Both sides move equally
    - Abnormal: One side does not move as well
2. **Arm drift:** Patient closes eyes, extends both arms 10 seconds
    - Normal: Both arms move same or not at all
    - Abnormal: One arm drifts down compared to the other
3. **Speech:** Have patient say "You can't teach an old dog new tricks"
    - Normal: Correct words, no slurring
    - Abnormal: Slurred or inappropriate words or mute

**Interpretation:**

- ANY 1 finding abnormal → ~72% probability of stroke
- If all 3 abnormal → >85% probability of stroke
- Any abnormality → Activate stroke alert

---

## RACE Scale (Rapid Arterial oCclusion Evaluation)

**Application:** Prehospital large vessel occlusion (LVO) detection for field triage to thrombectomy-capable center.

**Scoring:**

|Component|Assessment|Points|
|---|---|---|
|Facial palsy|Absent = 0; Mild = 1; Moderate-severe = 2|0–2|
|Arm motor function|Normal = 0; Drift = 1; Some effort against gravity = 2; No effort against gravity = 3|0–3 (arm contralateral to suspected stroke side)|
|Leg motor function|Normal = 0; Drift = 1; Some effort against gravity = 2; No effort against gravity = 3|0–3|
|Head/gaze deviation|Absent = 0; Present = 1|0–1|
|Aphasia (if left-sided symptoms suggest right brain stroke → test agnosia) OR Agnosia|None = 0; Moderate = 1; Severe = 2|0–2|

_Aphasia: Can the patient name, repeat, follow commands? Agnosia: Does the patient recognize arm deficit?_

**Score Range: 0–9**

**Interpretation:**

|Score|LVO Probability|Action|
|---|---|---|
|<5|Low|Transport to nearest stroke center|
|≥5|High (~85% sensitivity, ~68% specificity for LVO)|Transport to comprehensive/thrombectomy-capable center|

---

## LAMS (Los Angeles Motor Scale)

**Application:** Prehospital LVO detection using 3 motor assessments.

**Scoring:**

|Component|Score|
|---|---|
|Facial droop: Absent = 0; Present = 1|0–1|
|Arm drift: Absent = 0; Drifts down = 1; Falls rapidly = 2|0–2|
|Grip strength: Normal = 0; Weak = 1; No grip = 2|0–2|

**Score Range: 0–5**

**Interpretation:**

- LAMS ≥4: Highly suggestive of LVO → Transport to thrombectomy-capable center
- LAMS <4: Lower probability but does not exclude LVO

---

## BE-FAST Mnemonic

**Application:** Public and prehospital stroke recognition.

|Letter|Sign|
|---|---|
|**B**|Balance — sudden loss of balance or coordination|
|**E**|Eyes — sudden vision changes in one or both eyes|
|**F**|Face — facial drooping on one side|
|**A**|Arms — arm weakness or drift|
|**S**|Speech — slurred or abnormal speech|
|**T**|Time — time to call 911 / note time of onset|

**Interpretation:** Any positive sign → Activate emergency response immediately. Note time of last known well.

---

## Ottawa SAH Rule

**Application:** Identifies which patients presenting with acute headache need investigation for subarachnoid hemorrhage. Applied to alert (GCS 15) patients ≥15 years with new severe non-traumatic headache reaching maximum intensity within 1 hour.

**Exclusion criteria (do NOT apply rule):**

- New focal neurological deficit
- Previous aneurysm or SAH
- Known brain tumors
- History of recurrent headaches (≥3 similar episodes over ≥6 months)

**High-Risk Criteria (any ONE = investigate for SAH):**

1. Age ≥40 years
2. Neck pain or stiffness
3. Witnessed loss of consciousness
4. Onset during exertion
5. Thunderclap headache (instantly peaking pain)
6. Limited neck flexion on examination

**Interpretation:**

- ANY criterion present → Investigate for SAH (CT head ± LP or CTA)
- ALL criteria absent → Very low risk; SAH investigation may not be required
- Sensitivity: 100% (in derivation and validation; 95% CI 97.2–100%)

---

## 6-Hour CT Rule for SAH

**Application:** CT head within 6 hours of headache ictus has near-100% sensitivity for SAH in patients with GCS 15, when interpreted by experienced radiologist on modern (≥3rd generation) scanner.

**Criteria for applying the rule:**

- Headache onset clearly defined and <6 hours ago
- GCS = 15
- CT interpreted by experienced physician
- Non-contrast CT of adequate quality

**Interpretation:**

- Negative CT within 6 hours of ictus AND GCS 15 → Sensitivity ~100% for SAH (Perry et al., BMJ 2011)
- Some experts accept this as sufficient to rule out SAH without LP
- If CT >6 hours from onset → LP or CTA still recommended if clinical suspicion persists

---

## ABCD² Score

**Application:** Predicts 2-, 7-, and 90-day stroke risk after TIA.

**Criteria:**

|Variable|Points|
|---|---|
|**A**ge ≥60 years|1|
|**B**lood pressure: SBP ≥140 or DBP ≥90 at initial evaluation|1|
|**C**linical features: Unilateral weakness|2|
|**C**linical features: Speech impairment without weakness|1|
|**D**uration ≥60 minutes|2|
|**D**uration 10–59 minutes|1|
|**D**iabetes|1|

**Score Range: 0–7**

**Interpretation:**

|Score|2-Day Stroke Risk|7-Day Stroke Risk|
|---|---|---|
|0–3 (Low)|1.0%|1.2%|
|4–5 (Moderate)|4.1%|5.9%|
|6–7 (High)|8.1%|11.7%|

**Clinical Use:**

- Score ≥4: Urgent evaluation (imaging, vascular workup within 24–48 hours)
- Many centers now perform urgent workup regardless of ABCD² due to limitations of this score

---

## Canadian TIA Score

**Application:** Predicts 7-day stroke risk after TIA. More discriminating than ABCD² alone.

**Criteria:**

|Variable|Points|
|---|---|
|First TIA|+2|
|Symptom duration ≥10 minutes|+2|
|History of carotid stenosis (documented ≥50%)|+2|
|Already on antiplatelet therapy at time of TIA|+3|
|Gait disturbance during the event|+1|
|Unilateral weakness during the event|+1|
|Vertigo during the event|−3|
|Diastolic BP ≥110 mmHg|+3|
|Atrial fibrillation/flutter (current or history)|+2|
|Glucose ≥15 mmol/L (270 mg/dL)|+3|
|Platelet count ≥400 × 10⁹/L|+3|

**Interpretation:**

|Score|7-Day Stroke Risk|
|---|---|
|<-1 to 3|Very low (<1%)|
|4–8|Low (~2%)|
|9–13|Medium (~7%)|
|≥14|High (~14%)|

- Score ≤5: Potentially safe for outpatient rapid evaluation
- Score ≥6: Consider admission for expedited workup

---

## HINTS Exam

**Application:** Bedside exam to differentiate central (stroke) from peripheral (vestibular neuritis/BPPV) cause of acute vestibular syndrome (acute onset, persistent vertigo, nystagmus, gait instability). Applied to continuous vertigo with nystagmus, not episodic positional vertigo.

**Three Components:**

**1. Head Impulse test (h-HIT):**

- Rapidly turn head to each side while patient fixates on nose
- **Abnormal** (corrective saccade) = PERIPHERAL (reassuring)
- **Normal** (eyes stay fixed) = CENTRAL (concerning for stroke)

**2. Nystagmus type:**

- **Direction-fixed** (always beats same direction) = PERIPHERAL (reassuring)
- **Direction-changing** (changes with gaze direction) = CENTRAL (concerning)

**3. Test of Skew (alternate cover test):**

- Cover/uncover each eye, look for vertical re-fixation
- **Absent** (no vertical correction) = PERIPHERAL (reassuring)
- **Present** (vertical deviation) = CENTRAL (concerning)

**Interpretation — "INFARCT" Pattern:** Any ONE of the following = Central (concerning for stroke):

- **I**mpulse **N**ormal (normal head impulse test)
- **F**ast-phase **A**lternating (direction-changing nystagmus)
- **R**efixation on **C**over **T**est (skew deviation present)

If HINTS is benign (abnormal impulse + direction-fixed nystagmus + no skew) → Peripheral cause likely (sensitivity ~97% for central cause, superior to early MRI in first 48 hours)

---

## STANDING Algorithm

**Application:** Bedside evaluation approach for acute vertigo combining orthostatic assessment, nystagmus analysis, and HINTS components.

**Framework:**

1. Assess vital signs and orthostatics
2. Characterize nystagmus pattern
3. Perform HINTS exam
4. Assess gait
5. Integrate findings

_Note: STANDING is a clinical approach/algorithm rather than a discrete numeric score. Use HINTS for the primary central vs. peripheral differentiation._

---

## Status Epilepticus Severity Score (STESS)

**Application:** Predicts outcomes (return to baseline) in patients with status epilepticus.

**Criteria:**

|Variable|Options|Points|
|---|---|---|
|Consciousness before treatment|Alert or somnolent/confused|0|
||Stuporous or comatose|1|
|Worst seizure type|Simple partial, complex partial, absence, myoclonic|0|
||Generalized convulsive|1|
||Nonconvulsive SE in coma|2|
|Age|<65 years|0|
||≥65 years|2|
|History of previous seizures|Yes|0|
||No (first episode)|1|

**Score Range: 0–6**

**Interpretation:**

|Score|Outcome|
|---|---|
|0–2|Favorable (return to baseline likely)|
|3–6|Unfavorable (higher mortality, poor functional outcome)|

---

# GASTROINTESTINAL

---

## Glasgow-Blatchford Bleeding Score (GBS)

**Application:** Pre-endoscopic risk stratification for upper GI bleeding. Identifies patients at very low risk who may not need hospital-based intervention.

**Criteria:**

|Variable|Value|Points|
|---|---|---|
|BUN (mg/dL)|18.2–22.4|2|
||22.4–28|3|
||28–70|4|
||>70|6|
|Hemoglobin (g/dL) — Male|12.0–12.9|1|
||10.0–11.9|3|
||<10.0|6|
|Hemoglobin (g/dL) — Female|10.0–11.9|1|
||<10.0|6|
|Systolic BP (mmHg)|100–109|1|
||90–99|2|
||<90|3|
|Heart rate ≥100|Yes|1|
|Melena|Yes|1|
|Syncope|Yes|2|
|Hepatic disease|Yes|2|
|Heart failure|Yes|2|

**Score Range: 0–23**

**Interpretation:**

|Score|Risk|Action|
|---|---|---|
|0|Very low risk (<1% need intervention)|Safe for outpatient management without endoscopy|
|1–2|Low|Consider early discharge with outpatient endoscopy|
|≥3|Increasing risk|Inpatient management with endoscopy|
|≥6|High risk|Urgent/emergent endoscopy|

---

## AIMS65 Score

**Application:** Predicts in-hospital mortality in upper GI bleeding.

**Criteria (1 point each):**

|Letter|Variable|
|---|---|
|**A**|Albumin < 3.0 g/dL|
|**I**|INR > 1.5|
|**M**|Altered Mental status|
|**6**|Systolic BP ≤ 90 mmHg|
|**5**|Age ≥ 65 years|

**Score Range: 0–5**

**Interpretation:**

|Score|In-Hospital Mortality|
|---|---|
|0|0.3%|
|1|1.2%|
|2|5.3%|
|3|10.3%|
|4|16.5%|
|5|24.5%|

---

## Rockall Score

**Application:** Predicts rebleeding and mortality in upper GI bleeding. Comes in pre-endoscopic and full versions.

### Pre-Endoscopic (Clinical) Rockall:

|Variable|0|1|2|3|
|---|---|---|---|---|
|Age|<60|60–79|≥80|—|
|Shock|No shock (SBP ≥100, HR <100)|Tachycardia (HR ≥100, SBP ≥100)|Hypotension (SBP <100)|—|
|Comorbidity|None|—|CHF, IHD, any major comorbidity|Renal failure, liver failure, metastatic cancer|

### Full Rockall (adds endoscopic findings):

|Variable|0|1|2|
|---|---|---|---|
|Endoscopic diagnosis|Mallory-Weiss tear, no lesion, no SRH|All other diagnoses|Malignancy of upper GI tract|
|Stigmata of recent hemorrhage|None or dark spot only|—|Blood in UGI tract, adherent clot, visible/spurting vessel|

**Pre-endoscopic Score Range: 0–7** **Full Score Range: 0–11**

**Interpretation:**

|Pre-Endoscopic Score|Rebleeding Risk|Mortality|
|---|---|---|
|0|0.2%|0%|
|1–2|Low|Low|
|≥3|Moderate-high|Increasing|

|Full Score|Rebleeding|Mortality|
|---|---|---|
|0–2|Low (4–5%)|0%|
|3–5|Moderate (11–25%)|3–11%|
|6–8+|High (33–42%)|17–41%|

---

## Oakland Score

**Application:** Risk stratifies lower GI bleeding for safe discharge.

**Criteria:**

|Variable|Points|
|---|---|
|Age <40|0|
|Age 40–69|1|
|Age ≥70|2|
|Male sex|0|
|Female sex|1|
|Previous LGIB admission|1|
|DRE: No blood|0|
|DRE: Blood|1|
|Heart rate <70|0|
|Heart rate 70–89|1|
|Heart rate 90–109|2|
|Heart rate ≥110|3|
|Systolic BP ≥160|0|
|Systolic BP 120–159|1|
|Systolic BP 90–119|2|
|Systolic BP 50–89|3|
|Hemoglobin ≥16 (male) / ≥14 (female)|0|
|Hemoglobin values progressively lower|Increasing points up to 22|

**Score Range: 0–29+**

**Interpretation:**

- Score ≤8: Safe for outpatient management (95% probability of safe discharge)
- Score >8: Consider inpatient management

---

## Alvarado Score (MANTRELS)

**Application:** Clinical prediction of acute appendicitis.

**Criteria — "MANTRELS" mnemonic:**

|Variable|Points|
|---|---|
|**M**igration of pain to RLQ|1|
|**A**norexia|1|
|**N**ausea/vomiting|1|
|**T**enderness in RLQ|2|
|**R**ebound pain|1|
|**E**levated temperature (>37.3°C / 99.1°F)|1|
|**L**eukocytosis (WBC >10,000)|2|
|**S**hift left (>75% neutrophils)|1|

**Score Range: 0–10**

**Interpretation:**

|Score|Probability|Recommendation|
|---|---|---|
|0–4|Low (~7%)|Appendicitis unlikely; observe or discharge|
|5–6|Intermediate (~57%)|Equivocal; imaging recommended (CT or US)|
|7–8|High (~83%)|Probable appendicitis; surgical consultation|
|9–10|Very high (~95%)|Near-certain appendicitis; surgical intervention|

---

## AIR Score (Appendicitis Inflammatory Response Score)

**Application:** Risk stratification for appendicitis using clinical and lab findings.

**Criteria:**

|Variable|Points|
|---|---|
|Vomiting|1|
|RLQ pain|1|
|Rebound tenderness: Light|1|
|Rebound tenderness: Medium|2|
|Rebound tenderness: Strong|3|
|Body temperature ≥38.5°C|1|
|WBC 10.0–14.9 × 10⁹/L|1|
|WBC ≥15.0 × 10⁹/L|2|
|CRP 10–49 mg/L|1|
|CRP ≥50 mg/L|2|

**Score Range: 0–12**

**Interpretation:**

|Score|Risk|Recommendation|
|---|---|---|
|0–4|Low|Outpatient follow-up|
|5–8|Intermediate|Observation, imaging, or diagnostic laparoscopy|
|9–12|High|Surgical intervention (high probability of appendicitis)|

---

## Pediatric Appendicitis Score (PAS)

**Application:** Appendicitis prediction in children (3–18 years).

**Criteria:**

|Variable|Points|
|---|---|
|Anorexia|1|
|Nausea/vomiting|1|
|Migration of pain (to RLQ)|1|
|Fever (≥38°C / 100.4°F)|1|
|Cough/percussion/hopping tenderness in RLQ|2|
|RLQ tenderness|2|
|Leukocytosis (WBC ≥10,000)|1|
|Neutrophilia (ANC ≥7,500)|1|

**Score Range: 0–10**

**Interpretation:**

|Score|Probability|Recommendation|
|---|---|---|
|≤2|Very low|Appendicitis very unlikely; discharge with return precautions|
|3–6|Equivocal|Imaging recommended (US first in pediatrics)|
|≥7|High|Surgical consultation|

---

## Ranson's Criteria

**Application:** Predicts severity and mortality in acute pancreatitis. Assessed at admission AND at 48 hours.

### At Admission (for non-gallstone pancreatitis):

|Variable|Criterion|
|---|---|
|Age|>55 years|
|WBC|>16,000/µL|
|Glucose|>200 mg/dL (>11 mmol/L)|
|LDH|>350 IU/L|
|AST|>250 IU/L|

### At 48 Hours:

|Variable|Criterion|
|---|---|
|Hematocrit decrease|>10% from admission|
|BUN increase|>5 mg/dL from admission|
|Calcium|<8 mg/dL|
|PaO₂|<60 mmHg|
|Base deficit|>4 mEq/L|
|Fluid sequestration|>6 L estimated|

_For gallstone pancreatitis, at admission: Age >70, WBC >18,000, Glucose >220, LDH >400, AST >250_

**Score Range: 0–11**

**Interpretation:**

|Score|Mortality|
|---|---|
|0–2|~1%|
|3–4|~15%|
|5–6|~40%|
|≥7|~100%|

**Limitation:** Requires 48 hours for complete assessment. BISAP is preferred for early assessment.

---

## BISAP Score

**Application:** Early bedside severity assessment for acute pancreatitis (can be calculated within first 24 hours).

**Criteria (1 point each):**

|Letter|Variable|
|---|---|
|**B**|BUN > 25 mg/dL|
|**I**|Impaired mental status (Glasgow Coma Scale < 15)|
|**S**|SIRS (≥2 of: Temp >38°C or <36°C, HR >90, RR >20 or PaCO₂ <32, WBC >12,000 or <4,000 or >10% bands)|
|**A**|Age > 60 years|
|**P**|Pleural effusion on imaging|

**Score Range: 0–5**

**Interpretation:**

|Score|Mortality|Severity|
|---|---|---|
|0|<1%|Mild|
|1|~1%|Mild|
|2|~2%|Moderate|
|3|~5–8%|Severe|
|4|~12–20%|Severe|
|5|~22–27%|Severe|

- Score ≥3: Increased risk of organ failure and pancreatic necrosis; consider ICU admission

---

## Atlanta Classification (Revised 2012)

**Application:** Classifies severity of acute pancreatitis.

**Three Severity Categories:**

|Category|Criteria|
|---|---|
|**Mild**|No organ failure AND no local/systemic complications|
|**Moderately severe**|Transient organ failure (<48 hours) AND/OR local complications (peripancreatic fluid collections, pancreatic/peripancreatic necrosis, pseudocyst, walled-off necrosis)|
|**Severe**|Persistent organ failure (>48 hours) — defined by modified Marshall scoring system|

**Organ Failure (Modified Marshall Score ≥2 in any system):**

- Respiratory: PaO₂/FiO₂ ≤300
- Cardiovascular: SBP <90 not responsive to fluid resuscitation
- Renal: Creatinine ≥1.9 mg/dL

**Local Complications:**

- Acute peripancreatic fluid collection (first 4 weeks, no necrosis)
- Pancreatic pseudocyst (>4 weeks, encapsulated, no necrosis)
- Acute necrotic collection (first 4 weeks, with necrosis)
- Walled-off necrosis (>4 weeks, encapsulated necrosis)

---

## Charcot's Triad / Reynolds' Pentad

**Application:** Clinical diagnosis of ascending cholangitis.

### Charcot's Triad (suggests cholangitis):

1. Right upper quadrant pain
2. Fever / chills
3. Jaundice

_Present in ~50–70% of cholangitis cases_

### Reynolds' Pentad (suggests suppurative/toxic cholangitis):

Charcot's Triad PLUS: 4. Mental status changes (confusion/lethargy) 5. Hypotension / shock

**Interpretation:**

- Charcot's Triad present → High suspicion for cholangitis; initiate antibiotics and biliary imaging
- Reynolds' Pentad present → Toxic cholangitis; emergent biliary decompression (ERCP) required
- Absence of triad does NOT exclude cholangitis

---

# GENITOURINARY

---

## STONE Score

**Application:** Predicts likelihood of ureteral stone in patients presenting with flank pain suspicious for renal colic.

**Criteria:**

|Variable|Low (1 point)|Moderate (2 points)|High (3 points)|
|---|---|---|---|
|**S**ex|Female|—|Male|
|**T**iming|>24 hours since onset|6–24 hours|<6 hours (acute onset)|
|**O**rigin (race)|Black|—|Non-black|
|**N**ausea|None|Nausea alone|Vomiting|
|**E**rythrocytes (UA)|None|—|Present (any hematuria)|

**Score Range: 5–13**

**Interpretation:**

|Score|Category|Stone Probability|
|---|---|---|
|5–7|Low|~9%|
|8–9|Moderate|~52%|
|10–13|High|~89%|

**Clinical Use:**

- Low score: Consider alternative diagnoses; imaging may still be warranted
- High score: Ureteral stone highly likely; may influence imaging choice (CT vs. US vs. none for known stone-formers)

---

## TWIST Score (Testicular Workup for Ischemia and Suspected Torsion)

**Application:** Risk stratification for testicular torsion in males presenting with acute scrotal pain.

**Criteria:**

|Variable|Points|
|---|---|
|Testicular swelling|2|
|Hard testicle on palpation|2|
|Absent cremasteric reflex|1|
|Nausea/vomiting|1|
|High-riding testicle|1|

**Score Range: 0–7**

**Interpretation:**

|Score|Risk|Recommendation|
|---|---|---|
|0–2|Low|Torsion unlikely; ultrasound if clinically concerned|
|3–4|Intermediate|Urgent ultrasound with Doppler|
|5–7|High|Immediate surgical exploration (do not delay for ultrasound)|

---

# INFECTIOUS DISEASE

---

## qSOFA (Quick Sequential Organ Failure Assessment)

**Application:** Bedside screening tool to identify patients at risk of poor outcomes from infection/sepsis (outside the ICU setting).

**Criteria (1 point each):**

1. Respiratory rate ≥22 breaths/min
2. Altered mentation (GCS <15 or any acute change in mental status)
3. Systolic blood pressure ≤100 mmHg

**Score Range: 0–3**

**Interpretation:**

- Score ≥2: High risk of poor outcome; prompts further assessment for organ dysfunction (calculate full SOFA), consider ICU level care
- Score <2: Does NOT rule out sepsis; clinical judgment still required
- Note: qSOFA is for risk stratification, NOT a diagnostic criterion for sepsis

---

## SOFA Score (Sequential Organ Failure Assessment)

**Application:** Quantifies organ dysfunction in critically ill patients. An increase of ≥2 from baseline defines sepsis (Sepsis-3).

**Scoring System:**

|Organ System|0|1|2|3|4|
|---|---|---|---|---|---|
|**Respiration** PaO₂/FiO₂|≥400|<400|<300|<200 with ventilation|<100 with ventilation|
|**Coagulation** Platelets (×10³/µL)|≥150|<150|<100|<50|<20|
|**Liver** Bilirubin (mg/dL)|<1.2|1.2–1.9|2.0–5.9|6.0–11.9|>12.0|
|**Cardiovascular**|MAP ≥70|MAP <70|Dopamine <5 or dobutamine (any)|Dopamine 5.1–15 or epi/norepi ≤0.1|Dopamine >15 or epi/norepi >0.1|
|**CNS** Glasgow Coma Scale|15|13–14|10–12|6–9|<6|
|**Renal** Creatinine (mg/dL) or UOP|<1.2|1.2–1.9|2.0–3.4|3.5–4.9 or <500 mL/day|>5.0 or <200 mL/day|

**Score Range: 0–24**

**Interpretation:**

- Baseline SOFA assumed to be 0 in patients without known pre-existing organ dysfunction
- Acute change of ≥2 points from baseline = sepsis (in context of infection)
- Higher scores = higher mortality (SOFA 0–6: <10%; 7–9: 15–20%; 10–12: 40–50%; >12: >80%)

---

## SIRS Criteria

**Application:** Traditional criteria for systemic inflammatory response. ≥2 criteria defines SIRS. When SIRS is caused by infection, it was historically termed "sepsis" (pre-Sepsis-3 definition).

**Criteria (≥2 of 4 = SIRS):**

1. Temperature >38°C (100.4°F) or <36°C (96.8°F)
2. Heart rate >90 bpm
3. Respiratory rate >20 breaths/min or PaCO₂ <32 mmHg
4. WBC >12,000/µL or <4,000/µL or >10% immature bands

**Interpretation:**

- ≥2 criteria = SIRS (very sensitive but not specific)
- SIRS + suspected/confirmed infection = "Sepsis" (by old definition; Sepsis-3 now prefers SOFA-based definition)
- SIRS criteria remain useful for identifying sick patients but lack specificity (many conditions cause SIRS without infection)

---

## Rochester Criteria

**Application:** Identifies febrile infants ≤60 days old at low risk of serious bacterial infection (SBI).

**Low-Risk Criteria (ALL must be met):**

_Clinical:_

1. Infant appears generally well
2. Previously healthy (term, no perinatal antibiotics, no prior unexplained hyperbilirubinemia, no prior hospitalization, no chronic illness)
3. No evidence of focal bacterial infection (skin/soft tissue, bone, joint, ear)

_Lab:_ 4. WBC 5,000–15,000/µL 5. Absolute band count ≤1,500/µL 6. Urinalysis ≤10 WBC/HPF (spun) or negative leukocyte esterase 7. If diarrhea: stool ≤5 WBC/HPF

**Interpretation:**

- ALL criteria met → Low risk (~1% SBI rate); may be managed as outpatient with close follow-up (depending on local protocol and comfort)
- ANY criterion NOT met → Not low risk; further workup and likely admission with empiric antibiotics

---

## Philadelphia Criteria

**Application:** Risk stratification for febrile infants 29–60 days old.

**Low-Risk Criteria (ALL must be met):**

1. Well-appearing infant
2. No ear, soft tissue, or skeletal infection
3. WBC <15,000/µL
4. Band-to-neutrophil ratio <0.2
5. Urinalysis <10 WBC/HPF
6. CSF WBC <8/µL
7. CSF Gram stain negative
8. Stool (if diarrhea) negative for blood, with few/no WBC
9. CXR negative (if obtained)

**Interpretation:**

- ALL criteria met → Low risk; negative predictive value >98%
- ANY criterion not met → Not low risk; admit and treat empirically

---

## Boston Criteria (Febrile Infant)

**Application:** Risk stratification for febrile infants 28–89 days old.

**Low-Risk Criteria (ALL must be met):**

1. Well-appearing
2. No focal infection (except otitis media)
3. WBC ≤20,000/µL
4. CSF WBC <10/µL
5. Urinalysis <10 WBC/HPF or negative LE/nitrites
6. CXR: no infiltrate (if obtained)

**Interpretation:**

- ALL criteria met → Low risk; NPV 94.6% for SBI
- May consider outpatient management with ceftriaxone and 24-hour follow-up

---

## Step-by-Step Approach (European Febrile Infant Algorithm)

**Application:** Risk stratification for febrile infants ≤90 days using sequential assessment including procalcitonin.

**Steps:**

1. **Ill-appearing?** → Yes → Full sepsis workup + empiric antibiotics + admit
2. **Leukocyturia?** → Yes → UTI likely; treat accordingly
3. **Procalcitonin ≥0.5 ng/mL?** → Yes → High risk for invasive bacterial infection → Full workup + treat
4. **CRP ≥20 mg/L or ANC >10,000/µL?** → Yes → Intermediate risk → Consider LP, treat, observe
5. **If all negative** → Low risk → Close outpatient follow-up may be appropriate

**Interpretation:**

- This is a sequential algorithm (follow in order)
- Procalcitonin is the key discriminating biomarker
- Studies show excellent sensitivity (~92%) and NPV for invasive bacterial infection

---

## Lab-Score

**Application:** Biomarker-based risk stratification for febrile infants (7–90 days).

**Criteria:**

|Variable|Points|
|---|---|
|Procalcitonin ≥0.5 ng/mL|2|
|CRP ≥40 mg/L|4|
|Positive urine dipstick (LE or nitrite)|1|

**Score Range: 0–7**

**Interpretation:**

|Score|Risk of SBI|
|---|---|
|0|Very low (<3%)|
|≥3|High risk of SBI|

---

## AAP 2021 Febrile Infant Guidelines

**Application:** Age-stratified management of febrile (≥38.0°C) well-appearing infants 8–60 days old.

### Age 8–21 Days:

- Urinalysis, blood culture, CSF analysis (LP) recommended
- Admit and treat with empiric antibiotics
- Can consider NOT treating with acyclovir if HSV risk is low

### Age 22–28 Days:

- Urinalysis, blood culture, CSF analysis recommended
- Inflammatory markers (ANC, procalcitonin, CRP) optional but helpful
- Admit and treat with empiric antibiotics
- If ALL of the following: well-appearing, no inflammatory marker elevation, negative urinalysis → may potentially observe without antibiotics (shared decision-making)

### Age 29–60 Days:

- Urinalysis and blood culture recommended
- Inflammatory markers (procalcitonin and/or CRP and/or ANC) recommended
- LP: Recommended if inflammatory markers are abnormal or UA is positive
- If low risk (well-appearing, normal UA, normal inflammatory markers, no LP concern) → May be managed as outpatient with close follow-up in 24 hours if reliable caregiver
- If any abnormality → Admit and treat

**Key Biomarker Cutoffs:**

- Procalcitonin ≥0.5 ng/mL → Abnormal
- CRP ≥20 mg/L → Abnormal
- ANC ≥4,000/µL → Abnormal
- Temperature ≥38.0°C (100.4°F) = febrile threshold

---

## MASCC Score (Multinational Association for Supportive Care in Cancer)

**Application:** Identifies low-risk febrile neutropenic cancer patients who may be candidates for outpatient management.

**Criteria:**

|Variable|Points|
|---|---|
|Burden of illness: No or mild symptoms|5|
|Burden of illness: Moderate symptoms|3|
|Burden of illness: Severe symptoms (moribund)|0|
|No hypotension (SBP ≥90)|5|
|No COPD|4|
|Solid tumor OR hematologic malignancy with no previous fungal infection|4|
|No dehydration requiring IV fluids|3|
|Outpatient status at onset of fever|3|
|Age <60 years|2|

_Note: Burden of illness is clinician-assessed at presentation_

**Score Range: 0–26**

**Interpretation:**

|Score|Risk|Action|
|---|---|---|
|≥21|Low risk (~5% complication rate)|Consider outpatient oral antibiotics with close follow-up|
|<21|High risk|Inpatient IV antibiotics|

---

## CISNE Score (Clinical Index of Stable Febrile Neutropenia)

**Application:** Further risk-stratifies apparently stable febrile neutropenic patients (those who appear well at presentation).

**Criteria:**

|Variable|Points|
|---|---|
|ECOG performance status ≥2|2|
|COPD|1|
|Chronic cardiovascular disease|1|
|NCI mucositis grade ≥2|1|
|Monocytes <200/µL|1|
|Stress-induced hyperglycemia (glucose ≥121 mg/dL in non-diabetics, or ≥250 mg/dL in diabetics)|2|

**Score Range: 0–8**

**Interpretation:**

|Score|Risk|Action|
|---|---|---|
|0|Low risk (1.1% complications)|Outpatient management may be appropriate|
|1–2|Intermediate risk (~6%)|Consider individual risk/benefit|
|≥3|High risk (~36%)|Inpatient management|

---

## Centor Score / Modified Centor (McIsaac)

**Application:** Estimates probability of group A streptococcal (GAS) pharyngitis to guide testing and antibiotic decisions.

### Original Centor Criteria (1 point each):

1. Tonsillar exudates
2. Tender anterior cervical lymphadenopathy
3. Fever (reported or measured >38°C / 100.4°F)
4. Absence of cough

### Modified Centor (McIsaac) — adds age adjustment:

|Age|Points|
|---|---|
|3–14 years|+1|
|15–44 years|0|
|≥45 years|−1|

**Score Range: −1 to 5 (Modified); 0–4 (Original)**

**Interpretation (Modified Centor):**

|Score|Probability of GAS|Recommendation|
|---|---|---|
|≤0|~1–2.5%|No testing, no antibiotics|
|1|~5–10%|No testing, no antibiotics (or optional RADT)|
|2|~11–17%|RADT; treat if positive|
|3|~28–35%|RADT; treat if positive (or empiric antibiotics)|
|≥4|~51–53%|RADT or empiric antibiotics|

_RADT = rapid antigen detection test. In children, negative RADT should be backed up with throat culture._

---

## FeverPAIN Score

**Application:** UK alternative for assessment of streptococcal pharyngitis.

**Criteria (1 point each):**

1. **F**ever (during prior 24 hours)
2. **P**urulence (pharyngeal/tonsillar exudate)
3. **A**ttend rapidly (within 3 days of symptom onset)
4. Severely **I**nflamed tonsils
5. **N**o cough or coryza

**Score Range: 0–5**

**Interpretation:**

|Score|Strep Probability|Recommendation|
|---|---|---|
|0–1|13–18%|No antibiotics|
|2–3|34–40%|Delayed antibiotics (backup prescription) or RADT|
|4–5|62–65%|Immediate antibiotics OR RADT|

---

## Kocher Criteria

**Application:** Predicts septic arthritis of the hip in children (typically age 3 months to 18 years) presenting with hip pain and/or refusal to bear weight.

**Criteria:**

1. Non-weight-bearing on affected side
2. Fever (temperature >38.5°C / 101.3°F)
3. ESR >40 mm/hr
4. WBC >12,000/µL

_Some versions add:_ 5. CRP >20 mg/L (Caird modification → becomes 5 criteria)

**Number of Criteria Present → Predicted Probability of Septic Arthritis:**

|# Criteria (of 4)|Probability|
|---|---|
|0|~0.2%|
|1|~3%|
|2|~40%|
|3|~93%|
|4|~99.6%|

**Interpretation:**

- 0 predictors: Very low risk; observation
- 1 predictor: Low risk; consider observation vs. aspiration based on clinical picture
- 2 predictors: Moderate risk; joint aspiration recommended
- 3–4 predictors: High risk; aspiration +/- operative intervention
- If CRP is included (Caird): recalibrated probabilities apply

---

## LRINEC Score (Laboratory Risk Indicator for Necrotizing Fasciitis)

**Application:** Distinguishes necrotizing fasciitis from other soft tissue infections based on laboratory values.

**Criteria:**

|Variable|Value|Points|
|---|---|---|
|CRP (mg/L)|<150|0|
||≥150|4|
|WBC (×10³/µL)|<15|0|
||15–25|1|
||>25|2|
|Hemoglobin (g/dL)|>13.5|0|
||11–13.5|1|
||<11|2|
|Sodium (mEq/L)|≥135|0|
||<135|2|
|Creatinine (mg/dL)|≤1.6|0|
||>1.6|2|
|Glucose (mg/dL)|≤180|0|
||>180|1|

**Score Range: 0–13**

**Interpretation:**

|Score|Risk|PPV for Nec Fasc|
|---|---|---|
|≤5|Low|<50% (nec fasc unlikely)|
|6–7|Intermediate|~73%|
|≥8|High|~93% (strong suspicion for nec fasc)|

**Critical Caveat:** A low LRINEC does NOT exclude necrotizing fasciitis. Clinical suspicion (pain out of proportion, crepitus, rapid progression, systemic toxicity) always trumps the score. Surgical exploration should not be delayed for lab results.

---

## Bacterial Meningitis Score

**Application:** Differentiates bacterial from aseptic (viral) meningitis in children (≥2 months old) with CSF pleocytosis (CSF WBC ≥10/µL).

**Prerequisites:** Child with CSF pleocytosis (WBC ≥10/µL), no prior antibiotics, no critical illness requiring immediate treatment, no VP shunt/recent neurosurgery, no other confirmed bacterial infection.

**Criteria (any ONE positive = not low risk for bacterial meningitis):**

1. Positive CSF Gram stain
2. CSF ANC (absolute neutrophil count) ≥1,000 cells/µL
3. CSF protein ≥80 mg/dL
4. Peripheral blood ANC ≥10,000 cells/µL
5. Seizure at or before presentation

**Interpretation:**

- ALL 5 criteria NEGATIVE → Very low risk of bacterial meningitis (NPV 99.7–100%); aseptic meningitis likely; may consider outpatient management with close follow-up
- ANY criterion POSITIVE → Cannot classify as low risk; treat empirically for bacterial meningitis

---

# TOXICOLOGY

---

## Rumack-Matthew Nomogram

**Application:** Determines need for N-acetylcysteine (NAC) treatment in acute acetaminophen overdose based on serum APAP level and time since ingestion.

**How to Use:**

1. Determine the time of a single, acute ingestion
2. Draw a serum acetaminophen level at ≥4 hours post-ingestion (levels drawn before 4 hours cannot be plotted)
3. Plot the level on the nomogram (Y-axis = APAP level in µg/mL or µmol/L; X-axis = time post-ingestion in hours)

**Treatment Lines:**

- **Original Rumack-Matthew line:** Starts at 200 µg/mL at 4 hours, declining to 25 µg/mL at 16 hours (logarithmic decline)
- **Treatment line (used in US practice):** Starts at **150 µg/mL at 4 hours** (lowered by 25% for safety margin), declining to ~18.8 µg/mL at 16 hours

**Key Points on the Line:**

|Time Post-Ingestion|Treatment Threshold (US)|
|---|---|
|4 hours|150 µg/mL|
|8 hours|75 µg/mL|
|12 hours|37.5 µg/mL|
|16 hours|~18.8 µg/mL|
|24 hours|~4.7 µg/mL|

_The line follows: Level = 150 × (0.5)^((time − 4)/4) [half-life ~4 hours]_

**Interpretation:**

- Level AT or ABOVE the treatment line → Start NAC
- Level BELOW the treatment line → NAC not indicated (for single acute ingestion)
- **Limitations:** Only valid for single acute ingestion with known time; NOT valid for staggered/repeated supratherapeutic ingestion, chronic overuse, or unknown time of ingestion. In those cases, treat with NAC based on clinical judgment and acetaminophen level/liver function.

---

## King's College Criteria

**Application:** Identifies acetaminophen-induced (and non-acetaminophen) fulminant hepatic failure patients who should be referred for liver transplant evaluation.

### Acetaminophen-Induced Liver Failure:

**Transplant indicated if:**

- **Arterial pH < 7.30** (after adequate fluid resuscitation and >24 hours post-ingestion)

**OR all three of the following:**

1. INR > 6.5 (PT >100 seconds)
2. Creatinine > 3.4 mg/dL (>300 µmol/L)
3. Grade III or IV hepatic encephalopathy

### Non-Acetaminophen Liver Failure:

**Transplant indicated if:**

- **INR > 6.5** (regardless of encephalopathy grade)

**OR any three of the following five:**

1. Age <10 or >40 years
2. Etiology: non-A, non-B hepatitis, drug-induced, halothane, idiosyncratic
3. Duration of jaundice before encephalopathy >7 days
4. INR >3.5
5. Bilirubin >17.4 mg/dL (>300 µmol/L)

**Interpretation:**

- Meeting criteria → Refer for transplant evaluation urgently
- Good specificity (~95%) but moderate sensitivity (~58–69%); some patients not meeting criteria may still need transplant

---

## Done Nomogram

**Application:** Historically used to predict salicylate toxicity severity based on serum salicylate level and time since ingestion.

**Note: Limited clinical utility.** The Done nomogram is now considered unreliable and is NOT recommended for clinical decision-making. Reasons:

- Only applies to acute ingestion (not chronic)
- Does not account for clinical status, acid-base balance, or end-organ effects
- Serum levels do not reliably correlate with tissue levels

**Current Practice:**

- Treat based on clinical findings: altered mental status, tinnitus, tachypnea, acid-base status (respiratory alkalosis with metabolic acidosis), and serial salicylate levels
- Hemodialysis indications: salicylate level >100 mg/dL, renal failure, pulmonary edema, CNS toxicity, severe acidosis (pH <7.2), clinical deterioration despite treatment

---

## CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol — Revised)

**Application:** Standardized assessment of alcohol withdrawal severity to guide benzodiazepine dosing. Scored by clinical assessment.

**10 Components (scored 0–7 each, except orientation which is 0–4):**

|Component|Score Range|Assessment|
|---|---|---|
|Nausea/vomiting|0–7|None to constant nausea with dry heaves/vomiting|
|Tremor|0–7|None to severe (arms extended, fingers spread)|
|Paroxysmal sweats|0–7|None to drenching sweats|
|Anxiety|0–7|None to equivalent of acute panic state|
|Agitation|0–7|None to constant thrashing/pacing|
|Tactile disturbances|0–7|None to continuous hallucinations|
|Auditory disturbances|0–7|None to continuous hallucinations|
|Visual disturbances|0–7|None to continuous hallucinations|
|Headache/fullness in head|0–7|None to extremely severe|
|Orientation/clouding of sensorium|0–4|Oriented to uncertain about date/unable to do serial additions/disoriented|

**Total Score Range: 0–67**

**Interpretation and Dosing Guide:**

|Score|Severity|Management|
|---|---|---|
|<10|Mild withdrawal|Supportive care, may not need pharmacotherapy; reassess frequently|
|10–18|Moderate withdrawal|Benzodiazepine treatment indicated (symptom-triggered protocol)|
|>18|Severe withdrawal|Aggressive benzodiazepine treatment; monitor closely; consider ICU|
|>35|Very severe|High risk for seizures and delirium tremens; ICU recommended|

**Typical symptom-triggered protocol:** Administer diazepam 10–20 mg or chlordiazepoxide 50–100 mg when CIWA-Ar ≥10; reassess every 30–60 minutes.

---

## PAWSS (Prediction of Alcohol Withdrawal Severity Scale)

**Application:** Predicts which hospitalized patients are at risk for complicated alcohol withdrawal (seizures, delirium tremens) to guide prophylactic treatment.

**Threshold question:** Has the patient consumed alcohol within the last 30 days?

- If No → PAWSS score = 0, low risk
- If Yes → Complete full assessment

**Criteria (1 point each):**

1. Blood alcohol level >200 mg/dL on admission
2. Evidence of increased autonomic activity (HR >120, tremor, sweating)
3. Previous alcohol withdrawal seizure
4. Previous delirium tremens
5. Previous alcohol withdrawal requiring medical management
6. Combined alcohol with benzodiazepines, barbiturates, or other sedatives
7. Previous blackouts
8. Previous alcohol rehabilitation/detox program attendance
9. Concurrent illicit drug use
10. In the past: arrested or legal problems related to alcohol

**Score Range: 0–10**

**Interpretation:**

|Score|Risk|Action|
|---|---|---|
|0–3|Low|Unlikely to need pharmacologic withdrawal prophylaxis|
|≥4|High|Initiate withdrawal prophylaxis; CIWA monitoring|

---

# ENDOCRINE

---

## Burch-Wartofsky Point Scale (BWPS)

**Application:** Differentiates thyroid storm from uncomplicated thyrotoxicosis.

**Criteria:**

|Parameter|Value|Points|
|---|---|---|
|**Temperature**|99–99.9°F (37.2–37.7°C)|5|
||100–100.9°F (37.8–38.2°C)|10|
||101–101.9°F (38.3–38.8°C)|15|
||102–102.9°F (38.9–39.4°C)|20|
||103–103.9°F (39.5–40.0°C)|25|
||≥104°F (≥40.0°C)|30|
|**CNS effects**|Absent|0|
||Mild (agitation)|10|
||Moderate (delirium, psychosis, extreme lethargy)|20|
||Severe (seizure, coma)|30|
|**GI/Hepatic**|Absent|0|
||Moderate (diarrhea, nausea/vomiting, abdominal pain)|10|
||Severe (unexplained jaundice)|20|
|**Heart rate**|<90|0|
||90–109|5|
||110–119|10|
||120–129|15|
||130–139|20|
||≥140|25|
|**Heart failure**|Absent|0|
||Mild (pedal edema)|5|
||Moderate (bibasilar rales)|10|
||Severe (pulmonary edema)|15|
|**Atrial fibrillation**|Absent|0|
||Present|10|
|**Precipitant**|Negative/absent|0|
||Positive (recent surgery, infection, etc.)|10|

**Score Range: 0–140+**

**Interpretation:**

|Score|Diagnosis|
|---|---|
|<25|Thyroid storm unlikely|
|25–44|Impending thyroid storm; consider treatment|
|≥45|Thyroid storm highly likely; treat aggressively|

---

## ADA DKA Severity Criteria

**Application:** Classifies diabetic ketoacidosis (DKA) as mild, moderate, or severe to guide management intensity.

|Parameter|Mild DKA|Moderate DKA|Severe DKA|
|---|---|---|---|
|Arterial pH|7.25–7.30|7.00–7.24|<7.00|
|Serum bicarbonate (mEq/L)|15–18|10–14.9|<10|
|Urine ketones|Positive|Positive|Positive|
|Serum ketones|Positive|Positive|Positive|
|Effective serum osmolality|Variable|Variable|Variable|
|Anion gap|>10|>12|>12|
|Mental status|Alert|Alert/drowsy|Stupor/coma|

**Glucose criteria:** Typically glucose >250 mg/dL (but euglycemic DKA can occur with SGLT2 inhibitors)

**Additional calculations:**

- **Anion gap** = Na⁺ − (Cl⁻ + HCO₃⁻); normal ~12 ± 4
- **Corrected sodium** = Measured Na⁺ + 1.6 × ((glucose − 100) / 100)
- **Effective osmolality** = 2 × Na⁺ + (glucose / 18)

**Management guidance:**

- Mild: May be treated in ED/observation with IV fluids + insulin
- Moderate: Requires close monitoring, likely admission
- Severe: ICU admission, aggressive IV insulin + fluid resuscitation

---

# HEMATOLOGY / COAGULATION

---

## HEMORR₂HAGES Score

**Application:** Predicts risk of major hemorrhage in elderly patients with atrial fibrillation on anticoagulation.

**Criteria:**

|Letter|Variable|Points|
|---|---|---|
|**H**|Hepatic or renal disease|1|
|**E**|Ethanol abuse|1|
|**M**|Malignancy|1|
|**O**|Older age (>75)|1|
|**R**|Reduced platelet count or function|1|
|**R**|Re-bleeding risk (prior bleed)|2|
|**H**|Hypertension (uncontrolled)|1|
|**A**|Anemia|1|
|**G**|Genetic factors (CYP2C9 variants)|1|
|**E**|Excessive fall risk|1|
|**S**|Stroke history|1|

**Score Range: 0–12**

**Interpretation:**

|Score|Annual Hemorrhage Rate|
|---|---|
|0|1.9%|
|1|2.5%|
|2|5.3%|
|3|8.4%|
|4|10.4%|
|≥5|12.3%|

---

## 4Ts Score

**Application:** Estimates pre-test probability of heparin-induced thrombocytopenia (HIT).

**Criteria:**

|Component|0 points|1 point|2 points|
|---|---|---|---|
|**T**hrombocytopenia|Fall <30% or nadir <10,000|Fall 30–50% or nadir 10,000–19,000|Fall >50% AND nadir ≥20,000|
|**T**iming of platelet fall|<4 days without recent heparin exposure|Consistent with days 5–10 but not clear; onset after day 10; or fall ≤1 day with heparin in past 30–100 days|Clear onset days 5–10 or ≤1 day with heparin exposure within past 30 days|
|**T**hrombosis or other sequelae|None|Progressive or recurrent thrombosis; non-necrotizing skin lesions; suspected but unproven thrombosis|New thrombosis; skin necrosis; acute systemic reaction post-heparin bolus|
|**O**ther causes for thrombocytopenia|Definite other cause present|Possible other cause|No other cause apparent|

**Score Range: 0–8**

**Interpretation:**

|Score|Pre-Test Probability|Action|
|---|---|---|
|0–3|Low (~5% HIT probability)|HIT unlikely; consider other causes; PF4/H-PF4 antibody testing usually unnecessary|
|4–5|Intermediate (~14%)|Send immunoassay (PF4); consider switching anticoagulation pending results|
|6–8|High (~64%)|High probability; stop heparin immediately; start alternative anticoagulation; send confirmatory testing|

---

## ISTH DIC Score

**Application:** Diagnoses overt disseminated intravascular coagulation.

**Prerequisites:** Patient must have underlying condition known to be associated with DIC (sepsis, trauma, malignancy, obstetric complications, etc.)

**Criteria:**

|Variable|Value|Points|
|---|---|---|
|Platelet count (×10³/µL)|>100|0|
||50–100|1|
||<50|2|
|D-dimer / FDP|No increase|0|
||Moderate increase|2|
||Strong increase|3|
|Prolonged PT|<3 sec over ULN|0|
||3–6 sec over ULN|1|
||>6 sec over ULN|2|
|Fibrinogen (g/L)|≥1.0|0|
||<1.0|1|

**Score Range: 0–8**

**Interpretation:**

|Score|Diagnosis|
|---|---|
|<5|Not suggestive of overt DIC; repeat in 1–2 days if suspicion remains|
|≥5|Compatible with overt DIC; treat underlying cause + supportive care|

---

# PEDIATRIC — Additional

---

## TEN-4-FACESp Rule

**Application:** Identifies bruising patterns in young children (<4 years) suspicious for child abuse/non-accidental trauma.

**Bruising Location — Concerning for Abuse:**

- **T**orso (front or back)
- **E**ar (any part)
- **N**eck
- In a child **<4** months of age: ANY bruising (very high concern)
- **F**renulum
- **A**ngle of jaw
- **C**heek
- **E**yelid
- **S**ubconjunctival hemorrhage
- **p**atterned bruising (in the shape of an object)

**Interpretation:**

- Bruising in ANY of these locations in a pre-mobile infant or young child → High suspicion for non-accidental trauma
- ANY bruising in an infant <4 months → Warrants thorough evaluation for abuse
- Refer for child protective evaluation, skeletal survey, and further workup as indicated

---

## Pittsburgh Infant Brain Injury Score (PIBS)

**Application:** Identifies infants (<12 months) at risk for abusive head trauma.

**Criteria:**

|Variable|Points|
|---|---|
|Abnormal dermatologic exam (unexplained bruising in non-mobile infant)|2|
|Age ≤3 months|1|
|Head circumference >90th percentile or crossing percentiles|1|
|Abnormal neurological exam|1|
|Hemoglobin <11.2 g/dL|1|

**Interpretation:**

- Higher scores → Higher probability of abusive head trauma
- Score ≥2: Consider neuroimaging (CT or MRI) and full abuse evaluation
- Score 0: Low risk, but clinical judgment always applies

---

## Westley Croup Score

**Application:** Quantifies croup severity to guide treatment (dexamethasone, nebulized epinephrine).

**Criteria:**

|Component|Score|
|---|---|
|**Stridor**|None = 0; With agitation only = 1; At rest = 2|
|**Retractions**|None = 0; Mild = 1; Moderate = 2; Severe = 3|
|**Air entry**|Normal = 0; Decreased = 1; Markedly decreased = 2|
|**Cyanosis**|None = 0; With agitation = 4; At rest = 5|
|**Level of consciousness**|Normal = 0; Disoriented/altered = 5|

**Score Range: 0–17**

**Interpretation:**

|Score|Severity|Management|
|---|---|---|
|≤2|Mild|Dexamethasone (0.6 mg/kg PO/IM, max 10 mg); discharge likely|
|3–5|Moderate|Dexamethasone + consider nebulized epinephrine; observe|
|6–11|Severe|Dexamethasone + nebulized epinephrine; admit|
|≥12|Impending respiratory failure|Dexamethasone + nebulized epinephrine; prepare for intubation; ICU|

---

## Tal Score / Modified Tal Score

**Application:** Severity scoring for bronchiolitis in infants.

**Components (each scored 0–3):**

|Component|0|1|2|3|
|---|---|---|---|---|
|Respiratory rate (<6 mo / ≥6 mo)|<40 / <30|41–55 / 31–45|56–70 / 46–60|>70 / >60|
|Wheezing|None|End-expiratory only|Entire expiration|Inspiratory + expiratory (or silent chest)|
|Retractions|None|Subcostal only|Subcostal + intercostal|Subcostal + intercostal + suprasternal/nasal flaring|
|SpO₂ (room air)|≥95%|93–94%|90–92%|<90%|

_Note: Some versions use cyanosis or general condition instead of SpO₂_

**Score Range: 0–12**

**Interpretation:**

|Score|Severity|
|---|---|
|≤4|Mild|
|5–8|Moderate|
|9–12|Severe|

---

## Gorelick Dehydration Scale

**Application:** Estimates degree of dehydration in children (1 month to 5 years).

**Clinical Signs (1 point each):**

1. Decreased skin elasticity (tenting)
2. Capillary refill >2 seconds
3. General appearance: ill
4. Absent tears when crying
5. Dry mucous membranes
6. Abnormal respirations (deep/rapid)
7. Sunken eyes
8. Abnormal radial pulse (weak/absent)
9. Tachycardia (HR >150 if <2 yr; >130 if 2–5 yr)
10. Decreased urine output (per history)

**Score Range: 0–10**

**Interpretation:**

|Score|Dehydration Level|Estimated Fluid Deficit|
|---|---|---|
|0|<5% (minimal)|<50 mL/kg|
|1–2|~5% (mild)|~50 mL/kg|
|3–6|~5–10% (moderate)|~50–100 mL/kg|
|≥7|>10% (severe)|>100 mL/kg|

---

## CDS (Clinical Dehydration Scale)

**Application:** Simpler pediatric dehydration assessment validated for children 1 month to 3 years with gastroenteritis.

**Components (scored 0, 1, or 2):**

|Component|0 (None)|1 (Some)|2 (Moderate/Severe)|
|---|---|---|---|
|General appearance|Normal|Thirsty, restless, or lethargic but irritable when touched|Drowsy, limp, cold, sweaty, ± comatose|
|Eyes|Normal|Slightly sunken|Very sunken|
|Mucous membranes|Moist|Sticky|Dry|
|Tears|Present|Decreased|Absent|

**Score Range: 0–8**

**Interpretation:**

|Score|Dehydration|
|---|---|
|0|No dehydration|
|1–4|Some dehydration (~3–6%)|
|5–8|Moderate/severe dehydration (~6–9%+)|

---

# PROCEDURAL / AIRWAY

---

## LEMON Assessment

**Application:** Predicts difficult intubation.

|Letter|Component|Assessment|
|---|---|---|
|**L**|Look externally|Facial trauma, large incisors, beard, large tongue, facial/neck obesity → suggest difficulty|
|**E**|Evaluate 3-3-2|See 3-3-2 Rule below|
|**M**|Mallampati score|Class I–IV (see below)|
|**O**|Obstruction|Any condition causing upper airway obstruction (epiglottitis, peritonsillar abscess, tumor)|
|**N**|Neck mobility|Limited neck extension (C-collar, ankylosing spondylitis, rheumatoid arthritis) → difficult|

### Mallampati Classification (assessed sitting, mouth open, tongue protruded, without phonation):

|Class|View|
|---|---|
|I|Soft palate, fauces, uvula, pillars visible|
|II|Soft palate, fauces, uvula visible|
|III|Soft palate, base of uvula visible|
|IV|Only hard palate visible|

**Interpretation:** Class III–IV predicts more difficult laryngoscopy. Combined LEMON assessment identifies multiple risk factors; any positive component warrants preparation for difficult airway.

---

## MOANS

**Application:** Predicts difficult bag-valve-mask (BVM) ventilation.

|Letter|Risk Factor|
|---|---|
|**M**|Mask seal difficulty (beard, facial trauma, blood, abnormal anatomy)|
|**O**|Obesity / Obstruction (BMI >26, pregnancy, upper airway obstruction)|
|**A**|Age >55 years (loss of tissue elasticity)|
|**N**|No teeth (edentulous — actually both difficult: hard to seal but sometimes easier to ventilate)|
|**S**|Stiffness (of lungs/chest wall: asthma, COPD, pulmonary fibrosis, third trimester pregnancy) or Snoring/Sleep apnea|

**Interpretation:** Any positive factor → anticipate difficult BVM ventilation; have adjuncts ready (OPA/NPA, two-person technique, supraglottic device backup)

---

## RODS

**Application:** Predicts difficult extraglottic device (EGD/supraglottic airway) placement.

|Letter|Risk Factor|
|---|---|
|**R**|Restricted mouth opening (<3 cm or 2 finger-breadths)|
|**O**|Obstruction (supraglottic or glottic pathology)|
|**D**|Disrupted or Distorted airway anatomy|
|**S**|Stiffness (of lungs/chest wall, limiting ventilation even if device placed)|

**Interpretation:** Any positive factor → EGD may not be a reliable rescue; plan for surgical airway.

---

## SHORT

**Application:** Predicts difficult cricothyrotomy (surgical airway).

|Letter|Risk Factor|
|---|---|
|**S**|Surgery or Scarring (previous neck surgery, radiation changes)|
|**H**|Hematoma (expanding neck hematoma, edema)|
|**O**|Obesity (difficulty palpating landmarks)|
|**R**|Radiation changes (previous radiation therapy to neck)|
|**T**|Tumor or abnormal anatomy|

**Interpretation:** Any positive factor → Cricothyrotomy may be technically difficult; consider awake intubation, have backup plans, consider patient positioning.

---

## 3-3-2 Rule

**Application:** Quick bedside airway geometry assessment to predict difficulty with direct laryngoscopy.

**Three Measurements:**

1. **3 finger-breadths:** Mouth opening (inter-incisor distance) — should be ≥3 fingerbreadths (~4–5 cm)
2. **3 finger-breadths:** Mental-hyoid distance (floor of mouth/submandibular space) — should be ≥3 fingerbreadths
3. **2 finger-breadths:** Hyoid-thyroid notch distance (thyromental distance approximation) — should be ≥2 fingerbreadths

**Interpretation:**

- All measurements adequate → Likely adequate space for laryngoscopy
- Any measurement reduced → Predicts difficulty; plan accordingly

---

## ASA Physical Status Classification

**Application:** Pre-procedural risk stratification; standardized communication about patient baseline health.

|Class|Definition|Examples|
|---|---|---|
|ASA I|Normal healthy patient|Healthy, non-smoking, minimal alcohol|
|ASA II|Patient with mild systemic disease|Mild disease only without functional limitation: current smoker, mild obesity (BMI 30–40), well-controlled DM/HTN, mild lung disease|
|ASA III|Patient with severe systemic disease|Substantive functional limitation: poorly controlled DM/HTN, COPD, morbid obesity (BMI ≥40), active hepatitis, alcohol dependence, pacemaker, moderate EF reduction, ESRD on dialysis, history of MI/CVA/TIA/CAD (>3 months ago)|
|ASA IV|Patient with severe systemic disease that is a constant threat to life|Recent MI/CVA/TIA (<3 months), ongoing cardiac ischemia, severe valve dysfunction, severe EF reduction, sepsis, DIC, ARDS|
|ASA V|Moribund patient not expected to survive without operation|Ruptured AAA, massive trauma, intracranial bleed with mass effect, ischemic bowel with cardiac pathology|
|ASA VI|Declared brain-dead patient (organ donor)|—|

_Add "E" for emergency (e.g., ASA IIIE)_

**Interpretation for ED Procedural Sedation:**

- ASA I–II: Generally safe for ED procedural sedation by emergency physicians
- ASA III: Increased risk; careful risk-benefit analysis; consider anesthesia involvement
- ASA IV–V: High risk; strong consideration for anesthesia-managed sedation or operating room

---

# ENVIRONMENTAL

---

## Swiss Staging System (Hypothermia)

**Application:** Classifies hypothermia severity based on clinical signs, applicable in the field when core temperature measurement may not be available.

|Stage|Core Temp|Clinical Signs|Consciousness|
|---|---|---|---|
|HT I (Mild)|32–35°C (89.6–95°F)|Shivering, conscious|Clear, may have impaired judgment|
|HT II (Moderate)|28–32°C (82.4–89.6°F)|Shivering may stop|Impaired consciousness, drowsy|
|HT III (Severe)|24–28°C (75.2–82.4°F)|No shivering|Unconscious, vital signs present|
|HT IV (Profound)|<24°C (<75.2°F)|Apparent death|No vital signs (may still be viable)|
|HT V|<13.7°C (<56.7°F)|Death from irreversible hypothermia||

**Management by Stage:**

- HT I: External passive rewarming (remove wet clothes, blankets, warm environment)
- HT II: Active external rewarming (forced warm air, warm blankets) + minimize movement (dysrhythmia risk)
- HT III: Active internal rewarming (warm IV fluids, warm humidified oxygen, consider body cavity lavage); handle gently; limit to 3 defibrillation attempts if VF
- HT IV: ECMO/cardiopulmonary bypass if available; "Not dead until warm and dead"

---

## Bouchama Criteria (Heat Stroke)

**Application:** Diagnostic criteria for classic and exertional heat stroke.

**Classic Definition (all three):**

1. Core body temperature >40°C (104°F)
2. Central nervous system dysfunction (altered mental status: confusion, delirium, seizure, coma)
3. Hot, dry skin (classic) or hot, sweaty skin (exertional) — sweating may be present or absent

**Additional features supporting diagnosis:**

- Elevated liver enzymes, rhabdomyolysis, DIC, renal failure, ARDS
- Typically occurs in the context of heat exposure (environmental or exertional)

**Differentiation from Heat Exhaustion:**

- Heat exhaustion: Temperature may be elevated but typically <40°C; mental status is NORMAL; symptoms resolve with cooling and rehydration
- Heat stroke: Temperature >40°C with CNS dysfunction; medical emergency requiring aggressive cooling

**Management:**

- Immediate aggressive cooling: target temperature <39°C within 30 minutes
- Cold water immersion is the gold standard for exertional heat stroke
- Ice packs, evaporative cooling, cold IV fluids for classic heat stroke or when immersion unavailable

---

# DISPOSITION / RISK STRATIFICATION

---

## APACHE II (Acute Physiology and Chronic Health Evaluation II)

**Application:** ICU mortality prediction; calculated within first 24 hours of ICU admission using worst physiological values.

**Three Components:**

### A. Acute Physiology Score (APS) — 12 variables, scored 0–4 each:

|Variable|Normal (0)|Abnormal range (1–4)|
|---|---|---|
|Temperature (°C)|36–38.4|Deviations scored 1–4|
|Mean arterial pressure (mmHg)|70–109|Scored by deviation|
|Heart rate|70–109|Scored by deviation|
|Respiratory rate|12–24|Scored by deviation|
|Oxygenation (FiO₂ ≥0.5: use A-aDO₂; <0.5: use PaO₂)|Variable|Scored by deviation|
|Arterial pH|7.33–7.49|Scored by deviation|
|Serum sodium (mEq/L)|130–149|Scored by deviation|
|Serum potassium (mEq/L)|3.5–5.4|Scored by deviation|
|Serum creatinine (mg/dL)|0.6–1.4|Scored by deviation (double points if acute renal failure)|
|Hematocrit (%)|30–45.9|Scored by deviation|
|WBC (×10³/µL)|3–14.9|Scored by deviation|
|Glasgow Coma Scale|15|Score = 15 − GCS|

### B. Age Points:

|Age|Points|
|---|---|
|<44|0|
|45–54|2|
|55–64|3|
|65–74|5|
|≥75|6|

### C. Chronic Health Points:

- If patient has severe organ insufficiency or is immunocompromised:
    - Non-operative or emergency surgical admission: +5 points
    - Elective surgical admission: +2 points

**Total Score Range: 0–71 (theoretical)**

**Interpretation:**

|Score|Approximate Mortality|
|---|---|
|0–4|~4%|
|5–9|~8%|
|10–14|~15%|
|15–19|~25%|
|20–24|~40%|
|25–29|~55%|
|30–34|~75%|
|>34|~85%+|

_Note: Requires dedicated calculator. APACHE IV is the more current version but requires proprietary software._

---

## NEWS2 (National Early Warning Score 2)

**Application:** Detects clinical deterioration and identifies need for escalation of care. Used for inpatient monitoring.

**Scoring:**

|Parameter|3|2|1|0|1|2|3|
|---|---|---|---|---|---|---|---|
|RR (breaths/min)|≤8|—|9–11|12–20|—|21–24|≥25|
|SpO₂ Scale 1 (%)|≤91|92–93|94–95|≥96|—|—|—|
|SpO₂ Scale 2* (%)|≤83|84–85|86–87|88–92 (or ≥93 on air)|93–94 on O₂|95–96 on O₂|≥97 on O₂|
|Supplemental O₂|—|Yes = 2|—|No = 0|—|—|—|
|SBP (mmHg)|≤90|91–100|101–110|111–219|—|—|≥220|
|HR (bpm)|≤40|—|41–50|51–90|91–110|111–130|≥131|
|Consciousness|—|—|—|Alert|—|—|CVPU (Confusion, Voice, Pain, Unresponsive)|
|Temperature (°C)|≤35.0|—|35.1–36.0|36.1–38.0|38.1–39.0|≥39.1|—|

_Scale 2 used for patients with type II respiratory failure (e.g., COPD with target SpO₂ 88–92%)_

**Total Score Range: 0–20**

**Interpretation:**

|Total Score|Clinical Risk|Response|
|---|---|---|
|0–4|Low|Routine monitoring|
|3 in single parameter|Low-medium|Urgent bedside assessment|
|5–6|Medium|Urgent response; consider escalation|
|≥7|High|Emergency response; critical care assessment|

---

## MEWS (Modified Early Warning Score)

**Application:** Simplified deterioration detection tool for inpatient monitoring.

**Scoring:**

|Parameter|0|1|2|3|
|---|---|---|---|---|
|SBP (mmHg)|101–199|81–100 or ≥200|71–80|≤70|
|HR (bpm)|51–100|41–50 or 101–110|≤40 or 111–129|≥130|
|RR (breaths/min)|9–14|15–20|21–29|≤8 or ≥30|
|Temperature (°C)|35–38.4|38.5|<35 or ≥38.5|—|
|Consciousness (AVPU)|Alert|Responds to Voice|Responds to Pain|Unresponsive|

**Score Range: 0–15**

**Interpretation:**

|Score|Action|
|---|---|
|0–2|Continue routine monitoring|
|3–4|Increase monitoring frequency; notify primary team|
|≥5|Urgent medical review; consider ICU/critical care consultation|

---

## Glasgow Coma Scale (GCS)

**Application:** Standardized assessment of level of consciousness.

**Components:**

|Component|Response|Score|
|---|---|---|
|**Eye Opening (E)**|Spontaneous|4|
||To voice|3|
||To pain|2|
||None|1|
|**Verbal Response (V)**|Oriented|5|
||Confused|4|
||Inappropriate words|3|
||Incomprehensible sounds|2|
||None|1|
|**Motor Response (M)**|Obeys commands|6|
||Localizes pain|5|
||Withdraws from pain|4|
||Abnormal flexion (decorticate)|3|
||Extension (decerebrate)|2|
||None|1|

**Total Score Range: 3–15**

**Interpretation:**

|GCS|Severity|
|---|---|
|13–15|Mild brain injury|
|9–12|Moderate brain injury|
|≤8|Severe brain injury (generally indicates need for intubation)|

**Report as:** GCS [total] (E[#] V[#] M[#]) — e.g., "GCS 11 (E3 V3 M5)"

---

## Revised Trauma Score (RTS)

**Application:** Prehospital and ED triage tool; predicts survival in trauma.

**Components (coded values):**

|GCS|Coded Value|SBP (mmHg)|Coded Value|RR (breaths/min)|Coded Value|
|---|---|---|---|---|---|
|13–15|4|>89|4|10–29|4|
|9–12|3|76–89|3|>29|3|
|6–8|2|50–75|2|6–9|2|
|4–5|1|1–49|1|1–5|1|
|3|0|0|0|0|0|

**Triage RTS (T-RTS):** Simple sum of coded values (range 0–12)

- T-RTS ≤11: Consider trauma center transport

**RTS (weighted):**

```
RTS = 0.9368 × GCS(coded) + 0.7326 × SBP(coded) + 0.2908 × RR(coded)
```

Range: 0–7.8408

**Interpretation:**

- Higher RTS = better prognosis
- RTS <4: ~30% predicted survival
- Used in TRISS methodology (combines with ISS for outcome prediction)

---

## Injury Severity Score (ISS)

**Application:** Anatomic injury severity measure calculated AFTER injuries are identified.

**Method:**

1. Assign an Abbreviated Injury Scale (AIS) severity code (1–6) to the most severe injury in each of 6 body regions:
    
    - Head/Neck
    - Face
    - Chest
    - Abdomen/Pelvic contents
    - Extremities/Pelvic girdle
    - External (skin/burns)
2. Take the THREE highest AIS scores from three DIFFERENT body regions
    
3. Square each and sum:
    

```
ISS = (highest AIS)² + (2nd highest AIS)² + (3rd highest AIS)²
```

**AIS Scale:**

|AIS|Severity|
|---|---|
|1|Minor|
|2|Moderate|
|3|Serious|
|4|Severe|
|5|Critical|
|6|Unsurvivable|

_If any AIS = 6, ISS is automatically 75_

**Score Range: 1–75**

**Interpretation:**

|ISS|Severity|
|---|---|
|<9|Minor|
|9–15|Moderate|
|16–24|Severe (major trauma)|
|≥25|Critical|
|75|Unsurvivable injury present|

**Example:** Head AIS 4, Chest AIS 3, Extremity AIS 2 → ISS = 16 + 9 + 4 = 29

---

## MELD Score / MELD-Na

**Application:** End-stage liver disease severity; transplant prioritization; predicts 90-day mortality.

### MELD Score:

```
MELD = 10 × [0.957 × ln(Creatinine) + 0.378 × ln(Bilirubin) + 1.120 × ln(INR)] + 6.43
```

**Variables:**

- Creatinine (mg/dL): bounded at 1.0 (minimum) and 4.0 (maximum); if on dialysis ≥2× in past week → set to 4.0
- Total Bilirubin (mg/dL): bounded at 1.0 minimum
- INR: bounded at 1.0 minimum

**Score Range: 6–40**

### MELD-Na (accounts for hyponatremia):

```
MELD-Na = MELD + 1.32 × (137 − Na) − [0.033 × MELD × (137 − Na)]
```

- Sodium bounded at 125–137 mEq/L for calculation
- If Na >137 → set to 137; if Na <125 → set to 125

**Interpretation:**

|MELD|90-Day Mortality|
|---|---|
|<10|~2%|
|10–19|~6%|
|20–29|~20%|
|30–39|~53%|
|≥40|~71%|

- Higher MELD/MELD-Na → Higher priority on transplant waiting list
- MELD >15: Generally indicates transplant evaluation
- Also used to predict surgical mortality in cirrhotic patients

---

## Child-Pugh Score

**Application:** Classifies cirrhosis severity; predicts surgical risk and survival.

**Criteria:**

|Variable|1 point|2 points|3 points|
|---|---|---|---|
|Total bilirubin (mg/dL)|<2|2–3|>3|
|Albumin (g/dL)|>3.5|2.8–3.5|<2.8|
|INR|<1.7|1.7–2.3|>2.3|
|Ascites|None|Slight (controlled with meds)|Moderate–severe (refractory)|
|Hepatic encephalopathy|None|Grade I–II (or controlled with meds)|Grade III–IV (or refractory)|

**Score Range: 5–15**

**Classification:**

|Class|Score|1-Year Survival|2-Year Survival|
|---|---|---|---|
|A (Well-compensated)|5–6|100%|85%|
|B (Significant compromise)|7–9|81%|57%|
|C (Decompensated)|10–15|45%|35%|

---

_End of Document_

**Key References:**

- MDCalc (mdcalc.com) — Interactive calculators for all rules above
- Stiell IG, Wells GA. Methodologic standards for the development of clinical decision rules in emergency medicine. _Ann Emerg Med_ 1999;33:437-447.
- Tintinalli's Emergency Medicine, 9th Edition
- Roberts & Hedges' Clinical Procedures in Emergency Medicine, 7th Edition
- ESC, AHA/ACC, ACEP, and AAP Clinical Practice Guidelines (cited within individual rules)