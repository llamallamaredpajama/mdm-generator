/**
 * ResultEntry Component
 *
 * Per-test result entry card for Section 2.
 * Shows unremarkable/abnormal radio buttons, CDR badges,
 * and expandable detail entry for abnormal results.
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

  const statusModifier = isPending
    ? 'result-entry--pending'
    : isUnremarkable
      ? 'result-entry--unremarkable'
      : 'result-entry--abnormal'

  return (
    <div className={`result-entry ${statusModifier}`} data-testid={`result-entry-${testDef.id}`}>
      <div className="result-entry__header">
        <div className="result-entry__title-group">
          <span className="result-entry__name">{testDef.name}</span>
          <span className="result-entry__category">
            {CATEGORY_LABELS[testDef.category] || testDef.category}
          </span>
          {activeCdrNames.map((name) => (
            <span key={name} className="result-entry__cdr-badge">
              {name}
            </span>
          ))}
        </div>

        {isUnremarkable && (
          <span className="result-entry__check" aria-label="Unremarkable">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      <div className="result-entry__radio-group" role="radiogroup" aria-label={`Status for ${testDef.name}`}>
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
        <div className="result-entry__cdr-warning">
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
