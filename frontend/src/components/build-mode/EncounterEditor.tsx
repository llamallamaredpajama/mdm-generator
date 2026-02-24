/**
 * EncounterEditor Component
 *
 * Main editor for a single encounter with 3-section guided workflow.
 * Handles section navigation, content editing, and submission.
 *
 * Build Mode v2 - Phase 4
 */

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, useAuth, useAuthToken } from '../../lib/firebase'
import { useEncounter, useSectionState } from '../../hooks/useEncounter'
import { ShiftTimer } from './ShiftTimer'
import SectionPanel from './SectionPanel'
import Section1Guide from './Section1Guide'
import Section2Guide from './Section2Guide'
import Section3Guide from './Section3Guide'
import MdmPreviewPanel from './MdmPreviewPanel'
import DashboardOutput from './shared/DashboardOutput'
import type { SectionNumber, EncounterDocument, SectionStatus, MdmPreview, FinalMdm, CdrTracking, CdrTrackingEntry, TestResult } from '../../types/encounter'
import { SECTION_TITLES, SECTION_CHAR_LIMITS, formatRoomDisplay } from '../../types/encounter'
import { BuildModeStatusCircles } from './shared/CardContent'
import { ApiError, matchCdrs } from '../../lib/api'
import { useTestLibrary } from '../../hooks/useTestLibrary'
import { useCdrLibrary } from '../../hooks/useCdrLibrary'
import ConfirmationModal from '../ConfirmationModal'
import TrendAnalysisToggle from '../TrendAnalysisToggle'
import TrendReportModal from '../TrendReportModal'
import { useTrendAnalysis } from '../../hooks/useTrendAnalysis'
import { useToast } from '../../contexts/ToastContext'
import './EncounterEditor.css'

/**
 * Error state for a section submission
 */
interface SectionError {
  message: string
  isRetryable: boolean
  errorType: 'network' | 'auth' | 'validation' | 'quota' | 'server' | 'unknown'
}

interface EncounterEditorProps {
  /** Firestore document ID for the encounter to edit */
  encounterId: string
  /** Callback when user clicks back to return to dashboard */
  onBack: () => void
}

/**
 * Get the guide component for a specific section
 */
function getSectionGuide(section: SectionNumber): ReactNode {
  switch (section) {
    case 1:
      return <Section1Guide />
    case 2:
      return <Section2Guide />
    case 3:
      return <Section3Guide />
  }
}

/**
 * Get the preview component for a section based on encounter data
 */
function getSectionPreview(
  section: SectionNumber,
  encounter: EncounterDocument | null
): ReactNode | null {
  if (!encounter) return null

  switch (section) {
    case 1:
      // Dashboard output renders as standalone component between S1 and S2
      return null
    case 2: {
      // Handle both nested { mdmPreview } and flat MdmPreview shapes (backward compat)
      const s2Response = encounter.section2.llmResponse
      const mdmPreview = s2Response?.mdmPreview ??
        ((s2Response as unknown as MdmPreview)?.problems !== undefined ? s2Response as unknown as MdmPreview : null)
      if (mdmPreview) {
        return <MdmPreviewPanel mdmPreview={mdmPreview} />
      }
      return null
    }
    case 3:
      // Section 3 doesn't have an inline preview (final MDM shows in output)
      return null
  }
}

/**
 * Main encounter editor component
 *
 * Renders a 3-section layout with collapsible panels.
 * Each SectionPanel manages its own expand/collapse state.
 */
export default function EncounterEditor({ encounterId, onBack }: EncounterEditorProps) {
  const {
    encounter,
    loading,
    error,
    updateSectionContent,
    submitSection,
    isSubmitting,
    submittingSection,
  } = useEncounter(encounterId)

  const { user } = useAuth()
  const token = useAuthToken()
  const { tests: testLibrary } = useTestLibrary()
  const { cdrs: cdrLibrary } = useCdrLibrary()

  // Working diagnosis input for Section 2
  const [workingDiagnosis, setWorkingDiagnosis] = useState('')

  // Selected tests state (initialized from encounter, persisted to Firestore)
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const selectedTestsInitRef = useRef(false)
  const firestoreWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTestsRef = useRef<string[] | null>(null)

  // Initialize selectedTests from encounter data
  useEffect(() => {
    if (encounter && !selectedTestsInitRef.current) {
      setSelectedTests(encounter.section2?.selectedTests ?? [])
      selectedTestsInitRef.current = true
    }
  }, [encounter])

  // Debounced Firestore write for selectedTests
  const handleSelectedTestsChange = useCallback(
    (testIds: string[]) => {
      setSelectedTests(testIds)

      if (!user || !encounterId) return

      pendingTestsRef.current = testIds
      if (firestoreWriteTimer.current) {
        clearTimeout(firestoreWriteTimer.current)
      }
      firestoreWriteTimer.current = setTimeout(() => {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.selectedTests': testIds }).catch((err) =>
          console.error('Failed to persist selectedTests:', err?.message || 'unknown error')
        )
        pendingTestsRef.current = null
      }, 300)
    },
    [user, encounterId]
  )

  // Flush pending write and cleanup on unmount
  useEffect(() => {
    return () => {
      if (firestoreWriteTimer.current) clearTimeout(firestoreWriteTimer.current)
      if (pendingTestsRef.current !== null && user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.selectedTests': pendingTestsRef.current }).catch((err) =>
          console.error('Failed to flush selectedTests on unmount:', err?.message || 'unknown error')
        )
      }
    }
  }, [user, encounterId])

  // Section error states
  const [sectionErrors, setSectionErrors] = useState<Record<SectionNumber, SectionError | null>>({
    1: null,
    2: null,
    3: null,
  })

  // Quota exceeded state for showing upgrade prompt
  const [showQuotaExceeded, setShowQuotaExceeded] = useState(false)

  const { success: toastSuccess, error: toastError } = useToast()
  const { analysis, isAnalyzing, analyze } = useTrendAnalysis()

  // Track whether we've already triggered analysis for this encounter
  const analyzedForRef = useRef<string | null>(null)

  // Trigger trend analysis when Section 1 completes (watches Firestore state)
  useEffect(() => {
    if (
      encounter?.section1?.status === 'completed' &&
      encounter.section1.llmResponse &&
      encounter.chiefComplaint &&
      analyzedForRef.current !== encounter.id
    ) {
      const llmResponse = encounter.section1.llmResponse
      // Handle both flat DifferentialItem[] and wrapped { differential: [...] } shapes
      const differential = Array.isArray(llmResponse) ? llmResponse : llmResponse?.differential
      if (Array.isArray(differential)) {
        const dxList = differential
          .map((d: string | { diagnosis?: string }) => (typeof d === 'string' ? d : d.diagnosis || ''))
          .filter(Boolean)
        if (dxList.length > 0) {
          analyzedForRef.current = encounter.id
          analyze(encounter.chiefComplaint, dxList)
        }
      }
    }
  }, [encounter?.id, encounter?.section1?.status, encounter?.section1?.llmResponse, encounter?.chiefComplaint, analyze])

  // Trigger CDR matching when Section 1 completes (non-blocking, supplements trend analysis)
  const cdrMatchedForRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      encounter?.section1?.status === 'completed' &&
      encounter.section1.llmResponse &&
      token &&
      cdrMatchedForRef.current !== encounter.id
    ) {
      cdrMatchedForRef.current = encounter.id
      // Fire and forget — backend writes cdrTracking to Firestore, onSnapshot picks it up
      matchCdrs(encounter.id, token).catch((err) => {
        console.warn('CDR matching failed (non-blocking):', err?.message || 'unknown error')
      })
    }
  }, [encounter?.id, encounter?.section1?.status, encounter?.section1?.llmResponse, token])

  // Auto-populate CDR components from S2 test results (BM-3.3)
  const lastTestResultsHashRef = useRef<string | null>(null)
  useEffect(() => {
    const testResults = encounter?.section2?.testResults
    const cdrTracking = encounter?.cdrTracking
    if (!testResults || !cdrTracking || !user || !encounterId) return
    if (Object.keys(testResults).length === 0) return
    if (Object.keys(cdrTracking).length === 0) return
    if (testLibrary.length === 0 || cdrLibrary.length === 0) return

    // Compute a simple hash to detect changes (avoid re-running for same data)
    const resultsHash = JSON.stringify(
      Object.entries(testResults).map(([id, r]) => [id, r.status, r.value]).sort()
    )
    if (resultsHash === lastTestResultsHashRef.current) return
    lastTestResultsHashRef.current = resultsHash

    // Build updated cdrTracking with section2 auto-population
    let updated: CdrTracking = { ...cdrTracking }
    let changed = false

    for (const [testId, result] of Object.entries(testResults) as [string, TestResult][]) {
      if (result.status === 'pending') continue

      const testDef = testLibrary.find((t) => t.id === testId)
      if (!testDef?.feedsCdrs?.length) continue

      for (const cdrId of testDef.feedsCdrs) {
        // Re-read entry from updated (not stale) to handle multiple components per CDR
        const entry = updated[cdrId]
        if (!entry || entry.dismissed) continue

        const cdrDef = cdrLibrary.find((c) => c.id === cdrId)
        if (!cdrDef) continue

        for (const comp of cdrDef.components) {
          if (comp.source !== 'section2' || comp.id !== testId) continue

          // Re-read from current updated state (entry may be stale after prior component update)
          const currentEntry = updated[cdrId]
          if (!currentEntry) continue

          // Don't override user-input values
          const existing = currentEntry.components[comp.id]
          if (existing?.answered && existing.source === 'user_input') continue
          // Don't re-write if already populated from section2
          if (existing?.answered && existing.source === 'section2') continue

          let value: number | null = null
          if (comp.type === 'boolean') {
            value = result.status === 'abnormal' ? (comp.value ?? 1) : 0
          }
          // Select/number_range: skip for v1 (needs heuristic or LLM mapping)

          if (value === null) continue

          const updatedComponents: Record<string, import('../../types/encounter').CdrComponentState> = {
            ...currentEntry.components,
            [comp.id]: { value, answered: true, source: 'section2' as const },
          }

          // Recompute status and score
          const vals = Object.values(updatedComponents)
          const answeredCount = vals.filter((c) => c.answered).length
          const status: import('../../types/encounter').CdrStatus =
            answeredCount === 0 ? 'pending' : answeredCount === vals.length ? 'completed' : 'partial'

          let score: number | null = null
          let interpretation: string | null = null
          if (status === 'completed' && cdrDef.scoring.method === 'sum') {
            score = vals.reduce((sum, c) => sum + (c.value ?? 0), 0)
            const range = cdrDef.scoring.ranges.find((r) => score! >= r.min && score! <= r.max)
            interpretation = range ? `${range.risk}: ${range.interpretation}` : null
          }

          const updatedEntry: CdrTrackingEntry = {
            ...currentEntry,
            components: updatedComponents,
            status,
            score,
            interpretation,
            completedInSection: status === 'completed' ? 2 : currentEntry.completedInSection,
          }

          updated = { ...updated, [cdrId]: updatedEntry }
          changed = true
        }
      }
    }

    if (changed) {
      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      updateDoc(encounterRef, { cdrTracking: updated }).catch((err) => {
        console.error('Failed to auto-populate CDR from S2 results:', err?.message || 'unknown error')
      })
    }
  }, [encounter?.section2?.testResults, encounter?.cdrTracking, testLibrary, cdrLibrary, user, encounterId])

  // Trend report modal state
  const [showTrendReport, setShowTrendReport] = useState(false)

  // PHI confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSection, setPendingSection] = useState<SectionNumber | null>(null)

  // Section state helpers
  const section1State = useSectionState(encounter, 1)
  const section2State = useSectionState(encounter, 2)
  const section3State = useSectionState(encounter, 3)

  /**
   * Handle content change in a section
   */
  const handleContentChange = useCallback(
    (section: SectionNumber, content: string) => {
      updateSectionContent(section, content)
    },
    [updateSectionContent]
  )

  /**
   * Dismiss an error for a specific section
   */
  const dismissError = useCallback((section: SectionNumber) => {
    setSectionErrors((prev) => ({ ...prev, [section]: null }))
  }, [])

  /**
   * Handle section submit click — show PHI confirmation first
   */
  const handleSubmitClick = useCallback((section: SectionNumber) => {
    setPendingSection(section)
    setShowConfirmModal(true)
  }, [])

  /**
   * Handle confirmed section submission after PHI acknowledgment
   */
  const handleConfirmedSubmit = useCallback(
    async () => {
      if (pendingSection === null) return
      const section = pendingSection
      setShowConfirmModal(false)
      setPendingSection(null)

      // Clear previous error for this section
      setSectionErrors((prev) => ({ ...prev, [section]: null }))

      try {
        // For section 2, pass the working diagnosis
        if (section === 2) {
          await submitSection(section, workingDiagnosis || undefined)
        } else {
          await submitSection(section)
        }


      } catch (err) {
        console.error('Submission failed:', err)

        // Parse error and set appropriate state
        if (err instanceof ApiError) {
          setSectionErrors((prev) => ({
            ...prev,
            [section]: {
              message: err.message,
              isRetryable: err.isRetryable,
              errorType: err.errorType,
            },
          }))

          // Show quota exceeded modal if quota error
          if (err.errorType === 'quota') {
            setShowQuotaExceeded(true)
          }
        } else {
          // Generic error handling
          const message =
            err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
          setSectionErrors((prev) => ({
            ...prev,
            [section]: {
              message,
              isRetryable: true,
              errorType: 'unknown',
            },
          }))
        }
      }
    },
    [pendingSection, submitSection, workingDiagnosis]
  )

  // Loading state
  if (loading) {
    return (
      <div className="encounter-editor">
        <div className="encounter-editor__loading">
          <div className="encounter-editor__spinner" aria-hidden="true" />
          <p>Loading encounter...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="encounter-editor">
        <div className="encounter-editor__error">
          <span className="encounter-editor__error-icon" aria-hidden="true">
            ⚠️
          </span>
          <p className="encounter-editor__error-message">
            {error.message || 'Failed to load encounter'}
          </p>
          <button type="button" className="encounter-editor__back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // No encounter found
  if (!encounter) {
    return (
      <div className="encounter-editor">
        <div className="encounter-editor__not-found">
          <p>Encounter not found</p>
          <button type="button" className="encounter-editor__back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isFinalized = encounter.status === 'finalized'
  const isArchived = encounter.status === 'archived'
  const isSection1Complete = encounter.section1.status === 'completed'
  const isSection2Complete = encounter.section2.status === 'completed'

  // Defensive: handle both nested { finalMdm } and flat FinalMdm shapes (backward compat)
  const finalMdmData = (() => {
    const s3 = encounter?.section3?.llmResponse
    if (!s3) return null
    if (s3.finalMdm) return s3.finalMdm
    if ((s3 as unknown as FinalMdm).text) return s3 as unknown as FinalMdm
    return null
  })()

  return (
    <div className="encounter-editor">
      {/* Header */}
      <header className="encounter-editor__header">
        <h1 className="encounter-editor__room">{formatRoomDisplay(encounter.roomNumber)}</h1>
        <span className="encounter-editor__complaint">{encounter.chiefComplaint}</span>
        <div className="encounter-editor__header-right">
          <BuildModeStatusCircles encounter={encounter} />
        </div>
      </header>

      {/* Status Banner for finalized/archived */}
      {(isFinalized || isArchived) && (
        <div
          className={`encounter-editor__status-banner encounter-editor__status-banner--${encounter.status}`}
        >
          {isFinalized
            ? 'This encounter has been finalized. Content is read-only.'
            : 'This encounter has been archived and is read-only.'}
        </div>
      )}

      {/* Section Panels */}
      <div className="encounter-editor__sections">
        <TrendAnalysisToggle compact />

        {/* Section 1: Initial Evaluation */}
        <SectionPanel
          sectionNumber={1}
          title={SECTION_TITLES[1]}
          status={section1State.status as SectionStatus}
          content={section1State.content}
          maxChars={SECTION_CHAR_LIMITS[1]}
          isLocked={section1State.isLocked || isFinalized || isArchived}
          submissionCount={section1State.submissionCount}
          guide={getSectionGuide(1)}
          preview={getSectionPreview(1, encounter)}
          onContentChange={(content: string) => handleContentChange(1, content)}
          onSubmit={() => handleSubmitClick(1)}
          isSubmitting={isSubmitting && submittingSection === 1}
          submissionError={sectionErrors[1]?.message}
          isErrorRetryable={sectionErrors[1]?.isRetryable}
          onDismissError={() => dismissError(1)}
        />

        {/* Dashboard Output (after Section 1 completion) */}
        {encounter.section1.status === 'completed' && encounter.section1.llmResponse && (
          <>
            <DashboardOutput
              llmResponse={encounter.section1.llmResponse}
              trendAnalysis={analysis}
              trendLoading={isAnalyzing}
              selectedTests={selectedTests}
              onSelectedTestsChange={handleSelectedTestsChange}
              encounter={encounter}
            />
            {analysis && analysis.rankedFindings.length > 0 && (
              <button
                type="button"
                className="encounter-editor__report-btn"
                onClick={() => setShowTrendReport(true)}
              >
                View Chart Report
              </button>
            )}
          </>
        )}

        {/* Section 2: Workup & Results (blocked) */}
        {!isSection1Complete && !isFinalized && !isArchived && (
          <div className="encounter-editor__section-blocked">
            <span className="encounter-editor__blocked-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div className="encounter-editor__blocked-text">
              <h4 className="encounter-editor__blocked-title">Workup and Results</h4>
              <p className="encounter-editor__blocked-subtitle">Dictate when your workup is complete and you are reviewing your results</p>
            </div>
          </div>
        )}
        {(isSection1Complete || isFinalized || isArchived) && (
          <div id="section-panel-2">
            {/* Working Diagnosis Input (only for Section 2) */}
            {isSection1Complete && !encounter.section2.isLocked && !isFinalized && !isArchived && (
              <div className="encounter-editor__working-diagnosis">
                <label htmlFor="working-diagnosis">
                  Working Diagnosis (optional)
                  <span className="encounter-editor__working-diagnosis-hint">
                    This helps guide the MDM generation
                  </span>
                </label>
                <input
                  id="working-diagnosis"
                  type="text"
                  value={workingDiagnosis}
                  onChange={(e) => setWorkingDiagnosis(e.target.value)}
                  placeholder="e.g., Acute coronary syndrome, Appendicitis"
                  className="encounter-editor__working-diagnosis-input"
                />
              </div>
            )}
            <SectionPanel
              sectionNumber={2}
              title={SECTION_TITLES[2]}
              status={section2State.status as SectionStatus}
              content={section2State.content}
              maxChars={SECTION_CHAR_LIMITS[2]}
              isLocked={section2State.isLocked || isFinalized || isArchived}
              submissionCount={section2State.submissionCount}
              guide={getSectionGuide(2)}
              preview={getSectionPreview(2, encounter)}
              onContentChange={(content: string) => handleContentChange(2, content)}
              onSubmit={() => handleSubmitClick(2)}
              isSubmitting={isSubmitting && submittingSection === 2}
              submissionError={sectionErrors[2]?.message}
              isErrorRetryable={sectionErrors[2]?.isRetryable}
              onDismissError={() => dismissError(2)}
            />
          </div>
        )}

        {/* Section 3: Treatment & Disposition (blocked) */}
        {!isSection2Complete && !isFinalized && !isArchived && (
          <div className="encounter-editor__section-blocked">
            <span className="encounter-editor__blocked-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div className="encounter-editor__blocked-text">
              <h4 className="encounter-editor__blocked-title">Working Diagnosis, Treatment and Disposition</h4>
              <p className="encounter-editor__blocked-subtitle">Dictate what you think the problem really is, what you did about it and what you're going to do... let our AI worry about the why</p>
            </div>
          </div>
        )}
        {(isSection2Complete || isFinalized || isArchived) && (
          <SectionPanel
            sectionNumber={3}
            title={SECTION_TITLES[3]}
            status={section3State.status as SectionStatus}
            content={section3State.content}
            maxChars={SECTION_CHAR_LIMITS[3]}
            isLocked={section3State.isLocked || isFinalized || isArchived}
            submissionCount={section3State.submissionCount}
            guide={getSectionGuide(3)}
            preview={getSectionPreview(3, encounter)}
            onContentChange={(content: string) => handleContentChange(3, content)}
            onSubmit={() => handleSubmitClick(3)}
            isSubmitting={isSubmitting && submittingSection === 3}
            submissionError={sectionErrors[3]?.message}
            isErrorRetryable={sectionErrors[3]?.isRetryable}
            onDismissError={() => dismissError(3)}
          />
        )}
      </div>

      {/* Quota Exceeded Banner */}
      {showQuotaExceeded && (
        <div className="encounter-editor__quota-banner" role="alert">
          <div className="encounter-editor__quota-content">
            <span className="encounter-editor__quota-icon" aria-hidden="true">
              ⚠️
            </span>
            <div className="encounter-editor__quota-text">
              <strong>Usage Limit Reached</strong>
              <p>
                You&apos;ve used all your MDM generations for this period. Upgrade your plan for
                more submissions.
              </p>
            </div>
          </div>
          <div className="encounter-editor__quota-actions">
            <a
              href="/settings"
              className="encounter-editor__upgrade-button"
            >
              Upgrade Plan
            </a>
            <button
              type="button"
              className="encounter-editor__quota-dismiss"
              onClick={() => setShowQuotaExceeded(false)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Final MDM Output (shown when finalized) */}
      {isFinalized && finalMdmData && (
        <div className="encounter-editor__final-mdm">
          <h2 className="encounter-editor__final-mdm-title">Final MDM</h2>
          <div className="encounter-editor__final-mdm-content">
            <pre>{finalMdmData.text}</pre>
          </div>
          <button
            type="button"
            className="encounter-editor__copy-button"
            onClick={async () => {
              if (finalMdmData.text) {
                try {
                  await navigator.clipboard.writeText(finalMdmData.text)
                  toastSuccess('Copied to clipboard!')
                } catch {
                  toastError('Failed to copy to clipboard')
                }
              }
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {/* Timer at bottom */}
      <footer className="encounter-editor__footer">
        <ShiftTimer shiftStartedAt={encounter.shiftStartedAt} status={encounter.status} />
      </footer>

      {/* Trend Report Modal */}
      {analysis && (
        <TrendReportModal
          analysis={analysis}
          isOpen={showTrendReport}
          onClose={() => setShowTrendReport(false)}
        />
      )}

      {/* PHI Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setPendingSection(null) }}
        onConfirm={handleConfirmedSubmit}
      />
    </div>
  )
}
