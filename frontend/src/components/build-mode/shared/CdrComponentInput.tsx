/**
 * CdrComponentInput Component
 *
 * Renders a single CDR component with the appropriate input type
 * (select, boolean, number_range, algorithm) and state indicators.
 */

import type { CdrComponent } from '../../../types/libraries'
import type { CdrComponentState } from '../../../types/encounter'
import './CdrComponentInput.css'

interface CdrComponentInputProps {
  /** CDR component definition from the library */
  component: CdrComponent
  /** Current state of the component (value, answered, source) */
  state: CdrComponentState | undefined
  /** Callback when user answers/changes a component value */
  onAnswer: (value: number) => void
  /** Whether the input is disabled (e.g., dismissed CDR) */
  disabled?: boolean
}

export default function CdrComponentInput({
  component,
  state,
  onAnswer,
  disabled = false,
}: CdrComponentInputProps) {
  const isAnswered = state?.answered ?? false
  const isAiPopulated = isAnswered && state?.source === 'section1'
  const isSection2 = component.source === 'section2'
  const currentValue = state?.value ?? null

  // Section2-sourced components show pending state (not interactive in S1)
  if (isSection2) {
    return (
      <div className="cdr-input cdr-input--pending">
        <span className="cdr-input__label">{component.label}</span>
        <span className="cdr-input__pending-badge">Pending results</span>
      </div>
    )
  }

  // Algorithm components are auto-calculated
  if (component.type === 'algorithm') {
    return (
      <div className="cdr-input cdr-input--algorithm">
        <span className="cdr-input__label">{component.label}</span>
        <span className="cdr-input__algorithm-badge">Calculated automatically</span>
      </div>
    )
  }

  // Select: radio button group
  if (component.type === 'select' && component.options) {
    return (
      <div className="cdr-input cdr-input--select">
        <div className="cdr-input__label-row">
          <span className="cdr-input__label">{component.label}</span>
          {isAiPopulated && <span className="cdr-input__ai-badge">(AI)</span>}
        </div>
        <div className="cdr-input__options">
          {component.options.map((opt, idx) => (
            <button
              key={`${opt.label}-${opt.value}-${idx}`}
              type="button"
              className={`cdr-input__option ${currentValue === opt.value ? 'cdr-input__option--selected' : ''}`}
              onClick={() => onAnswer(opt.value)}
              disabled={disabled}
              aria-pressed={currentValue === opt.value}
            >
              <span className="cdr-input__option-label">{opt.label}</span>
              <span className="cdr-input__option-value">({opt.value}pt{opt.value !== 1 ? 's' : ''})</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Boolean: toggle (Present / Absent)
  if (component.type === 'boolean') {
    const pointWeight = component.value ?? 1
    const presentValue = pointWeight
    const absentValue = 0
    return (
      <div className="cdr-input cdr-input--boolean">
        <div className="cdr-input__label-row">
          <span className="cdr-input__label">{component.label}</span>
          {isAiPopulated && <span className="cdr-input__ai-badge">(AI)</span>}
        </div>
        <div className="cdr-input__toggle-group">
          <button
            type="button"
            className={`cdr-input__toggle ${currentValue === presentValue ? 'cdr-input__toggle--active' : ''}`}
            onClick={() => onAnswer(presentValue)}
            disabled={disabled}
            aria-pressed={currentValue === presentValue}
          >
            Present ({presentValue}pt{presentValue !== 1 ? 's' : ''})
          </button>
          <button
            type="button"
            className={`cdr-input__toggle ${currentValue === absentValue ? 'cdr-input__toggle--active' : ''}`}
            onClick={() => onAnswer(absentValue)}
            disabled={disabled}
            aria-pressed={currentValue === absentValue}
          >
            Absent (0pts)
          </button>
        </div>
      </div>
    )
  }

  // number_range for non-section2 (user_input): show numeric stepper
  if (component.type === 'number_range') {
    return (
      <div className="cdr-input cdr-input--range">
        <div className="cdr-input__label-row">
          <span className="cdr-input__label">{component.label}</span>
          {isAiPopulated && <span className="cdr-input__ai-badge">(AI)</span>}
        </div>
        <span className="cdr-input__range-info">
          Range: {component.min ?? 0} - {component.max ?? 10}
          {currentValue != null && ` (current: ${currentValue})`}
        </span>
      </div>
    )
  }

  // Fallback: unknown component type
  return (
    <div className="cdr-input">
      <span className="cdr-input__label">{component.label}</span>
    </div>
  )
}
