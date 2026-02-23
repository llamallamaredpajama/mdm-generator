/**
 * MdmPreviewPanel Component
 *
 * Displays the MDM preview generated from Section 2.
 * Shows accumulated information: problems, differential, data reviewed, and reasoning.
 */

import { useState } from 'react'
import type { MdmPreview } from '../../types/encounter'
import './MdmPreviewPanel.css'

interface MdmPreviewPanelProps {
  /** MDM preview data from LLM */
  mdmPreview: MdmPreview | null
  /** Whether the component is in a loading state */
  isLoading?: boolean
}

interface SectionItem {
  id: keyof MdmPreview
  title: string
  icon: string
}

/**
 * Normalize a MdmPreview field value to a display string.
 * The backend schema uses z.any() for problems/differential/dataReviewed,
 * so the LLM may return strings, arrays, or nested objects.
 */
function normalizeToString(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'string'
          ? item
          : typeof item === 'object' && item !== null && 'diagnosis' in item
            ? (item as { diagnosis: string }).diagnosis
            : JSON.stringify(item)
      )
      .join('\n')
  }
  if (value == null) return ''
  return String(value)
}

const SECTIONS: SectionItem[] = [
  { id: 'problems', title: 'Problems Addressed', icon: '!' },
  { id: 'differential', title: 'Differential Diagnosis', icon: '?' },
  { id: 'dataReviewed', title: 'Data Reviewed', icon: 'D' },
  { id: 'reasoning', title: 'Clinical Reasoning', icon: 'R' },
]

/**
 * Collapsible section within the MDM preview
 */
function PreviewSection({
  title,
  icon,
  content,
  isExpanded,
  onToggle,
  sectionId,
}: {
  title: string
  icon: string
  content: string
  isExpanded: boolean
  onToggle: () => void
  sectionId: string
}) {
  // Check if content is empty or placeholder
  const hasContent = content && content.trim().length > 0

  return (
    <div className={`mdm-section ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="mdm-section-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`mdm-section-${sectionId}`}
      >
        <div className="mdm-section-title">
          <span className="section-icon">{icon}</span>
          <span className="section-label">{title}</span>
        </div>
        <span className={`section-toggle ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div id={`mdm-section-${sectionId}`} className="mdm-section-content">
          {hasContent ? (
            <div className="section-text">{content}</div>
          ) : (
            <div className="section-empty">No content available</div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * MdmPreviewPanel - Displays accumulated MDM information
 */
export function MdmPreviewPanel({
  mdmPreview,
  isLoading = false,
}: MdmPreviewPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['problems', 'differential', 'dataReviewed', 'reasoning'])
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(SECTIONS.map((s) => s.id)))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  if (isLoading) {
    return (
      <div className="mdm-preview-panel mdm-preview-loading">
        <div className="mdm-preview-header">
          <h4 className="mdm-preview-title">MDM Preview</h4>
        </div>
        <div className="mdm-loading">
          <div className="loading-spinner" />
          <span>Generating MDM preview...</span>
        </div>
      </div>
    )
  }

  if (!mdmPreview) {
    return (
      <div className="mdm-preview-panel mdm-preview-empty">
        <div className="mdm-preview-header">
          <h4 className="mdm-preview-title">MDM Preview</h4>
        </div>
        <p className="mdm-empty-message">
          Complete Section 2 to see an MDM preview with accumulated clinical information.
        </p>
      </div>
    )
  }

  return (
    <div className="mdm-preview-panel">
      <div className="mdm-preview-header">
        <h4 className="mdm-preview-title">MDM Preview</h4>
        <div className="mdm-preview-actions">
          <button
            className="expand-collapse-btn"
            onClick={expandedSections.size > 0 ? collapseAll : expandAll}
          >
            {expandedSections.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      <div className="mdm-preview-notice">
        <span className="notice-icon">i</span>
        <span className="notice-text">
          This preview shows accumulated information from Sections 1 and 2
        </span>
      </div>

      <div className="mdm-sections">
        {SECTIONS.map((section) => (
          <PreviewSection
            key={section.id}
            title={section.title}
            icon={section.icon}
            content={normalizeToString(mdmPreview[section.id])}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            sectionId={section.id}
          />
        ))}
      </div>

      <div className="mdm-preview-footer">
        <p className="preview-note">
          Complete Section 3 to generate your final MDM documentation
        </p>
      </div>
    </div>
  )
}

export default MdmPreviewPanel
