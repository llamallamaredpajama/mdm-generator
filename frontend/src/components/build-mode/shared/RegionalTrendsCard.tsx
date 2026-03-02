/**
 * RegionalTrendsCard Component
 *
 * Dashboard card displaying CDC surveillance trend data with
 * concise summary (top 3 findings with incidence values) and
 * expandable detail view organized by data source.
 */

import { useState } from 'react'
import type { TrendAnalysisResult, DataSourceSummary } from '../../../types/surveillance'
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

/** CDC dataset URLs for each data source */
const SOURCE_URLS: Record<string, string> = {
  cdc_respiratory:
    'https://data.cdc.gov/Public-Health-Surveillance/Weekly-Hospital-Respiratory-Data-HRD-Metrics-by-Ju/mpgq-jmmr',
  cdc_wastewater:
    'https://data.cdc.gov/Public-Health-Surveillance/NWSS-Public-SARS-CoV-2-Wastewater-Metric-Data/2ew6-ywp6',
  cdc_nndss:
    'https://data.cdc.gov/NNDSS/NNDSS-TABLE-II-Invasive-pneumococcal-diseases-all-a/x9gk-5huc',
}

/** Status labels for data source display */
const STATUS_LABELS: Record<string, string> = {
  data: 'Data Available',
  no_data: 'No Activity',
  error: 'Unavailable',
  not_queried: 'Not Queried',
}

/**
 * Format an absolute value with its unit for concise clinical display.
 */
function formatIncidenceValue(value: number | undefined, unit: string | undefined): string | null {
  if (value == null || !unit) return null

  switch (unit) {
    case 'pct_inpatient_beds':
      return `${value.toFixed(1)}% beds`
    case 'wastewater_concentration':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M copies/L`
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K copies/L`
      return `${value.toFixed(0)} copies/L`
    case 'case_count':
      return `${value} cases/wk`
    default:
      return `${value} ${unit}`
  }
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
  const hasSourceSummaries = analysis.dataSourceSummaries && analysis.dataSourceSummaries.length > 0

  return (
    <div className="regional-trends-card">
      {/* Header */}
      <div className="regional-trends-card__header">
        <h4 className="regional-trends-card__title">Regional Trends</h4>
        <span className="regional-trends-card__region-badge">{analysis.regionLabel}</span>
      </div>

      {/* Findings */}
      <div className="regional-trends-card__findings">
        {displayFindings.map((finding, i) => {
          const incidence = formatIncidenceValue(finding.value, finding.unit)
          const magnitude =
            finding.trendMagnitude != null && finding.trendMagnitude > 0
              ? `${finding.trendDirection === 'falling' ? '-' : '+'}${finding.trendMagnitude}%`
              : null
          return (
            <div key={`${finding.condition}-${i}`} className="regional-trends-card__finding">
              <span
                className={`regional-trends-card__arrow regional-trends-card__arrow--${finding.trendDirection}`}
              >
                {TREND_ARROWS[finding.trendDirection] || '?'}
              </span>
              <span className="regional-trends-card__condition">{finding.condition}</span>
              {(incidence || magnitude) && (
                <span className="regional-trends-card__value">
                  {incidence && magnitude
                    ? `(${incidence}, ${magnitude})`
                    : incidence
                      ? `(${incidence})`
                      : `(${magnitude})`}
                </span>
              )}
              <span className="regional-trends-card__summary">
                {' \u2014 '}
                {finding.summary}
              </span>
            </div>
          )
        })}
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

      {/* Expanded: Data Sources */}
      {expanded && hasSourceSummaries && (
        <div className="regional-trends-card__sources">
          {analysis.dataSourceSummaries!.map((source) => (
            <DataSourceSection key={source.source} source={source} />
          ))}
        </div>
      )}

      {/* Expanded: Attribution (fallback when no source summaries) */}
      {expanded && !hasSourceSummaries && (
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

      {/* Expanded: Disclaimer (shown after source sections) */}
      {expanded && hasSourceSummaries && (
        <footer className="regional-trends-card__footer">
          <p className="regional-trends-card__attribution">
            Analyzed: {new Date(analysis.analyzedAt).toLocaleDateString()}
          </p>
          <p className="regional-trends-card__disclaimer">
            Surveillance data is supplementary. Clinical judgment must guide all decisions.
          </p>
        </footer>
      )}

      {/* Action buttons */}
      <div className="regional-trends-card__actions">
        {(hasMoreFindings || analysis.alerts.length > 0 || hasSourceSummaries) && (
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

/**
 * Renders a single data source section in the expanded view.
 */
function DataSourceSection({ source }: { source: DataSourceSummary }) {
  const sourceUrl = SOURCE_URLS[source.source]
  const statusLabel = STATUS_LABELS[source.status] || source.status

  return (
    <div className="regional-trends-card__source">
      <div className="regional-trends-card__source-header">
        <h5 className="regional-trends-card__source-name">{source.label}</h5>
        <span
          className={`regional-trends-card__source-status regional-trends-card__source-status--${source.status}`}
        >
          {statusLabel}
        </span>
      </div>

      {source.status === 'data' && source.highlights.length > 0 && (
        <ul className="regional-trends-card__source-highlights">
          {source.highlights.map((highlight, i) => (
            <li key={i} className="regional-trends-card__source-highlight">
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {source.status === 'no_data' && (
        <p className="regional-trends-card__source-empty">
          No significant activity detected for this presentation
        </p>
      )}

      {source.status === 'error' && (
        <p className="regional-trends-card__source-empty">
          Data could not be retrieved from this source
        </p>
      )}

      {source.status === 'not_queried' && (
        <p className="regional-trends-card__source-empty">
          Not queried — no relevant syndromes for this presentation
        </p>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="regional-trends-card__source-link"
        >
          View CDC dataset &#x2197;
        </a>
      )}
    </div>
  )
}
