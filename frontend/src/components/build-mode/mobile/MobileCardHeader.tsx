import type { EncounterDocument, EncounterMode } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
import { StatusBadge, QuickModeStatusBadge } from '../shared/CardContent'

/**
 * Extract age/sex label from encounter data for header display.
 * Quick mode: uses structured patientIdentifier (e.g., "24F")
 * Build mode: uses chiefComplaint as-is (user-entered identifier)
 */
function getAgeSexLabel(encounter: EncounterDocument, isQuickMode: boolean): string {
  if (isQuickMode) {
    // Quick mode: only show age/sex if AI has extracted it
    if (encounter.quickModeData?.patientIdentifier) {
      const { age, sex } = encounter.quickModeData.patientIdentifier
      const ageStr = age?.replace(/\s*(y\/o|years?(\s+old)?|yo)\s*/gi, '').trim() || ''
      const sexStr = sex?.charAt(0).toUpperCase() || ''
      return `${ageStr}${sexStr}`.trim()
    }
    return ''
  }
  // Build mode: chiefComplaint is user-entered identifier
  return encounter.chiefComplaint || ''
}

export interface MobileCardHeaderProps {
  /** The encounter to display */
  encounter: EncounterDocument
  /** Whether this card is currently expanded */
  isExpanded: boolean
  /** Handler for tap/click to toggle expansion */
  onTap: () => void
  /** Handler for delete action */
  onDelete?: () => void
  /** Mode context (quick or build) - defaults to encounter's actual mode */
  mode?: EncounterMode
}

/**
 * MobileCardHeader - Tappable header for Apple Wallet-style mobile cards
 *
 * Always visible (60px height) showing:
 * - Room number on left
 * - Status badge on right
 * - Expand/collapse chevron indicator
 *
 * Uses CSS classes from MobileWalletStack.css:
 * - .mobile-card__header for the container
 * - .mobile-card__room for room number
 * - .mobile-card__status for status area
 * - .mobile-card__expand-indicator for chevron
 *
 * Accessible: aria-expanded, proper button semantics, 44px min tap target
 */
export default function MobileCardHeader({
  encounter,
  isExpanded,
  onTap,
  onDelete,
  mode,
}: MobileCardHeaderProps) {
  const encounterMode = mode ?? getEncounterMode(encounter)
  const isQuickMode = encounterMode === 'quick'
  const quickStatus = encounter.quickModeData?.status || 'draft'
  const canDelete = encounter.status === 'draft' || encounter.status === 'archived'

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTap()
    }
  }

  return (
    <div
      className="mobile-card__header"
      onClick={onTap}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${encounter.roomNumber}: ${isQuickMode ? 'Quick encounter' : encounter.chiefComplaint || 'Encounter'}. ${isExpanded ? 'Collapse' : 'Expand'}`}
    >
      {/* Room + age/gender - left side */}
      <div className="mobile-card__header-left">
        <h3 className="mobile-card__room">{encounter.roomNumber}</h3>
        {(() => {
          const label = getAgeSexLabel(encounter, isQuickMode)
          return label ? (
            <span className="mobile-card__age-sex">{label}</span>
          ) : null
        })()}
      </div>

      {/* Status badge and delete - right side */}
      <div className="mobile-card__status">
        {isQuickMode ? (
          <QuickModeStatusBadge status={quickStatus} />
        ) : (
          <StatusBadge status={encounter.status} />
        )}

        {/* Delete button - visible when expanded */}
        {isExpanded && canDelete && onDelete && (
          <button
            type="button"
            className="mobile-card__header-delete"
            onClick={handleDelete}
            aria-label={`Delete encounter for ${encounter.roomNumber}`}
            title="Delete encounter"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
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
