/**
 * OrdersetManager Component
 *
 * Large modal overlay that unifies order browsing and orderset editing
 * into a single two-mode experience. Replaces the old OrderSelector +
 * SaveOrderSetModal flow with inline search, category browsing,
 * saved orderset management, and inline orderset creation.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { TestDefinition, TestCategory } from '../../../types/libraries'
import type { OrderSet } from '../../../types/userProfile'
import './OrdersetManager.css'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

const CATEGORY_LABELS: Record<TestCategory, string> = {
  labs: 'Labs',
  imaging: 'Imaging',
  procedures_poc: 'Procedures / POC',
}

const FREQUENTLY_USED_NAME = '__frequently_used__'

// ── Props ────────────────────────────────────────────────────────────────────

interface OrdersetManagerProps {
  mode: 'browse' | 'edit'
  editTargetOrderSet?: OrderSet
  tests: TestDefinition[]
  selectedTests: string[]
  recommendedTestIds: string[]
  onSelectionChange: (testIds: string[]) => void
  onClose: () => void
  onAcceptAllRecommended: () => void
  onAcceptSelected: () => void
  // Orderset CRUD
  orderSets: OrderSet[]
  onSaveOrderSet: (name: string, testIds: string[]) => Promise<OrderSet | null>
  onUpdateOrderSet: (id: string, data: { tests: string[] }) => Promise<void>
  onDeleteOrderSet: (id: string) => Promise<void>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrdersetManager({
  mode,
  editTargetOrderSet,
  tests,
  selectedTests,
  recommendedTestIds,
  onSelectionChange,
  onClose,
  onAcceptAllRecommended,
  onAcceptSelected,
  orderSets,
  onSaveOrderSet,
  onUpdateOrderSet,
  onDeleteOrderSet,
}: OrdersetManagerProps) {
  // ── State ──────────────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<TestCategory>>(
    () => new Set(CATEGORY_ORDER),
  )
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createError, setCreateError] = useState('')

  const createInputRef = useRef<HTMLInputElement>(null)

  // ── Close on Escape ────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // ── Autofocus create input ─────────────────────────────────────────────────

  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [showCreateForm])

  // ── Memos ──────────────────────────────────────────────────────────────────

  /** Tests grouped by category, filtered by search query */
  const filteredTestsByCategory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const map = new Map<TestCategory, TestDefinition[]>()

    for (const cat of CATEGORY_ORDER) {
      const catTests = tests.filter((t) => t.category === cat)
      if (query) {
        const filtered = catTests.filter(
          (t) =>
            t.name.toLowerCase().includes(query) || t.subcategory.toLowerCase().includes(query),
        )
        map.set(cat, filtered)
      } else {
        map.set(cat, catTests)
      }
    }
    return map
  }, [tests, searchQuery])

  /** User-visible ordersets (excluding __frequently_used__) */
  const userOrderSets = useMemo(
    () => orderSets.filter((os) => os.name !== FREQUENTLY_USED_NAME),
    [orderSets],
  )

  const selectedCount = selectedTests.length

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  const toggleCategory = useCallback((cat: TestCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }, [])

  const handleApplyOrderSet = useCallback(
    (os: OrderSet) => {
      const merged = new Set([...selectedTests, ...os.tests])
      onSelectionChange(Array.from(merged))
    },
    [selectedTests, onSelectionChange],
  )

  const handleCreateOrderSet = useCallback(async () => {
    const trimmed = createName.trim()
    if (!trimmed) {
      setCreateError('Enter a name for the orderset')
      return
    }
    if (selectedCount === 0) {
      setCreateError('Select items first to create an orderset')
      return
    }
    setCreateError('')
    const result = await onSaveOrderSet(trimmed, selectedTests)
    if (result) {
      setShowCreateForm(false)
      setCreateName('')
    }
  }, [createName, selectedCount, selectedTests, onSaveOrderSet])

  const handleCreateAndUse = useCallback(async () => {
    const trimmed = createName.trim()
    if (!trimmed) {
      setCreateError('Enter a name for the orderset')
      return
    }
    if (selectedCount === 0) {
      setCreateError('Select items first to create an orderset')
      return
    }
    setCreateError('')
    const result = await onSaveOrderSet(trimmed, selectedTests)
    if (result) {
      onAcceptSelected()
      onClose()
    }
  }, [createName, selectedCount, selectedTests, onSaveOrderSet, onAcceptSelected, onClose])

  const handleUpdateOrderSet = useCallback(async () => {
    if (!editTargetOrderSet) return
    await onUpdateOrderSet(editTargetOrderSet.id, { tests: selectedTests })
    onClose()
  }, [editTargetOrderSet, selectedTests, onUpdateOrderSet, onClose])

  const handleOpenCreateForm = useCallback(() => {
    if (selectedCount === 0) {
      setCreateError('Select items first to create an orderset')
      return
    }
    setCreateError('')
    setCreateName('')
    setShowCreateForm(true)
  }, [selectedCount])

  const handleAcceptAllAndClose = useCallback(() => {
    onAcceptAllRecommended()
    onClose()
  }, [onAcceptAllRecommended, onClose])

  const handleAcceptSelectedAndClose = useCallback(() => {
    onAcceptSelected()
    onClose()
  }, [onAcceptSelected, onClose])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="orderset-manager__backdrop" onClick={onClose}>
      <div
        className="orderset-manager"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Orderset Manager"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="orderset-manager__header">
          <h3 className="orderset-manager__title">Orderset Manager</h3>
          <button
            type="button"
            className="orderset-manager__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="orderset-manager__search">
          <input
            type="text"
            className="orderset-manager__search-input"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Body (scrollable) ─────────────────────────────────────────── */}
        <div className="orderset-manager__body">
          {/* Category sections */}
          {CATEGORY_ORDER.map((cat) => {
            const catTests = filteredTestsByCategory.get(cat) ?? []
            if (catTests.length === 0) return null
            const isOpen = openCategories.has(cat)

            return (
              <div key={cat} className="orderset-manager__category">
                <button
                  type="button"
                  className="orderset-manager__category-header"
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`orderset-manager__chevron${isOpen ? ' orderset-manager__chevron--open' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="orderset-manager__category-name">
                    {CATEGORY_LABELS[cat]} ({catTests.length})
                  </span>
                </button>
                {isOpen && (
                  <div className="orderset-manager__test-list">
                    {catTests.map((test) => (
                      <div key={test.id} className="orderset-manager__test-row">
                        <input
                          type="checkbox"
                          id={`osm-${test.id}`}
                          className="orderset-manager__checkbox"
                          checked={selectedTests.includes(test.id)}
                          onChange={() => handleToggle(test.id)}
                        />
                        <label htmlFor={`osm-${test.id}`} className="orderset-manager__test-label">
                          <span className="orderset-manager__test-name">{test.name}</span>
                          <span className="orderset-manager__subcategory-tag">
                            {test.subcategory}
                          </span>
                          {recommendedTestIds.includes(test.id) && (
                            <span className="orderset-manager__ai-badge">AI</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Saved Ordersets ────────────────────────────────────────── */}
          {userOrderSets.length > 0 && (
            <div className="orderset-manager__saved-section">
              <h4 className="orderset-manager__saved-title">Saved Ordersets</h4>
              <div className="orderset-manager__saved-list">
                {userOrderSets.map((os) => (
                  <div key={os.id} className="orderset-manager__orderset-item">
                    <div className="orderset-manager__orderset-info">
                      <span className="orderset-manager__orderset-name">{os.name}</span>
                      <span className="orderset-manager__orderset-count">
                        {os.tests.length} test{os.tests.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="orderset-manager__orderset-actions">
                      <button
                        type="button"
                        className="orderset-manager__orderset-apply-btn"
                        onClick={() => handleApplyOrderSet(os)}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="orderset-manager__orderset-delete-btn"
                        onClick={() => onDeleteOrderSet(os.id)}
                        aria-label={`Delete ${os.name}`}
                      >
                        &#128465;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Create Form (positioned above footer) ────────────────────── */}
        {showCreateForm && (
          <div className="orderset-manager__create-form">
            <h5 className="orderset-manager__create-title">Create Orderset</h5>
            <input
              ref={createInputRef}
              type="text"
              className="orderset-manager__create-input"
              placeholder="Orderset name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateOrderSet()
              }}
            />
            <span className="orderset-manager__create-count">
              {selectedCount} test{selectedCount !== 1 ? 's' : ''} selected
            </span>
            {createError && <span className="orderset-manager__alert">{createError}</span>}
            <div className="orderset-manager__create-actions">
              <button
                type="button"
                className="orderset-manager__footer-btn orderset-manager__footer-btn--primary"
                onClick={handleCreateAndUse}
                disabled={!createName.trim()}
              >
                Accept and Use Now
              </button>
              <button
                type="button"
                className="orderset-manager__footer-btn orderset-manager__footer-btn--secondary"
                onClick={handleCreateOrderSet}
                disabled={!createName.trim()}
              >
                Save
              </button>
              <button
                type="button"
                className="orderset-manager__footer-btn orderset-manager__footer-btn--secondary"
                onClick={() => {
                  setShowCreateForm(false)
                  setCreateError('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="orderset-manager__footer">
          {/* Inline alert (no create form open) */}
          {createError && !showCreateForm && (
            <span className="orderset-manager__alert">{createError}</span>
          )}

          <button
            type="button"
            className="orderset-manager__footer-btn orderset-manager__footer-btn--primary"
            onClick={handleAcceptAllAndClose}
            disabled={recommendedTestIds.length === 0}
          >
            Accept All Recommended
          </button>
          <button
            type="button"
            className="orderset-manager__footer-btn orderset-manager__footer-btn--secondary"
            onClick={handleAcceptSelectedAndClose}
            disabled={selectedCount === 0}
          >
            Accept Selected
          </button>

          {mode === 'browse' && (
            <button
              type="button"
              className="orderset-manager__footer-btn orderset-manager__footer-btn--secondary"
              onClick={handleOpenCreateForm}
            >
              Create Orderset
            </button>
          )}

          {mode === 'edit' && editTargetOrderSet && (
            <button
              type="button"
              className="orderset-manager__footer-btn orderset-manager__footer-btn--primary"
              onClick={handleUpdateOrderSet}
              disabled={selectedCount === 0}
            >
              Update Orderset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
