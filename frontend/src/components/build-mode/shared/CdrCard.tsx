import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { CdrAnalysisItem, CdrTracking } from '../../../types/encounter'
import type { CdrDefinition, CdrComponent } from '../../../types/libraries'
import type { IdentifiedCdr } from './getIdentifiedCdrs'
import './CdrCard.css'

interface CdrCardProps {
  identifiedCdrs: IdentifiedCdr[]
  /** S1 LLM-generated CDR analysis (may be empty on older encounters) */
  cdrAnalysis?: CdrAnalysisItem[]
  /** CDR tracking state from encounter (for exclude toggles and inline edits) */
  cdrTracking?: CdrTracking
  /** Full CDR library (for inline component editing) */
  cdrLibrary?: CdrDefinition[]
  /** Deterministic CDR name → color map (single source of truth from EncounterEditor) */
  cdrColorMap?: Map<string, string>
  loading: boolean
  error?: string | null
  onViewCdrs?: () => void
  /** A4: Callback to toggle excluded flag on a CDR */
  onToggleExcluded?: (cdrId: string) => void
  /** A2: Callback when user answers a simple CDR component inline */
  onAnswerComponent?: (cdrId: string, componentId: string, value: number) => void
}

/**
 * Merge S1 LLM CDR analysis with client-side identified CDRs.
 * LLM analysis takes priority (richer data); client-side fills gaps.
 */
function getMergedCdrDisplay(
  cdrAnalysis: CdrAnalysisItem[],
  identifiedCdrs: IdentifiedCdr[],
): CdrAnalysisItem[] {
  if (cdrAnalysis.length > 0) {
    const analysisNames = new Set(cdrAnalysis.map((c) => c.name.toLowerCase()))
    const additionalFromLibrary: CdrAnalysisItem[] = identifiedCdrs
      .filter((ic) => !analysisNames.has(ic.cdr.name.toLowerCase()))
      .map((ic) => ({
        name: ic.cdr.name,
        applicable: true,
        missingData: ic.readiness === 'needs_results' ? ['Requires workup results'] : undefined,
        reasoning: `Identified from CDR library (${ic.readiness === 'completable' ? 'completable now' : 'needs results'})`,
      }))
    return [...cdrAnalysis, ...additionalFromLibrary]
  }

  return identifiedCdrs.map((ic) => ({
    name: ic.cdr.name,
    applicable: true,
    missingData: ic.readiness === 'needs_results' ? ['Requires workup results'] : undefined,
    reasoning:
      ic.readiness === 'completable'
        ? 'Completable with current data'
        : 'Needs lab/imaging results',
  }))
}

/**
 * Find the CDR definition that matches a display name.
 */
function findCdrDef(name: string, cdrLibrary: CdrDefinition[]): CdrDefinition | undefined {
  const lower = name.toLowerCase()
  return cdrLibrary.find(
    (c) => c.name.toLowerCase() === lower || c.fullName.toLowerCase() === lower,
  )
}

/**
 * Find the CDR tracking entry ID that matches a CDR definition or name.
 */
function findTrackingId(
  name: string,
  cdrTracking: CdrTracking,
  cdrLibrary: CdrDefinition[],
): string | undefined {
  const def = findCdrDef(name, cdrLibrary)
  if (def && cdrTracking[def.id]) return def.id
  for (const [id, entry] of Object.entries(cdrTracking)) {
    if (entry.name.toLowerCase() === name.toLowerCase()) return id
  }
  return undefined
}

/** CDR-level status for the three-category model */
type CdrStatusCategory = 'needs_data' | 'needs_history' | 'complete'

/** Per-component checkbox state */
type CheckboxState = 'solid_green' | 'outlined_yellow' | 'outlined_red'

/**
 * Determine the CDR-level status category based on its components.
 * - needs_data: ANY component with source=section2 is not answered
 * - needs_history: ANY component with source=section1/user_input is not answered (and no section2 gaps)
 * - complete: ALL components are answered
 */
function getCdrStatusCategory(
  item: CdrAnalysisItem,
  cdrDef: CdrDefinition | undefined,
  trackingEntry: CdrTracking[string] | undefined,
): CdrStatusCategory {
  // If we have a score, it's complete
  const score = trackingEntry?.score ?? item.score
  if (score != null) return 'complete'

  if (!cdrDef || cdrDef.components.length === 0) {
    // No component definitions -- fall back to missingData
    if (item.missingData && item.missingData.length > 0) return 'needs_data'
    return 'complete'
  }

  const hasUnansweredSection2 = cdrDef.components.some(
    (c) => c.source === 'section2' && !trackingEntry?.components[c.id]?.answered,
  )
  if (hasUnansweredSection2) return 'needs_data'

  const hasUnansweredOther = cdrDef.components.some(
    (c) => c.source !== 'section2' && !trackingEntry?.components[c.id]?.answered,
  )
  if (hasUnansweredOther) return 'needs_history'

  return 'complete'
}

/**
 * Get checkbox state for an individual CDR component.
 */
function getCheckboxState(
  comp: CdrComponent,
  trackingEntry: CdrTracking[string] | undefined,
  allComplete: boolean,
): CheckboxState {
  const isAnswered = trackingEntry?.components[comp.id]?.answered ?? false

  if (allComplete) return 'solid_green'
  if (isAnswered) return 'solid_green'
  if (comp.source === 'section2') return 'outlined_red'
  return 'outlined_yellow'
}

/**
 * Get display text for component status
 */
function getComponentStatusText(
  comp: CdrComponent,
  trackingEntry: CdrTracking[string] | undefined,
): string {
  const compState = trackingEntry?.components[comp.id]
  if (compState?.answered) {
    const val = compState.value
    if (comp.type === 'select' && comp.options) {
      const opt = comp.options.find((o) => o.value === val)
      if (opt) return `${val} pt (${opt.label})`
    }
    if (comp.type === 'boolean') {
      const pointWeight = comp.value ?? 1
      return val === pointWeight ? `${val} pt (Yes)` : '0 pt (No)'
    }
    return val != null ? `${val}` : 'answered'
  }
  if (comp.source === 'section2') return `needs ${comp.label}`
  return 'awaiting input'
}

interface StatusDisplay {
  text: string
  type: 'completable' | 'needs_data' | 'score'
}

function getStatusDisplay(
  item: CdrAnalysisItem,
  trackingEntry: CdrTracking[string] | undefined,
  cdrDef: CdrDefinition | undefined,
): StatusDisplay {
  const score = trackingEntry?.score ?? item.score
  const interpretation = trackingEntry?.interpretation ?? item.interpretation
  if (score != null) {
    const text = interpretation ? `${score} — ${interpretation}` : `${score}`
    return { text, type: 'score' }
  }

  const hasMissing = item.missingData && item.missingData.length > 0
  if (hasMissing) return { text: 'needs data', type: 'needs_data' }

  if (cdrDef) {
    const hasS2Deps = cdrDef.components.some((c) => c.source === 'section2')
    const allS2Answered = cdrDef.components
      .filter((c) => c.source === 'section2')
      .every((c) => trackingEntry?.components[c.id]?.answered)
    if (hasS2Deps && !allS2Answered) return { text: 'needs data', type: 'needs_data' }
  }

  return { text: 'completable', type: 'completable' }
}

const STATUS_LABELS: Record<CdrStatusCategory, string> = {
  needs_data: 'Needs Data',
  needs_history: 'Needs History',
  complete: 'Complete',
}

function CdrRow({
  item,
  index,
  isExpanded,
  onToggle,
  cdrDef,
  trackingEntry,
  trackingId,
  isExcluded,
  statusCategory,
  isPulsing,
  onToggleExcluded,
}: {
  item: CdrAnalysisItem
  index: number
  isExpanded: boolean
  onToggle: () => void
  cdrDef: CdrDefinition | undefined
  trackingEntry: CdrTracking[string] | undefined
  trackingId: string | undefined
  isExcluded: boolean
  statusCategory: CdrStatusCategory
  isPulsing: boolean
  onToggleExcluded?: (cdrId: string) => void
}) {
  const components = cdrDef?.components ?? []
  const allComplete =
    components.length > 0 && components.every((c) => trackingEntry?.components[c.id]?.answered)
  const status = getStatusDisplay(item, trackingEntry, cdrDef)

  // Pill text: name, or name + score when scored
  const pillText = status.type === 'score' ? `${item.name}: ${status.text}` : item.name

  return (
    <div className={`cdr-row cdr-row--${statusCategory}${isExcluded ? ' cdr-row--excluded' : ''}`}>
      <button
        className="cdr-row__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`cdr-details-${index}`}
        type="button"
      >
        {/* Exclude checkbox */}
        {onToggleExcluded && trackingId && (
          <input
            type="checkbox"
            className="cdr-row__exclude-checkbox"
            checked={!isExcluded}
            onChange={() => onToggleExcluded(trackingId)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${item.name}`}
            title={isExcluded ? 'Include in MDM' : 'Exclude from MDM'}
          />
        )}

        <span className={`cdr-row__dot cdr-row__dot--${statusCategory}`} aria-hidden="true" />
        <span className={`cdr-row__name${isPulsing ? ' cdr-row__name--pulse' : ''}`}>
          {pillText}
        </span>
        <span className={`cdr-row__label cdr-row__label--${statusCategory}`}>
          {STATUS_LABELS[statusCategory]}
        </span>
        <span
          className={`cdr-row__chevron ${isExpanded ? 'cdr-row__chevron--open' : ''}`}
          aria-hidden="true"
        >
          {isExpanded ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {isExpanded && (
        <div id={`cdr-details-${index}`} className="cdr-row__details">
          {/* Application description */}
          {cdrDef?.application && (
            <div className="cdr-row__detail-section">
              <span className="cdr-row__detail-label">Clinical Application:</span>
              <p className="cdr-row__detail-text">{cdrDef.application}</p>
            </div>
          )}

          {/* Post-calculation result significance */}
          {status.type === 'score' && (
            <div className="cdr-row__detail-section">
              <span className="cdr-row__detail-label">Result:</span>
              <p className="cdr-row__detail-text cdr-row__detail-text--result">{status.text}</p>
            </div>
          )}

          {/* Reasoning */}
          {item.reasoning && status.type !== 'score' && (
            <div className="cdr-row__detail-section">
              <span className="cdr-row__detail-label">Reasoning:</span>
              <p className="cdr-row__detail-text">{item.reasoning}</p>
            </div>
          )}

          {/* Component checklist — each item on its own line */}
          {components.length > 0 && (
            <div className="cdr-row__comp-list">
              <span className="cdr-row__detail-label">Data Points:</span>
              {components.map((comp) => {
                const checkboxState = getCheckboxState(comp, trackingEntry, allComplete)
                const statusText = getComponentStatusText(comp, trackingEntry)
                return (
                  <div key={comp.id} className="cdr-row__comp-item">
                    <span
                      className={`cdr-row__checkbox cdr-row__checkbox--${checkboxState}`}
                      aria-hidden="true"
                    />
                    <span className="cdr-row__comp-label">{comp.label}</span>
                    <span
                      className={`cdr-row__comp-status${trackingEntry?.components[comp.id]?.answered ? ' cdr-row__comp-status--answered' : ''}`}
                    >
                      {statusText}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CdrCard({
  identifiedCdrs,
  cdrAnalysis = [],
  cdrTracking = {},
  cdrLibrary = [],
  loading,
  error,
  onViewCdrs,
  onToggleExcluded,
}: CdrCardProps) {
  const mergedCdrs = useMemo(
    () => getMergedCdrDisplay(cdrAnalysis, identifiedCdrs),
    [cdrAnalysis, identifiedCdrs],
  )

  // Expand/collapse state
  const [expandedCdrs, setExpandedCdrs] = useState<Set<string>>(new Set())
  const toggleExpand = useCallback((cdrName: string) => {
    setExpandedCdrs((prev) => {
      const next = new Set(prev)
      if (next.has(cdrName)) next.delete(cdrName)
      else next.add(cdrName)
      return next
    })
  }, [])

  const allExpanded = expandedCdrs.size === mergedCdrs.length && mergedCdrs.length > 0
  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedCdrs(new Set())
    } else {
      setExpandedCdrs(new Set(mergedCdrs.map((c) => c.name)))
    }
  }, [allExpanded, mergedCdrs])

  // A3: Track previous scores for pulse animation
  const prevScoresRef = useRef<Record<string, number | null | undefined>>({})
  const [pulsing, setPulsing] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newPulsing = new Set<string>()
    for (const item of mergedCdrs) {
      const trackingId = findTrackingId(item.name, cdrTracking, cdrLibrary)
      const currentScore = trackingId ? cdrTracking[trackingId]?.score : item.score
      const prevScore = prevScoresRef.current[item.name]
      if (prevScore !== undefined && currentScore !== prevScore && currentScore != null) {
        newPulsing.add(item.name)
      }
      prevScoresRef.current[item.name] = currentScore ?? null
    }
    if (newPulsing.size > 0) {
      setPulsing(newPulsing)
      const timer = setTimeout(() => setPulsing(new Set()), 600)
      return () => clearTimeout(timer)
    }
  }, [mergedCdrs, cdrTracking, cdrLibrary])

  // Compute status categories for all CDRs
  const cdrStatuses = useMemo(() => {
    return mergedCdrs.map((item) => {
      const cdrDef = findCdrDef(item.name, cdrLibrary)
      const trackingId = findTrackingId(item.name, cdrTracking, cdrLibrary)
      const trackingEntry = trackingId ? cdrTracking[trackingId] : undefined
      return getCdrStatusCategory(item, cdrDef, trackingEntry)
    })
  }, [mergedCdrs, cdrLibrary, cdrTracking])

  // Count statuses for summary badges
  const needsDataCount = cdrStatuses.filter((s) => s === 'needs_data').length
  const needsHistoryCount = cdrStatuses.filter((s) => s === 'needs_history').length
  const completeCount = cdrStatuses.filter((s) => s === 'complete').length

  return (
    <div className="cdr-card" role="region" aria-label="Clinical Decision Rules">
      <div className="cdr-card__header">
        <h4 className="cdr-card__title">Clinical Decision Rules</h4>
        {!loading && mergedCdrs.length > 0 && (
          <button
            className="cdr-card__toggle-btn"
            onClick={toggleAll}
            type="button"
            aria-label={allExpanded ? 'Collapse all CDRs' : 'Expand all CDRs'}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* Status summary badges */}
      {!loading && mergedCdrs.length > 0 && (
        <div className="cdr-card__summary" role="status" aria-label="CDR status summary">
          <span
            className="cdr-card__badge cdr-card__badge--needs_data"
            aria-label={`${needsDataCount} CDRs need data`}
          >
            {needsDataCount} Needs Data
          </span>
          <span
            className="cdr-card__badge cdr-card__badge--needs_history"
            aria-label={`${needsHistoryCount} CDRs need history`}
          >
            {needsHistoryCount} Needs History
          </span>
          <span
            className="cdr-card__badge cdr-card__badge--complete"
            aria-label={`${completeCount} CDRs complete`}
          >
            {completeCount} Complete
          </span>
        </div>
      )}

      {loading ? (
        <p className="cdr-card__loading" role="status">
          Loading CDR library...
        </p>
      ) : error ? (
        <p className="cdr-card__error" role="alert">
          Unable to load CDR library
        </p>
      ) : mergedCdrs.length === 0 ? (
        <p className="cdr-card__empty">No CDRs identified for this differential</p>
      ) : (
        <div className="cdr-card__rows">
          {mergedCdrs.map((item, index) => {
            const trackingId = findTrackingId(item.name, cdrTracking, cdrLibrary)
            const trackingEntry = trackingId ? cdrTracking[trackingId] : undefined
            const isExcluded = trackingEntry?.excluded === true
            const cdrDef = findCdrDef(item.name, cdrLibrary)
            const statusCategory = cdrStatuses[index]

            return (
              <CdrRow
                key={item.name}
                item={item}
                index={index}
                isExpanded={expandedCdrs.has(item.name)}
                onToggle={() => toggleExpand(item.name)}
                cdrDef={cdrDef}
                trackingEntry={trackingEntry}
                trackingId={trackingId}
                isExcluded={isExcluded}
                statusCategory={statusCategory}
                isPulsing={pulsing.has(item.name)}
                onToggleExcluded={onToggleExcluded}
              />
            )
          })}
        </div>
      )}

      {!loading && mergedCdrs.length > 0 && (
        <button
          type="button"
          className="cdr-card__view-btn"
          onClick={onViewCdrs}
          disabled={!onViewCdrs}
          title={onViewCdrs ? undefined : 'Available after CDR matching completes'}
        >
          View CDRs
        </button>
      )}
    </div>
  )
}
