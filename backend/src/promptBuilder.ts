import fs from 'node:fs/promises'
import path from 'node:path'

export type PromptParts = {
  system: string
  user: string
}

export async function buildPrompt(narrative: string): Promise<PromptParts> {
  const guidePath = path.join(__dirname, '../../docs/mdm-gen-guide-v2.md')
  const guide = await fs.readFile(guidePath, 'utf8')

  const system = [
    'You are an assistant that generates Emergency Medicine Medical Decision Making (MDM) drafts.',
    'Requirements:',
    '- Worst-first reasoning: explicitly address dangerous diagnoses and red flags when appropriate.',
    '- High-complexity orientation: include data review/ordering and risk when clinically supported.',
    '- No fabrication of facts. If the narrative lacks info, state conservative defaults (e.g., labs/imaging/consults considered but not indicated) and explain reasoning briefly.',
    '- Educational draft only. The physician must review and is responsible for accuracy.',
    '',
    'Use the following guide to structure the output and ensure completeness:',
    '--- GUIDE START ---',
    guide,
    '--- GUIDE END ---',
  ].join('\n')

  const user = [
    'NARRATIVE (physician-provided; do not assume facts not stated):',
    narrative,
    '',
    'OUTPUT FORMAT INSTRUCTIONS:',
    '- Return a strict JSON object with keys: differential, data_reviewed_ordered, decision_making, risk, disposition, disclaimers.',
    "- Each key should contain strings or arrays of strings as appropriate; avoid placeholders like 'TBD'.",
    "- After the JSON, include a delimiter line: '---TEXT---' and then a copy-pastable plain-text rendering of the MDM.",
  ].join('\n')

  return { system, user }
}
