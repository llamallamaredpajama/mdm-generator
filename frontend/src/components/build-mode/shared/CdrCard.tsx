import type { CdrAnalysisItem } from '../../../types/encounter'
import type { IdentifiedCdr } from './getIdentifiedCdrs'
import './CdrCard.css'

interface CdrCardProps {
  identifiedCdrs: IdentifiedCdr[]
  /** S1 LLM-generated CDR analysis (may be empty on older encounters) */
  cdrAnalysis?: CdrAnalysisItem[]
  loading: boolean
  error?: string | null
  onViewCdrs?: () => void
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

export default function CdrCard({
  identifiedCdrs,
  cdrAnalysis = [],
  loading,
  error,
  onViewCdrs,
}: CdrCardProps) {
  const mergedCdrs = getMergedCdrDisplay(cdrAnalysis, identifiedCdrs)

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
            {mergedCdrs.map((item) => {
              const hasScore = item.score != null
              const hasMissing = item.missingData && item.missingData.length > 0
              const readiness = hasScore
                ? 'completed'
                : hasMissing
                  ? 'needs_results'
                  : 'completable'

              return (
                <li key={item.name} className="cdr-card__row">
                  <span
                    className={`cdr-card__dot cdr-card__dot--${readiness}`}
                    aria-hidden="true"
                  />
                  <div className="cdr-card__row-content">
                    <span className="cdr-card__name">{item.name}</span>
                    {hasScore && (
                      <span className="cdr-card__score">
                        Score: {item.score}
                        {item.interpretation ? ` — ${item.interpretation}` : ''}
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
