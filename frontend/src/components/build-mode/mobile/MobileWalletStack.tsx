import { useRef, useCallback, useLayoutEffect, useState } from 'react'
import type { EncounterDocument, EncounterMode } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
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
const EXPANDED_TOP = 32
/** Space reserved for clear deck button below the stack */
const CLEAR_DECK_RESERVE = 16

/**
 * MobileWalletStack - Apple Wallet-style vertical card stack for mobile
 *
 * Uses absolute positioning with calculated `top` values so cards
 * animate smoothly to/from the top of the stack when tapped.
 * When a card is expanded, the remaining stack anchors to the bottom.
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
   *
   * When expanded: active card at top, remaining stack anchored to bottom.
   * When idle: cards stack top-down from NewEncounterCard.
   */
  const calculatePositions = useCallback(() => {
    const positions: Array<{ top: number; zIndex: number }> = []

    if (!expandedCardId) {
      // Idle state: NewEncounterCard active at top, encounter cards
      // anchored to bottom — same layout pattern as expanded state
      const necHeight = newEncounterHeight || HEADER_HEIGHT
      const encounterCount = encounters.length
      const stackHeight = encounterCount > 0
        ? (encounterCount - 1) * STACK_SPACING + HEADER_HEIGHT
        : 0

      const minContainerHeight = Math.max(
        necHeight + (120 - EXPANDED_TOP) + stackHeight + CLEAR_DECK_RESERVE,
        520
      )
      const stackStartTop = minContainerHeight - stackHeight - CLEAR_DECK_RESERVE

      positions.push({ top: 0, zIndex: 1 }) // NewEncounterCard
      for (let i = 1; i < totalItems; i++) {
        positions.push({
          top: stackStartTop + (i - 1) * STACK_SPACING,
          zIndex: i + 1,
        })
      }
      return positions
    }

    // Find which card index is expanded (0-based, 0 = NewEncounter)
    const expandedIndex = encounters.findIndex((e) => e.id === expandedCardId)
    // +1 because index 0 is NewEncounterCard
    const expandedGlobalIndex = expandedIndex === -1 ? -1 : expandedIndex + 1

    // Calculate expanded card height
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT

    // Calculate total stack height for remaining cards
    const remainingCards = totalItems - 1
    const stackHeight = remainingCards > 0
      ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT
      : 0

    // Container fills viewport — stack anchors to bottom
    // Min container height: enough for active card + gap + stack + reserve
    const minContainerHeight = Math.max(
      expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE,
      520 // minimum to fill mobile viewport area
    )

    // Stack starts near the bottom of the container
    const stackStartTop = minContainerHeight - stackHeight - CLEAR_DECK_RESERVE

    let belowCounter = 0
    for (let i = 0; i < totalItems; i++) {
      if (i === expandedGlobalIndex) {
        // Expanded card → moves to top
        positions.push({ top: EXPANDED_TOP, zIndex: totalItems + 1 })
      } else {
        // Non-expanded cards stack at the bottom
        positions.push({
          top: stackStartTop + belowCounter * STACK_SPACING,
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
      // Idle: same gap formula as expanded state so spacing is consistent
      const necHeight = newEncounterHeight || HEADER_HEIGHT
      const encounterCount = encounters.length
      if (encounterCount === 0) return necHeight
      const stackHeight = encounterCount > 0
        ? (encounterCount - 1) * STACK_SPACING + HEADER_HEIGHT
        : 0
      return Math.max(
        necHeight + (120 - EXPANDED_TOP) + stackHeight + CLEAR_DECK_RESERVE,
        520
      )
    }
    // Expanded: calculate same as positioning logic
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT
    const remainingCards = totalItems - 1
    const stackHeight = remainingCards > 0
      ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT
      : 0
    return Math.max(
      expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE,
      520
    )
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
          !newEncounterCollapsed && 'mobile-card--active-glow',
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
              cardExpanded && 'mobile-card--active-glow',
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
            />

            {/* Body — visible when expanded */}
            <div className="mobile-card__body" aria-hidden={!cardExpanded}>
              <div className="mobile-card__divider" />
              <CardContent
                encounter={encounter}
                showSectionIndicators={getEncounterMode(encounter) === 'build'}
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
                  {getEncounterMode(encounter) === 'quick' ? 'Open' : 'Continue'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
