/**
 * RegionalTrendsCard Component
 *
 * Dashboard card displaying CDC surveillance trend data with
 * concise summary (top 3 findings) and expandable detail view.
 * Replaces the inline TrendsCard in DashboardOutput.
 */

import { useState } from 'react'
import type { TrendAnalysisResult } from '../../../types/surveillance'
import './RegionalTrendsCard.css'

interface RegionalTrendsCardProps {
  /** Trend analysis result data (null if unavailable or disabled) */
  analysis: TrendAnalysisResult | null
  /** Whether trend analysis is currently loading */
  isLoading?: boolean
  /** C2: Callback to open trend report modal */
  onOpenReport?: () => void
}

const TREND_ARROWS: Record<string, string> = {
  rising: '\u2191',
  falling: '\u2193',
  stable: '\u2192',
  unknown: '?',
}

const ALERT_ICONS: Record<string, string> = {
  critical: '\u26A0',
  warning: '\u26A1',
  info: '\u2139',
}

export default function RegionalTrendsCard({
  analysis,
  isLoading = false,
  onOpenReport,
}: RegionalTrendsCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className="regional-trends-card regional-trends-card--loading">
        <h4 className="regional-trends-card__title">Regional Trends</h4>
        <p className="regional-trends-card__loading-text">
          Analyzing regional surveillance data...
        </p>
      </div>
    )
  }

  if (!analysis || analysis.rankedFindings.length === 0) {
    if (analysis && analysis.rankedFindings.length === 0) {
      return (
        <div className="regional-trends-card regional-trends-card--empty">
          <h4 className="regional-trends-card__title">Regional Trends</h4>
          <p className="regional-trends-card__empty-text">
            No significant regional trends detected
          </p>
        </div>
      )
    }
    return null
  }

  const conciseFindings = analysis.rankedFindings.slice(0, 3)
  const allFindings = analysis.rankedFindings
  const hasMoreFindings = allFindings.length > 3
  const displayFindings = expanded ? allFindings : conciseFindings

  return (
    <div className="regional-trends-card">
      {/* Header */}
      <div className="regional-trends-card__header">
        <h4 className="regional-trends-card__title">Regional Trends</h4>
        <span className="regional-trends-card__region-badge">{analysis.regionLabel}</span>
      </div>

      {/* Findings */}
      <div className="regional-trends-card__findings">
        {displayFindings.map((finding, i) => (
          <div key={`${finding.condition}-${i}`} className="regional-trends-card__finding">
            <span
              className={`regional-trends-card__arrow regional-trends-card__arrow--${finding.trendDirection}`}
            >
              {TREND_ARROWS[finding.trendDirection] || '?'}
            </span>
            <span className="regional-trends-card__condition">{finding.condition}</span>
            <span className="regional-trends-card__summary">
              {' \u2014 '}
              {finding.summary}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded: Alerts */}
      {expanded && analysis.alerts.length > 0 && (
        <div className="regional-trends-card__alerts">
          {analysis.alerts.map((alert, i) => (
            <div
              key={`${alert.title}-${i}`}
              className={`regional-trends-card__alert regional-trends-card__alert--${alert.level}`}
              role="alert"
            >
              <span className="regional-trends-card__alert-icon">
                {ALERT_ICONS[alert.level] || '\u2139'}
              </span>
              <div className="regional-trends-card__alert-content">
                <strong>{alert.title}</strong>
                <p className="regional-trends-card__alert-desc">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: Attribution */}
      {expanded && (
        <footer className="regional-trends-card__footer">
          <p className="regional-trends-card__attribution">
            Data: {analysis.dataSourcesQueried.join(', ')} |{' '}
            {new Date(analysis.analyzedAt).toLocaleDateString()}
          </p>
          <p className="regional-trends-card__disclaimer">
            Surveillance data is supplementary. Clinical judgment must guide all decisions.
          </p>
        </footer>
      )}

      {/* Action buttons */}
      <div className="regional-trends-card__actions">
        {(hasMoreFindings || analysis.alerts.length > 0) && (
          <button
            type="button"
            className="regional-trends-card__toggle-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}
        {/* C2: Report button opens TrendReportModal */}
        {onOpenReport && (
          <button type="button" className="regional-trends-card__report-btn" onClick={onOpenReport}>
            Report
          </button>
        )}
      </div>
    </div>
  )
}
