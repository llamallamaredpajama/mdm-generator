import { useState, useRef, useEffect, useCallback } from 'react'
import type { OrderSet } from '../../../types/userProfile'
import './CreateOrdersetPopup.css'

interface CreateOrdersetPopupProps {
  selectedTests: string[]
  existingOrderSets: OrderSet[]
  onSave: (name: string, testIds: string[]) => Promise<OrderSet | null>
  onUpdate: (id: string, data: { tests: string[] }) => Promise<void>
  onClose: () => void
}

export default function CreateOrdersetPopup({
  selectedTests,
  existingOrderSets,
  onSave,
  onUpdate,
  onClose,
}: CreateOrdersetPopupProps) {
  const [mode, setMode] = useState<'create' | 'addTo'>('create')
  const [name, setName] = useState('')
  const [selectedOrderSetId, setSelectedOrderSetId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Autofocus name input
  useEffect(() => {
    if (mode === 'create' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid catching the triggering click
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSaveNew = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name for the orderset')
      return
    }
    if (existingOrderSets.some((os) => os.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('An orderset with this name already exists')
      return
    }
    setError('')
    setSaving(true)
    try {
      const result = await onSave(trimmed, selectedTests)
      if (result) {
        onClose()
      } else {
        setError('Failed to save orderset')
      }
    } catch (err) {
      console.error('CreateOrdersetPopup: save failed', err)
      setError('Failed to save orderset')
    } finally {
      setSaving(false)
    }
  }, [name, existingOrderSets, selectedTests, onSave, onClose])

  const handleAddToExisting = useCallback(async () => {
    if (!selectedOrderSetId) {
      setError('Select an orderset to add items to')
      return
    }
    const target = existingOrderSets.find((os) => os.id === selectedOrderSetId)
    if (!target) {
      setError('Selected orderset no longer exists')
      return
    }

    setError('')
    setSaving(true)
    try {
      const merged = new Set([...target.tests, ...selectedTests])
      await onUpdate(target.id, { tests: Array.from(merged) })
      onClose()
    } catch (err) {
      console.error('CreateOrdersetPopup: update failed', err)
      setError('Failed to update orderset')
    } finally {
      setSaving(false)
    }
  }, [selectedOrderSetId, existingOrderSets, selectedTests, onUpdate, onClose])

  return (
    <div ref={popupRef} className="create-orderset-popup">
      <div className="create-orderset-popup__header">
        <span className="create-orderset-popup__title">
          {selectedTests.length} item{selectedTests.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Mode tabs */}
      <div className="create-orderset-popup__tabs">
        <button
          type="button"
          className={`create-orderset-popup__tab${mode === 'create' ? ' create-orderset-popup__tab--active' : ''}`}
          onClick={() => {
            setMode('create')
            setError('')
          }}
        >
          New Orderset
        </button>
        {existingOrderSets.length > 0 && (
          <button
            type="button"
            className={`create-orderset-popup__tab${mode === 'addTo' ? ' create-orderset-popup__tab--active' : ''}`}
            onClick={() => {
              setMode('addTo')
              setError('')
            }}
          >
            Add to Existing
          </button>
        )}
      </div>

      <div className="create-orderset-popup__body">
        {mode === 'create' ? (
          <input
            ref={inputRef}
            type="text"
            className="create-orderset-popup__input"
            placeholder="Orderset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveNew()
            }}
          />
        ) : (
          <select
            className="create-orderset-popup__select"
            value={selectedOrderSetId}
            onChange={(e) => setSelectedOrderSetId(e.target.value)}
          >
            <option value="">Select an orderset...</option>
            {existingOrderSets.map((os) => (
              <option key={os.id} value={os.id}>
                {os.name} ({os.tests.length} tests)
              </option>
            ))}
          </select>
        )}

        {error && <span className="create-orderset-popup__error">{error}</span>}
      </div>

      <div className="create-orderset-popup__actions">
        <button
          type="button"
          className="create-orderset-popup__btn create-orderset-popup__btn--primary"
          onClick={mode === 'create' ? handleSaveNew : handleAddToExisting}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="create-orderset-popup__btn create-orderset-popup__btn--secondary"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
