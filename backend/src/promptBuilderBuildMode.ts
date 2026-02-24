/**
 * Build Mode Prompt Builders
 *
 * Section-specific prompt construction for the 3-section guided MDM workflow.
 * Each function builds prompts that generate structured output for their section.
 */

import type { DifferentialItem, DispositionOption, MdmPreview, Section1Response, Section2Response, TestResult, WorkingDiagnosis } from './buildModeSchemas'
import type { CdrDefinition, TestDefinition } from './types/libraries'

/**
 * Structured data from S2/S3 that enriches the finalize prompt.
 * All fields are optional for backward compatibility with encounters
 * that don't have structured data yet.
 */
export interface FinalizeStructuredData {
  /** S2: Selected test IDs (e.g., "troponin", "cbc") */
  selectedTests?: string[]
  /** S2: Test results keyed by test ID */
  testResults?: Record<string, TestResult>
  /** S2: Working diagnosis (structured object or legacy string) */
  workingDiagnosis?: string | WorkingDiagnosis
  /** S3: Free-text treatment description */
  treatments?: string
  /** S3: CDR-suggested treatment IDs (namespaced as "cdrId:treatmentId") */
  cdrSuggestedTreatments?: string[]
  /** S3: Selected disposition option */
  disposition?: DispositionOption | null
  /** S3: Follow-up instructions */
  followUp?: string[]
}

/**
 * Section 1: Initial Evaluation
 * Generates worst-first differential diagnosis from patient presentation.
 */
export function buildSection1Prompt(
  content: string,
  systemPrompt: string,
  surveillanceContext?: string,
  cdrContext?: string
): { system: string; user: string } {
  let system = [
    systemPrompt,
    '',
    'SECTION 1: INITIAL EVALUATION - DIFFERENTIAL DIAGNOSIS GENERATION',
    '',
    'You are generating a worst-first differential diagnosis for an Emergency Medicine encounter.',
    'This is the first section of a 3-section MDM workflow.',
    '',
    'CRITICAL REQUIREMENTS:',
    '1. Use "worst-first" EM mentality - consider life-threatening conditions first',
    '2. Generate 3-5 emergent conditions and 3-5 non-emergent conditions',
    '3. Classify urgency as: emergent (immediate threat), urgent (requires timely intervention), routine (standard workup)',
    '4. Include specific reasoning for each differential item',
    '5. Consider patient demographics, risk factors, and presenting symptoms',
    '6. NEVER fabricate information not provided - base reasoning only on given data',
    '',
    'URGENCY CLASSIFICATION GUIDE:',
    '- EMERGENT: Conditions requiring immediate intervention to prevent death/disability',
    '  Examples: STEMI, PE, aortic dissection, sepsis, stroke, ruptured AAA',
    '- URGENT: Conditions requiring timely workup/treatment within hours',
    '  Examples: appendicitis, cholecystitis, unstable angina, DVT',
    '- ROUTINE: Conditions amenable to standard ED evaluation and outpatient follow-up',
    '  Examples: GERD, musculoskeletal pain, viral syndrome, migraine',
  ].join('\n')

  // Append surveillance context with explicit instructions
  if (surveillanceContext) {
    system += [
      '',
      '',
      'REGIONAL EPIDEMIOLOGIC CONTEXT:',
      surveillanceContext,
      '',
      'SURVEILLANCE INTEGRATION INSTRUCTIONS:',
      '1. If regional data shows RISING activity for conditions relevant to this presentation, explicitly note this in the reasoning (e.g., "Regional surveillance shows rising RSV activity, increasing pre-test probability")',
      '2. If regional data shows ABSENCE or LOW activity for a differential diagnosis, note reduced pre-test probability (e.g., "No significant Lyme activity in this region, reducing pre-test probability")',
      '3. Include "Regional Surveillance Data" as a data source in your clinical reasoning',
      '4. Add a "regionalContext" field to each differential item where regional data is relevant',
    ].join('\n')
  }

  // Append CDR context with instructions
  if (cdrContext) {
    system += [
      '',
      '',
      'CLINICAL DECISION RULES CONTEXT:',
      cdrContext,
      '',
      'CDR SECTION 1 INSTRUCTIONS:',
      '1. Identify applicable clinical decision rules from the CDR reference above',
      '2. Note which data points are present and which are missing for each applicable rule',
      '3. Calculate partial scores where sufficient data exists from the initial presentation',
      '4. Include CDR analysis in differential reasoning (e.g., "HEART score components present: age >45, known HTN — partial score suggests moderate risk pending troponin")',
      '5. Add a "cdrContext" field to each differential item where a CDR informs the assessment',
    ].join('\n')
  }

  const user = [
    'INITIAL PATIENT PRESENTATION:',
    '---',
    content,
    '---',
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "differential": [',
    '    {',
    '      "diagnosis": "Condition name",',
    '      "urgency": "emergent" | "urgent" | "routine",',
    '      "reasoning": "Why this is on the differential based on presentation",',
    '      "regionalContext": "Optional: How regional surveillance data affects pre-test probability for this diagnosis",',
    '      "cdrContext": "Optional: Applicable CDR scores/results that inform this diagnosis"',
    '    }',
    '  ]',
    '}',
    '',
    'Generate the differential diagnosis array. Order by urgency (emergent first).',
    'Include 6-10 total diagnoses covering the worst-first spectrum.',
  ].join('\n')

  return { system, user }
}

/**
 * Structured test results from the S2 workup, used to enrich the S2 prompt.
 * All fields are optional for backward compatibility.
 */
export interface Section2StructuredData {
  /** Selected test IDs (e.g., "troponin", "cbc") */
  selectedTests?: string[]
  /** Test results keyed by test ID */
  testResults?: Record<string, TestResult>
  /** Working diagnosis (structured object or legacy string) */
  structuredDiagnosis?: string | WorkingDiagnosis | null
}

/**
 * Section 2: Workup & Results
 * Builds MDM preview incorporating workup data and refining the differential.
 *
 * When `structuredData` is provided, the prompt includes formatted test results
 * that give the LLM precise, structured information in addition to the free-text
 * content. This produces more accurate MDM previews.
 */
export function buildSection2Prompt(
  section1Content: string,
  section1Response: Pick<Section1Response, 'differential'>,
  section2Content: string,
  workingDiagnosis?: string,
  cdrContext?: string,
  section1CdrAnalysis?: string,
  structuredData?: Section2StructuredData
): { system: string; user: string } {
  const differentialSummary = section1Response.differential
    .map((d: DifferentialItem) => `- ${d.diagnosis} (${d.urgency}): ${d.reasoning}`)
    .join('\n')

  let system = [
    'SECTION 2: WORKUP & RESULTS - MDM PREVIEW GENERATION',
    '',
    'You are building an MDM preview that incorporates workup results into the clinical picture.',
    'This is the second section of a 3-section MDM workflow.',
    '',
    'CONTEXT FROM SECTION 1:',
    '---INITIAL PRESENTATION---',
    section1Content,
    '---DIFFERENTIAL GENERATED---',
    differentialSummary,
    '---',
    '',
    ...(section1CdrAnalysis ? [
      '=== SECTION 1 CDR ANALYSIS ===',
      section1CdrAnalysis,
      '',
    ] : []),
    'CRITICAL REQUIREMENTS:',
    '1. Incorporate all lab/imaging/EKG results into clinical reasoning',
    '2. Update differential probabilities based on workup findings',
    '3. Document clinical decision rules used (HEART, Wells, PERC, etc.)',
    '4. Generate structured MDM preview with problems, data reviewed, and reasoning',
    '5. Connect workup results to differential narrowing',
    '6. NEVER fabricate results - only include what is explicitly provided',
    '',
    'DATA REVIEW CATEGORIES:',
    '- Laboratory: CBC, BMP, troponin, lactate, etc.',
    '- Imaging: X-ray, CT, ultrasound findings',
    '- EKG: Rhythm, intervals, ST changes',
    '- Clinical Decision Rules: HEART score, Wells criteria, PERC rule, etc.',
  ].join('\n')

  // Append CDR context with S2-specific instructions
  if (cdrContext) {
    system += [
      '',
      '',
      'CLINICAL DECISION RULES CONTEXT:',
      cdrContext,
      '',
      'CDR SECTION 2 INSTRUCTIONS:',
      '1. Combine initial presentation data from Section 1 with new workup results to complete CDR calculations',
      '2. For rules with partial scores from Section 1, fill in missing components using workup data (e.g., troponin result completes HEART score)',
      '3. Calculate complete scores where all data is now available',
      '4. Apply new CDRs that become relevant based on workup findings (e.g., Wells PE if D-dimer ordered)',
      '5. Document CDR results in the "clinicalDecisionRules" section of dataReviewed',
      '6. Use CDR results to justify differential probability changes (e.g., "HEART score 3 — low risk, supports discharge pathway")',
    ].join('\n')
  }

  // Resolve working diagnosis: prefer structured → legacy string → none
  // Convert null to undefined since resolveWorkingDiagnosis accepts string | WorkingDiagnosis | undefined
  const rawStructuredDx = structuredData?.structuredDiagnosis
  const resolvedDx = resolveWorkingDiagnosis(rawStructuredDx === null ? undefined : rawStructuredDx, workingDiagnosis)
  const workingDxInstruction = resolvedDx
    ? `\nWORKING DIAGNOSIS (physician-specified): ${resolvedDx}`
    : '\nNo working diagnosis specified - derive from workup results.'

  // Build structured test results block (if available)
  const structuredResultsBlock: string[] = []
  if (structuredData?.testResults && Object.keys(structuredData.testResults).length > 0) {
    structuredResultsBlock.push('', '=== STRUCTURED TEST RESULTS ===')
    for (const [testId, result] of Object.entries(structuredData.testResults)) {
      const parts = [`- ${testId}: ${result.status.toUpperCase()}`]
      if (result.value) parts.push(`Value: ${result.value}${result.unit ? ` ${result.unit}` : ''}`)
      if (result.quickFindings && result.quickFindings.length > 0) {
        parts.push(`Findings: ${result.quickFindings.join(', ')}`)
      }
      if (result.notes) parts.push(`Notes: ${result.notes}`)
      structuredResultsBlock.push(parts.join(' | '))
    }
    // Note pending tests (ordered but no results yet)
    if (structuredData.selectedTests && structuredData.selectedTests.length > 0) {
      const resultIds = new Set(Object.keys(structuredData.testResults))
      const pendingTests = structuredData.selectedTests.filter((t) => !resultIds.has(t))
      if (pendingTests.length > 0) {
        structuredResultsBlock.push(`Pending tests (ordered but no results): ${pendingTests.join(', ')}`)
      }
    }
    structuredResultsBlock.push(
      '',
      'STRUCTURED DATA INSTRUCTIONS:',
      '1. When structured test results are provided, use them as the authoritative data source — they are more precise than free-text',
      '2. Reference specific test values and findings in the Data Reviewed section',
      '3. Cross-reference results with the differential to update probabilities',
      ''
    )
  }

  const user = [
    'WORKUP AND RESULTS:',
    '---',
    section2Content,
    '---',
    ...structuredResultsBlock,
    workingDxInstruction,
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "mdmPreview": {',
    '    "problems": [',
    '      {',
    '        "condition": "Problem name",',
    '        "classification": "Problem classification per AMA guidelines",',
    '        "status": "ruled-out" | "reduced-probability" | "confirmed" | "unchanged"',
    '      }',
    '    ],',
    '    "differential": [',
    '      {',
    '        "diagnosis": "Condition name",',
    '        "urgency": "emergent" | "urgent" | "routine",',
    '        "reasoning": "Updated reasoning based on workup",',
    '        "probability": "high" | "moderate" | "low" | "ruled-out"',
    '      }',
    '    ],',
    '    "dataReviewed": {',
    '      "laboratory": ["Test: Result - Interpretation"],',
    '      "imaging": ["Study: Findings"],',
    '      "ekg": "EKG interpretation if performed",',
    '      "clinicalDecisionRules": ["Rule name: Score/Result - Interpretation"]',
    '    },',
    '    "reasoning": "Clinical reasoning connecting workup to differential refinement"',
    '  }',
    '}',
    '',
    'Generate the MDM preview incorporating all workup data.',
  ].join('\n')

  return { system, user }
}

/**
 * Section 3: Treatment & Disposition
 * Compiles complete MDM from all sections for EHR copy-paste.
 *
 * The `structuredData` parameter provides typed S2/S3 fields (test results,
 * treatments, disposition, follow-up) that are injected into the prompt so
 * the LLM can produce a more accurate final MDM. All fields are optional
 * for backward compatibility with older encounters.
 */
export function buildFinalizePrompt(
  section1: { content: string; response: Pick<Section1Response, 'differential'> },
  section2: { content: string; response: Pick<Section2Response, 'mdmPreview'>; workingDiagnosis?: string },
  section3Content: string,
  surveillanceContext?: string,
  cdrContext?: string,
  structuredData?: FinalizeStructuredData
): { system: string; user: string } {
  const differentialSummary = section1.response.differential
    .map((d: DifferentialItem) => `- ${d.diagnosis} (${d.urgency})`)
    .join('\n')

  const mdmPreview = section2.response.mdmPreview

  // --- Build structured data sections ---
  const structuredSections: string[] = []

  // Structured test results from S2
  if (structuredData?.testResults && Object.keys(structuredData.testResults).length > 0) {
    const testLines: string[] = ['=== STRUCTURED TEST RESULTS ===']
    for (const [testId, result] of Object.entries(structuredData.testResults)) {
      const parts = [`- ${testId}: ${result.status.toUpperCase()}`]
      if (result.value) parts.push(`Value: ${result.value}${result.unit ? ` ${result.unit}` : ''}`)
      if (result.quickFindings && result.quickFindings.length > 0) {
        parts.push(`Findings: ${result.quickFindings.join(', ')}`)
      }
      if (result.notes) parts.push(`Notes: ${result.notes}`)
      testLines.push(parts.join(' | '))
    }
    if (structuredData.selectedTests && structuredData.selectedTests.length > 0) {
      const resultIds = new Set(Object.keys(structuredData.testResults))
      const pendingTests = structuredData.selectedTests.filter((t) => !resultIds.has(t))
      if (pendingTests.length > 0) {
        testLines.push(`Pending tests (ordered but no results): ${pendingTests.join(', ')}`)
      }
    }
    structuredSections.push(testLines.join('\n'), '')
  }

  // Working diagnosis (enhanced handling for structured vs legacy)
  const wdStr = resolveWorkingDiagnosis(structuredData?.workingDiagnosis, section2.workingDiagnosis)

  // Structured treatments from S3
  if (structuredData?.treatments || (structuredData?.cdrSuggestedTreatments && structuredData.cdrSuggestedTreatments.length > 0)) {
    const treatLines: string[] = ['=== STRUCTURED TREATMENT SELECTIONS ===']
    if (structuredData.treatments) {
      treatLines.push(`Free-text treatments: ${structuredData.treatments}`)
    }
    if (structuredData.cdrSuggestedTreatments && structuredData.cdrSuggestedTreatments.length > 0) {
      treatLines.push('CDR-suggested treatments selected:')
      for (const t of structuredData.cdrSuggestedTreatments) {
        // Format: "cdrId:treatment_id" → "CDR: Treatment Label"
        const colonIdx = t.indexOf(':')
        if (colonIdx > 0) {
          const cdrId = t.slice(0, colonIdx)
          const treatmentId = t.slice(colonIdx + 1)
          treatLines.push(`  - ${cdrId}: ${formatTreatmentLabel(treatmentId)}`)
        } else {
          treatLines.push(`  - ${t}`)
        }
      }
    }
    structuredSections.push(treatLines.join('\n'), '')
  }

  // Disposition and follow-up from S3
  if (structuredData?.disposition || (structuredData?.followUp && structuredData.followUp.length > 0)) {
    const dispoLines: string[] = ['=== STRUCTURED DISPOSITION & FOLLOW-UP ===']
    if (structuredData.disposition) {
      dispoLines.push(`Disposition: ${structuredData.disposition.toUpperCase()}`)
    }
    if (structuredData.followUp && structuredData.followUp.length > 0) {
      dispoLines.push(`Follow-up: ${structuredData.followUp.join('; ')}`)
    }
    structuredSections.push(dispoLines.join('\n'), '')
  }

  const system = [
    'SECTION 3: TREATMENT & DISPOSITION - FINAL MDM GENERATION',
    '',
    'You are compiling the complete Medical Decision Making documentation.',
    'This is the final section of a 3-section MDM workflow.',
    '',
    'ACCUMULATED CONTEXT:',
    '',
    '=== SECTION 1: INITIAL PRESENTATION ===',
    section1.content,
    '',
    '=== INITIAL DIFFERENTIAL ===',
    differentialSummary,
    '',
    '=== SECTION 2: WORKUP ===',
    section2.content,
    wdStr ? `Working Diagnosis: ${wdStr}` : '',
    '',
    '=== MDM PREVIEW ===',
    JSON.stringify(mdmPreview, null, 2),
    '',
    ...(structuredSections.length > 0 ? structuredSections : []),
    ...(surveillanceContext ? [
      '=== REGIONAL SURVEILLANCE DATA ===',
      surveillanceContext,
      '',
    ] : []),
    ...(cdrContext ? [
      '=== CLINICAL DECISION RULES RESULTS ===',
      cdrContext,
      '',
      'CDR FINALIZE INSTRUCTIONS:',
      '1. Include all CDR calculations and results in the final MDM text (Data Reviewed section)',
      '2. Reference specific CDR scores in Risk Assessment when they inform disposition decisions',
      '3. Note CDR results that support discharge safety (e.g., "HEART score 2 — low risk, safe for discharge with outpatient follow-up")',
      '4. Include CDR-based exclusion reasoning (e.g., "Ottawa Ankle Rules negative — imaging deferred")',
      '',
    ] : []),
    'STRUCTURED DATA INSTRUCTIONS:',
    '1. When structured test results are provided, use them as the authoritative data source for the Data Reviewed section — they are more precise than free-text',
    '2. When structured treatments are provided, document each treatment in the Treatment section with its CDR basis if applicable (e.g., "Aspirin 325mg — per HEART score protocol")',
    '3. When a structured disposition is provided, use it as the primary disposition decision and document the clinical rationale supporting it',
    '4. When follow-up instructions are provided, include them verbatim in the Disposition section',
    '5. CDR-suggested treatments should reference the specific CDR that recommended them',
    '',
    'CRITICAL REQUIREMENTS:',
    '1. Generate copy-pastable MDM text formatted for EHR documentation',
    '2. Include MDM complexity level determination (Low, Moderate, High)',
    '3. Follow standard EM MDM structure from the guide',
    '4. Include risk assessment with highest risk element identified',
    '5. Document disposition decision with clinical rationale',
    '6. Add appropriate discharge instructions if applicable',
    '7. NEVER fabricate information - use only what was provided',
    ...(surveillanceContext ? [
      '8. Include regional surveillance data sources in the Data Reviewed section (e.g., "Regional Surveillance Data: CDC Respiratory, NWSS Wastewater")',
      '9. Note any regional epidemiologic context that influenced the differential or clinical reasoning',
    ] : []),
    '',
    'MDM COMPLEXITY DETERMINATION:',
    '- HIGH: Multiple diagnoses, extensive data review, high-risk decision making',
    '- MODERATE: 2-3 diagnoses, moderate data, some risk',
    '- LOW: Single straightforward problem, minimal workup',
  ].join('\n')

  const user = [
    'TREATMENT AND DISPOSITION:',
    '---',
    section3Content,
    '---',
    '',
    'OUTPUT FORMAT (strict JSON — no wrapper object, flat string arrays):',
    '{',
    '  "text": "Complete copy-pastable MDM text following EM documentation standards",',
    '  "json": {',
    '    "problems": ["Problem 1 - classification - reasoning", ...],',
    '    "differential": ["Diagnosis 1 - reasoning", ...],',
    '    "dataReviewed": ["Lab: Result", "Imaging: Finding", "EKG: Interpretation", ...],',
    '    "reasoning": "Clinical reasoning connecting all data, working diagnosis, treatment rationale...",',
    '    "risk": ["Highest risk element", "Patient risk factor", "Disposition risk", ...],',
    '    "disposition": "Admit/Discharge/Transfer with level of care and rationale",',
    '    "complexityLevel": "low" | "moderate" | "high",',
    '    "regionalSurveillance": "Regional surveillance data sources and key findings, if available",',
    '    "clinicalDecisionRules": "CDR scores and results, if applicable"',
    '  }',
    '}',
    '',
    'Generate the complete final MDM document.',
    'The "text" field must be ready for direct copy-paste into an EHR.',
  ].join('\n')

  return { system, user }
}

/**
 * Resolve working diagnosis from structured or legacy formats.
 * Prefers structured WorkingDiagnosis.selected over legacy string.
 */
function resolveWorkingDiagnosis(
  structured?: string | WorkingDiagnosis,
  legacy?: string
): string {
  if (structured) {
    if (typeof structured === 'string') return structured
    // WorkingDiagnosis object
    return structured.custom || structured.selected || ''
  }
  return legacy || ''
}

/**
 * Convert a snake_case treatment ID to a human-readable label.
 * e.g., "aspirin_325" → "Aspirin 325", "heparin_drip" → "Heparin Drip"
 */
function formatTreatmentLabel(treatmentId: string): string {
  return treatmentId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Suggest Working Diagnosis Prompt
 * Ranks 3-5 working diagnosis options from S1 differential refined by S2 results.
 * Called by the suggest-diagnosis UI helper endpoint (no quota deduction).
 */
export function buildSuggestDiagnosisPrompt(
  differential: DifferentialItem[],
  chiefComplaint: string,
  testResultsSummary: string
): { system: string; user: string } {
  const differentialSummary = differential
    .map((d) => `- ${d.diagnosis} (${d.urgency}): ${d.reasoning}`)
    .join('\n')

  const system = [
    'WORKING DIAGNOSIS SUGGESTION',
    '',
    'You are ranking the most likely working diagnoses for an Emergency Medicine encounter.',
    'Use the Section 1 differential diagnosis refined by Section 2 workup results.',
    '',
    'RANKING CRITERIA (in priority order):',
    '1. Consistency with S2 workup results (abnormal results support certain diagnoses)',
    '2. Clinical likelihood given the overall picture',
    '3. EM worst-first mentality — dangerous diagnoses rank higher when not excluded',
    '',
    'CRITICAL RULES:',
    '1. Return ONLY a JSON array of 3-5 diagnosis strings',
    '2. Use concise, standard medical terminology for each diagnosis',
    '3. NEVER fabricate diagnoses not present in the differential',
    '4. If results rule out a differential item, do NOT include it',
    '5. Rank from most likely to least likely based on all available data',
  ].join('\n')

  const user = [
    'CHIEF COMPLAINT: ' + chiefComplaint,
    '',
    'SECTION 1 DIFFERENTIAL:',
    differentialSummary,
    '',
    'SECTION 2 WORKUP RESULTS:',
    testResultsSummary || 'No structured test results provided.',
    '',
    'OUTPUT FORMAT (strict JSON, no wrapper):',
    '["Most likely diagnosis", "Second most likely", "Third most likely"]',
    '',
    'Return 3-5 ranked working diagnosis options as a JSON string array.',
  ].join('\n')

  return { system, user }
}

/**
 * Parse Pasted Lab Results Prompt
 * Extracts structured test results from raw EHR/lab text and maps them
 * to the physician's ordered test list. Called by the parse-results UI helper.
 */
export function buildParseResultsPrompt(
  pastedText: string,
  orderedTests: Pick<TestDefinition, 'id' | 'name' | 'unit' | 'normalRange'>[]
): { system: string; user: string } {
  const testList = orderedTests
    .map((t) => {
      const parts = [`- "${t.id}" (${t.name})`]
      if (t.unit) parts.push(`unit: ${t.unit}`)
      if (t.normalRange) parts.push(`normal: ${t.normalRange}`)
      return parts.join(', ')
    })
    .join('\n')

  const system = [
    'LAB RESULTS PARSING',
    '',
    'You are extracting structured test results from raw lab/EHR text pasted by a physician.',
    'Map each extracted result to the ordered test list below.',
    '',
    'ORDERED TESTS (only map to these — do NOT invent new tests):',
    testList,
    '',
    'EXTRACTION RULES:',
    '1. Only extract results that match an ordered test from the list above',
    '2. Determine status based on normalRange: if value is within normal range → "unremarkable", otherwise → "abnormal"',
    '3. If no normalRange is available, mark abnormal only if the text explicitly says "abnormal", "high", "low", "elevated", "positive", or similar',
    '4. Extract the numeric or text value if present',
    '5. Include the unit if present in the text (use the test definition unit as fallback)',
    '6. Include brief notes for abnormal results describing the finding',
    '7. Collect any text fragments that could not be mapped to ordered tests in "unmatchedText"',
    '8. NEVER fabricate values — only extract what is explicitly in the text',
    '9. For imaging results: "normal" / "no acute findings" → unremarkable; any positive findings → abnormal',
    '10. For EKG: "normal sinus rhythm" / "NSR" → unremarkable; any ST changes, arrhythmia → abnormal',
  ].join('\n')

  const user = [
    'PASTED LAB/EHR TEXT:',
    '---',
    pastedText,
    '---',
    '',
    'OUTPUT FORMAT (strict JSON, no wrapper):',
    '{',
    '  "parsed": [',
    '    {',
    '      "testId": "test_id_from_ordered_list",',
    '      "testName": "Display name",',
    '      "status": "unremarkable" | "abnormal",',
    '      "value": "extracted value (optional)",',
    '      "unit": "unit (optional)",',
    '      "notes": "brief note for abnormal results (optional)"',
    '    }',
    '  ],',
    '  "unmatchedText": ["text that could not be mapped (optional)"]',
    '}',
    '',
    'Extract all results from the pasted text that match ordered tests.',
    'If NO results match any ordered test, return { "parsed": [], "unmatchedText": ["entire text"] }.',
  ].join('\n')

  return { system, user }
}

/**
 * CDR Auto-Population Prompt
 * Extracts component values from S1 narrative for matched CDRs.
 * Only targets section1-sourced and user_input-sourced components.
 */
export function buildCdrAutoPopulatePrompt(
  narrative: string,
  matchedCdrs: CdrDefinition[]
): { system: string; user: string } {
  // Build component extraction targets
  const targets = matchedCdrs.map((cdr) => {
    const extractableComponents = cdr.components
      .filter((c) => c.source === 'section1' || c.source === 'user_input')
      .map((c) => {
        const optionsList = c.options
          ? c.options.map((o) => `${o.label} (value: ${o.value})`).join(', ')
          : c.type === 'boolean'
            ? `Present (value: ${c.value ?? 1}), Absent (value: 0)`
            : `numeric value`
        return `    - "${c.id}" (${c.label}): ${optionsList}`
      })

    if (extractableComponents.length === 0) return null

    return [
      `  "${cdr.id}" (${cdr.name}):`,
      ...extractableComponents,
    ].join('\n')
  }).filter(Boolean)

  if (targets.length === 0) {
    // No extractable components — should not call Gemini
    return { system: '', user: '' }
  }

  const system = [
    'CDR COMPONENT AUTO-POPULATION',
    '',
    'You are extracting clinical data from an Emergency Medicine patient narrative',
    'to auto-populate Clinical Decision Rule (CDR) scoring components.',
    '',
    'CRITICAL RULES:',
    '1. Only extract data EXPLICITLY stated in the narrative — NEVER infer or assume',
    '2. If a data point is not clearly stated, do NOT include it in the output',
    '3. Return ONLY the JSON object, no explanations',
    '4. Use the exact component IDs and value numbers provided below',
    '5. For select-type components, choose the option whose label best matches the narrative data',
    '6. For boolean components, return the specified point value if the condition is present, 0 if absent',
    '',
    'TARGET CDRs AND COMPONENTS:',
    ...targets,
  ].join('\n')

  const user = [
    'PATIENT NARRATIVE:',
    '---',
    narrative,
    '---',
    '',
    'OUTPUT FORMAT (strict JSON, no wrapper):',
    '{',
    '  "cdrId": {',
    '    "componentId": { "value": <number> }',
    '  }',
    '}',
    '',
    'Extract ONLY components with clear data in the narrative.',
    'Omit any component where the data is ambiguous or absent.',
  ].join('\n')

  return { system, user }
}
