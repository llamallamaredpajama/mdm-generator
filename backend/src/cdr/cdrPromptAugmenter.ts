/**
 * CDR Prompt Augmenter — builds clinical decision rule context blocks
 * for injection into LLM prompts.
 *
 * Mirrors the pattern used by surveillance/promptAugmenter.ts.
 * Budget: ~4K tokens (~16 000 chars) for rule definitions.
 */

import { getCdrIndex, type CdrRule } from './cdrLoader'

const MAX_CDR_CHARS = 16000

/**
 * Build a structured CDR context string for inclusion in an LLM prompt.
 *
 * Always includes the compact CDR catalog index so the LLM knows the
 * full rule set. Appends full definitions for each selected rule,
 * dropping lowest-priority rules when the token budget is exceeded.
 *
 * Pure function — no side effects, no async.
 */
export function buildCdrContext(selectedRules: CdrRule[]): string {
  const index = getCdrIndex()
  if (!index) return ''

  const parts: string[] = []

  parts.push('CLINICAL DECISION RULES REFERENCE:')
  parts.push('')
  parts.push('Available CDR Catalog:')
  parts.push(index)
  parts.push('')

  // Filter to rules that actually have full text
  const rulesWithText = selectedRules.filter((r) => r.fullText?.trim())

  if (rulesWithText.length === 0) {
    parts.push(
      'No specific CDRs matched this presentation. Review the catalog above and apply any relevant rules based on clinical judgment.',
    )
    return parts.join('\n')
  }

  parts.push('Applicable Rules for This Encounter:')
  parts.push('')

  // Build rule blocks, respecting token budget.
  // Rules arrive pre-sorted by keyword match count (highest first),
  // so we drop from the end when over budget.
  const headerText = parts.join('\n')
  const instructionsText = buildInstructions()
  let remainingBudget = MAX_CDR_CHARS - headerText.length - instructionsText.length

  const includedBlocks: string[] = []

  for (const rule of rulesWithText) {
    const block = formatRuleBlock(rule)
    if (block.length <= remainingBudget) {
      includedBlocks.push(block)
      remainingBudget -= block.length
    }
    // Once over budget, skip remaining (lower-priority) rules
  }

  parts.push(includedBlocks.join('\n'))
  parts.push('')
  parts.push(instructionsText)

  return parts.join('\n')
}

/** Format a single rule's full definition block. */
function formatRuleBlock(rule: CdrRule): string {
  const lines: string[] = []
  lines.push(`--- ${rule.name} (${rule.category}) ---`)
  lines.push(rule.fullText)
  lines.push('')
  return lines.join('\n')
}

/** Static CDR integration instructions appended to every context block. */
function buildInstructions(): string {
  return [
    'CDR INTEGRATION INSTRUCTIONS:',
    '1. For each applicable CDR above, determine if the patient presentation meets the rule\'s prerequisites/applicability criteria',
    '2. If applicable: identify which data points are present and which are missing from the narrative',
    '3. Calculate partial or complete scores where sufficient data exists',
    '4. State the score interpretation and clinical implication',
    '5. Note specifically which data points are missing that would be needed for complete calculation',
    '6. If a rule\'s prerequisites are NOT met, briefly state why it does not apply',
  ].join('\n')
}
