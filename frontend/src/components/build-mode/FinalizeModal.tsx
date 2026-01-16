import { useState } from 'react'
import type { EncounterStatus } from '../../types/encounter'
import '../ConfirmationModal.css'
import './FinalizeModal.css'

interface FinalizeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /** Time remaining in milliseconds */
  timeRemaining: number
  /** Current status of the encounter */
  encounterStatus: EncounterStatus
  /** Whether finalization is in progress */
  isProcessing?: boolean
}

/**
 * Modal shown when:
 * 1. Encounter is approaching 12h expiry (< 1h remaining)
 * 2. User clicks finalize with incomplete sections
 *
 * Provides warning and confirmation before finalizing encounter.
 */
export default function FinalizeModal({
  isOpen,
  onClose,
  onConfirm,
  timeRemaining,
  encounterStatus,
  isProcessing = false,
}: FinalizeModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  // Calculate formatted time remaining
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const isExpired = timeRemaining <= 0
  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000 // < 1 hour

  // Check if sections are incomplete
  const isIncomplete = encounterStatus !== 'section2_done' && encounterStatus !== 'finalized'

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
    <div className="modal-overlay">
      <div className="modal-content finalize-modal">
        <h2>
          {isExpired ? 'Encounter Expired' : isExpiringSoon ? 'Time Running Out' : 'Finalize Encounter'}
        </h2>

        {/* Expiry Warning */}
        {(isExpired || isExpiringSoon) && (
          <div className={`modal-warning ${isExpired ? 'warning-critical' : 'warning-urgent'}`}>
            <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              {isExpired ? (
                <p>This encounter has exceeded the 12-hour active window.</p>
              ) : (
                <p>
                  Only <strong>{formattedTime}</strong> remaining in the active window.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Incomplete Sections Warning */}
        {isIncomplete && !isExpired && (
          <div className="modal-warning warning-incomplete">
            <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Some sections are incomplete. Finalizing now will generate MDM with available data.</p>
          </div>
        )}

        {/* What happens next */}
        <div className="modal-info finalize-info">
          <h3>What happens when you finalize:</h3>
          <ul className="finalize-list">
            <li>
              <span className="list-icon">✓</span>
              Your MDM will be generated from all available section data
            </li>
            <li>
              <span className="list-icon">✓</span>
              The encounter will move to <strong>archived</strong> status
            </li>
            <li>
              <span className="list-icon">✓</span>
              You can still view the generated MDM for 12 more hours
            </li>
            <li>
              <span className="list-icon">×</span>
              No further edits or submissions will be possible
            </li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <div className="confirmation-checkbox">
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isProcessing}
            />
            <span>I understand that finalizing will lock this encounter and generate the final MDM</span>
          </label>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={handleClose} className="btn-secondary" disabled={isProcessing}>
            Continue Editing
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || isProcessing}
            className={`btn-primary ${isExpired || isExpiringSoon ? 'btn-urgent' : ''}`}
          >
            {isProcessing ? (
              <>
                <span className="spinner-small" />
                Processing...
              </>
            ) : (
              'Finalize Now'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
