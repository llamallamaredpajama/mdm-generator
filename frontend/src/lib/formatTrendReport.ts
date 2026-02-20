import type { TrendAnalysisResult, TrendFinding } from '../types/surveillance'

const TREND_LABELS: Record<string, string> = {
  rising: 'Rising',
  falling: 'Falling',
  stable: 'Stable',
  unknown: 'Unknown',
}

function formatFinding(f: TrendFinding): string {
  const trend = TREND_LABELS[f.trendDirection] || f.trendDirection
  const magnitude = f.trendMagnitude != null ? ` (~${f.trendMagnitude.toFixed(1)}%)` : ''
  return `- ${f.condition} [${f.tier.toUpperCase()}]: ${trend}${magnitude}. ${f.summary}`
}

export function formatTrendReport(analysis: TrendAnalysisResult): string {
  const date = new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const lines: string[] = [
    `REGIONAL ED SURVEILLANCE TREND ANALYSIS`,
    `Region: ${analysis.regionLabel}`,
    `Date: ${date}`,
    '',
  ]

  // Summary
  if (analysis.summary) {
    lines.push(analysis.summary, '')
  }

  // Alerts
  if (analysis.alerts.length > 0) {
    lines.push('ALERTS:')
    for (const a of analysis.alerts) {
      lines.push(`  [${a.level.toUpperCase()}] ${a.title}: ${a.description}`)
    }
    lines.push('')
  }

  // Findings
  if (analysis.rankedFindings.length > 0) {
    lines.push('FINDINGS:')
    for (const f of analysis.rankedFindings) {
      lines.push(formatFinding(f))
    }
    lines.push('')
  }

  // Attribution
  lines.push(`Data sources: ${analysis.dataSourcesQueried.join(', ')}`)
  lines.push('')
  lines.push('This surveillance data is supplementary. Clinical judgment must guide all decisions.')

  return lines.join('\n')
}
