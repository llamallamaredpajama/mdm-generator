import { useState, useMemo } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import type { OrderSet } from '../../../types/userProfile'
import './OrdersRightPanel.css'

interface OrdersRightPanelProps {
  tests: TestDefinition[]
  userOrderSets: OrderSet[]
  selectedTests: string[]
  checkboxClass: string
  openSections: Set<string>
  onToggle: (testId: string) => void
  onToggleSection: (key: string) => void
  onOrdersetToggle: (orderSet: OrderSet) => void
  isOrdersetFullySelected: (os: OrderSet) => boolean
  onOpenOrdersetManager: (mode: 'browse' | 'edit', targetOrderSetId?: string) => void
}

export default function OrdersRightPanel({
  tests,
  userOrderSets,
  selectedTests,
  checkboxClass,
  openSections,
  onToggle,
  onToggleSection,
  onOrdersetToggle,
  isOrdersetFullySelected,
  onOpenOrdersetManager,
}: OrdersRightPanelProps) {
  const [expandedOrderSets, setExpandedOrderSets] = useState<Set<string>>(() => new Set())

  // Build test lookup for expanding orderset items
  const testLookup = useMemo(() => {
    const map = new Map<string, TestDefinition>()
    for (const t of tests) map.set(t.id, t)
    return map
  }, [tests])

  // Sort ordersets alphabetically
  const sortedOrderSets = useMemo(
    () => [...userOrderSets].sort((a, b) => a.name.localeCompare(b.name)),
    [userOrderSets],
  )

  const toggleExpanded = (osId: string) => {
    setExpandedOrderSets((prev) => {
      const next = new Set(prev)
      if (next.has(osId)) next.delete(osId)
      else next.add(osId)
      return next
    })
  }

  return (
    <div className="orders-card__panel orders-right-panel">
      {/* Panel Header */}
      <div className="orders-card__panel-header">
        <h5 className="orders-card__panel-title">Order Sets</h5>
        <button
          type="button"
          className="orders-card__action-btn orders-card__action-btn--edit"
          onClick={() => onOpenOrdersetManager('browse')}
        >
          Manage
        </button>
      </div>

      {/* Frequently Used Order Sets */}
      <div className="orders-card__section">
        <button
          type="button"
          className="orders-card__section-header"
          onClick={() => onToggleSection('freqOrderSets')}
          aria-expanded={openSections.has('freqOrderSets')}
        >
          <span
            className={`orders-card__chevron${openSections.has('freqOrderSets') ? ' orders-card__chevron--open' : ''}`}
            aria-hidden="true"
          />
          <span className="orders-card__section-title">Frequently Used Order Sets</span>
        </button>
        {openSections.has('freqOrderSets') && (
          <div className="orders-card__section-body">
            <button
              type="button"
              className="orders-card__add-items-btn"
              onClick={() => onOpenOrdersetManager('browse')}
            >
              Add Items
            </button>
          </div>
        )}
      </div>

      {/* All Order Sets */}
      {sortedOrderSets.length > 0 && (
        <div className="orders-card__section">
          <button
            type="button"
            className="orders-card__section-header"
            onClick={() => onToggleSection('allOrderSets')}
            aria-expanded={openSections.has('allOrderSets')}
          >
            <span
              className={`orders-card__chevron${openSections.has('allOrderSets') ? ' orders-card__chevron--open' : ''}`}
              aria-hidden="true"
            />
            <span className="orders-card__section-title">
              All Order Sets ({sortedOrderSets.length})
            </span>
          </button>
          {openSections.has('allOrderSets') && (
            <div className="orders-card__section-body">
              <div className="orders-right-panel__list">
                {sortedOrderSets.map((os) => {
                  const isExpanded = expandedOrderSets.has(os.id)
                  const isFullySelected = isOrdersetFullySelected(os)

                  return (
                    <div key={os.id} className="orders-right-panel__orderset">
                      <div className="orders-right-panel__orderset-row">
                        <input
                          type="checkbox"
                          id={`orders-os-${os.id}`}
                          className={checkboxClass}
                          checked={isFullySelected}
                          onChange={() => onOrdersetToggle(os)}
                        />
                        <button
                          type="button"
                          className="orders-right-panel__orderset-toggle"
                          onClick={() => toggleExpanded(os.id)}
                          aria-expanded={isExpanded}
                        >
                          <span
                            className={`orders-card__chevron${isExpanded ? ' orders-card__chevron--open' : ''}`}
                            aria-hidden="true"
                          />
                          <span className="orders-card__test-name">{os.name}</span>
                          <span className="orders-card__orderset-count">
                            {os.tests.length} tests
                          </span>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="orders-right-panel__orderset-items">
                          {os.tests.map((testId) => {
                            const test = testLookup.get(testId)
                            if (!test) return null
                            return (
                              <div key={testId} className="orders-card__test-row">
                                <input
                                  type="checkbox"
                                  id={`orders-ositem-${os.id}-${testId}`}
                                  className={checkboxClass}
                                  checked={selectedTests.includes(testId)}
                                  onChange={() => onToggle(testId)}
                                />
                                <label
                                  htmlFor={`orders-ositem-${os.id}-${testId}`}
                                  className="orders-card__test-label"
                                >
                                  <span className="orders-card__test-name">{test.name}</span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
