/**
 * useDispoFlows Hook
 *
 * Manages saved disposition flows in localStorage.
 * A flow captures a common disposition + follow-up combination
 * for one-tap application in Section 3.
 */

import { useState, useCallback, useEffect } from 'react'
import type { DispositionOption } from '../types/encounter'

const STORAGE_KEY = 'mdm-dispo-flows'

export interface DispoFlow {
  id: string
  name: string
  disposition: DispositionOption
  followUp: string[]
}

export interface UseDispoFlowsReturn {
  flows: DispoFlow[]
  saveFlow: (name: string, disposition: DispositionOption, followUp: string[]) => DispoFlow
  deleteFlow: (id: string) => void
}

function loadFlows(): DispoFlow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function persistFlows(flows: DispoFlow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
  } catch {
    // Silently fail if localStorage is full/unavailable
  }
}

export function useDispoFlows(): UseDispoFlowsReturn {
  const [flows, setFlows] = useState<DispoFlow[]>(() => loadFlows())

  // Sync from localStorage on mount (handles cross-tab changes)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFlows(loadFlows())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const saveFlow = useCallback(
    (name: string, disposition: DispositionOption, followUp: string[]): DispoFlow => {
      const flow: DispoFlow = {
        id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        disposition,
        followUp,
      }
      setFlows((prev) => {
        const updated = [...prev, flow]
        persistFlows(updated)
        return updated
      })
      return flow
    },
    []
  )

  const deleteFlow = useCallback((id: string) => {
    setFlows((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      persistFlows(updated)
      return updated
    })
  }, [])

  return { flows, saveFlow, deleteFlow }
}
