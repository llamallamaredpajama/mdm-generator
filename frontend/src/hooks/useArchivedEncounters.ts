import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  writeBatch,
  doc,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { getAppDb, useAuth } from '../lib/firebase'
import type { EncounterDocument } from '../types/encounter'

/** 30 days in milliseconds */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Converts Firestore data to EncounterDocument (mirrors useEncounterList converter)
 */
function convertDoc(docId: string, data: DocumentData): EncounterDocument {
  return {
    id: docId,
    userId: data.userId,
    roomNumber: data.roomNumber,
    chiefComplaint: data.chiefComplaint,
    status: data.status,
    currentSection: data.currentSection || 1,
    mode: data.mode || 'build',
    quickModeData: data.quickModeData
      ? {
          narrative: data.quickModeData.narrative || '',
          patientIdentifier: data.quickModeData.patientIdentifier,
          status: data.quickModeData.status || 'draft',
          mdmOutput: data.quickModeData.mdmOutput,
          errorMessage: data.quickModeData.errorMessage,
          processedAt: data.quickModeData.processedAt,
        }
      : undefined,
    section1: {
      status: data.section1?.status || 'pending',
      content: data.section1?.content || '',
      submissionCount: data.section1?.submissionCount || 0,
      isLocked: data.section1?.isLocked || false,
      llmResponse: data.section1?.llmResponse,
    },
    section2: {
      status: data.section2?.status || 'pending',
      content: data.section2?.content || '',
      submissionCount: data.section2?.submissionCount || 0,
      isLocked: data.section2?.isLocked || false,
      llmResponse: data.section2?.llmResponse,
    },
    section3: {
      status: data.section3?.status || 'pending',
      content: data.section3?.content || '',
      submissionCount: data.section3?.submissionCount || 0,
      isLocked: data.section3?.isLocked || false,
      llmResponse: data.section3?.llmResponse,
    },
    cdrTracking: data.cdrTracking ?? {},
    quotaCounted: data.quotaCounted || false,
    quotaCountedAt: data.quotaCountedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    shiftStartedAt: data.shiftStartedAt,
    archivedAt: data.archivedAt,
    encounterPhoto: data.encounterPhoto ?? undefined,
    trendAnalysis: data.trendAnalysis ?? undefined,
  }
}

export interface UseArchivedEncountersReturn {
  archivedEncounters: EncounterDocument[]
  loading: boolean
}

/**
 * Hook for archived encounters with 30-day TTL cleanup.
 * Queries only documents with status === 'archived' and
 * batch-deletes any that are older than 30 days on load.
 */
export function useArchivedEncounters(): UseArchivedEncountersReturn {
  const db = getAppDb()
  const { user } = useAuth()
  const [archivedEncounters, setArchivedEncounters] = useState<EncounterDocument[]>([])
  const [loading, setLoading] = useState(true)

  const cleanupExpired = useCallback(
    async (docs: EncounterDocument[]) => {
      if (!user) return
      const now = Date.now()
      const expired = docs.filter((d) => {
        if (!d.archivedAt) return false
        const archivedMs = d.archivedAt.toMillis()
        return now - archivedMs > TTL_MS
      })
      if (expired.length === 0) return
      const batch = writeBatch(db)
      expired.forEach((d) => {
        batch.delete(doc(db, 'customers', user.uid, 'encounters', d.id))
      })
      await batch.commit()
    },
    [user, db],
  )

  useEffect(() => {
    if (!user) {
      setArchivedEncounters([])
      setLoading(false)
      return
    }

    setLoading(true)
    const encountersRef = collection(db, 'customers', user.uid, 'encounters')
    const q = query(encountersRef, where('status', '==', 'archived'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const all = snapshot.docs.map((d) => convertDoc(d.id, d.data()))

        // Cleanup expired docs (fire-and-forget)
        cleanupExpired(all).catch(() => {})

        // Filter out expired locally for immediate display
        const now = Date.now()
        const active = all.filter((d) => {
          if (!d.archivedAt) return true
          return now - d.archivedAt.toMillis() <= TTL_MS
        })

        // Sort newest archived first
        active.sort((a, b) => (b.archivedAt?.toMillis() ?? 0) - (a.archivedAt?.toMillis() ?? 0))

        setArchivedEncounters(active)
        setLoading(false)
      },
      () => {
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, db, cleanupExpired])

  return { archivedEncounters, loading }
}
