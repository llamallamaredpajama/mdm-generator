/**
 * CdrComponentInput Component
 *
 * Renders a single CDR component with the appropriate input type:
 * - boolean: Yes/No toggle pair (neutral, no point display)
 * - select: Expandable dropdown (collapsed shows label + current selection)
 * - number_range: Display-only range info
 * - algorithm: "Calculated automatically" badge
 * - section2 pending: "Pending results" badge
 */

import { useState, useRef, useEffect } from 'react'
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

  // Dropdown open/close state for select components
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

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

  // Select: expandable dropdown
  if (component.type === 'select' && component.options) {
    const selectedOption = component.options.find((o) => o.value === currentValue)
    const displayText = selectedOption ? selectedOption.label : 'Select...'

    return (
      <div className="cdr-input cdr-input--select" ref={dropdownRef}>
        <div className="cdr-input__label-row">
          <span className="cdr-input__label">{component.label}</span>
          {isAiPopulated && <span className="cdr-input__ai-badge">(AI)</span>}
        </div>
        <button
          type="button"
          className={`cdr-input__dropdown-trigger${isAnswered ? ' cdr-input__dropdown-trigger--answered' : ''}`}
          onClick={() => !disabled && setDropdownOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
        >
          <span className="cdr-input__dropdown-text">{displayText}</span>
          <span className="cdr-input__dropdown-chevron" aria-hidden="true">
            {dropdownOpen ? '\u25B2' : '\u25BC'}
          </span>
        </button>
        {dropdownOpen && (
          <div className="cdr-input__dropdown-list" role="listbox">
            {component.options.map((opt, idx) => (
              <button
                key={`${opt.label}-${opt.value}-${idx}`}
                type="button"
                className={`cdr-input__dropdown-option${currentValue === opt.value ? ' cdr-input__dropdown-option--selected' : ''}`}
                role="option"
                aria-selected={currentValue === opt.value}
                onClick={() => {
                  onAnswer(opt.value)
                  setDropdownOpen(false)
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Boolean: Yes / No toggle pair
  if (component.type === 'boolean') {
    const pointWeight = component.value ?? 1
    const yesValue = pointWeight
    const noValue = 0
    return (
      <div className="cdr-input cdr-input--boolean">
        <div className="cdr-input__label-row">
          <span className="cdr-input__label">{component.label}</span>
          {isAiPopulated && <span className="cdr-input__ai-badge">(AI)</span>}
        </div>
        <div className="cdr-input__toggle-group">
          <button
            type="button"
            className={`cdr-input__toggle${currentValue === yesValue ? ' cdr-input__toggle--active' : ''}`}
            onClick={() => onAnswer(yesValue)}
            disabled={disabled}
            aria-pressed={currentValue === yesValue}
          >
            Yes
          </button>
          <button
            type="button"
            className={`cdr-input__toggle${currentValue === noValue ? ' cdr-input__toggle--active' : ''}`}
            onClick={() => onAnswer(noValue)}
            disabled={disabled}
            aria-pressed={currentValue === noValue}
          >
            No
          </button>
        </div>
      </div>
    )
  }

  // number_range: display-only
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
