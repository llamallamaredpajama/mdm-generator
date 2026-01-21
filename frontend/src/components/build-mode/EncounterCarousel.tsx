import { useState, useCallback, useEffect } from 'react'
import type { EncounterDocument, EncounterMode } from '../../types/encounter'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useCardExpansion } from '../../hooks/useCardExpansion'
import MobileWalletStack from './mobile/MobileWalletStack'
import DesktopKanban from './desktop/DesktopKanban'
import './EncounterCarousel.css'

interface EncounterCarouselProps {
  encounters: EncounterDocument[]
  onSelectEncounter: (id: string) => void
  onCreateEncounter: (roomNumber: string, chiefComplaint: string) => Promise<string>
  onDeleteEncounter: (id: string) => Promise<void>
  /** Delete all encounters in the deck */
  onClearAllEncounters: () => Promise<void>
  /** Mode context for the carousel - affects card styling and new encounter form */
  mode?: EncounterMode
}

/**
 * EncounterCarousel - Responsive encounter selection carousel
 *
 * Viewport-aware orchestrator that renders:
 * - Mobile (<768px): Apple Wallet-style vertical stack
 * - Desktop (≥768px): Kanban board with flip-to-fullscreen
 *
 * Common functionality:
 * - New encounter creation form
 * - Clear deck confirmation modal
 * - Keyboard navigation (Escape to close)
 */
export default function EncounterCarousel({
  encounters,
  onSelectEncounter,
  onCreateEncounter,
  onDeleteEncounter,
  onClearAllEncounters,
  mode = 'build'
}: EncounterCarouselProps) {
  // Viewport detection
  const isMobile = useIsMobile()

  // Shared expansion state for both layouts
  const expansion = useCardExpansion()

  // New encounter form state
  const [newRoomNumber, setNewRoomNumber] = useState('')
  const [newChiefComplaint, setNewChiefComplaint] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Clear deck confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  /**
   * Handle new encounter creation
   * Quick mode only requires room number - chief complaint is auto-extracted
   */
  const handleCreateEncounter = useCallback(async () => {
    // Quick mode only needs room number; build mode needs both
    const needsComplaint = mode === 'build'
    if (isCreating || !newRoomNumber.trim() || (needsComplaint && !newChiefComplaint.trim())) return

    setIsCreating(true)
    try {
      // For quick mode, use placeholder chief complaint (will be updated after AI processing)
      const complaint = mode === 'quick' ? 'Quick Encounter' : newChiefComplaint.trim()
      const encounterId = await onCreateEncounter(newRoomNumber.trim(), complaint)

      // Reset form
      setNewRoomNumber('')
      setNewChiefComplaint('')

      // Navigate to the new encounter
      onSelectEncounter(encounterId)
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Failed to create encounter:', error)
    } finally {
      setIsCreating(false)
    }
  }, [isCreating, newRoomNumber, newChiefComplaint, onCreateEncounter, onSelectEncounter, mode])

  /**
   * Handle encounter deletion
   */
  const handleDeleteEncounter = useCallback(async (encounterId: string) => {
    try {
      await onDeleteEncounter(encounterId)
    } catch (error) {
      console.error('Failed to delete encounter:', error)
    }
  }, [onDeleteEncounter])

  /**
   * Handle clear all encounters confirmation
   */
  const handleConfirmClear = useCallback(async () => {
    if (isClearing) return

    setIsClearing(true)
    try {
      await onClearAllEncounters()
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear encounters:', error)
    } finally {
      setIsClearing(false)
    }
  }, [isClearing, onClearAllEncounters])

  /**
   * Keyboard handler for Escape to close modal
   * Note: Card expansion Escape handling is in useCardExpansion hook
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Close clear confirmation modal on Escape
      if (e.key === 'Escape' && showClearConfirm) {
        setShowClearConfirm(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showClearConfirm])

  // Shared form data for NewEncounterCard
  const newEncounterForm = {
    roomNumber: newRoomNumber,
    chiefComplaint: newChiefComplaint,
    onRoomChange: setNewRoomNumber,
    onComplaintChange: setNewChiefComplaint,
    onSubmit: handleCreateEncounter,
    isSubmitting: isCreating
  }

  return (
    <div
      className={`encounter-carousel ${isMobile ? 'encounter-carousel--mobile' : 'encounter-carousel--desktop'}`}
      role="region"
      aria-label="Patient encounters"
      aria-roledescription="carousel"
    >
      {/* Viewport-specific layout (includes new encounter card) */}
      {isMobile ? (
        <MobileWalletStack
          encounters={encounters}
          expansion={expansion}
          mode={mode}
          onSelectEncounter={onSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
          newEncounterForm={newEncounterForm}
        />
      ) : (
        <DesktopKanban
          encounters={encounters}
          expansion={expansion}
          mode={mode}
          onSelectEncounter={onSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
          newEncounterForm={newEncounterForm}
        />
      )}

      {/* Clear Deck Button - Only show when there are encounters */}
      {encounters.length > 0 && (
        <button
          type="button"
          className="encounter-carousel__clear-deck"
          onClick={() => setShowClearConfirm(true)}
          disabled={expansion.animationPhase !== 'idle'}
          aria-label="Clear all encounters"
        >
          <svg
            className="encounter-carousel__clear-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear Deck
        </button>
      )}

      {/* Clear Deck Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="encounter-carousel__modal-overlay"
          onClick={() => !isClearing && setShowClearConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-deck-title"
        >
          <div
            className="encounter-carousel__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="clear-deck-title" className="encounter-carousel__modal-title">
              Clear All Encounters?
            </h3>
            <p className="encounter-carousel__modal-warning">
              This will delete all {encounters.length} encounter{encounters.length !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="encounter-carousel__modal-actions">
              <button
                type="button"
                className="encounter-carousel__modal-cancel"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="encounter-carousel__modal-confirm"
                onClick={handleConfirmClear}
                disabled={isClearing}
              >
                {isClearing ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
