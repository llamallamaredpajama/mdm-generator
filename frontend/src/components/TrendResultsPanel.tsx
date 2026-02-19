/**
 * TrendResultsPanel Component
 * Displays surveillance trend analysis results with alert banners,
 * ranked findings, and PDF download.
 */

import type { TrendAnalysisResult, TrendFinding, SurveillanceAlert } from '../types/surveillance'
import type { TrendAnalysisError } from '../hooks/useTrendAnalysis'
import './TrendResultsPanel.css'

interface TrendResultsPanelProps {
  /** Analysis results to display */
  analysis: TrendAnalysisResult | null
  /** Loading state */
  isLoading?: boolean
  /** Error state from analysis */
  error?: TrendAnalysisError | null
  /** Whether to show PDF download button */
  showPdfDownload?: boolean
  /** Callback for PDF download */
  onDownloadPdf?: () => void
  /** Callback for retry */
  onRetry?: () => void
}

const TREND_ARROWS: Record<string, string> = {
  rising: '↑',
  falling: '↓',
  stable: '→',
  unknown: '?',
}

const TIER_CLASSES: Record<string, string> = {
  high: 'trend-finding--high',
  moderate: 'trend-finding--moderate',
  low: 'trend-finding--low',
  background: 'trend-finding--background',
}

function AlertBanner({ alert }: { alert: SurveillanceAlert }) {
  return (
    <div className={`trend-alert trend-alert--${alert.level}`} role="alert">
      <span className="trend-alert__icon">
        {alert.level === 'critical' ? '⚠' : alert.level === 'warning' ? '⚡' : 'ℹ'}
      </span>
      <div className="trend-alert__content">
        <strong className="trend-alert__title">{alert.title}</strong>
        <p className="trend-alert__description">{alert.description}</p>
      </div>
    </div>
  )
}

function FindingRow({ finding }: { finding: TrendFinding }) {
  return (
    <div className={`trend-finding ${TIER_CLASSES[finding.tier] || ''}`}>
      <div className="trend-finding__header">
        <span className="trend-finding__condition">{finding.condition}</span>
        <div className="trend-finding__meta">
          <span className={`trend-finding__arrow trend-finding__arrow--${finding.trendDirection}`}>
            {TREND_ARROWS[finding.trendDirection]}
          </span>
          <span className={`trend-finding__badge trend-finding__badge--${finding.tier}`}>
            {finding.tier}
          </span>
        </div>
      </div>
      <p className="trend-finding__summary">{finding.summary}</p>
    </div>
  )
}

export default function TrendResultsPanel({
  analysis,
  isLoading = false,
  error,
  showPdfDownload = false,
  onDownloadPdf,
  onRetry,
}: TrendResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="trend-results trend-results--loading">
        <div className="trend-results__header">
          <h4 className="trend-results__title">Regional Trend Analysis</h4>
        </div>
        <div className="trend-results__loading">
          <div className="trend-results__spinner" />
          <span>Analyzing regional surveillance data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="trend-results trend-results--error">
        <div className="trend-results__header">
          <h4 className="trend-results__title">Regional Trend Analysis</h4>
        </div>
        <div className="trend-results__error-content" role="alert">
          {error.upgradeRequired ? (
            <>
              <p className="trend-results__error-message">
                Standalone trend analysis requires a Pro or Enterprise plan.
              </p>
              <p className="trend-results__error-note">
                Regional surveillance data is still used to enrich your MDM output automatically.
              </p>
            </>
          ) : (
            <>
              <p className="trend-results__error-message">{error.message}</p>
              {error.isRetryable && onRetry && (
                <button
                  type="button"
                  className="trend-results__retry-btn"
                  onClick={onRetry}
                >
                  Try Again
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  if (!analysis || analysis.rankedFindings.length === 0) {
    return null // Don't render if no results
  }

  return (
    <div className="trend-results">
      <div className="trend-results__header">
        <h4 className="trend-results__title">Regional Trend Analysis</h4>
        <span className="trend-results__region">{analysis.regionLabel}</span>
        {showPdfDownload && onDownloadPdf && (
          <button
            type="button"
            className="trend-results__pdf-btn"
            onClick={onDownloadPdf}
            aria-label="Download PDF report"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDF
          </button>
        )}
      </div>

      {/* Alert banners */}
      {analysis.alerts.length > 0 && (
        <div className="trend-results__alerts">
          {analysis.alerts.map((alert, i) => (
            <AlertBanner key={`${alert.title}-${i}`} alert={alert} />
          ))}
        </div>
      )}

      {/* Ranked findings */}
      <div className="trend-results__findings">
        {analysis.rankedFindings.map((finding, i) => (
          <FindingRow key={`${finding.condition}-${i}`} finding={finding} />
        ))}
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="trend-results__summary">
          <p>{analysis.summary}</p>
        </div>
      )}

      {/* Data attribution footer */}
      <footer className="trend-results__footer">
        <p className="trend-results__attribution">
          Data: {analysis.dataSourcesQueried.join(', ')} | {new Date(analysis.analyzedAt).toLocaleDateString()}
        </p>
        <p className="trend-results__disclaimer">
          Surveillance data is supplementary. Clinical judgment must guide all decisions.
        </p>
      </footer>
    </div>
  )
}
