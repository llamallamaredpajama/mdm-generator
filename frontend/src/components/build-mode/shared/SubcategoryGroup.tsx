import { useState } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import { formatSubcategory } from './subcategoryUtils'
import './SubcategoryGroup.css'

interface SubcategoryGroupProps {
  subcategory: string
  tests: TestDefinition[]
  selectedTests: string[]
  recommendedTestIds: string[]
  checkboxClass: string
  idPrefix: string
  onToggle: (testId: string) => void
}

export default function SubcategoryGroup({
  subcategory,
  tests,
  selectedTests,
  recommendedTestIds,
  checkboxClass,
  idPrefix,
  onToggle,
}: SubcategoryGroupProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="subcategory-group">
      <button
        type="button"
        className="subcategory-group__header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span
          className={`subcategory-group__chevron${open ? ' subcategory-group__chevron--open' : ''}`}
          aria-hidden="true"
        />
        <span className="subcategory-group__name">{formatSubcategory(subcategory)}</span>
        <span className="subcategory-group__count">({tests.length})</span>
      </button>
      {open && (
        <div className="subcategory-group__list">
          {tests.map((test) => (
            <div key={test.id} className="orders-card__test-row">
              <input
                type="checkbox"
                id={`${idPrefix}-${test.id}`}
                className={checkboxClass}
                checked={selectedTests.includes(test.id)}
                onChange={() => onToggle(test.id)}
              />
              <label htmlFor={`${idPrefix}-${test.id}`} className="orders-card__test-label">
                <span className="orders-card__test-name">{test.name}</span>
                {recommendedTestIds.includes(test.id) && (
                  <span className="orders-card__ai-badge">AI</span>
                )}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
