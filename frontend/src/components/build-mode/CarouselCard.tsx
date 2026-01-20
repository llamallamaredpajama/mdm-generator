import type {
  EncounterDocument,
  EncounterStatus,
  SectionStatus,
  EncounterMode,
  QuickModeStatus,
} from '../../types/encounter'
import { getQuickModeCardLabel, getEncounterMode } from '../../types/encounter'
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
  /** Mode context for the carousel (quick or build) */
  mode?: EncounterMode
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
 * Status badge showing overall encounter status (Build Mode)
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
 * Quick mode status badge with appropriate styling
 */
function QuickModeStatusBadge({ status }: { status: QuickModeStatus }) {
  const getStatusConfig = (status: QuickModeStatus): { label: string; className: string } => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', className: 'draft' }
      case 'processing':
        return { label: 'Processing...', className: 'processing' }
      case 'completed':
        return { label: 'Done', className: 'finalized' }
      case 'error':
        return { label: 'Error', className: 'error' }
      default:
        return { label: status, className: 'draft' }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span className={`carousel-card__status carousel-card__status--${config.className}`}>
      {status === 'processing' && (
        <span className="carousel-card__spinner" aria-hidden="true" />
      )}
      {config.label}
    </span>
  )
}

/**
 * Quick mode card content - simplified display without section indicators
 */
function QuickModeCardContent({ encounter }: { encounter: EncounterDocument }) {
  const quickStatus = encounter.quickModeData?.status || 'draft'
  const displayLabel = getQuickModeCardLabel(encounter)

  return (
    <>
      <div className="carousel-card__header">
        <h3 className="carousel-card__room">{encounter.roomNumber}</h3>
        <QuickModeStatusBadge status={quickStatus} />
      </div>

      <p className="carousel-card__complaint carousel-card__complaint--quick">
        {quickStatus === 'completed' ? displayLabel : encounter.chiefComplaint || 'Quick Encounter'}
      </p>

      {/* Quick mode indicator icon */}
      <div className="carousel-card__mode-indicator" title="Quick Compose">
        <svg
          className="carousel-card__mode-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
    </>
  )
}

/**
 * CarouselCard - Individual card in the encounter carousel
 * Supports both existing encounters and new encounter creation form
 * Mode-aware: renders differently for quick vs build mode encounters
 */
export default function CarouselCard({
  encounter,
  position,
  animationPhase,
  isSelected,
  isNewCard,
  onClick,
  onDelete,
  mode = 'build',
  newEncounterForm
}: CarouselCardProps) {
  const canDelete = encounter && (encounter.status === 'draft' || encounter.status === 'archived')
  const encounterMode = encounter ? getEncounterMode(encounter) : mode

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
    `carousel-card--mode-${encounterMode}`,
    isSelected && 'carousel-card--selected',
    isNewCard && 'carousel-card--new'
  ].filter(Boolean).join(' ')

  // New Encounter Form Card
  if (isNewCard && newEncounterForm) {
    const isQuickMode = mode === 'quick'

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

          {/* Only show identifier field in build mode - quick mode auto-extracts it */}
          {!isQuickMode && (
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
          )}

          {/* Quick mode hint */}
          {isQuickMode && (
            <p className="carousel-card__hint">
              Patient info will be extracted from your narrative
            </p>
          )}

          <button
            type="submit"
            className="carousel-card__submit"
            disabled={
              newEncounterForm.isSubmitting ||
              !newEncounterForm.roomNumber.trim() ||
              // Only require chief complaint for build mode
              (!isQuickMode && !newEncounterForm.chiefComplaint.trim())
            }
          >
            {newEncounterForm.isSubmitting
              ? 'Creating...'
              : isQuickMode
                ? 'Start Quick Encounter'
                : 'Create Encounter'}
          </button>
        </form>
      </div>
    )
  }

  // Existing Encounter Card
  if (encounter) {
    const isQuickModeEncounter = encounterMode === 'quick'
    const cardLabel = isQuickModeEncounter
      ? getQuickModeCardLabel(encounter)
      : encounter.chiefComplaint

    return (
      <div
        className={classNames}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={position === 'hidden' ? -1 : 0}
        aria-label={`${encounter.roomNumber}: ${cardLabel}`}
        aria-hidden={position === 'hidden'}
      >
        {/* Quick Mode Card Content */}
        {isQuickModeEncounter ? (
          <QuickModeCardContent encounter={encounter} />
        ) : (
          /* Build Mode Card Content */
          <>
            <div className="carousel-card__header">
              <h3 className="carousel-card__room">{encounter.roomNumber}</h3>
              <StatusBadge status={encounter.status} />
            </div>

            <p className="carousel-card__complaint">{encounter.chiefComplaint}</p>
          </>
        )}

        <div className="carousel-card__footer">
          {/* Section indicators only for build mode */}
          {!isQuickModeEncounter && <SectionIndicators encounter={encounter} />}

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
