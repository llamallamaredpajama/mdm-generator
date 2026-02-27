/**
 * useOrderSets Hook
 *
 * localStorage-based CRUD for saved order sets.
 * Each order set captures a named collection of test IDs with optional
 * keyword tags for matching against differential presentations.
 */

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'mdm-order-sets'

export interface OrderSet {
  id: string
  name: string
  testIds: string[]
  tags: string[]
  usageCount: number
  createdAt: string
}

export interface UseOrderSetsReturn {
  orderSets: OrderSet[]
  saveOrderSet: (name: string, testIds: string[], tags?: string[]) => void
  deleteOrderSet: (id: string) => void
  incrementUsage: (id: string) => void
  suggestOrderSet: (differentialText: string) => OrderSet | null
}

function loadFromStorage(): OrderSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(sets: OrderSet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // Silently fail if localStorage is full/unavailable
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

    // Check tags
    for (const tag of set.tags) {
      if (lowerText.includes(tag.toLowerCase())) {
        score += 2 // Tags are weighted higher
      }
    }

    // Check name words
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

  // Require at least one match to suggest
  return bestScore > 0 ? bestMatch : null
}

export function useOrderSets(): UseOrderSetsReturn {
  const [orderSets, setOrderSets] = useState<OrderSet[]>(loadFromStorage)

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(orderSets)
  }, [orderSets])

  const saveOrderSet = useCallback((name: string, testIds: string[], tags: string[] = []) => {
    const newSet: OrderSet = {
      id: `os_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      testIds: [...testIds],
      tags: tags.filter((t) => t.trim().length > 0),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    }
    setOrderSets((prev) => [...prev, newSet])
  }, [])

  const deleteOrderSet = useCallback((id: string) => {
    setOrderSets((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const incrementUsage = useCallback((id: string) => {
    setOrderSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s))
    )
  }, [])

  const suggestOrderSet = useCallback(
    (differentialText: string): OrderSet | null => {
      return findBestMatch(orderSets, differentialText)
    },
    [orderSets]
  )

  return { orderSets, saveOrderSet, deleteOrderSet, incrementUsage, suggestOrderSet }
}
