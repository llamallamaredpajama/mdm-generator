/**
 * CdrDetailView Component
 *
 * Full CDR detail view showing all matched CDRs with interactive components.
 * Rendered as an overlay (popup) from DashboardOutput when user taps "View CDRs".
 *
 * Features:
 * - Scrollable list of matched CDRs
 * - Per-component inputs (select, boolean, pending)
 * - AI-populated value indicators
 * - Score calculation for completed CDRs
 * - Dismiss/undismiss with visual distinction
 * - Back navigation to dashboard
 * - Bug 1 fix: Falls back to identifiedCdrs/cdrAnalysis when cdrTracking is empty
 */

import { useState, useEffect, useMemo } from 'react'
import type { EncounterDocument, CdrTrackingEntry, CdrAnalysisItem } from '../../../types/encounter'
import type { CdrDefinition } from '../../../types/libraries'
import type { IdentifiedCdr } from './getIdentifiedCdrs'
import { useCdrTracking } from '../../../hooks/useCdrTracking'
import CdrComponentInput from './CdrComponentInput'
import './CdrDetailView.css'

interface CdrDetailViewProps {
  /** The current encounter document */
  encounter: EncounterDocument
  /** Full CDR library definitions */
  cdrLibrary: CdrDefinition[]
  /** Bug 1 fix: Client-side identified CDRs (fallback when cdrTracking is empty) */
  identifiedCdrs?: IdentifiedCdr[]
  /** Bug 1 fix: LLM CDR analysis (fallback when cdrTracking is empty) */
  cdrAnalysis?: CdrAnalysisItem[]
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

/**
 * Build a read-only display item from LLM CDR analysis or client-side identified CDRs.
 * Used as fallback when cdrTracking has no entries for the identified CDRs.
 */
interface FallbackCdrItem {
  id: string
  name: string
  reasoning: string
  missingData?: string[]
  score?: number | null
  interpretation?: string | null
  cdrDef?: CdrDefinition
}

function buildFallbackItems(
  identifiedCdrs: IdentifiedCdr[],
  cdrAnalysis: CdrAnalysisItem[],
  cdrLibrary: CdrDefinition[],
): FallbackCdrItem[] {
  const items = new Map<string, FallbackCdrItem>()

  // Start with LLM analysis (richer data)
  for (const analysis of cdrAnalysis) {
    if (!analysis.applicable) continue
    const cdrDef = cdrLibrary.find(
      (c) =>
        c.name.toLowerCase() === analysis.name.toLowerCase() ||
        c.fullName.toLowerCase() === analysis.name.toLowerCase(),
    )
    const id = cdrDef?.id ?? analysis.name.toLowerCase().replace(/\s+/g, '-')
    items.set(id, {
      id,
      name: analysis.name,
      reasoning: analysis.reasoning ?? 'Applicable to this presentation',
      missingData: analysis.missingData,
      score: analysis.score,
      interpretation: analysis.interpretation,
      cdrDef,
    })
  }

  // Add client-side identified CDRs that aren't already in the LLM analysis
  for (const ic of identifiedCdrs) {
    if (items.has(ic.cdr.id)) continue
    items.set(ic.cdr.id, {
      id: ic.cdr.id,
      name: ic.cdr.name,
      reasoning:
        ic.readiness === 'completable'
          ? 'Completable with current data'
          : 'Needs lab/imaging results',
      missingData: ic.readiness === 'needs_results' ? ['Requires workup results'] : undefined,
      cdrDef: ic.cdr,
    })
  }

  return Array.from(items.values())
}

export default function CdrDetailView({
  encounter,
  cdrLibrary,
  identifiedCdrs = [],
  cdrAnalysis = [],
  onBack,
}: CdrDetailViewProps) {
  const { tracking, answerComponent, dismissCdr, undismissCdr } = useCdrTracking(
    encounter.id,
    encounter.cdrTracking ?? {},
    cdrLibrary,
  )

  // Bug 1 fix: Build fallback items when tracking is empty
  const fallbackItems = useMemo(
    () => buildFallbackItems(identifiedCdrs, cdrAnalysis, cdrLibrary),
    [identifiedCdrs, cdrAnalysis, cdrLibrary],
  )

  const hasTrackingEntries = Object.keys(tracking).length > 0
  const useFallback = !hasTrackingEntries && fallbackItems.length > 0

  // Track which CDRs are expanded (all expanded by default)
  const allKeys = hasTrackingEntries ? Object.keys(tracking) : fallbackItems.map((item) => item.id)
  const [expandedCdrs, setExpandedCdrs] = useState<Set<string>>(() => new Set(allKeys))

  // Auto-expand newly added CDRs (e.g., when onSnapshot delivers new cdrTracking entries)
  useEffect(() => {
    const trackingKeys = hasTrackingEntries
      ? Object.keys(tracking)
      : fallbackItems.map((item) => item.id)
    setExpandedCdrs((prev) => {
      const hasNewKeys = trackingKeys.some((k) => !prev.has(k))
      if (!hasNewKeys) return prev
      const next = new Set(prev)
      for (const k of trackingKeys) {
        if (!next.has(k)) next.add(k)
      }
      return next
    })
  }, [tracking, hasTrackingEntries, fallbackItems])

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

  // Total active count (from tracking or fallback)
  const activeCount = hasTrackingEntries ? activeCdrs.length : fallbackItems.length

  if (orderedCdrs.length === 0 && !useFallback) {
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
        <span className="cdr-detail-view__count">{activeCount} active</span>
      </header>

      <div className="cdr-detail-view__list">
        {/* Render from tracking entries (interactive, with component inputs) */}
        {hasTrackingEntries &&
          orderedCdrs.map(([cdrId, entry]) => {
            const cdrDef = getCdrDef(cdrId)
            const isExpanded = expandedCdrs.has(cdrId) && !entry.dismissed
            const statusMod = getStatusModifier(entry)

            return (
              <div
                key={cdrId}
                className={`cdr-detail-view__card cdr-detail-view__card--${statusMod}`}
              >
                {/* Card Header */}
                <button
                  type="button"
                  className="cdr-detail-view__card-header"
                  onClick={() => toggleExpanded(cdrId)}
                  aria-expanded={isExpanded}
                >
                  <div className="cdr-detail-view__card-title-row">
                    <span
                      className={`cdr-detail-view__card-name ${entry.dismissed ? 'cdr-detail-view__card-name--dismissed' : ''}`}
                    >
                      {entry.name}
                    </span>
                    <span
                      className={`cdr-detail-view__status-badge cdr-detail-view__status-badge--${statusMod}`}
                    >
                      {entry.dismissed ? 'Dismissed' : entry.status}
                    </span>
                  </div>

                  <div className="cdr-detail-view__card-meta">
                    {entry.status === 'completed' && entry.score != null && !entry.dismissed && (
                      <span className="cdr-detail-view__score">
                        Score: {entry.score}
                        {entry.interpretation && (
                          <span className="cdr-detail-view__interpretation">
                            {' '}
                            &mdash; {entry.interpretation}
                          </span>
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
                        Dismissing a CDR excludes it from your final MDM. This may affect
                        documentation completeness.
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

        {/* Bug 1 fallback: Read-only CDR display from identified/analyzed CDRs */}
        {useFallback &&
          fallbackItems.map((item) => {
            const isExpanded = expandedCdrs.has(item.id)
            const hasScore = item.score != null
            const hasMissing = item.missingData && item.missingData.length > 0

            return (
              <div key={item.id} className="cdr-detail-view__card cdr-detail-view__card--pending">
                {/* Card Header */}
                <button
                  type="button"
                  className="cdr-detail-view__card-header"
                  onClick={() => toggleExpanded(item.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="cdr-detail-view__card-title-row">
                    <span className="cdr-detail-view__card-name">{item.name}</span>
                    <span className="cdr-detail-view__status-badge cdr-detail-view__status-badge--pending">
                      {hasScore ? 'scored' : hasMissing ? 'needs data' : 'identified'}
                    </span>
                  </div>

                  <div className="cdr-detail-view__card-meta">
                    {hasScore && (
                      <span className="cdr-detail-view__score">
                        Score: {item.score}
                        {item.interpretation && (
                          <span className="cdr-detail-view__interpretation">
                            {' '}
                            &mdash; {item.interpretation}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="cdr-detail-view__expand-icon" aria-hidden="true">
                      {isExpanded ? '\u25B2' : '\u25BC'}
                    </span>
                  </div>
                </button>

                {/* Card Body: Read-only info */}
                {isExpanded && (
                  <div className="cdr-detail-view__card-body">
                    <p className="cdr-detail-view__fallback-reasoning">{item.reasoning}</p>
                    {hasMissing && (
                      <p className="cdr-detail-view__fallback-missing">
                        Missing data: {item.missingData!.join(', ')}
                      </p>
                    )}
                    {item.cdrDef && (
                      <p className="cdr-detail-view__fallback-components">
                        Components: {item.cdrDef.components.map((c) => c.label).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
