import { useEffect } from 'react'
import type { EncounterMode } from '../../types/encounter'
import './NewEncounterSheet.css'

interface NewEncounterSheetProps {
  open: boolean
  onClose: () => void
  onCreateEncounter: (mode: EncounterMode) => void
  isCreating: boolean
}

export default function NewEncounterSheet({
  open,
  onClose,
  onCreateEncounter,
  isCreating,
}: NewEncounterSheetProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, isCreating])

  if (!open) return null

  return (
    <div
      className="encounter-sheet__backdrop"
      data-testid="sheet-backdrop"
      onClick={() => !isCreating && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create new encounter"
    >
      <div className="encounter-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="encounter-sheet__title">New Encounter</h3>
        <div className="encounter-sheet__options">
          <button
            type="button"
            className="encounter-sheet__option encounter-sheet__option--quick"
            onClick={() => onCreateEncounter('quick')}
            disabled={isCreating}
          >
            <svg
              className="encounter-sheet__option-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="encounter-sheet__option-label">Quick</span>
            <span className="encounter-sheet__option-desc">One-shot MDM generation</span>
          </button>
          <button
            type="button"
            className="encounter-sheet__option encounter-sheet__option--build"
            onClick={() => onCreateEncounter('build')}
            disabled={isCreating}
          >
            <svg
              className="encounter-sheet__option-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="encounter-sheet__option-label">Build</span>
            <span className="encounter-sheet__option-desc">3-section guided workflow</span>
          </button>
        </div>
      </div>
    </div>
  )
}
