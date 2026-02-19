/**
 * Build Mode Prompt Builders
 *
 * Section-specific prompt construction for the 3-section guided MDM workflow.
 * Each function builds prompts that generate structured output for their section.
 */

import type { DifferentialItem, MdmPreview, Section1Response, Section2Response } from './buildModeSchemas'

/**
 * Section 1: Initial Evaluation
 * Generates worst-first differential diagnosis from patient presentation.
 */
export function buildSection1Prompt(
  content: string,
  systemPrompt: string,
  surveillanceContext?: string
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

  // Append surveillance context if provided
  if (surveillanceContext) {
    system += `\n\nREGIONAL EPIDEMIOLOGIC CONTEXT:\n${surveillanceContext}\nConsider regionally active conditions when building the differential.`
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
    '      "reasoning": "Why this is on the differential based on presentation"',
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
 * Section 2: Workup & Results
 * Builds MDM preview incorporating workup data and refining the differential.
 */
export function buildSection2Prompt(
  section1Content: string,
  section1Response: Pick<Section1Response, 'differential'>,
  section2Content: string,
  workingDiagnosis?: string
): { system: string; user: string } {
  const differentialSummary = section1Response.differential
    .map((d: DifferentialItem) => `- ${d.diagnosis} (${d.urgency}): ${d.reasoning}`)
    .join('\n')

  const system = [
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

  const workingDxInstruction = workingDiagnosis
    ? `\nWORKING DIAGNOSIS (physician-specified): ${workingDiagnosis}`
    : '\nNo working diagnosis specified - derive from workup results.'

  const user = [
    'WORKUP AND RESULTS:',
    '---',
    section2Content,
    '---',
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
 */
export function buildFinalizePrompt(
  section1: { content: string; response: Pick<Section1Response, 'differential'> },
  section2: { content: string; response: Pick<Section2Response, 'mdmPreview'>; workingDiagnosis?: string },
  section3Content: string
): { system: string; user: string } {
  const differentialSummary = section1.response.differential
    .map((d: DifferentialItem) => `- ${d.diagnosis} (${d.urgency})`)
    .join('\n')

  const mdmPreview = section2.response.mdmPreview

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
    section2.workingDiagnosis ? `Working Diagnosis: ${section2.workingDiagnosis}` : '',
    '',
    '=== MDM PREVIEW ===',
    JSON.stringify(mdmPreview, null, 2),
    '',
    'CRITICAL REQUIREMENTS:',
    '1. Generate copy-pastable MDM text formatted for EHR documentation',
    '2. Include MDM complexity level determination (Low, Moderate, High)',
    '3. Follow standard EM MDM structure from the guide',
    '4. Include risk assessment with highest risk element identified',
    '5. Document disposition decision with clinical rationale',
    '6. Add appropriate discharge instructions if applicable',
    '7. NEVER fabricate information - use only what was provided',
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
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "finalMdm": {',
    '    "complexityLevel": "High" | "Moderate" | "Low",',
    '    "text": "Complete copy-pastable MDM text following EM documentation standards",',
    '    "json": {',
    '      "summary": "Brief MDM summary statement",',
    '      "problemsAddressed": [{ "condition": "...", "classification": "...", "reasoning": "..." }],',
    '      "dataReviewedOrdered": {',
    '        "laboratory": [...],',
    '        "imaging": [...],',
    '        "ekg": "...",',
    '        "externalRecords": "...",',
    '        "independentInterpretation": [...]',
    '      },',
    '      "riskAssessment": {',
    '        "highestRiskElement": "...",',
    '        "patientFactors": [...],',
    '        "diagnosticRisks": [...],',
    '        "treatmentRisks": [...],',
    '        "dispositionRisks": [...]',
    '      },',
    '      "clinicalReasoning": "...",',
    '      "workingDiagnosis": "...",',
    '      "treatment": {',
    '        "medications": [...],',
    '        "procedures": [...],',
    '        "responseToTreatment": "..."',
    '      },',
    '      "disposition": {',
    '        "decision": "Admit/Discharge/Transfer",',
    '        "levelOfCare": "...",',
    '        "rationale": "...",',
    '        "dischargeInstructions": {...} // if applicable',
    '      },',
    '      "disclaimers": "Educational draft. Physician must review."',
    '    }',
    '  }',
    '}',
    '',
    'Generate the complete final MDM document.',
    'The "text" field must be ready for direct copy-paste into an EHR.',
  ].join('\n')

  return { system, user }
}
