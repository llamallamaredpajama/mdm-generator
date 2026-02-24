/**
 * ResultDetailExpanded Component
 *
 * Expanded detail view for abnormal test results.
 * Shows quick-select findings checkboxes, value input for
 * quantitative tests, free-text notes, and saved report templates.
 */

import { useState } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import type { TestResult } from '../../../types/encounter'
import { useReportTemplates, type ReportTemplate } from '../../../hooks/useReportTemplates'
import './ResultDetailExpanded.css'

interface ResultDetailExpandedProps {
  /** Test definition from the master library */
  testDef: TestDefinition
  /** Current test result */
  result: TestResult
  /** Callback when result changes */
  onResultChange: (result: TestResult) => void
}

export default function ResultDetailExpanded({
  testDef,
  result,
  onResultChange,
}: ResultDetailExpandedProps) {
  const quickFindings = testDef.quickFindings
  const hasQuickFindings = quickFindings && quickFindings.length > 0
  const hasUnit = !!testDef.unit
  const { getTemplatesForTest, saveTemplate, deleteTemplate } = useReportTemplates()
  const testTemplates = getTemplatesForTest(testDef.id)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  function handleFindingToggle(finding: string) {
    const current = result.quickFindings ?? []
    const updated = current.includes(finding)
      ? current.filter((f) => f !== finding)
      : [...current, finding]
    onResultChange({ ...result, quickFindings: updated })
  }

  function handleNotesChange(notes: string) {
    onResultChange({ ...result, notes: notes || null })
  }

  function handleValueChange(value: string) {
    onResultChange({ ...result, value: value || null })
  }

  function handleApplyTemplate(template: ReportTemplate) {
    const updated: TestResult = {
      ...result,
      notes: template.text,
    }
    if (template.defaultStatus) {
      updated.status = template.defaultStatus
    }
    onResultChange(updated)
  }

  function handleSaveTemplate() {
    if (!templateName.trim() || !result.notes) return
    saveTemplate(testDef.id, templateName.trim(), result.notes, result.status)
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  return (
    <div className="result-detail" data-testid={`result-detail-${testDef.id}`}>
      {/* Saved report templates */}
      {testTemplates.length > 0 && (
        <div className="result-detail__templates" data-testid={`templates-${testDef.id}`}>
          <span className="result-detail__templates-label">Templates</span>
          <div className="result-detail__template-list">
            {testTemplates.map((t) => (
              <div key={t.id} className="result-detail__template-item">
                <button
                  type="button"
                  className="result-detail__template-btn"
                  onClick={() => handleApplyTemplate(t)}
                  data-testid={`apply-template-${t.id}`}
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  className="result-detail__template-delete"
                  onClick={() => deleteTemplate(t.id)}
                  data-testid={`delete-template-${t.id}`}
                  title="Delete template"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value input for quantitative tests */}
      {hasUnit && (
        <div className="result-detail__value-group">
          <label className="result-detail__value-label" htmlFor={`result-value-${testDef.id}`}>
            Value
          </label>
          <div className="result-detail__value-input-row">
            <input
              id={`result-value-${testDef.id}`}
              type="text"
              className="result-detail__value-input"
              value={result.value ?? ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={testDef.normalRange ? `Normal: ${testDef.normalRange}` : 'Enter value'}
              aria-label={`Value for ${testDef.name}`}
            />
            <span className="result-detail__unit">{testDef.unit}</span>
          </div>
        </div>
      )}

      {/* Quick findings checkboxes */}
      {hasQuickFindings && (
        <div className="result-detail__findings">
          <span className="result-detail__findings-label">Findings</span>
          <div className="result-detail__findings-grid">
            {quickFindings.map((finding) => {
              const isChecked = (result.quickFindings ?? []).includes(finding)
              return (
                <label key={finding} className="result-detail__finding-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleFindingToggle(finding)}
                    className="result-detail__finding-checkbox"
                  />
                  <span className="result-detail__finding-text">{finding}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Free-text notes */}
      <div className="result-detail__notes-group">
        <label className="result-detail__notes-label" htmlFor={`result-notes-${testDef.id}`}>
          Notes
        </label>
        <textarea
          id={`result-notes-${testDef.id}`}
          className="result-detail__notes-input"
          value={result.notes ?? ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Additional findings or interpretation..."
          rows={2}
          aria-label={`Notes for ${testDef.name}`}
        />
      </div>

      {/* Save as template */}
      {result.notes && (
        <div className="result-detail__save-template">
          {showSaveTemplate ? (
            <div className="result-detail__save-template-row">
              <input
                type="text"
                className="result-detail__save-template-input"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                data-testid={`template-name-input-${testDef.id}`}
              />
              <button
                type="button"
                className="result-detail__save-template-confirm"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                data-testid={`confirm-save-template-${testDef.id}`}
              >
                Save
              </button>
              <button
                type="button"
                className="result-detail__save-template-cancel"
                onClick={() => { setShowSaveTemplate(false); setTemplateName('') }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="result-detail__save-template-btn"
              onClick={() => setShowSaveTemplate(true)}
              data-testid={`save-template-btn-${testDef.id}`}
            >
              Save as template
            </button>
          )}
        </div>
      )}
    </div>
  )
}
