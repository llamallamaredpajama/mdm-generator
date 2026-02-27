/**
 * EncounterEditor Component
 *
 * Main editor for a single encounter with 3-section guided workflow.
 * Handles section navigation, content editing, and submission.
 *
 * Build Mode v2 - Phase 4
 */

import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { getAppDb, useAuth, useAuthToken } from '../../lib/firebase'
import { useEncounter, useSectionState } from '../../hooks/useEncounter'
import { ShiftTimer } from './ShiftTimer'
import SectionPanel from './SectionPanel'
import Section1Guide from './Section1Guide'
import Section2Guide from './Section2Guide'
import Section3Guide from './Section3Guide'
import CdrResultsOutput from './shared/CdrResultsOutput'
import DashboardOutput from './shared/DashboardOutput'
import type {
  SectionNumber,
  EncounterDocument,
  SectionStatus,
  FinalMdm,
  CdrTracking,
  CdrTrackingEntry,
  TestResult,
  DispositionOption,
} from '../../types/encounter'
import { SECTION_TITLES, SECTION_CHAR_LIMITS, formatRoomDisplay } from '../../types/encounter'
import { BuildModeStatusCircles } from './shared/CardContent'
import {
  ApiError,
  matchCdrs,
  suggestDiagnosis,
  parseResults,
  type ParsedResultItem,
} from '../../lib/api'
import { useTestLibrary } from '../../hooks/useTestLibrary'
import { useCdrLibrary } from '../../hooks/useCdrLibrary'
import ConfirmationModal from '../ConfirmationModal'
import TrendAnalysisToggle from '../TrendAnalysisToggle'
import TrendReportModal from '../TrendReportModal'
import { useTrendAnalysis } from '../../hooks/useTrendAnalysis'
import { useToast } from '../../contexts/ToastContext'
import ResultEntry from './shared/ResultEntry'
import ProgressIndicator from './shared/ProgressIndicator'
import OrdersetManager from './shared/OrdersetManager'
import WorkingDiagnosisInput from './shared/WorkingDiagnosisInput'
import PasteLabModal from './shared/PasteLabModal'
import TreatmentInput from './shared/TreatmentInput'
import DispositionSelector from './shared/DispositionSelector'
import { useDispoFlows } from '../../hooks/useDispoFlows'
import { useOrderSets } from '../../hooks/useOrderSets'
import {
  getRecommendedTestIds,
  getTestIdsFromWorkupRecommendations,
} from './shared/getRecommendedTestIds'
import { buildCdrColorMap } from './shared/cdrColorPalette'
import type { WorkingDiagnosis } from '../../types/encounter'
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
  encounter: EncounterDocument | null,
): ReactNode | null {
  if (!encounter) return null

  switch (section) {
    case 1:
      // Dashboard output renders as standalone component between S1 and S2
      return null
    case 2:
      // BM-5.3: Brief CDR results output replaces MdmPreviewPanel
      if (encounter.section2.status === 'completed') {
        return <CdrResultsOutput encounter={encounter} />
      }
      return null
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
  const db = getAppDb()
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

  // Working diagnosis input for Section 2 (structured)
  const [workingDiagnosis, setWorkingDiagnosis] = useState<WorkingDiagnosis | null>(null)
  const [dxSuggestions, setDxSuggestions] = useState<string[]>([])
  const [dxSuggestionsLoading, setDxSuggestionsLoading] = useState(false)
  const dxSuggestedForRef = useRef<string | null>(null)

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
          console.error('Failed to persist selectedTests:', err?.message || 'unknown error'),
        )
        pendingTestsRef.current = null
      }, 300)
    },
    [user, encounterId],
  )

  // Flush pending write and cleanup on unmount
  useEffect(() => {
    return () => {
      if (firestoreWriteTimer.current) clearTimeout(firestoreWriteTimer.current)
      if (pendingTestsRef.current !== null && user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.selectedTests': pendingTestsRef.current }).catch(
          (err) =>
            console.error(
              'Failed to flush selectedTests on unmount:',
              err?.message || 'unknown error',
            ),
        )
      }
    }
  }, [user, encounterId])

  // Test results state (initialized from encounter, persisted to Firestore)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const testResultsInitRef = useRef(false)
  const testResultsWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTestResultsRef = useRef<Record<string, TestResult> | null>(null)

  // Initialize testResults from encounter data
  useEffect(() => {
    if (encounter && !testResultsInitRef.current) {
      setTestResults(encounter.section2?.testResults ?? {})
      testResultsInitRef.current = true
    }
  }, [encounter])

  // Sync testResults from Firestore onSnapshot (external changes)
  const testResultsExternalRef = useRef(encounter?.section2?.testResults)
  useEffect(() => {
    const external = encounter?.section2?.testResults
    if (external !== testResultsExternalRef.current) {
      testResultsExternalRef.current = external
      // Only overwrite if no pending local write
      if (!pendingTestResultsRef.current && external) {
        setTestResults(external)
      }
    }
  }, [encounter?.section2?.testResults])

  // Debounced Firestore write for testResults
  const handleTestResultChange = useCallback(
    (testId: string, result: TestResult) => {
      setTestResults((prev) => {
        const updated = { ...prev, [testId]: result }
        pendingTestResultsRef.current = updated
        return updated
      })

      if (!user || !encounterId) return

      if (testResultsWriteTimer.current) {
        clearTimeout(testResultsWriteTimer.current)
      }
      testResultsWriteTimer.current = setTimeout(() => {
        const toWrite = pendingTestResultsRef.current
        if (!toWrite) return
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.testResults': toWrite }).catch((err) =>
          console.error('Failed to persist testResults:', err?.message || 'unknown error'),
        )
        pendingTestResultsRef.current = null
      }, 300)
    },
    [user, encounterId],
  )

  // Flush pending testResults write on unmount
  useEffect(() => {
    return () => {
      if (testResultsWriteTimer.current) clearTimeout(testResultsWriteTimer.current)
      if (pendingTestResultsRef.current !== null && user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.testResults': pendingTestResultsRef.current }).catch(
          (err) =>
            console.error(
              'Failed to flush testResults on unmount:',
              err?.message || 'unknown error',
            ),
        )
      }
    }
  }, [user, encounterId])

  // "+ Add Test" orderset manager toggle (shown inline in S2 custom content)
  const [showS2OrdersetManager, setShowS2OrdersetManager] = useState(false)

  // S2 entry mode: structured (per-test cards) vs dictation (free-text AI parse) (BM-5.2)
  const [s2EntryMode, setS2EntryMode] = useState<'structured' | 'dictation'>('structured')
  const [dictationText, setDictationText] = useState('')
  const [dictationParsing, setDictationParsing] = useState(false)

  // Compute recommended test IDs for OrdersetManager "AI" badges
  const s1Differential = useMemo(() => {
    const llm = encounter?.section1?.llmResponse
    if (Array.isArray(llm)) return llm
    if (llm && typeof llm === 'object' && 'differential' in llm) {
      const wrapped = llm as { differential?: unknown }
      if (Array.isArray(wrapped.differential)) return wrapped.differential
    }
    return []
  }, [encounter?.section1?.llmResponse])

  // Extract workup recommendations from S1 response
  const s1WorkupRecommendations = useMemo(() => {
    const llm = encounter?.section1?.llmResponse
    if (llm && typeof llm === 'object' && 'workupRecommendations' in llm) {
      const wrapped = llm as { workupRecommendations?: unknown }
      if (Array.isArray(wrapped.workupRecommendations)) return wrapped.workupRecommendations
    }
    return []
  }, [encounter?.section1?.llmResponse])

  // Bug 4 fix: Combine client-side matching AND LLM workup recommendations
  const recommendedTestIds = useMemo(() => {
    const fromDifferential = getRecommendedTestIds(s1Differential, testLibrary)
    const fromWorkup = getTestIdsFromWorkupRecommendations(s1WorkupRecommendations, testLibrary)
    const merged = new Set([...fromWorkup, ...fromDifferential])
    return Array.from(merged)
  }, [s1Differential, testLibrary, s1WorkupRecommendations])

  /**
   * Batch update test results with immediate Firestore write.
   * Used for explicit user actions (All Unremarkable, Mark Remaining) —
   * no debounce since these are intentional bulk operations.
   */
  const handleBatchResultUpdate = useCallback(
    (updates: Record<string, TestResult>) => {
      setTestResults((prev) => {
        const merged = { ...prev, ...updates }
        pendingTestResultsRef.current = merged
        return merged
      })

      if (!user || !encounterId) return

      // Cancel any pending debounced write
      if (testResultsWriteTimer.current) {
        clearTimeout(testResultsWriteTimer.current)
        testResultsWriteTimer.current = null
      }

      // Immediate write for explicit user action (read from ref after state update)
      setTimeout(() => {
        const toWrite = pendingTestResultsRef.current
        if (!toWrite) return
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section2.testResults': toWrite }).catch((err) =>
          console.error('Failed to persist batch testResults:', err?.message || 'unknown error'),
        )
        pendingTestResultsRef.current = null
      }, 0)
    },
    [user, encounterId],
  )

  /**
   * Mark ALL tests as unremarkable (including already-abnormal ones).
   * CDR-fed tests are also marked unremarkable — the CDR warning will
   * persist if a specific numeric value is still needed.
   */
  const handleMarkAllUnremarkable = useCallback(() => {
    const updates: Record<string, TestResult> = {}
    for (const testId of selectedTests) {
      const testDef = testLibrary.find((t) => t.id === testId)
      updates[testId] = {
        status: 'unremarkable',
        quickFindings: [],
        notes: null,
        value: testResults[testId]?.value ?? null,
        unit: testDef?.unit ?? null,
      }
    }
    handleBatchResultUpdate(updates)
  }, [selectedTests, testLibrary, testResults, handleBatchResultUpdate])

  /**
   * Mark only PENDING tests as unremarkable, leaving existing
   * unremarkable/abnormal statuses unchanged.
   */
  const handleMarkRemainingUnremarkable = useCallback(() => {
    const updates: Record<string, TestResult> = {}
    for (const testId of selectedTests) {
      const current = testResults[testId]
      if (!current || current.status === 'pending') {
        const testDef = testLibrary.find((t) => t.id === testId)
        updates[testId] = {
          status: 'unremarkable',
          quickFindings: [],
          notes: null,
          value: null,
          unit: testDef?.unit ?? null,
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      handleBatchResultUpdate(updates)
    }
  }, [selectedTests, testResults, testLibrary, handleBatchResultUpdate])

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

  /**
   * Process dictation text through AI parsing (BM-5.2).
   * Calls the same parse-results endpoint as PasteLabModal, then opens
   * the preview modal with pre-parsed results.
   */
  const handleProcessDictation = useCallback(async () => {
    if (!token || !dictationText.trim() || selectedTests.length === 0) return

    setDictationParsing(true)
    try {
      const res = await parseResults(encounterId, dictationText.trim(), selectedTests, token)
      if (res.parsed.length > 0) {
        setDictationParsedResults(res.parsed)
        setDictationUnmatchedText(res.unmatchedText ?? [])
        setShowDictationPreview(true)
      } else {
        toastError('No results matched your ordered tests. Try rephrasing your dictation.')
      }
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to process dictation. Please try again.',
      )
    } finally {
      setDictationParsing(false)
    }
  }, [token, dictationText, selectedTests, encounterId, toastError])

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
          .map((d: string | { diagnosis?: string }) =>
            typeof d === 'string' ? d : d.diagnosis || '',
          )
          .filter(Boolean)
        if (dxList.length > 0) {
          analyzedForRef.current = encounter.id
          analyze(encounter.chiefComplaint, dxList)
        }
      }
    }
  }, [
    encounter?.id,
    encounter?.section1?.status,
    encounter?.section1?.llmResponse,
    encounter?.chiefComplaint,
    analyze,
  ])

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
      Object.entries(testResults)
        .map(([id, r]) => [id, r.status, r.value])
        .sort(),
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

          const updatedComponents: Record<
            string,
            import('../../types/encounter').CdrComponentState
          > = {
            ...currentEntry.components,
            [comp.id]: { value, answered: true, source: 'section2' as const },
          }

          // Recompute status and score
          const vals = Object.values(updatedComponents)
          const answeredCount = vals.filter((c) => c.answered).length
          const status: import('../../types/encounter').CdrStatus =
            answeredCount === 0
              ? 'pending'
              : answeredCount === vals.length
                ? 'completed'
                : 'partial'

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
        console.error(
          'Failed to auto-populate CDR from S2 results:',
          err?.message || 'unknown error',
        )
      })
    }
  }, [
    encounter?.section2?.testResults,
    encounter?.cdrTracking,
    testLibrary,
    cdrLibrary,
    user,
    encounterId,
  ])

  // Fetch working diagnosis suggestions when S1 is complete and S2 has responded results
  useEffect(() => {
    if (!encounter || !token || !encounterId) return
    if (encounter.section1.status !== 'completed') return
    if (!encounter.section1.llmResponse) return

    // Compute responded count from test results
    const results = encounter.section2?.testResults ?? {}
    const responded = Object.values(results).filter(
      (r) => r && (r as TestResult).status !== 'pending',
    ).length
    if (responded === 0) return

    // Build a hash to avoid refetching for same results
    const hash = Object.entries(results)
      .filter(([, r]) => r && (r as TestResult).status !== 'pending')
      .map(([id, r]) => `${id}:${(r as TestResult).status}`)
      .sort()
      .join(',')
    if (hash === dxSuggestedForRef.current) return
    dxSuggestedForRef.current = hash

    // Fetch suggestions (non-blocking — failure is OK)
    let cancelled = false
    setDxSuggestionsLoading(true)
    suggestDiagnosis(encounterId, token)
      .then((res) => {
        if (!cancelled) setDxSuggestions(res.suggestions)
      })
      .catch(() => {
        // Silently fail — physician can still type a custom diagnosis
      })
      .finally(() => {
        if (!cancelled) setDxSuggestionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [encounter, token, encounterId])

  // Trend report modal state
  const [showTrendReport, setShowTrendReport] = useState(false)

  // D3: Workup accepted state — S2 gated behind "Accept All / Continue"
  const [workupAccepted, setWorkupAccepted] = useState(false)
  // Auto-accept if encounter already has S2 progress (backward compat)
  const workupAcceptedInitRef = useRef(false)
  useEffect(() => {
    if (encounter && !workupAcceptedInitRef.current) {
      workupAcceptedInitRef.current = true
      // If S2 already has content or is completed, auto-accept
      if (
        encounter.section2.status === 'completed' ||
        encounter.section2.status === 'in_progress' ||
        encounter.section2.submissionCount > 0 ||
        encounter.section2.content.length > 0 ||
        (encounter.section2.testResults && Object.keys(encounter.section2.testResults).length > 0)
      ) {
        setWorkupAccepted(true)
      }
    }
  }, [encounter])

  // Paste Lab Results modal state (BM-5.1)
  const [showPasteModal, setShowPasteModal] = useState(false)

  // Dictation preview modal state (BM-5.2)
  const [showDictationPreview, setShowDictationPreview] = useState(false)
  const [dictationParsedResults, setDictationParsedResults] = useState<ParsedResultItem[]>([])
  const [dictationUnmatchedText, setDictationUnmatchedText] = useState<string[]>([])

  // S3 treatment state (initialized from encounter, synced via handleTreatmentUpdate)
  const [s3TreatmentText, setS3TreatmentText] = useState('')
  const [s3SelectedTreatments, setS3SelectedTreatments] = useState<string[]>([])
  const s3TreatmentInitRef = useRef(false)

  // Initialize S3 treatment state from encounter data
  useEffect(() => {
    if (encounter && !s3TreatmentInitRef.current) {
      setS3TreatmentText(encounter.section3?.treatments ?? encounter.section3?.content ?? '')
      setS3SelectedTreatments(encounter.section3?.cdrSuggestedTreatments ?? [])
      s3TreatmentInitRef.current = true
    }
  }, [encounter])

  // S3 disposition state
  const [s3Disposition, setS3Disposition] = useState<DispositionOption | null>(null)
  const [s3FollowUp, setS3FollowUp] = useState<string[]>([])
  const s3DispoInitRef = useRef(false)
  const {
    flows: savedDispoFlows,
    saveFlow: saveDispoFlow,
    deleteFlow: deleteDispoFlow,
  } = useDispoFlows()

  const {
    orderSets: s2OrderSets,
    saveOrderSet: s2SaveOrderSet,
    updateOrderSet: s2UpdateOrderSet,
    deleteOrderSet: s2DeleteOrderSet,
  } = useOrderSets()

  // Initialize S3 disposition state from encounter data
  useEffect(() => {
    if (encounter && !s3DispoInitRef.current) {
      setS3Disposition(encounter.section3?.disposition ?? null)
      setS3FollowUp(encounter.section3?.followUp ?? [])
      s3DispoInitRef.current = true
    }
  }, [encounter])

  // PHI confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSection, setPendingSection] = useState<SectionNumber | null>(null)

  // Section state helpers
  const section1State = useSectionState(encounter, 1)
  const section2State = useSectionState(encounter, 2)
  const section3State = useSectionState(encounter, 3)

  /**
   * Handle working diagnosis change — update local state and persist to Firestore
   * D1: Now writes to section3.workingDiagnosis (moved from S2 to S3)
   */
  const handleWorkingDiagnosisChange = useCallback(
    (wd: WorkingDiagnosis) => {
      setWorkingDiagnosis(wd)
      if (!user || !encounterId) return
      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      updateDoc(encounterRef, { 'section3.workingDiagnosis': wd }).catch((err) => {
        console.error('Failed to persist working diagnosis:', err?.message || 'unknown error')
      })
    },
    [user, encounterId],
  )

  /**
   * Handle content change in a section
   */
  const handleContentChange = useCallback(
    (section: SectionNumber, content: string) => {
      updateSectionContent(section, content)
    },
    [updateSectionContent],
  )

  /**
   * Handle S3 treatment input update — sync text to section content and persist selections
   */
  const handleTreatmentUpdate = useCallback(
    (treatments: string, cdrSuggestions: string[]) => {
      setS3TreatmentText(treatments)
      setS3SelectedTreatments(cdrSuggestions)
      // Sync treatment text into S3 content for submission
      updateSectionContent(3, treatments)
      // Persist CDR suggestion selections to Firestore
      if (user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, {
          'section3.treatments': treatments,
          'section3.cdrSuggestedTreatments': cdrSuggestions,
        }).catch((err) =>
          console.error('Failed to persist S3 treatments:', err?.message || 'unknown error'),
        )
      }
    },
    [user, encounterId, updateSectionContent],
  )

  /**
   * Handle S3 disposition change — persist to Firestore
   */
  const handleDispositionChange = useCallback(
    (disposition: DispositionOption) => {
      setS3Disposition(disposition)
      if (user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section3.disposition': disposition }).catch((err) =>
          console.error('Failed to persist disposition:', err?.message || 'unknown error'),
        )
      }
    },
    [user, encounterId],
  )

  /**
   * Handle S3 follow-up change — persist to Firestore
   */
  const handleFollowUpChange = useCallback(
    (followUp: string[]) => {
      setS3FollowUp(followUp)
      if (user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { 'section3.followUp': followUp }).catch((err) =>
          console.error('Failed to persist followUp:', err?.message || 'unknown error'),
        )
      }
    },
    [user, encounterId],
  )

  /**
   * Apply a saved disposition flow — sets disposition + follow-up in one action
   */
  const handleApplyDispoFlow = useCallback(
    (flow: { id: string; name: string; disposition: DispositionOption; followUp: string[] }) => {
      setS3Disposition(flow.disposition)
      setS3FollowUp(flow.followUp)
      if (user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, {
          'section3.disposition': flow.disposition,
          'section3.followUp': flow.followUp,
          'section3.appliedDispoFlow': flow.id,
        }).catch((err) =>
          console.error('Failed to apply dispo flow:', err?.message || 'unknown error'),
        )
      }
    },
    [user, encounterId],
  )

  /**
   * Save current disposition + follow-up as a reusable flow
   */
  const handleSaveDispoFlow = useCallback(
    (name: string) => {
      if (s3Disposition) {
        saveDispoFlow(name, s3Disposition, s3FollowUp)
      }
    },
    [s3Disposition, s3FollowUp, saveDispoFlow],
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
  const handleConfirmedSubmit = useCallback(async () => {
    if (pendingSection === null) return
    const section = pendingSection
    setShowConfirmModal(false)
    setPendingSection(null)

    // Clear previous error for this section
    setSectionErrors((prev) => ({ ...prev, [section]: null }))

    try {
      // D1: Working diagnosis moved from S2 to S3 — pass it on finalize
      if (section === 3) {
        const effectiveDx = workingDiagnosis?.selected ?? workingDiagnosis?.custom ?? undefined
        await submitSection(section, effectiveDx || undefined)
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
  }, [pendingSection, submitSection, workingDiagnosis])

  // E1/A5: Build CDR color map for correlation indicators (single source of truth)
  // Must be above early returns to satisfy rules-of-hooks
  const cdrColorMap = useMemo(() => {
    const ct = encounter?.cdrTracking ?? {}
    const activeNames = Object.values(ct)
      .filter((e) => !e.dismissed && !e.excluded)
      .map((e) => e.name)
    return buildCdrColorMap(activeNames)
  }, [encounter?.cdrTracking])

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
  const isS2Locked = section2State.isLocked || isFinalized || isArchived
  const isS2Submitting = isSubmitting && submittingSection === 2

  // Compute progress indicator data from selectedTests and testResults
  const progressStatuses = selectedTests.map((id) => {
    const r = testResults[id]
    return (r?.status ?? 'pending') as 'unremarkable' | 'abnormal' | 'pending'
  })
  const respondedCount = progressStatuses.filter((s) => s !== 'pending').length
  const abnormalCount = progressStatuses.filter((s) => s === 'abnormal').length
  const hasPendingTests = progressStatuses.includes('pending')

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
          <DashboardOutput
            llmResponse={encounter.section1.llmResponse}
            trendAnalysis={analysis}
            trendLoading={isAnalyzing}
            selectedTests={selectedTests}
            onSelectedTestsChange={handleSelectedTestsChange}
            encounter={encounter}
            cdrColorMap={cdrColorMap}
            onAcceptContinue={() => setWorkupAccepted(true)}
            onOpenTrendReport={analysis ? () => setShowTrendReport(true) : undefined}
            firestoreInitialized={selectedTestsInitRef.current}
          />
        )}

        {/* Section 2: Results and Data Review (blocked until S1 complete + workup accepted) */}
        {(!isSection1Complete || !workupAccepted) && !isFinalized && !isArchived && (
          <div className="encounter-editor__section-blocked">
            <span className="encounter-editor__blocked-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div className="encounter-editor__blocked-text">
              <h4 className="encounter-editor__blocked-title">Results and Data Review</h4>
              <p className="encounter-editor__blocked-subtitle">
                {isSection1Complete
                  ? 'Accept the recommended workup above to begin entering results'
                  : 'Complete the initial evaluation to unlock this section'}
              </p>
            </div>
          </div>
        )}
        {((isSection1Complete && workupAccepted) || isFinalized || isArchived) && (
          <div id="section-panel-2">
            <SectionPanel
              sectionNumber={2}
              title={SECTION_TITLES[2]}
              status={section2State.status as SectionStatus}
              content={section2State.content}
              maxChars={SECTION_CHAR_LIMITS[2]}
              isLocked={isS2Locked}
              submissionCount={section2State.submissionCount}
              guide={getSectionGuide(2)}
              preview={getSectionPreview(2, encounter)}
              customContent={
                selectedTests.length > 0 && !isFinalized && !isArchived ? (
                  showS2OrdersetManager ? (
                    <OrdersetManager
                      mode="browse"
                      tests={testLibrary}
                      selectedTests={selectedTests}
                      recommendedTestIds={recommendedTestIds}
                      onSelectionChange={handleSelectedTestsChange}
                      onClose={() => setShowS2OrdersetManager(false)}
                      onAcceptAllRecommended={() => setShowS2OrdersetManager(false)}
                      onAcceptSelected={() => setShowS2OrdersetManager(false)}
                      orderSets={s2OrderSets}
                      onSaveOrderSet={s2SaveOrderSet}
                      onUpdateOrderSet={async (id, data) => {
                        await s2UpdateOrderSet(id, data)
                      }}
                      onDeleteOrderSet={s2DeleteOrderSet}
                    />
                  ) : (
                    <div className="encounter-editor__result-entries">
                      {/* Mode toggle: Structured vs Dictation (BM-5.2) */}
                      {!isS2Locked && (
                        <div className="encounter-editor__mode-toggle" data-testid="s2-mode-toggle">
                          <button
                            type="button"
                            className={`encounter-editor__mode-btn${s2EntryMode === 'structured' ? ' encounter-editor__mode-btn--active' : ''}`}
                            onClick={() => setS2EntryMode('structured')}
                            disabled={isS2Submitting || dictationParsing}
                          >
                            Structured
                          </button>
                          <button
                            type="button"
                            className={`encounter-editor__mode-btn${s2EntryMode === 'dictation' ? ' encounter-editor__mode-btn--active' : ''}`}
                            onClick={() => setS2EntryMode('dictation')}
                            disabled={isS2Submitting || dictationParsing}
                          >
                            Dictation
                          </button>
                        </div>
                      )}

                      {/* Progress indicator (shown in both modes) */}
                      <ProgressIndicator
                        total={selectedTests.length}
                        responded={respondedCount}
                        abnormalCount={abnormalCount}
                        statuses={progressStatuses}
                      />

                      {s2EntryMode === 'structured' ? (
                        <>
                          {/* Quick action: All Results Unremarkable + Paste Results */}
                          {!isS2Locked && (
                            <>
                              <button
                                type="button"
                                className="encounter-editor__quick-action encounter-editor__quick-action--all"
                                onClick={handleMarkAllUnremarkable}
                                disabled={isS2Submitting}
                                data-testid="mark-all-unremarkable"
                              >
                                All Results Unremarkable
                              </button>
                              <button
                                type="button"
                                className="encounter-editor__quick-action encounter-editor__quick-action--paste"
                                onClick={() => setShowPasteModal(true)}
                                disabled={isS2Submitting}
                                data-testid="paste-results-btn"
                              >
                                Paste Results
                              </button>
                            </>
                          )}

                          {/* Result entry cards (2-col grid on desktop) */}
                          <div className="encounter-editor__result-grid">
                            {selectedTests.map((testId) => {
                              const testDef = testLibrary.find((t) => t.id === testId)
                              if (!testDef) return null
                              const activeCdrNames = (testDef.feedsCdrs ?? [])
                                .filter((cdrId) => {
                                  const entry = encounter.cdrTracking?.[cdrId]
                                  return entry && !entry.dismissed
                                })
                                .map((cdrId) => encounter.cdrTracking[cdrId].name)
                              return (
                                <ResultEntry
                                  key={testId}
                                  testDef={testDef}
                                  result={testResults[testId]}
                                  activeCdrNames={activeCdrNames}
                                  cdrColors={cdrColorMap}
                                  showReadiness={!isS2Locked}
                                  onResultChange={handleTestResultChange}
                                />
                              )
                            })}
                          </div>

                          {/* Quick action: Mark remaining unremarkable */}
                          {!isS2Locked && hasPendingTests && (
                            <button
                              type="button"
                              className="encounter-editor__quick-action encounter-editor__quick-action--remaining"
                              onClick={handleMarkRemainingUnremarkable}
                              disabled={isS2Submitting}
                              data-testid="mark-remaining-unremarkable"
                            >
                              Mark remaining unremarkable
                            </button>
                          )}

                          {/* + Add Test button */}
                          {!isS2Locked && (
                            <button
                              type="button"
                              className="encounter-editor__add-test-btn"
                              onClick={() => setShowS2OrdersetManager(true)}
                              disabled={isS2Submitting}
                              data-testid="add-test-btn"
                            >
                              + Add Test
                            </button>
                          )}
                        </>
                      ) : (
                        /* Dictation mode (BM-5.2) */
                        <div className="encounter-editor__dictation" data-testid="dictation-mode">
                          <p className="encounter-editor__dictation-hint">
                            Describe your results in natural language. AI will map them to your
                            ordered tests.
                          </p>
                          <textarea
                            className="encounter-editor__dictation-textarea"
                            value={dictationText}
                            onChange={(e) => setDictationText(e.target.value)}
                            placeholder='e.g., "ECG showed normal sinus rhythm, troponin negative at 0.01, CBC unremarkable, CT head no acute findings"'
                            rows={4}
                            disabled={isS2Locked || dictationParsing}
                            data-testid="dictation-textarea"
                          />
                          <button
                            type="button"
                            className="encounter-editor__quick-action encounter-editor__quick-action--paste"
                            onClick={handleProcessDictation}
                            disabled={
                              !dictationText.trim() ||
                              isS2Locked ||
                              isS2Submitting ||
                              dictationParsing
                            }
                            data-testid="process-dictation-btn"
                          >
                            {dictationParsing ? 'Processing...' : 'Process Results'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : undefined
              }
              textareaPlaceholder={
                selectedTests.length > 0 ? 'Additional notes (optional)...' : undefined
              }
              allowEmptySubmit={selectedTests.length > 0 && respondedCount > 0}
              onContentChange={(content: string) => handleContentChange(2, content)}
              onSubmit={() => handleSubmitClick(2)}
              isSubmitting={isS2Submitting}
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div className="encounter-editor__blocked-text">
              <h4 className="encounter-editor__blocked-title">
                Working Diagnosis, Treatment and Disposition
              </h4>
              <p className="encounter-editor__blocked-subtitle">
                Dictate what you think the problem really is, what you did about it and what you're
                going to do... let our AI worry about the why
              </p>
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
            customContent={
              !isFinalized && !isArchived && encounter ? (
                <div className="encounter-editor__s3-layout">
                  {/* D1: Working Diagnosis moved from S2 to S3 */}
                  {!section3State.isLocked && (
                    <WorkingDiagnosisInput
                      suggestions={dxSuggestions}
                      loading={dxSuggestionsLoading}
                      value={
                        workingDiagnosis ??
                        encounter.section3?.workingDiagnosis ??
                        encounter.section2?.workingDiagnosis
                      }
                      onChange={handleWorkingDiagnosisChange}
                      disabled={section3State.isLocked || isFinalized || isArchived}
                    />
                  )}
                  <TreatmentInput
                    encounter={encounter}
                    cdrLibrary={cdrLibrary}
                    selectedTreatments={s3SelectedTreatments}
                    treatmentText={s3TreatmentText}
                    onUpdate={handleTreatmentUpdate}
                    disabled={section3State.isLocked || isFinalized || isArchived}
                  />
                  <DispositionSelector
                    disposition={s3Disposition}
                    followUp={s3FollowUp}
                    savedFlows={savedDispoFlows}
                    onDispositionChange={handleDispositionChange}
                    onFollowUpChange={handleFollowUpChange}
                    onApplyFlow={handleApplyDispoFlow}
                    onSaveFlow={handleSaveDispoFlow}
                    onDeleteFlow={deleteDispoFlow}
                    disabled={section3State.isLocked || isFinalized || isArchived}
                  />
                </div>
              ) : undefined
            }
            textareaPlaceholder="Additional notes for Section 3 (optional)..."
            allowEmptySubmit={s3TreatmentText.trim().length > 0 || s3Disposition !== null}
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
            <a href="/settings" className="encounter-editor__upgrade-button">
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

      {/* Paste Lab Results Modal (BM-5.1) */}
      <PasteLabModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        encounterId={encounterId}
        orderedTestIds={selectedTests}
        testLibrary={testLibrary}
        onApply={handleBatchResultUpdate}
      />

      {/* Dictation Preview Modal (BM-5.2) */}
      <PasteLabModal
        isOpen={showDictationPreview}
        onClose={() => {
          setShowDictationPreview(false)
          setDictationParsedResults([])
          setDictationUnmatchedText([])
        }}
        encounterId={encounterId}
        orderedTestIds={selectedTests}
        testLibrary={testLibrary}
        onApply={handleBatchResultUpdate}
        initialParsedResults={dictationParsedResults}
        initialUnmatchedText={dictationUnmatchedText}
        title="Dictation Results"
      />

      {/* PHI Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setPendingSection(null)
        }}
        onConfirm={handleConfirmedSubmit}
      />
    </div>
  )
}
