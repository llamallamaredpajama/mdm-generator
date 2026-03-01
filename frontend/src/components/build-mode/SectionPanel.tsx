import { useState, type ReactNode } from 'react'
import type { SectionStatus, SectionNumber } from '../../types/encounter'
import { MAX_SUBMISSIONS_PER_SECTION } from '../../types/encounter'
import './SectionPanel.css'

/** Custom placeholder text per section */
const SECTION_PLACEHOLDERS: Record<SectionNumber, string> = {
  1: 'Enter pertinent H&P, initial impressions, concerns...',
  2: 'Enter workup orders, results, and interpretations...',
  3: 'Enter working diagnosis, treatments, and disposition...',
}

interface SectionPanelProps {
  sectionNumber: SectionNumber
  title: string
  status: SectionStatus
  content: string
  maxChars: number
  isLocked: boolean
  submissionCount: number
  guide: ReactNode
  preview?: ReactNode
  /** Custom content rendered above the textarea (e.g., result entry cards for S2) */
  customContent?: ReactNode
  /** Custom placeholder for the textarea (overrides default) */
  textareaPlaceholder?: string
  /** Allow submit even when textarea content is empty (e.g., when customContent handles input) */
  allowEmptySubmit?: boolean
  /** Custom label for the submit button (default: "Submit Section {N}") */
  submitLabel?: string
  onContentChange: (content: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  submissionError?: string | null
  isErrorRetryable?: boolean
  onDismissError?: () => void
}

/**
 * Numbered circle indicator that reflects section status
 */
function SectionNumberCircle({ number, status }: { number: SectionNumber; status: SectionStatus }) {
  const statusClass =
    status === 'completed'
      ? 'section-circle--complete'
      : status === 'in_progress'
        ? 'section-circle--active'
        : 'section-circle--pending'

  return (
    <span className={`section-circle ${statusClass}`}>
      {status === 'completed' ? '✓' : number}
    </span>
  )
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
      {current.toLocaleString()}/{max.toLocaleString()} characters
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
    return null
  }

  return (
    <span className="submission-status">
      {remaining} re-submissions remaining
    </span>
  )
}

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
  customContent,
  textareaPlaceholder,
  allowEmptySubmit,
  submitLabel,
  onContentChange,
  onSubmit,
  isSubmitting,
  submissionError,
  isErrorRetryable,
  onDismissError,
}: SectionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(status !== 'completed')
  const [isGuideVisible, setIsGuideVisible] = useState(false)

  const safeContent = content ?? ''
  const hasContent = allowEmptySubmit || safeContent.trim().length > 0
  const canSubmit = !isLocked && submissionCount < MAX_SUBMISSIONS_PER_SECTION && hasContent
  const isOverLimit = safeContent.length > maxChars

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleGuideToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      {/* Header */}
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
          <SectionNumberCircle number={sectionNumber} status={status} />
          <h3 className="section-title">{title}</h3>
        </div>

        <div className="section-header-right">
          <button
            type="button"
            className={`section-guide-btn ${isGuideVisible ? 'section-guide-btn--active' : ''}`}
            onClick={handleGuideToggle}
            aria-expanded={isGuideVisible}
            aria-controls={`section-guide-${sectionNumber}`}
            aria-label={isGuideVisible ? 'Hide guide' : 'Show guide'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
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
        {/* Guide Content */}
        {isGuideVisible && (
          <div id={`section-guide-${sectionNumber}`} className="guide-content">
            {guide}
          </div>
        )}

        {/* Custom Content (above textarea, e.g., result entry cards for S2) */}
        {customContent && (
          <div className="custom-content-container">
            {customContent}
          </div>
        )}

        {/* Content Input */}
        <div className="input-container">
          <textarea
            className={`section-textarea ${isOverLimit ? 'textarea-error' : ''} ${customContent ? 'section-textarea--supplementary' : ''}`}
            value={content}
            onChange={handleContentChange}
            maxLength={maxChars}
            disabled={isLocked}
            placeholder={isLocked ? 'This section is locked' : (textareaPlaceholder ?? SECTION_PLACEHOLDERS[sectionNumber])}
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
                  {safeContent.length - maxChars} characters over limit
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
                  submitLabel ?? `Submit Section ${sectionNumber}`
                )}
              </button>
              <CharacterCount current={safeContent.length} max={maxChars} />
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
