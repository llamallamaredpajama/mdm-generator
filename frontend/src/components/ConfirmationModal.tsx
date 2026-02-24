import { useState, useEffect, useRef, useCallback } from 'react'
import './ConfirmationModal.css'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm }: ConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus trap: capture previous focus, auto-focus dialog on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Small delay to let the DOM render
      const timer = setTimeout(() => {
        dialogRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    } else {
      // Return focus when closing
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Keyboard handling: Escape closes, Tab traps focus
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setConfirmed(false)
      onClose()
      return
    }

    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
  }, [onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm()
      setConfirmed(false) // Reset for next use
    }
  }

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={dialogRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirmation-modal-title">Confirm Submission</h2>

        <div className="modal-warning" role="alert">
          <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>Please confirm before proceeding:</p>
        </div>

        <div className="confirmation-checkbox">
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I confirm that no Protected Health Information (PHI) is included in this narrative</span>
          </label>
        </div>

        <div className="modal-actions">
          <button
            onClick={handleConfirm}
            disabled={!confirmed}
            className="btn-primary"
          >
            Submit
          </button>
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}