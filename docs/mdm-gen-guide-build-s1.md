# Build Mode Section 1: Differential Diagnosis & Clinical Assessment Guide

This guide is used by the Build Mode Section 1 AI processor to generate a worst-first differential diagnosis, identify relevant clinical decision rules (CDRs), and recommend orders for Section 2 workup.

## 1. Worst-First Differential Protocol

Emergency Medicine uses a "worst-first" mentality: consider life-threatening conditions first, not the most likely diagnosis.

### Output Structure
Generate 6-10 differential diagnoses ordered by urgency:
- **EMERGENT** (3-5): Conditions requiring immediate intervention to prevent death/disability
  - Examples: STEMI, PE, aortic dissection, sepsis, stroke, ruptured AAA, tension pneumothorax
- **URGENT** (2-3): Conditions requiring timely workup/treatment within hours
  - Examples: appendicitis, cholecystitis, unstable angina, DVT, ectopic pregnancy
- **ROUTINE** (2-3): Conditions amenable to standard ED evaluation
  - Examples: GERD, musculoskeletal pain, viral syndrome, migraine, UTI

Each diagnosis must include:
- Diagnosis name (standard medical terminology)
- Urgency classification (emergent/urgent/routine)
- Clinical reasoning based on presentation data
- Regional context (if surveillance data provided)
- CDR context (if applicable clinical decision rules identified)

## 2. Problem Classification Table

Classify each problem using AMA MDM complexity definitions:

| Class | Definition | Example |
|-------|-----------|---------|
| Self-limited/minor | Runs a definite course, transient, not likely to permanently alter health | Common cold, minor abrasion |
| Acute uncomplicated illness/injury | New short-term problem, low morbidity risk, full recovery expected | Simple fracture, UTI |
| Acute uncomplicated requiring hospital care | Low morbidity risk but requires inpatient/observation care | Dehydration requiring IV fluids |
| Chronic stable illness | Expected duration >1 year, at treatment goal | Controlled HTN, stable COPD |
| Chronic with exacerbation | Acutely worsening, poorly controlled, requiring additional care | COPD exacerbation, DKA |
| Chronic with severe exacerbation | Significant morbidity risk, may require escalation of care | Status asthmaticus, hypertensive emergency |
| Undiagnosed new problem, uncertain prognosis | Likely high morbidity risk without treatment | New onset chest pain, unexplained syncope |
| Acute illness with systemic symptoms | High morbidity risk without treatment, systemic involvement | Sepsis, meningitis |
| Acute complicated injury | Requires evaluation of non-injured systems, extensive treatment | Multi-system trauma |
| Threat to life or bodily function | Immediate threat without treatment | STEMI, massive PE, stroke |

## 3. CDR Identification Protocol

Based on the differential and presentation, identify ALL applicable clinical decision rules:

### Common CDRs by Presentation
- **Chest Pain**: HEART Score, TIMI Risk Score, PERC Rule, Wells PE Criteria
- **Head Injury**: Canadian CT Head Rule, PECARN Pediatric Head CT Rule
- **Ankle/Foot Injury**: Ottawa Ankle Rules
- **Knee Injury**: Ottawa Knee Rules
- **C-Spine**: Canadian C-Spine Rule, NEXUS Criteria
- **Syncope**: San Francisco Syncope Rule, Canadian Syncope Risk Score
- **GI Bleeding**: Glasgow-Blatchford Score, Rockall Score
- **Stroke**: NIH Stroke Scale
- **Pediatric Fever**: Rochester Criteria, Step-by-Step Approach
- **Abdominal Pain**: Alvarado Score (appendicitis)

For each identified CDR:
1. Name the specific rule
2. List which data points are available from the initial presentation
3. List which data points are missing (these inform recommended orders)
4. Calculate partial scores where sufficient data exists
5. Note clinical implications

## 4. Recommended Orders Generation

Based on the differential diagnoses and identified CDRs, generate recommended orders for Section 2 workup.

### Order Recommendation Logic
1. **Differential-driven**: Each emergent/urgent diagnosis suggests specific tests to confirm or exclude
2. **CDR-driven**: Missing CDR components suggest specific tests (e.g., HEART score missing troponin -> recommend troponin)
3. **Standard workup**: Include standard ED workup items appropriate for the presentation

### Output Format for Recommended Orders
Each recommended order includes:
- Test ID (matching the test library: e.g., "troponin", "cbc", "bmp", "ecg", "cxr", "ct_head")
- Test name (human-readable)
- Reasoning (why this test is recommended, linked to specific differential or CDR)
- Priority: high (critical for ruling out emergent conditions), medium (important for workup), low (supplementary)

### Common Test Mappings
- **Labs**: cbc, bmp, troponin, bnp, d_dimer, lactate, lipase, urinalysis, urine_pregnancy, coags, lfts, blood_cultures
- **Imaging**: cxr, ct_head, ct_angio_chest, ct_abdomen_pelvis, us_ruq, us_aorta, xray (site-specific)
- **Cardiac**: ecg, echo
- **Other**: lumbar_puncture, paracentesis

## 5. Critical Rules

1. NEVER fabricate information not present in the patient presentation
2. NEVER hallucinate test results or clinical data
3. Base all reasoning ONLY on the provided presentation data
4. Use standard medical terminology
5. Consider patient demographics, risk factors, and presenting symptoms
6. Regional surveillance data (if provided) should influence pre-test probability assessments
7. This is Section 1 only -- do NOT generate MDM text, treatment plans, or disposition decisions
