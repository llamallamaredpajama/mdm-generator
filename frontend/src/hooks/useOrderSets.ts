/**
 * useOrderSets Hook
 *
 * API-backed CRUD for saved order sets, persisted in Firestore via
 * /v1/user/order-sets endpoints. Includes one-time migration from
 * localStorage for users who had locally-saved sets.
 *
 * Re-exports the OrderSet type from userProfile for convenience.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthToken } from '../lib/firebase'
import type { OrderSet } from '../types/userProfile'
import {
  getOrderSets,
  createOrderSet,
  updateOrderSet as apiUpdateOrderSet,
  deleteOrderSet as apiDeleteOrderSet,
  useOrderSet as apiUseOrderSet,
} from '../lib/api'

export type { OrderSet } from '../types/userProfile'

const LEGACY_STORAGE_KEY = 'mdm-order-sets'
const MIGRATION_FLAG = 'mdm-order-sets-migrated'

export interface UseOrderSetsReturn {
  orderSets: OrderSet[]
  loading: boolean
  saveOrderSet: (name: string, testIds: string[], tags?: string[]) => Promise<OrderSet | null>
  updateOrderSet: (
    id: string,
    data: { name?: string; tests?: string[]; tags?: string[] },
  ) => Promise<void>
  deleteOrderSet: (id: string) => Promise<void>
  incrementUsage: (id: string) => void
  suggestOrderSet: (differentialText: string) => OrderSet | null
}

interface LegacyOrderSet {
  id: string
  name: string
  testIds: string[]
  tags: string[]
  usageCount: number
  createdAt: string
}

/**
 * Migrate localStorage order sets to Firestore (one-time).
 * Runs silently — migration failures don't block the UI.
 */
async function migrateFromLocalStorage(token: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    const legacy: LegacyOrderSet[] = JSON.parse(raw)
    if (!Array.isArray(legacy) || legacy.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    // Create each legacy set via API (sequential to avoid race conditions)
    for (const set of legacy) {
      if (set.testIds.length > 0) {
        await createOrderSet(token, {
          name: set.name,
          tests: set.testIds,
          tags: set.tags,
        })
      }
    }

    localStorage.setItem(MIGRATION_FLAG, '1')
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Migration failed silently — user can still use localStorage sets
    // Will retry on next load
  }
}

/**
 * Simple keyword matching: checks if any order set tags or name words
 * appear in the differential text. Returns the best match by overlap count.
 */
function findBestMatch(sets: OrderSet[], differentialText: string): OrderSet | null {
  if (sets.length === 0 || !differentialText) return null

  const lowerText = differentialText.toLowerCase()
  let bestMatch: OrderSet | null = null
  let bestScore = 0

  for (const set of sets) {
    let score = 0

    for (const tag of set.tags) {
      if (lowerText.includes(tag.toLowerCase())) {
        score += 2
      }
    }

    const nameWords = set.name.toLowerCase().split(/\s+/)
    for (const word of nameWords) {
      if (word.length > 2 && lowerText.includes(word)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = set
    }
  }

  return bestScore > 0 ? bestMatch : null
}

export function useOrderSets(): UseOrderSetsReturn {
  const token = useAuthToken()
  const [orderSets, setOrderSets] = useState<OrderSet[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  // Fetch order sets from API on mount (once per token)
  useEffect(() => {
    if (!token || fetchedRef.current) return
    fetchedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        await migrateFromLocalStorage(token)
        const res = await getOrderSets(token)
        if (!cancelled) setOrderSets(res.items)
      } catch {
        // Fall back to empty — user can retry by reloading
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  // Reset when token changes (logout/login)
  useEffect(() => {
    if (!token) {
      fetchedRef.current = false
      setOrderSets([])
      setLoading(true)
    }
  }, [token])

  const saveOrderSet = useCallback(
    async (name: string, testIds: string[], tags: string[] = []): Promise<OrderSet | null> => {
      if (!token) return null
      try {
        const res = await createOrderSet(token, {
          name: name.trim(),
          tests: testIds,
          tags: tags.filter((t) => t.trim().length > 0),
        })
        setOrderSets((prev) => [...prev, res.item])
        return res.item
      } catch {
        return null
      }
    },
    [token],
  )

  const updateOrderSetFn = useCallback(
    async (id: string, data: { name?: string; tests?: string[]; tags?: string[] }) => {
      if (!token) return
      // Find existing to fill required fields
      const existing = orderSets.find((s) => s.id === id)
      if (!existing) return

      try {
        const res = await apiUpdateOrderSet(token, id, {
          name: data.name ?? existing.name,
          tests: data.tests ?? existing.tests,
          ...(data.tags !== undefined && { tags: data.tags }),
        })
        setOrderSets((prev) => prev.map((s) => (s.id === id ? res.item : s)))
      } catch {
        // Silently fail — optimistic UI could be added later
      }
    },
    [token, orderSets],
  )

  const deleteOrderSetFn = useCallback(
    async (id: string) => {
      if (!token) return
      // Optimistic removal
      setOrderSets((prev) => prev.filter((s) => s.id !== id))
      try {
        await apiDeleteOrderSet(token, id)
      } catch {
        // Re-fetch on failure to restore consistency
        try {
          const res = await getOrderSets(token)
          setOrderSets(res.items)
        } catch {
          // Give up — user can reload
        }
      }
    },
    [token],
  )

  const incrementUsage = useCallback(
    (id: string) => {
      if (!token) return
      // Optimistic update
      setOrderSets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s)),
      )
      // Fire-and-forget API call
      apiUseOrderSet(token, id).catch(() => {})
    },
    [token],
  )

  const suggestOrderSet = useCallback(
    (differentialText: string): OrderSet | null => {
      return findBestMatch(orderSets, differentialText)
    },
    [orderSets],
  )

  return {
    orderSets,
    loading,
    saveOrderSet,
    updateOrderSet: updateOrderSetFn,
    deleteOrderSet: deleteOrderSetFn,
    incrementUsage,
    suggestOrderSet,
  }
}
