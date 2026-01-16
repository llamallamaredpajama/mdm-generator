import { useEffect, useState, useMemo, useCallback } from 'react'
import type { Timestamp } from 'firebase/firestore'
import type { EncounterStatus } from '../types/encounter'

/**
 * Duration constants for shift window management
 */
const SHIFT_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
const EXPIRING_SOON_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour in milliseconds
const UPDATE_INTERVAL_MS = 60 * 1000 // Update every minute

/**
 * Return type for the useShiftWindow hook
 */
export interface ShiftWindowState {
  /** Time remaining in milliseconds (0 if expired) */
  timeRemaining: number
  /** Whether the 12h window has expired */
  isExpired: boolean
  /** Whether less than 1 hour remains (warning state) */
  isExpiringSoon: boolean
  /** Formatted time string (e.g., "8h 23m" or "Expired") */
  formattedTime: string
  /** Whether the encounter is in archived state */
  isArchived: boolean
}

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null

  // Handle Firestore Timestamp object
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  // Handle timestamp-like objects with seconds property
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000)
  }

  return null
}

/**
 * Calculate time remaining from a start time
 * @param startTime - The shift start time
 * @returns Time remaining in milliseconds (minimum 0)
 */
function calculateTimeRemaining(startTime: Date | null): number {
  if (!startTime) return 0

  const now = Date.now()
  const endTime = startTime.getTime() + SHIFT_DURATION_MS
  const remaining = endTime - now

  return Math.max(0, remaining)
}

/**
 * Format milliseconds into a human-readable time string
 * @param ms - Milliseconds remaining
 * @returns Formatted string (e.g., "8h 23m", "45m", or "Expired")
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired'

  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

/**
 * Hook for tracking 12-hour shift window for encounters
 *
 * @param shiftStartedAt - Firestore Timestamp when the shift/encounter started
 * @param status - Current encounter status (for archived state detection)
 * @returns ShiftWindowState with time tracking and status flags
 *
 * @example
 * ```tsx
 * const { timeRemaining, isExpired, isExpiringSoon, formattedTime } = useShiftWindow(
 *   encounter.shiftStartedAt,
 *   encounter.status
 * )
 *
 * if (isExpiringSoon) {
 *   showWarning('Less than 1 hour remaining!')
 * }
 * ```
 */
export function useShiftWindow(
  shiftStartedAt: Timestamp | null | undefined,
  status?: EncounterStatus
): ShiftWindowState {
  // Convert Timestamp to Date once
  const startDate = useMemo(
    () => timestampToDate(shiftStartedAt),
    [shiftStartedAt]
  )

  // State for time remaining (updated by interval)
  const [timeRemaining, setTimeRemaining] = useState<number>(() =>
    calculateTimeRemaining(startDate)
  )

  // Update time remaining on interval
  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(startDate))

    // Don't start interval if already expired or no start date
    const initialRemaining = calculateTimeRemaining(startDate)
    if (initialRemaining <= 0 || !startDate) {
      return
    }

    // Update every minute
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining(startDate)
      setTimeRemaining(remaining)

      // Clear interval if expired
      if (remaining <= 0) {
        clearInterval(intervalId)
      }
    }, UPDATE_INTERVAL_MS)

    // Cleanup on unmount or when startDate changes
    return () => {
      clearInterval(intervalId)
    }
  }, [startDate])

  // Derive status flags
  const isExpired = timeRemaining <= 0
  const isExpiringSoon = !isExpired && timeRemaining < EXPIRING_SOON_THRESHOLD_MS
  const isArchived = status === 'archived'

  // Format time for display
  const formattedTime = useMemo(() => {
    if (isArchived) return 'Archived'
    return formatTimeRemaining(timeRemaining)
  }, [timeRemaining, isArchived])

  return {
    timeRemaining,
    isExpired,
    isExpiringSoon,
    formattedTime,
    isArchived,
  }
}

/**
 * Hook to get a callback for manually refreshing the time remaining
 * Useful for immediate updates after certain actions
 */
export function useShiftWindowRefresh(
  shiftStartedAt: Timestamp | null | undefined
): () => number {
  const startDate = useMemo(
    () => timestampToDate(shiftStartedAt),
    [shiftStartedAt]
  )

  return useCallback(() => calculateTimeRemaining(startDate), [startDate])
}

/**
 * Helper to check if an encounter should transition to archived
 * Call this when checking if encounter should be auto-archived
 */
export function shouldArchiveEncounter(
  shiftStartedAt: Timestamp | null | undefined,
  currentStatus: EncounterStatus
): boolean {
  // Already archived or finalized
  if (currentStatus === 'archived' || currentStatus === 'finalized') {
    return false
  }

  const startDate = timestampToDate(shiftStartedAt)
  if (!startDate) return false

  const timeRemaining = calculateTimeRemaining(startDate)
  return timeRemaining <= 0
}
