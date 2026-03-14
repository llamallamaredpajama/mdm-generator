/**
 * useDispoFlows Hook
 *
 * API-backed CRUD for saved disposition flows, persisted in Firestore via
 * /v1/user/dispo-flows endpoints. Includes one-time migration from
 * localStorage for users who had locally-saved flows.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthToken } from '../lib/firebase'
import type { DispositionFlow } from '../types/userProfile'
import type { DispositionOption } from '../types/encounter'
import {
  getDispoFlows,
  createDispoFlow,
  updateDispoFlow as apiUpdateDispoFlow,
  deleteDispoFlow as apiDeleteDispoFlow,
  useDispoFlow as apiUseDispoFlow,
} from '../lib/api'

export type { DispositionFlow } from '../types/userProfile'
export type { DispositionFlow as DispoFlow } from '../types/userProfile'

const LEGACY_STORAGE_KEY = 'mdm-dispo-flows'
const MIGRATION_FLAG = 'mdm-dispo-flows-migrated'
const MIGRATION_RETRY_KEY = 'mdm-dispo-flows-migration-retries'
const MAX_MIGRATION_RETRIES = 3

export interface UseDispoFlowsReturn {
  flows: DispositionFlow[]
  loading: boolean
  saveFlow: (
    name: string,
    disposition: DispositionOption,
    followUp: string[],
  ) => Promise<DispositionFlow | null>
  updateFlow: (
    id: string,
    data: { name?: string; disposition?: DispositionOption; followUp?: string[] },
  ) => Promise<void>
  deleteFlow: (id: string) => Promise<void>
  incrementUsage: (id: string) => void
}

interface LegacyDispoFlow {
  id: string
  name: string
  disposition: string | { value: string }
  followUp: string[]
}

async function migrateFromLocalStorage(token: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return

  const retries = parseInt(localStorage.getItem(MIGRATION_RETRY_KEY) ?? '0', 10)
  if (retries >= MAX_MIGRATION_RETRIES) return

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    const legacy: LegacyDispoFlow[] = JSON.parse(raw)
    if (!Array.isArray(legacy) || legacy.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    for (const flow of legacy) {
      const raw =
        typeof flow.disposition === 'string' ? flow.disposition : (flow.disposition?.value ?? '')
      if (raw) {
        await createDispoFlow(token, {
          name: flow.name,
          disposition: raw as DispositionOption,
          followUp: flow.followUp,
        })
      }
    }

    localStorage.setItem(MIGRATION_FLAG, '1')
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(MIGRATION_RETRY_KEY)
  } catch {
    localStorage.setItem(MIGRATION_RETRY_KEY, String(retries + 1))
  }
}

export function useDispoFlows(): UseDispoFlowsReturn {
  const token = useAuthToken()
  const [flows, setFlows] = useState<DispositionFlow[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || fetchedRef.current) return
    fetchedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        await migrateFromLocalStorage(token)
        const res = await getDispoFlows(token)
        if (!cancelled) setFlows(res.items)
      } catch {
        // Fall back to empty
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      fetchedRef.current = false
      setFlows([])
      setLoading(true)
    }
  }, [token])

  const saveFlow = useCallback(
    async (
      name: string,
      disposition: DispositionOption,
      followUp: string[],
    ): Promise<DispositionFlow | null> => {
      if (!token) return null
      try {
        const res = await createDispoFlow(token, {
          name: name.trim(),
          disposition,
          followUp,
        })
        setFlows((prev) => [...prev, res.item])
        return res.item
      } catch {
        return null
      }
    },
    [token],
  )

  const updateFlow = useCallback(
    async (
      id: string,
      data: { name?: string; disposition?: DispositionOption; followUp?: string[] },
    ) => {
      if (!token) return
      const existing = flows.find((f) => f.id === id)
      if (!existing) return

      try {
        const res = await apiUpdateDispoFlow(token, id, {
          name: data.name ?? existing.name,
          disposition: data.disposition ?? existing.disposition,
          ...(data.followUp !== undefined && { followUp: data.followUp }),
        })
        setFlows((prev) => prev.map((f) => (f.id === id ? res.item : f)))
      } catch {
        // Silently fail
      }
    },
    [token, flows],
  )

  const deleteFlow = useCallback(
    async (id: string) => {
      if (!token) return
      setFlows((prev) => prev.filter((f) => f.id !== id))
      try {
        await apiDeleteDispoFlow(token, id)
      } catch {
        try {
          const res = await getDispoFlows(token)
          setFlows(res.items)
        } catch {
          // Give up
        }
      }
    },
    [token],
  )

  const incrementUsage = useCallback(
    (id: string) => {
      if (!token) return
      setFlows((prev) =>
        prev.map((f) => (f.id === id ? { ...f, usageCount: f.usageCount + 1 } : f)),
      )
      apiUseDispoFlow(token, id).catch(() => {})
    },
    [token],
  )

  return {
    flows,
    loading,
    saveFlow,
    updateFlow,
    deleteFlow,
    incrementUsage,
  }
}
