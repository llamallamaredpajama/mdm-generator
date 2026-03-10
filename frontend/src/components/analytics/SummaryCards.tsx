/**
 * SummaryCards Component
 * Displays 4 summary metric cards for the Analytics Dashboard:
 * Total Encounters, Most Common Gap, Improvement Rate, Quota Usage.
 */

import './SummaryCards.css'

interface SummaryCardsProps {
  encountersThisPeriod: number
  quotaUsed: number
  quotaMax: number
  topGap: { id: string; count: number; title?: string } | null
  improvementRate: number | null
}

export default function SummaryCards({
  encountersThisPeriod,
  quotaUsed,
  quotaMax,
  topGap,
  improvementRate,
}: SummaryCardsProps) {
  const quotaPercent = quotaMax > 0 ? Math.min((quotaUsed / quotaMax) * 100, 100) : 0

  return (
    <div className="summary-cards">
      {/* Total Encounters */}
      <div className="summary-cards__card">
        <span className="summary-cards__label">Total Encounters</span>
        <span className="summary-cards__value">{encountersThisPeriod}</span>
      </div>

      {/* Most Common Gap */}
      <div className="summary-cards__card">
        <span className="summary-cards__label">Most Common Gap</span>
        <span className="summary-cards__value summary-cards__value--small">
          {topGap ? (topGap.title ?? topGap.id) : 'None'}
        </span>
        {topGap && <span className="summary-cards__detail">{topGap.count} occurrences</span>}
      </div>

      {/* Improvement Rate */}
      <div className="summary-cards__card">
        <span className="summary-cards__label">Improvement Rate</span>
        <span className="summary-cards__value">
          {improvementRate !== null
            ? `${improvementRate > 0 ? '' : ''}${Math.round(improvementRate)}% fewer gaps`
            : 'N/A'}
        </span>
      </div>

      {/* Quota Usage */}
      <div className="summary-cards__card">
        <span className="summary-cards__label">Quota Usage</span>
        <span className="summary-cards__value">
          {quotaUsed} / {quotaMax}
        </span>
        <div className="summary-cards__progress-bar">
          <div className="summary-cards__progress-fill" style={{ width: `${quotaPercent}%` }} />
        </div>
      </div>
    </div>
  )
}
