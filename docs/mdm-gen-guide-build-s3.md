# Build Mode Section 3: Final MDM Generation Guide

This guide is used by the Build Mode Section 3 (Finalize) AI processor to generate the complete Medical Decision Making (MDM) documentation from structured Build Mode data.

## Input Data Structure

Section 3 receives ALL accumulated data from the encounter:

### From Section 1 (AI-generated)
- **Differential diagnoses**: Worst-first ordered list with urgency, reasoning, and CDR context
- **Identified CDRs**: Clinical decision rules applicable to this presentation
- **Recommended orders**: Tests recommended based on differential and CDRs
- **Initial presentation narrative**: The physician's original dictation

### From Section 2 (Physician data entry)
- **Selected tests/orders**: Which tests were actually ordered
- **Test results**: Structured results (status, value, unit, findings) for each test
- **CDR tracking**: Completed CDR scores with component values
- **Working diagnosis**: Physician's working diagnosis (may be AI-suggested or custom)

### From Section 3 (Physician input)
- **Treatments/procedures**: Medications administered, procedures performed
- **CDR-suggested treatments**: Treatments selected from CDR recommendations
- **Reassessments**: Response to treatment observations
- **Disposition**: Discharge/admit/transfer/observation/ICU/AMA
- **Follow-up instructions**: Recommended follow-up care
- **Free-text narrative**: Additional treatment and disposition details

## MDM Documentation Template

Generate a complete, copy-pastable MDM document following this structure:

### EMERGENCY DEPARTMENT MEDICAL DECISION MAKING PROCESS

**MEDICAL DECISION MAKING SUMMARY:**
- This [age][sex] presents with [chief complaint] requiring [complexity level] medical decision-making based on [primary complexity driver].

**PROBLEMS CONSIDERED:**
[For each problem from the differential, classify using the Problem Classification Table below and format as:]

[Condition]: [CLASS].
Suspected due to: [Inclusion reasoning based on presentation and workup results].

**RISK ASSESSMENT:**
The patient has [list symptoms and objective clinical findings of highest complexity], and due to this patient's overall presentation, I consider the patient's highest risk diagnosis to be [highest risk diagnosis from differential].

However, I believe that the patient is most likely to have [working diagnosis from S2, or most likely diagnosis given all data].

[For each differential item not selected as working diagnosis, provide exclusion/probability assessment:]
- [Condition]: [low probability/reduced probability/ruled out] based on [specific test results or clinical reasoning]. [Reference CDR results if applicable.]

**Clinical Decision Rules:**
[For each CDR in the CDR tracking data:]
- [CDR Name]: Score [X] — [interpretation]. Components: [list scored components]. [Clinical implication for disposition/treatment.]

Highest risk element: [Specific intervention/decision conferring highest risk]

Other risk factors present:
- Patient factors: [Age, comorbidities, social determinants from presentation]
- Diagnostic risks: [Tests ordered and their risks]
- Treatment risks: [Medications, interventions and their risks]
- Disposition risks: [Risks associated with the chosen disposition]

**CLINICAL REASONING AND MANAGEMENT:**
Evaluation approach:
- [Systematic evaluation strategy based on differential]

Key decision points:
- [Critical thinking demonstrated, referencing test results and CDR scores]

**DATA COLLECTED, REVIEWED AND ANALYZED:**
Tests:
- Laboratory tests: [List each test from S2 results with values and interpretation. If no labs ordered: "considered but given limited utility, not warranted at this time"]
- Imaging studies: [List each imaging study from S2 results with findings. If none: "benefit not deemed greater than risk"]
- EKG/Rhythm strips: [If ECG ordered, list interpretation. If not ordered, omit this line entirely]

Documents and other sources:
- External records: [If mentioned in presentation]
- Independent historian: [EMS/Family/Facility if mentioned]
- PDMP review: considered but would not change management

Independent Interpretation:
[For each test with results, provide brief clinical interpretation]

[If regional surveillance data available:]
- Regional Surveillance Data: [Sources queried and key findings relevant to this case]

**WORKING DIAGNOSIS:**
- [Working diagnosis from S2, or most likely diagnosis based on all data]

**TREATMENT, PROCEDURES, INTERVENTIONS:**
Rationale:
- For all interventions chosen, pt agreed that potential benefit outweighed the potential risks and gave consent

Medications administered:
- [From S3 treatments. Format: Drug, dose, route, indication if mentioned. If no dose/route: "see MAR for dosing". If no drugs: "see MAR"]
[Include CDR-suggested treatments with CDR reference: e.g., "Aspirin 325mg — per HEART Score protocol"]

Procedures performed:
- [From S3 treatments. If no procedures mentioned, omit this section entirely including the header]

**DISPOSITION DECISION PROCESS:**
Reassessments:
- [From S3 reassessment data. If not specified: "unremarkable"]

Response to treatment:
- [Patient improvement/deterioration from S3. If not specified, omit section including header]

External Discussions:
- [If disposition is admit/observation/transfer: document with whom discussed]
- [If disposition is discharge and no discussion mentioned: "discussion with referred physician considered; patient/family demonstrate clear understanding of issues and close follow-up with their physician was recommended"]

Risk mitigation strategies:
- [Specific actions taken to reduce risk based on presentation and treatment]
- [Safety-netting measures implemented]

**DISPOSITION:**
- [Disposition from S3]: Level of care: [If admitted: Floor/Stepdown/ICU], [with/without cardiac monitoring]
- Rationale: [Clinical reasoning for disposition choice, referencing CDR scores if applicable]

[Special disposition addenda:]
- If alcohol withdrawal is the highest risk element: include alcohol withdrawal admission language
- If substance abuse is the highest risk element: include substance abuse admission language

Discharge instructions: [If discharged]
- Primary and all other relevant diagnoses explained
- Incidental findings reported to the patient
- Medications prescribed: [from S3]
- Medications considered but not prescribed: [list 2 drugs of similar class if not mentioned]
- Follow-up recommended: [from S3 follow-up instructions]
- Return precautions: any worsening or new symptoms, especially severe pain or difficulty with normal bodily function
- Patient understanding verified

## Problem Classification Table

| Class | Definition |
|-------|-----------|
| Self-limited/minor | Runs a definite course, transient, not likely to permanently alter health |
| Acute uncomplicated illness/injury | New short-term problem, low morbidity risk, full recovery expected |
| Acute uncomplicated requiring hospital care | Low morbidity risk but requires inpatient/observation care |
| Chronic stable illness | Expected duration >1 year, at treatment goal |
| Chronic with exacerbation | Acutely worsening, poorly controlled, requiring additional care |
| Chronic with severe exacerbation | Significant morbidity risk, may require escalation of care |
| Undiagnosed new problem, uncertain prognosis | Likely high morbidity risk without treatment |
| Acute illness with systemic symptoms | High morbidity risk, systemic involvement |
| Acute complicated injury | Requires evaluation of non-injured systems, extensive treatment |
| Threat to life or bodily function | Immediate threat without treatment |

## MDM Complexity Determination

- **HIGH**: Multiple diagnoses with competing differentials, extensive data review (labs + imaging + CDRs), high-risk decision making (admission, procedural intervention, time-sensitive treatment). Build Mode targets complex cases — default to HIGH unless presentation is clearly straightforward.
- **MODERATE**: 2-3 diagnoses, moderate data review, some clinical risk
- **LOW**: Single straightforward problem, minimal workup, low-risk disposition

## Structured Data Integration Rules

1. When structured test results (from S2) are provided, use them as the AUTHORITATIVE data source — they are more precise than any free-text
2. Reference specific test values, units, and abnormal flags in the Data Reviewed section
3. When CDR tracking data is provided with completed scores, include EXACT scores and interpretations
4. When CDR-suggested treatments are provided, document each with its CDR basis
5. When structured disposition is provided, use it as the primary disposition decision
6. Cross-reference S2 test results with S1 differential to show differential narrowing
7. Do NOT fabricate any information — use ONLY what was provided in the structured data
8. If a section is empty or missing, handle gracefully (e.g., "no workup performed" or omit the section)

## Critical Rules

1. Output must be copy-pastable directly into an EHR — no explanatory text, no markdown formatting markers
2. Do NOT say "not documented" — if data is missing, omit that component entirely
3. Do NOT add conversational text like "here is your MDM document"
4. This is a one-shot process — do not ask follow-up questions
5. NEVER fabricate or hallucinate any clinical data
6. Include ALL information provided — do not omit relevant clinical data
7. Use "low probability" rather than "excluded" unless a CDR explicitly supports exclusion
