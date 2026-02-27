import { useState, useMemo } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import './OrderSelector.css'

const CATEGORY_ORDER: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

const CATEGORY_LABELS: Record<TestCategory, string> = {
  labs: 'Labs',
  imaging: 'Imaging',
  procedures_poc: 'Procedures / POC',
}

interface OrderSelectorProps {
  tests: TestDefinition[]
  selectedTests: string[]
  recommendedTestIds: string[]
  onSelectionChange: (testIds: string[]) => void
  onBack: () => void
  /** B4: Optional accept+continue callback — selects all recommended and advances */
  onAcceptContinue?: () => void
  /** B3: Optional callback to save current selection as an order set */
  onSaveOrderSet?: () => void
}

export default function OrderSelector({
  tests,
  selectedTests,
  recommendedTestIds,
  onSelectionChange,
  onBack,
  onAcceptContinue,
  onSaveOrderSet,
}: OrderSelectorProps) {
  const testsByCategory = useMemo(() => {
    const grouped: Record<TestCategory, TestDefinition[]> = {
      labs: [],
      imaging: [],
      procedures_poc: [],
    }
    for (const test of tests) {
      grouped[test.category].push(test)
    }
    return grouped
  }, [tests])

  const categoryCounts = useMemo(() => {
    const counts: Record<TestCategory, number> = { labs: 0, imaging: 0, procedures_poc: 0 }
    for (const id of selectedTests) {
      const test = tests.find((t) => t.id === id)
      if (test) counts[test.category]++
    }
    return counts
  }, [tests, selectedTests])

  function handleToggle(testId: string) {
    if (selectedTests.includes(testId)) {
      onSelectionChange(selectedTests.filter((id) => id !== testId))
    } else {
      onSelectionChange([...selectedTests, testId])
    }
  }

  function handleSelectAllCategory(category: TestCategory) {
    const categoryIds = testsByCategory[category].map((t) => t.id)
    const merged = new Set([...selectedTests, ...categoryIds])
    onSelectionChange(Array.from(merged))
  }

  function handleClearCategory(category: TestCategory) {
    const categoryIds = new Set(testsByCategory[category].map((t) => t.id))
    onSelectionChange(selectedTests.filter((id) => !categoryIds.has(id)))
  }

  // All categories default to open
  const [openCategories, setOpenCategories] = useState<Set<TestCategory>>(
    () => new Set(CATEGORY_ORDER),
  )

  function toggleCategory(category: TestCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const totalSelected = selectedTests.length
  const breakdownParts = CATEGORY_ORDER.filter((cat) => categoryCounts[cat] > 0).map(
    (cat) => `${categoryCounts[cat]} ${CATEGORY_LABELS[cat]}`,
  )

  return (
    <div className="order-selector">
      <button type="button" className="order-selector__back-btn" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <h3 className="order-selector__title">Order Selection</h3>

      {CATEGORY_ORDER.map((category) => {
        const categoryTests = testsByCategory[category]
        if (categoryTests.length === 0) return null
        const isOpen = openCategories.has(category)
        return (
          <div key={category} className="order-selector__category">
            <div className="order-selector__category-header">
              <button
                type="button"
                className="order-selector__category-toggle"
                onClick={() => toggleCategory(category)}
                aria-expanded={isOpen}
              >
                <span
                  className={`order-selector__chevron ${isOpen ? 'order-selector__chevron--open' : ''}`}
                >
                  &#9654;
                </span>
                <h5 className="order-selector__category-name">{CATEGORY_LABELS[category]}</h5>
              </button>
              <div className="order-selector__category-actions">
                <button
                  type="button"
                  className="order-selector__category-btn"
                  onClick={() => handleSelectAllCategory(category)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="order-selector__category-btn"
                  onClick={() => handleClearCategory(category)}
                >
                  Clear All
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="order-selector__test-list">
                {categoryTests.map((test) => (
                  <div key={test.id} className="order-selector__test-row">
                    <input
                      type="checkbox"
                      id={`order-test-${test.id}`}
                      className="order-selector__checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => handleToggle(test.id)}
                    />
                    <label htmlFor={`order-test-${test.id}`} className="order-selector__test-label">
                      {test.name}
                      <span className="order-selector__subcategory-tag">{test.subcategory}</span>
                      {recommendedTestIds.includes(test.id) && (
                        <span className="order-selector__ai-badge">AI</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {totalSelected > 0 && (
        <div className="order-selector__summary">
          {totalSelected} total: {breakdownParts.join(', ')}
        </div>
      )}

      {/* B3/B4: Footer actions */}
      <div className="order-selector__footer">
        {onSaveOrderSet && totalSelected > 0 && (
          <button type="button" className="order-selector__save-set-btn" onClick={onSaveOrderSet}>
            Save as Order Set
          </button>
        )}
        {onAcceptContinue && (
          <button type="button" className="order-selector__accept-btn" onClick={onAcceptContinue}>
            Accept & Continue
          </button>
        )}
      </div>
    </div>
  )
}
