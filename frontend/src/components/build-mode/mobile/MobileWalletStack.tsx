import { useRef, useCallback, useLayoutEffect, useState } from 'react'
import type { EncounterDocument, EncounterMode, FinalMdm } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
import { useToast } from '../../../contexts/ToastContext'
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
 * Get the first sentence snippet from an encounter's input text.
 * Returns truncated text like "45 yo male with chest pain..." or empty string.
 */
function getInputSnippet(encounter: EncounterDocument): string {
  const mode = getEncounterMode(encounter)
  let text = ''

  if (mode === 'quick') {
    text = encounter.quickModeData?.narrative || ''
  } else {
    // Build mode: use first non-empty section content
    text = encounter.section1.content || encounter.section2.content || encounter.section3.content || ''
  }

  if (!text.trim()) return ''

  // Get first sentence or first 80 chars
  const firstSentence = text.split(/[.!?\n]/)[0]?.trim() || ''
  if (firstSentence.length <= 60) return firstSentence + '...'
  return firstSentence.slice(0, 60) + '...'
}

/**
 * Get the copyable output text from a completed encounter.
 * Returns the MDM text or empty string if not yet processed.
 */
function getCopyableOutput(encounter: EncounterDocument): string {
  const mode = getEncounterMode(encounter)

  if (mode === 'quick') {
    if (encounter.quickModeData?.status === 'completed') {
      return encounter.quickModeData.mdmOutput?.text || ''
    }
  } else {
    if (encounter.status === 'finalized') {
      const s3 = encounter.section3.llmResponse
      const text = s3?.finalMdm?.text || (s3 as unknown as FinalMdm)?.text
      if (text) return text
    }
  }

  return ''
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
  const { success: showSuccess, error: showError } = useToast()

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
  }, [expandedCardId, encounters.length])

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
      if (encounterCount === 0) return necHeight + CLEAR_DECK_RESERVE
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

              {/* Input snippet preview */}
              {(() => {
                const snippet = getInputSnippet(encounter)
                return snippet ? (
                  <p className="mobile-card__snippet">{snippet}</p>
                ) : (
                  <CardContent
                    encounter={encounter}
                    showSectionIndicators={getEncounterMode(encounter) === 'build'}
                    compact={false}
                    hideHeader
                  />
                )
              })()}

              {/* Action buttons */}
              {cardExpanded && (
                <div className="mobile-card__action-row">
                  {/* Copy button — only when output is ready */}
                  {(() => {
                    const copyText = getCopyableOutput(encounter)
                    return copyText ? (
                      <button
                        type="button"
                        className="mobile-card__copy-btn"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            await navigator.clipboard.writeText(copyText)
                            showSuccess('MDM copied to clipboard')
                          } catch {
                            showError('Failed to copy')
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy MDM
                      </button>
                    ) : null
                  })()}

                  <button
                    type="button"
                    className="mobile-card__action"
                    onClick={() => onSelectEncounter(encounter.id)}
                  >
                    {getEncounterMode(encounter) === 'quick' ? 'Open' : 'Continue'}
                  </button>
                </div>
              )}

              {/* Delete icon — bottom-right of active card */}
              {cardExpanded && (
                <div className="mobile-card__delete-corner">
                  <button
                    type="button"
                    className="mobile-card__delete-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(encounter.id)
                    }}
                    aria-label={`Delete encounter ${encounter.roomNumber}`}
                    title="Delete encounter"
                  >
                    <svg
                      width="14"
                      height="14"
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
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
