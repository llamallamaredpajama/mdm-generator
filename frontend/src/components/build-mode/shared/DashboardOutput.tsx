/**
 * DashboardOutput Component
 *
 * 4-area dashboard displayed after Section 1 completion:
 *   - Differential (full-width top)
 *   - CdrCard + WorkupCard (side-by-side on desktop, stacked on mobile)
 *   - Trends (full-width bottom, conditionally shown)
 *   - "Accept All / Continue" button
 *
 * Replaces both DifferentialPreview (inline) and standalone TrendResultsPanel
 * between Section 1 and Section 2.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type {
  DifferentialItem,
  CdrAnalysisItem,
  WorkupRecommendation,
  EncounterDocument,
} from '../../../types/encounter'
import type { TrendAnalysisResult } from '../../../types/surveillance'
import DifferentialList from './DifferentialList'
import WorkupCard from './WorkupCard'
import OrderSelector from './OrderSelector'
import OrderSetSuggestion from './OrderSetSuggestion'
import SaveOrderSetModal from './SaveOrderSetModal'
import CdrCard from './CdrCard'
import CdrDetailView from './CdrDetailView'
import RegionalTrendsCard from './RegionalTrendsCard'
import { useTestLibrary } from '../../../hooks/useTestLibrary'
import { useCdrLibrary } from '../../../hooks/useCdrLibrary'
import { useCdrTracking } from '../../../hooks/useCdrTracking'
import { useOrderSets, type OrderSet } from '../../../hooks/useOrderSets'
import { getRecommendedTestIds, getTestIdsFromWorkupRecommendations } from './getRecommendedTestIds'
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
  /** Encounter document (required for CDR detail view) */
  encounter?: EncounterDocument | null
  /** Deterministic CDR name → color map (single source of truth from EncounterEditor) */
  cdrColorMap?: Map<string, string>
  /** B2/D3: Callback when user accepts workup and continues to S2 */
  onAcceptContinue?: () => void
  /** C2: Callback to open trend report modal */
  onOpenTrendReport?: () => void
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

/**
 * Extract CDR analysis from S1 llmResponse (optional, new field).
 */
function getCdrAnalysis(llmResponse: unknown): CdrAnalysisItem[] {
  if (llmResponse && typeof llmResponse === 'object' && 'cdrAnalysis' in llmResponse) {
    const wrapped = llmResponse as { cdrAnalysis?: unknown }
    if (Array.isArray(wrapped.cdrAnalysis)) return wrapped.cdrAnalysis as CdrAnalysisItem[]
  }
  return []
}

/**
 * Extract workup recommendations from S1 llmResponse (optional, new field).
 */
function getWorkupRecommendations(llmResponse: unknown): WorkupRecommendation[] {
  if (llmResponse && typeof llmResponse === 'object' && 'workupRecommendations' in llmResponse) {
    const wrapped = llmResponse as { workupRecommendations?: unknown }
    if (Array.isArray(wrapped.workupRecommendations))
      return wrapped.workupRecommendations as WorkupRecommendation[]
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

function handleScrollToSection2() {
  document.getElementById('section-panel-2')?.scrollIntoView({ behavior: 'smooth' })
}

export default function DashboardOutput({
  llmResponse,
  trendAnalysis,
  trendLoading = false,
  selectedTests = [],
  onSelectedTestsChange,
  encounter,
  cdrColorMap,
  onAcceptContinue,
  onOpenTrendReport,
}: DashboardOutputProps) {
  const isMobile = useIsMobile()
  const differential = getDifferential(llmResponse)
  const cdrAnalysis = getCdrAnalysis(llmResponse)
  const workupRecommendations = getWorkupRecommendations(llmResponse)
  const [showOrderSelector, setShowOrderSelector] = useState(false)
  const [showCdrDetail, setShowCdrDetail] = useState(false)
  const [showSaveOrderSet, setShowSaveOrderSet] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const { tests, loading: testsLoading } = useTestLibrary()
  const { cdrs, loading: cdrsLoading, error: cdrsError } = useCdrLibrary()
  const { saveOrderSet, incrementUsage, suggestOrderSet } = useOrderSets()

  // A2/A4: CDR tracking for inline edits and exclude toggles
  const {
    tracking: cdrTracking,
    answerComponent,
    toggleExcluded,
  } = useCdrTracking(encounter?.id ?? null, encounter?.cdrTracking ?? {}, cdrs)

  // Bug 4 fix: Combine client-side matching AND LLM workup recommendations.
  // LLM recs are the primary source; client-side matching fills gaps.
  const recommendedTestIds = useMemo(() => {
    const fromDifferential = getRecommendedTestIds(differential, tests)
    const fromWorkup = getTestIdsFromWorkupRecommendations(workupRecommendations, tests)
    const merged = new Set([...fromWorkup, ...fromDifferential])
    return Array.from(merged)
  }, [differential, tests, workupRecommendations])

  const identifiedCdrs = useMemo(() => getIdentifiedCdrs(differential, cdrs), [differential, cdrs])

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

  // Build a text summary of the differential for order set matching
  const differentialText = useMemo(
    () => differential.map((d) => `${d.diagnosis} ${d.reasoning || ''}`).join(' '),
    [differential],
  )

  const suggestedOrderSet = useMemo(
    () => (suggestionDismissed ? null : suggestOrderSet(differentialText)),
    [suggestOrderSet, differentialText, suggestionDismissed],
  )

  const handleApplyOrderSet = (orderSet: OrderSet) => {
    if (!onSelectedTestsChange) return
    const merged = new Set([...selectedTests, ...orderSet.testIds])
    onSelectedTestsChange(Array.from(merged))
    incrementUsage(orderSet.id)
    setSuggestionDismissed(true)
  }

  const handleCustomizeOrderSet = (orderSet: OrderSet) => {
    if (!onSelectedTestsChange) return
    // Pre-load order set tests then open the order selector
    const merged = new Set([...selectedTests, ...orderSet.testIds])
    onSelectedTestsChange(Array.from(merged))
    incrementUsage(orderSet.id)
    setSuggestionDismissed(true)
    setShowOrderSelector(true)
  }

  const handleSaveOrderSet = (name: string, testIds: string[], tags: string[]) => {
    saveOrderSet(name, testIds, tags)
    setShowSaveOrderSet(false)
  }

  // Lock body scroll while any overlay is open (OrderSelector or CdrDetailView)
  useEffect(() => {
    if (!showOrderSelector && !showCdrDetail) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showOrderSelector, showCdrDetail])

  // Escape key handler for overlays (OrderSelector and CdrDetailView)
  const handleOrderOverlayKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowOrderSelector(false)
    }
  }, [])

  const handleCdrOverlayKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCdrDetail(false)
    }
  }, [])

  // Backdrop click handlers for overlays
  const handleOrderBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowOrderSelector(false)
    }
  }, [])

  const handleCdrBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowCdrDetail(false)
    }
  }, [])

  if (differential.length === 0) return null

  const handleSelectionChange = (testIds: string[]) => {
    onSelectedTestsChange?.(testIds)
  }

  // Determine if "View CDRs" should be enabled
  // A1 fix: enable based on identifiedCdrs or cdrAnalysis presence, not just cdrTracking
  const hasCdrData =
    identifiedCdrs.length > 0 ||
    cdrAnalysis.length > 0 ||
    (encounter && Object.keys(encounter.cdrTracking ?? {}).length > 0)
  const handleViewCdrs = hasCdrData && encounter ? () => setShowCdrDetail(true) : undefined

  return (
    <div
      className={`dashboard-output ${isMobile ? 'dashboard-output--mobile' : 'dashboard-output--desktop'}`}
    >
      {/* Top row: Differential left, CDR + Trends stacked right (C1) */}
      <div className="dashboard-output__top-row">
        <div className="dashboard-output__differential">
          <DifferentialList differential={differential} />
        </div>
        <div className="dashboard-output__right-col">
          <CdrCard
            identifiedCdrs={identifiedCdrs}
            cdrAnalysis={cdrAnalysis}
            cdrTracking={cdrTracking}
            cdrLibrary={cdrs}
            cdrColorMap={cdrColorMap}
            loading={cdrsLoading}
            error={cdrsError}
            onViewCdrs={handleViewCdrs}
            onToggleExcluded={encounter ? toggleExcluded : undefined}
            onAnswerComponent={encounter ? answerComponent : undefined}
          />
          {/* C1: Trends positioned next to CDR card (right column) */}
          <RegionalTrendsCard
            analysis={trendAnalysis}
            isLoading={trendLoading}
            onOpenReport={onOpenTrendReport}
          />
        </div>
      </div>

      {/* Order Set Suggestion */}
      {suggestedOrderSet && onSelectedTestsChange && (
        <OrderSetSuggestion
          orderSet={suggestedOrderSet}
          onApplyAll={handleApplyOrderSet}
          onCustomize={handleCustomizeOrderSet}
          onSkip={() => setSuggestionDismissed(true)}
        />
      )}

      {/* Workup: full-width */}
      <div className="dashboard-output__middle-row">
        {onSelectedTestsChange ? (
          <WorkupCard
            tests={tests}
            recommendedTestIds={recommendedTestIds}
            workupRecommendations={workupRecommendations}
            selectedTests={selectedTests}
            onSelectionChange={handleSelectionChange}
            onOpenOrderSelector={() => setShowOrderSelector(true)}
            onSaveOrderSet={selectedTests.length > 0 ? () => setShowSaveOrderSet(true) : undefined}
            onAcceptContinue={onAcceptContinue ?? handleScrollToSection2}
            cdrTracking={cdrTracking}
            cdrColorMap={cdrColorMap}
            loading={testsLoading}
          />
        ) : (
          <StubCard
            title="Recommended Workup"
            description="Order selection available \u2014 BM-2.2"
          />
        )}
      </div>

      {/* Save Order Set Modal */}
      {showSaveOrderSet && (
        <SaveOrderSetModal
          selectedTestIds={selectedTests}
          tests={tests}
          onSave={handleSaveOrderSet}
          onClose={() => setShowSaveOrderSet(false)}
        />
      )}

      {/* Bug 2+3 fix: CdrDetailView rendered as overlay instead of replacing dashboard */}
      {showCdrDetail && encounter && (
        <div
          className="dashboard-output__overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Clinical Decision Rules Detail"
          onKeyDown={handleCdrOverlayKeyDown}
          onClick={handleCdrBackdropClick}
        >
          <div className="dashboard-output__overlay-content dashboard-output__overlay-content--wide">
            <CdrDetailView
              encounter={encounter}
              cdrLibrary={cdrs}
              identifiedCdrs={identifiedCdrs}
              cdrAnalysis={cdrAnalysis}
              onBack={() => setShowCdrDetail(false)}
            />
          </div>
        </div>
      )}

      {/* B1 fix: OrderSelector rendered as overlay instead of replacing dashboard */}
      {showOrderSelector && (
        <div
          className="dashboard-output__overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Order Selection"
          onKeyDown={handleOrderOverlayKeyDown}
          onClick={handleOrderBackdropClick}
        >
          <div className="dashboard-output__overlay-content">
            <OrderSelector
              tests={tests}
              selectedTests={selectedTests}
              recommendedTestIds={recommendedTestIds}
              onSelectionChange={handleSelectionChange}
              onBack={() => setShowOrderSelector(false)}
              onAcceptContinue={() => {
                setShowOrderSelector(false)
                if (onAcceptContinue) onAcceptContinue()
                else handleScrollToSection2()
              }}
              onSaveOrderSet={
                selectedTests.length > 0
                  ? () => {
                      setShowOrderSelector(false)
                      setShowSaveOrderSet(true)
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
