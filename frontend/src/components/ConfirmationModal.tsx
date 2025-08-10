import { useState } from 'react'
import './ConfirmationModal.css'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  text: string
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, text }: ConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false)

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
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Submission</h2>
        
        <div className="modal-warning">
          <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

        <div className="modal-info">
          <p><strong>Token estimate:</strong> ~{Math.ceil(text.length / 4)} tokens</p>
          <p className="info-text">Your narrative will be processed to generate MDM documentation.</p>
        </div>

        <div className="modal-actions">
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!confirmed}
            className="btn-primary"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}