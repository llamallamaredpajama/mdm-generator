/**
 * Prompt Augmenter — builds concise surveillance context blocks
 * for insertion into LLM prompts.
 *
 * Target budget: 200-400 tokens (~800-1600 chars), hard cap at 500 tokens (~2000 chars).
 */

import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert, DataSourceSummary } from './types'

const MAX_CHARS = 2000

/**
 * Build a concise, plain-text surveillance context block from a
 * TrendAnalysisResult for inclusion in an LLM prompt.
 *
 * When `differential` is provided, also includes low/background findings
 * that match differential diagnoses, with explicit "not active" language.
 * This enables the LLM to note reduced pre-test probability for conditions
 * without regional activity.
 *
 * Returns an empty string only when input is null.
 */
export function buildSurveillanceContext(
  analysis: TrendAnalysisResult | null,
  differential?: string[],
): string {
  if (!analysis) return ''

  const significantFindings = analysis.rankedFindings.filter(
    (f) => f.tier === 'high' || f.tier === 'moderate',
  )

  const actionableAlerts = analysis.alerts.filter(
    (a) => a.level === 'critical' || a.level === 'warning',
  )

  // Find low/background findings that match conditions on the differential
  const absenceFindings = differential && differential.length > 0
    ? analysis.rankedFindings.filter((f) => {
        if (f.tier === 'high' || f.tier === 'moderate') return false
        const conditionLower = f.condition.toLowerCase()
        return differential.some((dx) => {
          const dxLower = dx.toLowerCase()
          return conditionLower.includes(dxLower) || dxLower.includes(conditionLower)
        })
      })
    : []

  // If no significant activity AND no absence data relevant to the differential,
  // still return a summary indicating the region was checked
  const hasContent = significantFindings.length > 0 || actionableAlerts.length > 0 || absenceFindings.length > 0

  const parts: string[] = []

  // Header
  parts.push(`Regional Surveillance Summary (${analysis.regionLabel}):`)
  parts.push('')

  // Active findings section
  if (significantFindings.length > 0) {
    parts.push('Active Conditions:')
    for (const f of significantFindings) {
      parts.push(`- ${formatFinding(f)}`)
    }
    parts.push('')
  }

  // Absence/low-activity section for differential-matched conditions
  if (absenceFindings.length > 0) {
    parts.push('Conditions Not Significantly Active in This Region:')
    for (const f of absenceFindings) {
      parts.push(`- ${formatAbsenceFinding(f)}`)
    }
    parts.push('')
  }

  // Alerts section
  if (actionableAlerts.length > 0) {
    parts.push('Alerts:')
    for (const a of actionableAlerts) {
      parts.push(`- ${formatAlert(a)}`)
    }
    parts.push('')
  }

  // If no findings at all, note that the region was queried with no signals
  if (!hasContent) {
    parts.push('No significant regional surveillance signals detected for the given clinical presentation.')
    parts.push('')
  }

  // Data Sources Reviewed subsection (per-source detail for LLM)
  if (analysis.dataSourceSummaries && analysis.dataSourceSummaries.length > 0) {
    parts.push('Data Sources Reviewed:')
    for (const ds of analysis.dataSourceSummaries) {
      if (ds.status === 'error') {
        parts.push(`- ${ds.label}: Data unavailable (query error)`)
      } else if (ds.status === 'not_queried') {
        parts.push(`- ${ds.label}: Not queried (no relevant syndromes)`)
      } else if (ds.status === 'no_data') {
        parts.push(`- ${ds.label}: No significant activity`)
      } else if (ds.highlights.length > 0) {
        parts.push(`- ${ds.label}: ${ds.highlights.join('; ')}`)
      } else {
        parts.push(`- ${ds.label}: No significant activity`)
      }
    }
    parts.push('')
  }

  // Data sources footer
  if (analysis.dataSourcesQueried.length > 0) {
    parts.push(`Data sources: ${analysis.dataSourcesQueried.join(', ')}`)
  }

  let output = parts.join('\n')

  // Enforce hard character cap by truncating findings if needed
  if (output.length > MAX_CHARS) {
    output = truncateToLimit(output, analysis)
  }

  return output
}

/** Format a single ClinicalCorrelation finding into a one-liner. */
function formatFinding(f: ClinicalCorrelation): string {
  const tierLabel = f.tier.toUpperCase()
  const trendDesc = formatTrend(f.trendDirection, f.trendMagnitude)
  return `${f.condition}: ${trendDesc}, ${tierLabel} relevance. ${f.summary}`
}

/** Format a low/background finding with explicit absence language. */
function formatAbsenceFinding(f: ClinicalCorrelation): string {
  if (f.tier === 'background') {
    return `${f.condition}: Below background levels — no significant regional activity. Consider reduced pre-test probability.`
  }
  // tier === 'low'
  return `${f.condition}: Low regional activity (${f.trendDirection}). No significant outbreak signals detected.`
}

/** Describe the trend direction with optional magnitude. */
function formatTrend(direction: string, magnitude?: number): string {
  const magnitudeStr = magnitude != null && magnitude > 0 ? ` (~${magnitude}% increase)` : ''

  switch (direction) {
    case 'rising':
      return `Rising${magnitudeStr}`
    case 'falling':
      return `Falling${magnitude != null && magnitude > 0 ? ` (~${magnitude}% decrease)` : ''}`
    case 'stable':
      return 'Stable activity'
    default:
      return 'Unknown trend'
  }
}

/** Format a TrendAlert into a bracketed one-liner. */
function formatAlert(a: TrendAlert): string {
  return `[${a.level.toUpperCase()}] ${a.description}`
}

/**
 * Re-build the output with fewer findings until it fits within MAX_CHARS.
 * Prioritises high-tier findings over moderate, keeps all actionable alerts.
 */
function truncateToLimit(
  _current: string,
  analysis: TrendAnalysisResult,
): string {
  const actionableAlerts = analysis.alerts.filter(
    (a) => a.level === 'critical' || a.level === 'warning',
  )

  // Start with high-tier only, then progressively trim
  const highOnly = analysis.rankedFindings.filter((f) => f.tier === 'high')
  let findings = highOnly

  // If still too long, limit to first 5 high findings
  for (let limit = findings.length; limit >= 1; limit--) {
    const candidate = buildOutput(
      analysis.regionLabel,
      findings.slice(0, limit),
      actionableAlerts,
      analysis.dataSourcesQueried,
    )
    if (candidate.length <= MAX_CHARS) return candidate
  }

  // Last resort: alerts and sources only
  return buildOutput(
    analysis.regionLabel,
    [],
    actionableAlerts,
    analysis.dataSourcesQueried,
  )
}

/**
 * Build a compact surveillance attestation line from the context string.
 * Extracts per-source highlights when available.
 */
function buildSurveillanceAttestationLine(surveillanceContext: string): string {
  // Try to extract per-source details from "Data Sources Reviewed:" subsection
  const dsMatch = surveillanceContext.match(/Data Sources Reviewed:\n([\s\S]*?)(?:\n\n|Data sources:|\n$|$)/)
  if (dsMatch) {
    const sourceLines = dsMatch[1]
      .split('\n')
      .map((l) => l.replace(/^-\s*/, '').trim())
      .filter(Boolean)
    if (sourceLines.length > 0) {
      return `- Regional Surveillance Data: ${sourceLines.join('; ')}`
    }
  }
  // Fallback: use plain sources list
  const sourcesMatch = surveillanceContext.match(/Data sources:\s*(.+)/i)
  const sources = sourcesMatch?.[1]?.trim() || 'CDC Respiratory, NWSS Wastewater, CDC NNDSS'
  return `- Regional Surveillance Data (${sources})`
}

/**
 * Append surveillance data source information to the MDM text output.
 * Inserts within the "Data reviewed" / "DATA REVIEWED" section if found,
 * otherwise falls back to inserting before RISK.
 */
export function appendSurveillanceToMdmText(mdmText: string, surveillanceContext: string): string {
  const insertion = buildSurveillanceAttestationLine(surveillanceContext)

  // Strategy 1: Insert at end of "Data reviewed" section (before the next section header)
  const dataReviewedMatch = mdmText.match(/\n(DATA REVIEWED|Data [Rr]eviewed|Data Ordered\/Reviewed)[^\n]*/i)
  if (dataReviewedMatch && dataReviewedMatch.index != null) {
    // Find the next major section header after "Data reviewed"
    const afterDataReviewed = dataReviewedMatch.index + dataReviewedMatch[0].length
    const nextSectionMatch = mdmText.slice(afterDataReviewed).search(/\n(?:RISK|Risk Assessment|ASSESSMENT|DISPOSITION|CLINICAL DECISION|DECISION MAKING)/i)

    if (nextSectionMatch > 0) {
      const insertPos = afterDataReviewed + nextSectionMatch
      return mdmText.slice(0, insertPos) + '\n' + insertion + mdmText.slice(insertPos)
    }
  }

  // Strategy 2: Fallback — insert before RISK section
  const riskIdx = mdmText.search(/\n(RISK|Risk Assessment)/i)
  if (riskIdx > 0) {
    return mdmText.slice(0, riskIdx) + '\n' + insertion + '\n' + mdmText.slice(riskIdx)
  }

  // Strategy 3: Append at end
  return mdmText + '\n' + insertion
}

/** Assemble the final plain-text block from pre-filtered parts. */
function buildOutput(
  regionLabel: string,
  findings: ClinicalCorrelation[],
  alerts: TrendAlert[],
  sources: string[],
): string {
  const parts: string[] = []

  parts.push(`Regional Surveillance Summary (${regionLabel}):`)
  parts.push('')

  if (findings.length > 0) {
    parts.push('Active Conditions:')
    for (const f of findings) {
      parts.push(`- ${formatFinding(f)}`)
    }
    parts.push('')
  }

  if (alerts.length > 0) {
    parts.push('Alerts:')
    for (const a of alerts) {
      parts.push(`- ${formatAlert(a)}`)
    }
    parts.push('')
  }

  if (sources.length > 0) {
    parts.push(`Data sources: ${sources.join(', ')}`)
  }

  return parts.join('\n')
}
