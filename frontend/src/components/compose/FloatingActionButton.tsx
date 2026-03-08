import './FloatingActionButton.css'

interface FloatingActionButtonProps {
  open: boolean
  onClick: () => void
}

export default function FloatingActionButton({ open, onClick }: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      className={`compose-fab ${open ? 'compose-fab--open' : ''}`}
      onClick={onClick}
      aria-label={open ? 'Close new encounter menu' : 'Create new encounter'}
      aria-expanded={open}
    >
      <svg
        className="compose-fab__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}
