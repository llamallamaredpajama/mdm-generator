/**
 * DashboardOutput Component
 *
 * 4-area dashboard displayed after Section 1 completion:
 *   - Differential (full-width top)
 *   - CDR stub + Workup stub (side-by-side on desktop, stacked on mobile)
 *   - Trends (full-width bottom, conditionally shown)
 *   - "Accept Workup & Continue" button
 *
 * Replaces both DifferentialPreview (inline) and standalone TrendResultsPanel
 * between Section 1 and Section 2.
 */

import type { DifferentialItem } from '../../../types/encounter'
import type { TrendAnalysisResult } from '../../../types/surveillance'
import DifferentialList from './DifferentialList'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import './DashboardOutput.css'

interface DashboardOutputProps {
  /** S1 llmResponse — handles both flat DifferentialItem[] and wrapped { differential, processedAt } */
  llmResponse: unknown
  /** Trend analysis data (null if unavailable or disabled) */
  trendAnalysis: TrendAnalysisResult | null
  /** Whether trend analysis is currently loading */
  trendLoading?: boolean
}

/**
 * Extract differential array from S1 llmResponse,
 * handling both flat and wrapped shapes for backward compatibility.
 */
function getDifferential(llmResponse: unknown): DifferentialItem[] {
  if (Array.isArray(llmResponse)) return llmResponse as DifferentialItem[]
  if (llmResponse && typeof llmResponse === 'object' && 'differential' in llmResponse) {
    const wrapped = llmResponse as { differential?: unknown }
    if (Array.isArray(wrapped.differential)) return wrapped.differential as DifferentialItem[]
  }
  return []
}

function StubCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-output__stub-card">
      <h4 className="dashboard-output__stub-title">{title}</h4>
      <p className="dashboard-output__stub-text">{description}</p>
    </div>
  )
}

function TrendsCard({
  analysis,
  isLoading,
}: {
  analysis: TrendAnalysisResult | null
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="dashboard-output__trends-card">
        <h4 className="dashboard-output__stub-title">Regional Trends</h4>
        <p className="dashboard-output__stub-text">Analyzing regional surveillance data...</p>
      </div>
    )
  }

  if (!analysis || analysis.rankedFindings.length === 0) {
    return null
  }

  return (
    <div className="dashboard-output__trends-card">
      <h4 className="dashboard-output__stub-title">Regional Trends</h4>
      <div className="dashboard-output__trends-findings">
        {analysis.rankedFindings.slice(0, 3).map((finding, i) => (
          <p key={`${finding.condition}-${i}`} className="dashboard-output__trend-line">
            <span className={`dashboard-output__trend-arrow dashboard-output__trend-arrow--${finding.trendDirection}`}>
              {finding.trendDirection === 'rising' ? '\u2191' : finding.trendDirection === 'falling' ? '\u2193' : '\u2192'}
            </span>
            {' '}
            <strong>{finding.condition}</strong>
            {' \u2014 '}
            {finding.summary}
          </p>
        ))}
      </div>
      <p className="dashboard-output__trends-attribution">
        {analysis.regionLabel} | {analysis.dataSourcesQueried.join(', ')}
      </p>
    </div>
  )
}

function handleScrollToSection2() {
  document.getElementById('section-panel-2')?.scrollIntoView({ behavior: 'smooth' })
}

export default function DashboardOutput({
  llmResponse,
  trendAnalysis,
  trendLoading = false,
}: DashboardOutputProps) {
  const isMobile = useIsMobile()
  const differential = getDifferential(llmResponse)

  if (differential.length === 0) return null

  return (
    <div className={`dashboard-output ${isMobile ? 'dashboard-output--mobile' : 'dashboard-output--desktop'}`}>
      {/* Differential: always full-width */}
      <div className="dashboard-output__differential">
        <DifferentialList differential={differential} />
      </div>

      {/* CDR + Workup: side-by-side on desktop, stacked on mobile */}
      <div className="dashboard-output__middle-row">
        <StubCard
          title="Clinical Decision Rules"
          description="CDR matching available after workup \u2014 BM-2.3"
        />
        <StubCard
          title="Recommended Workup"
          description="Order selection available \u2014 BM-2.2"
        />
      </div>

      {/* Trends: full-width, conditionally shown */}
      <TrendsCard analysis={trendAnalysis} isLoading={trendLoading} />

      {/* Action */}
      <button
        className="dashboard-output__continue-btn"
        onClick={handleScrollToSection2}
        type="button"
      >
        Accept Workup &amp; Continue
      </button>
    </div>
  )
}
