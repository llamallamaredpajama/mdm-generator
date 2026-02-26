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
    // Use LLM analysis as primary source
    // Add any client-side identified CDRs that aren't in the LLM analysis
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

  // Fallback: convert client-side identified CDRs to CdrAnalysisItem shape
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
 * Determine if a CDR component is "simple" enough for inline editing.
 * Simple = boolean (yes/no toggle) or number_range with source !== 'section2'.
 * Complex = select with many options. Reserve those for CdrDetailView.
 */
function isSimpleComponent(comp: CdrComponent): boolean {
  if (comp.source === 'section2') return false
  if (comp.type === 'algorithm') return false
  if (comp.type === 'boolean') return true
  // number_range with user_input source is simple enough for inline
  if (comp.type === 'number_range' && comp.source === 'user_input') return true
  return false
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
  // Fallback: match by name in tracking entries
  for (const [id, entry] of Object.entries(cdrTracking)) {
    if (entry.name.toLowerCase() === name.toLowerCase()) return id
  }
  return undefined
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
  onAnswerComponent,
}: CdrCardProps) {
  // Issue 4: Memoize merged CDR list
  const mergedCdrs = useMemo(
    () => getMergedCdrDisplay(cdrAnalysis, identifiedCdrs),
    [cdrAnalysis, identifiedCdrs],
  )

  // Use external color map if provided; otherwise build a local fallback (alphabetically sorted)
  const colorMap = useMemo(() => {
    if (externalColorMap) return externalColorMap
    return buildCdrColorMap(mergedCdrs.map((c) => c.name))
  }, [externalColorMap, mergedCdrs])

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
        <>
          <ul className="cdr-card__list" aria-label="Identified clinical decision rules">
            {mergedCdrs.map((item, idx) => {
              const trackingId = findTrackingId(item.name, cdrTracking, cdrLibrary)
              const trackingEntry = trackingId ? cdrTracking[trackingId] : undefined
              const isExcluded = trackingEntry?.excluded === true
              const cdrDef = findCdrDef(item.name, cdrLibrary)

              // Use tracking score if available, otherwise use LLM analysis score
              const displayScore = trackingEntry?.score ?? item.score
              const displayInterpretation = trackingEntry?.interpretation ?? item.interpretation

              const hasScore = displayScore != null
              const hasMissing = item.missingData && item.missingData.length > 0
              const readiness = hasScore
                ? 'completed'
                : hasMissing
                  ? 'needs_results'
                  : 'completable'

              // A5: Color-coded CDR correlation (deterministic via alphabetical sort)
              const cdrColor = colorMap.get(item.name.toLowerCase()) ?? '#6b7280'

              // A2: Find simple components for inline editing
              const simpleComponents = cdrDef?.components.filter(isSimpleComponent) ?? []
              const hasInlineEditable =
                simpleComponents.length > 0 && onAnswerComponent && trackingId

              return (
                <li
                  key={item.name}
                  className={`cdr-card__row${isExcluded ? ' cdr-card__row--excluded' : ''}`}
                >
                  {/* A4: Include/Exclude checkbox */}
                  {onToggleExcluded && trackingId && (
                    <input
                      type="checkbox"
                      className="cdr-card__include-checkbox"
                      checked={!isExcluded}
                      onChange={() => onToggleExcluded(trackingId)}
                      aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${item.name}`}
                      title={isExcluded ? 'Include in MDM' : 'Exclude from MDM'}
                    />
                  )}
                  {/* A5: CDR color indicator */}
                  <span
                    className={`cdr-card__dot cdr-card__dot--${readiness}`}
                    style={{ backgroundColor: cdrColor }}
                    aria-hidden="true"
                    title={`CDR ${idx + 1}`}
                  />
                  <div className="cdr-card__row-content">
                    <span
                      className={`cdr-card__name${isExcluded ? ' cdr-card__name--excluded' : ''}`}
                    >
                      {item.name}
                      {/* A5: CDR correlation icon */}
                      <span
                        className="cdr-card__correlation-icon"
                        style={{ backgroundColor: cdrColor }}
                        title={`CDR ${idx + 1} correlation`}
                      />
                    </span>
                    {hasScore && (
                      <span
                        className={`cdr-card__score${pulsing.has(item.name) ? ' cdr-card__score--pulse' : ''}`}
                      >
                        Score: {displayScore}
                        {displayInterpretation ? ` \u2014 ${displayInterpretation}` : ''}
                      </span>
                    )}
                    {!hasScore && hasMissing && (
                      <span className="cdr-card__missing">
                        Needs: {item.missingData!.join(', ')}
                      </span>
                    )}
                    {!hasScore && !hasMissing && (
                      <span className="cdr-card__readiness">(completable)</span>
                    )}

                    {/* A2: Inline simple component editing */}
                    {hasInlineEditable && !isExcluded && (
                      <div className="cdr-card__inline-components">
                        {simpleComponents.map((comp) => {
                          const compState = trackingEntry?.components[comp.id]
                          const isAnswered = compState?.answered ?? false
                          const currentValue = compState?.value ?? null

                          if (comp.type === 'boolean') {
                            const pointWeight = comp.value ?? 1
                            const isPresent = currentValue === pointWeight
                            const isAbsent = currentValue === 0
                            return (
                              <div key={comp.id} className="cdr-card__inline-toggle">
                                <span className="cdr-card__inline-label">{comp.label}</span>
                                <div className="cdr-card__inline-btn-group">
                                  <button
                                    type="button"
                                    className={`cdr-card__inline-btn${isPresent ? ' cdr-card__inline-btn--active' : ''}`}
                                    onClick={() =>
                                      onAnswerComponent!(trackingId!, comp.id, pointWeight)
                                    }
                                    aria-pressed={isPresent}
                                  >
                                    Y
                                  </button>
                                  <button
                                    type="button"
                                    className={`cdr-card__inline-btn${isAbsent ? ' cdr-card__inline-btn--active' : ''}`}
                                    onClick={() => onAnswerComponent!(trackingId!, comp.id, 0)}
                                    aria-pressed={isAbsent}
                                  >
                                    N
                                  </button>
                                </div>
                                {isAnswered && compState?.source === 'section1' && (
                                  <span className="cdr-card__inline-ai">(AI)</span>
                                )}
                              </div>
                            )
                          }

                          // number_range: show current value indicator
                          if (comp.type === 'number_range') {
                            return (
                              <div key={comp.id} className="cdr-card__inline-range">
                                <span className="cdr-card__inline-label">{comp.label}</span>
                                <span className="cdr-card__inline-value">
                                  {isAnswered ? String(currentValue) : 'pending'}
                                </span>
                              </div>
                            )
                          }

                          return null
                        })}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="cdr-card__legend" aria-hidden="true">
            <span className="cdr-card__legend-item">
              <span className="cdr-card__dot cdr-card__dot--completed" /> score calculated
            </span>
            <span className="cdr-card__legend-item">
              <span className="cdr-card__dot cdr-card__dot--completable" /> completable now
            </span>
            <span className="cdr-card__legend-item">
              <span className="cdr-card__dot cdr-card__dot--needs_results" /> needs data
            </span>
          </div>
        </>
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
