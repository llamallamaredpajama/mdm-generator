/**
 * ResultEntry Component
 *
 * Per-test result entry row for Section 2.
 * D4: Redesigned as table-row layout with:
 *   - Left: workup item name + category + CDR badges
 *   - WNL checkbox (within normal limits)
 *   - ABNL checkbox (abnormal)
 *   - Comment field for values/interpretation
 *
 * Expands to show detail area (quick findings, value input) when abnormal.
 */

import type { TestDefinition } from '../../../types/libraries'
import type { TestResult, TestResultStatus } from '../../../types/encounter'
import ResultDetailExpanded from './ResultDetailExpanded'
import './ResultEntry.css'

interface ResultEntryProps {
  /** Test definition from the master library */
  testDef: TestDefinition
  /** Current test result (undefined = pending) */
  result: TestResult | undefined
  /** Names of active CDRs this test feeds into */
  activeCdrNames: string[]
  /** A5/E1: CDR correlation colors (cdrName -> color) */
  cdrColors?: Map<string, string>
  /** E3: Whether to show readiness indicator */
  showReadiness?: boolean
  /** Callback when result changes */
  onResultChange: (testId: string, result: TestResult) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  labs: 'Lab',
  imaging: 'Imaging',
  procedures_poc: 'Procedure',
}

export default function ResultEntry({
  testDef,
  result,
  activeCdrNames,
  cdrColors,
  showReadiness = false,
  onResultChange,
}: ResultEntryProps) {
  const status: TestResultStatus = result?.status ?? 'pending'
  const isAbnormal = status === 'abnormal'
  const isUnremarkable = status === 'unremarkable'
  const isPending = status === 'pending'

  function handleStatusChange(newStatus: TestResultStatus) {
    const updated: TestResult = {
      ...result,
      status: newStatus,
      quickFindings: newStatus === 'unremarkable' ? [] : (result?.quickFindings ?? []),
      notes: newStatus === 'unremarkable' ? null : (result?.notes ?? null),
      value: result?.value ?? null,
      unit: testDef.unit ?? null,
    }
    onResultChange(testDef.id, updated)
  }

  function handleDetailChange(updated: TestResult) {
    onResultChange(testDef.id, updated)
  }

  function handleNotesChange(notes: string) {
    const updated: TestResult = {
      ...result,
      status: result?.status ?? 'pending',
      quickFindings: result?.quickFindings ?? [],
      notes: notes || null,
      value: result?.value ?? null,
      unit: testDef.unit ?? null,
    }
    onResultChange(testDef.id, updated)
  }

  const statusModifier = isPending
    ? 'result-entry--pending'
    : isUnremarkable
      ? 'result-entry--unremarkable'
      : 'result-entry--abnormal'

  return (
    <div className={`result-entry ${statusModifier}`} data-testid={`result-entry-${testDef.id}`}>
      {/* D4: Table-row layout */}
      <div className="result-entry__row">
        {/* E3: Readiness indicator */}
        {showReadiness && (
          <span
            className={`result-entry__readiness-dot result-entry__readiness-dot--${isPending ? 'red' : 'green'}`}
            aria-label={isPending ? 'Not yet obtained' : 'Completed'}
          />
        )}

        {/* Left: name + badges */}
        <div className="result-entry__title-group">
          <span className="result-entry__name">{testDef.name}</span>
          <span className="result-entry__category">
            {CATEGORY_LABELS[testDef.category] || testDef.category}
          </span>
          {activeCdrNames.map((name) => {
            const color = cdrColors?.get(name.toLowerCase())
            return (
              <span
                key={name}
                className="result-entry__cdr-badge"
                style={color ? { backgroundColor: color, color: '#fff' } : undefined}
              >
                {name}
              </span>
            )
          })}
        </div>

        {/* D4: WNL checkbox */}
        <label
          className={`result-entry__checkbox-label${isUnremarkable ? ' result-entry__checkbox-label--wnl-active' : ''}`}
        >
          <input
            type="checkbox"
            className="result-entry__checkbox"
            checked={isUnremarkable}
            onChange={() => handleStatusChange(isUnremarkable ? 'pending' : 'unremarkable')}
            aria-label={`Mark ${testDef.name} as unremarkable`}
          />
          <span className="result-entry__checkbox-text">WNL</span>
        </label>

        {/* D4: ABNL checkbox */}
        <label
          className={`result-entry__checkbox-label${isAbnormal ? ' result-entry__checkbox-label--abnl-active' : ''}`}
        >
          <input
            type="checkbox"
            className="result-entry__checkbox"
            checked={isAbnormal}
            onChange={() => handleStatusChange(isAbnormal ? 'pending' : 'abnormal')}
            aria-label={`Mark ${testDef.name} as abnormal`}
          />
          <span className="result-entry__checkbox-text">ABNL</span>
        </label>

        {/* D4: Inline comment field */}
        <input
          type="text"
          className="result-entry__comment"
          placeholder={isPending ? 'Comment...' : isUnremarkable ? 'WNL' : 'Findings...'}
          value={result?.notes ?? ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          aria-label={`Comment for ${testDef.name}`}
        />

        {/* Check icon for unremarkable */}
        {isUnremarkable && (
          <span className="result-entry__check" aria-label="Unremarkable">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      {/* Backward compat: radio group for screen readers */}
      <div
        className="result-entry__radio-group"
        role="radiogroup"
        aria-label={`Status for ${testDef.name}`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isUnremarkable}
          className={`result-entry__radio ${isUnremarkable ? 'result-entry__radio--selected result-entry__radio--unremarkable' : ''}`}
          onClick={() => handleStatusChange('unremarkable')}
        >
          Unremarkable
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isAbnormal}
          className={`result-entry__radio ${isAbnormal ? 'result-entry__radio--selected result-entry__radio--abnormal' : ''}`}
          onClick={() => handleStatusChange('abnormal')}
        >
          Abnormal
        </button>
      </div>

      {activeCdrNames.length > 0 && isPending && (
        <div
          className="result-entry__cdr-warning"
          role="alert"
          aria-label={`Result needed: value required for ${activeCdrNames.join(', ')}`}
        >
          Value needed for {activeCdrNames.join(', ')}
        </div>
      )}

      {isAbnormal && (
        <ResultDetailExpanded
          testDef={testDef}
          result={result!}
          onResultChange={handleDetailChange}
        />
      )}
    </div>
  )
}
