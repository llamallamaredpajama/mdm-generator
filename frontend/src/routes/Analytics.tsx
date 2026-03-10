/**
 * Analytics Page
 * Full dashboard showing documentation gap patterns, trends, and improvement tips.
 */

import { useState, useEffect } from 'react'
import { useGapAnalytics } from '../hooks/useGapAnalytics'
import { useAuth, useAuthToken } from '../lib/firebase'
import { useIsMobile } from '../hooks/useMediaQuery'
import { whoAmI } from '../lib/api'
import SummaryCards from '../components/analytics/SummaryCards'
import GapTrendChart from '../components/analytics/GapTrendChart'
import CategoryBreakdownChart from '../components/analytics/CategoryBreakdownChart'
import MethodBreakdownChart from '../components/analytics/MethodBreakdownChart'
import TopGapsList from '../components/analytics/TopGapsList'
import ProTipsSection from '../components/analytics/ProTipsSection'
import './Analytics.css'

export default function Analytics() {
  const { user } = useAuth()
  const authToken = useAuthToken()
  const analytics = useGapAnalytics()
  const isMobile = useIsMobile()
  const [periodFilter, setPeriodFilter] = useState<'3mo' | '6mo' | 'all'>('6mo')

  // Fetch user plan + quota from whoami
  const [userPlan, setUserPlan] = useState<string>('free')
  const [quotaUsed, setQuotaUsed] = useState(0)
  const [quotaMax, setQuotaMax] = useState(10)

  useEffect(() => {
    if (!authToken) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await whoAmI(authToken)
        if (!cancelled) {
          setUserPlan(res.plan)
          setQuotaUsed(res.used)
          setQuotaMax(res.limit)
        }
      } catch {
        // Defaults are fine on failure
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authToken])

  const { loading, error, topGaps } = analytics

  // Loading state
  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-page__header">
          <h1 className="analytics-page__title">Analytics</h1>
          <p className="analytics-page__subtitle">
            Documentation gap patterns and improvement trends
          </p>
        </div>
        <div className="analytics-page__loading">Loading analytics data...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-page__header">
          <h1 className="analytics-page__title">Analytics</h1>
          <p className="analytics-page__subtitle">
            Documentation gap patterns and improvement trends
          </p>
        </div>
        <div className="analytics-page__error">{error}</div>
      </div>
    )
  }

  // Empty state
  if (!user || topGaps.length === 0) {
    return (
      <div className="analytics-page">
        <div className="analytics-page__header">
          <h1 className="analytics-page__title">Analytics</h1>
          <p className="analytics-page__subtitle">
            Documentation gap patterns and improvement trends
          </p>
        </div>
        <div className="analytics-page__empty">
          <h2 className="analytics-page__empty-title">No data yet</h2>
          <p className="analytics-page__empty-text">
            Complete encounters with the Enhancement Advisor to start tracking documentation gaps.
          </p>
        </div>
      </div>
    )
  }

  const totalEncounters = analytics.totalGapsByPeriod.reduce((s, n) => s + n, 0)
  const periodLabels: Array<{ key: '3mo' | '6mo' | 'all'; label: string }> = [
    { key: '3mo', label: '3 Months' },
    { key: '6mo', label: '6 Months' },
    { key: 'all', label: 'All Time' },
  ]

  return (
    <div className="analytics-page">
      <div className="analytics-page__header">
        <h1 className="analytics-page__title">Analytics</h1>
        <p className="analytics-page__subtitle">
          Documentation gap patterns and improvement trends
        </p>
      </div>

      <SummaryCards
        encountersThisPeriod={totalEncounters}
        quotaUsed={quotaUsed}
        quotaMax={quotaMax}
        topGap={topGaps[0] ?? null}
        improvementRate={analytics.improvementRate}
      />

      <div className="analytics-page__period-filter">
        {periodLabels.map((p) => (
          <button
            key={p.key}
            className={`analytics-page__filter-btn ${periodFilter === p.key ? 'analytics-page__filter-btn--active' : ''}`}
            onClick={() => setPeriodFilter(p.key)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className={`analytics-page__charts-grid ${isMobile ? 'analytics-page__charts-grid--mobile' : ''}`}
      >
        <GapTrendChart
          periodLabels={analytics.periodLabels}
          periodTallies={analytics.periodTallies}
          meta={analytics.meta}
          periodFilter={periodFilter}
        />
        <CategoryBreakdownChart categoryBreakdown={analytics.categoryBreakdown} />
        <MethodBreakdownChart methodBreakdown={analytics.methodBreakdown} />
      </div>

      <TopGapsList topGaps={analytics.topGaps} />

      <ProTipsSection topGaps={analytics.topGaps} userPlan={userPlan} authToken={authToken} />
    </div>
  )
}
