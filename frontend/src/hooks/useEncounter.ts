/**
 * useEncounter Hook
 *
 * Manages a single encounter document with real-time Firestore updates,
 * local content editing, and section submission to the backend API.
 *
 * Build Mode v2 - Single Encounter CRUD + Section Processing
 */

import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, useAuth, useAuthToken } from '../lib/firebase'
import { processSection1, processSection2, finalizeEncounter } from '../lib/api'
import type {
  EncounterDocument,
  SectionNumber,
  Section1Data,
  Section2Data,
  Section3Data,
  Section1Response,
  Section2Response,
  FinalizeResponse,
} from '../types/encounter'
import { MAX_SUBMISSIONS_PER_SECTION } from '../types/encounter'

export interface UseEncounterReturn {
  /** The encounter document with real-time updates */
  encounter: EncounterDocument | null
  /** Loading state while fetching encounter */
  loading: boolean
  /** Error state if fetch fails */
  error: Error | null
  /** Update section content locally (does not persist to Firestore until submit) */
  updateSectionContent: (section: SectionNumber, content: string) => void
  /** Submit a section for LLM processing */
  submitSection: (section: SectionNumber, workingDiagnosis?: string) => Promise<void>
  /** Whether a section submission is in progress */
  isSubmitting: boolean
  /** Which section is currently being submitted (null if none) */
  submittingSection: SectionNumber | null
  /** Latest quota remaining (updated after submissions) */
  quotaRemaining: number | null
}

/**
 * Hook to manage a single encounter with real-time updates and section processing
 *
 * @param encounterId - Firestore document ID for the encounter
 * @returns Encounter state and mutation functions
 */
export function useEncounter(encounterId: string | null): UseEncounterReturn {
  const { user } = useAuth()
  const token = useAuthToken()

  // Core state
  const [encounter, setEncounter] = useState<EncounterDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Local content state (separate from Firestore to allow editing before submit)
  const [localContent, setLocalContent] = useState<Record<SectionNumber, string>>({
    1: '',
    2: '',
    3: '',
  })

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingSection, setSubmittingSection] = useState<SectionNumber | null>(null)
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)

  // Real-time listener for encounter document
  useEffect(() => {
    if (!user || !encounterId) {
      setEncounter(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)

    const unsubscribe = onSnapshot(
      encounterRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setError(new Error('Encounter not found'))
            setEncounter(null)
          } else {
            const data = snapshot.data()
            const encounterData: EncounterDocument = {
              id: snapshot.id,
              userId: data.userId,
              roomNumber: data.roomNumber,
              chiefComplaint: data.chiefComplaint,
              status: data.status,
              currentSection: data.currentSection,
              section1: data.section1,
              section2: data.section2,
              section3: data.section3,
              quotaCounted: data.quotaCounted,
              quotaCountedAt: data.quotaCountedAt,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              shiftStartedAt: data.shiftStartedAt,
              archivedAt: data.archivedAt,
            }

            setEncounter(encounterData)

            // Initialize local content from Firestore if empty
            setLocalContent((prev) => ({
              1: prev[1] || encounterData.section1.content,
              2: prev[2] || encounterData.section2.content,
              3: prev[3] || encounterData.section3.content,
            }))
          }
          setLoading(false)
        } catch (err) {
          console.error('Error processing encounter data:', err)
          setError(err instanceof Error ? err : new Error('Failed to process encounter'))
          setLoading(false)
        }
      },
      (err) => {
        console.error('Error listening to encounter:', err)
        setError(err instanceof Error ? err : new Error('Failed to load encounter'))
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user, encounterId])

  // Reset local content when encounter changes
  useEffect(() => {
    if (encounter) {
      setLocalContent({
        1: encounter.section1.content,
        2: encounter.section2.content,
        3: encounter.section3.content,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: only reset on ID change, not every update
  }, [encounter?.id])

  /**
   * Update section content locally (does not persist until submit)
   */
  const updateSectionContent = useCallback((section: SectionNumber, content: string) => {
    setLocalContent((prev) => ({
      ...prev,
      [section]: content,
    }))
  }, [])

  /**
   * Get section data by section number
   */
  const getSectionData = (
    enc: EncounterDocument,
    section: SectionNumber
  ): Section1Data | Section2Data | Section3Data => {
    switch (section) {
      case 1:
        return enc.section1
      case 2:
        return enc.section2
      case 3:
        return enc.section3
    }
  }

  /**
   * Check if a section can be submitted
   */
  const canSubmitSection = useCallback(
    (section: SectionNumber): boolean => {
      if (!encounter) return false

      const sectionData = getSectionData(encounter, section)

      // Check if locked
      if (sectionData.isLocked) return false

      // Check submission count
      if (sectionData.submissionCount >= MAX_SUBMISSIONS_PER_SECTION) return false

      // Section 2 requires section 1 to be completed
      if (section === 2 && encounter.section1.status !== 'completed') return false

      // Section 3 requires section 2 to be completed
      if (section === 3 && encounter.section2.status !== 'completed') return false

      // Check content is not empty
      const content = localContent[section]
      if (!content || content.trim().length === 0) return false

      return true
    },
    [encounter, localContent]
  )

  /**
   * Submit a section for LLM processing
   */
  const submitSection = useCallback(
    async (section: SectionNumber, workingDiagnosis?: string): Promise<void> => {
      if (!user || !encounterId || !token || !encounter) {
        throw new Error('Cannot submit: missing required data')
      }

      // Validate submission is allowed
      if (!canSubmitSection(section)) {
        const sectionData = getSectionData(encounter, section)
        if (sectionData.isLocked) {
          throw new Error('This section is locked and cannot be resubmitted')
        }
        if (sectionData.submissionCount >= MAX_SUBMISSIONS_PER_SECTION) {
          throw new Error('Maximum submissions reached for this section')
        }
        throw new Error('Cannot submit this section')
      }

      setIsSubmitting(true)
      setSubmittingSection(section)

      try {
        const content = localContent[section]
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)

        let response: Section1Response | Section2Response | FinalizeResponse

        // Call appropriate API endpoint based on section
        switch (section) {
          case 1:
            response = await processSection1(encounterId, content, token)
            // Update Firestore with response
            await updateDoc(encounterRef, {
              'section1.content': content,
              'section1.submissionCount': response.submissionCount,
              'section1.isLocked': response.isLocked,
              'section1.status': response.isLocked ? 'completed' : 'in_progress',
              'section1.llmResponse': {
                differential: (response as Section1Response).differential,
                processedAt: serverTimestamp(),
              },
              status: response.isLocked ? 'section1_done' : encounter.status,
              updatedAt: serverTimestamp(),
            })
            setQuotaRemaining((response as Section1Response).quotaRemaining)
            break

          case 2:
            response = await processSection2(encounterId, content, token, workingDiagnosis)
            // Update Firestore with response
            await updateDoc(encounterRef, {
              'section2.content': content,
              'section2.submissionCount': response.submissionCount,
              'section2.isLocked': response.isLocked,
              'section2.status': response.isLocked ? 'completed' : 'in_progress',
              'section2.workingDiagnosis': workingDiagnosis || null,
              'section2.llmResponse': {
                mdmPreview: (response as Section2Response).mdmPreview,
                processedAt: serverTimestamp(),
              },
              status: response.isLocked ? 'section2_done' : encounter.status,
              currentSection: response.isLocked ? 3 : 2,
              updatedAt: serverTimestamp(),
            })
            break

          case 3:
            response = await finalizeEncounter(encounterId, content, token)
            // Update Firestore with response
            await updateDoc(encounterRef, {
              'section3.content': content,
              'section3.submissionCount': 1, // Finalize only allows 1 submission typically
              'section3.isLocked': true,
              'section3.status': 'completed',
              'section3.llmResponse': {
                finalMdm: (response as FinalizeResponse).finalMdm,
                processedAt: serverTimestamp(),
              },
              status: 'finalized',
              updatedAt: serverTimestamp(),
            })
            setQuotaRemaining((response as FinalizeResponse).quotaRemaining)
            break
        }
      } catch (err) {
        console.error(`Error submitting section ${section}:`, err)
        throw err
      } finally {
        setIsSubmitting(false)
        setSubmittingSection(null)
      }
    },
    [user, encounterId, token, encounter, localContent, canSubmitSection]
  )

  // Merge local content with encounter for return value
  const encounterWithLocalContent: EncounterDocument | null = encounter
    ? {
        ...encounter,
        section1: { ...encounter.section1, content: localContent[1] },
        section2: { ...encounter.section2, content: localContent[2] },
        section3: { ...encounter.section3, content: localContent[3] },
      }
    : null

  return {
    encounter: encounterWithLocalContent,
    loading,
    error,
    updateSectionContent,
    submitSection,
    isSubmitting,
    submittingSection,
    quotaRemaining,
  }
}

/**
 * Helper hook to get section-specific state
 */
export function useSectionState(
  encounter: EncounterDocument | null,
  section: SectionNumber
): {
  status: string
  content: string
  submissionCount: number
  isLocked: boolean
  canSubmit: boolean
  remainingSubmissions: number
} {
  if (!encounter) {
    return {
      status: 'pending',
      content: '',
      submissionCount: 0,
      isLocked: false,
      canSubmit: false,
      remainingSubmissions: MAX_SUBMISSIONS_PER_SECTION,
    }
  }

  const sectionKey = `section${section}` as 'section1' | 'section2' | 'section3'
  const sectionData = encounter[sectionKey]

  // Check dependencies for canSubmit
  let canSubmit = !sectionData.isLocked && sectionData.submissionCount < MAX_SUBMISSIONS_PER_SECTION
  if (section === 2 && encounter.section1.status !== 'completed') {
    canSubmit = false
  }
  if (section === 3 && encounter.section2.status !== 'completed') {
    canSubmit = false
  }

  return {
    status: sectionData.status,
    content: sectionData.content,
    submissionCount: sectionData.submissionCount,
    isLocked: sectionData.isLocked,
    canSubmit,
    remainingSubmissions: Math.max(0, MAX_SUBMISSIONS_PER_SECTION - sectionData.submissionCount),
  }
}
