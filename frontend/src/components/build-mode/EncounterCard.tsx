import type { EncounterDocument, EncounterStatus, SectionStatus } from '../../types/encounter'
import './EncounterCard.css'

interface EncounterCardProps {
  encounter: EncounterDocument
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Section indicator component showing progress through 3 sections
 * ● active, ○ pending, ✓ complete
 */
function SectionIndicators({ encounter }: { encounter: EncounterDocument }) {
  const getSectionIndicator = (
    sectionStatus: SectionStatus,
    sectionNumber: 1 | 2 | 3,
    currentSection: number
  ) => {
    if (sectionStatus === 'completed') {
      return <span className="section-indicator section-complete" title={`Section ${sectionNumber} complete`}>✓</span>
    }
    if (sectionNumber === currentSection && sectionStatus === 'in_progress') {
      return <span className="section-indicator section-active" title={`Section ${sectionNumber} in progress`}>●</span>
    }
    return <span className="section-indicator section-pending" title={`Section ${sectionNumber} pending`}>○</span>
  }

  return (
    <div className="section-indicators">
      {getSectionIndicator(encounter.section1.status, 1, encounter.currentSection)}
      {getSectionIndicator(encounter.section2.status, 2, encounter.currentSection)}
      {getSectionIndicator(encounter.section3.status, 3, encounter.currentSection)}
    </div>
  )
}

/**
 * Status badge showing overall encounter status
 */
function StatusBadge({ status }: { status: EncounterStatus }) {
  const getStatusLabel = (status: EncounterStatus): string => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'section1_done':
        return 'Section 1 Done'
      case 'section2_done':
        return 'Section 2 Done'
      case 'finalized':
        return 'Finalized'
      case 'archived':
        return 'Archived'
      default:
        return status
    }
  }

  return (
    <span className={`status-badge status-${status}`}>
      {getStatusLabel(status)}
    </span>
  )
}

/**
 * Individual encounter card displaying summary info
 * Used in the EncounterDashboard grid
 */
export default function EncounterCard({ encounter, onSelect, onDelete }: EncounterCardProps) {
  const isArchived = encounter.status === 'archived'
  const canDelete = encounter.status === 'draft' || encounter.status === 'archived'

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onSelect
    onDelete(encounter.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(encounter.id)
    }
  }

  return (
    <div
      className={`encounter-card ${isArchived ? 'encounter-card-archived' : ''}`}
      onClick={() => onSelect(encounter.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${encounter.roomNumber}: ${encounter.chiefComplaint}`}
    >
      <div className="encounter-card-header">
        <h3 className="encounter-room">{encounter.roomNumber}</h3>
        <StatusBadge status={encounter.status} />
      </div>

      <p className="encounter-complaint">{encounter.chiefComplaint}</p>

      <div className="encounter-card-footer">
        <SectionIndicators encounter={encounter} />

        {canDelete && (
          <button
            className="delete-button"
            onClick={handleDelete}
            aria-label={`Delete encounter for ${encounter.roomNumber}`}
            title="Delete encounter"
          >
            <svg
              className="delete-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
