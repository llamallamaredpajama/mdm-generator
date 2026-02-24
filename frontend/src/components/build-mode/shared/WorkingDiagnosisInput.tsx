/**
 * WorkingDiagnosisInput Component
 *
 * AI-suggested working diagnosis selection with radio buttons
 * and a free-text "Other" option. Replaces the plain text input
 * in EncounterEditor for structured diagnosis selection.
 */

import { useState, useCallback } from 'react'
import type { WorkingDiagnosis } from '../../../types/encounter'
import { isStructuredDiagnosis } from '../../../types/encounter'
import './WorkingDiagnosisInput.css'

interface WorkingDiagnosisInputProps {
  /** AI-suggested diagnosis options */
  suggestions: string[]
  /** Whether suggestions are still loading */
  loading: boolean
  /** Current value (structured object, legacy string, or undefined) */
  value: WorkingDiagnosis | string | undefined
  /** Callback when diagnosis selection changes */
  onChange: (wd: WorkingDiagnosis) => void
  /** Whether the input is disabled (e.g., section locked) */
  disabled?: boolean
}

/**
 * Normalize a legacy string or structured WorkingDiagnosis into a consistent shape.
 */
function normalize(value: WorkingDiagnosis | string | undefined): WorkingDiagnosis {
  if (!value) return { selected: null, custom: null }
  if (typeof value === 'string') return { selected: value, custom: null }
  if (isStructuredDiagnosis(value)) return value
  return { selected: null, custom: null }
}

export default function WorkingDiagnosisInput({
  suggestions,
  loading,
  value,
  onChange,
  disabled = false,
}: WorkingDiagnosisInputProps) {
  const normalized = normalize(value)
  const isOtherSelected = normalized.selected === null && normalized.custom !== null && normalized.custom !== ''
  const [showCustomInput, setShowCustomInput] = useState(isOtherSelected)

  const handleSuggestionSelect = useCallback(
    (diagnosis: string) => {
      setShowCustomInput(false)
      onChange({
        selected: diagnosis,
        custom: null,
        suggestedOptions: suggestions,
      })
    },
    [onChange, suggestions]
  )

  const handleOtherSelect = useCallback(() => {
    setShowCustomInput(true)
    onChange({
      selected: null,
      custom: normalized.custom || '',
      suggestedOptions: suggestions,
    })
  }, [onChange, normalized.custom, suggestions])

  const handleCustomChange = useCallback(
    (text: string) => {
      onChange({
        selected: null,
        custom: text,
        suggestedOptions: suggestions,
      })
    },
    [onChange, suggestions]
  )

  return (
    <div className="working-diagnosis" data-testid="working-diagnosis-input">
      <div className="working-diagnosis__header">
        <span className="working-diagnosis__label">Working Diagnosis</span>
        {loading && (
          <span className="working-diagnosis__loading" data-testid="dx-loading">
            Analyzing...
          </span>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="working-diagnosis__options" role="radiogroup" aria-label="Working diagnosis options">
          {suggestions.map((dx) => {
            const isSelected = normalized.selected === dx
            return (
              <label
                key={dx}
                className={`working-diagnosis__option${isSelected ? ' working-diagnosis__option--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="working-diagnosis"
                  className="working-diagnosis__radio"
                  checked={isSelected}
                  onChange={() => handleSuggestionSelect(dx)}
                  disabled={disabled}
                />
                <span className="working-diagnosis__option-text">{dx}</span>
              </label>
            )
          })}

          {/* "Other" option */}
          <label
            className={`working-diagnosis__option working-diagnosis__option--other${showCustomInput ? ' working-diagnosis__option--selected' : ''}`}
          >
            <input
              type="radio"
              name="working-diagnosis"
              className="working-diagnosis__radio"
              checked={showCustomInput}
              onChange={handleOtherSelect}
              disabled={disabled}
            />
            <span className="working-diagnosis__option-text">Other</span>
          </label>
        </div>
      )}

      {/* Custom input shown when "Other" is selected or no suggestions */}
      {(showCustomInput || suggestions.length === 0) && (
        <input
          type="text"
          className="working-diagnosis__custom-input"
          value={showCustomInput ? (normalized.custom ?? '') : (normalized.selected ?? normalized.custom ?? '')}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Type a working diagnosis..."
          disabled={disabled}
          data-testid="dx-custom-input"
        />
      )}
    </div>
  )
}
