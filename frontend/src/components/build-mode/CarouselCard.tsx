import type { EncounterDocument, EncounterStatus, SectionStatus } from '../../types/encounter'
import './CarouselCard.css'

export type CardPosition =
  | 'center'
  | 'fan-left-1' | 'fan-left-2' | 'fan-left-3'
  | 'fan-right-1' | 'fan-right-2' | 'fan-right-3'
  | 'hidden'
export type AnimationPhase = 'idle' | 'selecting' | 'transitioning' | 'fading'

interface CarouselCardProps {
  encounter?: EncounterDocument
  position: CardPosition
  animationPhase: AnimationPhase
  isSelected: boolean
  isNewCard?: boolean
  onClick?: () => void
  onDelete?: () => void
  // For new encounter form
  newEncounterForm?: {
    roomNumber: string
    chiefComplaint: string
    onRoomChange: (value: string) => void
    onComplaintChange: (value: string) => void
    onSubmit: () => void
    isSubmitting: boolean
  }
}

/**
 * Section indicator component showing progress through 3 sections
 * ● active, ○ pending, ✓ complete
 */
function SectionIndicators({ encounter }: { encounter: EncounterDocument }) {
  const getSectionIndicator = (
    sectionStatus: SectionStatus,
    sectionNumber: 1 | 2 | 3,
    currentSection: number
  ) => {
    if (sectionStatus === 'completed') {
      return <span className="carousel-card__section carousel-card__section--complete" title={`Section ${sectionNumber} complete`}>✓</span>
    }
    if (sectionNumber === currentSection && sectionStatus === 'in_progress') {
      return <span className="carousel-card__section carousel-card__section--active" title={`Section ${sectionNumber} in progress`}>●</span>
    }
    return <span className="carousel-card__section carousel-card__section--pending" title={`Section ${sectionNumber} pending`}>○</span>
  }

  return (
    <div className="carousel-card__sections">
      {getSectionIndicator(encounter.section1.status, 1, encounter.currentSection)}
      {getSectionIndicator(encounter.section2.status, 2, encounter.currentSection)}
      {getSectionIndicator(encounter.section3.status, 3, encounter.currentSection)}
    </div>
  )
}

/**
 * Status badge showing overall encounter status
 */
function StatusBadge({ status }: { status: EncounterStatus }) {
  const getStatusLabel = (status: EncounterStatus): string => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'section1_done':
        return 'Section 1 Done'
      case 'section2_done':
        return 'Section 2 Done'
      case 'finalized':
        return 'Finalized'
      case 'archived':
        return 'Archived'
      default:
        return status
    }
  }

  return (
    <span className={`carousel-card__status carousel-card__status--${status}`}>
      {getStatusLabel(status)}
    </span>
  )
}

/**
 * CarouselCard - Individual card in the encounter carousel
 * Supports both existing encounters and new encounter creation form
 */
export default function CarouselCard({
  encounter,
  position,
  animationPhase,
  isSelected,
  isNewCard,
  onClick,
  onDelete,
  newEncounterForm
}: CarouselCardProps) {
  const canDelete = encounter && (encounter.status === 'draft' || encounter.status === 'archived')

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    newEncounterForm?.onSubmit()
  }

  // Build className string
  const classNames = [
    'carousel-card',
    `carousel-card--${position}`,
    `carousel-card--${animationPhase}`,
    isSelected && 'carousel-card--selected',
    isNewCard && 'carousel-card--new'
  ].filter(Boolean).join(' ')

  // New Encounter Form Card
  if (isNewCard && newEncounterForm) {
    return (
      <div
        className={classNames}
        role="region"
        aria-label="Create new encounter"
      >
        <div className="carousel-card__header">
          <h3 className="carousel-card__title">New Encounter</h3>
        </div>

        <form className="carousel-card__form" onSubmit={handleFormSubmit}>
          <div className="carousel-card__field">
            <label htmlFor="new-room" className="carousel-card__label">
              Room Number
            </label>
            <input
              id="new-room"
              type="text"
              className="carousel-card__input"
              value={newEncounterForm.roomNumber}
              onChange={(e) => newEncounterForm.onRoomChange(e.target.value)}
              placeholder="e.g., Room 5"
              disabled={newEncounterForm.isSubmitting}
              autoComplete="off"
            />
          </div>

          <div className="carousel-card__field">
            <label htmlFor="new-complaint" className="carousel-card__label">
              Identifier
            </label>
            <input
              id="new-complaint"
              type="text"
              className="carousel-card__input"
              value={newEncounterForm.chiefComplaint}
              onChange={(e) => newEncounterForm.onComplaintChange(e.target.value)}
              placeholder="Age, Sex, Chief Complaint"
              disabled={newEncounterForm.isSubmitting}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="carousel-card__submit"
            disabled={
              newEncounterForm.isSubmitting ||
              !newEncounterForm.roomNumber.trim() ||
              !newEncounterForm.chiefComplaint.trim()
            }
          >
            {newEncounterForm.isSubmitting ? 'Creating...' : 'Create Encounter'}
          </button>
        </form>
      </div>
    )
  }

  // Existing Encounter Card
  if (encounter) {
    return (
      <div
        className={classNames}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={position === 'hidden' ? -1 : 0}
        aria-label={`${encounter.roomNumber}: ${encounter.chiefComplaint}`}
        aria-hidden={position === 'hidden'}
      >
        <div className="carousel-card__header">
          <h3 className="carousel-card__room">{encounter.roomNumber}</h3>
          <StatusBadge status={encounter.status} />
        </div>

        <p className="carousel-card__complaint">{encounter.chiefComplaint}</p>

        <div className="carousel-card__footer">
          <SectionIndicators encounter={encounter} />

          {canDelete && (
            <button
              className="carousel-card__delete"
              onClick={handleDelete}
              aria-label={`Delete encounter for ${encounter.roomNumber}`}
              title="Delete encounter"
            >
              <svg
                className="carousel-card__delete-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Fallback empty card
  return (
    <div className={classNames} aria-hidden="true">
      <div className="carousel-card__empty">No encounter data</div>
    </div>
  )
}
