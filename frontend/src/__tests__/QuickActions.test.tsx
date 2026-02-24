/**
 * Quick Actions Tests (BM-4.2)
 *
 * Tests the "All Results Unremarkable" and "Mark remaining unremarkable"
 * batch action buttons. Uses isolated unit tests with mock callbacks
 * rather than full EncounterEditor integration tests (those require
 * Firebase context and are expensive).
 *
 * These tests validate the batch update logic by testing the handlers
 * directly through a minimal wrapper component.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useState, useCallback } from 'react'
import type { TestResult } from '../types/encounter'
import type { TestDefinition } from '../types/libraries'

// --- Test fixtures ---

const testDefs: TestDefinition[] = [
  {
    id: 'cbc',
    name: 'CBC',
    category: 'labs',
    subcategory: 'hematology',
    commonIndications: ['infection'],
    unit: null,
    normalRange: null,
    quickFindings: ['Elevated WBC', 'Low Hgb'],
    feedsCdrs: [],
  },
  {
    id: 'troponin',
    name: 'Troponin',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: ['Elevated'],
    feedsCdrs: ['heart'],
  },
  {
    id: 'ct_head',
    name: 'CT Head',
    category: 'imaging',
    subcategory: 'neuro',
    commonIndications: ['headache'],
    unit: null,
    normalRange: null,
    quickFindings: ['No acute finding', 'SDH'],
    feedsCdrs: [],
  },
]

const selectedTestIds = ['cbc', 'troponin', 'ct_head']

/**
 * Minimal test wrapper that mimics EncounterEditor's batch update logic.
 * Exposes the resulting testResults state for assertions.
 */
function QuickActionsTestWrapper({
  initialResults,
}: {
  initialResults: Record<string, TestResult>
}) {
  const [testResults, setTestResults] = useState(initialResults)

  const handleMarkAllUnremarkable = useCallback(() => {
    const updates: Record<string, TestResult> = {}
    for (const testId of selectedTestIds) {
      const testDef = testDefs.find((t) => t.id === testId)
      updates[testId] = {
        status: 'unremarkable',
        quickFindings: [],
        notes: null,
        value: testResults[testId]?.value ?? null,
        unit: testDef?.unit ?? null,
      }
    }
    setTestResults((prev) => ({ ...prev, ...updates }))
  }, [testResults])

  const handleMarkRemainingUnremarkable = useCallback(() => {
    const updates: Record<string, TestResult> = {}
    for (const testId of selectedTestIds) {
      const current = testResults[testId]
      if (!current || current.status === 'pending') {
        const testDef = testDefs.find((t) => t.id === testId)
        updates[testId] = {
          status: 'unremarkable',
          quickFindings: [],
          notes: null,
          value: null,
          unit: testDef?.unit ?? null,
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      setTestResults((prev) => ({ ...prev, ...updates }))
    }
  }, [testResults])

  const pendingCount = selectedTestIds.filter(
    (id) => !testResults[id] || testResults[id]?.status === 'pending'
  ).length

  return (
    <div>
      <button
        type="button"
        data-testid="mark-all-unremarkable"
        onClick={handleMarkAllUnremarkable}
      >
        All Results Unremarkable
      </button>

      {pendingCount > 0 && (
        <button
          type="button"
          data-testid="mark-remaining-unremarkable"
          onClick={handleMarkRemainingUnremarkable}
        >
          Mark remaining unremarkable
        </button>
      )}

      {/* Expose state for test assertions */}
      <div data-testid="results-state">
        {JSON.stringify(testResults)}
      </div>

      {selectedTestIds.map((id) => (
        <div key={id} data-testid={`status-${id}`}>
          {testResults[id]?.status ?? 'pending'}
        </div>
      ))}
    </div>
  )
}

describe('Quick Actions', () => {
  it('"All Unremarkable" marks all tests unremarkable', () => {
    render(<QuickActionsTestWrapper initialResults={{}} />)

    fireEvent.click(screen.getByTestId('mark-all-unremarkable'))

    expect(screen.getByTestId('status-cbc').textContent).toBe('unremarkable')
    expect(screen.getByTestId('status-troponin').textContent).toBe('unremarkable')
    expect(screen.getByTestId('status-ct_head').textContent).toBe('unremarkable')
  })

  it('"All Unremarkable" overrides abnormal results', () => {
    render(
      <QuickActionsTestWrapper
        initialResults={{
          cbc: { status: 'abnormal', quickFindings: ['Elevated WBC'], notes: 'high', value: null, unit: null },
          troponin: { status: 'unremarkable', quickFindings: [], notes: null, value: '0.02', unit: 'ng/mL' },
        }}
      />
    )

    fireEvent.click(screen.getByTestId('mark-all-unremarkable'))

    expect(screen.getByTestId('status-cbc').textContent).toBe('unremarkable')
    expect(screen.getByTestId('status-troponin').textContent).toBe('unremarkable')
    expect(screen.getByTestId('status-ct_head').textContent).toBe('unremarkable')
  })

  it('"All Unremarkable" preserves existing value for tests with unit', () => {
    render(
      <QuickActionsTestWrapper
        initialResults={{
          troponin: { status: 'abnormal', quickFindings: ['Elevated'], notes: null, value: '0.15', unit: 'ng/mL' },
        }}
      />
    )

    fireEvent.click(screen.getByTestId('mark-all-unremarkable'))

    const state = JSON.parse(screen.getByTestId('results-state').textContent!)
    expect(state.troponin.value).toBe('0.15')
    expect(state.troponin.unit).toBe('ng/mL')
  })

  it('"Mark remaining" marks only pending tests', () => {
    render(
      <QuickActionsTestWrapper
        initialResults={{
          cbc: { status: 'abnormal', quickFindings: ['Elevated WBC'], notes: null, value: null, unit: null },
        }}
      />
    )

    fireEvent.click(screen.getByTestId('mark-remaining-unremarkable'))

    // CBC should remain abnormal
    expect(screen.getByTestId('status-cbc').textContent).toBe('abnormal')
    // Others should be unremarkable
    expect(screen.getByTestId('status-troponin').textContent).toBe('unremarkable')
    expect(screen.getByTestId('status-ct_head').textContent).toBe('unremarkable')
  })

  it('"Mark remaining" button hidden when no pending tests', () => {
    render(
      <QuickActionsTestWrapper
        initialResults={{
          cbc: { status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null },
          troponin: { status: 'abnormal', quickFindings: [], notes: null, value: '0.15', unit: 'ng/mL' },
          ct_head: { status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null },
        }}
      />
    )

    expect(screen.queryByTestId('mark-remaining-unremarkable')).toBeNull()
  })

  it('"Mark remaining" button visible when some tests are pending', () => {
    render(
      <QuickActionsTestWrapper
        initialResults={{
          cbc: { status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null },
        }}
      />
    )

    expect(screen.getByTestId('mark-remaining-unremarkable')).toBeDefined()
  })
})
