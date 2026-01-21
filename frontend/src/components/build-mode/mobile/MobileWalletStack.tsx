import type { EncounterDocument, EncounterMode } from '../../../types/encounter'
import type { UseCardExpansionReturn } from '../../../hooks/useCardExpansion'
import type { NewEncounterFormData } from '../NewEncounterCard'
import NewEncounterCard from '../NewEncounterCard'
import CardContent from '../shared/CardContent'
import MobileCardHeader from './MobileCardHeader'
import './MobileWalletStack.css'

export interface MobileWalletStackProps {
  /** List of encounters to display */
  encounters: EncounterDocument[]
  /** Expansion state from useCardExpansion hook */
  expansion: UseCardExpansionReturn
  /** Mode context (quick or build) */
  mode: EncounterMode
  /** Callback when user selects an encounter to edit */
  onSelectEncounter: (id: string) => void
  /** Callback when user deletes an encounter */
  onDeleteEncounter: (id: string) => Promise<void>
  /** New encounter form data and handlers */
  newEncounterForm: NewEncounterFormData
}

/**
 * MobileWalletStack - Apple Wallet-style vertical card stack for mobile
 *
 * Features:
 * - All card headers always visible (60px each)
 * - Tap header to expand/collapse card body
 * - Only one card expanded at a time
 * - Spring animation for expand/collapse
 * - Slide animation for non-expanded cards when one expands
 */
export default function MobileWalletStack({
  encounters,
  expansion,
  mode,
  onSelectEncounter,
  onDeleteEncounter,
  newEncounterForm,
}: MobileWalletStackProps) {
  const { expandedCardId, animationPhase, expand, collapse, isExpanded } = expansion

  /**
   * Handle header tap - toggle expansion or navigate to editor
   */
  const handleHeaderTap = (encounterId: string) => {
    if (isExpanded(encounterId)) {
      // Already expanded - navigate to editor
      onSelectEncounter(encounterId)
    } else {
      // Collapse any currently expanded card and expand this one
      if (expandedCardId) {
        collapse()
        // Small delay to allow collapse animation before expanding new card
        setTimeout(() => expand(encounterId), 100)
      } else {
        expand(encounterId)
      }
    }
  }

  /**
   * Handle delete button click
   */
  const handleDelete = async (encounterId: string) => {
    // Collapse if this card is expanded
    if (isExpanded(encounterId)) {
      collapse()
    }
    await onDeleteEncounter(encounterId)
  }

  /**
   * Calculate the vertical offset for a card based on expansion state
   * When a card is expanded, cards below it slide down to make room
   */
  const getCardOffset = (index: number): number => {
    if (!expandedCardId || animationPhase === 'collapsing') {
      return 0
    }

    const expandedIndex = encounters.findIndex((e) => e.id === expandedCardId)
    if (expandedIndex === -1 || index <= expandedIndex) {
      return 0
    }

    // Cards below the expanded card get pushed down
    // The expanded card content is approximately 200px
    return 200
  }

  return (
    <div className="mobile-wallet-stack" role="list" aria-label="Patient encounters">
      {/* New Encounter Card - first item */}
      <NewEncounterCard form={newEncounterForm} mode={mode} />

      {/* Existing encounter cards */}
      {encounters.map((encounter, index) => {
        const cardExpanded = isExpanded(encounter.id)
        const offset = getCardOffset(index)

        return (
          <div
            key={encounter.id}
            className={[
              'mobile-card',
              cardExpanded && 'mobile-card--expanded',
              !cardExpanded && 'mobile-card--collapsed',
              animationPhase === 'expanding' && cardExpanded && 'mobile-card--animating-expand',
              animationPhase === 'collapsing' && cardExpanded && 'mobile-card--animating-collapse',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              '--card-offset': `${offset}px`,
            } as React.CSSProperties}
            role="listitem"
            aria-expanded={cardExpanded}
          >
            {/* Header - always visible, tappable */}
            <MobileCardHeader
              encounter={encounter}
              isExpanded={cardExpanded}
              onTap={() => handleHeaderTap(encounter.id)}
              onDelete={() => handleDelete(encounter.id)}
              mode={mode}
            />

            {/* Body - visible when expanded */}
            <div
              className={[
                'mobile-card__body',
                cardExpanded && 'mobile-card__body--visible',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden={!cardExpanded}
            >
              <CardContent
                encounter={encounter}
                mode={mode}
                showSectionIndicators={mode === 'build'}
                compact={false}
              />

              {/* Action button to go to editor */}
              {cardExpanded && (
                <button
                  type="button"
                  className="mobile-card__action"
                  onClick={() => onSelectEncounter(encounter.id)}
                >
                  {mode === 'quick' ? 'Open' : 'Continue'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
