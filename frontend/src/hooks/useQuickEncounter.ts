/**
 * useQuickEncounter Hook
 *
 * Manages a single quick-mode encounter including:
 * - Real-time Firestore listener for encounter data
 * - Narrative updates with debounced auto-save
 * - MDM generation submission
 * - Loading and error states
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { getAppDb, useAuth } from '../lib/firebase'
import { useAuthToken } from '../lib/firebase'
import { generateQuickMode, type QuickModeResponse } from '../lib/api'
import { useTrendAnalysisContext } from '../contexts/TrendAnalysisContext'
import type {
  EncounterDocument,
  QuickModeData,
  QuickModeStatus,
  EncounterStatus,
  SectionStatus,
} from '../types/encounter'

interface UseQuickEncounterReturn {
  /** Current encounter data */
  encounter: EncounterDocument | null
  /** Loading state while fetching encounter */
  loading: boolean
  /** Error if fetch or operation failed */
  error: Error | null
  /** Current narrative text (local state for optimistic updates) */
  narrative: string
  /** Update narrative (triggers auto-save) */
  setNarrative: (text: string) => void
  /** Submit narrative for MDM generation */
  submitNarrative: () => Promise<QuickModeResponse | null>
  /** Whether submission is in progress */
  isSubmitting: boolean
  /** Generated MDM output (if available) */
  mdmOutput: QuickModeData['mdmOutput'] | null
  /** Quick mode status */
  quickStatus: QuickModeStatus | null
}

/**
 * Convert Firestore data to EncounterDocument
 */
function convertEncounterDoc(docId: string, data: DocumentData): EncounterDocument {
  return {
    id: docId,
    userId: data.userId,
    roomNumber: data.roomNumber,
    chiefComplaint: data.chiefComplaint,
    status: data.status as EncounterStatus,
    currentSection: data.currentSection || 1,
    mode: data.mode || 'build',
    quickModeData: data.quickModeData,
    section1: {
      status: (data.section1?.status as SectionStatus) || 'pending',
      content: data.section1?.content || '',
      submissionCount: data.section1?.submissionCount || 0,
      isLocked: data.section1?.isLocked || false,
      llmResponse: data.section1?.llmResponse,
    },
    section2: {
      status: (data.section2?.status as SectionStatus) || 'pending',
      content: data.section2?.content || '',
      submissionCount: data.section2?.submissionCount || 0,
      isLocked: data.section2?.isLocked || false,
      workingDiagnosis: data.section2?.workingDiagnosis ?? undefined,
      selectedTests: data.section2?.selectedTests ?? [],
      testResults: data.section2?.testResults ?? {},
      allUnremarkable: data.section2?.allUnremarkable ?? false,
      pastedRawText: data.section2?.pastedRawText ?? null,
      appliedOrderSet: data.section2?.appliedOrderSet ?? null,
      llmResponse: data.section2?.llmResponse,
    },
    section3: {
      status: (data.section3?.status as SectionStatus) || 'pending',
      content: data.section3?.content || '',
      submissionCount: data.section3?.submissionCount || 0,
      isLocked: data.section3?.isLocked || false,
      treatments: data.section3?.treatments ?? undefined,
      cdrSuggestedTreatments: data.section3?.cdrSuggestedTreatments ?? [],
      disposition: data.section3?.disposition ?? null,
      followUp: data.section3?.followUp ?? [],
      appliedDispoFlow: data.section3?.appliedDispoFlow ?? null,
      llmResponse: data.section3?.llmResponse,
    },
    cdrTracking: data.cdrTracking ?? {},
    quotaCounted: data.quotaCounted || false,
    quotaCountedAt: data.quotaCountedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    shiftStartedAt: data.shiftStartedAt,
    archivedAt: data.archivedAt,
  }
}

/**
 * Hook for managing a single quick-mode encounter
 *
 * @param encounterId - The Firestore document ID of the encounter
 */
export function useQuickEncounter(encounterId: string | null): UseQuickEncounterReturn {
  const db = getAppDb()
  const { user } = useAuth()
  const idToken = useAuthToken()
  const { isEnabled: trendEnabled, location: trendLocation, isLocationValid: trendLocationValid } = useTrendAnalysisContext()

  const [encounter, setEncounter] = useState<EncounterDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [narrative, setNarrativeState] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce timer ref for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time listener for encounter data
  useEffect(() => {
    if (!user || !encounterId) {
      setEncounter(null)
      setLoading(false)
      setNarrativeState('')
      return
    }

    setLoading(true)
    setError(null)

    const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)

    const unsubscribe = onSnapshot(
      encounterRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = convertEncounterDoc(snapshot.id, snapshot.data())
          setEncounter(data)
          // Initialize narrative from stored data
          if (data.quickModeData?.narrative && narrative === '') {
            setNarrativeState(data.quickModeData.narrative)
          }
        } else {
          setEncounter(null)
          setError(new Error('Encounter not found'))
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error listening to encounter:', err)
        setError(err instanceof Error ? err : new Error('Failed to load encounter'))
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
      // Clear any pending save timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: only initialize narrative on first load, not on every change
  }, [user, encounterId])

  /**
   * Update narrative with debounced auto-save to Firestore
   */
  const setNarrative = useCallback(
    (text: string) => {
      setNarrativeState(text)

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      // Don't auto-save if no user, encounter, or if encounter is already completed
      if (!user || !encounterId || encounter?.quickModeData?.status === 'completed') {
        return
      }

      // Debounced save (500ms)
      saveTimerRef.current = setTimeout(async () => {
        try {
          const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
          await updateDoc(encounterRef, {
            'quickModeData.narrative': text,
            'quickModeData.status': 'draft',
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          console.error('Failed to auto-save narrative:', err)
          // Don't set error state for auto-save failures - it's non-critical
        }
      }, 500)
    },
    [user, encounterId, encounter?.quickModeData?.status]
  )

  /**
   * Submit narrative for MDM generation
   */
  const submitNarrative = useCallback(async (): Promise<QuickModeResponse | null> => {
    if (!user || !encounterId || !idToken || !narrative.trim()) {
      return null
    }

    if (encounter?.quickModeData?.status === 'completed') {
      setError(new Error('Encounter already completed'))
      return null
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Clear any pending auto-save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      const location = trendEnabled && trendLocationValid && trendLocation ? trendLocation : undefined
      const response = await generateQuickMode(encounterId, narrative, idToken, location)
      return response
    } catch (err) {
      console.error('Failed to generate MDM:', err)
      setError(err instanceof Error ? err : new Error('Failed to generate MDM'))

      // Mark encounter as error state in Firestore
      try {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        await updateDoc(encounterRef, {
          'quickModeData.status': 'error',
          'quickModeData.errorMessage': err instanceof Error ? err.message : 'Unknown error',
          updatedAt: serverTimestamp(),
        })
      } catch {
        // Ignore secondary errors
      }

      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [user, encounterId, idToken, narrative, encounter?.quickModeData?.status, trendEnabled, trendLocationValid, trendLocation])

  return {
    encounter,
    loading,
    error,
    narrative,
    setNarrative,
    submitNarrative,
    isSubmitting,
    mdmOutput: encounter?.quickModeData?.mdmOutput || null,
    quickStatus: encounter?.quickModeData?.status || null,
  }
}
