/**
 * CdrDetailView Component
 *
 * Full CDR detail view showing all matched CDRs with interactive components.
 * Replaces DashboardOutput when user taps "View CDRs" from the CdrCard.
 *
 * Features:
 * - Scrollable list of matched CDRs
 * - Per-component inputs (select, boolean, pending)
 * - AI-populated value indicators
 * - Score calculation for completed CDRs
 * - Dismiss/undismiss with visual distinction
 * - Back navigation to dashboard
 */

import { useState, useEffect } from 'react'
import type { EncounterDocument, CdrTrackingEntry } from '../../../types/encounter'
import type { CdrDefinition } from '../../../types/libraries'
import { useCdrTracking } from '../../../hooks/useCdrTracking'
import CdrComponentInput from './CdrComponentInput'
import './CdrDetailView.css'

interface CdrDetailViewProps {
  /** The current encounter document */
  encounter: EncounterDocument
  /** Full CDR library definitions */
  cdrLibrary: CdrDefinition[]
  /** Callback to navigate back to dashboard */
  onBack: () => void
}

/**
 * Get a human-readable progress string for a CDR entry.
 */
function getProgress(entry: CdrTrackingEntry): string {
  const components = Object.values(entry.components)
  if (components.length === 0) return ''
  const answered = components.filter((c) => c.answered).length
  return `${answered}/${components.length} answered`
}

/**
 * Get CSS modifier class for CDR status.
 */
function getStatusModifier(entry: CdrTrackingEntry): string {
  if (entry.dismissed) return 'dismissed'
  return entry.status
}

export default function CdrDetailView({
  encounter,
  cdrLibrary,
  onBack,
}: CdrDetailViewProps) {
  const { tracking, answerComponent, dismissCdr, undismissCdr } = useCdrTracking(
    encounter.id,
    encounter.cdrTracking ?? {},
    cdrLibrary
  )

  // Track which CDRs are expanded (all expanded by default)
  const [expandedCdrs, setExpandedCdrs] = useState<Set<string>>(() => new Set(Object.keys(tracking)))

  // Auto-expand newly added CDRs (e.g., when onSnapshot delivers new cdrTracking entries)
  useEffect(() => {
    const trackingKeys = Object.keys(tracking)
    setExpandedCdrs((prev) => {
      const hasNewKeys = trackingKeys.some((k) => !prev.has(k))
      if (!hasNewKeys) return prev
      const next = new Set(prev)
      for (const k of trackingKeys) {
        if (!next.has(k)) next.add(k)
      }
      return next
    })
  }, [tracking])

  const toggleExpanded = (cdrId: string) => {
    setExpandedCdrs((prev) => {
      const next = new Set(prev)
      if (next.has(cdrId)) {
        next.delete(cdrId)
      } else {
        next.add(cdrId)
      }
      return next
    })
  }

  // Confirmation state for dismiss
  const [confirmingDismiss, setConfirmingDismiss] = useState<string | null>(null)

  const handleDismissClick = (cdrId: string) => {
    setConfirmingDismiss(cdrId)
  }

  const handleDismissConfirm = (cdrId: string) => {
    dismissCdr(cdrId)
    setConfirmingDismiss(null)
  }

  const handleDismissCancel = () => {
    setConfirmingDismiss(null)
  }

  // Build ordered list: active CDRs first, dismissed last
  const cdrEntries = Object.entries(tracking)
  const activeCdrs = cdrEntries.filter(([, entry]) => !entry.dismissed)
  const dismissedCdrs = cdrEntries.filter(([, entry]) => entry.dismissed)
  const orderedCdrs = [...activeCdrs, ...dismissedCdrs]

  // Find CDR definition by ID
  const getCdrDef = (cdrId: string): CdrDefinition | undefined =>
    cdrLibrary.find((c) => c.id === cdrId)

  if (orderedCdrs.length === 0) {
    return (
      <div className="cdr-detail-view">
        <header className="cdr-detail-view__header">
          <button type="button" className="cdr-detail-view__back-btn" onClick={onBack}>
            &larr; Back
          </button>
          <h3 className="cdr-detail-view__title">Clinical Decision Rules</h3>
        </header>
        <p className="cdr-detail-view__empty">No CDRs matched for this encounter</p>
      </div>
    )
  }

  return (
    <div className="cdr-detail-view">
      <header className="cdr-detail-view__header">
        <button type="button" className="cdr-detail-view__back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <h3 className="cdr-detail-view__title">Clinical Decision Rules</h3>
        <span className="cdr-detail-view__count">{activeCdrs.length} active</span>
      </header>

      <div className="cdr-detail-view__list">
        {orderedCdrs.map(([cdrId, entry]) => {
          const cdrDef = getCdrDef(cdrId)
          const isExpanded = expandedCdrs.has(cdrId) && !entry.dismissed
          const statusMod = getStatusModifier(entry)

          return (
            <div key={cdrId} className={`cdr-detail-view__card cdr-detail-view__card--${statusMod}`}>
              {/* Card Header */}
              <button
                type="button"
                className="cdr-detail-view__card-header"
                onClick={() => toggleExpanded(cdrId)}
                aria-expanded={isExpanded}
              >
                <div className="cdr-detail-view__card-title-row">
                  <span className={`cdr-detail-view__card-name ${entry.dismissed ? 'cdr-detail-view__card-name--dismissed' : ''}`}>
                    {entry.name}
                  </span>
                  <span className={`cdr-detail-view__status-badge cdr-detail-view__status-badge--${statusMod}`}>
                    {entry.dismissed ? 'Dismissed' : entry.status}
                  </span>
                </div>

                <div className="cdr-detail-view__card-meta">
                  {entry.status === 'completed' && entry.score != null && !entry.dismissed && (
                    <span className="cdr-detail-view__score">
                      Score: {entry.score}
                      {entry.interpretation && (
                        <span className="cdr-detail-view__interpretation"> &mdash; {entry.interpretation}</span>
                      )}
                    </span>
                  )}
                  {entry.status === 'partial' && !entry.dismissed && (
                    <span className="cdr-detail-view__progress">{getProgress(entry)}</span>
                  )}
                  <span className="cdr-detail-view__expand-icon" aria-hidden="true">
                    {isExpanded ? '\u25B2' : '\u25BC'}
                  </span>
                </div>
              </button>

              {/* Card Body: Component Inputs */}
              {isExpanded && cdrDef && (
                <div className="cdr-detail-view__card-body">
                  {cdrDef.components.map((comp) => (
                    <CdrComponentInput
                      key={comp.id}
                      component={comp}
                      state={entry.components[comp.id]}
                      onAnswer={(value) => answerComponent(cdrId, comp.id, value)}
                      disabled={entry.dismissed}
                    />
                  ))}
                </div>
              )}

              {/* Card Footer: Dismiss/Undismiss */}
              <div className="cdr-detail-view__card-footer">
                {entry.dismissed ? (
                  <button
                    type="button"
                    className="cdr-detail-view__undismiss-btn"
                    onClick={() => undismissCdr(cdrId)}
                  >
                    Restore CDR
                  </button>
                ) : confirmingDismiss === cdrId ? (
                  <div className="cdr-detail-view__dismiss-confirm">
                    <p className="cdr-detail-view__dismiss-warning">
                      Dismissing a CDR excludes it from your final MDM. This may affect documentation completeness.
                    </p>
                    <div className="cdr-detail-view__dismiss-actions">
                      <button
                        type="button"
                        className="cdr-detail-view__dismiss-yes"
                        onClick={() => handleDismissConfirm(cdrId)}
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className="cdr-detail-view__dismiss-no"
                        onClick={handleDismissCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cdr-detail-view__dismiss-btn"
                    onClick={() => handleDismissClick(cdrId)}
                  >
                    Dismiss CDR
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
