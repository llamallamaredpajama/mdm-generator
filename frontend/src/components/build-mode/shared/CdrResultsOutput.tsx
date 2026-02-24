/**
 * CdrResultsOutput Component (BM-5.3)
 *
 * Replaces MdmPreviewPanel as the S2 output. Shows a brief CDR
 * calculations report: working diagnosis, test result summary,
 * and completed CDR scores with expandable component breakdown.
 */

import { useState } from 'react'
import type { EncounterDocument, CdrTrackingEntry, TestResult } from '../../../types/encounter'
import { isStructuredDiagnosis } from '../../../types/encounter'
import { useTestLibrary } from '../../../hooks/useTestLibrary'
import './CdrResultsOutput.css'

interface CdrResultsOutputProps {
  encounter: EncounterDocument
}

/**
 * Extract the effective working diagnosis display string
 */
function getWorkingDiagnosisText(encounter: EncounterDocument): string | null {
  const wd = encounter.section2?.workingDiagnosis
  if (!wd) return null
  if (typeof wd === 'string') return wd
  if (isStructuredDiagnosis(wd)) {
    return wd.selected ?? wd.custom ?? null
  }
  return null
}

export default function CdrResultsOutput({ encounter }: CdrResultsOutputProps) {
  const { tests: testLibrary } = useTestLibrary()
  const [expandedCdrs, setExpandedCdrs] = useState<Set<string>>(new Set())

  const toggleCdr = (cdrId: string) => {
    setExpandedCdrs((prev) => {
      const next = new Set(prev)
      if (next.has(cdrId)) next.delete(cdrId)
      else next.add(cdrId)
      return next
    })
  }

  // Working diagnosis
  const workingDx = getWorkingDiagnosisText(encounter)

  // Test results summary
  const testResults = encounter.section2?.testResults ?? {}
  const selectedTests = encounter.section2?.selectedTests ?? []
  const resultEntries = Object.entries(testResults) as [string, TestResult][]
  const respondedResults = resultEntries.filter(([, r]) => r.status !== 'pending')
  const abnormalResults = resultEntries.filter(([, r]) => r.status === 'abnormal')
  const abnormalNames = abnormalResults.map(([id]) => {
    const def = testLibrary.find((t) => t.id === id)
    return def?.name ?? id
  })

  // CDR tracking
  const cdrTracking = encounter.cdrTracking ?? {}
  const cdrEntries = Object.entries(cdrTracking) as [string, CdrTrackingEntry][]
  const completedCdrs = cdrEntries.filter(([, e]) => e.status === 'completed' && !e.dismissed)
  const pendingCdrs = cdrEntries.filter(([, e]) => (e.status === 'pending' || e.status === 'partial') && !e.dismissed)

  return (
    <div className="cdr-results" data-testid="cdr-results-output">
      {/* Working Diagnosis */}
      {workingDx && (
        <div className="cdr-results__section">
          <h4 className="cdr-results__label">Working Diagnosis</h4>
          <p className="cdr-results__dx" data-testid="cdr-results-dx">{workingDx}</p>
        </div>
      )}

      {/* Test Results Summary */}
      <div className="cdr-results__section">
        <h4 className="cdr-results__label">Results Summary</h4>
        <p className="cdr-results__summary" data-testid="cdr-results-summary">
          {respondedResults.length} of {selectedTests.length} tests resulted
          {abnormalResults.length > 0 && (
            <span className="cdr-results__abnormal-count">
              {' '}— {abnormalResults.length} abnormal
            </span>
          )}
        </p>
        {abnormalNames.length > 0 && (
          <ul className="cdr-results__abnormal-list" data-testid="cdr-results-abnormals">
            {abnormalNames.map((name) => (
              <li key={name} className="cdr-results__abnormal-item">{name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Completed CDR Scores */}
      {completedCdrs.length > 0 && (
        <div className="cdr-results__section">
          <h4 className="cdr-results__label">CDR Scores</h4>
          <div className="cdr-results__scores">
            {completedCdrs.map(([cdrId, entry]) => (
              <div key={cdrId} className="cdr-results__score-card" data-testid={`cdr-score-${cdrId}`}>
                <button
                  type="button"
                  className="cdr-results__score-header"
                  onClick={() => toggleCdr(cdrId)}
                  aria-expanded={expandedCdrs.has(cdrId)}
                >
                  <span className="cdr-results__score-name">{entry.name}</span>
                  <span className="cdr-results__score-value">
                    {entry.score != null ? `Score: ${entry.score}` : 'Completed'}
                  </span>
                  <span className={`cdr-results__chevron${expandedCdrs.has(cdrId) ? ' cdr-results__chevron--open' : ''}`}>
                    &#9654;
                  </span>
                </button>
                {entry.interpretation && (
                  <p className="cdr-results__interpretation">{entry.interpretation}</p>
                )}
                {expandedCdrs.has(cdrId) && (
                  <div className="cdr-results__components" data-testid={`cdr-components-${cdrId}`}>
                    {Object.entries(entry.components).map(([compId, comp]) => (
                      <div key={compId} className="cdr-results__comp-row">
                        <span className="cdr-results__comp-name">{compId}</span>
                        <span className="cdr-results__comp-value">
                          {comp.answered ? (comp.value ?? '—') : 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending CDRs */}
      {pendingCdrs.length > 0 && (
        <div className="cdr-results__section">
          <h4 className="cdr-results__label">Pending CDRs</h4>
          <ul className="cdr-results__pending-list">
            {pendingCdrs.map(([cdrId, entry]) => {
              const total = Object.keys(entry.components).length
              const answered = Object.values(entry.components).filter((c) => c.answered).length
              return (
                <li key={cdrId} className="cdr-results__pending-item" data-testid={`cdr-pending-${cdrId}`}>
                  <span className="cdr-results__pending-name">{entry.name}</span>
                  <span className="cdr-results__pending-progress">{answered}/{total}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Footer */}
      <p className="cdr-results__footer">
        Complete Section 3 to generate your final MDM documentation
      </p>
    </div>
  )
}
