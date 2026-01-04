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
        Build Mode
        <button
          type="button"
          className="build-mode-toggle__info"
          onClick={onInfoClick}
          aria-label="Learn about input modes"
          title="Learn about Simple and Build modes"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
            <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="6" r="1.2" />
            <rect x="8.8" y="8.5" width="2.4" height="6" rx="1" />
          </svg>
        </button>
      </span>
    </div>
  )
}
