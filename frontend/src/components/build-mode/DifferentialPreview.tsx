/**
 * @deprecated Replaced by DashboardOutput + DifferentialList in BM-2.1.
 * Kept for CSS pattern reference. Safe to delete after cleanup pass.
 *
 * DifferentialPreview Component
 *
 * Displays the differential diagnosis list generated from Section 1.
 * Shows diagnoses ordered by urgency (worst-first) with visual indicators.
 */

import { useState } from 'react'
import type { DifferentialItem, UrgencyLevel } from '../../types/encounter'
import './DifferentialPreview.css'

interface DifferentialPreviewProps {
  /** Array of differential diagnosis items from LLM */
  differential: DifferentialItem[]
  /** Whether the component is in a loading state */
  isLoading?: boolean
}

/**
 * Get CSS class for urgency level styling
 */
const getUrgencyClass = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case 'emergent':
      return 'urgency-emergent'
    case 'urgent':
      return 'urgency-urgent'
    case 'routine':
      return 'urgency-routine'
    default:
      return ''
  }
}

/**
 * Get display label for urgency level
 */
const getUrgencyLabel = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case 'emergent':
      return 'Emergent'
    case 'urgent':
      return 'Urgent'
    case 'routine':
      return 'Routine'
    default:
      return urgency
  }
}

/**
 * Individual differential item with expandable details
 */
function DifferentialItemRow({
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
    <div className={`differential-item ${getUrgencyClass(item.urgency)}`}>
      <button
        className="differential-item-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`differential-details-${index}`}
      >
        <div className="differential-item-main">
          <span className="differential-rank">{index + 1}.</span>
          <span className="differential-diagnosis">{item.diagnosis}</span>
        </div>
        <div className="differential-item-meta">
          <span className={`urgency-badge ${getUrgencyClass(item.urgency)}`}>
            {getUrgencyLabel(item.urgency)}
          </span>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          id={`differential-details-${index}`}
          className="differential-item-details"
        >
          <div className="reasoning-label">Clinical Reasoning:</div>
          <p className="reasoning-text">{item.reasoning}</p>
        </div>
      )}
    </div>
  )
}

/**
 * DifferentialPreview - Displays worst-first differential diagnosis
 */
export function DifferentialPreview({
  differential,
  isLoading = false,
}: DifferentialPreviewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedItems(new Set(differential.map((_, i) => i)))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  if (isLoading) {
    return (
      <div className="differential-preview differential-preview-loading">
        <div className="differential-header">
          <h4 className="differential-title">Differential Diagnosis</h4>
        </div>
        <div className="differential-loading">
          <div className="loading-spinner" />
          <span>Generating differential...</span>
        </div>
      </div>
    )
  }

  if (!differential || differential.length === 0) {
    return (
      <div className="differential-preview differential-preview-empty">
        <div className="differential-header">
          <h4 className="differential-title">Differential Diagnosis</h4>
        </div>
        <p className="differential-empty-message">
          Submit Section 1 to generate a worst-first differential diagnosis.
        </p>
      </div>
    )
  }

  // Count by urgency
  const emergentCount = differential.filter((d) => d.urgency === 'emergent').length
  const urgentCount = differential.filter((d) => d.urgency === 'urgent').length
  const routineCount = differential.filter((d) => d.urgency === 'routine').length

  return (
    <div className="differential-preview">
      <div className="differential-header">
        <h4 className="differential-title">Differential Diagnosis</h4>
        <div className="differential-actions">
          <button
            className="expand-collapse-btn"
            onClick={expandedItems.size > 0 ? collapseAll : expandAll}
          >
            {expandedItems.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      <div className="urgency-summary">
        {emergentCount > 0 && (
          <span className="urgency-count urgency-emergent">
            {emergentCount} emergent
          </span>
        )}
        {urgentCount > 0 && (
          <span className="urgency-count urgency-urgent">
            {urgentCount} urgent
          </span>
        )}
        {routineCount > 0 && (
          <span className="urgency-count urgency-routine">
            {routineCount} routine
          </span>
        )}
      </div>

      <div className="differential-list">
        {differential.map((item, index) => (
          <DifferentialItemRow
            key={`${item.diagnosis}-${index}`}
            item={item}
            index={index}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      <div className="differential-footer">
        <p className="worst-first-note">
          Listed in worst-first order based on clinical presentation
        </p>
      </div>
    </div>
  )
}

export default DifferentialPreview
