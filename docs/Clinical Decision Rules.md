# Clinical Decision Rules: Complete LLM Calculation & Application Reference

> **Purpose:** This document provides structured, calculable instructions for every major clinical decision rule used in emergency medicine, including supplementary specialty CDRs across OB/GYN, psychiatry, nephrology, burns, oncology, critical care, dermatology, ENT, orthopedics, rheumatology, geriatrics, sports medicine, and palliative care. Each entry includes the rule's purpose, exact scoring criteria, calculation method, and clinical interpretation so that an LLM can accurately compute and apply each rule.

> **Important Disclaimer:** Clinical decision rules supplement—never replace—clinical judgment. Always interpret scores in the context of the individual patient.

---

# TABLE OF CONTENTS

1. [TRAUMA](#trauma)
2. [CARDIOVASCULAR](#cardiovascular)
3. [PULMONARY](#pulmonary)
4. [NEUROLOGY](#neurology)
5. [GASTROINTESTINAL](#gastrointestinal)
6. [GENITOURINARY](#genitourinary)
7. [INFECTIOUS DISEASE](#infectious-disease)
8. [TOXICOLOGY](#toxicology)
9. [ENDOCRINE](#endocrine)
10. [HEMATOLOGY / COAGULATION](#hematology--coagulation)
11. [PEDIATRIC — Additional](#pediatric--additional)
12. [PROCEDURAL / AIRWAY](#procedural--airway)
13. [ENVIRONMENTAL](#environmental)
14. [DISPOSITION / RISK STRATIFICATION](#disposition--risk-stratification)
15. [OB/GYN & OBSTETRIC EMERGENCY](#obgyn--obstetric-emergency)
16. [PSYCHIATRY & BEHAVIORAL HEALTH](#psychiatry--behavioral-health)
17. [NEPHROLOGY & ELECTROLYTES](#nephrology--electrolytes)
18. [BURNS & WOUND MANAGEMENT](#burns--wound-management)
19. [ONCOLOGIC EMERGENCY](#oncologic-emergency)
20. [CRITICAL CARE & ICU](#critical-care--icu)
21. [DERMATOLOGY](#dermatology)
22. [ENT / OTOLARYNGOLOGY](#ent--otolaryngology)
23. [ORTHOPEDIC & MUSCULOSKELETAL](#orthopedic--musculoskeletal)
24. [RHEUMATOLOGY](#rheumatology)
25. [GERIATRICS & DELIRIUM](#geriatrics--delirium)
26. [SPORTS MEDICINE & CONCUSSION](#sports-medicine--concussion)
27. [PALLIATIVE CARE & PROGNOSIS](#palliative-care--prognosis)

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


## Shock Index

**Application:** Rapid bedside assessment of hemodynamic status. Identifies occult shock in trauma and hemorrhage before traditional vital signs are abnormal.

**Formula:**

Shock Index = Heart Rate / Systolic Blood Pressure

**Calculation & Interpretation:**

- SI 0.5–0.7: Normal
- SI 0.7–1.0: Mild shock / borderline — close monitoring
- SI 1.0–1.4: Moderate shock — likely significant hemorrhage, consider transfusion
- SI >1.4: Severe shock — massive hemorrhage likely, activate massive transfusion protocol
- More sensitive than HR or SBP alone for detecting early hemorrhagic shock
- Elevated SI predicts need for massive transfusion, ICU admission, and mortality

**Modified Shock Index = HR / MAP** (less commonly used, normal 0.7–1.3)

**Source:** Birkhahn RH et al. Shock index in diagnosing early acute hypovolemia. Am J Emerg Med. 2005;23(3):323-326.

---

## ABC Score (Assessment of Blood Consumption)

**Application:** Rapid bedside assessment to predict need for massive transfusion in trauma.

**Criteria (1 point each):**

1. Penetrating mechanism
2. Systolic blood pressure ≤90 mmHg in ED
3. Heart rate ≥120 bpm in ED
4. Positive FAST exam (free fluid)

**Calculation & Interpretation:**

| ABC Score | Massive Transfusion Needed |
|-----------|---------------------------|
| 0 | 1% |
| 1 | 10% |
| 2 | 41% |
| 3 | 48% |
| 4 | 100% |

- Score ≥2: Activate massive transfusion protocol
- Requires no lab values — entirely bedside assessment
- Sensitivity 75%, specificity 86% for massive transfusion

**Source:** Nunez TC et al. Early prediction of massive transfusion in trauma: Simple as ABC. J Trauma. 2009;66(2):346-352.

---

## TASH Score (Trauma-Associated Severe Hemorrhage)

**Application:** Predicts probability of massive transfusion in trauma using clinical and laboratory variables.

**Criteria:**

| Variable | Threshold | Points |
|----------|-----------|--------|
| SBP <100 mmHg | Yes | 4 |
| SBP <120 mmHg | Yes | 1 |
| Hemoglobin <7 g/dL | Yes | 8 |
| Hemoglobin 7–<9 g/dL | Yes | 6 |
| Hemoglobin 9–<10 g/dL | Yes | 4 |
| Hemoglobin 10–<11 g/dL | Yes | 3 |
| Hemoglobin 11–<12 g/dL | Yes | 1 |
| Intra-abdominal fluid (FAST+) | Yes | 3 |
| Unstable pelvic fracture | Yes | 6 |
| Open/displaced femur fracture | Yes | 3 |
| Heart rate >120 bpm | Yes | 2 |
| Base excess ≤ −10 | Yes | 4 |
| Base excess −6 to −10 | Yes | 3 |
| Base excess −2 to −6 | Yes | 1 |
| Male sex | Yes | 1 |

**Calculation & Interpretation:**

| TASH Score | Probability of Massive Transfusion |
|------------|-----------------------------------|
| <10 | <5% |
| 10–14 | 10–20% |
| 15–18 | 30–50% |
| >18 | >50% |
| ≥27 | ~100% |

**Source:** Yücel N et al. Trauma Associated Severe Hemorrhage (TASH)-Score: Probability of mass transfusion as surrogate for life threatening hemorrhage after multiple trauma. J Trauma. 2006;60(6):1228-1236.

---

## BIG Score (Pediatric Trauma Mortality)

**Application:** Predicts mortality in pediatric trauma using three simple variables: Base deficit, INR, and GCS.

**Formula:**

BIG Score = (Base deficit) + (2.5 × INR) + (15 − GCS)

**Calculation & Interpretation:**

| BIG Score | Predicted Mortality |
|-----------|-------------------|
| <10 | <5% |
| 10–15 | ~10% |
| 16–25 | ~30% |
| 26–35 | ~60% |
| >35 | >80% |

- Higher scores indicate greater mortality risk
- Simple enough for rapid bedside calculation
- Validated in both adult and pediatric trauma populations

**Source:** Borgman MA et al. The ratio of blood products transfused affects mortality in patients receiving massive transfusions at a combat support hospital. J Trauma. 2007;63(4):805-813. Davis AL et al. The BIG Score and prediction of mortality in pediatric blunt trauma. J Surg Res. 2015;197(1):25-31.

---

## Denver Criteria (Blunt Cerebrovascular Injury Screening)

**Application:** Identifies patients at risk for blunt cerebrovascular injury (BCVI) who need CT angiography of the neck.

**Screening Criteria (ANY one = CTA indicated):**

**Signs/Symptoms:**
1. Arterial hemorrhage from neck/nose/mouth
2. Cervical bruit in patient <50 years old
3. Expanding cervical hematoma
4. Focal neurological deficit (TIA, stroke, hemiparesis)
5. Neurological exam inconsistent with head CT findings
6. Stroke on secondary CT or MRI

**Risk Factors (Mechanism/Injury patterns):**
7. High-energy mechanism with LeForte II or III fracture
8. Cervical spine fracture (subluxation, fractures involving transverse foramen, C1-C3 fractures)
9. Basilar skull fracture with carotid canal involvement
10. Diffuse axonal injury with GCS <6
11. Near-hanging with anoxic brain injury
12. Clothesline-type injury or seat belt abrasion with significant swelling/altered mental status

**Calculation & Interpretation:**

- ANY criterion present → CTA of head/neck recommended
- Sensitivity >95% for clinically significant BCVI when all criteria applied
- BCVI incidence in screened population: ~1–2%
- Biffl grading for identified injuries: I (intimal irregularity), II (dissection/intramural hematoma), III (pseudoaneurysm), IV (occlusion), V (transection)

**Source:** Biffl WL et al. Western Trauma Association critical decisions in trauma: Screening for and treatment of blunt cerebrovascular injuries. J Trauma. 2009;67(6):1150-1153.

---

## NEXUS Blunt Cerebrovascular Screening Criteria

**Application:** Alternative to Denver criteria for BCVI screening. Any criterion triggers CTA of neck.

**Criteria (ANY one = CTA indicated):**

1. Cervical spine fracture
2. Neurological deficit not explained by brain imaging
3. Basilar skull fracture
4. LeForte II or III facial fracture
5. Carotid canal fracture
6. Diffuse axonal injury
7. Cervical spine ligamentous injury with subluxation
8. Thoracic vascular injury
9. Blunt cardiac rupture
10. Upper rib fractures (1st or 2nd)
11. Scalp degloving
12. Thoracic vascular injury
13. TBI with GCS ≤8

**Interpretation:**

- Sensitivity 96.2% for BCVI
- More inclusive than Denver criteria — may lead to more imaging but misses fewer injuries

**Source:** Biffl WL et al. Blunt cerebrovascular injury screening guidelines. J Am Coll Surg. 2020;230(3):462-472.

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


## GRACE 2.0 Score (Global Registry of Acute Coronary Events)

**Application:** Predicts in-hospital and 6-month mortality in patients with acute coronary syndrome (NSTEMI/STEMI). Used for risk stratification and treatment decisions.

**Criteria (continuous variables, weighted by regression model):**

1. **Age:** (continuous, higher weight with increasing age)
2. **Heart rate:** (continuous)
3. **Systolic blood pressure:** (continuous, inverse relationship)
4. **Creatinine:** (continuous)
5. **Killip class:** I (no CHF), II (rales/JVD), III (pulmonary edema), IV (cardiogenic shock)
6. **Cardiac arrest at admission:** Yes/No
7. **ST-segment deviation:** Yes/No
8. **Elevated cardiac biomarkers:** Yes/No

**Calculation & Interpretation (in-hospital mortality):**

| GRACE Score | Risk Category | In-Hospital Mortality |
|-------------|--------------|----------------------|
| ≤108 | Low | <1% |
| 109–140 | Intermediate | 1–3% |
| >140 | High | >3% |

| GRACE Score | 6-Month Mortality |
|-------------|------------------|
| ≤88 | Low (<3%) |
| 89–118 | Intermediate (3–8%) |
| >118 | High (>8%) |

- High-risk patients benefit most from early invasive strategy
- GRACE 2.0 uses non-linear functions; requires calculator or app for exact scoring
- Endorsed by ESC guidelines for ACS risk stratification

**Source:** Fox KAA et al. Prediction of risk of death and myocardial infarction in the six months after presentation with ACS: Prospective multinational observational study (GRACE). BMJ. 2006;333(7578):1091.

---

## CRUSADE Bleeding Score

**Application:** Predicts in-hospital major bleeding risk in NSTEMI patients. Guides decisions about anticoagulation intensity and invasive strategy.

**Criteria:**

| Variable | Values & Points |
|----------|----------------|
| **Baseline hematocrit** | <31%: 9 | 31–33.9%: 7 | 34–36.9%: 3 | 37–39.9%: 2 | ≥40%: 0 |
| **Creatinine clearance** | ≤15: 39 | >15–30: 35 | >30–60: 28 | >60–90: 17 | >90–120: 7 | >120: 0 |
| **Heart rate** | ≤70: 0 | 71–80: 1 | 81–90: 3 | 91–100: 6 | 101–110: 8 | 111–120: 10 | >120: 11 |
| **Sex** | Male: 0 | Female: 8 |
| **Signs of CHF at presentation** | No: 0 | Yes: 7 |
| **Prior vascular disease** | No: 0 | Yes: 6 |
| **Diabetes** | No: 0 | Yes: 6 |
| **Systolic BP** | ≤90: 10 | 91–100: 8 | 101–120: 5 | 121–180: 1 | 181–200: 3 | >200: 5 |

**Calculation & Interpretation:**

| CRUSADE Score | Risk Category | Major Bleeding Rate |
|---------------|--------------|-------------------|
| ≤20 | Very low | 3.1% |
| 21–30 | Low | 5.5% |
| 31–40 | Moderate | 8.6% |
| 41–50 | High | 11.9% |
| >50 | Very high | 19.5% |

**Source:** Subherwal S et al. Baseline risk of major bleeding in non-ST-segment-elevation myocardial infarction: The CRUSADE Bleeding Score. Circulation. 2009;119(14):1873-1882.

---

## Sgarbossa Criteria (STEMI Diagnosis in LBBB)

**Application:** Identifies acute MI in the presence of left bundle branch block (LBBB), where standard ST criteria are unreliable.

**Original Sgarbossa Criteria:**

1. Concordant ST elevation ≥1 mm in leads with positive QRS complex — **5 points**
2. Concordant ST depression ≥1 mm in V1–V3 — **3 points**
3. Discordant ST elevation ≥5 mm in leads with negative QRS complex — **2 points**

**Original Interpretation:**
- Score ≥3: Highly specific for acute MI (specificity ~90%)
- Criterion 1 alone (5 points) is most specific

**Smith-Modified Sgarbossa Criteria (preferred):**

Replaces criterion 3 with a ratio-based rule:
- Discordant ST elevation/S-wave amplitude ratio ≤ −0.25 (i.e., ST elevation is ≥25% of the depth of the preceding S wave)

**Modified Interpretation:**
- ANY one modified criterion present → treat as STEMI equivalent
- Sensitivity ~91%, specificity ~90% (improved over original)
- Apply to LBBB and ventricular-paced rhythms

**Source:** Sgarbossa EB et al. Electrocardiographic diagnosis of evolving acute myocardial infarction in the presence of left bundle-branch block. N Engl J Med. 1996;334(8):481-487. Smith SW et al. Diagnosis of ST-elevation myocardial infarction in the presence of left bundle branch block with the ST-elevation to S-wave ratio in a modified Sgarbossa rule. Ann Emerg Med. 2012;60(6):766-776.

---

## Framingham Heart Failure Criteria

**Application:** Clinical diagnosis of congestive heart failure. Requires 2 major criteria OR 1 major + 2 minor criteria.

**Major Criteria:**
1. Paroxysmal nocturnal dyspnea
2. Neck vein distention
3. Rales
4. Radiographic cardiomegaly
5. Acute pulmonary edema
6. S3 gallop
7. Central venous pressure >16 cmH₂O
8. Hepatojugular reflux
9. Weight loss >4.5 kg in 5 days in response to treatment

**Minor Criteria:**
1. Bilateral ankle edema
2. Nocturnal cough
3. Dyspnea on ordinary exertion
4. Hepatomegaly
5. Pleural effusion
6. Decrease in vital capacity by one third
7. Tachycardia (HR >120 bpm)

**Calculation & Interpretation:**

- **CHF diagnosis:** 2 major criteria OR 1 major + 2 minor criteria
- Minor criteria only valid if not attributable to another medical condition
- Sensitivity ~97%, specificity ~78%
- Weight loss from treatment can only count as major criterion

**Source:** McKee PA et al. The natural history of congestive heart failure: The Framingham study. N Engl J Med. 1971;285(26):1441-1446.

---

## Duke Activity Status Index (DASI)

**Application:** Estimates functional capacity in METs (metabolic equivalents) from self-reported activities. Used for preoperative cardiac risk assessment.

**Criteria (Yes/No for each activity, weighted score):**

| Activity | Score |
|----------|-------|
| Personal care (eating, dressing, toileting) | 2.75 |
| Walk indoors (around the house) | 1.75 |
| Walk 1–2 blocks on level ground | 2.75 |
| Climb a flight of stairs or walk up a hill | 5.50 |
| Run a short distance | 8.00 |
| Light housework (dishes, dusting) | 2.70 |
| Moderate housework (vacuuming, sweeping, carrying groceries) | 3.50 |
| Heavy housework (scrubbing floors, moving heavy furniture) | 8.00 |
| Yard work (raking, weeding, pushing mower) | 4.50 |
| Sexual relations | 5.25 |
| Moderate recreation (golf, bowling, dancing, doubles tennis) | 6.00 |
| Strenuous sports (swimming, singles tennis, football, basketball, skiing) | 7.50 |

**Calculation:**

- Sum all "Yes" activities = DASI score (range 0–58.2)
- Estimated METs = (0.43 × DASI score + 9.6) ÷ 3.5
- Peak VO₂ (mL/kg/min) = 0.43 × DASI score + 9.6

**Interpretation:**

- DASI <34 (approximately <7 METs): Increased perioperative cardiac risk
- DASI ≥34: Adequate functional capacity; generally low perioperative risk
- <4 METs (DASI <12): Poor functional capacity; consider further cardiac testing

**Source:** Hlatky MA et al. A brief self-administered questionnaire to determine functional capacity (the Duke Activity Status Index). Am J Cardiol. 1989;64(10):651-654.

---

## ATRIA Bleeding Risk Score

**Application:** Predicts major hemorrhage risk in patients on warfarin for atrial fibrillation.

**Criteria:**

| Variable | Points |
|----------|--------|
| Anemia (Hgb <13 g/dL male, <12 g/dL female) | 3 |
| Severe renal disease (eGFR <30 or dialysis) | 3 |
| Age ≥75 years | 2 |
| Prior hemorrhage | 1 |
| Hypertension (diagnosed) | 1 |

**Calculation & Interpretation:**

| Score | Risk Category | Annual Hemorrhage Rate |
|-------|--------------|----------------------|
| 0–3 | Low | 0.8% |
| 4 | Intermediate | 2.6% |
| 5–10 | High | 5.8% |

**Source:** Fang MC et al. A new risk scheme to predict warfarin-associated hemorrhage: The ATRIA study. J Am Coll Cardiol. 2011;58(4):395-401.

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


## Light's Criteria (Pleural Effusion)

**Application:** Differentiates transudative from exudative pleural effusions. Essential for determining the etiology of pleural effusion.

**Criteria (ANY one = exudate):**

1. Pleural fluid protein / serum protein >0.5
2. Pleural fluid LDH / serum LDH >0.6
3. Pleural fluid LDH > 2/3 the upper limit of normal serum LDH

**Calculation & Interpretation:**

- **Exudate** (meets ≥1 criterion): Caused by local/inflammatory processes — infection, malignancy, PE, autoimmune. Requires further workup (cell count, glucose, pH, cytology, cultures)
- **Transudate** (meets none): Caused by systemic factors — CHF, cirrhosis, nephrotic syndrome. Treat underlying cause
- Sensitivity ~98% for exudates, specificity ~83%
- ~25% of CHF effusions misclassified as exudate (especially with diuretics) — if clinical suspicion for transudate is high, check serum-effusion albumin gradient (>1.2 g/dL favors transudate)

**Source:** Light RW et al. Pleural effusions: The diagnostic separation of transudates and exudates. Ann Intern Med. 1972;77(4):507-513.

---

## Berlin Criteria (ARDS Definition)

**Application:** Defines Acute Respiratory Distress Syndrome (ARDS) and classifies severity to guide ventilator management.

**Diagnostic Criteria (ALL required):**

1. **Timing:** Within 1 week of clinical insult or new/worsening respiratory symptoms
2. **Imaging:** Bilateral opacities not fully explained by effusions, atelectasis, or nodules (CXR or CT)
3. **Origin:** Respiratory failure not fully explained by cardiac failure or fluid overload (need objective assessment if no risk factor present)
4. **Oxygenation:** PaO₂/FiO₂ ratio on PEEP ≥5 cmH₂O (or CPAP ≥5)

**Severity Classification:**

| Severity | PaO₂/FiO₂ | Mortality |
|----------|-----------|-----------|
| Mild | 200–300 | 27% |
| Moderate | 100–200 | 32% |
| Severe | ≤100 | 45% |

**Calculation & Interpretation:**

- Mild ARDS: Consider noninvasive ventilation; PEEP ≥5 cmH₂O
- Moderate ARDS: Lung-protective ventilation (6 mL/kg IBW), higher PEEP strategy
- Severe ARDS: Lung-protective ventilation, prone positioning ≥16 hr/day, consider ECMO, neuromuscular blockade
- PaO₂/FiO₂ = PaO₂ (mmHg) ÷ FiO₂ (decimal). Example: PaO₂ 80 on 40% O₂ = 80/0.4 = 200

**Source:** ARDS Definition Task Force. Acute respiratory distress syndrome: The Berlin definition. JAMA. 2012;307(23):2526-2533.

---

## SMART-COP (Pneumonia ICU Admission)

**Application:** Predicts need for intensive respiratory or vasopressor support (IRVS) in community-acquired pneumonia. Identifies patients who need ICU admission.

**Criteria:**

| Variable | Threshold | Points |
|----------|-----------|--------|
| **S**ystolic BP <90 mmHg | Yes | 2 |
| **M**ultilobar CXR involvement | Yes | 1 |
| **A**lbumin <3.5 g/dL | Yes | 1 |
| **R**espiratory rate (≥25 if age ≤50, ≥30 if age >50) | Elevated | 1 |
| **T**achycardia ≥125 bpm | Yes | 1 |
| **C**onfusion (new onset) | Yes | 1 |
| **O**xygen low (PaO₂ <70, SpO₂ <93%, or PaO₂/FiO₂ <333 if ≤50; PaO₂ <60, SpO₂ <90%, or PaO₂/FiO₂ <250 if >50) | Yes | 2 |
| **P**H <7.35 | Yes | 2 |

**Calculation & Interpretation:**

| Score | Risk | Need for IRVS |
|-------|------|---------------|
| 0–2 | Low | ~5% |
| 3–4 | Moderate | ~18% |
| 5–6 | High | ~36% |
| ≥7 | Very high | ~62% |

- Score ≥3: Consider ICU admission or step-down unit
- Score ≥5: Strongly consider ICU admission

**Source:** Charles PGP et al. SMART-COP: A tool for predicting the need for intensive respiratory or vasopressor support in community-acquired pneumonia. Clin Infect Dis. 2008;47(3):375-384.

---

## ROX Index (HFNC Failure Prediction)

**Application:** Predicts failure of high-flow nasal cannula (HFNC) oxygen therapy, identifying patients who may need intubation.

**Formula:**

ROX Index = (SpO₂ / FiO₂) / Respiratory Rate

**Assessment Timing:** Measured at 2, 6, and 12 hours after HFNC initiation

**Calculation & Interpretation:**

- ROX ≥4.88 at 2, 6, or 12 hours: Low risk of HFNC failure; continue HFNC
- ROX <3.85 at 2 hours: High risk of HFNC failure; consider intubation
- ROX <3.47 at 6 hours: High risk of HFNC failure
- ROX <3.85 at 12 hours: High risk of HFNC failure
- Intermediate values: Reassess frequently, trend ROX index

**Source:** Roca O et al. Predicting success of high-flow nasal cannula in pneumonia patients with hypoxemic respiratory failure: The utility of the ROX index. J Crit Care. 2016;35:200-205.

---

## BODE Index (COPD Prognosis)

**Application:** Multidimensional assessment of COPD prognosis. Predicts mortality better than FEV₁ alone.

**Criteria:**

| Variable | 0 points | 1 point | 2 points | 3 points |
|----------|----------|---------|----------|----------|
| **B**MI (kg/m²) | >21 | ≤21 | — | — |
| **O**bstruction (FEV₁ % predicted) | ≥65 | 50–64 | 36–49 | ≤35 |
| **D**yspnea (mMRC scale) | 0–1 | 2 | 3 | 4 |
| **E**xercise (6-min walk, meters) | ≥350 | 250–349 | 150–249 | ≤149 |

**mMRC Dyspnea Scale:**
- 0: Breathless with strenuous exercise only
- 1: Short of breath when hurrying on level or walking up a slight hill
- 2: Walks slower than peers due to breathlessness, or stops for breath on own pace
- 3: Stops for breath after ~100 meters or a few minutes on level
- 4: Too breathless to leave house or breathless dressing

**Calculation & Interpretation:**

| BODE Score | 4-Year Mortality |
|------------|-----------------|
| 0–2 | ~15% |
| 3–4 | ~25% |
| 5–6 | ~45% |
| 7–10 | ~80% |

**Source:** Celli BR et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. N Engl J Med. 2004;350(10):1005-1012.

---

## Rapid Shallow Breathing Index (RSBI)

**Application:** Predicts success of weaning from mechanical ventilation (spontaneous breathing trial).

**Formula:**

RSBI = Respiratory Rate / Tidal Volume (in liters)

- Measured during 1-minute spontaneous breathing on T-piece or minimal pressure support

**Calculation & Interpretation:**

- RSBI <105 breaths/min/L: Likely to tolerate extubation (positive predictive value ~78%)
- RSBI ≥105 breaths/min/L: Likely to fail extubation (negative predictive value ~95%)
- Example: RR 24, TV 0.4 L → RSBI = 60 → favorable
- Example: RR 35, TV 0.2 L → RSBI = 175 → unfavorable
- Best measured after 1–3 minutes of spontaneous breathing
- Less reliable in patients with COPD, neurological impairment, or prolonged ventilation

**Source:** Yang KL, Tobin MJ. A prospective study of indexes predicting the outcome of trials of weaning from mechanical ventilation. N Engl J Med. 1991;324(21):1445-1450.

---

## Murray Lung Injury Score

**Application:** Quantifies severity of acute lung injury. Can be used to identify patients who may benefit from ECMO.

**Criteria (0–4 points each):**

| Component | 0 | 1 | 2 | 3 | 4 |
|-----------|---|---|---|---|---|
| **CXR** | No consolidation | 1 quadrant | 2 quadrants | 3 quadrants | 4 quadrants |
| **PaO₂/FiO₂** | ≥300 | 225–299 | 175–224 | 100–174 | <100 |
| **PEEP (cmH₂O)** | ≤5 | 6–8 | 9–11 | 12–14 | ≥15 |
| **Compliance (mL/cmH₂O)** | ≥80 | 60–79 | 40–59 | 20–39 | ≤19 |

**Calculation:**

Murray Score = Sum of component scores ÷ Number of components used

**Interpretation:**

- 0: No lung injury
- 0.1–2.5: Mild to moderate lung injury
- >2.5: Severe lung injury (ARDS) — consider ECMO referral
- Used in ECMO referral criteria alongside other factors (duration of ventilation, reversibility)

**Source:** Murray JF et al. An expanded definition of the adult respiratory distress syndrome. Am Rev Respir Dis. 1988;138(3):720-723.

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


## Hunt and Hess Scale (Subarachnoid Hemorrhage)

**Application:** Clinical grading of subarachnoid hemorrhage (SAH) severity at presentation. Predicts surgical risk and outcome.

**Scale:**

| Grade | Description | Surgical Mortality |
|-------|-------------|-------------------|
| I | Asymptomatic or mild headache, slight nuchal rigidity | ~1% |
| II | Moderate to severe headache, nuchal rigidity, no neurological deficit except cranial nerve palsy | ~5% |
| III | Drowsiness, confusion, or mild focal deficit | ~19% |
| IV | Stupor, moderate to severe hemiparesis, possible decerebrate rigidity | ~42% |
| V | Deep coma, decerebrate rigidity, moribund appearance | ~77% |

**Interpretation:**

- Grade I–III: Generally considered for early surgical/endovascular intervention (within 72 hours)
- Grade IV–V: Management is more complex; may require stabilization before intervention
- Reassessment after resuscitation may improve grade
- Commonly used alongside Fisher/modified Fisher scale (CT-based)

**Source:** Hunt WE, Hess RM. Surgical risk as related to time of intervention in the repair of intracranial aneurysms. J Neurosurg. 1968;28(1):14-20.

---

## Modified Fisher Scale (SAH CT Grading)

**Application:** CT-based classification of subarachnoid hemorrhage. Predicts risk of delayed cerebral ischemia (vasospasm).

**Scale:**

| Grade | CT Findings | Vasospasm Risk |
|-------|-------------|---------------|
| 0 | No SAH or IVH | Very low |
| 1 | Thin SAH, no IVH | Low (~15%) |
| 2 | Thin SAH with IVH | Moderate (~20%) |
| 3 | Thick SAH, no IVH | High (~30%) |
| 4 | Thick SAH with IVH | Very high (~40%) |

- **Thin SAH:** <1 mm thickness in all cisterns
- **Thick SAH:** ≥1 mm thickness in any cistern
- **IVH:** Intraventricular hemorrhage

**Interpretation:**

- Grade 0–1: Lower risk; standard monitoring
- Grade 3–4: High vasospasm risk; aggressive monitoring with transcranial Doppler, possible prophylactic therapy
- All grades: Nimodipine 60 mg q4h for 21 days (standard of care)

**Source:** Frontera JA et al. Prediction of symptomatic vasospasm after subarachnoid hemorrhage: The modified Fisher scale. Neurosurgery. 2006;59(1):21-27.

---

## ICH Score (Intracerebral Hemorrhage)

**Application:** Predicts 30-day mortality in spontaneous intracerebral hemorrhage. Simple bedside tool for prognosis discussion.

**Criteria:**

| Component | Criteria | Points |
|-----------|----------|--------|
| GCS | 3–4 | 2 |
| | 5–12 | 1 |
| | 13–15 | 0 |
| ICH volume | ≥30 mL | 1 |
| | <30 mL | 0 |
| IVH | Present | 1 |
| | Absent | 0 |
| Infratentorial origin | Yes | 1 |
| | No | 0 |
| Age | ≥80 years | 1 |
| | <80 years | 0 |

**ICH Volume Estimation (ABC/2 method):**
Volume (mL) = (A × B × C) / 2
- A = largest diameter on CT (cm)
- B = diameter perpendicular to A on same slice (cm)
- C = number of slices with hemorrhage × slice thickness (cm)

**Calculation & Interpretation:**

| ICH Score | 30-Day Mortality |
|-----------|-----------------|
| 0 | 0% |
| 1 | 13% |
| 2 | 26% |
| 3 | 72% |
| 4 | 97% |
| 5 | 97% |
| 6 | 100% |

**Source:** Hemphill JC et al. The ICH Score: A simple, reliable grading scale for intracerebral hemorrhage. Stroke. 2001;32(4):891-897.

---

## FOUR Score (Full Outline of UnResponsiveness)

**Application:** Alternative to GCS for comatose patients, especially those who are intubated (cannot assess verbal). Assesses brainstem reflexes and respiration.

**Criteria (0–4 points each, 4 domains):**

**Eye Response (E):**
- 4: Eyelids open or opened, tracking or blinking to command
- 3: Eyelids open but not tracking
- 2: Eyelids closed but open to loud voice
- 1: Eyelids closed but open to pain
- 0: Eyelids remain closed with pain

**Motor Response (M):**
- 4: Thumbs-up, fist, or peace sign to command
- 3: Localizing to pain
- 2: Flexion response to pain
- 1: Extension response to pain
- 0: No response to pain or generalized myoclonus status

**Brainstem Reflexes (B):**
- 4: Pupil AND corneal reflexes present
- 3: One pupil wide and fixed
- 2: Pupil OR corneal reflexes absent
- 1: Pupil AND corneal reflexes absent
- 0: Absent pupil, corneal, AND cough reflex

**Respiration (R):**
- 4: Not intubated, regular breathing pattern
- 3: Not intubated, Cheyne-Stokes breathing
- 2: Not intubated, irregular breathing
- 1: Breathes above ventilator rate (intubated)
- 0: Breathes at ventilator rate or apnea (intubated)

**Calculation & Interpretation:**

- Score range: 0–16
- Score 0 in all categories: May indicate brain death (requires formal testing)
- E0 + M0 + B0 + R0: Warrants brain death evaluation
- Advantages over GCS: Assesses brainstem reflexes, works in intubated patients, detects locked-in syndrome (E4 with low motor score)
- No direct mortality prediction cutoffs; used for trending and communication

**Source:** Wijdicks EFM et al. Validation of a new coma scale: The FOUR score. Ann Neurol. 2005;58(4):585-593.

---

## ASPECTS (Alberta Stroke Program Early CT Score)

**Application:** Standardized CT scoring system for quantifying early ischemic changes in MCA territory stroke. Used in endovascular thrombectomy eligibility.

**Scoring (10 regions, subtract 1 point for each affected region):**

**MCA Territory Regions (start at 10, subtract for each region with early ischemic changes):**

Ganglionic Level (4 regions):
1. **C** — Caudate nucleus
2. **L** — Lentiform nucleus
3. **IC** — Internal capsule
4. **I** — Insular ribbon

Supraganglionic Level (6 regions):
5. **M1** — Anterior MCA cortex
6. **M2** — MCA cortex lateral to insular ribbon
7. **M3** — Posterior MCA cortex
8. **M4** — Anterior MCA territory above M1
9. **M5** — Lateral MCA territory above M2
10. **M6** — Posterior MCA territory above M3

**Calculation & Interpretation:**

- ASPECTS 10: Normal CT (no early ischemic changes)
- ASPECTS 8–10: Small infarct core — favorable for reperfusion therapy
- ASPECTS 6–7: Moderate infarct — treatment decision based on clinical factors
- ASPECTS <6: Large infarct core — generally unfavorable for thrombectomy (higher risk of hemorrhagic transformation)
- Most thrombectomy trials required ASPECTS ≥6 for enrollment
- ASPECTS can also be applied to CTA source images and CT perfusion

**Source:** Barber PA et al. Validity and reliability of a quantitative computed tomography score in predicting outcome of hyperacute stroke before thrombolytic therapy. Lancet. 2000;355(9216):1670-1674.

---

## Modified Rankin Scale (mRS)

**Application:** Measures degree of disability/dependence after stroke. Primary outcome measure in stroke clinical trials.

**Scale:**

| Score | Description |
|-------|-------------|
| 0 | No symptoms |
| 1 | No significant disability; able to carry out all usual activities despite some symptoms |
| 2 | Slight disability; able to look after own affairs without assistance but unable to carry out all previous activities |
| 3 | Moderate disability; requires some help but able to walk unassisted |
| 4 | Moderately severe disability; unable to attend to own bodily needs without assistance, unable to walk unassisted |
| 5 | Severe disability; requires constant nursing care and attention, bedridden, incontinent |
| 6 | Dead |

**Interpretation:**

- mRS 0–2: Generally considered "good outcome" in stroke trials
- mRS 0–1: "Excellent outcome"
- mRS 3–5: Dependent / poor outcome
- Used at 90 days post-stroke as primary endpoint
- Shift analysis (ordinal analysis across entire scale) is now preferred over dichotomized analysis

**Source:** van Swieten JC et al. Interobserver agreement for the assessment of handicap in stroke patients. Stroke. 1988;19(5):604-607.

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


## Naranjo Adverse Drug Reaction Scale

**Application:** Assesses probability that an adverse event is caused by a drug rather than other factors.

**Criteria (10 questions):**

| Question | Yes | No | Unknown |
|----------|-----|-----|---------|
| Are there previous conclusive reports of this reaction? | +1 | 0 | 0 |
| Did the event appear after the suspected drug was administered? | +2 | −1 | 0 |
| Did the reaction improve when drug was discontinued or antagonist given? | +1 | 0 | 0 |
| Did the reaction reappear when drug was re-administered? | +2 | −1 | 0 |
| Are there alternative causes that could have caused the reaction? | −1 | +2 | 0 |
| Did the reaction reappear when placebo was given? | −1 | +1 | 0 |
| Was the drug detected in blood in toxic concentrations? | +1 | 0 | 0 |
| Was the reaction more severe when dose increased, or less severe when decreased? | +1 | 0 | 0 |
| Did the patient have a similar reaction to the same or similar drugs previously? | +1 | 0 | 0 |
| Was the event confirmed by objective evidence? | +1 | 0 | 0 |

**Calculation & Interpretation:**

| Score | Probability |
|-------|------------|
| ≥9 | Definite ADR |
| 5–8 | Probable ADR |
| 1–4 | Possible ADR |
| ≤0 | Doubtful ADR |

**Source:** Naranjo CA et al. A method for estimating the probability of adverse drug reactions. Clin Pharmacol Ther. 1981;30(2):239-245.

---

## QTc Calculation (Bazett and Fridericia)

**Application:** Corrects QT interval for heart rate. Prolonged QTc increases risk of torsades de pointes.

**Formulas:**

**Bazett (most commonly used):**
QTc = QT / √(RR interval in seconds)
- Or equivalently: QTc = QT / √(60/HR)

**Fridericia (more accurate at extreme heart rates):**
QTc = QT / ∛(RR interval in seconds)

**Calculation & Interpretation:**

| QTc (Bazett) | Male | Female |
|-------------|------|--------|
| Normal | <430 ms | <450 ms |
| Borderline | 430–450 ms | 450–470 ms |
| Prolonged | >450 ms | >470 ms |
| High risk for TdP | >500 ms | >500 ms |

- QTc >500 ms: Significant risk for torsades de pointes; discontinue offending drugs, correct electrolytes (Mg²⁺, K⁺, Ca²⁺)
- QTc increase >60 ms from baseline: Concerning even if absolute value <500
- Bazett overcorrects at high HR and undercorrects at low HR
- Fridericia preferred when HR <60 or >100 bpm

**Common QT-prolonging drugs:** Antiarrhythmics (sotalol, amiodarone, procainamide), antipsychotics (haloperidol, ziprasidone), antibiotics (fluoroquinolones, azithromycin), antiemetics (ondansetron), methadone

**Source:** Bazett HC. An analysis of the time-relations of electrocardiograms. Heart. 1920;7:353-370. Fridericia LS. Die Systolendauer im Elektrokardiogramm bei normalen Menschen. Acta Med Scand. 1920;53:469-486.

---

## Poisoning Severity Score (PSS)

**Application:** Standardized grading of acute poisoning severity. Used for clinical communication and outcome tracking.

**Grading:**

| Grade | Severity | Description |
|-------|----------|-------------|
| 0 | None | No symptoms or signs related to poisoning |
| 1 | Minor | Mild, transient, spontaneously resolving symptoms |
| 2 | Moderate | Pronounced or prolonged symptoms; may require treatment |
| 3 | Severe | Severe or life-threatening symptoms |
| 4 | Fatal | Death |

**Organ System Examples:**

| System | Minor (1) | Moderate (2) | Severe (3) |
|--------|-----------|-------------|------------|
| **GI** | Nausea, vomiting, diarrhea | Prolonged vomiting, GI bleeding | Massive hemorrhage, perforation |
| **Respiratory** | Cough, mild bronchospasm | Persistent dyspnea | Respiratory failure, ARDS |
| **Cardiovascular** | Mild tachycardia or hypertension | Pronounced tachy/bradycardia | Shock, cardiac arrest, MI |
| **Neurological** | Drowsiness, dizziness, tinnitus | Coma (responding to pain), brief seizure | Deep coma, status epilepticus |
| **Metabolic** | Mild acid-base/electrolyte disturbance | Pronounced disturbance | Severe disturbance (pH <7.1 or >7.7) |

**Interpretation:**

- Grade 0–1: Generally safe for outpatient management or brief observation
- Grade 2: Requires inpatient management and monitoring
- Grade 3: ICU admission required
- Score the worst-affected organ system to determine overall grade

**Source:** Persson HE et al. Poisoning severity score: Grading of acute poisoning. J Toxicol Clin Toxicol. 1998;36(3):205-213.

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


## Absolute Neutrophil Count (ANC) Calculation

**Application:** Determines severity of neutropenia to guide infection risk assessment and management.

**Formula:**

ANC = WBC × (% Neutrophils + % Bands) / 100

**Calculation & Interpretation:**

| ANC | Classification | Infection Risk |
|-----|---------------|----------------|
| >1500/μL | Normal | Baseline |
| 1000–1500/μL | Mild neutropenia | Slight increase |
| 500–1000/μL | Moderate neutropenia | Moderate risk |
| 100–500/μL | Severe neutropenia | High risk |
| <100/μL | Profound neutropenia | Very high risk |

- ANC <500: Febrile neutropenia protocol — blood cultures + empiric broad-spectrum antibiotics (typically antipseudomonal beta-lactam)
- Duration of neutropenia matters: >7 days increases fungal infection risk
- ANC <100 for >7 days: Consider empiric antifungal therapy

**Source:** Dale DC. Neutropenia and neutrophilia. In: Williams Hematology. 9th ed. 2016.

---

## Reticulocyte Production Index (RPI)

**Application:** Corrects reticulocyte count for anemia severity and reticulocyte maturation time. Distinguishes hypoproliferative vs. hyperproliferative anemia.

**Formula:**

Step 1: Corrected Reticulocyte Count = Reticulocyte % × (Patient Hct / Normal Hct)
- Normal Hct: 45% (male) or 40% (female)

Step 2: RPI = Corrected Reticulocyte Count / Maturation Factor

**Maturation Factor (based on Hct):**

| Hematocrit | Maturation Factor (days) |
|------------|-------------------------|
| ≥35% | 1.0 |
| 25–34% | 1.5 |
| 15–24% | 2.0 |
| <15% | 2.5 |

**Calculation & Interpretation:**

- RPI >2: Appropriate bone marrow response (hyperproliferative) — hemolysis or acute blood loss
- RPI <2: Inadequate bone marrow response (hypoproliferative) — iron deficiency, B12/folate deficiency, anemia of chronic disease, bone marrow failure

**Source:** Hillman RS, Finch CA. Erythropoiesis: Normal and abnormal. Semin Hematol. 1967;4(4):327-336.

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


## Yale Observation Scale (YOS)

**Application:** Assesses severity of illness in febrile children aged 3–36 months based on observation. Helps determine need for further evaluation.

**Criteria (1, 3, or 5 points each, 6 items):**

| Item | 1 (Normal) | 3 (Moderate Impairment) | 5 (Severe Impairment) |
|------|------------|------------------------|----------------------|
| Quality of cry | Strong OR not crying | Whimper or sob | Weak, moaning, or high-pitched |
| Reaction to parents | Cries briefly then stops, or content | Cries on and off | Continual cry or hardly responds |
| State variation | If awake stays awake, or easily aroused | Eyes close briefly, then awakes, or awakens with prolonged stimulation | Falls asleep or will not rouse |
| Color | Pink | Pale extremities or acrocyanosis | Pale, cyanotic, mottled, or ashen |
| Hydration | Skin/eyes normal, mucous membranes moist | Skin/eyes normal, mouth slightly dry | Skin doughy/tented, dry mucous membranes, sunken eyes |
| Response to social overtures | Smiles or alerts | Brief smile or alerts briefly | No smile, face anxious, dull, or no alerting |

**Calculation & Interpretation:**

- Score 6–10: Low risk of serious bacterial illness (<3%)
- Score 11–15: Moderate risk — further evaluation recommended
- Score ≥16: High risk of serious bacterial illness (~92% sensitivity) — full sepsis workup indicated
- Most useful in well-appearing febrile infants/toddlers to risk-stratify

**Source:** McCarthy PL et al. Observation scales to identify serious illness in febrile children. Pediatrics. 1982;70(5):802-809.

---

## PEWS (Pediatric Early Warning Score)

**Application:** Identifies pediatric inpatients at risk for clinical deterioration. Triggers escalation of care.

**Criteria (0–3 points each, 3 domains):**

| Score | Behavior | Cardiovascular | Respiratory |
|-------|----------|---------------|-------------|
| 0 | Playing/appropriate | Pink, CRT 1–2 sec | Normal rate, no retractions, SpO₂ >95% on RA |
| 1 | Sleeping | Pale OR CRT 3 sec | Rate >10 above normal, using accessory muscles, SpO₂ 91–95% on any FiO₂ |
| 2 | Irritable | Gray OR CRT 4 sec, tachycardia >20 above normal | Rate >20 above normal, retracting, SpO₂ <91% on any FiO₂ or ≥40% FiO₂ |
| 3 | Lethargic/confused, reduced pain response | Gray/mottled, CRT ≥5 sec OR tachycardia >30 above normal OR bradycardia | Rate ≥5 below normal with retractions/grunting, or ≥50% FiO₂ |

**Additional point:** +2 for nebulizer therapy q15 min or continuous

**Calculation & Interpretation:**

- Score 0–2: Routine monitoring
- Score 3: Increase monitoring frequency; bedside nurse assessment
- Score 4: Notify physician/rapid response team evaluation
- Score ≥5: Immediate physician evaluation; consider PICU transfer
- Reassess q1h if score ≥3

**Source:** Parshuram CS et al. Development and initial validation of the Bedside Paediatric Early Warning System score. Crit Care. 2009;13(4):R135.

---

## Bhutani Nomogram (Neonatal Jaundice)

**Application:** Risk-stratifies neonatal hyperbilirubinemia by plotting total serum bilirubin (TSB) against postnatal age in hours. Guides need for phototherapy.

**Risk Zones (TSB plotted on hour-specific nomogram):**

| Zone | TSB Percentile | Risk |
|------|---------------|------|
| High-risk | >95th percentile | ~40% risk of subsequent significant hyperbilirubinemia |
| High-intermediate | 75th–95th percentile | ~13% risk |
| Low-intermediate | 40th–75th percentile | ~2.2% risk |
| Low-risk | <40th percentile | ~0% risk |

**Approximate TSB Thresholds (at 48 hours of life):**

| Zone | TSB at 48 hours |
|------|----------------|
| High-risk | >15.5 mg/dL |
| High-intermediate | 13–15.5 mg/dL |
| Low-intermediate | 9.5–13 mg/dL |
| Low-risk | <9.5 mg/dL |

**Interpretation:**

- High-risk zone: Initiate phototherapy (per AAP guidelines); close follow-up within 24 hours
- High-intermediate: Follow-up within 24–48 hours; consider phototherapy if rising
- Low-intermediate: Follow-up within 48 hours
- Low-risk: Routine follow-up
- **AAP 2022 Updated Guidelines:** Lowered phototherapy thresholds for infants with neurotoxicity risk factors (prematurity 35–37 weeks, isoimmune hemolytic disease, G6PD deficiency, asphyxia, significant lethargy, temperature instability, sepsis, albumin <3.0)

**Source:** Bhutani VK et al. Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy term and near-term newborns. Pediatrics. 1999;103(1):6-14.

---

## Phoenix Sepsis Criteria (2024)

**Application:** New international consensus criteria for pediatric sepsis, replacing previous SIRS-based definitions. Identifies organ dysfunction associated with infection.

**Phoenix Sepsis Score — 4 Organ Systems:**

**1. Respiratory (0–3 points):**
- PaO₂/FiO₂ or SpO₂/FiO₂ with invasive mechanical ventilation:
  - PaO₂/FiO₂ <400 OR SpO₂/FiO₂ <292: 1 point
  - PaO₂/FiO₂ <200 OR SpO₂/FiO₂ <220 on invasive ventilation: 2 points
  - PaO₂/FiO₂ <100 OR SpO₂/FiO₂ <148 on invasive ventilation: 3 points

**2. Cardiovascular (0–6 points):**
- Lactate >5 mmol/L: 1 point
- Age-adjusted MAP (low): 1 point
- Any vasoactive medication: 2 points
- ≥2 vasoactive medications: 4 points

**3. Coagulation (0–2 points):**
- Platelets <100,000: 1 point
- INR >1.3 or D-dimer >2 mg/L: 1 point

**4. Neurological (0–2 points):**
- GCS ≤10 (any age) or reactive pupils bilaterally absent: 1 point
- Fixed pupils bilaterally: 2 points

**Calculation & Interpretation:**

- **Phoenix Sepsis:** Suspected infection + Phoenix Sepsis Score ≥2 (at least 1 point from ≥2 organ systems)
- **Phoenix Septic Shock:** Phoenix Sepsis + cardiovascular score ≥1 (includes vasoactive use or lactate criteria)
- Mortality: Phoenix Sepsis ~3.5%, Phoenix Septic Shock ~10–15%
- Replaces the 2005 International Pediatric Sepsis Consensus definitions

**Source:** Schlapbach LJ et al. International consensus criteria for pediatric sepsis and septic shock. JAMA. 2024;331(8):665-674.

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

# OB/GYN & OBSTETRIC EMERGENCY

---

## Bishop Score

**Application:** Assesses cervical readiness for induction of labor. Higher scores predict successful vaginal delivery with induction.

**Criteria (0–3 points each):**

| Factor | 0 | 1 | 2 | 3 |
|--------|---|---|---|---|
| Dilation (cm) | Closed | 1–2 | 3–4 | ≥5 |
| Effacement (%) | 0–30 | 40–50 | 60–70 | ≥80 |
| Station | −3 | −2 | −1/0 | +1/+2 |
| Consistency | Firm | Medium | Soft | — |
| Position | Posterior | Mid | Anterior | — |

**Calculation & Interpretation:**

- Score 0–5: Unfavorable cervix; cervical ripening recommended before induction
- Score 6–7: Moderately favorable; induction may proceed
- Score 8–13: Favorable cervix; high likelihood of successful induction
- A Bishop score ≥8 has similar success rate to spontaneous labor

**Source:** Bishop EH. Pelvic Scoring for Elective Induction. Obstet Gynecol. 1964;24:266-268.

---

## Preeclampsia with Severe Features Criteria (ACOG)

**Application:** Identifies preeclampsia with severe features requiring urgent management, typically delivery if ≥34 weeks gestation.

**Diagnostic Criteria (requires hypertension + proteinuria OR hypertension + severe feature):**

**Hypertension:** SBP ≥140 or DBP ≥90 on two occasions ≥4 hours apart after 20 weeks gestation

**Severe Features (ANY one = severe):**
1. SBP ≥160 or DBP ≥110 (confirmed within minutes to facilitate timely treatment)
2. Thrombocytopenia: Platelets <100,000/μL
3. Liver transaminases ≥2× upper limit of normal
4. Severe persistent right upper quadrant or epigastric pain unresponsive to medication
5. Renal insufficiency: Serum creatinine >1.1 mg/dL or doubling of baseline
6. Pulmonary edema
7. New-onset headache unresponsive to medication or visual disturbances

**Calculation & Interpretation:**

- Preeclampsia WITHOUT severe features: close monitoring, delivery at 37 weeks
- Preeclampsia WITH severe features at ≥34 weeks: delivery recommended
- Preeclampsia WITH severe features at <34 weeks: expectant management may be considered at facilities with adequate maternal/neonatal ICU resources
- HELLP syndrome (Hemolysis, Elevated Liver enzymes, Low Platelets) is a variant of severe preeclampsia

**Source:** ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia. Obstet Gynecol. 2020;135(6):e237-e260.

---

## HELLP Syndrome Classification (Mississippi / Martin)

**Application:** Classifies severity of HELLP syndrome (Hemolysis, Elevated Liver enzymes, Low Platelets) to guide management intensity.

**Mississippi Classification:**

| Class | Platelets | AST or ALT | LDH |
|-------|-----------|------------|-----|
| Class 1 (Severe) | ≤50,000/μL | ≥70 IU/L | ≥600 IU/L |
| Class 2 (Moderate) | >50,000–100,000/μL | ≥70 IU/L | ≥600 IU/L |
| Class 3 (Mild) | >100,000–150,000/μL | ≥40 IU/L | ≥600 IU/L |

**Tennessee Classification (requires ALL three):**
1. Platelets ≤100,000/μL
2. AST ≥70 IU/L
3. LDH ≥600 IU/L

**Calculation & Interpretation:**

- Class 1: Highest maternal morbidity; most aggressive management required
- Class 2: Intermediate risk
- Class 3: Lower risk but still requires close monitoring
- Partial HELLP: Only 1–2 of the 3 Tennessee criteria met — may progress to complete HELLP
- All classes typically require delivery, with timing depending on gestational age and severity

**Source:** Martin JN et al. The spectrum of severe preeclampsia: Comparative analysis by HELLP syndrome classification. Am J Obstet Gynecol. 1999;180(6):1373-1384.

---

## Maternal Early Warning Criteria (MEWC)

**Application:** Identifies obstetric patients at risk for clinical deterioration requiring urgent evaluation.

**Trigger Criteria (ANY single parameter = activate response):**
1. Systolic BP <90 or >160 mmHg
2. Diastolic BP >100 mmHg
3. Heart rate <50 or >120 bpm
4. Respiratory rate <10 or >30 breaths/min
5. SpO₂ <95%
6. Oliguria: <35 mL/hr for ≥2 hours
7. Maternal agitation, confusion, or unresponsiveness
8. Patient, nurse, or family concern about clinical status

**Calculation & Interpretation:**

- ANY single trigger → bedside evaluation by obstetric provider within 30 minutes
- Multiple triggers or persistent abnormality → immediate evaluation
- Not a score — it is a binary triggering system (present/absent)
- Designed to reduce preventable maternal mortality from delayed recognition

**Source:** Mhyre JM et al. The Maternal Early Warning Criteria: A Proposal from the National Partnership for Maternal Safety. Obstet Gynecol. 2014;124(4):782-786.

---

## Kleihauer-Betke Interpretation & RhIG Dosing

**Application:** Quantifies fetal-maternal hemorrhage (FMH) volume to determine adequate RhIG (RhoGAM) dosing in Rh-negative mothers.

**Calculation:**

FMH volume (mL) = (Fetal cells counted / Total cells counted) × Maternal blood volume

- Maternal blood volume estimated at 5000 mL (or weight-based: 70 mL/kg)

**RhIG Dosing:**
- Standard dose: 300 μg RhIG covers 30 mL of fetal whole blood (15 mL fetal RBCs)
- Number of vials = FMH volume (mL) ÷ 30, then round UP and add 1 vial

**Interpretation:**

- FMH ≤30 mL: 1 standard dose (300 μg) RhIG adequate
- FMH >30 mL: Calculate additional vials needed
- Positive KB test in trauma: indicates significant placental abruption risk
- KB test is unreliable before 20 weeks gestation (use standard single dose)

**Source:** ACOG Practice Bulletin No. 181: Prevention of Rh D Alloimmunization. Obstet Gynecol. 2017;130(2):e57-e70.

---

## Apgar Score

**Application:** Rapid assessment of newborn clinical status at 1 and 5 minutes after birth. Guides need for resuscitation.

**Criteria (0–2 points each):**

| Sign | 0 | 1 | 2 |
|------|---|---|---|
| **A**ppearance (color) | Blue/pale all over | Body pink, extremities blue | Completely pink |
| **P**ulse (heart rate) | Absent | <100 bpm | ≥100 bpm |
| **G**rimace (reflex irritability) | No response | Grimace/weak cry | Vigorous cry/sneeze/cough |
| **A**ctivity (muscle tone) | Limp | Some flexion | Active motion |
| **R**espiration | Absent | Slow/irregular/weak cry | Good cry/regular breathing |

**Calculation & Interpretation:**

- Score 7–10: Normal; routine care
- Score 4–6: Moderately depressed; may need stimulation, suctioning, oxygen
- Score 0–3: Severely depressed; immediate resuscitation required
- 1-minute score: Guides immediate interventions
- 5-minute score: Better predictor of neonatal outcomes
- If 5-minute score <7, continue scoring every 5 minutes up to 20 minutes

**Source:** Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32:260-267.

---


# PSYCHIATRY & BEHAVIORAL HEALTH

---

## Columbia Suicide Severity Rating Scale (C-SSRS) — Screening Version

**Application:** Standardized screening for suicidal ideation and behavior. Used in emergency departments, primary care, and crisis settings.

**Screening Questions (asked sequentially; stop if criteria met):**

1. **Wish to be dead:** Have you wished you were dead or wished you could go to sleep and not wake up? (Yes/No)
2. **Non-specific suicidal thoughts:** Have you had any actual thoughts of killing yourself? (Yes/No)
3. **Active suicidal ideation with any method (not plan):** Have you been thinking about how you might do this? (Yes/No)
4. **Active suicidal ideation with some intent to act:** Have you had these thoughts and had some intention of acting on them? (Yes/No)
5. **Active suicidal ideation with specific plan and intent:** Have you started to work out or worked out the details of how to kill yourself, and do you intend to carry out this plan? (Yes/No)
6. **Suicidal behavior:** Have you done anything, started to do anything, or prepared to do anything to end your life? (Yes/No)

**Calculation & Interpretation:**

- Question 1 only = Yes: Low risk — brief intervention, safety planning
- Question 2 = Yes: Moderate risk — safety assessment, consider psychiatric evaluation
- Questions 3–5 = Yes: High risk — psychiatric evaluation required, consider hospitalization
- Question 6 = Yes: Highest risk — immediate psychiatric evaluation, 1:1 observation, likely hospitalization
- Any "Yes" answer warrants documented safety plan and follow-up

**Source:** Posner K et al. The Columbia-Suicide Severity Rating Scale: Initial validity and internal consistency findings. Am J Psychiatry. 2011;168(12):1266-1277.

---

## PHQ-9 (Patient Health Questionnaire-9)

**Application:** Screens for and measures severity of depression. Each item rates frequency of symptoms over past 2 weeks.

**Criteria (0–3 points each, 9 items):**

Over the past 2 weeks, how often have you been bothered by:
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling/staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself — or that you're a failure
7. Trouble concentrating on things
8. Moving or speaking so slowly others noticed? Or being fidgety/restless?
9. Thoughts that you would be better off dead, or of hurting yourself

**Scoring:** 0 = Not at all | 1 = Several days | 2 = More than half the days | 3 = Nearly every day

**Calculation & Interpretation:**

- 0–4: Minimal/no depression
- 5–9: Mild depression
- 10–14: Moderate depression — consider treatment plan
- 15–19: Moderately severe depression — active treatment recommended
- 20–27: Severe depression — immediate treatment, consider referral to psychiatry
- Item 9 positive (any score >0): Requires direct suicide risk assessment regardless of total score

**Source:** Kroenke K et al. The PHQ-9: Validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):601-613.

---

## PHQ-2 (Patient Health Questionnaire-2)

**Application:** Ultra-brief depression screening. First 2 items of PHQ-9. Used as initial screen; positive result triggers full PHQ-9.

**Criteria (0–3 points each):**

Over the past 2 weeks, how often have you been bothered by:
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless

**Scoring:** 0 = Not at all | 1 = Several days | 2 = More than half the days | 3 = Nearly every day

**Calculation & Interpretation:**

- Score ≥3: Positive screen — administer full PHQ-9
- Score <3: Negative screen (sensitivity 83%, specificity 92% for major depression)
- Score range: 0–6

**Source:** Kroenke K et al. The Patient Health Questionnaire-2: Validity of a two-item depression screener. Med Care. 2003;41(11):1284-1292.

---

## GAD-7 (Generalized Anxiety Disorder-7)

**Application:** Screens for and measures severity of generalized anxiety disorder. Also sensitive for panic, social anxiety, and PTSD.

**Criteria (0–3 points each, 7 items):**

Over the past 2 weeks, how often have you been bothered by:
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it's hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid, as if something awful might happen

**Scoring:** 0 = Not at all | 1 = Several days | 2 = More than half the days | 3 = Nearly every day

**Calculation & Interpretation:**

- 0–4: Minimal anxiety
- 5–9: Mild anxiety
- 10–14: Moderate anxiety — consider treatment
- 15–21: Severe anxiety — active treatment recommended
- Score ≥10: Sensitivity 89%, specificity 82% for GAD
- Also screens well for panic disorder (sensitivity 74%), social anxiety (sensitivity 72%), and PTSD (sensitivity 66%)

**Source:** Spitzer RL et al. A brief measure for assessing generalized anxiety disorder: The GAD-7. Arch Intern Med. 2006;166(10):1092-1097.

---

## CAGE Questionnaire

**Application:** Screens for alcohol use disorder. Simple 4-question screening tool.

**Criteria (1 point each, Yes/No):**

1. **C**ut down: Have you ever felt you should cut down on your drinking?
2. **A**nnoyed: Have people annoyed you by criticizing your drinking?
3. **G**uilty: Have you ever felt bad or guilty about your drinking?
4. **E**ye-opener: Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover?

**Calculation & Interpretation:**

- Score 0: Low suspicion
- Score 1: Low-moderate suspicion
- Score ≥2: Clinically significant — high suspicion for alcohol use disorder (sensitivity 93%, specificity 76%)
- Score ≥3: Very high likelihood of alcohol dependence
- Score 4: Nearly diagnostic of alcohol dependence

**Source:** Ewing JA. Detecting alcoholism: The CAGE questionnaire. JAMA. 1984;252(14):1905-1907.

---

## AUDIT (Alcohol Use Disorders Identification Test)

**Application:** WHO-developed comprehensive screening for hazardous drinking, harmful drinking, and alcohol dependence.

**Criteria (10 items, scored 0–4 each):**

**Consumption (Questions 1–3):**
1. How often do you have a drink containing alcohol? (0=Never, 1=Monthly or less, 2=2-4×/month, 3=2-3×/week, 4=4+×/week)
2. How many standard drinks on a typical drinking day? (0=1-2, 1=3-4, 2=5-6, 3=7-9, 4=10+)
3. How often ≥6 drinks on one occasion? (0=Never, 1=Less than monthly, 2=Monthly, 3=Weekly, 4=Daily/almost daily)

**Dependence (Questions 4–6):**
4. How often unable to stop drinking once started? (0–4 frequency scale)
5. How often failed to do what was expected due to drinking? (0–4 frequency scale)
6. How often needed morning drink? (0–4 frequency scale)

**Harmful Use (Questions 7–10):**
7. How often felt guilt/remorse after drinking? (0–4 frequency scale)
8. How often unable to remember the night before? (0–4 frequency scale)
9. Have you or someone else been injured due to your drinking? (0=No, 2=Yes but not in past year, 4=Yes during past year)
10. Has a relative, friend, or health worker expressed concern? (0=No, 2=Yes but not in past year, 4=Yes during past year)

**Calculation & Interpretation:**

- 0–7: Low risk
- 8–15: Hazardous drinking — brief intervention recommended
- 16–19: Harmful drinking — brief intervention + continued monitoring
- 20–40: Probable alcohol dependence — referral for diagnostic evaluation and treatment
- AUDIT-C (questions 1–3 only): Score ≥4 men / ≥3 women is positive screen

**Source:** Saunders JB et al. Development of the AUDIT. Addiction. 1993;88(6):791-804.

---

## COWS (Clinical Opiate Withdrawal Scale)

**Application:** Measures severity of opioid withdrawal to guide medication-assisted treatment (buprenorphine, methadone) initiation.

**Criteria (11 items, various point scales):**

1. **Resting pulse rate:** 0 (≤80) | 1 (81–100) | 2 (101–120) | 4 (>120)
2. **Sweating:** 0 (none) | 1 (barely perceptible) | 2 (beads of sweat on face) | 4 (streaming)
3. **Restlessness:** 0 (able to sit still) | 1 (reports difficulty) | 3 (frequent shifting) | 5 (unable to sit still)
4. **Pupil size:** 0 (pinned/normal) | 1 (possibly larger than normal) | 2 (moderately dilated) | 5 (dilated to point only rim of iris visible)
5. **Bone/joint aches:** 0 (none) | 1 (mild diffuse) | 2 (moderate/rubbing joints) | 4 (severe/unable to sit still)
6. **Runny nose/tearing:** 0 (none) | 1 (nasal stuffiness) | 2 (nose running/tearing) | 4 (nose constantly running/tears streaming)
7. **GI upset:** 0 (none) | 1 (stomach cramps) | 2 (nausea/loose stool) | 3 (vomiting/diarrhea) | 5 (multiple episodes/diarrhea)
8. **Tremor:** 0 (none) | 1 (can feel but not observe) | 2 (slight observable) | 4 (gross/twitching)
9. **Yawning:** 0 (none) | 1 (1–2 during assessment) | 2 (3–4) | 4 (several per minute)
10. **Anxiety/irritability:** 0 (none) | 1 (anxious) | 2 (overtly anxious/irritable) | 4 (so anxious/irritable patient cannot participate)
11. **Gooseflesh skin:** 0 (smooth) | 3 (piloerection can be felt) | 5 (prominent piloerection)

**Calculation & Interpretation:**

- Score 5–12: Mild withdrawal
- Score 13–24: Moderate withdrawal — can initiate buprenorphine
- Score 25–36: Moderately severe withdrawal
- Score ≥37: Severe withdrawal
- Buprenorphine initiation typically requires COWS ≥8–12
- Maximum score: 48

**Source:** Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs. 2003;35(2):253-259.

---

## RASS (Richmond Agitation-Sedation Scale)

**Application:** Standardized assessment of agitation and sedation level in ICU and ED patients. Used to titrate sedation and assess for delirium.

**Scale:**

| Score | Term | Description |
|-------|------|-------------|
| +4 | Combative | Overtly combative, violent, immediate danger to staff |
| +3 | Very agitated | Pulls/removes tubes or catheters, aggressive |
| +2 | Agitated | Frequent non-purposeful movement, fights ventilator |
| +1 | Restless | Anxious but movements not aggressive or vigorous |
| 0 | Alert & calm | — |
| −1 | Drowsy | Not fully alert, sustained awakening to voice (≥10 sec) |
| −2 | Light sedation | Briefly awakens to voice (<10 sec eye contact) |
| −3 | Moderate sedation | Movement or eye opening to voice (but no eye contact) |
| −4 | Deep sedation | No response to voice; movement to physical stimulation |
| −5 | Unarousable | No response to voice or physical stimulation |

**Assessment Procedure:**
1. Observe patient for 30 seconds — if alert and calm → RASS 0
2. If not alert, call patient's name and say "open your eyes and look at me" — score −1 to −3
3. If no response to voice, physically stimulate (shake shoulder, sternal rub) — score −4 to −5

**Interpretation:**

- Target RASS for most ICU patients: 0 to −2 (light sedation)
- RASS −3 to −5: Cannot assess for delirium (too sedated)
- RASS −1 to +4: Can assess for delirium using CAM-ICU

**Source:** Sessler CN et al. The Richmond Agitation-Sedation Scale: Validity and reliability in adult ICU patients. Am J Respir Crit Care Med. 2002;166(10):1338-1344.

---

## DAST-10 (Drug Abuse Screening Test)

**Application:** Screens for drug use problems (excluding alcohol and tobacco). 10-item self-report questionnaire referring to past 12 months.

**Questions (Yes = 1, No = 0; *except item 3 where scoring is reversed):**

1. Have you used drugs other than those required for medical reasons?
2. Do you abuse more than one drug at a time?
3. Are you always able to stop using drugs when you want to? *(No = 1)*
4. Have you had blackouts or flashbacks as a result of drug use?
5. Do you ever feel bad or guilty about your drug use?
6. Does your spouse/partner or parents ever complain about your drug use?
7. Have you neglected your family because of your use of drugs?
8. Have you engaged in illegal activities to obtain drugs?
9. Have you ever experienced withdrawal symptoms when you stopped taking drugs?
10. Have you had medical problems as a result of your drug use?

**Calculation & Interpretation:**

- 0: No problems reported
- 1–2: Low level — monitor
- 3–5: Moderate level — further investigation
- 6–8: Substantial level — intensive assessment
- 9–10: Severe level — intensive assessment and likely treatment needed

**Source:** Skinner HA. The Drug Abuse Screening Test. Addict Behav. 1982;7(4):363-371.

---

## SAD PERSONS Scale

**Application:** Mnemonic-based suicide risk assessment tool for emergency settings.

**Criteria (1 point each):**

1. **S**ex: Male
2. **A**ge: <19 or >45 years
3. **D**epression: Current or previous
4. **P**revious attempt: History of suicide attempt
5. **E**thanol abuse: Active alcohol use disorder
6. **R**ational thinking loss: Psychosis, organic brain syndrome
7. **S**ocial supports lacking: No close relationships, isolated
8. **O**rganized plan: Has specific plan for suicide
9. **N**o spouse: Divorced, widowed, separated, single
10. **S**ickness: Chronic illness, especially with pain or poor prognosis

**Calculation & Interpretation:**

- 0–2: May be safe for discharge with outpatient follow-up
- 3–4: Close follow-up; consider hospitalization
- 5–6: Strongly consider hospitalization
- 7–10: Hospitalize or commit

**Source:** Patterson WM et al. Evaluation of suicidal patients: The SAD PERSONS scale. Psychosomatics. 1983;24(4):343-349.

---

## MMSE (Mini-Mental State Examination)

**Application:** Brief standardized assessment of cognitive function. Screens for dementia and delirium. Total score 0–30.

**Criteria:**

| Domain | Task | Points |
|--------|------|--------|
| Orientation to Time | Year, season, month, date, day of week | 5 |
| Orientation to Place | State, county, city, building, floor | 5 |
| Registration | Repeat 3 objects (e.g., ball, flag, tree) | 3 |
| Attention/Calculation | Serial 7s (subtract from 100) OR spell "WORLD" backward | 5 |
| Recall | Recall the 3 objects from registration | 3 |
| Language: Naming | Name a pencil and a watch | 2 |
| Language: Repetition | Repeat "No ifs, ands, or buts" | 1 |
| Language: 3-stage command | Take paper in right hand, fold in half, put on floor | 3 |
| Language: Reading | Read and obey "Close your eyes" | 1 |
| Language: Writing | Write a sentence | 1 |
| Visuospatial | Copy intersecting pentagons | 1 |

**Calculation & Interpretation:**

- 24–30: Normal (adjust for education level)
- 19–23: Mild cognitive impairment
- 10–18: Moderate cognitive impairment
- 0–9: Severe cognitive impairment
- Education adjustment: Cutoff of 24 has lower sensitivity in highly educated patients, higher false-positive rate in those with less education

**Source:** Folstein MF et al. "Mini-mental state": A practical method for grading the cognitive state of patients. J Psychiatr Res. 1975;12(3):189-198.

---

## MoCA (Montreal Cognitive Assessment)

**Application:** Screens for mild cognitive impairment (MCI). More sensitive than MMSE for MCI and early dementia.

**Criteria (total 30 points):**

| Domain | Tasks | Points |
|--------|-------|--------|
| Visuospatial/Executive | Trail-making B adaptation, cube copy, clock drawing | 5 |
| Naming | Name 3 animals (lion, rhino, camel) | 3 |
| Attention | Digit span forward (5), backward (3), serial 7s (3), vigilance letter tap | 6 |
| Language | Sentence repetition (2), phonemic fluency F-words in 1 min | 3 |
| Abstraction | Similarity between pairs (train-bicycle, watch-ruler) | 2 |
| Delayed Recall | Recall 5 words (face, velvet, church, daisy, red) | 5 |
| Orientation | Date, month, year, day, place, city | 6 |

**Education correction:** Add 1 point if ≤12 years of education (maximum score remains 30)

**Calculation & Interpretation:**

- ≥26: Normal
- 18–25: Mild cognitive impairment
- 10–17: Moderate cognitive impairment
- <10: Severe cognitive impairment
- More sensitive than MMSE for detecting MCI (sensitivity 90% vs 18%)

**Source:** Nasreddine ZS et al. The Montreal Cognitive Assessment, MoCA: A brief screening tool for mild cognitive impairment. J Am Geriatr Soc. 2005;53(4):695-699.

---


# NEPHROLOGY & ELECTROLYTES

---

## KDIGO AKI Staging

**Application:** Standardized staging of Acute Kidney Injury (AKI) severity to guide management.

**Staging Criteria:**

| Stage | Serum Creatinine | Urine Output |
|-------|-----------------|--------------|
| Stage 1 | 1.5–1.9× baseline OR ≥0.3 mg/dL increase within 48 hrs | <0.5 mL/kg/hr for 6–12 hours |
| Stage 2 | 2.0–2.9× baseline | <0.5 mL/kg/hr for ≥12 hours |
| Stage 3 | ≥3.0× baseline OR ≥4.0 mg/dL OR initiation of RRT OR eGFR <35 in patients <18 yrs | <0.3 mL/kg/hr for ≥24 hours OR anuria for ≥12 hours |

**Calculation & Interpretation:**

- Stage 1: Identify and treat cause, optimize volume status, avoid nephrotoxins, monitor closely
- Stage 2: Above measures + consider nephrology consultation
- Stage 3: Nephrology consultation, evaluate for RRT indications (refractory volume overload, hyperkalemia, acidosis, uremic symptoms)
- Any stage: Adjust medication dosing for renal function
- Baseline creatinine: Use lowest value in prior 3 months; if unknown, can estimate from CKD-EPI assuming eGFR 75

**Source:** KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.

---

## CKD-EPI Equation (2021 Race-Free)

**Application:** Estimates GFR for classification of chronic kidney disease. The 2021 update removes the race coefficient.

**Formula (2021 CKD-EPI Creatinine Equation):**

**For females (Scr ≤0.7):** GFR = 142 × (Scr/0.7)^−0.241 × 0.9938^Age × 1.012

**For females (Scr >0.7):** GFR = 142 × (Scr/0.7)^−1.200 × 0.9938^Age × 1.012

**For males (Scr ≤0.9):** GFR = 142 × (Scr/0.9)^−0.302 × 0.9938^Age

**For males (Scr >0.9):** GFR = 142 × (Scr/0.9)^−1.200 × 0.9938^Age

Where Scr = serum creatinine (mg/dL), Age in years

**CKD Staging by eGFR:**

| Stage | eGFR (mL/min/1.73m²) | Description |
|-------|----------------------|-------------|
| G1 | ≥90 | Normal/high (only CKD if other markers) |
| G2 | 60–89 | Mildly decreased |
| G3a | 45–59 | Mildly to moderately decreased |
| G3b | 30–44 | Moderately to severely decreased |
| G4 | 15–29 | Severely decreased |
| G5 | <15 | Kidney failure |

**Source:** Inker LA et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.

---

## Cockcroft-Gault Equation

**Application:** Estimates creatinine clearance (CrCl) for drug dosing. Still widely used for medication dose adjustments.

**Formula:**

CrCl (mL/min) = [(140 − Age) × Weight (kg)] / [72 × Serum Creatinine (mg/dL)]

**For females:** Multiply result × 0.85

**Interpretation:**

- Used for drug dose adjustments when package inserts reference CrCl
- Overestimates GFR in obesity (consider ideal body weight or adjusted body weight)
- Underestimates GFR in patients with low muscle mass or amputations
- Not used for CKD staging (use CKD-EPI instead)

**Source:** Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.

---

## Fractional Excretion of Sodium (FENa)

**Application:** Differentiates prerenal azotemia from intrinsic renal injury (ATN) in oliguric AKI.

**Formula:**

FENa (%) = (Urine Na × Plasma Cr) / (Plasma Na × Urine Cr) × 100

**Calculation & Interpretation:**

- FENa <1%: Prerenal azotemia (kidney retaining sodium appropriately)
- FENa >2%: Intrinsic renal disease (ATN — tubular sodium wasting)
- FENa 1–2%: Indeterminate
- **Limitations:** Unreliable with diuretic use (use FEUrea instead), contrast nephropathy, myoglobinuria, early obstruction, and some forms of ATN

**Source:** Espinel CH. The FENa test: Use in the differential diagnosis of acute renal failure. JAMA. 1976;236(6):579-581.

---

## Fractional Excretion of Urea (FEUrea)

**Application:** Alternative to FENa when patient is on diuretics. Urea handling is less affected by diuretics than sodium.

**Formula:**

FEUrea (%) = (Urine Urea × Plasma Cr) / (Plasma Urea × Urine Cr) × 100

**Calculation & Interpretation:**

- FEUrea <35%: Prerenal azotemia
- FEUrea >50%: Intrinsic renal disease
- FEUrea 35–50%: Indeterminate
- Preferred over FENa when diuretics have been administered

**Source:** Carvounis CP et al. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62(6):2223-2229.

---

## Anion Gap Calculation

**Application:** Essential for evaluating metabolic acidosis. Identifies unmeasured anions suggesting specific etiologies (DKA, lactic acidosis, toxins).

**Formula:**

Anion Gap = Na⁺ − (Cl⁻ + HCO₃⁻)

**Corrected AG (for hypoalbuminemia):**

Corrected AG = Calculated AG + 2.5 × (4.0 − measured albumin in g/dL)

**Calculation & Interpretation:**

- Normal AG: 8–12 mEq/L (varies by lab)
- Elevated AG (>12): AGMA — use mnemonic MUDPILES (Methanol, Uremia, DKA, Propylene glycol, Isoniazid/Iron, Lactic acidosis, Ethylene glycol, Salicylates)
- Normal AG metabolic acidosis: HARDUP (Hyperalimentation, Acetazolamide/Addison, RTA, Diarrhea, Ureteral diversion, Pancreatic fistula)
- **Delta-delta (Δ/Δ):** (AG − 12) / (24 − HCO₃⁻). Ratio <1 suggests concurrent non-AG metabolic acidosis; ratio >2 suggests concurrent metabolic alkalosis

**Source:** Kraut JA, Madias NE. Serum anion gap: Its uses and limitations in clinical medicine. Clin J Am Soc Nephrol. 2007;2(1):162-174.

---

## Osmolar Gap

**Application:** Detects unmeasured osmotically active substances (toxic alcohols: methanol, ethylene glycol, isopropanol).

**Formula:**

Calculated Osmolality = 2(Na⁺) + Glucose/18 + BUN/2.8 + EtOH/4.6

Osmolar Gap = Measured Osmolality − Calculated Osmolality

**Calculation & Interpretation:**

- Normal osmolar gap: <10 mOsm/kg
- Osmolar gap >10: Suggests presence of unmeasured osmoles — consider toxic alcohol ingestion
- Osmolar gap >25: Highly suggestive of toxic alcohol
- **Important:** A normal osmolar gap does NOT exclude toxic alcohol ingestion (may have already been metabolized to toxic metabolites, which increase the AG instead)
- In toxic alcohol ingestion: early = high osmolar gap + normal AG → later = normal osmolar gap + high AG (as parent compound metabolizes)

**Source:** Hoffman RS et al. Osmol gaps revisited: Normal values and limitations. J Toxicol Clin Toxicol. 1993;31(1):81-93.

---

## Calcium Correction for Albumin

**Application:** Corrects total serum calcium for hypoalbuminemia, since ~40% of calcium is protein-bound.

**Formula:**

Corrected Ca²⁺ = Measured Ca²⁺ + 0.8 × (4.0 − Albumin)

**Interpretation:**

- Normal corrected calcium: 8.5–10.5 mg/dL
- Each 1 g/dL decrease in albumin below 4.0 causes total calcium to appear ~0.8 mg/dL lower than true value
- Ionized calcium is the gold standard and is unaffected by albumin
- Correction is less reliable in critical illness; prefer ionized calcium in ICU patients

**Source:** Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ. 1973;4(5893):643-646.

---

## Winter's Formula

**Application:** Predicts expected PaCO₂ compensation for metabolic acidosis. Identifies concurrent respiratory acid-base disorders.

**Formula:**

Expected PaCO₂ = (1.5 × HCO₃⁻) + 8 (± 2)

**Calculation & Interpretation:**

- Measured PaCO₂ within expected range: Appropriate respiratory compensation
- Measured PaCO₂ > expected: Concurrent respiratory acidosis (inadequate compensation)
- Measured PaCO₂ < expected: Concurrent respiratory alkalosis (overcompensation)
- Only applies to metabolic acidosis (not alkalosis)
- For metabolic alkalosis: Expected PaCO₂ = (0.7 × HCO₃⁻) + 21 (± 2)

**Source:** Albert MS et al. Quantitative displacement of acid-base equilibrium in metabolic acidosis. Ann Intern Med. 1967;66(2):312-322.

---

## Transtubular Potassium Gradient (TTKG)

**Application:** Assesses renal potassium handling — distinguishes renal from extrarenal causes of hyperkalemia or hypokalemia.

**Formula:**

TTKG = (Urine K⁺ × Plasma Osm) / (Plasma K⁺ × Urine Osm)

**Prerequisites:** Urine Osm > Plasma Osm AND Urine Na⁺ >25 mEq/L

**Calculation & Interpretation:**

**In Hyperkalemia:**
- TTKG <6: Inappropriate renal response (hypoaldosteronism, renal tubular defect, K-sparing diuretics)
- TTKG >8: Appropriate renal K⁺ excretion (extrarenal cause: cell shift, dietary intake)

**In Hypokalemia:**
- TTKG >3: Renal potassium wasting (hyperaldosteronism, diuretics)
- TTKG <2: Appropriate renal K⁺ conservation (extrarenal loss: GI, skin)

**Source:** Ethier JH et al. The transtubular potassium concentration in patients with hypokalemia and hyperkalemia. Am J Kidney Dis. 1990;15(4):309-315.

---

## Schwartz Equation (Pediatric GFR)

**Application:** Estimates GFR in children using serum creatinine and height.

**Bedside Schwartz Formula (2009 updated):**

eGFR = 0.413 × Height (cm) / Serum Creatinine (mg/dL)

**Original Formula (historical, less accurate):**

eGFR = k × Height (cm) / Serum Creatinine (mg/dL)

Where k = 0.33 (preterm infants), 0.45 (term infants), 0.55 (children/adolescent females), 0.70 (adolescent males)

**Interpretation:**

- Use bedside Schwartz (0.413 constant) for enzymatic creatinine assays
- Normal pediatric GFR varies with age (lower in infants, approaches adult values by age 2)
- Not valid in acute kidney injury (creatinine not at steady state)

**Source:** Schwartz GJ et al. New equations to estimate GFR in children with CKD. J Am Soc Nephrol. 2009;20(3):629-637.

---


# BURNS & WOUND MANAGEMENT

---

## Rule of Nines (Wallace)

**Application:** Rapid estimation of total body surface area (TBSA) burned in adults. Used for initial fluid resuscitation calculations.

**Adult Body Surface Area:**

| Body Region | TBSA % |
|-------------|--------|
| Head & neck | 9% |
| Each upper extremity | 9% (each) |
| Anterior trunk | 18% |
| Posterior trunk | 18% |
| Each lower extremity | 18% (each) |
| Perineum/genitalia | 1% |
| **Total** | **100%** |

**Pediatric Modification (children <10 years):**
- Head: 18% (larger proportionally)
- Each lower extremity: 14% (smaller proportionally)
- Other regions same as adult

**Palm Method:** Patient's palm (including fingers) ≈ 1% TBSA — useful for scattered/irregular burns

**Interpretation:**

- Used for initial Parkland formula calculation
- Second-degree (partial thickness) and third-degree (full thickness) burns are included in TBSA calculation
- Superficial (first-degree/sunburn) burns are NOT included in TBSA
- For scattered burns, the palm method is more accurate

**Source:** Wallace AB. The exposure treatment of burns. Lancet. 1951;1(6653):501-504.

---

## Lund-Browder Chart

**Application:** Most accurate method for TBSA burn estimation, accounting for age-related body proportion changes. Especially important in pediatrics.

**TBSA by Age:**

| Body Part | Birth | 1 yr | 5 yr | 10 yr | 15 yr | Adult |
|-----------|-------|------|------|-------|-------|-------|
| Head | 19% | 17% | 13% | 11% | 9% | 7% |
| Neck | 2% | 2% | 2% | 2% | 2% | 2% |
| Ant. trunk | 13% | 13% | 13% | 13% | 13% | 13% |
| Post. trunk | 13% | 13% | 13% | 13% | 13% | 13% |
| Each buttock | 2.5% | 2.5% | 2.5% | 2.5% | 2.5% | 2.5% |
| Genitalia | 1% | 1% | 1% | 1% | 1% | 1% |
| Each upper arm | 4% | 4% | 4% | 4% | 4% | 4% |
| Each forearm | 3% | 3% | 3% | 3% | 3% | 3% |
| Each hand | 2.5% | 2.5% | 2.5% | 2.5% | 2.5% | 2.5% |
| Each thigh | 5.5% | 6.5% | 8% | 8.5% | 9% | 9.5% |
| Each leg | 5% | 5% | 5.5% | 6% | 6.5% | 7% |
| Each foot | 3.5% | 3.5% | 3.5% | 3.5% | 3.5% | 3.5% |

**Source:** Lund CC, Browder NC. The estimation of areas of burns. Surg Gynecol Obstet. 1944;79:352-358.

---

## Parkland Formula (Baxter Formula)

**Application:** Calculates IV fluid resuscitation volume for burn patients in the first 24 hours.

**Formula:**

Total crystalloid (LR) in first 24 hours = 4 mL × Body Weight (kg) × %TBSA burned

**Administration:**
- First half (50%) given over first 8 hours from time of burn (NOT from time of presentation)
- Second half (50%) given over next 16 hours

**Hourly Rate Calculations:**
- First 8 hours: (Total ÷ 2) ÷ 8 = mL/hr
- Next 16 hours: (Total ÷ 2) ÷ 16 = mL/hr

**Interpretation:**

- Titrate to urine output: Adults 0.5–1.0 mL/kg/hr, Children 1.0–1.5 mL/kg/hr
- Only applies to partial and full thickness burns ≥20% TBSA (adults) or ≥10% TBSA (children)
- Use Lactated Ringer's (preferred over NS)
- Colloid consideration after 24 hours
- "Fluid creep" (over-resuscitation) is a known complication — titrate to UO targets, don't blindly follow formula

**Source:** Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann NY Acad Sci. 1968;150(3):874-894.

---

## SCORTEN (Toxic Epidermal Necrolysis Severity Score)

**Application:** Predicts mortality in Stevens-Johnson Syndrome (SJS) and Toxic Epidermal Necrolysis (TEN).

**Criteria (1 point each, assessed within first 24 hours):**

1. Age ≥40 years
2. Heart rate ≥120 bpm
3. Cancer or hematologic malignancy (active)
4. BSA involved >10% (at day 1)
5. Serum urea >28 mg/dL (BUN >10 mmol/L)
6. Serum bicarbonate <20 mEq/L
7. Serum glucose >252 mg/dL (>14 mmol/L)

**Calculation & Interpretation:**

| SCORTEN | Predicted Mortality |
|---------|-------------------|
| 0–1 | 3.2% |
| 2 | 12.1% |
| 3 | 35.3% |
| 4 | 58.3% |
| ≥5 | 90% |

- Score ≥3: Consider transfer to burn center / ICU
- Reassess at 72 hours (BSA may progress)

**Source:** Bastuji-Garin S et al. SCORTEN: A severity-of-illness score for toxic epidermal necrolysis. J Invest Dermatol. 2000;115(2):149-153.

---

## Baux Score (Burn Mortality)

**Application:** Simple predictor of mortality in burn patients.

**Original Formula:**

Baux Score = Age + %TBSA burn

**Revised (Modified) Baux Score:**

Modified Baux = Age + %TBSA + (17 × inhalation injury)

Where inhalation injury = 1 if present, 0 if absent

**Calculation & Interpretation:**

- Baux score approximates percent mortality
- Score >140 (original) or >130 (modified): Near-uniformly fatal; consider comfort care discussion
- Score <80: Generally survivable with modern burn care
- Modified version more accurate with inhalation injury component
- LD50 in modern burn centers: Baux score ~110–120

**Source:** Baux S. Contribution a l'etude du traitement local des brulures thermiques etendues. These, Paris. 1961.

---

## Abbreviated Burn Severity Index (ABSI)

**Application:** Multi-variable burn mortality prediction, more accurate than Baux score.

**Criteria:**

| Variable | Score |
|----------|-------|
| **Sex:** Female | 1 |
| **Sex:** Male | 0 |
| **Age:** 0–20 | 1 |
| **Age:** 21–40 | 2 |
| **Age:** 41–60 | 3 |
| **Age:** 61–80 | 4 |
| **Age:** >80 | 5 |
| **Inhalation injury** | 1 |
| **Full thickness burn** | 1 |
| **TBSA:** 1–10% | 1 |
| **TBSA:** 11–20% | 2 |
| **TBSA:** 21–30% | 3 |
| **TBSA:** 31–40% | 4 |
| **TBSA:** 41–50% | 5 |
| **TBSA:** 51–60% | 6 |
| **TBSA:** 61–70% | 7 |
| **TBSA:** 71–80% | 8 |
| **TBSA:** 81–90% | 9 |
| **TBSA:** 91–100% | 10 |

**Calculation & Interpretation:**

| ABSI Score | Threat to Life | Probability of Survival |
|------------|---------------|----------------------|
| 2–3 | Very low | ≥99% |
| 4–5 | Moderate | 98% |
| 6–7 | Moderately severe | 80–90% |
| 8–9 | Serious | 50–70% |
| 10–11 | Severe | 20–40% |
| ≥12 | Maximum | <10% |

**Source:** Tobiasen J et al. The abbreviated burn severity index. Ann Emerg Med. 1982;11(5):260-262.

---


# ONCOLOGIC EMERGENCY

---

## Cairo-Bishop Criteria — Tumor Lysis Syndrome (TLS)

**Application:** Defines laboratory and clinical TLS to guide prophylaxis and treatment intensity.

**Laboratory TLS (≥2 of the following within 3 days before or 7 days after cytotoxic therapy):**

1. Uric acid ≥8.0 mg/dL or 25% increase from baseline
2. Potassium ≥6.0 mEq/L or 25% increase from baseline
3. Phosphorus ≥4.5 mg/dL (adults) or ≥6.5 mg/dL (children) or 25% increase
4. Calcium ≤7.0 mg/dL or 25% decrease from baseline

**Clinical TLS = Laboratory TLS + ≥1 of:**
1. Creatinine ≥1.5× upper limit of normal
2. Cardiac arrhythmia or sudden death
3. Seizure

**TLS Risk Stratification:**

| Risk | Definition | Prophylaxis |
|------|-----------|-------------|
| Low | Low tumor burden, slow proliferation | Hydration + monitoring |
| Intermediate | Intermediate burden or moderately aggressive | Hydration + allopurinol + monitoring |
| High | Bulky/aggressive tumor (Burkitt, ALL with WBC >100K, large tumor burden) | Hydration + rasburicase + ICU monitoring |

**Source:** Cairo MS, Bishop M. Tumour lysis syndrome: New therapeutic strategies and classification. Br J Haematol. 2004;127(1):3-11.

---

## PLASMIC Score (for TTP)

**Application:** Predicts likelihood of ADAMTS13 severe deficiency (thrombotic thrombocytopenic purpura) to guide empiric plasma exchange before ADAMTS13 results return.

**Criteria (1 point each):**

1. Platelet count <30,000/μL
2. Combined hemolysis variable: reticulocyte count >2.5% OR haptoglobin undetectable OR indirect bilirubin >2.0 mg/dL
3. No active cancer
4. No solid organ or stem cell transplant
5. MCV <90 fL
6. INR <1.5
7. Creatinine <2.0 mg/dL

**Calculation & Interpretation:**

| PLASMIC Score | ADAMTS13 Severely Deficient |
|---------------|---------------------------|
| 0–4 | Low risk (0–4%) |
| 5 | Intermediate risk (~24%) |
| 6–7 | High risk (62–82%) |

- Score ≥6: Strongly consider initiating plasma exchange empirically while awaiting ADAMTS13 activity level
- Score ≤4: TTP unlikely; consider alternative diagnoses (HUS, DIC, etc.)

**Source:** Bendapudi PK et al. Derivation and external validation of the PLASMIC score for rapid assessment of adults with thrombotic microangiopathies. Lancet Haematol. 2017;4(4):e157-e164.

---

## ECOG Performance Status

**Application:** Standardized assessment of cancer patient's functional status. Used for treatment decisions and clinical trial eligibility.

**Scale:**

| Score | Description |
|-------|-------------|
| 0 | Fully active, able to carry on all pre-disease activities without restriction |
| 1 | Restricted in physically strenuous activity but ambulatory and able to carry out light work |
| 2 | Ambulatory and capable of all self-care but unable to carry out any work activities; up and about >50% of waking hours |
| 3 | Capable of only limited self-care; confined to bed or chair >50% of waking hours |
| 4 | Completely disabled; cannot carry on any self-care; totally confined to bed or chair |
| 5 | Dead |

**Interpretation:**

- ECOG 0–1: Generally eligible for aggressive chemotherapy and clinical trials
- ECOG 2: May still benefit from treatment; case-by-case decision
- ECOG 3–4: Limited benefit from most cytotoxic therapies; consider palliative care
- Correlates with survival across most cancer types

**Source:** Oken MM et al. Toxicity and response criteria of the Eastern Cooperative Oncology Group. Am J Clin Oncol. 1982;5(6):649-655.

---

## Karnofsky Performance Status (KPS)

**Application:** Numeric rating of functional status on 0–100 scale. More granular than ECOG. Widely used in neuro-oncology and palliative care.

**Scale:**

| KPS | Description |
|-----|-------------|
| 100 | Normal; no complaints; no evidence of disease |
| 90 | Able to carry on normal activity; minor signs or symptoms |
| 80 | Normal activity with effort; some signs or symptoms |
| 70 | Cares for self; unable to carry on normal activity or work |
| 60 | Requires occasional assistance but able to care for most needs |
| 50 | Requires considerable assistance and frequent medical care |
| 40 | Disabled; requires special care and assistance |
| 30 | Severely disabled; hospitalization indicated, death not imminent |
| 20 | Very sick; active supportive treatment necessary |
| 10 | Moribund; fatal processes progressing rapidly |
| 0 | Dead |

**ECOG-to-KPS Approximate Conversion:**
- ECOG 0 = KPS 90–100
- ECOG 1 = KPS 70–80
- ECOG 2 = KPS 50–60
- ECOG 3 = KPS 30–40
- ECOG 4 = KPS 10–20

**Interpretation:**

- KPS ≥70: Generally able to live independently
- KPS 50–60: May need some assistance; consider treatment benefit vs. burden
- KPS <50: Significant functional limitation; palliative care focus
- KPS <40 in hospice: Median survival approximately 1–3 months

**Source:** Karnofsky DA, Burchenal JH. The clinical evaluation of chemotherapeutic agents in cancer. In: MacLeod CM, ed. Evaluation of Chemotherapeutic Agents. 1949:191-205.

---

## Spinal Instability Neoplastic Score (SINS)

**Application:** Assesses spinal instability from metastatic disease to determine need for surgical consultation.

**Criteria:**

| Component | Options | Points |
|-----------|---------|--------|
| **Location** | Junctional (C0-C2, C7-T2, T11-L1, L5-S1) | 3 |
| | Mobile (C3-C6, L2-L4) | 2 |
| | Semi-rigid (T3-T10) | 1 |
| | Rigid (S2-S5) | 0 |
| **Pain** | Mechanical (movement-related) | 3 |
| | Occasional, non-mechanical | 1 |
| | Pain-free | 0 |
| **Bone lesion** | Lytic | 2 |
| | Mixed lytic/blastic | 1 |
| | Blastic | 0 |
| **Alignment** | Subluxation/translation | 4 |
| | De novo deformity (kyphosis/scoliosis) | 2 |
| | Normal alignment | 0 |
| **Vertebral body collapse** | >50% collapse | 3 |
| | <50% collapse | 2 |
| | No collapse with >50% body involved | 1 |
| | None of the above | 0 |
| **Posterolateral involvement** | Bilateral | 3 |
| | Unilateral | 1 |
| | None | 0 |

**Calculation & Interpretation:**

| SINS Score | Stability | Action |
|------------|-----------|--------|
| 0–6 | Stable | No surgical consultation needed |
| 7–12 | Indeterminate | Surgical consultation recommended |
| 13–18 | Unstable | Surgical consultation required |

**Source:** Fisher CG et al. A novel classification system for spinal instability in neoplastic disease. Spine. 2010;35(22):E1221-E1229.

---


# CRITICAL CARE & ICU

---

## CAM-ICU (Confusion Assessment Method for ICU)

**Application:** Detects delirium in ICU patients, including those who are mechanically ventilated.

**Prerequisite:** RASS must be −3 to +4 (patients at −4 or −5 are too sedated to assess)

**Assessment (4 Features):**

**Feature 1 — Acute onset or fluctuating course:**
- Is the mental status different from baseline? OR
- Has mental status fluctuated in the past 24 hours? (RASS fluctuation, GCS fluctuation)
- If NO → CAM-ICU negative (stop)
- If YES → proceed to Feature 2

**Feature 2 — Inattention:**
- Attention Screening Examination: Say "SAVEAHAART" — patient squeezes hand on letter "A"
- Score: Number of errors (missed A's or squeezed on non-A letters)
- >2 errors = inattention present → proceed to Feature 3
- ≤2 errors → CAM-ICU negative (stop)

**Feature 3 — Altered level of consciousness:**
- RASS ≠ 0 at time of assessment
- If YES → CAM-ICU positive (delirium present)
- If NO → proceed to Feature 4

**Feature 4 — Disorganized thinking:**
- Ask yes/no questions: "Will a stone float on water?" "Are there fish in the sea?" "Does one pound weigh more than two?" "Can you use a hammer to pound a nail?"
- Command: "Hold up this many fingers" (show 2), "Now do the same with the other hand" (or "add one more finger")
- >1 combined error = disorganized thinking

**Calculation & Interpretation:**

- **CAM-ICU Positive (Delirium):** Feature 1 + Feature 2 + (Feature 3 OR Feature 4)
- **CAM-ICU Negative:** Does not meet criteria
- Sensitivity 93–100%, specificity 89–100% for delirium
- Assess at least once per shift (q8–12h)

**Source:** Ely EW et al. Evaluation of delirium in critically ill patients: Validation of the Confusion Assessment Method for the ICU. Crit Care Med. 2001;29(7):1370-1379.

---

## SAPS II (Simplified Acute Physiology Score II)

**Application:** Predicts ICU mortality using worst values in first 24 hours. Alternative to APACHE II.

**Variables (17 items, weighted):**

| Variable | Score Range |
|----------|------------|
| Age | 0–18 |
| Heart rate | 0–11 |
| Systolic BP | 0–13 |
| Temperature | 0–3 |
| PaO₂/FiO₂ (if ventilated or CPAP) | 0–11 |
| Urine output | 0–11 |
| Serum urea | 0–10 |
| WBC | 0–12 |
| Potassium | 0–3 |
| Sodium | 0–5 |
| Bicarbonate | 0–6 |
| Bilirubin | 0–9 |
| GCS | 0–26 |
| Chronic disease | 0–17 (metastatic cancer: 9, hematologic malignancy: 10, AIDS: 17) |
| Type of admission | Scheduled surgical: 0, Medical: 6, Unscheduled surgical: 8 |

**Calculation:**

- Sum all points → logistic regression equation converts to predicted mortality
- logit = −7.7631 + 0.0737 × (SAPS II score) + 0.9971 × ln(SAPS II + 1)
- Predicted mortality = e^logit / (1 + e^logit)

**Interpretation:**

| SAPS II | Approximate Mortality |
|---------|---------------------|
| <30 | <10% |
| 30–39 | 10–20% |
| 40–49 | 20–40% |
| 50–59 | 40–50% |
| 60–79 | 50–75% |
| ≥80 | >75% |

**Source:** Le Gall JR et al. A new Simplified Acute Physiology Score (SAPS II) based on a European/North American multicenter study. JAMA. 1993;270(24):2957-2963.

---


# DERMATOLOGY

---

## ABCDE Rule (Melanoma Screening)

**Application:** Clinical criteria for identifying suspicious pigmented lesions that may be melanoma.

**Criteria:**

| Letter | Feature | Suspicious Finding |
|--------|---------|-------------------|
| **A** | Asymmetry | One half does not match the other |
| **B** | Border | Irregular, ragged, notched, or blurred edges |
| **C** | Color | Varied shades (brown, black, red, white, blue within same lesion) |
| **D** | Diameter | >6 mm (pencil eraser), though melanomas can be smaller |
| **E** | Evolution | Change in size, shape, color, or symptoms (itching, bleeding) |

**Calculation & Interpretation:**

- Not a numerical score — qualitative assessment
- ANY one feature → referral for dermatoscopy or biopsy
- "E" (Evolution) is the most sensitive single criterion
- "Ugly duckling sign" — lesion that looks different from all other moles on the patient — is an additional red flag
- ABCDE sensitivity ~83%, specificity ~59% for melanoma
- Amelanotic melanomas (lack pigment) may not trigger ABCDE — maintain clinical suspicion for any non-healing lesion

**Source:** Friedman RJ et al. Early detection of malignant melanoma: The role of physician examination and self-examination of the skin. CA Cancer J Clin. 1985;35(3):130-151.

---

## SCORAD (SCORing Atopic Dermatitis)

**Application:** Measures severity of atopic dermatitis combining extent, intensity, and subjective symptoms.

**Components:**

**A — Extent (0–100%):**
- Use Rule of Nines or hand-area method to estimate % BSA affected
- Head/neck: 9%, each upper limb: 9%, anterior trunk: 18%, posterior trunk: 18%, each lower limb: 18%, genitals: 1%

**B — Intensity (0–18 total, score each 0–3):**
1. Erythema (redness)
2. Edema/papulation
3. Oozing/crusting
4. Excoriations
5. Lichenification
6. Dryness (assessed on uninvolved skin)

Each scored: 0 = Absent, 1 = Mild, 2 = Moderate, 3 = Severe

**C — Subjective Symptoms (0–20):**
- Pruritus (0–10 VAS over past 3 days/nights)
- Sleep disturbance (0–10 VAS over past 3 days/nights)

**Formula:**

SCORAD = A/5 + 7B/2 + C

**Calculation & Interpretation:**

| SCORAD | Severity |
|--------|----------|
| <25 | Mild |
| 25–50 | Moderate |
| >50 | Severe |

- Maximum score: 103
- Used to guide step-up therapy and monitor treatment response

**Source:** European Task Force on Atopic Dermatitis. Severity scoring of atopic dermatitis: The SCORAD index. Dermatology. 1993;186(1):23-31.

---

## PASI (Psoriasis Area and Severity Index)

**Application:** Gold standard for measuring psoriasis severity. Used in clinical trials and to determine biologic therapy eligibility.

**Components (assessed for 4 body regions):**

| Region | Area Weight |
|--------|------------|
| Head (h) | 0.1 |
| Trunk (t) | 0.3 |
| Upper extremities (u) | 0.2 |
| Lower extremities (l) | 0.4 |

**For each region, score:**

**Area involved (A):** 0 (0%), 1 (1–9%), 2 (10–29%), 3 (30–49%), 4 (50–69%), 5 (70–89%), 6 (90–100%)

**Severity parameters (each scored 0–4):**
- Erythema (E): 0 = None, 4 = Very severe
- Induration/Thickness (I): 0 = None, 4 = Very severe
- Desquamation/Scaling (D): 0 = None, 4 = Very severe

**Formula:**

PASI = 0.1 × (Eh + Ih + Dh) × Ah + 0.3 × (Et + It + Dt) × At + 0.2 × (Eu + Iu + Du) × Au + 0.4 × (El + Il + Dl) × Al

**Calculation & Interpretation:**

| PASI | Severity |
|------|----------|
| 0 | Clear |
| <5 | Mild |
| 5–10 | Moderate |
| >10 | Severe |
| >20 | Very severe |

- Maximum score: 72
- PASI 75 = 75% improvement from baseline (common trial endpoint)
- PASI ≥10 or BSA ≥10% typically qualifies for systemic/biologic therapy

**Source:** Fredriksson T, Pettersson U. Severe psoriasis: Oral therapy with a new retinoid. Dermatologica. 1978;157(4):238-244.

---


# ENT / OTOLARYNGOLOGY

---

## STOP-BANG Questionnaire (Obstructive Sleep Apnea)

**Application:** Screens for obstructive sleep apnea (OSA). Widely used preoperatively.

**Criteria (1 point each, Yes/No):**

1. **S**noring: Do you snore loudly?
2. **T**ired: Do you often feel tired, fatigued, or sleepy during the daytime?
3. **O**bserved: Has anyone observed you stop breathing during sleep?
4. **P**ressure: Are you being treated for high blood pressure?
5. **B**MI: BMI >35 kg/m²?
6. **A**ge: Age >50 years?
7. **N**eck circumference: >40 cm (16 inches)?
8. **G**ender: Male?

**Calculation & Interpretation:**

| Score | OSA Risk | Action |
|-------|----------|--------|
| 0–2 | Low risk | Routine perioperative care |
| 3–4 | Intermediate risk | Consider sleep study; perioperative monitoring |
| 5–8 | High risk | Sleep study recommended; enhanced perioperative monitoring |

- Score ≥3 with at least one of S, T, or O: Intermediate risk
- Score ≥3: Sensitivity ~84–93% for moderate-severe OSA
- Score ≥5 OR (≥2 of STOP + male + BMI >35 + neck >40): High probability of moderate-severe OSA

**Source:** Chung F et al. STOP questionnaire: A tool to screen patients for obstructive sleep apnea. Anesthesiology. 2008;108(5):812-821.

---

## Epworth Sleepiness Scale (ESS)

**Application:** Measures daytime sleepiness. Used to screen for sleep disorders and monitor treatment response.

**Criteria (0–3 for each situation):**

Rate your chance of dozing in these situations (not just feeling tired):
1. Sitting and reading
2. Watching television
3. Sitting inactive in a public place (theater, meeting)
4. As a passenger in a car for an hour without a break
5. Lying down to rest in the afternoon
6. Sitting and talking to someone
7. Sitting quietly after lunch without alcohol
8. In a car, while stopped for a few minutes in traffic

**Scoring:** 0 = No chance of dozing | 1 = Slight chance | 2 = Moderate chance | 3 = High chance

**Calculation & Interpretation:**

| Score | Interpretation |
|-------|---------------|
| 0–5 | Lower normal daytime sleepiness |
| 6–10 | Higher normal daytime sleepiness |
| 11–12 | Mild excessive daytime sleepiness |
| 13–15 | Moderate excessive daytime sleepiness |
| 16–24 | Severe excessive daytime sleepiness |

- Score >10: Suggests significant daytime sleepiness — evaluate for sleep disorder
- Score >15: Strongly suggests a sleep disorder requiring evaluation

**Source:** Johns MW. A new method for measuring daytime sleepiness: The Epworth Sleepiness Scale. Sleep. 1991;14(6):540-545.

---

## Lund-Mackay Score (Sinus CT)

**Application:** Standardized scoring of sinus CT opacification. Used to assess chronic rhinosinusitis severity.

**Criteria (score each sinus 0–2, bilateral):**

| Sinus | Score per side |
|-------|---------------|
| Maxillary | 0 (clear), 1 (partial), 2 (complete opacification) |
| Anterior ethmoid | 0, 1, 2 |
| Posterior ethmoid | 0, 1, 2 |
| Sphenoid | 0, 1, 2 |
| Frontal | 0, 1, 2 |
| Ostiomeatal complex | 0 (not occluded), 2 (occluded) |

**Calculation & Interpretation:**

- Score per side: 0–12
- Total bilateral score: 0–24
- Score 0: Normal
- Score 1–4: Mild disease
- Score 5–12: Moderate disease
- Score >12: Severe disease
- Score of 0 does NOT exclude chronic sinusitis (clinical diagnosis)
- Score >4 bilateral: May support surgical intervention if medical therapy fails

**Source:** Lund VJ, Mackay IS. Staging in rhinosinusitis. Rhinology. 1993;31(4):183-184.

---


# ORTHOPEDIC & MUSCULOSKELETAL

---

## Beighton Hypermobility Score

**Application:** Screens for generalized joint hypermobility. Used in evaluation of hypermobility spectrum disorders and Ehlers-Danlos syndrome (hypermobile type).

**Criteria (1 point each, 9 possible):**

| Maneuver | Points |
|----------|--------|
| Passive dorsiflexion of 5th MCP >90° — LEFT | 1 |
| Passive dorsiflexion of 5th MCP >90° — RIGHT | 1 |
| Passive apposition of thumb to flexor forearm — LEFT | 1 |
| Passive apposition of thumb to flexor forearm — RIGHT | 1 |
| Hyperextension of elbow >10° — LEFT | 1 |
| Hyperextension of elbow >10° — RIGHT | 1 |
| Hyperextension of knee >10° — LEFT | 1 |
| Hyperextension of knee >10° — RIGHT | 1 |
| Forward flexion with palms flat on floor (knees straight) | 1 |

**Calculation & Interpretation:**

- Score ≥4/9 (adults): Generalized joint hypermobility
- Score ≥5/9 (children): Generalized joint hypermobility (higher threshold due to normal childhood flexibility)
- Score ≥6/9: Strong evidence of generalized hypermobility
- Positive Beighton alone ≠ diagnosis of hEDS; requires additional criteria (2017 hEDS diagnostic checklist)

**Source:** Beighton P et al. Articular mobility in an African population. Ann Rheum Dis. 1973;32(5):413-418.

---

## Salter-Harris Classification (Pediatric Fractures)

**Application:** Classifies physeal (growth plate) fractures in children. Guides management and predicts growth disturbance risk.

**Classification:**

| Type | Description | Mnemonic | Growth Disturbance Risk |
|------|-------------|----------|----------------------|
| I | Fracture through physis only (Separation) | **S**traight across | Low |
| II | Fracture through physis + metaphysis | **A**bove (metaphysis) | Low |
| III | Fracture through physis + epiphysis | **L**ower (epiphysis) | Moderate |
| IV | Fracture through metaphysis + physis + epiphysis | **T**hrough everything | High |
| V | Crush injury to physis | **R**uined (crush) | Highest |

**Mnemonic:** SALTR (Same, Above, Lower, Through, Ruined/Rammed)

**Interpretation:**

- Type I–II: Generally good prognosis; closed reduction usually adequate
- Type III–IV: Anatomic reduction required (often surgical); higher risk of growth arrest
- Type V: Often diagnosed retrospectively when growth arrest occurs; worst prognosis
- Type II: Most common (~75% of all Salter-Harris fractures)
- Follow-up radiographs at 6–12 months to assess for growth disturbance

**Source:** Salter RB, Harris WR. Injuries involving the epiphyseal plate. J Bone Joint Surg Am. 1963;45(3):587-622.

---

## Weber Classification (Ankle Fractures)

**Application:** Classifies lateral malleolus (fibula) fractures by location relative to the syndesmosis. Determines stability and need for surgery.

**Classification:**

| Type | Fracture Location | Syndesmosis | Stability |
|------|------------------|-------------|-----------|
| A | Below syndesmosis (infrasyndesmotic) | Intact | Stable — typically non-operative |
| B | At level of syndesmosis (transsyndesmotic) | May be disrupted | Potentially unstable — stress test needed |
| C | Above syndesmosis (suprasyndesmotic) | Disrupted | Unstable — surgical fixation required |

**Interpretation:**

- **Weber A:** Avulsion of lateral malleolus below joint line; tibiofibular ligaments intact. Walking boot or cast, weight-bearing as tolerated
- **Weber B:** Oblique fracture at level of plafond; syndesmosis may be partially disrupted. Check medial structures (deltoid ligament); if stable → non-operative; if unstable → surgical fixation
- **Weber C:** Fracture above syndesmosis with obligatory syndesmotic disruption. Almost always requires operative fixation with syndesmotic stabilization
- Stress radiographs or gravity stress views help determine Weber B stability

**Source:** Weber BG. Die Verletzungen des oberen Sprunggelenkes. 2nd ed. Bern: Huber; 1972.

---

## Garden Classification (Hip Fractures)

**Application:** Classifies femoral neck fractures by displacement. Guides surgical management (fixation vs. arthroplasty).

**Classification:**

| Grade | Description | Treatment |
|-------|-------------|-----------|
| I | Incomplete/valgus impacted fracture | Internal fixation (screws) |
| II | Complete, non-displaced | Internal fixation (screws) |
| III | Complete, partially displaced (femoral head rotated) | Hemiarthroplasty or THA (especially in elderly) |
| IV | Complete, fully displaced | Hemiarthroplasty or THA |

**Simplified Classification (commonly used in practice):**

- **Non-displaced (Garden I–II):** Internal fixation with cannulated screws
- **Displaced (Garden III–IV):** Arthroplasty (hemiarthroplasty for low-demand elderly; total hip arthroplasty for active patients)

**Interpretation:**

- Garden I–II: Lower risk of avascular necrosis (AVN); fixation preserves femoral head
- Garden III–IV: High risk of AVN (20–35%); arthroplasty avoids AVN complications
- Age and activity level influence choice between hemiarthroplasty and THA
- Intracapsular fractures (all Garden types) have higher AVN risk than extracapsular fractures

**Source:** Garden RS. Low-angle fixation in fractures of the femoral neck. J Bone Joint Surg Br. 1961;43(4):647-663.

---


# RHEUMATOLOGY

---

## ACR/EULAR 2010 Rheumatoid Arthritis Classification Criteria

**Application:** Classifies definite RA in patients with at least 1 joint with synovitis not better explained by another disease. Score-based system.

**Criteria (total ≥6/10 = definite RA):**

**A. Joint Involvement (0–5):**
- 1 large joint: 0
- 2–10 large joints: 1
- 1–3 small joints (with or without large joints): 2
- 4–10 small joints (with or without large joints): 3
- >10 joints (at least 1 small joint): 5

**B. Serology (0–3):**
- Negative RF AND negative anti-CCP: 0
- Low-positive RF OR low-positive anti-CCP (≤3× ULN): 2
- High-positive RF OR high-positive anti-CCP (>3× ULN): 3

**C. Acute Phase Reactants (0–1):**
- Normal CRP AND normal ESR: 0
- Abnormal CRP OR abnormal ESR: 1

**D. Duration of Symptoms (0–1):**
- <6 weeks: 0
- ≥6 weeks: 1

**Calculation & Interpretation:**

- Score ≥6/10: Definite RA — initiate disease-modifying therapy
- Score <6: Not classifiable as RA at this time — monitor and reassess
- These are classification criteria (for clinical trials/epidemiology), NOT diagnostic criteria — clinical judgment still required

**Source:** Aletaha D et al. 2010 Rheumatoid arthritis classification criteria: An ACR/EULAR collaborative initiative. Arthritis Rheum. 2010;62(9):2569-2581.

---

## Jones Criteria (Acute Rheumatic Fever)

**Application:** Diagnoses initial attack of acute rheumatic fever (ARF) following Group A streptococcal pharyngitis.

**Evidence of Preceding GAS Infection (required):**
- Positive throat culture or rapid strep test
- Elevated or rising streptococcal antibody titer (ASO, anti-DNase B)
- Recent scarlet fever

**Major Criteria:**
1. Carditis (clinical or echocardiographic)
2. Polyarthritis (low-risk) / Monoarthritis or polyarthralgia (moderate-high risk populations)
3. Chorea (Sydenham)
4. Erythema marginatum
5. Subcutaneous nodules

**Minor Criteria:**
1. Polyarthralgia (low-risk) / Monoarthralgia (moderate-high risk)
2. Fever ≥38.5°C (low-risk) / ≥38.0°C (moderate-high risk)
3. ESR ≥60 (low-risk) / ≥30 (moderate-high risk) OR CRP ≥3.0 mg/dL
4. Prolonged PR interval (accounting for age)

**Calculation & Interpretation:**

- **Initial ARF:** 2 major criteria OR 1 major + 2 minor criteria (+ evidence of GAS)
- **Recurrent ARF:** 2 major OR 1 major + 2 minor OR 3 minor criteria (+ evidence of GAS)
- Chorea alone is sufficient for diagnosis if other causes excluded (even without GAS evidence)
- 2015 AHA revision distinguished low-risk vs. moderate/high-risk populations with different thresholds

**Source:** Gewitz MH et al. Revision of the Jones Criteria for the diagnosis of acute rheumatic fever. Circulation. 2015;131(20):1806-1818.

---

## Anaphylaxis Diagnostic Criteria (WAO/ACAAI)

**Application:** Clinical criteria for diagnosing anaphylaxis. Anaphylaxis is highly likely when ANY of the following 3 criteria are met.

**Criterion 1:**
Acute onset (minutes to hours) of illness with skin/mucosal involvement (hives, pruritus, flushing, lip/tongue/uvula swelling) AND at least one of:
- Respiratory compromise (dyspnea, wheeze, stridor, hypoxemia)
- Reduced blood pressure or associated symptoms (syncope, incontinence)

**Criterion 2:**
Two or more of the following occurring rapidly after exposure to likely allergen:
- Skin/mucosal involvement (hives, pruritus, flushing, swelling)
- Respiratory compromise
- Reduced blood pressure or associated symptoms
- Persistent GI symptoms (crampy abdominal pain, vomiting)

**Criterion 3:**
Reduced blood pressure after exposure to KNOWN allergen for that patient:
- Adults: SBP <90 mmHg or >30% decrease from baseline
- Children: Age-specific low SBP or >30% decrease in systolic

**Interpretation:**

- ANY criterion met → diagnose anaphylaxis → administer epinephrine IM immediately
- Epinephrine dose: 0.01 mg/kg (max 0.5 mg adult, 0.3 mg child) IM to anterolateral thigh
- May repeat q5–15 min
- Observe minimum 4–6 hours (biphasic reactions occur in 1–20% of cases)
- Prescribe epinephrine auto-injector at discharge

**Source:** Sampson HA et al. Second symposium on the definition and management of anaphylaxis: Summary report. J Allergy Clin Immunol. 2006;117(2):391-397.

---


# GERIATRICS & DELIRIUM

---

## 4AT (Rapid Clinical Test for Delirium)

**Application:** Rapid (<2 minutes) bedside delirium screening tool. Does not require training to administer.

**Criteria:**

**[1] Alertness (0 or 4):**
- Normal (fully alert, not agitated) → 0
- Clearly abnormal (any alteration: hyper-alert, drowsy, difficult to rouse) → 4

**[2] AMT4 — Abbreviated Mental Test (0 or 1 or 2):**
Ask: Age? Date of birth? Current location? Current year?
- No mistakes → 0
- 1 mistake → 1
- 2 or more mistakes OR untestable → 2

**[3] Attention — Months of Year Backward (0 or 1 or 2):**
Ask patient to say months of the year backward from December
- Achieves 7 or more months correctly → 0
- Starts but <7 months / refuses to start → 1
- Untestable (cannot start, too unwell) → 2

**[4] Acute Change or Fluctuating Course (0 or 4):**
- No → 0
- Yes → 4

**Calculation & Interpretation:**

| 4AT Score | Interpretation |
|-----------|---------------|
| 0 | Delirium or severe cognitive impairment unlikely |
| 1–3 | Possible cognitive impairment — further assessment needed |
| ≥4 | Possible delirium (± cognitive impairment) — full clinical assessment for delirium |

- Score ≥4: Sensitivity ~89%, specificity ~88% for delirium
- Faster than CAM and does not require formal training

**Source:** Bellelli G et al. Validation of the 4AT, a new instrument for rapid delirium screening: A study in 234 hospitalised older people. Age Ageing. 2014;43(4):496-502.

---

## Confusion Assessment Method (CAM) — Non-ICU

**Application:** Standard tool for delirium detection in non-ICU hospitalized patients.

**Criteria (4 Features):**

**Feature 1 — Acute onset and fluctuating course:**
- Is there evidence of an acute change in mental status from baseline? Does the abnormal behavior fluctuate?

**Feature 2 — Inattention:**
- Does the patient have difficulty focusing attention? Are they easily distractible or have difficulty keeping track of what is being said?

**Feature 3 — Disorganized thinking:**
- Is the patient's thinking disorganized or incoherent? Rambling, irrelevant conversation, unclear or illogical flow of ideas, unpredictable switching between subjects?

**Feature 4 — Altered level of consciousness:**
- Overall, how would you rate the patient's level of consciousness? (Alert, Vigilant, Lethargic, Stupor, Coma)
- Anything other than "Alert" = positive

**Calculation & Interpretation:**

- **Delirium = Feature 1 + Feature 2 + (Feature 3 OR Feature 4)**
- Sensitivity 94–100%, specificity 90–95% when used by trained assessors
- Most widely validated delirium assessment tool
- Can be used with the CAM-S (severity) module for trending

**Source:** Inouye SK et al. Clarifying confusion: The confusion assessment method. Ann Intern Med. 1990;113(12):941-948.

---

## Braden Scale (Pressure Injury Risk)

**Application:** Predicts risk of pressure injury (pressure ulcer) development. Used for all hospitalized and long-term care patients.

**Criteria (6 subscales, scored 1–4 each; moisture and friction scored 1–3):**

| Subscale | 1 | 2 | 3 | 4 |
|----------|---|---|---|---|
| Sensory perception | Completely limited | Very limited | Slightly limited | No impairment |
| Moisture | Constantly moist | Very moist | Occasionally moist | Rarely moist |
| Activity | Bedfast | Chairfast | Walks occasionally | Walks frequently |
| Mobility | Completely immobile | Very limited | Slightly limited | No limitations |
| Nutrition | Very poor | Probably inadequate | Adequate | Excellent |
| Friction & shear | Problem | Potential problem | No apparent problem | — (max 3) |

**Calculation & Interpretation:**

- Score range: 6–23 (lower = higher risk)
- ≤9: Very high risk
- 10–12: High risk
- 13–14: Moderate risk
- 15–18: Mild risk
- 19–23: No/minimal risk
- Score ≤18: Implement pressure injury prevention protocol
- Reassess on admission and every shift or per institutional policy

**Source:** Bergstrom N et al. The Braden Scale for predicting pressure sore risk. Nurs Res. 1987;36(4):205-210.

---

## Morse Fall Scale

**Application:** Identifies hospitalized patients at risk for falls. Quick bedside assessment.

**Criteria:**

| Item | Response | Score |
|------|----------|-------|
| History of falling (within 3 months) | No: 0, Yes: 25 | |
| Secondary diagnosis (≥2 medical diagnoses) | No: 0, Yes: 15 | |
| Ambulatory aid | None/bedrest/wheelchair/nurse: 0 | |
| | Crutches/cane/walker: 15 | |
| | Furniture: 30 | |
| IV/heparin lock | No: 0, Yes: 20 | |
| Gait | Normal/bedrest/immobile: 0 | |
| | Weak: 10 | |
| | Impaired: 20 | |
| Mental status | Oriented to own ability: 0 | |
| | Overestimates/forgets limitations: 15 | |

**Calculation & Interpretation:**

| Score | Risk Level | Action |
|-------|-----------|--------|
| 0–24 | Low risk | Standard fall prevention |
| 25–44 | Moderate risk | Implement fall prevention interventions |
| ≥45 | High risk | Implement high-risk fall prevention protocol |

**Source:** Morse JM et al. Development of a scale to identify the fall-prone patient. Can J Aging. 1989;8(4):366-377.

---


# SPORTS MEDICINE & CONCUSSION

---

## SCAT6 (Sport Concussion Assessment Tool, 6th Edition)

**Application:** Standardized sideline and office assessment tool for evaluating sport-related concussion (SRC) in athletes ≥13 years.

**Components:**

**1. Observable Signs (on-field):**
- Lying motionless, slow to get up, motor incoordination, confusion, blank/vacant look, facial injury, balance problems

**2. Red Flags (immediate ED transfer if any present):**
- Neck pain or tenderness, double vision, weakness/tingling in extremities, severe/increasing headache, seizure, loss of consciousness >1 min, deteriorating consciousness, vomiting, increasingly restless/agitated

**3. Memory Assessment (Maddocks Questions):**
- What venue are we at today?
- Which half is it now?
- Who scored last in this match?
- What team did you play last week?
- Did your team win the last game?
- Failure on ≥1 question = possible concussion

**4. GCS** (see main CDR file)

**5. Symptom Evaluation (22 symptoms, rated 0–6 severity):**
- Headache, pressure in head, neck pain, nausea, dizziness, blurred vision, balance problems, sensitivity to light/noise, feeling slowed down, feeling in a fog, difficulty concentrating, difficulty remembering, fatigue, confusion, drowsiness, more emotional, irritability, sadness, nervous/anxious, trouble falling asleep, sleeping more, sleeping less
- Total symptom score: 0–22 (number) and 0–132 (severity)

**6. Cognitive Screening:**
- Orientation (month, date, day, year, time within 1 hour) — 0–5
- Immediate memory (10-word list × 3 trials) — 0–30
- Concentration (digits backward 3–6, months in reverse) — 0–5
- Delayed recall (10-word list at ~10 min) — 0–10

**7. Balance Examination (modified BESS):**
- Double leg, single leg, tandem stance × 20 seconds each (eyes closed on firm surface)
- Errors counted per stance (max 10 per stance)

**Interpretation:**

- Not a pass/fail test — establishes a clinical profile
- ANY positive red flag → Emergency Department
- Comparison to baseline testing (when available) improves sensitivity
- Symptom-free ≠ recovered — full return-to-play protocol required
- Return-to-play: Graded 6-step protocol over minimum 6 days (24 hours per step if asymptomatic)

**Return-to-Sport Protocol:**
1. Symptom-limited activity (daily activities that don't provoke symptoms)
2. Light aerobic exercise (walking, swimming, stationary cycling)
3. Sport-specific exercise (no contact)
4. Non-contact training drills; may resume resistance training
5. Full-contact practice after medical clearance
6. Return to competition

**Source:** Patricios JS et al. Consensus statement on concussion in sport: The 6th International Conference on Concussion in Sport (Amsterdam, 2022). Br J Sports Med. 2023;57(11):695-711.

---


# PALLIATIVE CARE & PROGNOSIS

---

## Palliative Prognostic Index (PPI)

**Application:** Predicts survival in terminally ill cancer patients. Guides hospice referral and goals-of-care conversations.

**Criteria:**

| Variable | Finding | Score |
|----------|---------|-------|
| Palliative Performance Scale (PPS) | 10–20% | 4.0 |
| | 30–50% | 2.5 |
| | ≥60% | 0 |
| Oral intake | Severely reduced (mouthfuls or less) | 2.5 |
| | Moderately reduced | 1.0 |
| | Normal | 0 |
| Edema | Present | 1.0 |
| | Absent | 0 |
| Dyspnea at rest | Present | 3.5 |
| | Absent | 0 |
| Delirium | Present | 4.0 |
| | Absent | 0 |

**Calculation & Interpretation:**

| PPI Score | Predicted Survival |
|-----------|-------------------|
| >6.0 | <3 weeks (sensitivity 83%, specificity 85%) |
| 4.0–6.0 | 3–6 weeks |
| <4.0 | >6 weeks (sensitivity 79%, specificity 77%) |

- Does not require laboratory data — entirely clinical
- PPI >6: Strong consideration for hospice if not already enrolled
- Serial assessment improves accuracy

**Source:** Morita T et al. The Palliative Prognostic Index: A scoring system for survival prediction of terminally ill cancer patients. Support Care Cancer. 1999;7(3):128-133.

---

## Palliative Performance Scale (PPS)

**Application:** Measures functional status in palliative care patients on a 0–100% scale. Component of PPI.

**Scale:**

| PPS% | Ambulation | Activity & Evidence of Disease | Self-Care | Intake | Conscious Level |
|------|-----------|-------------------------------|-----------|--------|----------------|
| 100 | Full | Normal, no disease | Full | Normal | Full |
| 90 | Full | Normal, some disease | Full | Normal | Full |
| 80 | Full | Normal with effort, some disease | Full | Normal or reduced | Full |
| 70 | Reduced | Unable normal job/work, significant disease | Full | Normal or reduced | Full |
| 60 | Reduced | Unable hobby/housework, significant disease | Occasional assistance | Normal or reduced | Full or confusion |
| 50 | Mainly sit/lie | Unable to do any work, extensive disease | Considerable assistance | Normal or reduced | Full or confusion |
| 40 | Mainly in bed | Unable to do most activity, extensive disease | Mainly assistance | Normal or reduced | Full, drowsy, or confusion |
| 30 | Totally bed bound | Unable to do any activity, extensive disease | Total care | Normal or reduced | Full, drowsy, or confusion |
| 20 | Totally bed bound | Unable to do any activity, extensive disease | Total care | Minimal sips | Full, drowsy, or confusion |
| 10 | Totally bed bound | Unable to do any activity, extensive disease | Total care | Mouth care only | Drowsy or coma |
| 0 | Death | — | — | — | — |

**Interpretation:**

- PPS 70–100%: Relatively preserved function; may continue disease-directed therapy
- PPS 40–60%: Significant functional decline; transition conversations appropriate
- PPS 10–30%: Nearing end of life; hospice appropriate
- PPS decline of ≥30% over 1–2 months: Rapid trajectory suggesting weeks prognosis

**Source:** Anderson F et al. Palliative Performance Scale (PPS): A new tool. J Palliat Care. 1996;12(1):5-11.

---

## PaP Score (Palliative Prognostic Score)

**Application:** Predicts 30-day survival in terminally ill cancer patients using clinical and laboratory variables.

**Criteria:**

| Variable | Finding | Score |
|----------|---------|-------|
| **Dyspnea** | Absent | 0 |
| | Present | 1.0 |
| **Anorexia** | Absent | 0 |
| | Present | 1.5 |
| **KPS** | ≥50 | 0 |
| | 30–40 | 0 |
| | 10–20 | 2.5 |
| **Clinical prediction of survival** | >12 weeks | 0 |
| | 11–12 weeks | 2.0 |
| | 9–10 weeks | 2.5 |
| | 7–8 weeks | 2.5 |
| | 5–6 weeks | 4.5 |
| | 3–4 weeks | 6.0 |
| | 1–2 weeks | 8.5 |
| **WBC** | Normal (4,800–8,500) | 0 |
| | 8,501–11,000 | 0.5 |
| | >11,000 | 1.5 |
| **Lymphocyte %** | Normal (20–40%) | 0 |
| | 12–19.9% | 1.0 |
| | 0–11.9% | 2.5 |

**Calculation & Interpretation:**

| PaP Score | Risk Group | 30-Day Survival |
|-----------|-----------|----------------|
| 0–5.5 | Group A | >70% |
| 5.6–11.0 | Group B | 30–70% |
| 11.1–17.5 | Group C | <30% |

**Source:** Pirovano M et al. A new palliative prognostic score: A first step for the staging of terminally ill cancer patients. J Pain Symptom Manage. 1999;17(4):231-239.

---
