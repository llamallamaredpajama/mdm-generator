import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db, useAuth } from '../lib/firebase'
import type {
  EncounterDocument,
  EncounterStatus,
  EncounterMode,
  SectionStatus,
  QuickModeStatus,
} from '../types/encounter'

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
    // Mode defaults to 'build' for backward compatibility
    mode: (data.mode as EncounterMode) || 'build',
    // Quick mode data (only present for quick mode encounters)
    quickModeData: data.quickModeData
      ? {
          narrative: data.quickModeData.narrative || '',
          patientIdentifier: data.quickModeData.patientIdentifier,
          status: (data.quickModeData.status as QuickModeStatus) || 'draft',
          mdmOutput: data.quickModeData.mdmOutput,
          errorMessage: data.quickModeData.errorMessage,
          processedAt: data.quickModeData.processedAt,
        }
      : undefined,
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
      workingDiagnosis: data.section2?.workingDiagnosis,
      llmResponse: data.section2?.llmResponse,
    },
    section3: {
      status: (data.section3?.status as SectionStatus) || 'pending',
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

/**
 * Parses a room number string into structured parts for sorting
 */
function parseRoomNumber(room: string): { type: 'word' | 'compound' | 'numeric'; word: string; num: number } {
  const trimmed = room.trim().toLowerCase()
  const numericMatch = trimmed.match(/^(\d+)/)
  if (numericMatch) {
    return { type: 'numeric', word: '', num: parseInt(numericMatch[1], 10) }
  }
  const compoundMatch = trimmed.match(/^([a-z]+)\s*(\d+)/)
  if (compoundMatch) {
    return { type: 'compound', word: compoundMatch[1], num: parseInt(compoundMatch[2], 10) }
  }
  return { type: 'word', word: trimmed, num: 0 }
}

/**
 * Compares two room numbers for sorting
 * Priority: word-only < compound (word+num) < pure numeric
 * Within types: alphabetical for words, numerical for numbers
 */
function compareRooms(a: string, b: string): number {
  const parsedA = parseRoomNumber(a)
  const parsedB = parseRoomNumber(b)
  const typePriority = { word: 0, compound: 1, numeric: 2 }
  if (typePriority[parsedA.type] !== typePriority[parsedB.type]) {
    return typePriority[parsedA.type] - typePriority[parsedB.type]
  }
  if (parsedA.type === 'numeric') {
    return parsedA.num - parsedB.num
  }
  const wordCompare = parsedA.word.localeCompare(parsedB.word)
  if (wordCompare !== 0) return wordCompare
  return parsedA.num - parsedB.num
}

export interface UseEncounterListReturn {
  /** List of active (non-archived) encounters filtered by mode */
  encounters: EncounterDocument[]
  /** Loading state while fetching encounters */
  loading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Create a new encounter with room number and chief complaint */
  createEncounter: (roomNumber: string, chiefComplaint: string) => Promise<string>
  /** Delete an encounter (only allowed for draft/archived status) */
  deleteEncounter: (encounterId: string) => Promise<void>
  /** Delete all encounters in the current mode (batch delete) */
  clearAllEncounters: () => Promise<void>
}

/**
 * Hook for managing the list of encounters for the current user.
 * Provides real-time updates via Firestore onSnapshot listener.
 *
 * Features:
 * - Filters encounters by mode (quick or build)
 * - Filters out archived encounters for the active list
 * - Sorts by updatedAt descending (most recent first)
 * - Creates new encounters with default section structure
 * - Deletes encounters (only draft/archived allowed by rules)
 *
 * @param mode - The encounter mode to filter by ('quick' or 'build')
 */
export function useEncounterList(mode: EncounterMode = 'build'): UseEncounterListReturn {
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
    // Get all encounters and filter client-side to avoid complex composite index
    const encountersRef = collection(db, 'customers', user.uid, 'encounters')

    const unsubscribe = onSnapshot(
      encountersRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const encounterList: EncounterDocument[] = snapshot.docs
            .map((doc) => convertEncounterDoc(doc.id, doc.data()))
            // Filter out archived encounters and filter by mode
            .filter((encounter) => {
              // Exclude archived encounters
              if (encounter.status === 'archived') return false
              // Filter by mode (default to 'build' for encounters without mode field)
              const encounterMode = encounter.mode || 'build'
              return encounterMode === mode
            })

          // Sort by room number (word-only < compound < numeric)
          encounterList.sort((a, b) => compareRooms(a.roomNumber, b.roomNumber))

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
  }, [user, mode])

  /**
   * Creates a new encounter with the given room number and chief complaint.
   * Initializes based on the current mode:
   * - Quick mode: Sets up quickModeData with draft status
   * - Build mode: Sets up all three sections with pending state
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

      // Chief complaint required for build mode, optional for quick mode
      if (mode === 'build' && !chiefComplaint.trim()) {
        throw new Error('Chief complaint is required')
      }

      const encountersRef = collection(db, 'customers', user.uid, 'encounters')

      const defaultSectionData = {
        status: 'pending' as SectionStatus,
        content: '',
        submissionCount: 0,
        isLocked: false,
      }

      // Base encounter data common to both modes
      const baseEncounter = {
        userId: user.uid,
        roomNumber: roomNumber.trim(),
        chiefComplaint: chiefComplaint.trim(),
        status: 'draft' as EncounterStatus,
        mode: mode,
        quotaCounted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        shiftStartedAt: serverTimestamp(),
      }

      // Mode-specific data
      const modeSpecificData =
        mode === 'quick'
          ? {
              // Quick mode: initialize quickModeData, sections are not used
              quickModeData: {
                narrative: '',
                status: 'draft' as QuickModeStatus,
              },
              currentSection: 1,
              section1: { ...defaultSectionData },
              section2: { ...defaultSectionData },
              section3: { ...defaultSectionData },
            }
          : {
              // Build mode: initialize all sections
              currentSection: 1,
              section1: { ...defaultSectionData },
              section2: { ...defaultSectionData },
              section3: { ...defaultSectionData },
            }

      const newEncounter = {
        ...baseEncounter,
        ...modeSpecificData,
      }

      const docRef = await addDoc(encountersRef, newEncounter)
      return docRef.id
    },
    [user, mode]
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

  /**
   * Deletes all encounters in the current mode using a batch operation.
   * Only deletes encounters visible in the current list (filtered by mode).
   */
  const clearAllEncounters = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to clear encounters')
    }

    if (encounters.length === 0) {
      return // Nothing to delete
    }

    const batch = writeBatch(db)

    encounters.forEach((enc) => {
      const docRef = doc(db, 'customers', user.uid, 'encounters', enc.id)
      batch.delete(docRef)
    })

    await batch.commit()
  }, [user, encounters])

  return {
    encounters,
    loading,
    error,
    createEncounter,
    deleteEncounter,
    clearAllEncounters,
  }
}
