import { useState, useEffect, useCallback } from 'react'
import { useEncounterList } from '../../hooks/useEncounterList'
import EncounterCard from './EncounterCard'
import './EncounterDashboard.css'

interface EncounterDashboardProps {
  /** Callback when an encounter is selected for editing */
  onSelectEncounter: (id: string) => void
}

interface NewEncounterFormState {
  isOpen: boolean
  roomNumber: string
  chiefComplaint: string
  isSubmitting: boolean
  error: string | null
}

interface ToastNotification {
  id: string
  message: string
  type: 'error' | 'success'
}

/**
 * Dashboard component displaying a grid of encounter cards.
 * Provides ability to create new encounters and select existing ones for editing.
 */
export default function EncounterDashboard({ onSelectEncounter }: EncounterDashboardProps) {
  const { encounters, loading, error, createEncounter, deleteEncounter } = useEncounterList()

  const [formState, setFormState] = useState<NewEncounterFormState>({
    isOpen: false,
    roomNumber: '',
    chiefComplaint: '',
    isSubmitting: false,
    error: null,
  })

  // Toast notifications for user feedback
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  /**
   * Add a toast notification
   */
  const addToast = useCallback((message: string, type: 'error' | 'success') => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  /**
   * Remove a toast notification
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return

    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 5000)
    )

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [toasts, removeToast])

  const handleOpenNewEncounter = () => {
    setFormState((prev) => ({ ...prev, isOpen: true, error: null }))
  }

  const handleCloseNewEncounter = () => {
    setFormState({
      isOpen: false,
      roomNumber: '',
      chiefComplaint: '',
      isSubmitting: false,
      error: null,
    })
  }

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.roomNumber.trim() || !formState.chiefComplaint.trim()) {
      setFormState((prev) => ({ ...prev, error: 'Room number and chief complaint are required' }))
      return
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const encounterId = await createEncounter(formState.roomNumber, formState.chiefComplaint)
      handleCloseNewEncounter()
      onSelectEncounter(encounterId)
    } catch (err) {
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Failed to create encounter',
      }))
    }
  }

  const handleDeleteEncounter = async (encounterId: string) => {
    try {
      await deleteEncounter(encounterId)
      // Success feedback not needed as the card disappears from the list
    } catch (err) {
      console.error('Failed to delete encounter:', err)

      // Determine user-friendly error message
      let message = 'Failed to delete encounter. Please try again.'
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          message = 'Cannot delete this encounter. Only draft or archived encounters can be deleted.'
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          message = 'Network error. Please check your connection and try again.'
        }
      }

      addToast(message, 'error')
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="encounter-dashboard">
        <div className="encounter-dashboard__grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="encounter-dashboard__skeleton-card">
              <div className="encounter-dashboard__skeleton-header" />
              <div className="encounter-dashboard__skeleton-body" />
              <div className="encounter-dashboard__skeleton-footer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="encounter-dashboard">
        <div className="encounter-dashboard__error">
          <span className="encounter-dashboard__error-icon" aria-hidden="true">
            ⚠️
          </span>
          <p className="encounter-dashboard__error-message">
            {error.message || 'Failed to load encounters'}
          </p>
          <button
            type="button"
            className="encounter-dashboard__retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="encounter-dashboard">
      <div className="encounter-dashboard__grid">
        {/* New Encounter Card */}
        {formState.isOpen ? (
          <form className="encounter-dashboard__new-form" onSubmit={handleCreateEncounter}>
            <div className="encounter-dashboard__form-header">
              <h3>New Encounter</h3>
              <button
                type="button"
                className="encounter-dashboard__close-button"
                onClick={handleCloseNewEncounter}
                aria-label="Cancel new encounter"
              >
                ×
              </button>
            </div>

            <div className="encounter-dashboard__form-field">
              <label htmlFor="roomNumber">Room / Bed</label>
              <input
                id="roomNumber"
                type="text"
                placeholder="e.g., Room 5, Bed 2A"
                value={formState.roomNumber}
                onChange={(e) => setFormState((prev) => ({ ...prev, roomNumber: e.target.value }))}
                disabled={formState.isSubmitting}
                autoFocus
              />
            </div>

            <div className="encounter-dashboard__form-field">
              <label htmlFor="chiefComplaint">Chief Complaint</label>
              <input
                id="chiefComplaint"
                type="text"
                placeholder="e.g., Chest pain, Abdominal pain"
                value={formState.chiefComplaint}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, chiefComplaint: e.target.value }))
                }
                disabled={formState.isSubmitting}
              />
            </div>

            {formState.error && (
              <p className="encounter-dashboard__form-error">{formState.error}</p>
            )}

            <div className="encounter-dashboard__form-actions">
              <button
                type="button"
                className="encounter-dashboard__cancel-button"
                onClick={handleCloseNewEncounter}
                disabled={formState.isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="encounter-dashboard__submit-button"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting ? 'Creating...' : 'Start Encounter'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="encounter-dashboard__new-card"
            onClick={handleOpenNewEncounter}
            aria-label="Create new encounter"
          >
            <span className="encounter-dashboard__new-icon" aria-hidden="true">
              +
            </span>
            <span className="encounter-dashboard__new-label">New Encounter</span>
          </button>
        )}

        {/* Existing Encounter Cards */}
        {encounters.map((encounter) => (
          <EncounterCard
            key={encounter.id}
            encounter={encounter}
            onSelect={() => onSelectEncounter(encounter.id)}
            onDelete={() => handleDeleteEncounter(encounter.id)}
          />
        ))}
      </div>

      {/* Empty state (when only the New Encounter button is visible) */}
      {encounters.length === 0 && !formState.isOpen && (
        <div className="encounter-dashboard__empty">
          <p className="encounter-dashboard__empty-title">No active encounters</p>
          <p className="encounter-dashboard__empty-description">
            Start tracking your shift by creating a new encounter for each patient.
            Each encounter guides you through a 3-section workflow for comprehensive MDM documentation.
          </p>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="encounter-dashboard__toasts" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`encounter-dashboard__toast encounter-dashboard__toast--${toast.type}`}
              role="alert"
            >
              <span className="encounter-dashboard__toast-icon" aria-hidden="true">
                {toast.type === 'error' ? '⚠️' : '✓'}
              </span>
              <span className="encounter-dashboard__toast-message">{toast.message}</span>
              <button
                type="button"
                className="encounter-dashboard__toast-dismiss"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
