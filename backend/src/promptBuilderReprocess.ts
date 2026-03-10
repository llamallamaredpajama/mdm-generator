/**
 * Reprocess Prompt Builder
 *
 * Builds prompts for MDM reprocessing with confirmed gap responses.
 * Used by both Build Mode and Quick Mode reprocess endpoints.
 */

import fs from 'node:fs'
import path from 'node:path'

interface BuildModeReprocessInput {
  section1Content: string
  section2Content: string
  section3Content: string
  originalMdmText: string
  gapResponses: Record<string, Record<string, boolean>>
  surveillanceContext?: string
  cdrContext?: string
}

interface QuickModeReprocessInput {
  narrative: string
  originalMdmText: string
  gapResponses: Record<string, Record<string, boolean>>
  surveillanceContext?: string
  cdrContext?: string
}

interface PromptParts {
  system: string
  user: string
}

function formatGapResponses(gapResponses: Record<string, Record<string, boolean>>): string {
  const lines: string[] = []
  for (const [gapId, toggles] of Object.entries(gapResponses)) {
    const toggleLines = Object.entries(toggles)
      .map(([toggleId, value]) => `  - ${toggleId}: ${value ? 'YES' : 'NO'}`)
      .join('\n')
    lines.push(`${gapId}:\n${toggleLines}`)
  }
  return lines.length > 0 ? lines.join('\n\n') : 'No gap responses provided.'
}

const REPROCESS_SYSTEM = [
  'You are an Emergency Medicine MDM documentation specialist.',
  'You are REPROCESSING an existing MDM to incorporate additional documentation the physician has confirmed.',
  '',
  'CRITICAL RULES:',
  '1. Start from the original MDM text and ENHANCE it — do not rewrite from scratch',
  '2. For each confirmed gap (YES responses), weave the information naturally into the appropriate MDM section',
  '3. For declined gaps (NO responses), do not modify those areas',
  '4. Maintain the same structure, formatting, and voice as the original',
  '5. The output must remain copy-pastable for EHR',
  '6. Do NOT include a gaps array in the output — this is a one-time enhancement',
  '7. Do NOT fabricate clinical details — only add documentation scaffolding for confirmed items',
  '',
  'HOW TO INCORPORATE CONFIRMED GAPS:',
  '- independent_historian: Add "History obtained from [EMS/family/facility] who reports [...]" to appropriate section',
  '- shared_decision_making: Add shared decision-making paragraph to Clinical Reasoning section',
  '- risk_benefit_discussion: Add risk-benefit documentation to the relevant treatment/procedure section',
  '- independent_imaging_interpretation: Add "My independent interpretation of [imaging]: [...]" to Data Reviewed',
  '- reassessment_documentation: Add reassessment findings to treatment response section',
  '- For other gap IDs: Add appropriate documentation scaffolding with placeholder brackets for details the physician will fill in',
].join('\n')

export function buildBuildModeReprocessPrompt(input: BuildModeReprocessInput): PromptParts {
  let system = REPROCESS_SYSTEM
  if (input.surveillanceContext) {
    system += '\n\nREGIONAL SURVEILLANCE CONTEXT:\n' + input.surveillanceContext
  }
  if (input.cdrContext) {
    system += '\n\nCLINICAL DECISION RULE CONTEXT:\n' + input.cdrContext
  }

  // Load S3 guide for reference
  try {
    const guidePath = path.join(__dirname, '..', '..', 'docs', 'mdm-gen-guide-build-s3.md')
    const guideText = fs.readFileSync(guidePath, 'utf-8')
    system += '\n\nMDM TEMPLATE REFERENCE:\n' + guideText
  } catch {
    // Guide not found — proceed without it
  }

  const user = [
    'ORIGINAL PHYSICIAN INPUT:',
    '',
    'Section 1 (Initial Evaluation):',
    input.section1Content,
    '',
    'Section 2 (Workup & Results):',
    input.section2Content,
    '',
    'Section 3 (Treatment & Disposition):',
    input.section3Content,
    '',
    '---',
    '',
    'ORIGINAL MDM OUTPUT:',
    input.originalMdmText,
    '',
    '---',
    '',
    'CONFIRMED DOCUMENTATION ADDITIONS:',
    formatGapResponses(input.gapResponses),
    '',
    '---',
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "text": "Enhanced copy-pastable MDM text with confirmed gaps incorporated",',
    '  "json": {',
    '    "problems": ["..."],',
    '    "differential": ["..."],',
    '    "dataReviewed": ["..."],',
    '    "reasoning": "...",',
    '    "risk": ["..."],',
    '    "disposition": "...",',
    '    "complexityLevel": "low" | "moderate" | "high"',
    '  }',
    '}',
    '',
    'Enhance the MDM by incorporating the confirmed documentation additions.',
    'Do NOT include a gaps array — this is a one-time reprocessing.',
  ].join('\n')

  return { system, user }
}

export function buildQuickModeReprocessPrompt(input: QuickModeReprocessInput): PromptParts {
  let system = REPROCESS_SYSTEM
  if (input.surveillanceContext) {
    system += '\n\nREGIONAL SURVEILLANCE CONTEXT:\n' + input.surveillanceContext
  }
  if (input.cdrContext) {
    system += '\n\nCLINICAL DECISION RULE CONTEXT:\n' + input.cdrContext
  }

  // Load v2 guide for reference
  try {
    const guidePath = path.join(__dirname, '..', '..', 'docs', 'mdm-gen-guide-v2.md')
    const guideText = fs.readFileSync(guidePath, 'utf-8')
    system += '\n\nMDM GUIDE REFERENCE:\n' + guideText
  } catch {
    // Guide not found — proceed without it
  }

  const user = [
    'ORIGINAL PHYSICIAN NARRATIVE:',
    input.narrative,
    '',
    '---',
    '',
    'ORIGINAL MDM OUTPUT:',
    input.originalMdmText,
    '',
    '---',
    '',
    'CONFIRMED DOCUMENTATION ADDITIONS:',
    formatGapResponses(input.gapResponses),
    '',
    '---',
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "text": "Enhanced copy-pastable MDM text with confirmed gaps incorporated",',
    '  "json": {',
    '    "problems": ["..."],',
    '    "differential": ["..."],',
    '    "dataReviewed": ["..."],',
    '    "reasoning": "...",',
    '    "risk": ["..."],',
    '    "disposition": "...",',
    '    "complexityLevel": "low" | "moderate" | "high"',
    '  }',
    '}',
    '',
    'Enhance the MDM by incorporating the confirmed documentation additions.',
    'Do NOT include a gaps array — this is a one-time reprocessing.',
  ].join('\n')

  return { system, user }
}
