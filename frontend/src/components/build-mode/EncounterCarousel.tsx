import { useState, useCallback, useEffect } from 'react'
import type { EncounterDocument } from '../../types/encounter'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useCardExpansion } from '../../hooks/useCardExpansion'
import MobileWalletStack from './mobile/MobileWalletStack'
import DesktopKanban from './desktop/DesktopKanban'
import './EncounterCarousel.css'

interface EncounterCarouselProps {
  encounters: EncounterDocument[]
  onSelectEncounter: (id: string) => void
  onDeleteEncounter: (id: string) => Promise<void>
  /** Delete all encounters in the deck */
  onClearAllEncounters: () => Promise<void>
}

/**
 * EncounterCarousel - Responsive encounter selection carousel
 *
 * Viewport-aware orchestrator that renders:
 * - Mobile (<768px): Apple Wallet-style vertical stack
 * - Desktop (>=768px): Kanban board with flip-to-fullscreen
 *
 * Common functionality:
 * - Clear deck confirmation modal
 * - Keyboard navigation (Escape to close)
 */
export default function EncounterCarousel({
  encounters,
  onSelectEncounter,
  onDeleteEncounter,
  onClearAllEncounters,
}: EncounterCarouselProps) {
  // Viewport detection
  const isMobile = useIsMobile()

  // Shared expansion state for both layouts
  const expansion = useCardExpansion()

  // Clear deck confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  /**
   * Handle encounter deletion
   */
  const handleDeleteEncounter = useCallback(
    async (encounterId: string) => {
      try {
        await onDeleteEncounter(encounterId)
      } catch (error) {
        console.error('Failed to delete encounter:', error)
      }
    },
    [onDeleteEncounter],
  )

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

  return (
    <div
      className={`encounter-carousel ${isMobile ? 'encounter-carousel--mobile' : 'encounter-carousel--desktop'}`}
      role="region"
      aria-label="Patient encounters"
      aria-roledescription="carousel"
    >
      {/* Viewport-specific layout */}
      {isMobile ? (
        <MobileWalletStack
          encounters={encounters}
          expansion={expansion}
          onSelectEncounter={onSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
        />
      ) : (
        <DesktopKanban
          encounters={encounters}
          expansion={expansion}
          onSelectEncounter={onSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
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
          <div className="encounter-carousel__modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="clear-deck-title" className="encounter-carousel__modal-title">
              Clear All Encounters?
            </h3>
            <p className="encounter-carousel__modal-warning">
              This will delete all {encounters.length} encounter{encounters.length !== 1 ? 's' : ''}
              . This action cannot be undone.
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
