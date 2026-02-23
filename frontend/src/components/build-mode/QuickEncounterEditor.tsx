/**
 * QuickEncounterEditor Component
 *
 * "F1 Speed" editor for Quick Mode encounters. Provides:
 * - Single textarea for narrative input (auto-focused)
 * - Inline PHI attestation (no modal)
 * - Auto-copy MDM to clipboard on generation
 * - Floating dialog dictation guide
 * - "Next Patient" quick-reset
 * - Auto-save to Firestore
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuickEncounter } from '../../hooks/useQuickEncounter'
import { formatRoomDisplay, formatPatientIdentifier } from '../../types/encounter'
import DictationGuide from '../DictationGuide'
import { useToast } from '../../contexts/ToastContext'
import TrendResultsPanel from '../TrendResultsPanel'
import TrendReportModal from '../TrendReportModal'
import { useTrendAnalysis } from '../../hooks/useTrendAnalysis'
import './QuickEncounterEditor.css'

interface QuickEncounterEditorProps {
  /** Encounter ID to edit */
  encounterId: string
  /** Callback when user clicks back to carousel */
  onBack: () => void
  /** Whether PHI attestation checkbox is checked (managed by parent) */
  phiAttested: boolean
  /** Callback to toggle PHI attestation */
  onPhiAttestedChange: (checked: boolean) => void
  /** Callback to start a new encounter (Next Patient) */
  onNewEncounter: () => void
}

/**
 * QuickEncounterEditor - F1 Speed editor for quick mode MDM generation
 */
export default function QuickEncounterEditor({
  encounterId,
  onBack,
  phiAttested,
  onPhiAttestedChange,
  onNewEncounter,
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
  const { analysis, isAnalyzing, analyze, downloadPdf } = useTrendAnalysis()
  const [showGuide, setShowGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showTrendReport, setShowTrendReport] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus textarea when editor mounts
  useEffect(() => {
    if (!loading && encounter && quickStatus !== 'completed') {
      textareaRef.current?.focus()
    }
  }, [loading, encounter, quickStatus])

  // Sync dialog open/close with showGuide state
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (showGuide && !dialog.open) {
      dialog.showModal()
    } else if (!showGuide && dialog.open) {
      dialog.close()
    }
  }, [showGuide])

  /**
   * Handle Generate button click — submit directly (PHI attested inline)
   */
  const handleGenerateClick = useCallback(async () => {
    if (!narrative.trim()) {
      showError('Please enter a narrative before generating')
      return
    }
    if (!phiAttested) {
      showError('Please confirm no PHI is included')
      return
    }

    const result = await submitNarrative()
    if (result?.ok) {
      showSuccess('MDM generated successfully')

      // Auto-copy MDM to clipboard
      if (result.mdm?.text) {
        try {
          await navigator.clipboard.writeText(result.mdm.text)
          setCopied(true)
          showSuccess('MDM copied to clipboard')
          setTimeout(() => setCopied(false), 3000)
        } catch {
          // Browser may block clipboard after async gap — fallback silently
          showSuccess('MDM ready — tap Copy')
        }
      }

      // Trigger trend analysis if enabled
      if (result.patientIdentifier?.chiefComplaint) {
        const differential = result.mdm?.json?.differential
        const dxList = Array.isArray(differential)
          ? differential
              .map((d: string | { diagnosis?: string }) => (typeof d === 'string' ? d : d.diagnosis || ''))
              .filter(Boolean)
          : []
        if (dxList.length > 0) {
          analyze(result.patientIdentifier.chiefComplaint, dxList)
        }
      }
    }
  }, [narrative, phiAttested, submitNarrative, showSuccess, showError, analyze])

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
          <span className="quick-editor__error-icon">!</span>
          <p>{error?.message || 'Encounter not found'}</p>
          <button
            type="button"
            className="quick-editor__back-btn"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = quickStatus === 'completed'
  const isProcessing = quickStatus === 'processing' || isSubmitting
  const canGenerate = narrative.trim().length > 0 && !isCompleted && !isProcessing && phiAttested

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
        <div className="quick-editor__main">
          {/* Input Section - show when not completed */}
          {!isCompleted && (
            <div className="quick-editor__input-section">
              <textarea
                ref={textareaRef}
                id="narrative-input"
                className="quick-editor__textarea"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                maxLength={2000}
                placeholder={`Dictate your encounter (e.g., "45M chest pain in Room 3...")

Include: Chief complaint, Differential (worst-first), Workup & results,
Risk assessment, Treatment, Disposition`}
                disabled={isProcessing}
              />

              <div className="quick-editor__input-footer">
                <label className="quick-editor__phi-attestation">
                  <input
                    type="checkbox"
                    checked={phiAttested}
                    onChange={(e) => onPhiAttestedChange(e.target.checked)}
                    className="quick-editor__phi-checkbox"
                  />
                  <span className="quick-editor__phi-label">No PHI included</span>
                </label>

                <button
                  type="button"
                  className="quick-editor__generate-btn"
                  onClick={handleGenerateClick}
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
                <div className="quick-editor__output-actions">
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
                  <button
                    type="button"
                    className="quick-editor__next-btn"
                    onClick={onNewEncounter}
                  >
                    <svg
                      className="quick-editor__btn-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Next Patient
                  </button>
                </div>
              </div>

              <TrendResultsPanel
                analysis={analysis}
                isLoading={isAnalyzing}
                showPdfDownload
                onDownloadPdf={() => analysis && downloadPdf(analysis.analysisId)}
              />
              {analysis && analysis.rankedFindings.length > 0 && (
                <button
                  type="button"
                  className="quick-editor__report-btn"
                  onClick={() => setShowTrendReport(true)}
                >
                  View Chart Report
                </button>
              )}

              <div className="quick-editor__output-content">
                <pre className="quick-editor__output-text">{mdmOutput.text}</pre>
              </div>

              {/* Patient Identifier + Room */}
              {encounter.quickModeData?.patientIdentifier && (
                <div className="quick-editor__identifier">
                  <span className="quick-editor__identifier-label">Extracted:</span>
                  <span className="quick-editor__identifier-value">
                    {[
                      encounter.quickModeData.patientIdentifier.age,
                      encounter.quickModeData.patientIdentifier.sex,
                      encounter.quickModeData.patientIdentifier.chiefComplaint,
                      encounter.quickModeData.patientIdentifier.roomNumber
                        ? `Rm ${encounter.quickModeData.patientIdentifier.roomNumber}`
                        : null,
                    ].filter(Boolean).join(' \u2022 ')}
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
                onClick={handleGenerateClick}
                disabled={!canGenerate}
              >
                Retry Generation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slim Footer Disclaimer */}
      <footer className="quick-editor__footer">
        <p className="quick-editor__disclaimer">
          Educational only — physician review required
        </p>
      </footer>

      {/* Dictation Guide Dialog */}
      <dialog
        ref={dialogRef}
        className="quick-editor__guide-dialog"
        onClose={() => setShowGuide(false)}
      >
        <div className="quick-editor__guide-dialog-header">
          <h3>Dictation Guide</h3>
          <button
            type="button"
            className="quick-editor__guide-dialog-close"
            onClick={() => setShowGuide(false)}
            aria-label="Close guide"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="quick-editor__guide-dialog-body">
          <DictationGuide />
        </div>
      </dialog>

      {/* Trend Report Modal */}
      {analysis && (
        <TrendReportModal
          analysis={analysis}
          isOpen={showTrendReport}
          onClose={() => setShowTrendReport(false)}
        />
      )}
    </div>
  )
}
