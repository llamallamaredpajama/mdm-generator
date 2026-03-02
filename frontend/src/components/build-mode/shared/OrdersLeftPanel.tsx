import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type { WorkupRecommendationSource } from '../../../types/encounter'
import type { OrderSet } from '../../../types/userProfile'
import SubcategoryGroup from './SubcategoryGroup'
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  groupBySubcategory,
  groupBySubcategoryOrdered,
  isMriSubsection,
  formatSubcategory,
  IMAGING_SUBCATEGORY_ORDER,
  MRI_SUBSECTION_ORDER,
} from './subcategoryUtils'
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
}: OrdersLeftPanelProps) {
  const hasRecommendations = enrichedTests.length > 0
  const allRecommendedSelected =
    recommendedTestIds.length > 0 && recommendedTestIds.every((id) => selectedTests.includes(id))

  /**
   * Render imaging subcategories with MRI sub-section nesting.
   * Non-MRI modalities (xray, ct, ultrasound, fluoroscopy, nuclear_medicine)
   * render as flat SubcategoryGroups. All mri_* subcategories are collected
   * under a parent "MRI" collapsible section with nested SubcategoryGroups.
   */
  function renderImagingSubcategories(subcategoryGroups: Map<string, TestDefinition[]>) {
    // Separate MRI sub-sections from top-level modalities
    const topLevel: Array<[string, TestDefinition[]]> = []
    const mriSections: Array<[string, TestDefinition[]]> = []

    for (const [subcategory, tests] of subcategoryGroups) {
      if (isMriSubsection(subcategory)) {
        mriSections.push([subcategory, tests])
      } else if (subcategory === 'mri') {
        // Direct 'mri' subcategory tests go into MRI parent too
        mriSections.unshift([subcategory, tests])
      } else {
        topLevel.push([subcategory, tests])
      }
    }

    // Sort MRI sub-sections by defined order
    const mriSorted = groupBySubcategoryOrdered(
      mriSections.flatMap(([, tests]) => tests),
      MRI_SUBSECTION_ORDER,
    )

    // Count total MRI tests for the parent header
    const mriTotalCount = mriSections.reduce((acc, [, tests]) => acc + tests.length, 0)

    const elements: React.ReactNode[] = []

    // Render using IMAGING_SUBCATEGORY_ORDER to maintain proper order
    for (const modality of IMAGING_SUBCATEGORY_ORDER) {
      if (modality === 'mri') {
        // Render MRI as a parent group with nested sub-sections
        if (mriTotalCount > 0) {
          const mriSectionKey = 'imaging-mri'
          elements.push(
            <div key="mri-parent" className="subcategory-group">
              <button
                type="button"
                className={`subcategory-group__header${openSections.has(mriSectionKey) ? ' subcategory-group__header--open' : ''}`}
                onClick={() => onToggleSection(mriSectionKey)}
                aria-expanded={openSections.has(mriSectionKey)}
              >
                <span
                  className={`subcategory-group__chevron${openSections.has(mriSectionKey) ? ' subcategory-group__chevron--open' : ''}`}
                  aria-hidden="true"
                />
                <span className="subcategory-group__name">{formatSubcategory('mri')}</span>
                <span className="subcategory-group__count">({mriTotalCount})</span>
              </button>
              {openSections.has(mriSectionKey) && (
                <div className="subcategory-group__list">
                  {[...mriSorted.entries()].map(([subKey, tests]) => (
                    <SubcategoryGroup
                      key={subKey}
                      subcategory={subKey}
                      tests={tests}
                      selectedTests={selectedTests}
                      recommendedTestIds={recommendedTestIds}
                      checkboxClass={checkboxClass}
                      idPrefix="orders-imaging-mri"
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              )}
            </div>,
          )
        }
      } else {
        // Render non-MRI modality as a flat SubcategoryGroup
        const found = topLevel.find(([key]) => key === modality)
        if (found) {
          const [subcategory, tests] = found
          elements.push(
            <SubcategoryGroup
              key={subcategory}
              subcategory={subcategory}
              tests={tests}
              selectedTests={selectedTests}
              recommendedTestIds={recommendedTestIds}
              checkboxClass={checkboxClass}
              idPrefix="orders-imaging"
              onToggle={onToggle}
            />,
          )
        }
      }
    }

    // Render any remaining top-level modalities not in IMAGING_SUBCATEGORY_ORDER
    for (const [subcategory, tests] of topLevel) {
      if (!(IMAGING_SUBCATEGORY_ORDER as readonly string[]).includes(subcategory)) {
        elements.push(
          <SubcategoryGroup
            key={subcategory}
            subcategory={subcategory}
            tests={tests}
            selectedTests={selectedTests}
            recommendedTestIds={recommendedTestIds}
            checkboxClass={checkboxClass}
            idPrefix="orders-imaging"
            onToggle={onToggle}
          />,
        )
      }
    }

    return elements
  }

  return (
    <div className="orders-card__left-panel">
      {/* ── Section 1: Recommended Orders ──────────────────────────────────── */}
      {hasRecommendations && (
        <div className="orders-card__section">
          <button
            type="button"
            className={`orders-card__section-header${openSections.has('recommended') ? ' orders-card__section-header--open' : ''}`}
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
          className={`orders-card__section-header${openSections.has('frequentlyUsed') ? ' orders-card__section-header--open' : ''}`}
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
        const isImaging = cat === 'imaging'
        const subcategoryGroups = isImaging
          ? groupBySubcategoryOrdered(catTests, IMAGING_SUBCATEGORY_ORDER)
          : groupBySubcategory(catTests)
        return (
          <div key={cat} className="orders-card__section">
            <button
              type="button"
              className={`orders-card__section-header${openSections.has(sectionKey) ? ' orders-card__section-header--open' : ''}`}
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
                {isImaging
                  ? renderImagingSubcategories(subcategoryGroups)
                  : [...subcategoryGroups.entries()].map(([subcategory, tests]) => (
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
    </div>
  )
}
