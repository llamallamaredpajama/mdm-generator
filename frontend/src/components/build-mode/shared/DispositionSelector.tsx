/**
 * DispositionSelector Component
 *
 * Radio buttons for disposition, follow-up checkboxes,
 * and saved disposition flow quick-select buttons for Section 3.
 */

import { useState, useCallback } from 'react'
import type { DispositionOption } from '../../../types/encounter'
import type { DispoFlow } from '../../../hooks/useDispoFlows'
import './DispositionSelector.css'

const DISPOSITION_OPTIONS: Array<{ value: DispositionOption; label: string }> = [
  { value: 'discharge', label: 'Discharge' },
  { value: 'observation', label: 'Observation' },
  { value: 'admit', label: 'Admit' },
  { value: 'icu', label: 'ICU' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'ama', label: 'AMA' },
  { value: 'lwbs', label: 'LWBS' },
  { value: 'deceased', label: 'Deceased' },
]

const DEFAULT_FOLLOW_UP_OPTIONS = [
  'PCP follow-up',
  'Specialist follow-up',
  'Return to ED if worsening',
]

interface DispositionSelectorProps {
  /** Currently selected disposition */
  disposition: DispositionOption | null
  /** Currently selected follow-up items */
  followUp: string[]
  /** Saved disposition flows */
  savedFlows: DispoFlow[]
  /** Callback when disposition changes */
  onDispositionChange: (disposition: DispositionOption) => void
  /** Callback when follow-up changes */
  onFollowUpChange: (followUp: string[]) => void
  /** Callback when a saved flow is applied */
  onApplyFlow: (flow: DispoFlow) => void
  /** Callback when current selections are saved as a flow */
  onSaveFlow: (name: string) => void
  /** Callback to delete a saved flow */
  onDeleteFlow: (flowId: string) => void
  /** Whether input is disabled */
  disabled?: boolean
}

export default function DispositionSelector({
  disposition,
  followUp,
  savedFlows,
  onDispositionChange,
  onFollowUpChange,
  onApplyFlow,
  onSaveFlow,
  onDeleteFlow,
  disabled = false,
}: DispositionSelectorProps) {
  const [customFollowUp, setCustomFollowUp] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [flowName, setFlowName] = useState('')

  const handleFollowUpToggle = useCallback(
    (item: string) => {
      const updated = followUp.includes(item)
        ? followUp.filter((f) => f !== item)
        : [...followUp, item]
      onFollowUpChange(updated)
    },
    [followUp, onFollowUpChange]
  )

  const handleAddCustomFollowUp = useCallback(() => {
    const trimmed = customFollowUp.trim()
    if (trimmed && !followUp.includes(trimmed)) {
      onFollowUpChange([...followUp, trimmed])
      setCustomFollowUp('')
    }
  }, [customFollowUp, followUp, onFollowUpChange])

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddCustomFollowUp()
      }
    },
    [handleAddCustomFollowUp]
  )

  const handleSaveFlow = useCallback(() => {
    const trimmed = flowName.trim()
    if (trimmed && disposition) {
      onSaveFlow(trimmed)
      setFlowName('')
      setShowSaveInput(false)
    }
  }, [flowName, disposition, onSaveFlow])

  const handleSaveKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveFlow()
      }
      if (e.key === 'Escape') {
        setShowSaveInput(false)
        setFlowName('')
      }
    },
    [handleSaveFlow]
  )

  // Custom follow-up items that aren't in the default list
  const customItems = followUp.filter((f) => !DEFAULT_FOLLOW_UP_OPTIONS.includes(f))

  return (
    <div className="dispo-selector" data-testid="disposition-selector">
      {/* Disposition Radio Buttons */}
      <div className="dispo-selector__section">
        <span className="dispo-selector__label">Disposition</span>
        <div className="dispo-selector__radios" role="radiogroup" aria-label="Patient disposition">
          {DISPOSITION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`dispo-selector__radio${disposition === opt.value ? ' dispo-selector__radio--selected' : ''}`}
            >
              <input
                type="radio"
                name="disposition"
                value={opt.value}
                checked={disposition === opt.value}
                onChange={() => onDispositionChange(opt.value)}
                disabled={disabled}
                className="dispo-selector__radio-input"
              />
              <span className="dispo-selector__radio-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Follow-up Checkboxes */}
      <div className="dispo-selector__section">
        <span className="dispo-selector__label">Follow-up Instructions</span>
        <div className="dispo-selector__checkboxes">
          {DEFAULT_FOLLOW_UP_OPTIONS.map((item) => (
            <label key={item} className={`dispo-selector__checkbox${followUp.includes(item) ? ' dispo-selector__checkbox--checked' : ''}`}>
              <input
                type="checkbox"
                checked={followUp.includes(item)}
                onChange={() => handleFollowUpToggle(item)}
                disabled={disabled}
              />
              <span>{item}</span>
            </label>
          ))}

          {/* Custom follow-up items */}
          {customItems.map((item) => (
            <label key={item} className="dispo-selector__checkbox dispo-selector__checkbox--checked dispo-selector__checkbox--custom">
              <input
                type="checkbox"
                checked
                onChange={() => handleFollowUpToggle(item)}
                disabled={disabled}
              />
              <span>{item}</span>
            </label>
          ))}

          {/* Add custom follow-up */}
          {!disabled && (
            <div className="dispo-selector__custom-input">
              <input
                type="text"
                value={customFollowUp}
                onChange={(e) => setCustomFollowUp(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder="Add custom follow-up..."
                className="dispo-selector__custom-text"
                data-testid="custom-followup-input"
              />
              {customFollowUp.trim() && (
                <button
                  type="button"
                  className="dispo-selector__custom-add"
                  onClick={handleAddCustomFollowUp}
                  data-testid="add-followup-btn"
                >
                  Add
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved Flows */}
      {(savedFlows.length > 0 || disposition) && (
        <div className="dispo-selector__section">
          <span className="dispo-selector__label">Quick Flows</span>

          {savedFlows.length > 0 && (
            <div className="dispo-selector__flows">
              {savedFlows.map((flow) => (
                <div key={flow.id} className="dispo-selector__flow-item">
                  <button
                    type="button"
                    className="dispo-selector__flow-btn"
                    onClick={() => onApplyFlow(flow)}
                    disabled={disabled}
                    data-testid={`apply-flow-${flow.id}`}
                  >
                    <span className="dispo-selector__flow-name">{flow.name}</span>
                    <span className="dispo-selector__flow-detail">
                      {flow.disposition}{flow.followUp.length > 0 ? ` + ${flow.followUp.length} follow-up` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="dispo-selector__flow-delete"
                    onClick={() => onDeleteFlow(flow.id)}
                    disabled={disabled}
                    aria-label={`Delete flow ${flow.name}`}
                    data-testid={`delete-flow-${flow.id}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save Current as Flow */}
          {disposition && !disabled && (
            <div className="dispo-selector__save-flow">
              {showSaveInput ? (
                <div className="dispo-selector__save-input-row">
                  <input
                    type="text"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    onKeyDown={handleSaveKeyDown}
                    placeholder="Flow name..."
                    className="dispo-selector__save-name-input"
                    data-testid="flow-name-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="dispo-selector__save-confirm"
                    onClick={handleSaveFlow}
                    disabled={!flowName.trim()}
                    data-testid="confirm-save-flow"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="dispo-selector__save-cancel"
                    onClick={() => { setShowSaveInput(false); setFlowName('') }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="dispo-selector__save-btn"
                  onClick={() => setShowSaveInput(true)}
                  data-testid="save-flow-btn"
                >
                  Save current as flow
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
