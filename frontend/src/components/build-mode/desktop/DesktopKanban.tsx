import { useCallback, useState } from 'react'
import type { EncounterDocument, EncounterMode } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
import type { UseCardExpansionReturn } from '../../../hooks/useCardExpansion'
import type { NewEncounterFormData } from '../NewEncounterCard'
import NewEncounterCard from '../NewEncounterCard'
import CardContent from '../shared/CardContent'
import FullscreenOverlay from './FullscreenOverlay'
import './DesktopKanban.css'

export interface DesktopKanbanProps {
  /** List of encounters to display as cards */
  encounters: EncounterDocument[]
  /** Card expansion state from useCardExpansion hook */
  expansion: UseCardExpansionReturn
  /** Mode context (quick or build) */
  mode: EncounterMode
  /** Callback when a card is selected for editing */
  onSelectEncounter: (id: string) => void
  /** Callback to delete an encounter */
  onDeleteEncounter: (id: string) => Promise<void>
  /** New encounter form data and handlers */
  newEncounterForm: NewEncounterFormData
}

/**
 * DesktopKanban - Horizontal card layout for desktop viewports
 *
 * Features:
 * - Horizontal scrolling card container (kanban-style)
 * - Click card triggers flip animation to fullscreen
 * - Uses CardContent for consistent card display
 * - Coordinates with useCardExpansion for animation state
 */
export default function DesktopKanban({
  encounters,
  expansion,
  mode,
  onSelectEncounter,
  onDeleteEncounter,
  newEncounterForm,
}: DesktopKanbanProps) {
  // Track which card is being flipped (for flip animation before fullscreen)
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)

  /**
   * Handle card click - trigger flip then expand to fullscreen
   */
  const handleCardClick = useCallback(
    (encounterId: string) => {
      // Don't allow clicks during animations
      if (expansion.animationPhase !== 'idle' || flippedCardId !== null) {
        return
      }

      // Start flip animation
      setFlippedCardId(encounterId)

      // After flip completes (300ms for half-flip), trigger fullscreen
      setTimeout(() => {
        expansion.expand(encounterId, true)
        // Reset flip state after fullscreen animation starts
        setTimeout(() => {
          setFlippedCardId(null)
        }, 100)
      }, 300)
    },
    [expansion, flippedCardId]
  )

  /**
   * Handle closing fullscreen overlay
   * Navigates to the encounter editor
   */
  const handleOverlayClose = useCallback(() => {
    expansion.collapse()
  }, [expansion])

  /**
   * Handle "Edit Encounter" action from fullscreen overlay
   */
  const handleEditEncounter = useCallback(
    (encounterId: string) => {
      expansion.collapse()
      // Small delay to let collapse animation start, then navigate
      setTimeout(() => {
        onSelectEncounter(encounterId)
      }, 150)
    },
    [expansion, onSelectEncounter]
  )

  /**
   * Handle delete from fullscreen overlay
   */
  const handleDeleteFromOverlay = useCallback(
    async (encounterId: string) => {
      expansion.collapse()
      // Small delay then delete
      setTimeout(async () => {
        await onDeleteEncounter(encounterId)
      }, 150)
    },
    [expansion, onDeleteEncounter]
  )

  // Find the currently expanded encounter for the overlay
  const expandedEncounter = expansion.expandedCardId
    ? encounters.find((e) => e.id === expansion.expandedCardId)
    : null

  return (
    <div className="desktop-kanban">
      {/* New Encounter Card - first item in the grid */}
      <NewEncounterCard form={newEncounterForm} mode={mode} />

      {/* Existing encounter cards */}
      {encounters.map((encounter) => {
          const isFlipped = flippedCardId === encounter.id
          const isExpanded = expansion.isExpanded(encounter.id)
          const isOtherExpanding =
            expansion.expandedCardId !== null &&
            expansion.expandedCardId !== encounter.id

          return (
            <button
              key={encounter.id}
              type="button"
              className={[
                'flippable-card',
                isFlipped && 'flippable-card--flipped',
                isExpanded && 'flippable-card--expanded',
                isOtherExpanding && 'flippable-card--dimmed',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCardClick(encounter.id)}
              aria-label={`View encounter ${encounter.roomNumber}`}
              aria-expanded={isExpanded}
            >
              <div className="flippable-card__inner">
                {/* Front face - card content */}
                <div className="flippable-card__face flippable-card__face--front">
                  <CardContent
                    encounter={encounter}
                    showSectionIndicators={getEncounterMode(encounter) === 'build'}
                    compact={false}
                  />
                </div>

                {/* Back face - shown during flip */}
                <div className="flippable-card__face flippable-card__face--back">
                  <div className="flippable-card__loading">
                    <span className="flippable-card__spinner" />
                  </div>
                </div>
              </div>
            </button>
          )
        })}

      {/* Fullscreen overlay portal */}
      {expandedEncounter && expansion.isFullscreen && (
        <FullscreenOverlay
          encounter={expandedEncounter}
          mode={mode}
          animationPhase={expansion.animationPhase}
          onClose={handleOverlayClose}
          onEdit={handleEditEncounter}
          onDelete={handleDeleteFromOverlay}
        />
      )}
    </div>
  )
}
