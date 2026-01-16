import { useState, type ReactNode } from 'react'
import type { SectionStatus, SectionNumber } from '../../types/encounter'
import { MAX_SUBMISSIONS_PER_SECTION } from '../../types/encounter'
import './SectionPanel.css'

interface SectionPanelProps {
  /** Section number (1, 2, or 3) */
  sectionNumber: SectionNumber
  /** Display title for the section */
  title: string
  /** Current status of the section */
  status: SectionStatus
  /** User input content */
  content: string
  /** Maximum allowed characters */
  maxChars: number
  /** Whether the section is locked (no more edits allowed) */
  isLocked: boolean
  /** Number of times this section has been submitted */
  submissionCount: number
  /** Guide component to render in collapsible area */
  guide: ReactNode
  /** Preview component for LLM response */
  preview?: ReactNode
  /** Callback when content changes */
  onContentChange: (content: string) => void
  /** Callback when user submits section */
  onSubmit: () => void
  /** Whether submission is in progress */
  isSubmitting: boolean
  /** Error message from failed submission */
  submissionError?: string | null
  /** Whether the error is retryable */
  isErrorRetryable?: boolean
  /** Callback to dismiss error */
  onDismissError?: () => void
}

/**
 * Section status indicator
 */
function SectionStatusIndicator({ status }: { status: SectionStatus }) {
  const getIndicator = () => {
    switch (status) {
      case 'completed':
        return <span className="section-status-icon section-status-complete" title="Completed">✓</span>
      case 'in_progress':
        return <span className="section-status-icon section-status-active" title="In Progress">●</span>
      case 'pending':
      default:
        return <span className="section-status-icon section-status-pending" title="Pending">○</span>
    }
  }

  return getIndicator()
}

/**
 * Character count display with warning states
 */
function CharacterCount({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100
  const isWarning = percentage >= 80 && percentage < 100
  const isOverLimit = current > max

  return (
    <span
      className={`char-count ${isWarning ? 'char-count-warning' : ''} ${isOverLimit ? 'char-count-error' : ''}`}
    >
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

/**
 * Submission status indicator showing remaining submissions or locked state
 */
function SubmissionStatus({
  submissionCount,
  isLocked,
}: {
  submissionCount: number
  isLocked: boolean
}) {
  if (isLocked) {
    return (
      <span className="submission-status submission-locked">
        <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Locked
      </span>
    )
  }

  const remaining = MAX_SUBMISSIONS_PER_SECTION - submissionCount
  if (remaining === 1) {
    return (
      <span className="submission-status submission-warning">
        1 re-submission remaining
      </span>
    )
  }

  if (submissionCount === 0) {
    return null // Don't show anything on first submission
  }

  return (
    <span className="submission-status">
      {remaining} re-submissions remaining
    </span>
  )
}

/**
 * Collapsible section panel for the 3-section Build Mode workflow
 *
 * Each panel includes:
 * - Collapsible header with status indicator
 * - Character count display
 * - Textarea for user input
 * - Toggleable guide with prompts
 * - Preview area for LLM response
 * - Submit button with submission limits
 */
export default function SectionPanel({
  sectionNumber,
  title,
  status,
  content,
  maxChars,
  isLocked,
  submissionCount,
  guide,
  preview,
  onContentChange,
  onSubmit,
  isSubmitting,
  submissionError,
  isErrorRetryable,
  onDismissError,
}: SectionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(status !== 'completed')
  const [isGuideVisible, setIsGuideVisible] = useState(false)

  const canSubmit = !isLocked && submissionCount < MAX_SUBMISSIONS_PER_SECTION && content.trim().length > 0
  const isOverLimit = content.length > maxChars

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleGuideToggle = () => {
    setIsGuideVisible(!isGuideVisible)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
  }

  const handleSubmit = () => {
    if (canSubmit && !isOverLimit && !isSubmitting) {
      onSubmit()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <section className={`section-panel ${isExpanded ? 'section-panel-expanded' : 'section-panel-collapsed'}`}>
      {/* Collapsible Header */}
      <header
        className="section-panel-header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${sectionNumber}`}
      >
        <div className="section-header-left">
          <span className="section-number">Section {sectionNumber}</span>
          <SectionStatusIndicator status={status} />
          <h3 className="section-title">{title}</h3>
        </div>

        <div className="section-header-right">
          <CharacterCount current={content.length} max={maxChars} />
          <span className={`expand-icon ${isExpanded ? 'expand-icon-open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </header>

      {/* Collapsible Content */}
      <div
        id={`section-content-${sectionNumber}`}
        className="section-panel-content"
        hidden={!isExpanded}
      >
        {/* Guide Toggle */}
        <div className="guide-toggle-container">
          <button
            type="button"
            className="guide-toggle-button"
            onClick={handleGuideToggle}
            aria-expanded={isGuideVisible}
            aria-controls={`section-guide-${sectionNumber}`}
          >
            <svg className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {isGuideVisible ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {/* Guide Content */}
        {isGuideVisible && (
          <div id={`section-guide-${sectionNumber}`} className="guide-content">
            {guide}
          </div>
        )}

        {/* Content Input */}
        <div className="input-container">
          <textarea
            className={`section-textarea ${isOverLimit ? 'textarea-error' : ''}`}
            value={content}
            onChange={handleContentChange}
            disabled={isLocked}
            placeholder={isLocked ? 'This section is locked' : `Enter your ${title.toLowerCase()} notes...`}
            aria-label={`Section ${sectionNumber}: ${title}`}
            aria-describedby={`section-status-${sectionNumber}`}
          />

          {/* Error Display */}
        {submissionError && (
          <div className={`section-error ${isErrorRetryable ? 'section-error-retryable' : ''}`} role="alert">
            <div className="section-error-content">
              <svg className="section-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="section-error-message">{submissionError}</span>
            </div>
            <div className="section-error-actions">
              {isErrorRetryable && (
                <button
                  type="button"
                  className="section-error-retry"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                >
                  Try Again
                </button>
              )}
              {onDismissError && (
                <button
                  type="button"
                  className="section-error-dismiss"
                  onClick={onDismissError}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div id={`section-status-${sectionNumber}`} className="input-footer">
            <SubmissionStatus submissionCount={submissionCount} isLocked={isLocked} />

            <div className="submit-area">
              {isOverLimit && (
                <span className="char-error-message">
                  {content.length - maxChars} characters over limit
                </span>
              )}
              <button
                type="button"
                className="submit-button"
                onClick={handleSubmit}
                disabled={!canSubmit || isOverLimit || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="submit-spinner" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Section {sectionNumber}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area (shown when LLM response exists) */}
        {preview && (
          <div className="preview-container">
            <div className="preview-header">
              <svg className="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="preview-label">AI Response</span>
            </div>
            <div className="preview-content">
              {preview}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
