/**
 * Analytics Insights Prompt Builder
 *
 * Generates prompts for LLM-powered analysis of physician documentation gap patterns.
 * Used by the Analytics Dashboard to provide actionable coaching insights.
 */

/**
 * Build a prompt for generating documentation gap insights from tally data.
 */
export function buildAnalyticsInsightsPrompt(
  tallies: Record<string, number>,
  meta: Record<string, { category: string; method: string }>
): { system: string; user: string } {
  const system = `You are an Emergency Medicine documentation coach analyzing gap patterns in Medical Decision Making (MDM) documentation.

Your role is to identify actionable patterns in a physician's documentation gaps and provide specific, constructive advice to improve their MDM documentation quality and compliance.

Guidelines:
- Focus on the most frequently occurring gaps first
- Group related gaps by category when possible
- Provide concrete, actionable suggestions (not vague advice)
- Use an encouraging, collegial tone — you are coaching a peer
- Reference EM-specific documentation best practices
- Keep your analysis concise and practical
- Never reference specific patient cases or PHI
- Focus on documentation patterns, not clinical judgment`

  const gapEntries = Object.entries(tallies)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => {
      const gapMeta = meta[id]
      return {
        id,
        count,
        category: gapMeta?.category ?? 'unknown',
        method: gapMeta?.method ?? 'unknown',
      }
    })

  const user = `Analyze the following documentation gap data for an Emergency Medicine physician. Provide 2-3 paragraphs of analysis with actionable advice for improving their MDM documentation.

Gap Data (sorted by frequency):
${JSON.stringify(gapEntries, null, 2)}

Total unique gap types: ${gapEntries.length}
Total gap occurrences: ${gapEntries.reduce((sum, g) => sum + g.count, 0)}

Provide your analysis in plain text (no markdown headers or bullet points). Focus on the top patterns and give specific advice for the 2-3 most impactful areas of improvement.`

  return { system, user }
}
