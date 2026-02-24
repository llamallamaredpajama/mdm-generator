import type { IdentifiedCdr } from './getIdentifiedCdrs'
import './CdrCard.css'

interface CdrCardProps {
  identifiedCdrs: IdentifiedCdr[]
  loading: boolean
  error?: string | null
  onViewCdrs?: () => void
}

export default function CdrCard({ identifiedCdrs, loading, error, onViewCdrs }: CdrCardProps) {
  return (
    <div className="cdr-card">
      <div className="cdr-card__header">
        <h4 className="cdr-card__title">Clinical Decision Rules</h4>
        {!loading && identifiedCdrs.length > 0 && (
          <span className="cdr-card__badge">{identifiedCdrs.length} identified</span>
        )}
      </div>

      {loading ? (
        <p className="cdr-card__loading">Loading CDR library...</p>
      ) : error ? (
        <p className="cdr-card__error">Unable to load CDR library</p>
      ) : identifiedCdrs.length === 0 ? (
        <p className="cdr-card__empty">No CDRs identified for this differential</p>
      ) : (
        <>
          <ul className="cdr-card__list">
            {identifiedCdrs.map((item) => (
              <li key={item.cdr.id} className="cdr-card__row">
                <span className={`cdr-card__dot cdr-card__dot--${item.readiness}`} />
                <span className="cdr-card__name">{item.cdr.name}</span>
                <span className="cdr-card__readiness">
                  ({item.readiness === 'completable' ? 'completable' : 'needs results'})
                </span>
              </li>
            ))}
          </ul>
          <div className="cdr-card__legend">
            <span className="cdr-card__legend-item">
              <span className="cdr-card__dot cdr-card__dot--completable" /> completable now
            </span>
            <span className="cdr-card__legend-item">
              <span className="cdr-card__dot cdr-card__dot--needs_results" /> needs results
            </span>
          </div>
        </>
      )}

      {!loading && identifiedCdrs.length > 0 && (
        <button
          type="button"
          className="cdr-card__view-btn"
          onClick={onViewCdrs}
          disabled={!onViewCdrs}
          title={onViewCdrs ? undefined : 'Available in next update'}
        >
          View CDRs
        </button>
      )}
    </div>
  )
}
