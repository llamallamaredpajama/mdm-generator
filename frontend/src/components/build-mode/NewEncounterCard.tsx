import type { EncounterMode } from '../../types/encounter'
import './NewEncounterCard.css'

export interface NewEncounterFormData {
  roomNumber: string
  chiefComplaint: string
  onRoomChange: (value: string) => void
  onComplaintChange: (value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

interface NewEncounterCardProps {
  /** Form state and handlers */
  form: NewEncounterFormData
  /** Mode context (quick or build) */
  mode?: EncounterMode
  /** Optional className for additional styling */
  className?: string
}

/**
 * NewEncounterCard - Form card for creating new encounters
 *
 * Renders a form with:
 * - Room number input (always shown)
 * - Chief complaint / identifier input (build mode only)
 * - Hint text (quick mode only)
 * - Submit button
 *
 * Layout-agnostic - parent component controls positioning.
 */
export default function NewEncounterCard({
  form,
  mode = 'build',
  className,
}: NewEncounterCardProps) {
  const isQuickMode = mode === 'quick'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.onSubmit()
  }

  const isSubmitDisabled =
    form.isSubmitting ||
    !form.roomNumber.trim() ||
    // Only require chief complaint for build mode
    (!isQuickMode && !form.chiefComplaint.trim())

  const cardClasses = [
    'new-encounter-card',
    `new-encounter-card--mode-${mode}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClasses}
      role="region"
      aria-label="Create new encounter"
    >
      <div className="new-encounter-card__header">
        <h3 className="new-encounter-card__title">New Encounter</h3>
      </div>

      <form className="new-encounter-card__form" onSubmit={handleSubmit}>
        <div className="new-encounter-card__field">
          <label htmlFor="new-room" className="new-encounter-card__label">
            Room Number
          </label>
          <input
            id="new-room"
            type="text"
            className="new-encounter-card__input"
            value={form.roomNumber}
            onChange={(e) => form.onRoomChange(e.target.value)}
            placeholder="e.g., Room 5"
            disabled={form.isSubmitting}
            autoComplete="off"
          />
        </div>

        {/* Only show identifier field in build mode - quick mode auto-extracts it */}
        {!isQuickMode && (
          <div className="new-encounter-card__field">
            <label htmlFor="new-complaint" className="new-encounter-card__label">
              Identifier
            </label>
            <input
              id="new-complaint"
              type="text"
              className="new-encounter-card__input"
              value={form.chiefComplaint}
              onChange={(e) => form.onComplaintChange(e.target.value)}
              placeholder="Age, Sex, Chief Complaint"
              disabled={form.isSubmitting}
              autoComplete="off"
            />
          </div>
        )}

        {/* Quick mode hint */}
        {isQuickMode && (
          <p className="new-encounter-card__hint">
            Patient info will be extracted from your narrative
          </p>
        )}

        <button
          type="submit"
          className="new-encounter-card__submit"
          disabled={isSubmitDisabled}
        >
          {form.isSubmitting
            ? 'Creating...'
            : isQuickMode
              ? 'Start Quick Encounter'
              : 'Create Encounter'}
        </button>
      </form>
    </div>
  )
}
