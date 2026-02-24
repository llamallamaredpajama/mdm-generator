# Emergency Medicine MDM Documentation Research — Consolidated Findings

> **Research Date**: February 2026
> **Scope**: US Emergency Medicine MDM documentation from 2023 onwards
> **Agents**: Billing, Clinical, Legal — 135+ citations total

---

## Executive Summary

Three research agents conducted extensive web research into Emergency Medicine Medical Decision Making documentation. Key cross-cutting findings:

1. **MDM is now the sole determinant** of ED E/M code level (99281-99285) as of January 2023 — history and physical no longer drive code selection
2. **Documentation failures contribute to 20% of malpractice cases** and more than double the odds of indemnity payment (Candello/CRICO 2024, 65,000+ cases)
3. **Presenting symptoms (not final diagnosis) drive MDM complexity** — a chest pain workup that rules out ACS still qualifies as high complexity
4. **Cigna and Aetna implementing algorithmic downcoding** of Level 4/5 ED codes starting October 2025
5. **CMS scaling from 40 to 2,000 medical coders** by September 2025
6. **75% of EM physicians** will face at least one malpractice lawsuit in their career
7. **AI-assisted documentation** is an emerging legal frontier with 14% increase in related malpractice claims from 2022-2024

---

## Part 1: Billing & Coding

### 1.1 Current E/M Framework (2023-2026)

- ED codes 99281-99285 determined **exclusively by MDM** — time is NOT a factor for ED visits
- Two of three MDM elements must meet or exceed the target level
- G2211 (visit complexity add-on) does NOT apply to ED codes
- Critical care (99291/99292) requires discrete time documentation in minutes, with Medicare's 104-minute rule for adding 99292
- No major structural changes to ED E/M codes in 2024-2026; the 2023 harmonization remains operative

### 1.2 MDM Complexity Table

#### Element 1: Number and Complexity of Problems Addressed (COPA)

| Level | Description | Examples |
|-------|-------------|---------|
| Minimal | 1 self-limited/minor problem | URI, small abrasion |
| Low | 2+ self-limited; OR 1 stable chronic; OR 1 acute uncomplicated | Cystitis, simple sprain |
| Moderate | 1+ chronic with mild exacerbation; OR 2+ stable chronic; OR 1 undiagnosed new problem with uncertain prognosis; OR 1 acute with systemic symptoms | COPD exacerbation, new abdominal pain |
| **High** | **1+ chronic with severe exacerbation; OR 1 acute/chronic that poses threat to life or bodily function** | **ACS, stroke, sepsis, acute abdomen** |

**Critical principle**: Presenting symptoms drive COPA, NOT the final diagnosis. A chest pain patient ruled out for ACS still qualifies as high COPA because "extensive evaluation may be required to reach the conclusion that the signs or symptoms do not represent a highly morbid condition."

#### Element 2: Amount and Complexity of Data Reviewed and Analyzed

| Level | Requirements |
|-------|-------------|
| Minimal | Minimal or no data reviewed |
| Low | Limited data (ordering/reviewing labs) |
| Moderate | Ordering/reviewing tests + independent interpretation; OR external records review; OR external physician discussion |
| **High/Extensive** | **Independent interpretation of imaging + discussion with external physician; OR items from at least 2 of 3 categories (tests/documents, independent interpretation, external physician discussion)** |

#### Element 3: Risk of Complications, Morbidity, and/or Mortality

| Level | Presenting Problem Risk | Management Risk |
|-------|------------------------|-----------------|
| Minimal | Self-limited, minor | Rest, bandage, OTC meds |
| Low | Acute, uncomplicated | Prescription medications, minor procedures |
| Moderate | Undiagnosed new problem with uncertain prognosis; acute with systemic symptoms | Rx management, IV fluids, minor surgery with risk factors, observation decision |
| **High** | **Acute/chronic threatening life or bodily function** | **Drug therapy requiring intensive monitoring, hospitalization decisions, DNR discussions, emergency major surgery, parenteral controlled substances** |

### 1.3 High-Value Documentation Elements (Ranked by Billing Impact)

**Tier 1 — Highest Impact:**
- Differential diagnosis with explicit life threats considered
- Admission/observation decision with clinical rationale
- Independent interpretation of imaging (your own read, documented separately from radiology)
- Discussion with external physician (consultant name, time, content, recommendations)

**Tier 2 — High Impact:**
- Parenteral controlled substances administration
- Drug therapy requiring intensive monitoring
- Emergency procedures with risk factors
- Social determinants of health impact on management

**Tier 3 — Supporting Impact:**
- Independent historian information obtained
- External records reviewed
- Risk stratification tools applied with scores (HEART, PERC, Wells, etc.)
- Medication management rationale

### 1.4 CMS vs Private Payer Differences

| Area | CMS/Medicare | Commercial Payers |
|------|-------------|-------------------|
| Code determination | MDM only (2023+) | Varies; some still audit H&P elements |
| Algorithmic review | Scaling to 2,000 coders by Sept 2025 | Cigna/Aetna: automatic AI downcoding of Level 4/5 (Oct 2025) |
| Denial trends | RAC/MAC/ZPIC audits increasing | AI-driven denials up to **16x higher** than traditional review (AMA/Senate 2024) |
| Diagnosis basis | Presenting symptoms accepted | Some payers pay on final diagnosis, violating Prudent Layperson Standard |
| Medicare Advantage | Denials up 4.8% year-over-year | N/A |

### 1.5 Audit Defense

**Most common downcoding reasons:**
- Missing differential diagnosis documentation
- Insufficient data review documentation (labs listed without interpretation)
- Risk documentation not tied to clinical decisions
- Inconsistent internal logic in the clinical narrative

**Strongest audit defense elements:**
- Explicit worst-first differential diagnosis
- Data review with clinical significance statements (not just listing results)
- Risk documentation tied to specific decisions made
- Consistent narrative logic throughout the chart
- Modifier 25 documentation clearly separating E/M from procedure

**Key stat**: Modifier 25 overuse is a **top audit trigger in 2025**

### 1.6 Revenue Cycle Intelligence

- Medical necessity denial amounts up **70%** to $450 average
- Target KPIs: >95% clean claim rate, <10% denial rate, <30 days in AR
- Medicare pays only 82 cents per dollar of hospital costs
- DOJ record $14.6B healthcare fraud takedown in 2025

---

## Part 2: Clinical Best Practices

### 2.1 EM-Specific Documentation Paradigm

**The "Worst-First" (Upside-Down Cake) Model:**
- Unlike other specialties that start with the most likely diagnosis, EM starts with the most dangerous diagnoses and works down
- For chest pain: ACS → PE → aortic dissection → pneumothorax → esophageal rupture → pericarditis/tamponade → then less serious etiologies
- Documentation must reflect this reasoning explicitly
- The "Safety Timeout": at the end of every chart, explicitly ask "What could I be missing?"

**EM Documentation Unique Properties:**
- Each ED note is an **independent, standalone document** (unlike inpatient progress notes)
- Emergency physicians manage undifferentiated patients — final diagnosis may not be made in the ED
- Goal is ruling out emergencies and ensuring safe disposition
- 2023 guidelines reduced ED note length by **872 words** without changing documentation time

### 2.2 Worst-First Differential Templates by Chief Complaint

**Chest Pain:**
"NOT consistent with Acute Coronary Syndrome (ACS) and/or myocardial ischemia, pulmonary embolism, aortic dissection, Boerhaave's syndrome, significant arrhythmia, pneumothorax, cardiac tamponade, or other emergent cardiopulmonary condition."

**Headache:**
"NOT consistent with subarachnoid hemorrhage, intracranial hemorrhage, meningitis/encephalitis, mass lesion, temporal arteritis, cerebral venous sinus thrombosis, or other emergent intracranial condition."

**Abdominal Pain:**
"NOT consistent with AAA, bowel perforation, appendicitis, ectopic pregnancy [if applicable], bowel obstruction, mesenteric ischemia, DKA, or other surgical emergency."

**Dyspnea:**
"NOT consistent with PE, tension pneumothorax, acute heart failure, cardiac tamponade, anaphylaxis, or other immediately life-threatening condition."

**Syncope:**
"NOT consistent with cardiac arrhythmia, structural heart disease, PE, aortic dissection, subarachnoid hemorrhage, or other life-threatening etiology."

**Altered Mental Status:**
"NOT consistent with stroke, intracranial hemorrhage, meningitis/encephalitis, status epilepticus, hypoglycemia, toxic ingestion, or other emergent neurologic condition."

### 2.3 Clinical Decision Rules — Documentation Requirements

| Rule | Application | Document These Elements |
|------|------------|------------------------|
| **HEART Score** | Chest pain risk | History, ECG, Age, Risk factors, Troponin → score + risk category + action taken |
| **PERC Rule** | PE rule-out (low pretest) | All 8 criteria; only when clinical suspicion <15% |
| **Wells (PE)** | PE probability | 7 characteristics; low/moderate/high stratification |
| **Wells (DVT)** | DVT probability | Clinical features + D-dimer correlation |
| **Canadian C-Spine** | C-spine imaging | Age, mechanism, paresthesias, tenderness, ambulatory status |
| **NEXUS** | C-spine clearance | All 5 criteria explicitly |
| **Ottawa Ankle/Knee** | Extremity imaging | Bone tenderness points, weight-bearing |
| **PECARN** | Pediatric head CT | GCS, altered mental status, scalp hematoma, mechanism, LOC, vomiting, headache |
| **CURB-65** | Pneumonia severity | Confusion, Urea, RR, BP, Age ≥65 |

**Documentation pattern**: State the rule → document each criterion → state resulting score → document how it influenced the decision.

### 2.4 Independent Interpretation Documentation

**Imaging**: "On my interpretation of the chest X-ray..." or "My read of the CT shows..." (supports MDM data complexity credit)

**ECG**: Document at minimum: rate, rhythm, axis, intervals, ST changes, comparison with prior. Use: "I independently interpret this ECG as showing..."

**POCUS** (per ACEP guidelines): Must include:
- Clinical indication
- Views obtained (with quality notation)
- Findings (positive and negative)
- Interpretation and clinical correlation
- Impact on management
- Images saved/archived in EHR

### 2.5 Reassessment Documentation

- Document reassessment after each intervention (vital signs, symptoms, exam changes)
- Time stamps for each reassessment
- Clinical trajectory: improving / stable / worsening
- Modified treatment plan documented when indicated
- High-acuity patients: reassessment at least hourly

### 2.6 Disposition Documentation

**Discharge — 5 Essential Components:**
1. Clear discharge diagnosis in patient-understandable language
2. Expected course and recovery trajectory
3. At-home care (medications, activity, wound care)
4. **Specific** return precautions (not generic "return if worse")
5. Follow-up plan (who, when, why)

**Critical**: 92% of patients misunderstand at least one discharge instruction component. Discharge instructions are written 4+ grade levels above the recommended 6th-grade level.

**High-Risk Discharges** (chest pain, headache, abdominal pain):
- Document specific life threats ruled out and how
- Document shared decision-making
- Explicit time-bound return precautions
- Specific follow-up with timeframe
- Patient verbalized understanding

**AMA Documentation — 8 Required Elements:**
1. Capacity assessment (4 components: understanding, appreciation, reasoning, communication)
2. Description of physician-patient interaction
3. Physician's expressed concerns
4. Extent/limitations of evaluation completed
5. Risk and benefit explanations (specific, not generic)
6. Alternatives discussed
7. Evidence patient understood
8. Harm reduction measures (prescriptions, follow-up, invitation to return)

**Key finding**: AMA patients are up to **10x more likely to sue** (1 in 300 vs. 1 in 30,000 standard visits). Signed AMA forms alone provide minimal legal protection.

### 2.7 Special Scenario Documentation

**Trauma**: Primary survey (ABCDE) + secondary survey + AMPLE history + mechanism + imaging rationale

**Psychiatric**: Safety assessment + medical screening + mental status exam + capacity evaluation + suicide risk assessment (ASQ/Columbia) + safety plan. Note: 56% of ED psychiatric patients have NO documented mental status assessment.

**Pediatric**: Weight in kg (measured), PECARN criteria, developmental assessment, caregiver reliability, non-accidental trauma screening

**Geriatric**: Atypical presentation consideration, baseline functional status, polypharmacy review (avg 4.2 meds), fall risk, cognitive screening, social assessment

**Procedural Sedation**: Pre (ASA class, airway assessment, NPO status, consent, baseline vitals) → Intra (continuous monitoring, sedation depth, all meds with times) → Post (return to baseline, Modified Aldrete Score, discharge criteria, responsible adult)

### 2.8 Quality Metrics Documentation

**Sepsis (SEP-1)**: Time zero → blood cultures → antibiotic time → lactate → IV fluid bolus → reassessment → vasopressors

**Stroke**: Door-to-doctor (≤10min) → Door-to-CT (≤20min) → Door-to-interpretation (≤35min) → Door-to-needle (≤45min)

**STEMI**: Door-to-ECG (≤10min) → Door-to-needle (≤30min non-PCI) → Door-to-balloon (≤90min PCI)

**Handoff (I-PASS)**: Illness severity → Patient summary → Action list → Situation awareness → Synthesis by receiver

---

## Part 3: Medico-Legal Protection

### 3.1 Malpractice Landscape

- **75%** of EM physicians will be named in a lawsuit at least once
- **1 in 14** emergency physicians sued each year
- **Diagnostic failures = 58%** of all EM malpractice claims
- Average EM malpractice payout: **$330,000**; misdiagnosis cases: **$362,000**
- Defense costs: $50,000-$100,000 per case

**Top Diagnoses Leading to Claims (by indemnity):**

| Condition | % of Indemnity Claims |
|-----------|----------------------|
| Cardiac/cardiorespiratory arrest | 9.1% |
| Acute MI | 4.0% |
| Aortic aneurysm | 2.3% |
| Pulmonary embolism | 2.2% |
| Appendicitis | 2.0% |

Additional high-risk: stroke, spinal epidural abscess, necrotizing fasciitis, meningitis, testicular torsion, SAH, septicemia

**Notable Recent Verdicts (2023-2024):**
- **$44M** — Undocumented consultant discussion (headache → brainstem herniation)
- **$32.7M** — Missed blood clot → amputation
- **$20M** — Altered charts to remove fever documentation
- **$15.3M** — Failure to activate Stroke Alert, 26-hour delay
- **$9M** — Signed AMA form but no documented risk discussion
- **$9.25M** — No documentation of urgency of follow-up referral

### 3.2 Documentation as Legal Defense

**Core principle**: "If it wasn't documented, it wasn't done" — the medical record IS the care rendered in court.

**Most protective documentation elements:**
1. Clinical reasoning (MDM) — document not just WHAT but **WHY**
2. Differential diagnosis with life threats explicitly addressed
3. Informed consent discussions (actual conversation, not just signed form)
4. Patient discussions about diagnosis, treatment, follow-up
5. Time stamps on all significant events
6. Reassessment after interventions
7. Specific discharge instructions with return precautions
8. Consultant communications (name, time, content, recommendations)
9. Others' involvement (chaperones, family, nursing)
10. Discrepancies addressed (differences between providers' notes)

**Timeliness**: Documentation written during the ED visit has significantly more credibility than recollections years later. Late entries are characterized as "self-serving" by plaintiff attorneys.

### 3.3 Phrases That Help vs. Hurt in Court

**Protective Phrases:**
| Phrase | Why It Protects |
|--------|----------------|
| "Discussed risks and benefits with patient" | Establishes informed consent |
| "Patient verbalized understanding" | Confirms comprehension |
| "Assessed and monitored at [specific time]" | Shows ongoing attention |
| "Consulted [specialist name] at [time]" | Documents collaboration |
| "Considered [diagnosis] — deemed low-risk based on [reasoning]" | Shows clinical reasoning |
| "Return precautions discussed including [specific symptoms]" | Documents safety net |
| "Patient smiling, recounting stories about grandchildren" | Specific observations > generic assessments |

**Dangerous Phrases:**
| Phrase | Why It's Dangerous |
|--------|-------------------|
| "Patient noncompliant" | Implies blame; alienates juries |
| "Per protocol" | Suggests rote care without clinical judgment |
| "No change" | Vague; implies inattention if condition worsens |
| "Normal exam" | Overly generic without supporting data |
| "WNL" (within normal limits) | Vague; not defensible |
| Unnecessary patient quotations | Creates mocking tone; suggests bias |
| References to appearance/religion/politics | Demonstrates bias |

### 3.4 EHR-Specific Legal Risks

**Copy-paste**: Leading trend in EHR-related malpractice. Average indemnity: ~$450,000. A single contradictory copied statement can destroy physician credibility.

**Templates**: Can "pigeonhole clinicians into describing an inaccurate narrative." Auto-populated assessments are particularly dangerous (e.g., "moves all 4 extremities" for amputee).

**Transcription errors**: 7 errors per 100 words; clinically significant error every 250 words; 15% of ED notes contain clinically significant errors.

**Audit trails**: EHR metadata captures every login, access, modification with timestamps. Routinely requested in litigation. Alterations discovered in litigation have resulted in verdicts exceeding $20M.

### 3.5 AI Documentation — Emerging Legal Landscape

- 14% increase in AI-related malpractice claims from 2022-2024
- No established legal framework yet — courts determining product liability vs malpractice doctrine
- Physicians remain ultimately responsible for accuracy of AI-generated documentation
- Some insurers now require AI training to maintain coverage
- Recommendations: transparency about AI use, informed consent, physician review mandatory
- Standard of care may evolve as AI tools become pervasive — physicians may be expected to use AI

### 3.6 EMTALA Requirements

**MSE Documentation**: Vital signs + relevant history + physical exam + determination of EMC presence
**Stabilization**: Treatment provided such that "no material deterioration likely"
**Transfer**: Physician certification + receiving facility acceptance + records/imaging sent + qualified transport + informed consent
**Penalties**: Up to $119,942 per violation (physicians and hospitals)

### 3.7 High-Risk Scenarios — Documentation Checklists

**Bounce-Back Visits:**
- Document review of prior medical record
- Note changed/unchanged findings since first visit
- Review of prior lab/imaging results
- Fresh differential diagnosis (unencumbered by prior assessment)
- Real-time documentation (especially critical for bounce-backs)

**LWBS (Left Without Being Seen):**
- Exact time of departure
- Patient's reason for leaving (if known)
- Confirmation no physician assessment completed
- EMTALA compliance notation
- Attempts to advise patient of risks

**Refusal of Treatment:**
- Detailed HPI, vitals, physical exam
- Capacity assessment (4 components)
- Specific risks disclosed
- Patient's autonomous choice documented
- All persons involved in discussion
- Harm reduction measures offered

---

## Part 4: Cross-Cutting Recommendations for MDM Tool

### 4.1 Must-Have Documentation Elements (All Three Domains Agree)

These elements appeared as critical across billing, clinical, AND legal research:

1. **Worst-first differential diagnosis** with life threats explicitly addressed
2. **Clinical reasoning narrative** — WHY decisions were made, not just WHAT
3. **Independent interpretation** of imaging and ECGs (with documentation language)
4. **Risk stratification tools** with scores, criteria, and resulting actions
5. **Consultant communications** (name, time, content, recommendations)
6. **Reassessment documentation** after interventions
7. **Specific return precautions** (condition-appropriate, not generic)
8. **Shared decision-making** documentation
9. **Disposition rationale** tied to clinical findings
10. **Time stamps** on significant clinical events

### 4.2 Documentation Anti-Patterns to Prevent

1. Auto-populated data without clinical verification (note bloat)
2. Vague language ("WNL," "normal," "unremarkable") without specifics
3. Copy-forward from prior notes without updating
4. Labs/imaging listed without interpretation or clinical reasoning
5. Missing pertinent negatives that support ruling out conditions
6. Generic return precautions not tied to patient's presentation
7. "Per protocol" language suggesting rote care
8. Blame/bias language ("noncompliant," demographic descriptors)

### 4.3 Payer-Specific Awareness

- Cigna/Aetna algorithmic downcoding of Level 4/5 (Oct 2025)
- Medicare 104-minute rule for critical care billing
- Diagnosis-code alignment (presenting symptoms vs final diagnosis)
- Modifier 25 documentation when procedures performed alongside E/M

### 4.4 Emerging Trends to Monitor

- AI documentation legal liability framework (evolving rapidly)
- 21st Century Cures Act — patients can now see ED notes in real-time via portal
- CMS SDOH documentation requirements (code G0136, no longer voluntary)
- Hospital liability for contract physician negligence (*Essex v. Samaritan*, 2024)
- Joint Commission standards consolidation (effective January 2026)

---

## Sources Summary

> 135+ total citations across all three research reports.

**Key Source Categories:**
- **Professional Societies**: ACEP, AAEM, SAEM, AMA, AHA
- **Government/Regulatory**: CMS, HHS OIG, Joint Commission, CDC
- **Research**: Candello/CRICO 2024 (65,000+ cases), Annals of Emergency Medicine, PMC
- **Clinical References**: WikEM, ALiEM, EB Medicine, emDocs, EMCrit, MDCalc
- **Legal**: Case law databases, medical malpractice statistics, EMTALA enforcement data
- **Coding**: AAPC, California ACEP CMS Toolkit, Noridian Medicare
