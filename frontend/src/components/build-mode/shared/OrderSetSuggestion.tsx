/**
 * OrderSetSuggestion Component
 *
 * Displayed on the S1 dashboard when a saved order set matches the
 * current presentation. Provides Apply All / Customize / Skip actions.
 */

import type { OrderSet } from '../../../hooks/useOrderSets'
import './OrderSetSuggestion.css'

interface OrderSetSuggestionProps {
  orderSet: OrderSet
  onApplyAll: (orderSet: OrderSet) => void
  onCustomize: (orderSet: OrderSet) => void
  onSkip: () => void
}

export default function OrderSetSuggestion({
  orderSet,
  onApplyAll,
  onCustomize,
  onSkip,
}: OrderSetSuggestionProps) {
  return (
    <div className="orderset-suggestion" data-testid="orderset-suggestion">
      <div className="orderset-suggestion__header">
        <span className="orderset-suggestion__icon">&#128203;</span>
        <div className="orderset-suggestion__info">
          <span className="orderset-suggestion__name">{orderSet.name}</span>
          <span className="orderset-suggestion__meta">
            {orderSet.testIds.length} tests
            {orderSet.usageCount > 0 && ` | used ${orderSet.usageCount}x`}
          </span>
        </div>
      </div>

      <div className="orderset-suggestion__actions">
        <button
          type="button"
          className="orderset-suggestion__btn orderset-suggestion__btn--apply"
          onClick={() => onApplyAll(orderSet)}
          data-testid="orderset-apply-all"
        >
          Apply All
        </button>
        <button
          type="button"
          className="orderset-suggestion__btn orderset-suggestion__btn--customize"
          onClick={() => onCustomize(orderSet)}
          data-testid="orderset-customize"
        >
          Customize
        </button>
        <button
          type="button"
          className="orderset-suggestion__btn orderset-suggestion__btn--skip"
          onClick={onSkip}
          data-testid="orderset-skip"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
