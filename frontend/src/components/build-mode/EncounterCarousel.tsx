import { useState, useCallback, useEffect } from 'react'
import type { EncounterDocument } from '../../types/encounter'
import CarouselCard, { type CardPosition, type AnimationPhase } from './CarouselCard'
import './EncounterCarousel.css'

interface EncounterCarouselProps {
  encounters: EncounterDocument[]
  onSelectEncounter: (id: string) => void
  onCreateEncounter: (roomNumber: string, chiefComplaint: string) => Promise<string>
  onDeleteEncounter: (id: string) => Promise<void>
}

/**
 * Calculates the visual position of a card relative to the active index
 * Supports up to 5 visible cards in a fan layout
 */
const getCardPosition = (
  index: number,
  activeIndex: number,
  totalCards: number
): CardPosition => {
  if (totalCards === 0) return 'hidden'

  const diff = index - activeIndex

  // Handle wraparound for circular navigation
  if (diff === 0) return 'center'
  if (diff === -1 || (diff === totalCards - 1 && activeIndex === 0)) return 'fan-left-1'
  if (diff === -2 || (diff === totalCards - 2 && activeIndex <= 1)) return 'fan-left-2'
  if (diff === 1 || (diff === -(totalCards - 1) && activeIndex === totalCards - 1)) return 'fan-right-1'
  if (diff === 2 || (diff === -(totalCards - 2) && activeIndex >= totalCards - 2)) return 'fan-right-2'

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
  onDeleteEncounter
}: EncounterCarouselProps) {
  // Carousel navigation state
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle')

  // New encounter form state
  const [newRoomNumber, setNewRoomNumber] = useState('')
  const [newChiefComplaint, setNewChiefComplaint] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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
   * Jump directly to a specific card index
   */
  const handleDotClick = useCallback((index: number) => {
    if (animationPhase !== 'idle') return
    setActiveIndex(index)
  }, [animationPhase])

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
   */
  const handleCreateEncounter = useCallback(async () => {
    if (isCreating || !newRoomNumber.trim() || !newChiefComplaint.trim()) return

    setIsCreating(true)
    try {
      const encounterId = await onCreateEncounter(newRoomNumber.trim(), newChiefComplaint.trim())

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
  }, [isCreating, newRoomNumber, newChiefComplaint, onCreateEncounter, onSelectEncounter])

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

  // Keep activeIndex in bounds if encounters change
  useEffect(() => {
    if (activeIndex >= totalCards && totalCards > 0) {
      setActiveIndex(totalCards - 1)
    }
  }, [activeIndex, totalCards])

  return (
    <div
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
            onClick={() => handleCardClick(encounter.id)}
            onDelete={() => handleDeleteEncounter(encounter.id)}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {totalCards > 1 && (
        <>
          <button
            type="button"
            className="encounter-carousel__nav encounter-carousel__nav--prev"
            onClick={handlePrev}
            disabled={animationPhase !== 'idle'}
            aria-label="Previous card"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            className="encounter-carousel__nav encounter-carousel__nav--next"
            onClick={handleNext}
            disabled={animationPhase !== 'idle'}
            aria-label="Next card"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Position Indicator Dots */}
      {totalCards > 1 && (
        <div className="encounter-carousel__indicators" role="tablist" aria-label="Carousel navigation">
          {Array.from({ length: totalCards }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`encounter-carousel__dot ${idx === activeIndex ? 'encounter-carousel__dot--active' : ''}`}
              onClick={() => handleDotClick(idx)}
              disabled={animationPhase !== 'idle'}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={idx === 0 ? 'New encounter' : `Encounter ${idx}`}
            />
          ))}
        </div>
      )}

      {/* Empty State (when only new encounter card exists) */}
      {encounters.length === 0 && activeIndex === 0 && (
        <div className="encounter-carousel__empty">
          <span className="encounter-carousel__empty-icon" aria-hidden="true">
            📋
          </span>
          <p className="encounter-carousel__empty-text">
            No active encounters. Create one to get started.
          </p>
        </div>
      )}
    </div>
  )
}
