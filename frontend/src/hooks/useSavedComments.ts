/**
 * useSavedComments Hook
 *
 * D5: localStorage-backed CRUD for saved comment templates per test category.
 * For workup items needing interpretation (EKG, imaging, POC ultrasound),
 * users can save and reuse comment templates.
 *
 * Follows the useOrderSets / useDispoFlows persistence pattern.
 */

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'mdm-saved-comments'

export interface SavedComment {
  id: string
  /** Test ID this comment is associated with (e.g., "ecg", "ct_head") */
  testId: string
  /** Human-readable label */
  name: string
  /** The comment text template */
  text: string
  /** Optional default result status when applying */
  defaultStatus?: 'unremarkable' | 'abnormal'
  /** Usage count for sorting */
  usageCount: number
  createdAt: string
}

export interface UseSavedCommentsReturn {
  /** All saved comments */
  comments: SavedComment[]
  /** Get comments for a specific test ID */
  getCommentsForTest: (testId: string) => SavedComment[]
  /** Save a new comment template */
  saveComment: (
    testId: string,
    name: string,
    text: string,
    defaultStatus?: 'unremarkable' | 'abnormal',
  ) => void
  /** Delete a comment by ID */
  deleteComment: (id: string) => void
  /** Increment usage count (for sorting by most-used) */
  incrementUsage: (id: string) => void
}

function loadFromStorage(): SavedComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(comments: SavedComment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
  } catch {
    // Silently fail if localStorage is full/unavailable
  }
}

export function useSavedComments(): UseSavedCommentsReturn {
  const [comments, setComments] = useState<SavedComment[]>(loadFromStorage)

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(comments)
  }, [comments])

  // Handle cross-tab sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setComments(loadFromStorage())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const getCommentsForTest = useCallback(
    (testId: string): SavedComment[] => {
      return comments.filter((c) => c.testId === testId).sort((a, b) => b.usageCount - a.usageCount)
    },
    [comments],
  )

  const saveComment = useCallback(
    (testId: string, name: string, text: string, defaultStatus?: 'unremarkable' | 'abnormal') => {
      const newComment: SavedComment = {
        id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        testId,
        name: name.trim(),
        text: text.trim(),
        defaultStatus,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      }
      setComments((prev) => [...prev, newComment])
    },
    [],
  )

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const incrementUsage = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, usageCount: c.usageCount + 1 } : c)),
    )
  }, [])

  return {
    comments,
    getCommentsForTest,
    saveComment,
    deleteComment,
    incrementUsage,
  }
}
