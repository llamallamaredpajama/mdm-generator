import { useMemo } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import './WorkupCard.css'

const CATEGORY_LABELS: Record<TestCategory, string> = {
  labs: 'Labs',
  imaging: 'Imaging',
  procedures_poc: 'Procedures / POC',
}

interface WorkupCardProps {
  tests: TestDefinition[]
  recommendedTestIds: string[]
  selectedTests: string[]
  onSelectionChange: (testIds: string[]) => void
  onOpenOrderSelector: () => void
  onSaveOrderSet?: () => void
  loading: boolean
}

export default function WorkupCard({
  tests,
  recommendedTestIds,
  selectedTests,
  onSelectionChange,
  onOpenOrderSelector,
  onSaveOrderSet,
  loading,
}: WorkupCardProps) {
  const recommendedTests = useMemo(
    () => tests.filter((t) => recommendedTestIds.includes(t.id)),
    [tests, recommendedTestIds]
  )

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

  return (
    <div className="workup-card">
      <div className="workup-card__header">
        <div className="workup-card__title-group">
          <h4 className="workup-card__title">Recommended Workup</h4>
          {selectedTests.length > 0 && (
            <span className="workup-card__count-badge">
              {selectedTests.length} selected
            </span>
          )}
        </div>
        <div className="workup-card__actions">
          <button
            type="button"
            className="workup-card__action-btn workup-card__action-btn--accept"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
          <button
            type="button"
            className="workup-card__action-btn workup-card__action-btn--edit"
            onClick={onOpenOrderSelector}
          >
            Edit
          </button>
          {onSaveOrderSet && selectedTests.length > 0 && (
            <button
              type="button"
              className="workup-card__action-btn workup-card__action-btn--save"
              onClick={onSaveOrderSet}
              data-testid="save-orderset-btn"
            >
              Save Set
            </button>
          )}
        </div>
      </div>

      {recommendedTests.length === 0 ? (
        <p className="workup-card__empty">No recommended tests identified</p>
      ) : (
        <div className="workup-card__list">
          {recommendedTests.map((test) => (
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
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
