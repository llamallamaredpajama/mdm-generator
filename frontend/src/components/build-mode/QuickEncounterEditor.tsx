/**
 * QuickEncounterEditor Component
 *
 * Editor view for Quick Mode encounters. Provides:
 * - Single textarea for narrative input
 * - Auto-save to Firestore
 * - Generate MDM button
 * - Output display with copy functionality
 * - Collapsible dictation guide
 */

import { useState, useCallback } from 'react'
import { useQuickEncounter } from '../../hooks/useQuickEncounter'
import { formatRoomDisplay, formatPatientIdentifier } from '../../types/encounter'
import DictationGuide from '../DictationGuide'
import { useToast } from '../../contexts/ToastContext'
import './QuickEncounterEditor.css'

interface QuickEncounterEditorProps {
  /** Encounter ID to edit */
  encounterId: string
  /** Callback when user clicks back to carousel */
  onBack: () => void
}

/**
 * QuickEncounterEditor - Editor for quick mode MDM generation
 */
export default function QuickEncounterEditor({
  encounterId,
  onBack,
}: QuickEncounterEditorProps) {
  const {
    encounter,
    loading,
    error,
    narrative,
    setNarrative,
    submitNarrative,
    isSubmitting,
    mdmOutput,
    quickStatus,
  } = useQuickEncounter(encounterId)

  const { success: showSuccess, error: showError } = useToast()
  const [showGuide, setShowGuide] = useState(false)
  const [copied, setCopied] = useState(false)

  /**
   * Handle MDM generation
   */
  const handleGenerate = useCallback(async () => {
    if (!narrative.trim()) {
      showError('Please enter a narrative before generating')
      return
    }

    const result = await submitNarrative()
    if (result?.ok) {
      showSuccess('MDM generated successfully')
    }
  }, [narrative, submitNarrative, showSuccess, showError])

  /**
   * Copy MDM text to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!mdmOutput?.text) return

    try {
      await navigator.clipboard.writeText(mdmOutput.text)
      setCopied(true)
      showSuccess('MDM copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Failed to copy to clipboard')
    }
  }, [mdmOutput?.text, showSuccess, showError])

  // Loading state
  if (loading) {
    return (
      <div className="quick-editor">
        <div className="quick-editor__loading">
          <div className="quick-editor__spinner" />
          <span>Loading encounter...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !encounter) {
    return (
      <div className="quick-editor">
        <div className="quick-editor__error">
          <span className="quick-editor__error-icon">⚠️</span>
          <p>{error?.message || 'Encounter not found'}</p>
          <button
            type="button"
            className="quick-editor__back-btn"
            onClick={onBack}
          >
            ← Back to Carousel
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = quickStatus === 'completed'
  const isProcessing = quickStatus === 'processing' || isSubmitting
  const canGenerate = narrative.trim().length > 0 && !isCompleted && !isProcessing

  return (
    <div className="quick-editor">
      {/* Header */}
      <header className="quick-editor__header">
        <div className="quick-editor__header-left">
          <h2 className="quick-editor__room">{formatRoomDisplay(encounter.roomNumber)}</h2>
          {encounter.quickModeData?.patientIdentifier && (
            <span className="quick-editor__age-sex">
              {formatPatientIdentifier(encounter.quickModeData.patientIdentifier)}
            </span>
          )}
        </div>

        <div className="quick-editor__header-right">
          {quickStatus && (
            <span className={`quick-editor__status quick-editor__status--${quickStatus}`}>
              {quickStatus === 'draft' && 'Draft'}
              {quickStatus === 'processing' && 'Processing...'}
              {quickStatus === 'completed' && 'Done'}
              {quickStatus === 'error' && 'Error'}
            </span>
          )}
          <button
            type="button"
            className={`quick-editor__guide-toggle ${showGuide ? 'quick-editor__guide-toggle--active' : ''}`}
            onClick={() => setShowGuide(!showGuide)}
            aria-expanded={showGuide}
            aria-label={showGuide ? 'Hide guide' : 'Show guide'}
          >
            <svg
              className="quick-editor__guide-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="quick-editor__content">
        {/* Left: Input/Output */}
        <div className="quick-editor__main">
          {/* Input Section - show when not completed */}
          {!isCompleted && (
            <div className="quick-editor__input-section">
              <label htmlFor="narrative-input" className="quick-editor__label">
                Encounter Narrative
              </label>
              <textarea
                id="narrative-input"
                className="quick-editor__textarea"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                maxLength={3000}
                placeholder="Dictate or type your description of the patient encounter here. Use your natural narrative style (e.g., HPI, ROS, PE, Differential, Workup, Interpretation of results, Impression, and Plan).

Example: 45-year-old male presents with chest pain x 2 hours. Pain is substernal, radiating to left arm, associated with diaphoresis. History of HTN, DM..."
                disabled={isProcessing}
              />

              <div className="quick-editor__input-footer">
                <span className={`quick-editor__char-count ${narrative.length >= 2700 ? 'quick-editor__char-count--warning' : ''} ${narrative.length >= 3000 ? 'quick-editor__char-count--limit' : ''}`}>
                  {narrative.length.toLocaleString()}/3,000 characters
                </span>

                <button
                  type="button"
                  className="quick-editor__generate-btn"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {isProcessing ? (
                    <>
                      <span className="quick-editor__btn-spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="quick-editor__btn-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Generate MDM
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Output Section - show when completed */}
          {isCompleted && mdmOutput && (
            <div className="quick-editor__output-section">
              <div className="quick-editor__output-header">
                <h3 className="quick-editor__output-title">Generated MDM</h3>
                <button
                  type="button"
                  className={`quick-editor__copy-btn ${copied ? 'quick-editor__copy-btn--copied' : ''}`}
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <>
                      <svg
                        className="quick-editor__copy-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="quick-editor__copy-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy MDM
                    </>
                  )}
                </button>
              </div>

              <div className="quick-editor__output-content">
                <pre className="quick-editor__output-text">{mdmOutput.text}</pre>
              </div>

              {/* Patient Identifier */}
              {encounter.quickModeData?.patientIdentifier && (
                <div className="quick-editor__identifier">
                  <span className="quick-editor__identifier-label">Extracted:</span>
                  <span className="quick-editor__identifier-value">
                    {[
                      encounter.quickModeData.patientIdentifier.age,
                      encounter.quickModeData.patientIdentifier.sex,
                      encounter.quickModeData.patientIdentifier.chiefComplaint,
                    ].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}

              {/* Option to view narrative */}
              <details className="quick-editor__narrative-details">
                <summary className="quick-editor__narrative-summary">
                  View Original Narrative
                </summary>
                <pre className="quick-editor__narrative-content">{narrative}</pre>
              </details>
            </div>
          )}

          {/* Error state display */}
          {quickStatus === 'error' && (
            <div className="quick-editor__error-display">
              <p>{encounter.quickModeData?.errorMessage || 'An error occurred during generation.'}</p>
              <button
                type="button"
                className="quick-editor__retry-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                Retry Generation
              </button>
            </div>
          )}
        </div>

        {/* Right: Guide Panel */}
        {showGuide && (
          <aside className="quick-editor__guide">
            <div className="quick-editor__guide-content">
              <DictationGuide />
            </div>
          </aside>
        )}
      </div>

      {/* Disclaimer */}
      <footer className="quick-editor__footer">
        <p className="quick-editor__disclaimer">
          Educational tool only. All outputs require physician review before clinical use.
        </p>
      </footer>
    </div>
  )
}
