/**
 * PasteLabModal Component
 *
 * Modal for pasting raw lab/EHR text. AI parses the text and maps
 * values to ordered tests, showing a preview before applying.
 * States: idle → loading → preview → (apply or cancel)
 */

import { useState, useCallback, useEffect } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import type { TestResult } from '../../../types/encounter'
import { parseResults, type ParsedResultItem } from '../../../lib/api'
import { useAuthToken } from '../../../lib/firebase'
import './PasteLabModal.css'

type ModalState = 'idle' | 'loading' | 'preview' | 'error'

interface PasteLabModalProps {
  isOpen: boolean
  onClose: () => void
  encounterId: string
  orderedTestIds: string[]
  testLibrary: TestDefinition[]
  onApply: (results: Record<string, TestResult>) => void
  /** When provided, skip idle state and show preview directly (used by dictation mode) */
  initialParsedResults?: ParsedResultItem[]
  /** Unmatched text from external parse (used with initialParsedResults) */
  initialUnmatchedText?: string[]
  /** Override modal title (e.g., "Dictation Results" instead of "Paste Lab Results") */
  title?: string
}

export default function PasteLabModal({
  isOpen,
  onClose,
  encounterId,
  orderedTestIds,
  testLibrary,
  onApply,
  initialParsedResults,
  initialUnmatchedText,
  title,
}: PasteLabModalProps) {
  const token = useAuthToken()
  const hasInitialResults = initialParsedResults && initialParsedResults.length > 0
  const [state, setState] = useState<ModalState>(hasInitialResults ? 'preview' : 'idle')
  const [pastedText, setPastedText] = useState('')
  const [parsedResults, setParsedResults] = useState<ParsedResultItem[]>(initialParsedResults ?? [])
  const [unmatchedText, setUnmatchedText] = useState<string[]>(initialUnmatchedText ?? [])
  const [errorMessage, setErrorMessage] = useState('')

  // Reset state when modal opens/closes, or initialize from external results
  useEffect(() => {
    if (!isOpen) {
      setState('idle')
      setPastedText('')
      setParsedResults([])
      setUnmatchedText([])
      setErrorMessage('')
    } else if (initialParsedResults && initialParsedResults.length > 0) {
      // External results provided — jump to preview
      setParsedResults(initialParsedResults)
      setUnmatchedText(initialUnmatchedText ?? [])
      setState('preview')
    }
  }, [isOpen, initialParsedResults, initialUnmatchedText])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleParse = useCallback(async () => {
    if (!token || !pastedText.trim()) return

    setState('loading')
    setErrorMessage('')

    try {
      const res = await parseResults(encounterId, pastedText.trim(), orderedTestIds, token)
      setParsedResults(res.parsed)
      setUnmatchedText(res.unmatchedText ?? [])
      setState(res.parsed.length > 0 ? 'preview' : 'error')
      if (res.parsed.length === 0) {
        setErrorMessage('No results could be matched to your ordered tests. Check that the pasted text contains lab values for tests you have selected.')
      }
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse results. Please try again.')
    }
  }, [token, pastedText, encounterId, orderedTestIds])

  const handleApply = useCallback(() => {
    const updates: Record<string, TestResult> = {}

    for (const item of parsedResults) {
      const testDef = testLibrary.find((t) => t.id === item.testId)
      updates[item.testId] = {
        status: item.status,
        quickFindings: item.notes ? [item.notes] : [],
        notes: item.notes ?? null,
        value: item.value ?? null,
        unit: item.unit ?? testDef?.unit ?? null,
      }
    }

    onApply(updates)
    onClose()
  }, [parsedResults, testLibrary, onApply, onClose])

  if (!isOpen) return null

  return (
    <div className="paste-lab-overlay" onClick={onClose}>
      <div className="paste-lab-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title ?? 'Paste Lab Results'}>
        {/* Header */}
        <div className="paste-lab-modal__header">
          <h3 className="paste-lab-modal__title">{title ?? 'Paste Lab Results'}</h3>
          <button type="button" className="paste-lab-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="paste-lab-modal__body">
          {state === 'idle' && (
            <>
              <p className="paste-lab-modal__hint">
                Paste raw lab or imaging results from your EHR. AI will map values to your ordered tests.
              </p>
              <textarea
                className="paste-lab-modal__textarea"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste lab results here..."
                rows={6}
                autoFocus
                data-testid="paste-textarea"
              />
            </>
          )}

          {state === 'loading' && (
            <div className="paste-lab-modal__loading" data-testid="paste-loading">
              <div className="paste-lab-modal__spinner" />
              <span>Parsing results...</span>
            </div>
          )}

          {state === 'preview' && (
            <div className="paste-lab-modal__preview" data-testid="paste-preview">
              <p className="paste-lab-modal__preview-summary">
                Matched {parsedResults.length} test{parsedResults.length !== 1 ? 's' : ''} from pasted text
              </p>
              <table className="paste-lab-modal__table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedResults.map((item) => (
                    <tr key={item.testId} data-testid={`parsed-row-${item.testId}`}>
                      <td className="paste-lab-modal__cell-name">{item.testName}</td>
                      <td>
                        <span className={`paste-lab-modal__badge paste-lab-modal__badge--${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="paste-lab-modal__cell-value">
                        {item.value ? `${item.value}${item.unit ? ' ' + item.unit : ''}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {unmatchedText.length > 0 && (
                <div className="paste-lab-modal__unmatched" data-testid="unmatched-text">
                  <p className="paste-lab-modal__unmatched-label">Not matched:</p>
                  <ul>
                    {unmatchedText.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {state === 'error' && (
            <div className="paste-lab-modal__error" data-testid="paste-error">
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="paste-lab-modal__actions">
          {state === 'idle' && (
            <>
              <button
                type="button"
                className="paste-lab-modal__btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="paste-lab-modal__btn paste-lab-modal__btn--primary"
                onClick={handleParse}
                disabled={!pastedText.trim()}
                data-testid="parse-btn"
              >
                Parse Results
              </button>
            </>
          )}

          {state === 'preview' && (
            <>
              <button
                type="button"
                className="paste-lab-modal__btn"
                onClick={hasInitialResults
                  ? onClose
                  : () => { setState('idle'); setParsedResults([]); setUnmatchedText([]); setErrorMessage('') }
                }
              >
                {hasInitialResults ? 'Cancel' : 'Back'}
              </button>
              <button
                type="button"
                className="paste-lab-modal__btn paste-lab-modal__btn--primary"
                onClick={handleApply}
                data-testid="apply-btn"
              >
                Apply {parsedResults.length} Result{parsedResults.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {state === 'error' && (
            <button
              type="button"
              className="paste-lab-modal__btn"
              onClick={() => setState('idle')}
            >
              Try Again
            </button>
          )}

          {state === 'loading' && (
            <button type="button" className="paste-lab-modal__btn" disabled>
              Parsing...
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
