import { useState, useCallback, useEffect, useRef } from 'react'
import type { EncounterDocument, EncounterMode } from '../../types/encounter'
import CarouselCard, { type CardPosition, type AnimationPhase } from './CarouselCard'
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
 * Calculates the visual position of a card relative to the active index
 * Supports up to 7 visible cards in a fan layout
 */
const getCardPosition = (
  index: number,
  activeIndex: number,
  totalCards: number
): CardPosition => {
  if (totalCards === 0) return 'hidden'

  // Calculate the shortest distance considering wraparound
  let diff = index - activeIndex

  // Normalize diff to handle circular navigation
  if (diff > totalCards / 2) diff -= totalCards
  if (diff < -totalCards / 2) diff += totalCards

  // Map diff to position
  if (diff === 0) return 'center'
  if (diff === -1) return 'fan-left-1'
  if (diff === -2) return 'fan-left-2'
  if (diff === -3) return 'fan-left-3'
  if (diff === 1) return 'fan-right-1'
  if (diff === 2) return 'fan-right-2'
  if (diff === 3) return 'fan-right-3'

  return 'hidden'
}

/**
 * EncounterCarousel - Animated card carousel for encounter selection
 *
 * Displays patient encounter cards in a fanned layout with:
 * - Smooth navigation between cards
 * - Selection animation sequence (lift → fade → expand → transition)
 * - New encounter creation card
 * - Keyboard navigation support
 */
export default function EncounterCarousel({
  encounters,
  onSelectEncounter,
  onCreateEncounter,
  onDeleteEncounter,
  onClearAllEncounters,
  mode = 'build'
}: EncounterCarouselProps) {
  // Carousel navigation state
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle')

  // Ref for wheel/swipe handling
  const containerRef = useRef<HTMLDivElement>(null)
  const lastWheelTime = useRef<number>(0)

  // New encounter form state
  const [newRoomNumber, setNewRoomNumber] = useState('')
  const [newChiefComplaint, setNewChiefComplaint] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Clear deck confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Total cards includes the "new encounter" card at index 0
  const totalCards = encounters.length + 1

  /**
   * Navigate to the previous card
   */
  const handlePrev = useCallback(() => {
    if (animationPhase !== 'idle') return
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards)
  }, [animationPhase, totalCards])

  /**
   * Navigate to the next card
   */
  const handleNext = useCallback(() => {
    if (animationPhase !== 'idle') return
    setActiveIndex((prev) => (prev + 1) % totalCards)
  }, [animationPhase, totalCards])

  /**
   * Handle card selection with animation sequence
   * 1. Lift the selected card (0.4s)
   * 2. Fade other cards
   * 3. Expand selected card (0.5s)
   * 4. Transition to editor view
   */
  const handleCardClick = useCallback(async (encounterId: string) => {
    if (animationPhase !== 'idle') return

    setSelectedCardId(encounterId)
    setAnimationPhase('selecting')

    // Phase 1: Lift animation
    await new Promise(resolve => setTimeout(resolve, 400))
    setAnimationPhase('transitioning')

    // Phase 2: Expand animation before transition
    await new Promise(resolve => setTimeout(resolve, 500))

    // Transition to the encounter editor
    onSelectEncounter(encounterId)

    // Reset animation state (in case user navigates back)
    setAnimationPhase('idle')
    setSelectedCardId(null)
  }, [animationPhase, onSelectEncounter])

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

      // If we deleted the currently active card, adjust the index
      const deletedCardIndex = encounters.findIndex(e => e.id === encounterId) + 1
      if (deletedCardIndex === activeIndex && activeIndex > 0) {
        setActiveIndex(prev => prev - 1)
      }
    } catch (error) {
      console.error('Failed to delete encounter:', error)
    }
  }, [onDeleteEncounter, encounters, activeIndex])

  /**
   * Handle clear all encounters confirmation
   */
  const handleConfirmClear = useCallback(async () => {
    if (isClearing) return

    setIsClearing(true)
    try {
      await onClearAllEncounters()
      setShowClearConfirm(false)
      setActiveIndex(0)
    } catch (error) {
      console.error('Failed to clear encounters:', error)
    } finally {
      setIsClearing(false)
    }
  }, [isClearing, onClearAllEncounters])

  /**
   * Keyboard navigation handler
   * - ArrowLeft/ArrowRight: Navigate between cards
   * - Enter: Select the center card (existing encounter) or submit new encounter form
   * - Escape: Cancel any in-progress animation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs (except Enter for form submission)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Enter to bubble up for form submission in the new encounter card
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'Enter':
          e.preventDefault()
          // Select the currently centered card (if it's an existing encounter)
          if (animationPhase === 'idle' && activeIndex > 0) {
            const centeredEncounter = encounters[activeIndex - 1]
            if (centeredEncounter) {
              handleCardClick(centeredEncounter.id)
            }
          }
          break
        case 'Escape':
          if (animationPhase !== 'idle') {
            setAnimationPhase('idle')
            setSelectedCardId(null)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, animationPhase, activeIndex, encounters, handleCardClick])

  /**
   * Wheel/Swipe navigation handler
   * Supports trackpad swipe (horizontal) and mouse wheel (vertical fallback)
   */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Skip if animation in progress
      if (animationPhase !== 'idle') return

      // Use deltaX for horizontal scroll (trackpad swipe)
      // Also support vertical scroll as fallback for regular mouse
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY

      // Dead zone to prevent accidental scroll
      if (Math.abs(delta) < 10) return

      // Debounce to prevent rapid firing (150ms)
      const now = Date.now()
      if (now - lastWheelTime.current < 150) return
      lastWheelTime.current = now

      e.preventDefault()

      if (delta > 0) handleNext()
      else handlePrev()
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [animationPhase, handleNext, handlePrev])

  // Keep activeIndex in bounds if encounters change
  useEffect(() => {
    if (activeIndex >= totalCards && totalCards > 0) {
      setActiveIndex(totalCards - 1)
    }
  }, [activeIndex, totalCards])

  return (
    <div
      ref={containerRef}
      className="encounter-carousel"
      role="region"
      aria-label="Patient encounters"
      aria-roledescription="carousel"
    >
      {/* Card Container */}
      <div className="encounter-carousel__cards">
        {/* New Encounter Card (always at index 0) */}
        <CarouselCard
          position={getCardPosition(0, activeIndex, totalCards)}
          animationPhase={animationPhase}
          isSelected={false}
          isNewCard
          mode={mode}
          newEncounterForm={{
            roomNumber: newRoomNumber,
            chiefComplaint: newChiefComplaint,
            onRoomChange: setNewRoomNumber,
            onComplaintChange: setNewChiefComplaint,
            onSubmit: handleCreateEncounter,
            isSubmitting: isCreating
          }}
        />

        {/* Existing Encounter Cards (index 1 and up) */}
        {encounters.map((encounter, idx) => (
          <CarouselCard
            key={encounter.id}
            encounter={encounter}
            position={getCardPosition(idx + 1, activeIndex, totalCards)}
            animationPhase={animationPhase}
            isSelected={selectedCardId === encounter.id}
            mode={mode}
            onClick={() => handleCardClick(encounter.id)}
            onDelete={() => handleDeleteEncounter(encounter.id)}
          />
        ))}
      </div>

      {/* Navigation Controls - Below Carousel */}
      {totalCards > 1 && (
        <div className="encounter-carousel__controls">
          <button
            type="button"
            className="encounter-carousel__nav encounter-carousel__nav--prev"
            onClick={handlePrev}
            disabled={animationPhase !== 'idle'}
            aria-label="Previous card"
          >
            <svg className="encounter-carousel__arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6L9 12L15 18" />
            </svg>
          </button>

          <span className="encounter-carousel__counter">
            {activeIndex + 1} / {totalCards}
          </span>

          <button
            type="button"
            className="encounter-carousel__nav encounter-carousel__nav--next"
            onClick={handleNext}
            disabled={animationPhase !== 'idle'}
            aria-label="Next card"
          >
            <svg className="encounter-carousel__arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6L15 12L9 18" />
            </svg>
          </button>
        </div>
      )}

      {/* Clear Deck Button - Only show when there are encounters */}
      {encounters.length > 0 && (
        <button
          type="button"
          className="encounter-carousel__clear-deck"
          onClick={() => setShowClearConfirm(true)}
          disabled={animationPhase !== 'idle'}
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
