import { useState, useMemo, useCallback, useEffect } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type {
  WorkupRecommendation,
  WorkupRecommendationSource,
  CdrTracking,
} from '../../../types/encounter'
import type { OrderSet } from '../../../types/userProfile'
import { buildCdrColorMap } from './cdrColorPalette'
import { CATEGORY_ORDER } from './subcategoryUtils'
import OrdersLeftPanel from './OrdersLeftPanel'
import OrdersRightPanel from './OrdersRightPanel'
import CreateOrdersetPopup from './CreateOrdersetPopup'
import './OrdersCard.css'

// ── Constants ────────────────────────────────────────────────────────────────

const FREQUENTLY_USED_NAME = '__frequently_used__'

// ── Props ────────────────────────────────────────────────────────────────────

interface OrdersCardProps {
  tests: TestDefinition[]
  recommendedTestIds: string[]
  workupRecommendations?: WorkupRecommendation[]
  selectedTests: string[]
  onSelectionChange: (testIds: string[]) => void
  onOpenOrdersetManager: (mode: 'browse' | 'edit', targetOrderSetId?: string) => void
  onAcceptAllRecommended: () => void
  onAcceptSelected: () => void
  cdrTracking?: CdrTracking
  cdrColorMap?: Map<string, string>
  loading: boolean
  orderSets: OrderSet[]
  onApplyOrderSet: (orderSet: OrderSet) => void
  onSaveOrderSet?: (name: string, testIds: string[]) => Promise<OrderSet | null>
  onUpdateOrderSet?: (id: string, data: { tests: string[] }) => Promise<void>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrdersCard({
  tests,
  recommendedTestIds,
  workupRecommendations = [],
  selectedTests,
  onSelectionChange,
  onOpenOrdersetManager,
  onAcceptAllRecommended,
  onAcceptSelected,
  cdrTracking = {},
  cdrColorMap: externalColorMap,
  loading,
  orderSets,
  onApplyOrderSet,
  onSaveOrderSet,
  onUpdateOrderSet,
}: OrdersCardProps) {
  // ── State ────────────────────────────────────────────────────────────────

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['recommended', 'frequentlyUsed']),
  )
  const [accepted, setAccepted] = useState(false)
  const [showCreatePopup, setShowCreatePopup] = useState(false)

  // Clear accepted flash after animation
  useEffect(() => {
    if (!accepted) return
    const timer = setTimeout(() => setAccepted(false), 600)
    return () => clearTimeout(timer)
  }, [accepted])

  // ── Memos ────────────────────────────────────────────────────────────────

  /** Tests that match the AI-recommended test IDs */
  const recommendedTests = useMemo(
    () => tests.filter((t) => recommendedTestIds.includes(t.id)),
    [tests, recommendedTestIds],
  )

  /** Recommended tests enriched with source/reason from workup recommendations */
  const enrichedTests = useMemo(() => {
    if (workupRecommendations.length === 0)
      return recommendedTests.map((t) => ({
        test: t,
        source: undefined as WorkupRecommendationSource | undefined,
        reason: undefined as string | undefined,
      }))
    const recMap = new Map<string, WorkupRecommendation>()
    for (const rec of workupRecommendations) {
      recMap.set(rec.testName.toLowerCase(), rec)
    }
    return recommendedTests.map((t) => {
      const match = recMap.get(t.name.toLowerCase())
      return { test: t, source: match?.source, reason: match?.reason }
    })
  }, [recommendedTests, workupRecommendations])

  /** CDR name -> color map (external if provided, otherwise built locally) */
  const cdrColorMapFinal = useMemo(() => {
    if (externalColorMap) return externalColorMap
    const names = Object.values(cdrTracking)
      .filter((e) => !e.dismissed && !e.excluded)
      .map((e) => e.name)
    return buildCdrColorMap(names)
  }, [externalColorMap, cdrTracking])

  /** For each test, which active CDRs require it */
  const testCdrMap = useMemo(() => {
    const map = new Map<string, Array<{ name: string; color: string }>>()
    for (const test of tests) {
      if (!test.feedsCdrs?.length) continue
      const cdrs: Array<{ name: string; color: string }> = []
      for (const cdrId of test.feedsCdrs) {
        const entry = cdrTracking[cdrId]
        if (entry && !entry.dismissed && !entry.excluded) {
          const color = cdrColorMapFinal.get(entry.name.toLowerCase())
          if (color) cdrs.push({ name: entry.name, color })
        }
      }
      if (cdrs.length > 0) map.set(test.id, cdrs)
    }
    return map
  }, [tests, cdrTracking, cdrColorMapFinal])

  /** Tests grouped by category */
  const testsByCategory = useMemo(() => {
    const map = new Map<TestCategory, TestDefinition[]>()
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, [])
    }
    for (const test of tests) {
      const list = map.get(test.category)
      if (list) list.push(test)
    }
    return map
  }, [tests])

  /** The special __frequently_used__ orderset */
  const frequentlyUsedOrderSet = useMemo(
    () => orderSets.find((os) => os.name === FREQUENTLY_USED_NAME),
    [orderSets],
  )

  /** Tests in the frequently used list */
  const frequentlyUsedTests = useMemo(() => {
    if (!frequentlyUsedOrderSet) return []
    const idSet = new Set(frequentlyUsedOrderSet.tests)
    return tests.filter((t) => idSet.has(t.id))
  }, [frequentlyUsedOrderSet, tests])

  /** User-visible ordersets (excluding __frequently_used__) */
  const userOrderSets = useMemo(
    () => orderSets.filter((os) => os.name !== FREQUENTLY_USED_NAME),
    [orderSets],
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleSection = useCallback((sectionKey: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionKey)) {
        next.delete(sectionKey)
      } else {
        next.add(sectionKey)
      }
      return next
    })
  }, [])

  const handleToggle = useCallback(
    (testId: string) => {
      if (selectedTests.includes(testId)) {
        onSelectionChange(selectedTests.filter((id) => id !== testId))
      } else {
        onSelectionChange([...selectedTests, testId])
      }
    },
    [selectedTests, onSelectionChange],
  )

  const handleOrdersetToggle = useCallback(
    (orderSet: OrderSet) => {
      const osTestSet = new Set(orderSet.tests)
      const allSelected = orderSet.tests.every((tid) => selectedTests.includes(tid))
      if (allSelected) {
        onSelectionChange(selectedTests.filter((id) => !osTestSet.has(id)))
      } else {
        const merged = new Set([...selectedTests, ...orderSet.tests])
        onSelectionChange(Array.from(merged))
        onApplyOrderSet(orderSet)
      }
    },
    [selectedTests, onSelectionChange, onApplyOrderSet],
  )

  const handleToggleAllRecommended = useCallback(() => {
    const allSelected =
      recommendedTestIds.length > 0 && recommendedTestIds.every((id) => selectedTests.includes(id))
    if (allSelected) {
      const recSet = new Set(recommendedTestIds)
      onSelectionChange(selectedTests.filter((id) => !recSet.has(id)))
    } else {
      const merged = new Set([...selectedTests, ...recommendedTestIds])
      onSelectionChange(Array.from(merged))
    }
  }, [recommendedTestIds, selectedTests, onSelectionChange])

  const handleCreateOrderset = useCallback(() => {
    if (selectedTests.length === 0) return
    setShowCreatePopup(true)
  }, [selectedTests.length])

  const handleAcceptAllRecommended = useCallback(() => {
    setAccepted(true)
    onAcceptAllRecommended()
  }, [onAcceptAllRecommended])

  const handleAcceptSelected = useCallback(() => {
    setAccepted(true)
    onAcceptSelected()
  }, [onAcceptSelected])

  const isOrdersetFullySelected = useCallback(
    (os: OrderSet) => os.tests.length > 0 && os.tests.every((tid) => selectedTests.includes(tid)),
    [selectedTests],
  )

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="orders-card">
        <h4 className="orders-card__title">Orders</h4>
        <p className="orders-card__loading">Loading test library...</p>
      </div>
    )
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const hasRecommendations = enrichedTests.length > 0
  const hasSelected = selectedTests.length > 0
  const checkboxClass = accepted
    ? 'orders-card__checkbox orders-card__checkbox--accepted'
    : 'orders-card__checkbox'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="orders-card">
      {/* Selected count badge */}
      {hasSelected && (
        <div className="orders-card__header">
          <span className="orders-card__count-badge">{selectedTests.length} selected</span>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="orders-card__panels">
        <div className="orders-card__panel">
          <div className="orders-card__panel-header">
            <h5 className="orders-card__panel-title">Orders</h5>
          </div>
          <OrdersLeftPanel
            enrichedTests={enrichedTests}
            recommendedTestIds={recommendedTestIds}
            selectedTests={selectedTests}
            frequentlyUsedTests={frequentlyUsedTests}
            frequentlyUsedOrderSet={frequentlyUsedOrderSet}
            testsByCategory={testsByCategory}
            openSections={openSections}
            checkboxClass={checkboxClass}
            testCdrMap={testCdrMap}
            onToggle={handleToggle}
            onToggleSection={toggleSection}
            onToggleAllRecommended={handleToggleAllRecommended}
            onOpenOrdersetManager={onOpenOrdersetManager}
            onCreateOrderset={onSaveOrderSet && onUpdateOrderSet ? handleCreateOrderset : undefined}
          />
        </div>

        <OrdersRightPanel
          tests={tests}
          userOrderSets={userOrderSets}
          selectedTests={selectedTests}
          checkboxClass={checkboxClass}
          openSections={openSections}
          onToggle={handleToggle}
          onToggleSection={toggleSection}
          onOrdersetToggle={handleOrdersetToggle}
          isOrdersetFullySelected={isOrdersetFullySelected}
          onOpenOrdersetManager={onOpenOrdersetManager}
        />
      </div>

      {/* Create Orderset Popup */}
      {showCreatePopup && onSaveOrderSet && onUpdateOrderSet && (
        <div className="orders-card__popup-anchor">
          <CreateOrdersetPopup
            selectedTests={selectedTests}
            existingOrderSets={userOrderSets}
            onSave={onSaveOrderSet}
            onUpdate={onUpdateOrderSet}
            onClose={() => setShowCreatePopup(false)}
          />
        </div>
      )}

      {/* Footer buttons — full width below both panels */}
      <div className="orders-card__footer">
        <button
          type="button"
          className="orders-card__accept-btn"
          onClick={handleAcceptAllRecommended}
          disabled={!hasRecommendations}
        >
          Accept All Recommended
        </button>
        <button
          type="button"
          className="orders-card__accept-btn orders-card__accept-btn--secondary"
          onClick={handleAcceptSelected}
          disabled={!hasSelected}
        >
          Accept Selected
        </button>
      </div>
    </div>
  )
}
