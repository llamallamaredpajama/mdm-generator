import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type { WorkupRecommendationSource } from '../../../types/encounter'
import type { OrderSet } from '../../../types/userProfile'
import SubcategoryGroup from './SubcategoryGroup'
import { CATEGORY_ORDER, CATEGORY_LABELS, groupBySubcategory } from './subcategoryUtils'
import './OrdersCard.css'

const SOURCE_LABELS: Record<WorkupRecommendationSource, string> = {
  baseline: 'Baseline',
  differential: 'Differential',
  cdr: 'CDR',
  surveillance: 'Regional',
}

// ── Props ────────────────────────────────────────────────────────────────────

interface OrdersLeftPanelProps {
  enrichedTests: Array<{
    test: TestDefinition
    source?: WorkupRecommendationSource
    reason?: string
  }>
  recommendedTestIds: string[]
  selectedTests: string[]
  frequentlyUsedTests: TestDefinition[]
  frequentlyUsedOrderSet?: OrderSet
  testsByCategory: Map<TestCategory, TestDefinition[]>
  openSections: Set<string>
  checkboxClass: string
  testCdrMap: Map<string, Array<{ name: string; color: string }>>
  onToggle: (testId: string) => void
  onToggleSection: (key: string) => void
  onToggleAllRecommended: () => void
  onOpenOrdersetManager: (mode: 'browse' | 'edit', targetOrderSetId?: string) => void
  onCreateOrderset?: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrdersLeftPanel({
  enrichedTests,
  recommendedTestIds,
  selectedTests,
  frequentlyUsedTests,
  frequentlyUsedOrderSet,
  testsByCategory,
  openSections,
  checkboxClass,
  testCdrMap,
  onToggle,
  onToggleSection,
  onToggleAllRecommended,
  onOpenOrdersetManager,
  onCreateOrderset,
}: OrdersLeftPanelProps) {
  const hasRecommendations = enrichedTests.length > 0
  const allRecommendedSelected =
    recommendedTestIds.length > 0 && recommendedTestIds.every((id) => selectedTests.includes(id))

  return (
    <div className="orders-card__left-panel">
      {/* ── Section 1: Recommended Orders ──────────────────────────────────── */}
      {hasRecommendations && (
        <div className="orders-card__section">
          <button
            type="button"
            className="orders-card__section-header"
            onClick={() => onToggleSection('recommended')}
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
              {/* Select / Deselect All */}
              <div className="orders-card__select-all-row">
                <input
                  type="checkbox"
                  id="orders-rec-select-all"
                  className={checkboxClass}
                  checked={allRecommendedSelected}
                  onChange={onToggleAllRecommended}
                />
                <label htmlFor="orders-rec-select-all" className="orders-card__select-all-label">
                  Select / Deselect All
                </label>
              </div>

              {/* Matched recommended tests */}
              <div className="orders-card__list">
                {enrichedTests.map(({ test, source, reason }) => (
                  <div key={test.id} className="orders-card__test-row">
                    <input
                      type="checkbox"
                      id={`orders-rec-${test.id}`}
                      className={checkboxClass}
                      checked={selectedTests.includes(test.id)}
                      onChange={() => onToggle(test.id)}
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
            </div>
          )}
        </div>
      )}

      {/* ── Section 2: Frequently Used Orders ──────────────────────────────── */}
      <div className="orders-card__section">
        <button
          type="button"
          className="orders-card__section-header"
          onClick={() => onToggleSection('frequentlyUsed')}
          aria-expanded={openSections.has('frequentlyUsed')}
        >
          <span
            className={`orders-card__chevron${openSections.has('frequentlyUsed') ? ' orders-card__chevron--open' : ''}`}
            aria-hidden="true"
          />
          <span className="orders-card__section-title">Frequently Used Orders</span>
        </button>
        {openSections.has('frequentlyUsed') && (
          <div className="orders-card__section-body">
            {frequentlyUsedTests.length > 0 ? (
              <>
                <div className="orders-card__list">
                  {frequentlyUsedTests.map((test) => (
                    <div key={test.id} className="orders-card__test-row">
                      <input
                        type="checkbox"
                        id={`orders-freq-${test.id}`}
                        className={checkboxClass}
                        checked={selectedTests.includes(test.id)}
                        onChange={() => onToggle(test.id)}
                      />
                      <label htmlFor={`orders-freq-${test.id}`} className="orders-card__test-label">
                        <span className="orders-card__test-name">{test.name}</span>
                        <span className="orders-card__category-tag">
                          {CATEGORY_LABELS[test.category]}
                        </span>
                        {recommendedTestIds.includes(test.id) && (
                          <span className="orders-card__ai-badge">AI</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="orders-card__add-items-btn"
                  onClick={() => onOpenOrdersetManager('edit', frequentlyUsedOrderSet?.id)}
                >
                  Add Items
                </button>
              </>
            ) : (
              <button
                type="button"
                className="orders-card__add-items-btn"
                onClick={() => onOpenOrdersetManager('edit', frequentlyUsedOrderSet?.id)}
              >
                Add Items
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Sections 3-5: Category Dropdowns ───────────────────────────────── */}
      {CATEGORY_ORDER.map((cat) => {
        const catTests = testsByCategory.get(cat) ?? []
        if (catTests.length === 0) return null
        const sectionKey = `cat-${cat}`
        const subcategoryGroups = groupBySubcategory(catTests)
        return (
          <div key={cat} className="orders-card__section">
            <button
              type="button"
              className="orders-card__section-header"
              onClick={() => onToggleSection(sectionKey)}
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
                {[...subcategoryGroups.entries()].map(([subcategory, tests]) => (
                  <SubcategoryGroup
                    key={subcategory}
                    subcategory={subcategory}
                    tests={tests}
                    selectedTests={selectedTests}
                    recommendedTestIds={recommendedTestIds}
                    checkboxClass={checkboxClass}
                    idPrefix={`orders-${cat}`}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Section 6: Create Orderset Button ──────────────────────────────── */}
      {onCreateOrderset && (
        <button
          type="button"
          className="orders-card__create-orderset-btn"
          onClick={onCreateOrderset}
        >
          Create Orderset
        </button>
      )}
    </div>
  )
}
