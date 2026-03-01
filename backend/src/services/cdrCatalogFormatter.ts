import type { CdrSearchResult } from './cdrCatalogSearch'

const MAX_CHARS = 12000
const STRUCTURED_LIMIT = 10

export function formatCdrContext(results: CdrSearchResult[]): string {
  if (results.length === 0) return ''

  // Tier 1: Compact index of ALL matched CDRs
  const indexLine = results
    .map(r => `${r.cdr.id}|${r.cdr.name}|${r.cdr.category || 'GENERAL'}`)
    .join(', ')

  const sections: string[] = [
    'Matched CDR Index:',
    indexLine,
    '',
    'Applicable Rule Definitions:',
  ]

  // Tier 2: Structured definitions for top N
  const topResults = results.slice(0, STRUCTURED_LIMIT)
  for (const { cdr } of topResults) {
    const defLines: string[] = []
    defLines.push(`--- ${cdr.name} (${cdr.category || 'GENERAL'}) ---`)
    if (cdr.application) defLines.push(`Application: ${cdr.application}`)

    // Components summary
    if (cdr.components.length > 0) {
      const compStr = cdr.components.map(c => {
        if (c.options?.length) {
          const range = `${c.options[0].value}-${c.options[c.options.length - 1].value}`
          return `${c.label}(${range})`
        }
        return c.label
      }).join(', ')
      defLines.push(`Components: ${compStr}`)
    }

    // Scoring summary
    const { method, ranges } = cdr.scoring
    const rangeStr = ranges.map(r => `${r.min}-${r.max} ${r.risk}`).join(', ')
    defLines.push(`Scoring: ${method}. ${rangeStr}`)

    // Required tests
    if (cdr.requiredTests?.length) {
      defLines.push(`Required tests: ${cdr.requiredTests.join(', ')}`)
    }

    sections.push(defLines.join('\n'))
    sections.push('')
  }

  let output = sections.join('\n')
  if (output.length > MAX_CHARS) {
    output = output.slice(0, MAX_CHARS)
  }
  return output.trim()
}
