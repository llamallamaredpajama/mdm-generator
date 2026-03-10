import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { getAppDb, useAuth } from '../lib/firebase'
import type { GapBenefitCategory, GapAcquisitionMethod } from '../types/encounter'

// ============================================================================
// Types
// ============================================================================

interface GapMeta {
  category: GapBenefitCategory
  method: GapAcquisitionMethod
}

export interface GapAnalytics {
  // Raw data from Firestore
  totalTallies: Record<string, number>
  periodTallies: Record<string, Record<string, number>>
  meta: Record<string, GapMeta>

  // Computed
  periodLabels: string[]
  totalGapsByPeriod: number[]
  categoryBreakdown: { billing: number; medicolegal: number; care: number }
  methodBreakdown: { history: number; data_collection: number; clinical_action: number }
  topGaps: Array<{
    id: string
    count: number
    category: string
    method: string
    title?: string
  }>
  improvementRate: number | null

  loading: boolean
  error: string | null
}

// ============================================================================
// Hook
// ============================================================================

export function useGapAnalytics(): GapAnalytics {
  const db = getAppDb()
  const { user } = useAuth()

  const [totalTallies, setTotalTallies] = useState<Record<string, number>>({})
  const [periodTallies, setPeriodTallies] = useState<Record<string, Record<string, number>>>({})
  const [meta, setMeta] = useState<Record<string, GapMeta>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'customers', user.uid)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          const analytics = data.gapAnalytics
          if (analytics) {
            setTotalTallies(analytics.totalTallies ?? {})
            setPeriodTallies(analytics.periodTallies ?? {})
            setMeta(analytics.meta ?? {})
          } else {
            setTotalTallies({})
            setPeriodTallies({})
            setMeta({})
          }
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Gap analytics listener error:', err)
        setError('Failed to load analytics data')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [db, user])

  const periodLabels = useMemo(() => {
    return Object.keys(periodTallies).sort()
  }, [periodTallies])

  const totalGapsByPeriod = useMemo(() => {
    return periodLabels.map((period) => {
      const tallies = periodTallies[period] ?? {}
      return Object.values(tallies).reduce((sum, n) => sum + n, 0)
    })
  }, [periodLabels, periodTallies])

  const categoryBreakdown = useMemo(() => {
    const result = { billing: 0, medicolegal: 0, care: 0 }
    for (const [gapId, count] of Object.entries(totalTallies)) {
      const gapMeta = meta[gapId]
      if (gapMeta && gapMeta.category in result) {
        result[gapMeta.category as keyof typeof result] += count
      }
    }
    return result
  }, [totalTallies, meta])

  const methodBreakdown = useMemo(() => {
    const result = { history: 0, data_collection: 0, clinical_action: 0 }
    for (const [gapId, count] of Object.entries(totalTallies)) {
      const gapMeta = meta[gapId]
      if (gapMeta && gapMeta.method in result) {
        result[gapMeta.method as keyof typeof result] += count
      }
    }
    return result
  }, [totalTallies, meta])

  const topGaps = useMemo(() => {
    return Object.entries(totalTallies)
      .map(([id, count]) => ({
        id,
        count,
        category: meta[id]?.category ?? 'care',
        method: meta[id]?.method ?? 'history',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [totalTallies, meta])

  const improvementRate = useMemo(() => {
    if (periodLabels.length < 2) return null
    const current = totalGapsByPeriod[totalGapsByPeriod.length - 1]
    const previous = totalGapsByPeriod[totalGapsByPeriod.length - 2]
    if (previous === 0) return null
    return ((previous - current) / previous) * 100
  }, [periodLabels, totalGapsByPeriod])

  return {
    totalTallies,
    periodTallies,
    meta,
    periodLabels,
    totalGapsByPeriod,
    categoryBreakdown,
    methodBreakdown,
    topGaps,
    improvementRate,
    loading,
    error,
  }
}
