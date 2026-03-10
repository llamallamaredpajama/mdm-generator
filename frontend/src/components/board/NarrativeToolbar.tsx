import './NarrativeToolbar.css'

interface NarrativeToolbarProps {
  onDictate: () => void
  onType: () => void
  onSubmit: () => void
  isDictating: boolean
  isSubmitting: boolean
  canSubmit: boolean
  submitLabel: string // "PROCESS →" for build, "SUBMIT" for quick
}

export default function NarrativeToolbar({
  onDictate,
  onType,
  onSubmit,
  isDictating,
  isSubmitting,
  canSubmit,
  submitLabel,
}: NarrativeToolbarProps) {
  return (
    <div className="narrative-toolbar">
      <div className="narrative-toolbar__group">
        <button
          className={`narrative-toolbar__btn${isDictating ? ' narrative-toolbar__btn--recording' : ''}`}
          onClick={onDictate}
          title={isDictating ? 'Stop' : 'Dictate'}
          type="button"
        >
          {isDictating ? '\u25A0' : '\u25CF'}
        </button>
        <button className="narrative-toolbar__btn" onClick={onType} title="Type" type="button">
          {'\u2328'}
        </button>
      </div>

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
