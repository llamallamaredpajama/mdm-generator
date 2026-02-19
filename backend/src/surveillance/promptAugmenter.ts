/**
 * Prompt Augmenter — builds concise surveillance context blocks
 * for insertion into LLM prompts.
 *
 * Target budget: 200-400 tokens (~800-1600 chars), hard cap at 500 tokens (~2000 chars).
 */

import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert } from './types'

const MAX_CHARS = 2000

/**
 * Build a concise, plain-text surveillance context block from a
 * TrendAnalysisResult for inclusion in an LLM prompt.
 *
 * Returns an empty string when there is nothing clinically significant
 * to report (null input, no high/moderate findings, etc.).
 */
export function buildSurveillanceContext(analysis: TrendAnalysisResult | null): string {
  if (!analysis) return ''

  const significantFindings = analysis.rankedFindings.filter(
    (f) => f.tier === 'high' || f.tier === 'moderate',
  )

  const actionableAlerts = analysis.alerts.filter(
    (a) => a.level === 'critical' || a.level === 'warning',
  )

  // Nothing useful to inject into the prompt
  if (significantFindings.length === 0 && actionableAlerts.length === 0) return ''

  const parts: string[] = []

  // Header
  parts.push(`Regional Surveillance Summary (${analysis.regionLabel}):`)
  parts.push('')

  // Findings section
  if (significantFindings.length > 0) {
    parts.push('Active Conditions:')
    for (const f of significantFindings) {
      parts.push(`- ${formatFinding(f)}`)
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
