/**
 * ProgressIndicator Component
 *
 * Visual progress dots and summary text for S2 result entry.
 * Shows per-test status dots (green=unremarkable, red=abnormal, gray=pending)
 * and a text summary of completion progress.
 */

import './ProgressIndicator.css'

interface ProgressIndicatorProps {
  /** Total number of tests to respond to */
  total: number
  /** Number of tests that have been responded to (unremarkable + abnormal) */
  responded: number
  /** Number of tests marked abnormal */
  abnormalCount: number
  /** Status per test index: 'unremarkable' | 'abnormal' | 'pending' */
  statuses: ('unremarkable' | 'abnormal' | 'pending')[]
}

export default function ProgressIndicator({
  total,
  responded,
  abnormalCount,
  statuses,
}: ProgressIndicatorProps) {
  if (total === 0) return null

  return (
    <div className="progress-indicator" data-testid="progress-indicator">
      <div className="progress-indicator__dots" aria-hidden="true">
        {statuses.map((status, idx) => (
          <span
            key={idx}
            className={`progress-indicator__dot progress-indicator__dot--${status}`}
          />
        ))}
      </div>
      <div className="progress-indicator__summary">
        <span className="progress-indicator__count">
          {responded}/{total} resulted
        </span>
        {abnormalCount > 0 && (
          <span className="progress-indicator__abnormal">
            {abnormalCount} abnormal
          </span>
        )}
      </div>
    </div>
  )
}
