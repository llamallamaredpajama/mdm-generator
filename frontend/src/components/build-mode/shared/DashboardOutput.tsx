/**
 * DashboardOutput Component
 *
 * 4-area dashboard displayed after Section 1 completion:
 *   - Differential (full-width top)
 *   - CdrCard + OrdersCard (side-by-side on desktop, stacked on mobile)
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
import OrdersCard from './OrdersCard'
import OrdersetManager from './OrdersetManager'
import OrderSetSuggestion from './OrderSetSuggestion'
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
  /** Whether Firestore data has been loaded into selectedTests (guards auto-populate) */
  firestoreInitialized?: boolean
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
  firestoreInitialized = true,
}: DashboardOutputProps) {
  const isMobile = useIsMobile()
  const differential = getDifferential(llmResponse)
  const cdrAnalysis = getCdrAnalysis(llmResponse)
  const workupRecommendations = getWorkupRecommendations(llmResponse)
  const [showCdrDetail, setShowCdrDetail] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  // OrdersetManager state
  const [ordersetManagerOpen, setOrdersetManagerOpen] = useState(false)
  const [ordersetManagerMode, setOrdersetManagerMode] = useState<'browse' | 'edit'>('browse')
  const [editTargetOrderSet, setEditTargetOrderSet] = useState<OrderSet | undefined>()
  const { tests, loading: testsLoading } = useTestLibrary()
  const { cdrs, loading: cdrsLoading, error: cdrsError } = useCdrLibrary()
  const {
    orderSets,
    saveOrderSet,
    updateOrderSet,
    deleteOrderSet: deleteOrderSetFn,
    incrementUsage,
    suggestOrderSet,
  } = useOrderSets()

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
      firestoreInitialized &&
      recommendedTestIds.length > 0 &&
      selectedTests.length === 0 &&
      onSelectedTestsChange
    ) {
      autoPopulatedRef.current = true
      onSelectedTestsChange(recommendedTestIds)
    }
  }, [recommendedTestIds, selectedTests.length, onSelectedTestsChange, firestoreInitialized])

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
    const merged = new Set([...selectedTests, ...orderSet.tests])
    onSelectedTestsChange(Array.from(merged))
    incrementUsage(orderSet.id)
    setSuggestionDismissed(true)
  }

  const handleCustomizeOrderSet = (orderSet: OrderSet) => {
    if (!onSelectedTestsChange) return
    // Pre-load order set tests then open the manager
    const merged = new Set([...selectedTests, ...orderSet.tests])
    onSelectedTestsChange(Array.from(merged))
    incrementUsage(orderSet.id)
    setSuggestionDismissed(true)
    setOrdersetManagerMode('browse')
    setEditTargetOrderSet(undefined)
    setOrdersetManagerOpen(true)
  }

  const handleOpenOrdersetManager = (mode: 'browse' | 'edit', targetOrderSetId?: string) => {
    setOrdersetManagerMode(mode)
    setEditTargetOrderSet(
      targetOrderSetId ? orderSets.find((os) => os.id === targetOrderSetId) : undefined,
    )
    setOrdersetManagerOpen(true)
  }

  const handleAcceptAllRecommended = () => {
    if (!onSelectedTestsChange) return
    const merged = new Set([...selectedTests, ...recommendedTestIds])
    onSelectedTestsChange(Array.from(merged))
    if (onAcceptContinue) onAcceptContinue()
    else handleScrollToSection2()
  }

  const handleAcceptSelected = () => {
    // Keep current selection as-is — just advance to S2
    if (onAcceptContinue) onAcceptContinue()
    else handleScrollToSection2()
  }

  // Lock body scroll while any overlay is open (OrdersetManager or CdrDetailView)
  useEffect(() => {
    if (!ordersetManagerOpen && !showCdrDetail) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [ordersetManagerOpen, showCdrDetail])

  const handleCdrOverlayKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCdrDetail(false)
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

      {/* Orders: full-width */}
      <div className="dashboard-output__middle-row">
        {onSelectedTestsChange ? (
          <OrdersCard
            tests={tests}
            recommendedTestIds={recommendedTestIds}
            workupRecommendations={workupRecommendations}
            selectedTests={selectedTests}
            onSelectionChange={handleSelectionChange}
            onOpenOrdersetManager={handleOpenOrdersetManager}
            onAcceptAllRecommended={handleAcceptAllRecommended}
            onAcceptSelected={handleAcceptSelected}
            cdrTracking={cdrTracking}
            cdrColorMap={cdrColorMap}
            loading={testsLoading}
            orderSets={orderSets}
            onApplyOrderSet={handleApplyOrderSet}
            onSaveOrderSet={saveOrderSet}
            onUpdateOrderSet={async (id, data) => {
              await updateOrderSet(id, data)
            }}
          />
        ) : (
          <StubCard title="Orders" description="Order selection available \u2014 BM-2.2" />
        )}
      </div>

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

      {/* OrdersetManager modal */}
      {ordersetManagerOpen && (
        <OrdersetManager
          mode={ordersetManagerMode}
          editTargetOrderSet={editTargetOrderSet}
          tests={tests}
          selectedTests={selectedTests}
          recommendedTestIds={recommendedTestIds}
          onSelectionChange={handleSelectionChange}
          onClose={() => setOrdersetManagerOpen(false)}
          onAcceptAllRecommended={() => {
            setOrdersetManagerOpen(false)
            handleAcceptAllRecommended()
          }}
          onAcceptSelected={() => {
            setOrdersetManagerOpen(false)
            handleAcceptSelected()
          }}
          orderSets={orderSets}
          onSaveOrderSet={saveOrderSet}
          onUpdateOrderSet={async (id, data) => {
            await updateOrderSet(id, data)
          }}
          onDeleteOrderSet={deleteOrderSetFn}
        />
      )}
    </div>
  )
}
