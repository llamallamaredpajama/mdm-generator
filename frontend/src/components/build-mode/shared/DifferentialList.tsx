/**
 * DifferentialList Component
 *
 * Displays the differential diagnosis as collapsible rows with urgency color dots,
 * text labels, and expandable detail sections showing reasoning, CDR context,
 * and regional surveillance context.
 *
 * Design: color dot + text label pattern (replaces badge-only approach from DifferentialPreview)
 */

import { useState, useCallback } from 'react'
import type { DifferentialItem, UrgencyLevel } from '../../../types/encounter'
import './DifferentialList.css'

interface DifferentialListProps {
  differential: DifferentialItem[]
}

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  emergent: 'Emergent',
  urgent: 'Urgent',
  routine: 'Routine',
}

function DifferentialRow({
  item,
  index,
  isExpanded,
  onToggle,
}: {
  item: DifferentialItem
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`diff-row diff-row--${item.urgency}`}>
      <button
        className="diff-row__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`diff-details-${index}`}
        type="button"
      >
        <span className={`diff-row__dot diff-row__dot--${item.urgency}`} aria-hidden="true" />
        <span className="diff-row__diagnosis">{item.diagnosis}</span>
        <span className={`diff-row__label diff-row__label--${item.urgency}`}>
          {URGENCY_LABELS[item.urgency]}
        </span>
        <span className={`diff-row__chevron ${isExpanded ? 'diff-row__chevron--open' : ''}`} aria-hidden="true">
          &#x25B8;
        </span>
      </button>

      {isExpanded && (
        <div id={`diff-details-${index}`} className="diff-row__details">
          <div className="diff-row__detail-section">
            <span className="diff-row__detail-label">Clinical Reasoning:</span>
            <p className="diff-row__detail-text">{item.reasoning}</p>
          </div>

          {item.cdrContext && (
            <div className="diff-row__detail-section">
              <span className="diff-row__detail-label">CDR Association:</span>
              <p className="diff-row__detail-text">{item.cdrContext}</p>
            </div>
          )}

          {item.regionalContext && (
            <div className="diff-row__detail-section">
              <span className="diff-row__detail-label">Regional Context:</span>
              <p className="diff-row__detail-text">{item.regionalContext}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DifferentialList({ differential }: DifferentialListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = useCallback((index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const allExpanded = expandedItems.size === differential.length
  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedItems(new Set())
    } else {
      setExpandedItems(new Set(differential.map((_, i) => i)))
    }
  }, [allExpanded, differential])

  const emergentCount = differential.filter((d) => d.urgency === 'emergent').length
  const urgentCount = differential.filter((d) => d.urgency === 'urgent').length
  const routineCount = differential.filter((d) => d.urgency === 'routine').length

  return (
    <div className="diff-list" role="region" aria-label="Differential Diagnosis">
      <div className="diff-list__header">
        <h4 className="diff-list__title">Differential Diagnosis</h4>
        <button
          className="diff-list__toggle-btn"
          onClick={toggleAll}
          type="button"
          aria-label={allExpanded ? 'Collapse all diagnoses' : 'Expand all diagnoses'}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="diff-list__summary" role="status" aria-label="Diagnosis urgency summary">
        {emergentCount > 0 && (
          <span className="diff-list__badge diff-list__badge--emergent" aria-label={`${emergentCount} emergent diagnoses`}>
            {emergentCount} emergent
          </span>
        )}
        {urgentCount > 0 && (
          <span className="diff-list__badge diff-list__badge--urgent" aria-label={`${urgentCount} urgent diagnoses`}>
            {urgentCount} urgent
          </span>
        )}
        {routineCount > 0 && (
          <span className="diff-list__badge diff-list__badge--routine" aria-label={`${routineCount} routine diagnoses`}>
            {routineCount} routine
          </span>
        )}
      </div>

      <div className="diff-list__rows">
        {differential.map((item, index) => (
          <DifferentialRow
            key={`${item.diagnosis}-${index}`}
            item={item}
            index={index}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      <p className="diff-list__note">
        Listed in worst-first order based on clinical presentation
      </p>
    </div>
  )
}
