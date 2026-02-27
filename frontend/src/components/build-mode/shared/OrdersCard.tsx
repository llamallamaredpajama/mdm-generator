import { useState, useMemo, useCallback, useEffect } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type {
  WorkupRecommendation,
  WorkupRecommendationSource,
  CdrTracking,
} from '../../../types/encounter'
import type { OrderSet } from '../../../types/userProfile'
import { buildCdrColorMap } from './cdrColorPalette'
import './OrdersCard.css'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

const CATEGORY_LABELS: Record<TestCategory, string> = {
  labs: 'Labs',
  imaging: 'Imaging',
  procedures_poc: 'Procedures / POC',
}

const SOURCE_LABELS: Record<WorkupRecommendationSource, string> = {
  baseline: 'Baseline',
  differential: 'Differential',
  cdr: 'CDR',
  surveillance: 'Regional',
}

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
}: OrdersCardProps) {
  // ── State ────────────────────────────────────────────────────────────────

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['recommended', 'frequentlyUsed']),
  )
  const [accepted, setAccepted] = useState(false)

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

  /** LLM recommendations that could not be matched to a library test */
  const unmatchedRecommendations = useMemo(() => {
    if (workupRecommendations.length === 0) return []
    const testNames = new Set(tests.map((t) => t.name.toLowerCase()))
    return workupRecommendations.filter((rec) => !testNames.has(rec.testName.toLowerCase()))
  }, [workupRecommendations, tests])

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
        // Remove orderset tests from selection
        onSelectionChange(selectedTests.filter((id) => !osTestSet.has(id)))
      } else {
        // Add orderset tests to selection
        const merged = new Set([...selectedTests, ...orderSet.tests])
        onSelectionChange(Array.from(merged))
        onApplyOrderSet(orderSet)
      }
    },
    [selectedTests, onSelectionChange, onApplyOrderSet],
  )

  const handleAcceptAllRecommended = useCallback(() => {
    setAccepted(true)
    onAcceptAllRecommended()
  }, [onAcceptAllRecommended])

  const handleAcceptSelected = useCallback(() => {
    setAccepted(true)
    onAcceptSelected()
  }, [onAcceptSelected])

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

  const hasRecommendations = enrichedTests.length > 0 || unmatchedRecommendations.length > 0
  const hasSelected = selectedTests.length > 0
  const checkboxClass = accepted
    ? 'orders-card__checkbox orders-card__checkbox--accepted'
    : 'orders-card__checkbox'

  // Check if an orderset is fully selected
  const isOrdersetFullySelected = (os: OrderSet) =>
    os.tests.length > 0 && os.tests.every((tid) => selectedTests.includes(tid))

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="orders-card">
      {/* Header */}
      <div className="orders-card__header">
        <div className="orders-card__title-group">
          <h4 className="orders-card__title">Orders</h4>
          {hasSelected && (
            <span className="orders-card__count-badge">{selectedTests.length} selected</span>
          )}
        </div>
        <button
          type="button"
          className="orders-card__action-btn orders-card__action-btn--edit"
          onClick={() => onOpenOrdersetManager('browse')}
        >
          Edit
        </button>
      </div>

      {/* ── Recommended Orders ────────────────────────────────────────────── */}
      {hasRecommendations && (
        <div className="orders-card__section">
          <button
            type="button"
            className="orders-card__section-header"
            onClick={() => toggleSection('recommended')}
            aria-expanded={openSections.has('recommended')}
          >
            <span
              className={`orders-card__chevron${openSections.has('recommended') ? ' orders-card__chevron--open' : ''}`}
              aria-hidden="true"
            />
            <span className="orders-card__section-title">Recommended Orders</span>
          </button>
          {openSections.has('recommended') && (
            <div className="orders-card__section-body">
              {/* Matched recommended tests */}
              {enrichedTests.length > 0 && (
                <div className="orders-card__list">
                  {enrichedTests.map(({ test, source, reason }) => (
                    <div key={test.id} className="orders-card__test-row">
                      <input
                        type="checkbox"
                        id={`orders-rec-${test.id}`}
                        className={checkboxClass}
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleToggle(test.id)}
                      />
                      <label htmlFor={`orders-rec-${test.id}`} className="orders-card__test-label">
                        <span className="orders-card__test-name">{test.name}</span>
                        <span className="orders-card__category-tag">
                          {CATEGORY_LABELS[test.category]}
                        </span>
                        {source && (
                          <span
                            className={`orders-card__source-tag orders-card__source-tag--${source}`}
                          >
                            {SOURCE_LABELS[source]}
                          </span>
                        )}
                        {/* CDR correlation icons */}
                        {testCdrMap.get(test.id)?.map((cdr) => (
                          <span
                            key={cdr.name}
                            className="orders-card__cdr-icon"
                            style={{ backgroundColor: cdr.color }}
                            title={`Needed by ${cdr.name}`}
                          />
                        ))}
                        <span className="orders-card__ai-badge">AI</span>
                      </label>
                      {reason && <span className="orders-card__reason">{reason}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Unmatched LLM recommendations (text-only) */}
              {unmatchedRecommendations.length > 0 && (
                <div className="orders-card__unmatched">
                  {unmatchedRecommendations.map((rec) => (
                    <div key={rec.testName} className="orders-card__unmatched-row">
                      <span className="orders-card__unmatched-name">{rec.testName}</span>
                      {rec.source && (
                        <span
                          className={`orders-card__source-tag orders-card__source-tag--${rec.source}`}
                        >
                          {SOURCE_LABELS[rec.source]}
                        </span>
                      )}
                      {rec.priority === 'stat' && (
                        <span className="orders-card__priority-tag">STAT</span>
                      )}
                      <span className="orders-card__ai-badge">AI</span>
                      {rec.reason && (
                        <span className="orders-card__unmatched-reason">{rec.reason}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Frequently Used ───────────────────────────────────────────────── */}
      <div className="orders-card__section">
        <div className="orders-card__section-header-row">
          <button
            type="button"
            className="orders-card__section-header"
            onClick={() => toggleSection('frequentlyUsed')}
            aria-expanded={openSections.has('frequentlyUsed')}
          >
            <span
              className={`orders-card__chevron${openSections.has('frequentlyUsed') ? ' orders-card__chevron--open' : ''}`}
              aria-hidden="true"
            />
            <span className="orders-card__section-title">Frequently Used</span>
          </button>
          <button
            type="button"
            className="orders-card__add-items-btn"
            onClick={() => onOpenOrdersetManager('edit', frequentlyUsedOrderSet?.id)}
          >
            Add Items
          </button>
        </div>
        {openSections.has('frequentlyUsed') && (
          <div className="orders-card__section-body">
            {frequentlyUsedTests.length > 0 ? (
              <div className="orders-card__list">
                {frequentlyUsedTests.map((test) => (
                  <div key={test.id} className="orders-card__test-row">
                    <input
                      type="checkbox"
                      id={`orders-freq-${test.id}`}
                      className={checkboxClass}
                      checked={selectedTests.includes(test.id)}
                      onChange={() => handleToggle(test.id)}
                    />
                    <label htmlFor={`orders-freq-${test.id}`} className="orders-card__test-label">
                      <span className="orders-card__test-name">{test.name}</span>
                      <span className="orders-card__category-tag">
                        {CATEGORY_LABELS[test.category]}
                      </span>
                      {/* Show AI badge if also recommended */}
                      {recommendedTestIds.includes(test.id) && (
                        <span className="orders-card__ai-badge">AI</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="orders-card__empty-placeholder">
                Add items to build your frequently used list
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Ordersets ─────────────────────────────────────────────────────── */}
      {userOrderSets.length > 0 && (
        <div className="orders-card__section">
          <button
            type="button"
            className="orders-card__section-header"
            onClick={() => toggleSection('ordersets')}
            aria-expanded={openSections.has('ordersets')}
          >
            <span
              className={`orders-card__chevron${openSections.has('ordersets') ? ' orders-card__chevron--open' : ''}`}
              aria-hidden="true"
            />
            <span className="orders-card__section-title">
              Ordersets ({userOrderSets.length} saved)
            </span>
          </button>
          {openSections.has('ordersets') && (
            <div className="orders-card__section-body">
              <div className="orders-card__list">
                {userOrderSets.map((os) => (
                  <div key={os.id} className="orders-card__orderset-row">
                    <input
                      type="checkbox"
                      id={`orders-os-${os.id}`}
                      className={checkboxClass}
                      checked={isOrdersetFullySelected(os)}
                      onChange={() => handleOrdersetToggle(os)}
                    />
                    <label htmlFor={`orders-os-${os.id}`} className="orders-card__test-label">
                      <span className="orders-card__test-name">{os.name}</span>
                      <span className="orders-card__orderset-count">{os.tests.length} tests</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category dropdowns ────────────────────────────────────────────── */}
      {CATEGORY_ORDER.map((cat) => {
        const catTests = testsByCategory.get(cat) ?? []
        if (catTests.length === 0) return null
        const sectionKey = `cat-${cat}`
        return (
          <div key={cat} className="orders-card__section">
            <button
              type="button"
              className="orders-card__section-header"
              onClick={() => toggleSection(sectionKey)}
              aria-expanded={openSections.has(sectionKey)}
            >
              <span
                className={`orders-card__chevron${openSections.has(sectionKey) ? ' orders-card__chevron--open' : ''}`}
                aria-hidden="true"
              />
              <span className="orders-card__section-title">
                {CATEGORY_LABELS[cat]} ({catTests.length})
              </span>
            </button>
            {openSections.has(sectionKey) && (
              <div className="orders-card__section-body">
                <div className="orders-card__list">
                  {catTests.map((test) => (
                    <div key={test.id} className="orders-card__test-row">
                      <input
                        type="checkbox"
                        id={`orders-cat-${test.id}`}
                        className={checkboxClass}
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleToggle(test.id)}
                      />
                      <label htmlFor={`orders-cat-${test.id}`} className="orders-card__test-label">
                        <span className="orders-card__test-name">{test.name}</span>
                        <span className="orders-card__category-tag">{test.subcategory}</span>
                        {recommendedTestIds.includes(test.id) && (
                          <span className="orders-card__ai-badge">AI</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Footer buttons ────────────────────────────────────────────────── */}
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
