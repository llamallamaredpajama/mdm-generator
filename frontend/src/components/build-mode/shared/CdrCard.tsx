import { useState, useRef, useEffect, useMemo } from 'react'
import type { CdrAnalysisItem, CdrTracking } from '../../../types/encounter'
import type { CdrDefinition, CdrComponent } from '../../../types/libraries'
import type { IdentifiedCdr } from './getIdentifiedCdrs'
import { buildCdrColorMap } from './cdrColorPalette'
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

/**
 * Parse hex color to RGB and compute relative luminance for contrast detection.
 */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

type SquareColor = 'empty' | 'answered' | 'complete' | 'excluded'

function getProgressSquareColor(
  comp: CdrComponent,
  trackingEntry: { components: Record<string, { answered: boolean }> } | undefined,
  allComplete: boolean,
  excluded: boolean,
): SquareColor {
  if (excluded) return 'excluded'
  const isAnswered = trackingEntry?.components[comp.id]?.answered ?? false
  if (!isAnswered) return 'empty'
  return allComplete ? 'complete' : 'answered'
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
  // Check for score (from tracking or LLM analysis)
  const score = trackingEntry?.score ?? item.score
  const interpretation = trackingEntry?.interpretation ?? item.interpretation
  if (score != null) {
    const text = interpretation ? `${score} — ${interpretation}` : `${score}`
    return { text, type: 'score' }
  }

  // Check if any component needs section2 data
  const hasMissing = item.missingData && item.missingData.length > 0
  if (hasMissing) return { text: 'needs data', type: 'needs_data' }

  // Check components for section2 dependencies
  if (cdrDef) {
    const hasS2Deps = cdrDef.components.some((c) => c.source === 'section2')
    const allS2Answered = cdrDef.components
      .filter((c) => c.source === 'section2')
      .every((c) => trackingEntry?.components[c.id]?.answered)
    if (hasS2Deps && !allS2Answered) return { text: 'needs data', type: 'needs_data' }
  }

  return { text: 'completable', type: 'completable' }
}

function getComponentStatusText(
  comp: CdrComponent,
  trackingEntry: CdrTracking[string] | undefined,
): string {
  const compState = trackingEntry?.components[comp.id]
  if (compState?.answered) {
    const val = compState.value
    // For select components, find the matching option label
    if (comp.type === 'select' && comp.options) {
      const opt = comp.options.find((o) => o.value === val)
      if (opt) return `${val} pt (${opt.label})`
    }
    // For boolean, show yes/no
    if (comp.type === 'boolean') {
      const pointWeight = comp.value ?? 1
      return val === pointWeight ? `${val} pt (Yes)` : '0 pt (No)'
    }
    return val != null ? `${val}` : 'answered'
  }
  // Unanswered
  if (comp.source === 'section2') return `needs ${comp.label}`
  return 'awaiting input'
}

type CompSquareColor = 'red' | 'yellow' | 'green'

function getCompSquareColor(
  comp: CdrComponent,
  trackingEntry: CdrTracking[string] | undefined,
  allComplete: boolean,
): CompSquareColor {
  const isAnswered = trackingEntry?.components[comp.id]?.answered ?? false
  if (!isAnswered) return 'red'
  return allComplete ? 'green' : 'yellow'
}

export default function CdrCard({
  identifiedCdrs,
  cdrAnalysis = [],
  cdrTracking = {},
  cdrLibrary = [],
  cdrColorMap: externalColorMap,
  loading,
  error,
  onViewCdrs,
  onToggleExcluded,
}: CdrCardProps) {
  const mergedCdrs = useMemo(
    () => getMergedCdrDisplay(cdrAnalysis, identifiedCdrs),
    [cdrAnalysis, identifiedCdrs],
  )

  const colorMap = useMemo(() => {
    if (externalColorMap) return externalColorMap
    return buildCdrColorMap(mergedCdrs.map((c) => c.name))
  }, [externalColorMap, mergedCdrs])

  // Expand/collapse state
  const [expandedCdrs, setExpandedCdrs] = useState<Set<string>>(new Set())
  const toggleExpand = (cdrName: string) => {
    setExpandedCdrs((prev) => {
      const next = new Set(prev)
      if (next.has(cdrName)) next.delete(cdrName)
      else next.add(cdrName)
      return next
    })
  }

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

  return (
    <div className="cdr-card" role="region" aria-label="Clinical Decision Rules">
      <div className="cdr-card__header">
        <h4 className="cdr-card__title">Clinical Decision Rules</h4>
        {!loading && mergedCdrs.length > 0 && (
          <span
            className="cdr-card__badge"
            aria-label={`${mergedCdrs.length} clinical decision rules identified`}
          >
            {mergedCdrs.length} identified
          </span>
        )}
      </div>

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
        <ul className="cdr-card__list" aria-label="Identified clinical decision rules">
          {mergedCdrs.map((item) => {
            const trackingId = findTrackingId(item.name, cdrTracking, cdrLibrary)
            const trackingEntry = trackingId ? cdrTracking[trackingId] : undefined
            const isExcluded = trackingEntry?.excluded === true
            const cdrDef = findCdrDef(item.name, cdrLibrary)
            const cdrColor = colorMap.get(item.name.toLowerCase()) ?? '#6b7280'
            const isExpanded = expandedCdrs.has(item.name)
            const components = cdrDef?.components ?? []

            // All components answered?
            const allComplete =
              components.length > 0 &&
              components.every((c) => trackingEntry?.components[c.id]?.answered)

            const status = getStatusDisplay(item, trackingEntry, cdrDef)
            const isPulsing = pulsing.has(item.name)

            // Pill text: name, or name + score when scored
            const pillText = status.type === 'score' ? `${item.name}: ${status.text}` : item.name

            const pillBg = isExcluded ? '#e5e7eb' : cdrColor
            const pillTextColor = isExcluded
              ? '#9ca3af'
              : isLightColor(cdrColor)
                ? '#1f2937'
                : '#ffffff'

            return (
              <li
                key={item.name}
                className={`cdr-card__item${isExcluded ? ' cdr-card__row--excluded' : ''}`}
              >
                {/* Title row */}
                <div
                  className="cdr-card__row"
                  onClick={() => toggleExpand(item.name)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleExpand(item.name)
                    }
                  }}
                >
                  {/* Checkbox */}
                  {onToggleExcluded && trackingId && (
                    <input
                      type="checkbox"
                      className="cdr-card__checkbox"
                      checked={!isExcluded}
                      onChange={() => onToggleExcluded(trackingId)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${item.name}`}
                      title={isExcluded ? 'Include in MDM' : 'Exclude from MDM'}
                    />
                  )}

                  {/* Colored pill */}
                  <span
                    className={`cdr-card__pill${isPulsing ? ' cdr-card__pill--pulse' : ''}`}
                    style={{ backgroundColor: pillBg, color: pillTextColor }}
                  >
                    {pillText}
                  </span>

                  {/* Progress bar */}
                  {components.length > 0 && (
                    <span
                      className="cdr-card__progress"
                      aria-label={`${components.filter((c) => trackingEntry?.components[c.id]?.answered).length} of ${components.length} components answered`}
                    >
                      {components.map((comp) => {
                        const sq = getProgressSquareColor(
                          comp,
                          trackingEntry,
                          allComplete,
                          isExcluded,
                        )
                        return (
                          <span
                            key={comp.id}
                            className={`cdr-card__progress-square cdr-card__progress-square--${sq}`}
                            title={comp.label}
                          />
                        )
                      })}
                    </span>
                  )}

                  {/* Status label (only when not scored — score is in pill) */}
                  {status.type !== 'score' && (
                    <span className={`cdr-card__status cdr-card__status--${status.type}`}>
                      {status.text}
                    </span>
                  )}

                  {/* Chevron */}
                  <span
                    className={`cdr-card__chevron${isExpanded ? ' cdr-card__chevron--open' : ''}`}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </div>

                {/* Expanded dropdown */}
                <div
                  className={`cdr-card__dropdown${isExpanded ? ' cdr-card__dropdown--open' : ''}`}
                >
                  <div className="cdr-card__dropdown-inner">
                    {/* Brief clinical application */}
                    {cdrDef?.application && (
                      <p className="cdr-card__application">{cdrDef.application}</p>
                    )}

                    {/* Component checklist */}
                    {components.length > 0 && (
                      <div className="cdr-card__comp-list">
                        {components.map((comp) => {
                          const compColor = getCompSquareColor(comp, trackingEntry, allComplete)
                          const statusText = getComponentStatusText(comp, trackingEntry)
                          const isAnswered = trackingEntry?.components[comp.id]?.answered ?? false
                          return (
                            <div key={comp.id} className="cdr-card__comp-row">
                              <span
                                className={`cdr-card__comp-square cdr-card__comp-square--${compColor}`}
                              />
                              <span className="cdr-card__comp-label">{comp.label}</span>
                              <span
                                className={`cdr-card__comp-status${isAnswered ? ' cdr-card__comp-status--answered' : ''}`}
                              >
                                {statusText}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
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
