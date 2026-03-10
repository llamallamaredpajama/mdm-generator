/**
 * ProTipsSection Component
 * Two-part section:
 * 1. Static tips for top gaps (all users)
 * 2. LLM-powered personalized insights (Pro+ only)
 */

import { useState, useCallback } from 'react'
import { getGapTip } from '../../data/gapTipsCatalog'
import { fetchAnalyticsInsights, ApiError } from '../../lib/api'
import './ProTipsSection.css'

interface ProTipsSectionProps {
  topGaps: Array<{
    id: string
    count: number
    category: string
    method: string
    title?: string
  }>
  userPlan: string
  authToken: string | null
}

const SESSION_KEY = 'analytics_insights'

export default function ProTipsSection({ topGaps, userPlan, authToken }: ProTipsSectionProps) {
  const [insights, setInsights] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  })
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null)

  const isPro = userPlan === 'pro' || userPlan === 'enterprise'

  // Show tips for top 3-5 gaps
  const tipsToShow = topGaps.slice(0, Math.min(topGaps.length, 5))

  const handleAnalyze = useCallback(async () => {
    if (!authToken) return
    setInsightsLoading(true)
    setInsightsError(null)
    setRetryAfterMs(null)

    try {
      const res = await fetchAnalyticsInsights(authToken)
      setInsights(res.insights)
      try {
        sessionStorage.setItem(SESSION_KEY, res.insights)
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        // Rate limited -- extract retryAfterMs from error if available
        setRetryAfterMs(60_000) // Default 1 min
        setInsightsError('Rate limited. Please try again shortly.')
      } else if (err instanceof Error) {
        setInsightsError(err.message)
      } else {
        setInsightsError('Failed to load insights. Please try again.')
      }
    } finally {
      setInsightsLoading(false)
    }
  }, [authToken])

  const retryMinutes = retryAfterMs ? Math.ceil(retryAfterMs / 60_000) : null

  return (
    <div className="pro-tips-section">
      {/* Static Tips */}
      {tipsToShow.length > 0 && (
        <div className="pro-tips-section__static-tips">
          <h3 className="pro-tips-section__title">Improvement Tips</h3>
          <div className="pro-tips-section__tip-cards">
            {tipsToShow.map((gap) => {
              const tip = getGapTip(gap.id)
              const title = gap.title ?? tip.title
              return (
                <div key={gap.id} className="pro-tips-section__tip-card">
                  <h4 className="pro-tips-section__tip-title">{title}</h4>
                  <p className="pro-tips-section__tip-text">{tip.tip}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LLM Insights */}
      <div className="pro-tips-section__insights">
        <h3 className="pro-tips-section__title">Personalized Insights</h3>

        {!isPro && (
          <div className="pro-tips-section__upgrade">
            <button
              className="pro-tips-section__analyze-btn pro-tips-section__analyze-btn--disabled"
              disabled
              type="button"
            >
              Analyze My Patterns
            </button>
            <p className="pro-tips-section__upgrade-text">
              Upgrade to Pro for personalized insights based on your documentation patterns.
            </p>
          </div>
        )}

        {isPro && !insights && (
          <div className="pro-tips-section__action">
            <button
              className="pro-tips-section__analyze-btn"
              onClick={handleAnalyze}
              disabled={insightsLoading || !authToken}
              type="button"
            >
              {insightsLoading ? (
                <span className="pro-tips-section__spinner" />
              ) : retryMinutes ? (
                `Available in ${retryMinutes} min`
              ) : (
                'Analyze My Patterns'
              )}
            </button>
            {insightsError && <p className="pro-tips-section__error">{insightsError}</p>}
          </div>
        )}

        {isPro && insights && (
          <div className="pro-tips-section__insights-content">
            <div className="pro-tips-section__insights-text">{insights}</div>
            <button
              className="pro-tips-section__refresh-btn"
              onClick={handleAnalyze}
              disabled={insightsLoading}
              type="button"
            >
              {insightsLoading ? 'Refreshing...' : 'Refresh Insights'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
