import './BuildModeToggle.css'

interface BuildModeToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  onInfoClick: () => void
  disabled?: boolean
}

export default function BuildModeToggle({
  enabled,
  onChange,
  onInfoClick,
  disabled = false,
}: BuildModeToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!enabled)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className={`build-mode-toggle ${disabled ? 'build-mode-toggle--disabled' : ''}`}>
      <div
        className={`build-mode-toggle__switch ${enabled ? 'build-mode-toggle__switch--active' : ''}`}
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle Build Mode"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="build-mode-toggle__track">
          <span className="build-mode-toggle__thumb" />
        </span>
      </div>

      <span className="build-mode-toggle__label">
        {enabled ? 'Build Mode' : 'Simple Mode'}
      </span>

      <button
        type="button"
        className="build-mode-toggle__info"
        onClick={onInfoClick}
        aria-label="Learn about input modes"
        title="Learn about Simple and Build modes"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
    </div>
  )
}
