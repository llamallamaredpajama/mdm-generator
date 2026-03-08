import { useRef, useCallback, useLayoutEffect, useState } from 'react'
import type { EncounterDocument, FinalMdm } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
import { useToast } from '../../../contexts/ToastContext'
import type { UseCardExpansionReturn } from '../../../hooks/useCardExpansion'
import CardContent from '../shared/CardContent'
import MobileCardHeader from './MobileCardHeader'
import './MobileWalletStack.css'

export interface MobileWalletStackProps {
  /** List of encounters to display */
  encounters: EncounterDocument[]
  /** Expansion state from useCardExpansion hook */
  expansion: UseCardExpansionReturn
  /** Callback when user selects an encounter to edit */
  onSelectEncounter: (id: string) => void
  /** Callback when user deletes an encounter */
  onDeleteEncounter: (id: string) => Promise<void>
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
    text =
      encounter.section1.content || encounter.section2.content || encounter.section3.content || ''
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
  onSelectEncounter,
  onDeleteEncounter,
}: MobileWalletStackProps) {
  const { expandedCardId, collapse, toggle, isExpanded } = expansion
  const { success: showSuccess, error: showError } = useToast()

  // Ref to measure actual expanded card height for accurate positioning
  const expandedCardRef = useRef<HTMLDivElement | null>(null)
  const [measuredExpandedHeight, setMeasuredExpandedHeight] = useState(0)

  // Measure card heights after render
  useLayoutEffect(() => {
    if (expandedCardId && expandedCardRef.current) {
      setMeasuredExpandedHeight(expandedCardRef.current.scrollHeight)
    } else {
      setMeasuredExpandedHeight(0)
    }
  }, [expandedCardId, encounters.length])

  const totalItems = encounters.length

  /**
   * Calculate positions for all cards.
   * Returns { top, zIndex } for each card index.
   *
   * When expanded: active card at top, remaining stack anchored to bottom.
   * When idle: cards stack top-down.
   */
  const calculatePositions = useCallback(() => {
    const positions: Array<{ top: number; zIndex: number }> = []

    if (!expandedCardId) {
      // Idle: stack encounters top-down
      for (let i = 0; i < totalItems; i++) {
        positions.push({
          top: i * STACK_SPACING,
          zIndex: i + 1,
        })
      }
      return positions
    }

    const expandedIndex = encounters.findIndex((e) => e.id === expandedCardId)
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT

    const remainingCards = totalItems - 1
    const stackHeight =
      remainingCards > 0 ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT : 0

    const minContainerHeight = Math.max(
      expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE,
      520,
    )

    const stackStartTop = minContainerHeight - stackHeight - CLEAR_DECK_RESERVE

    let belowCounter = 0
    for (let i = 0; i < totalItems; i++) {
      if (i === expandedIndex) {
        positions.push({ top: EXPANDED_TOP, zIndex: totalItems + 1 })
      } else {
        positions.push({
          top: stackStartTop + belowCounter * STACK_SPACING,
          zIndex: belowCounter + 1,
        })
        belowCounter++
      }
    }

    return positions
  }, [expandedCardId, encounters, totalItems, measuredExpandedHeight])

  const positions = calculatePositions()

  // Container height
  const containerHeight = (() => {
    if (!expandedCardId) {
      if (totalItems === 0) return 100
      const stackHeight = (totalItems - 1) * STACK_SPACING + HEADER_HEIGHT
      return Math.max(stackHeight + CLEAR_DECK_RESERVE, 520)
    }
    const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT
    const remainingCards = totalItems - 1
    const stackHeight =
      remainingCards > 0 ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT : 0
    return Math.max(expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE, 520)
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

  return (
    <div
      className="mobile-wallet-stack"
      role="list"
      aria-label="Patient encounters"
      style={{ height: containerHeight }}
    >
      {/* Encounter cards */}
      {encounters.map((encounter, index) => {
        const cardExpanded = isExpanded(encounter.id)
        const pos = positions[index]

        return (
          <div
            key={encounter.id}
            ref={cardExpanded ? expandedCardRef : undefined}
            className={[
              'mobile-card',
              `mobile-card--mode-${getEncounterMode(encounter)}`,
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
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
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
