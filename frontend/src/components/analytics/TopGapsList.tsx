/**
 * TopGapsList Component
 * Top 10 most frequent documentation gaps displayed as horizontal bar visualization.
 * Each row shows a frequency bar, gap title, category/method badges, and expandable tip.
 */

import { useState } from 'react'
import { getGapTip } from '../../data/gapTipsCatalog'
import './TopGapsList.css'

interface TopGapsListProps {
  topGaps: Array<{
    id: string
    count: number
    category: string
    method: string
    title?: string
  }>
}

const CATEGORY_COLORS: Record<string, string> = {
  billing: '#dc2626',
  medicolegal: '#d97706',
  care: '#16a34a',
}

const CATEGORY_LABELS: Record<string, string> = {
  billing: 'Billing',
  medicolegal: 'Medicolegal',
  care: 'Care',
}

const METHOD_COLORS: Record<string, string> = {
  history: '#6366f1',
  data_collection: '#0891b2',
  clinical_action: '#c026d3',
}

const METHOD_LABELS: Record<string, string> = {
  history: 'History',
  data_collection: 'Data Collection',
  clinical_action: 'Clinical Action',
}

function formatGapId(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function TopGapsList({ topGaps }: TopGapsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (topGaps.length === 0) {
    return (
      <div className="top-gaps-list">
        <h3 className="top-gaps-list__title">Top Documentation Gaps</h3>
        <div className="top-gaps-list__empty">No gaps recorded yet</div>
      </div>
    )
  }

  const maxCount = topGaps[0]?.count ?? 1

  return (
    <div className="top-gaps-list">
      <h3 className="top-gaps-list__title">Top Documentation Gaps</h3>
      <div className="top-gaps-list__items">
        {topGaps.map((gap) => {
          const tip = getGapTip(gap.id)
          const title = gap.title ?? tip.title ?? formatGapId(gap.id)
          const barWidth = maxCount > 0 ? (gap.count / maxCount) * 100 : 0
          const isExpanded = expandedId === gap.id
          const categoryColor = CATEGORY_COLORS[gap.category] ?? '#94a3b8'

          return (
            <div key={gap.id} className="top-gaps-list__item-wrapper">
              <button
                className={`top-gaps-list__item ${isExpanded ? 'top-gaps-list__item--expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : gap.id)}
                type="button"
              >
                <div className="top-gaps-list__bar-row">
                  <div className="top-gaps-list__bar-container">
                    <div
                      className="top-gaps-list__bar"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: categoryColor,
                      }}
                    />
                  </div>
                  <span className="top-gaps-list__count">{gap.count}</span>
                </div>
                <div className="top-gaps-list__info-row">
                  <span className="top-gaps-list__label">{title}</span>
                  <div className="top-gaps-list__badges">
                    <span
                      className="top-gaps-list__badge"
                      style={{
                        backgroundColor: `${categoryColor}22`,
                        color: categoryColor,
                        borderColor: `${categoryColor}44`,
                      }}
                    >
                      {CATEGORY_LABELS[gap.category] ?? gap.category}
                    </span>
                    <span
                      className="top-gaps-list__badge"
                      style={{
                        backgroundColor: `${METHOD_COLORS[gap.method] ?? '#94a3b8'}22`,
                        color: METHOD_COLORS[gap.method] ?? '#94a3b8',
                        borderColor: `${METHOD_COLORS[gap.method] ?? '#94a3b8'}44`,
                      }}
                    >
                      {METHOD_LABELS[gap.method] ?? gap.method}
                    </span>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="top-gaps-list__tip">
                  <p className="top-gaps-list__tip-text">{tip.tip}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
