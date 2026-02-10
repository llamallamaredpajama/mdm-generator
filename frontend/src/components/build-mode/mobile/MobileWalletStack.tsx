import { useRef, useCallback, useLayoutEffect, useState } from 'react'
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

/** Height of the always-visible card header peek */
const HEADER_HEIGHT = 60
/** Overlap between stacked cards (negative margin equivalent) */
const STACK_OVERLAP = -20
/** Net spacing between card tops in idle state */
const STACK_SPACING = HEADER_HEIGHT + STACK_OVERLAP // 40
/** Estimated body height when a card is expanded */
const EXPANDED_BODY_HEIGHT = 280
/** Top position for the expanded card */
const EXPANDED_TOP = 8

/**
 * MobileWalletStack - Apple Wallet-style vertical card stack for mobile
 *
 * Uses absolute positioning with calculated `top` values so cards
 * animate smoothly to/from the top of the stack when tapped.
 */
export default function MobileWalletStack({
  encounters,
  expansion,
  mode,
  onSelectEncounter,
  onDeleteEncounter,
  newEncounterForm,
}: MobileWalletStackProps) {
  const { expandedCardId, collapse, toggle, isExpanded } = expansion

  // Ref to measure actual expanded card height for accurate positioning
  const expandedCardRef = useRef<HTMLDivElement | null>(null)
  const [measuredExpandedHeight, setMeasuredExpandedHeight] = useState(0)

  // Ref to measure NewEncounterCard's full form height in idle state
  const newEncounterRef = useRef<HTMLDivElement | null>(null)
  const [newEncounterHeight, setNewEncounterHeight] = useState(0)

  // Measure card heights after render
  useLayoutEffect(() => {
    if (expandedCardId && expandedCardRef.current) {
      setMeasuredExpandedHeight(expandedCardRef.current.scrollHeight)
    } else {
      setMeasuredExpandedHeight(0)
    }

    // Measure NewEncounterCard when it's showing its full form (idle state)
    if (!expandedCardId && newEncounterRef.current) {
      setNewEncounterHeight(newEncounterRef.current.scrollHeight)
    }
  }, [expandedCardId])

  // Total items: 1 (NewEncounterCard) + encounters
  const totalItems = 1 + encounters.length

  /**
   * Calculate positions for all cards.
   * Returns { top, zIndex } for each card index (0 = NewEncounterCard).
   * Depth is conveyed purely through overlap and shadow — no 3D transforms.
   */
  const calculatePositions = useCallback(() => {
    const positions: Array<{ top: number; zIndex: number }> = []

    if (!expandedCardId) {
      // Idle state: NewEncounterCard at top with its full height,
      // encounter cards stacked below it with STACK_SPACING overlap
      const necHeight = newEncounterHeight || HEADER_HEIGHT
      const firstEncounterTop = necHeight + 8 // 8px gap after NewEncounterCard
      positions.push({ top: 0, zIndex: 1 }) // NewEncounterCard
      for (let i = 1; i < totalItems; i++) {
        positions.push({
          top: firstEncounterTop + (i - 1) * STACK_SPACING,
          zIndex: i + 1,
        })
      }
      return positions
    }

    // Find which card index is expanded (0-based, 0 = NewEncounter)
    const expandedIndex = encounters.findIndex((e) => e.id === expandedCardId)
    // +1 because index 0 is NewEncounterCard
    const expandedGlobalIndex = expandedIndex === -1 ? -1 : expandedIndex + 1

    // The expanded card's bottom edge — generous gap before the stacked cards
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT
    const expandedBottom = EXPANDED_TOP + expandedHeight + 32 // 32px gap

    let belowCounter = 0
    for (let i = 0; i < totalItems; i++) {
      if (i === expandedGlobalIndex) {
        // Expanded card → moves to top
        positions.push({ top: EXPANDED_TOP, zIndex: totalItems + 1 })
      } else {
        // Non-expanded cards stack below the expanded card
        positions.push({
          top: expandedBottom + belowCounter * STACK_SPACING,
          zIndex: belowCounter + 1,
        })
        belowCounter++
      }
    }

    return positions
  }, [expandedCardId, encounters, totalItems, measuredExpandedHeight, newEncounterHeight])

  const positions = calculatePositions()

  // Container height
  const containerHeight = (() => {
    if (!expandedCardId) {
      // Idle: NewEncounterCard full height + gap + stacked encounter cards
      const necHeight = newEncounterHeight || HEADER_HEIGHT
      const encounterCount = encounters.length
      if (encounterCount === 0) return necHeight
      return necHeight + 8 + (encounterCount - 1) * STACK_SPACING + HEADER_HEIGHT
    }
    // Expanded: expanded card + generous gap + remaining cards stacked below
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT
    const remainingCards = totalItems - 1
    return EXPANDED_TOP + expandedHeight + 32 + (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT
  })()

  /**
   * Handle header tap — toggle expansion
   */
  const handleHeaderTap = (encounterId: string) => {
    toggle(encounterId)
  }

  /**
   * Handle delete button click
   */
  const handleDelete = async (encounterId: string) => {
    if (isExpanded(encounterId)) {
      collapse()
    }
    await onDeleteEncounter(encounterId)
  }

  /**
   * Handle NewEncounterCard peek tap — collapse expanded card to return to idle
   */
  const handleNewEncounterPeekTap = () => {
    collapse()
  }

  // Is the NewEncounterCard showing as a collapsed peek?
  const newEncounterCollapsed = !!expandedCardId

  return (
    <div
      className={`mobile-wallet-stack mobile-wallet-stack--${mode === 'quick' ? 'quick-mode' : 'build-mode'}`}
      role="list"
      aria-label="Patient encounters"
      style={{ height: containerHeight }}
    >
      {/* NewEncounterCard — index 0 */}
      <div
        ref={newEncounterRef}
        className={[
          'mobile-card',
          'mobile-card--new-encounter',
          newEncounterCollapsed && 'mobile-card--collapsed',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ top: positions[0].top, zIndex: positions[0].zIndex }}
      >
        {newEncounterCollapsed ? (
          <div
            className="mobile-card__new-encounter-peek"
            onClick={handleNewEncounterPeekTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleNewEncounterPeekTap()
              }
            }}
          >
            + New Encounter
          </div>
        ) : (
          <NewEncounterCard form={newEncounterForm} mode={mode} />
        )}
      </div>

      {/* Encounter cards */}
      {encounters.map((encounter, index) => {
        const cardExpanded = isExpanded(encounter.id)
        const posIndex = index + 1 // offset by 1 for NewEncounterCard
        const pos = positions[posIndex]

        return (
          <div
            key={encounter.id}
            ref={cardExpanded ? expandedCardRef : undefined}
            className={[
              'mobile-card',
              cardExpanded && 'mobile-card--expanded',
              !cardExpanded && 'mobile-card--collapsed',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ top: pos.top, zIndex: pos.zIndex }}
            role="listitem"
            aria-expanded={cardExpanded}
          >
            {/* Header — always visible, tappable */}
            <MobileCardHeader
              encounter={encounter}
              isExpanded={cardExpanded}
              onTap={() => handleHeaderTap(encounter.id)}
              onDelete={() => handleDelete(encounter.id)}
              mode={mode}
            />

            {/* Body — visible when expanded */}
            <div className="mobile-card__body" aria-hidden={!cardExpanded}>
              <div className="mobile-card__divider" />
              <CardContent
                encounter={encounter}
                mode={mode}
                showSectionIndicators={mode === 'build'}
                compact={false}
                hideHeader
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
