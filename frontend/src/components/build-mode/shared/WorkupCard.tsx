import { useMemo } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type { WorkupRecommendation, WorkupRecommendationSource } from '../../../types/encounter'
import type { CdrTracking } from '../../../types/encounter'
import { buildCdrColorMap } from './cdrColorPalette'
import './WorkupCard.css'

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

interface WorkupCardProps {
  tests: TestDefinition[]
  recommendedTestIds: string[]
  /** S1 LLM-generated workup recommendations (may be empty on older encounters) */
  workupRecommendations?: WorkupRecommendation[]
  selectedTests: string[]
  onSelectionChange: (testIds: string[]) => void
  onOpenOrderSelector: () => void
  onSaveOrderSet?: () => void
  /** B2: Combined accept all + continue callback */
  onAcceptContinue?: () => void
  /** A5: CDR tracking for correlation icons */
  cdrTracking?: CdrTracking
  /** Deterministic CDR name → color map (single source of truth from EncounterEditor) */
  cdrColorMap?: Map<string, string>
  loading: boolean
}

export default function WorkupCard({
  tests,
  recommendedTestIds,
  workupRecommendations = [],
  selectedTests,
  onSelectionChange,
  onOpenOrderSelector,
  // onSaveOrderSet reserved for future Save Set button (B3)
  onAcceptContinue,
  cdrTracking = {},
  cdrColorMap: externalColorMap,
  loading,
}: WorkupCardProps) {
  const recommendedTests = useMemo(
    () => tests.filter((t) => recommendedTestIds.includes(t.id)),
    [tests, recommendedTestIds],
  )

  // Identify LLM-recommended tests that are NOT in the test library
  // These are displayed as text-only recommendations
  const unmatchedRecommendations = useMemo(() => {
    if (workupRecommendations.length === 0) return []
    const testNames = new Set(tests.map((t) => t.name.toLowerCase()))
    return workupRecommendations.filter((rec) => !testNames.has(rec.testName.toLowerCase()))
  }, [workupRecommendations, tests])

  // Enrich recommended tests with LLM source/reason when available
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

  // A5: Use external color map if provided; otherwise build a local fallback (alphabetically sorted)
  const cdrColorMap = useMemo(() => {
    if (externalColorMap) return externalColorMap
    const names = Object.values(cdrTracking)
      .filter((e) => !e.dismissed && !e.excluded)
      .map((e) => e.name)
    return buildCdrColorMap(names)
  }, [externalColorMap, cdrTracking])

  // A5: For each test, find which active CDRs need it (via feedsCdrs)
  const testCdrMap = useMemo(() => {
    const map = new Map<string, Array<{ name: string; color: string }>>()
    for (const test of tests) {
      if (!test.feedsCdrs?.length) continue
      const cdrs: Array<{ name: string; color: string }> = []
      for (const cdrId of test.feedsCdrs) {
        const entry = cdrTracking[cdrId]
        if (entry && !entry.dismissed && !entry.excluded) {
          const color = cdrColorMap.get(entry.name.toLowerCase())
          if (color) cdrs.push({ name: entry.name, color })
        }
      }
      if (cdrs.length > 0) map.set(test.id, cdrs)
    }
    return map
  }, [tests, cdrTracking, cdrColorMap])

  function handleToggle(testId: string) {
    if (selectedTests.includes(testId)) {
      onSelectionChange(selectedTests.filter((id) => id !== testId))
    } else {
      onSelectionChange([...selectedTests, testId])
    }
  }

  function handleAcceptAll() {
    const merged = new Set([...selectedTests, ...recommendedTestIds])
    onSelectionChange(Array.from(merged))
  }

  if (loading) {
    return (
      <div className="workup-card">
        <h4 className="workup-card__title">Recommended Workup</h4>
        <p className="workup-card__loading">Loading test library...</p>
      </div>
    )
  }

  const hasRecommendations = enrichedTests.length > 0 || unmatchedRecommendations.length > 0

  return (
    <div className="workup-card">
      {/* B2: Consolidated header — title + count left, Edit button right */}
      <div className="workup-card__header">
        <div className="workup-card__title-group">
          <h4 className="workup-card__title">Recommended Workup</h4>
          {selectedTests.length > 0 && (
            <span className="workup-card__count-badge">{selectedTests.length} selected</span>
          )}
        </div>
        <button
          type="button"
          className="workup-card__action-btn workup-card__action-btn--edit"
          onClick={onOpenOrderSelector}
        >
          Edit
        </button>
      </div>

      {!hasRecommendations ? (
        <p className="workup-card__empty">No recommended tests identified</p>
      ) : (
        <>
          {/* Orderable tests from the test library */}
          {enrichedTests.length > 0 && (
            <div className="workup-card__list">
              {enrichedTests.map(({ test, source, reason }) => (
                <div key={test.id} className="workup-card__test-row">
                  <input
                    type="checkbox"
                    id={`workup-test-${test.id}`}
                    className="workup-card__checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => handleToggle(test.id)}
                  />
                  <label htmlFor={`workup-test-${test.id}`} className="workup-card__test-label">
                    {test.name}
                    <span className="workup-card__category-tag">
                      {CATEGORY_LABELS[test.category]}
                    </span>
                    {source && (
                      <span
                        className={`workup-card__source-tag workup-card__source-tag--${source}`}
                      >
                        {SOURCE_LABELS[source]}
                      </span>
                    )}
                    {/* A5: CDR correlation icons */}
                    {testCdrMap.get(test.id)?.map((cdr) => (
                      <span
                        key={cdr.name}
                        className="workup-card__cdr-icon"
                        style={{ backgroundColor: cdr.color }}
                        title={`Needed by ${cdr.name}`}
                      />
                    ))}
                  </label>
                  {reason && <span className="workup-card__reason">{reason}</span>}
                </div>
              ))}
            </div>
          )}

          {/* LLM-recommended tests not in the test library (text-only) */}
          {unmatchedRecommendations.length > 0 && (
            <div className="workup-card__additional">
              <h5 className="workup-card__additional-title">Additional Recommendations</h5>
              <ul className="workup-card__additional-list">
                {unmatchedRecommendations.map((rec) => (
                  <li key={rec.testName} className="workup-card__additional-item">
                    <span className="workup-card__additional-name">{rec.testName}</span>
                    {rec.source && (
                      <span
                        className={`workup-card__source-tag workup-card__source-tag--${rec.source}`}
                      >
                        {SOURCE_LABELS[rec.source]}
                      </span>
                    )}
                    {rec.priority === 'stat' && (
                      <span className="workup-card__priority-tag">STAT</span>
                    )}
                    <span className="workup-card__additional-reason">{rec.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* B2: Combined Accept All / Continue button at bottom */}
      {onAcceptContinue && (
        <button
          type="button"
          className="workup-card__accept-continue-btn"
          onClick={() => {
            handleAcceptAll()
            onAcceptContinue()
          }}
        >
          Accept All & Continue
        </button>
      )}
    </div>
  )
}
