import './NarrativeToolbar.css'

interface NarrativeToolbarProps {
  onSubmit: () => void
  isSubmitting: boolean
  canSubmit: boolean
  submitLabel: string
}

export default function NarrativeToolbar({
  onSubmit,
  isSubmitting,
  canSubmit,
  submitLabel,
}: NarrativeToolbarProps) {
  return (
    <div className="narrative-toolbar">
      {canSubmit && (
        <button
          className={`narrative-toolbar__submit${isSubmitting ? ' narrative-toolbar__submit--disabled' : ''}`}
          onClick={onSubmit}
          disabled={isSubmitting}
          type="button"
        >
          {isSubmitting ? 'BUILDING...' : submitLabel}
        </button>
      )}
    </div>
  )
}
