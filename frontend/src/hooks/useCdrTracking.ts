/**
 * useCdrTracking Hook
 *
 * Manages CDR tracking state for an encounter: answering components,
 * dismissing CDRs, computing scores, and debounced Firestore persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, useAuth } from '../lib/firebase'
import type {
  CdrTracking,
  CdrTrackingEntry,
  CdrComponentState,
  CdrStatus,
} from '../types/encounter'
import type { CdrDefinition } from '../types/libraries'

export interface UseCdrTrackingReturn {
  /** Current CDR tracking state (local, optimistic) */
  tracking: CdrTracking
  /** Answer a component for a CDR */
  answerComponent: (cdrId: string, componentId: string, value: number) => void
  /** Dismiss a CDR (excludes from scoring and final MDM) */
  dismissCdr: (cdrId: string) => void
  /** Undo dismiss on a CDR */
  undismissCdr: (cdrId: string) => void
  /** A4: Toggle excluded flag — CDR stays visible but omitted from finalize */
  toggleExcluded: (cdrId: string) => void
  // Note: S2 auto-populate is handled by EncounterEditor effect (direct Firestore write)
  // to avoid dual-state management when CdrDetailView is not mounted.
}

/**
 * Compute CDR status from component answered states.
 */
function computeStatus(components: Record<string, CdrComponentState>): CdrStatus {
  const entries = Object.values(components)
  if (entries.length === 0) return 'pending'
  const answeredCount = entries.filter((c) => c.answered).length
  if (answeredCount === 0) return 'pending'
  if (answeredCount === entries.length) return 'completed'
  return 'partial'
}

/**
 * Calculate score for a CDR using its scoring method.
 * Returns null values if not all components are answered.
 */
function calculateScore(
  cdr: CdrDefinition,
  components: Record<string, CdrComponentState>,
): { score: number | null; interpretation: string | null } {
  const allAnswered = Object.values(components).every((c) => c.answered)
  if (!allAnswered) return { score: null, interpretation: null }

  if (cdr.scoring.method === 'sum') {
    const score = Object.values(components).reduce((sum, c) => sum + (c.value ?? 0), 0)
    const range = cdr.scoring.ranges.find((r) => score >= r.min && score <= r.max)
    return {
      score,
      interpretation: range ? `${range.risk}: ${range.interpretation}` : null,
    }
  }

  return { score: null, interpretation: null }
}

/**
 * Find a CDR definition by ID from the library.
 */
function findCdr(cdrId: string, cdrLibrary: CdrDefinition[]): CdrDefinition | undefined {
  return cdrLibrary.find((c) => c.id === cdrId)
}

/**
 * Hook for managing CDR tracking state with optimistic updates and debounced Firestore writes.
 *
 * @param encounterId - Firestore encounter document ID
 * @param initialTracking - Initial CdrTracking from encounter (from onSnapshot)
 * @param cdrLibrary - CDR definitions (for score calculation)
 */
export function useCdrTracking(
  encounterId: string | null,
  initialTracking: CdrTracking,
  cdrLibrary: CdrDefinition[],
): UseCdrTrackingReturn {
  const { user } = useAuth()
  const [tracking, setTracking] = useState<CdrTracking>(initialTracking)
  const firestoreWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTrackingRef = useRef<CdrTracking | null>(null)

  // Sync from Firestore when initial tracking changes (onSnapshot updates)
  const initialRef = useRef(initialTracking)
  useEffect(() => {
    // Only sync if the external data actually changed (avoid overwriting local edits during debounce)
    if (initialTracking !== initialRef.current) {
      initialRef.current = initialTracking
      // Only overwrite local state if no pending write
      if (!pendingTrackingRef.current) {
        setTracking(initialTracking)
      }
    }
  }, [initialTracking])

  /**
   * Persist updated tracking to Firestore with debounce.
   */
  const persistTracking = useCallback(
    (updatedTracking: CdrTracking) => {
      if (!user || !encounterId) return

      pendingTrackingRef.current = updatedTracking
      if (firestoreWriteTimer.current) {
        clearTimeout(firestoreWriteTimer.current)
      }
      firestoreWriteTimer.current = setTimeout(() => {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { cdrTracking: updatedTracking }).catch((err) =>
          console.error('Failed to persist cdrTracking:', err?.message || 'unknown error'),
        )
        pendingTrackingRef.current = null
      }, 300)
    },
    [user, encounterId],
  )

  // Cleanup on unmount: flush pending write
  useEffect(() => {
    return () => {
      if (firestoreWriteTimer.current) clearTimeout(firestoreWriteTimer.current)
      if (pendingTrackingRef.current !== null && user && encounterId) {
        const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
        updateDoc(encounterRef, { cdrTracking: pendingTrackingRef.current }).catch((err) =>
          console.error('Failed to flush cdrTracking on unmount:', err?.message || 'unknown error'),
        )
      }
    }
  }, [user, encounterId])

  /**
   * Answer a component for a CDR.
   */
  const answerComponent = useCallback(
    (cdrId: string, componentId: string, value: number) => {
      setTracking((prev) => {
        const entry = prev[cdrId]
        if (!entry) return prev

        const updatedComponents = {
          ...entry.components,
          [componentId]: {
            ...entry.components[componentId],
            value,
            answered: true,
            source: 'user_input' as const,
          },
        }

        const status = computeStatus(updatedComponents)
        const cdr = findCdr(cdrId, cdrLibrary)
        const { score, interpretation } = cdr
          ? calculateScore(cdr, updatedComponents)
          : { score: null, interpretation: null }

        const updatedEntry: CdrTrackingEntry = {
          ...entry,
          components: updatedComponents,
          status,
          score,
          interpretation,
          completedInSection: status === 'completed' ? 1 : entry.completedInSection,
        }

        const updated = { ...prev, [cdrId]: updatedEntry }
        persistTracking(updated)
        return updated
      })
    },
    [cdrLibrary, persistTracking],
  )

  /**
   * Dismiss a CDR.
   */
  const dismissCdr = useCallback(
    (cdrId: string) => {
      setTracking((prev) => {
        const entry = prev[cdrId]
        if (!entry) return prev

        const updatedEntry: CdrTrackingEntry = {
          ...entry,
          status: 'dismissed',
          dismissed: true,
        }

        const updated = { ...prev, [cdrId]: updatedEntry }
        persistTracking(updated)
        return updated
      })
    },
    [persistTracking],
  )

  /**
   * Undo dismiss on a CDR — recompute status from components.
   */
  const undismissCdr = useCallback(
    (cdrId: string) => {
      setTracking((prev) => {
        const entry = prev[cdrId]
        if (!entry) return prev

        const status = computeStatus(entry.components)
        const cdr = findCdr(cdrId, cdrLibrary)
        const { score, interpretation } = cdr
          ? calculateScore(cdr, entry.components)
          : { score: null, interpretation: null }

        const updatedEntry: CdrTrackingEntry = {
          ...entry,
          status,
          dismissed: false,
          score,
          interpretation,
        }

        const updated = { ...prev, [cdrId]: updatedEntry }
        persistTracking(updated)
        return updated
      })
    },
    [cdrLibrary, persistTracking],
  )

  /**
   * A4: Toggle excluded flag — CDR stays visible but omitted from finalize.
   */
  const toggleExcluded = useCallback(
    (cdrId: string) => {
      setTracking((prev) => {
        const entry = prev[cdrId]
        if (!entry) return prev

        const updatedEntry: CdrTrackingEntry = {
          ...entry,
          excluded: !entry.excluded,
        }

        const updated = { ...prev, [cdrId]: updatedEntry }
        persistTracking(updated)
        return updated
      })
    },
    [persistTracking],
  )

  return {
    tracking,
    answerComponent,
    dismissCdr,
    undismissCdr,
    toggleExcluded,
  }
}
