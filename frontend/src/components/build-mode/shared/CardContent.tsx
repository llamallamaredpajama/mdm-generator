import type {
  EncounterDocument,
  EncounterStatus,
  SectionStatus,
  EncounterMode,
  QuickModeStatus,
  Section1Data,
  Section2Data,
  Section3Data,
} from '../../../types/encounter'
import { getQuickModeCardLabel, getEncounterMode, formatRoomDisplay } from '../../../types/encounter'
import './CardContent.css'

export interface CardContentProps {
  /** The encounter to display */
  encounter: EncounterDocument
  /** Mode context (quick or build) - defaults to encounter's actual mode */
  mode?: EncounterMode
  /** Whether to show section progress indicators (build mode only) */
  showSectionIndicators?: boolean
  /** Compact display for collapsed/summary views */
  compact?: boolean
  /** Hide the header row (room + status) — used when parent already renders its own header */
  hideHeader?: boolean
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
      return (
        <span
          className="card-content__section card-content__section--complete"
          title={`Section ${sectionNumber} complete`}
        >
          ✓
        </span>
      )
    }
    if (sectionNumber === currentSection && sectionStatus === 'in_progress') {
      return (
        <span
          className="card-content__section card-content__section--active"
          title={`Section ${sectionNumber} in progress`}
        >
          ●
        </span>
      )
    }
    return (
      <span
        className="card-content__section card-content__section--pending"
        title={`Section ${sectionNumber} pending`}
      >
        ○
      </span>
    )
  }

  return (
    <div className="card-content__sections">
      {getSectionIndicator(encounter.section1.status, 1, encounter.currentSection)}
      {getSectionIndicator(encounter.section2.status, 2, encounter.currentSection)}
      {getSectionIndicator(encounter.section3.status, 3, encounter.currentSection)}
    </div>
  )
}

/**
 * Status badge showing overall encounter status (Build Mode - legacy)
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
    <span className={`card-content__status card-content__status--${status}`}>
      {getStatusLabel(status)}
    </span>
  )
}

/**
 * Build mode status indicator: 3 numbered circles (1, 2, 3).
 * Circles turn green as each section is completed by AI processing.
 * When all 3 are done, shows a green "Done" badge instead.
 */
function BuildModeStatusCircles({ encounter }: { encounter: EncounterDocument }) {
  const sections = [encounter.section1, encounter.section2, encounter.section3] as Array<
    Section1Data | Section2Data | Section3Data
  >
  const allComplete = sections.every((s) => s.status === 'completed')

  if (allComplete || encounter.status === 'finalized') {
    return (
      <span className="card-content__status card-content__status--finalized">
        Done
      </span>
    )
  }

  return (
    <div className="card-content__step-circles">
      {sections.map((section, i) => {
        const num = i + 1
        const isComplete = section.status === 'completed'
        return (
          <span
            key={num}
            className={`card-content__step-circle ${isComplete ? 'card-content__step-circle--complete' : 'card-content__step-circle--pending'}`}
            title={`Section ${num}${isComplete ? ' complete' : ''}`}
          >
            {num}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Quick mode status badge with appropriate styling
 */
function QuickModeStatusBadge({ status }: { status: QuickModeStatus }) {
  const getStatusConfig = (
    status: QuickModeStatus
  ): { label: string; className: string } => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', className: 'draft' }
      case 'processing':
        return { label: 'Processing...', className: 'processing' }
      case 'completed':
        return { label: 'Done', className: 'finalized' }
      case 'error':
        return { label: 'Error', className: 'error' }
      default:
        return { label: status, className: 'draft' }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span className={`card-content__status card-content__status--${config.className}`}>
      {status === 'processing' && (
        <span className="card-content__spinner" aria-hidden="true" />
      )}
      {config.label}
    </span>
  )
}

/**
 * Quick mode indicator icon (lightning bolt)
 */
function QuickModeIndicator() {
  return (
    <div className="card-content__mode-indicator" title="Quick Compose">
      <svg
        className="card-content__mode-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </div>
  )
}

/**
 * CardContent - Reusable card body for encounter display
 *
 * Layout-agnostic component that renders:
 * - Header: room number (left) + status badge (right)
 * - Body: chief complaint with optional line clamping
 * - Section indicators (build mode only, when showSectionIndicators=true)
 * - Quick mode indicator (quick mode only)
 *
 * NO positioning styles - parent component controls layout.
 */
export default function CardContent({
  encounter,
  mode,
  showSectionIndicators = true,
  compact = false,
  hideHeader = false,
}: CardContentProps) {
  const encounterMode = mode ?? getEncounterMode(encounter)
  const isQuickMode = encounterMode === 'quick'
  const quickStatus = encounter.quickModeData?.status || 'draft'

  // For quick mode completed state, show the extracted label
  const displayText = isQuickMode && quickStatus === 'completed'
    ? getQuickModeCardLabel(encounter)
    : encounter.chiefComplaint

  const contentClasses = [
    'card-content',
    `card-content--mode-${encounterMode}`,
    compact && 'card-content--compact',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={contentClasses}>
      {/* Header: Room + Status */}
      {!hideHeader && (
        <div className="card-content__header">
          <h3 className="card-content__room">{formatRoomDisplay(encounter.roomNumber)}</h3>
          {isQuickMode ? (
            <QuickModeStatusBadge status={quickStatus} />
          ) : (
            <BuildModeStatusCircles encounter={encounter} />
          )}
        </div>
      )}

      {/* Body: Chief Complaint / Quick Mode Label */}
      <p
        className={[
          'card-content__complaint',
          isQuickMode && 'card-content__complaint--quick',
          compact && 'card-content__complaint--compact',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {displayText || (isQuickMode ? 'Quick Encounter' : 'No chief complaint')}
      </p>

      {/* Footer: Section indicators or Quick mode indicator */}
      <div className="card-content__footer">
        {/* Section indicators for build mode only */}
        {!isQuickMode && showSectionIndicators && (
          <SectionIndicators encounter={encounter} />
        )}

        {/* Quick mode indicator icon */}
        {isQuickMode && <QuickModeIndicator />}
      </div>
    </div>
  )
}

/**
 * Export sub-components for flexible composition
 */
export { SectionIndicators, StatusBadge, BuildModeStatusCircles, QuickModeStatusBadge, QuickModeIndicator }
