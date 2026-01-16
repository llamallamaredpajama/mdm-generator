import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type QuerySnapshot,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore'
import { db, useAuth } from '../lib/firebase'
import type { EncounterDocument, EncounterStatus, SectionStatus } from '../types/encounter'

/**
 * Converts Firestore data to EncounterDocument type
 */
function convertEncounterDoc(docId: string, data: DocumentData): EncounterDocument {
  return {
    id: docId,
    userId: data.userId,
    roomNumber: data.roomNumber,
    chiefComplaint: data.chiefComplaint,
    status: data.status as EncounterStatus,
    currentSection: data.currentSection || 1,
    section1: {
      status: data.section1?.status as SectionStatus || 'pending',
      content: data.section1?.content || '',
      submissionCount: data.section1?.submissionCount || 0,
      isLocked: data.section1?.isLocked || false,
      llmResponse: data.section1?.llmResponse,
    },
    section2: {
      status: data.section2?.status as SectionStatus || 'pending',
      content: data.section2?.content || '',
      submissionCount: data.section2?.submissionCount || 0,
      isLocked: data.section2?.isLocked || false,
      workingDiagnosis: data.section2?.workingDiagnosis,
      llmResponse: data.section2?.llmResponse,
    },
    section3: {
      status: data.section3?.status as SectionStatus || 'pending',
      content: data.section3?.content || '',
      submissionCount: data.section3?.submissionCount || 0,
      isLocked: data.section3?.isLocked || false,
      llmResponse: data.section3?.llmResponse,
    },
    quotaCounted: data.quotaCounted || false,
    quotaCountedAt: data.quotaCountedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    shiftStartedAt: data.shiftStartedAt,
    archivedAt: data.archivedAt,
  }
}

export interface UseEncounterListReturn {
  /** List of active (non-archived) encounters */
  encounters: EncounterDocument[]
  /** Loading state while fetching encounters */
  loading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Create a new encounter with room number and chief complaint */
  createEncounter: (roomNumber: string, chiefComplaint: string) => Promise<string>
  /** Delete an encounter (only allowed for draft/archived status) */
  deleteEncounter: (encounterId: string) => Promise<void>
}

/**
 * Hook for managing the list of encounters for the current user.
 * Provides real-time updates via Firestore onSnapshot listener.
 *
 * Features:
 * - Filters out archived encounters for the active list
 * - Sorts by updatedAt descending (most recent first)
 * - Creates new encounters with default section structure
 * - Deletes encounters (only draft/archived allowed by rules)
 */
export function useEncounterList(): UseEncounterListReturn {
  const { user } = useAuth()
  const [encounters, setEncounters] = useState<EncounterDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setEncounters([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    // Real-time listener for encounters collection
    // Filter out archived encounters and sort by updatedAt descending
    const encountersRef = collection(db, 'customers', user.uid, 'encounters')
    const q = query(
      encountersRef,
      where('status', '!=', 'archived'),
      orderBy('status'), // Required for != filter
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const encounterList: EncounterDocument[] = snapshot.docs.map((doc) =>
            convertEncounterDoc(doc.id, doc.data())
          )

          // Sort by updatedAt descending (most recent first)
          // Firestore compound indexes with != have ordering limitations,
          // so we sort client-side for consistency
          encounterList.sort((a, b) => {
            const aTime = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0
            const bTime = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0
            return bTime - aTime
          })

          setEncounters(encounterList)
          setLoading(false)
        } catch (err) {
          console.error('Error processing encounters:', err)
          setError(err instanceof Error ? err : new Error('Failed to process encounters'))
          setLoading(false)
        }
      },
      (err) => {
        console.error('Error listening to encounters:', err)
        setError(err instanceof Error ? err : new Error('Failed to load encounters'))
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user])

  /**
   * Creates a new encounter with the given room number and chief complaint.
   * Initializes all sections with default pending state.
   * Returns the new encounter's document ID.
   */
  const createEncounter = useCallback(
    async (roomNumber: string, chiefComplaint: string): Promise<string> => {
      if (!user) {
        throw new Error('User must be authenticated to create encounters')
      }

      if (!roomNumber.trim()) {
        throw new Error('Room number is required')
      }

      if (!chiefComplaint.trim()) {
        throw new Error('Chief complaint is required')
      }

      const encountersRef = collection(db, 'customers', user.uid, 'encounters')

      const defaultSectionData = {
        status: 'pending' as SectionStatus,
        content: '',
        submissionCount: 0,
        isLocked: false,
      }

      const newEncounter = {
        userId: user.uid,
        roomNumber: roomNumber.trim(),
        chiefComplaint: chiefComplaint.trim(),
        status: 'draft' as EncounterStatus,
        currentSection: 1,
        section1: { ...defaultSectionData },
        section2: { ...defaultSectionData },
        section3: { ...defaultSectionData },
        quotaCounted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        shiftStartedAt: serverTimestamp(),
      }

      const docRef = await addDoc(encountersRef, newEncounter)
      return docRef.id
    },
    [user]
  )

  /**
   * Deletes an encounter by ID.
   * Firestore rules only allow deletion of draft or archived encounters.
   */
  const deleteEncounter = useCallback(
    async (encounterId: string): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to delete encounters')
      }

      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      await deleteDoc(encounterRef)
    },
    [user]
  )

  return {
    encounters,
    loading,
    error,
    createEncounter,
    deleteEncounter,
  }
}
