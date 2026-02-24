/**
 * DashboardOutput Component
 *
 * 4-area dashboard displayed after Section 1 completion:
 *   - Differential (full-width top)
 *   - CdrCard + WorkupCard (side-by-side on desktop, stacked on mobile)
 *   - Trends (full-width bottom, conditionally shown)
 *   - "Accept Workup & Continue" button
 *
 * Replaces both DifferentialPreview (inline) and standalone TrendResultsPanel
 * between Section 1 and Section 2.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import type { DifferentialItem } from '../../../types/encounter'
import type { TrendAnalysisResult } from '../../../types/surveillance'
import DifferentialList from './DifferentialList'
import WorkupCard from './WorkupCard'
import OrderSelector from './OrderSelector'
import CdrCard from './CdrCard'
import { useTestLibrary } from '../../../hooks/useTestLibrary'
import { useCdrLibrary } from '../../../hooks/useCdrLibrary'
import { getRecommendedTestIds } from './getRecommendedTestIds'
import { getIdentifiedCdrs } from './getIdentifiedCdrs'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import './DashboardOutput.css'

interface DashboardOutputProps {
  /** S1 llmResponse — handles both flat DifferentialItem[] and wrapped { differential, processedAt } */
  llmResponse: unknown
  /** Trend analysis data (null if unavailable or disabled) */
  trendAnalysis: TrendAnalysisResult | null
  /** Whether trend analysis is currently loading */
  trendLoading?: boolean
  /** Currently selected test IDs */
  selectedTests?: string[]
  /** Callback when test selection changes */
  onSelectedTestsChange?: (testIds: string[]) => void
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
  selectedTests = [],
  onSelectedTestsChange,
}: DashboardOutputProps) {
  const isMobile = useIsMobile()
  const differential = getDifferential(llmResponse)
  const [showOrderSelector, setShowOrderSelector] = useState(false)
  const { tests, loading: testsLoading } = useTestLibrary()
  const { cdrs, loading: cdrsLoading, error: cdrsError } = useCdrLibrary()

  const recommendedTestIds = useMemo(
    () => getRecommendedTestIds(differential, tests),
    [differential, tests]
  )

  const identifiedCdrs = useMemo(
    () => getIdentifiedCdrs(differential, cdrs),
    [differential, cdrs]
  )

  // Auto-populate recommended tests as pre-checked on fresh encounters (AC#1)
  const autoPopulatedRef = useRef(false)
  useEffect(() => {
    if (
      !autoPopulatedRef.current &&
      recommendedTestIds.length > 0 &&
      selectedTests.length === 0 &&
      onSelectedTestsChange
    ) {
      autoPopulatedRef.current = true
      onSelectedTestsChange(recommendedTestIds)
    }
  }, [recommendedTestIds, selectedTests.length, onSelectedTestsChange])

  if (differential.length === 0) return null

  const handleSelectionChange = (testIds: string[]) => {
    onSelectedTestsChange?.(testIds)
  }

  if (showOrderSelector) {
    return (
      <OrderSelector
        tests={tests}
        selectedTests={selectedTests}
        recommendedTestIds={recommendedTestIds}
        onSelectionChange={handleSelectionChange}
        onBack={() => setShowOrderSelector(false)}
      />
    )
  }

  return (
    <div className={`dashboard-output ${isMobile ? 'dashboard-output--mobile' : 'dashboard-output--desktop'}`}>
      {/* Differential: always full-width */}
      <div className="dashboard-output__differential">
        <DifferentialList differential={differential} />
      </div>

      {/* CDR + Workup: side-by-side on desktop, stacked on mobile */}
      <div className="dashboard-output__middle-row">
        <CdrCard identifiedCdrs={identifiedCdrs} loading={cdrsLoading} error={cdrsError} />
        {onSelectedTestsChange ? (
          <WorkupCard
            tests={tests}
            recommendedTestIds={recommendedTestIds}
            selectedTests={selectedTests}
            onSelectionChange={handleSelectionChange}
            onOpenOrderSelector={() => setShowOrderSelector(true)}
            loading={testsLoading}
          />
        ) : (
          <StubCard
            title="Recommended Workup"
            description="Order selection available \u2014 BM-2.2"
          />
        )}
      </div>

      {/* Trends: full-width, conditionally shown */}
      <TrendsCard analysis={trendAnalysis} isLoading={trendLoading} />

      {/* Action */}
      <button
        className="dashboard-output__continue-btn"
        onClick={handleScrollToSection2}
        type="button"
      >
        Accept Workup & Continue
      </button>
    </div>
  )
}
