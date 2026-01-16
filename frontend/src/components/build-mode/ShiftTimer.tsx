import { useShiftWindow } from '../../hooks/useShiftWindow'
import type { Timestamp } from 'firebase/firestore'
import type { EncounterStatus } from '../../types/encounter'

/**
 * Props for ShiftTimer component
 */
interface ShiftTimerProps {
  /** Firestore Timestamp when the shift/encounter started */
  shiftStartedAt: Timestamp | null | undefined
  /** Current encounter status (for archived state detection) */
  status?: EncounterStatus
  /** Optional additional CSS class */
  className?: string
  /** Show icon alongside time (default: true) */
  showIcon?: boolean
}

/**
 * Compact shift timer display component for header use
 *
 * Shows time remaining in 12-hour shift window with visual status:
 * - Green/default: > 1 hour remaining
 * - Yellow warning: < 1 hour remaining
 * - Red alert: expired
 * - Gray: archived
 *
 * @example
 * ```tsx
 * <ShiftTimer
 *   shiftStartedAt={encounter.shiftStartedAt}
 *   status={encounter.status}
 * />
 * ```
 */
export function ShiftTimer({
  shiftStartedAt,
  status,
  className = '',
  showIcon = true,
}: ShiftTimerProps) {
  const { formattedTime, isExpired, isExpiringSoon, isArchived } = useShiftWindow(
    shiftStartedAt,
    status
  )

  // Determine visual state
  const getStatusStyles = (): {
    containerClass: string
    textClass: string
    icon: string
  } => {
    if (isArchived) {
      return {
        containerClass: 'shift-timer shift-timer--archived',
        textClass: 'shift-timer__text shift-timer__text--archived',
        icon: '📦',
      }
    }

    if (isExpired) {
      return {
        containerClass: 'shift-timer shift-timer--expired',
        textClass: 'shift-timer__text shift-timer__text--expired',
        icon: '⏰',
      }
    }

    if (isExpiringSoon) {
      return {
        containerClass: 'shift-timer shift-timer--warning',
        textClass: 'shift-timer__text shift-timer__text--warning',
        icon: '⚠️',
      }
    }

    return {
      containerClass: 'shift-timer shift-timer--normal',
      textClass: 'shift-timer__text shift-timer__text--normal',
      icon: '🕐',
    }
  }

  const { containerClass, textClass, icon } = getStatusStyles()

  return (
    <div
      className={`${containerClass} ${className}`.trim()}
      role="timer"
      aria-live="polite"
      aria-label={`Shift time remaining: ${formattedTime}`}
    >
      {showIcon && <span className="shift-timer__icon" aria-hidden="true">{icon}</span>}
      <span className={textClass}>{formattedTime}</span>
    </div>
  )
}

/**
 * Inline styles for ShiftTimer when CSS module not available
 * These can be overridden by BuildMode.css
 */
export const shiftTimerStyles = `
  .shift-timer {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    white-space: nowrap;
  }

  .shift-timer__icon {
    font-size: 0.875rem;
  }

  .shift-timer__text {
    font-family: inherit;
  }

  /* Normal state (> 1 hour remaining) */
  .shift-timer--normal {
    background-color: var(--color-success-bg, #dcfce7);
    color: var(--color-success-text, #166534);
  }

  .shift-timer__text--normal {
    color: inherit;
  }

  /* Warning state (< 1 hour remaining) */
  .shift-timer--warning {
    background-color: var(--color-warning-bg, #fef9c3);
    color: var(--color-warning-text, #854d0e);
    animation: pulse-warning 2s ease-in-out infinite;
  }

  .shift-timer__text--warning {
    color: inherit;
  }

  /* Expired state */
  .shift-timer--expired {
    background-color: var(--color-error-bg, #fee2e2);
    color: var(--color-error-text, #991b1b);
    animation: pulse-expired 1s ease-in-out infinite;
  }

  .shift-timer__text--expired {
    color: inherit;
    font-weight: 600;
  }

  /* Archived state */
  .shift-timer--archived {
    background-color: var(--color-muted-bg, #f3f4f6);
    color: var(--color-muted-text, #6b7280);
  }

  .shift-timer__text--archived {
    color: inherit;
  }

  /* Animations */
  @keyframes pulse-warning {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes pulse-expired {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.02);
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .shift-timer--normal {
      background-color: var(--color-success-bg-dark, #166534);
      color: var(--color-success-text-dark, #dcfce7);
    }

    .shift-timer--warning {
      background-color: var(--color-warning-bg-dark, #854d0e);
      color: var(--color-warning-text-dark, #fef9c3);
    }

    .shift-timer--expired {
      background-color: var(--color-error-bg-dark, #991b1b);
      color: var(--color-error-text-dark, #fee2e2);
    }

    .shift-timer--archived {
      background-color: var(--color-muted-bg-dark, #374151);
      color: var(--color-muted-text-dark, #9ca3af);
    }
  }
`

export default ShiftTimer
