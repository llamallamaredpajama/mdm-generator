/**
 * Report Templates - Component Integration Tests
 *
 * Tests ResultDetailExpanded component's template UI.
 * Hook CRUD is tested in useReportTemplates.test.tsx.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TestDefinition } from '../types/libraries'
import type { TestResult } from '../types/encounter'

// ── Mock the hook ────────────────────────────────────────────────────────

const mockSaveTemplate = vi.fn()
const mockDeleteTemplate = vi.fn()

const { mockTemplates } = vi.hoisted(() => ({
  mockTemplates: {
    current: [] as Array<{
      id: string
      testId: string
      name: string
      text: string
      defaultStatus: string
      createdAt: string
      usageCount: number
    }>,
  },
}))

vi.mock('../hooks/useReportTemplates', () => ({
  useReportTemplates: () => ({
    templates: mockTemplates.current,
    loading: false,
    getTemplatesForTest: (testId: string) =>
      mockTemplates.current.filter((t: { testId: string }) => t.testId === testId),
    saveTemplate: mockSaveTemplate,
    deleteTemplate: mockDeleteTemplate,
    incrementUsage: vi.fn(),
  }),
}))

import ResultDetailExpanded from '../components/build-mode/shared/ResultDetailExpanded'

// ── Test Data ────────────────────────────────────────────────────────────

const mockEcgTest: TestDefinition = {
  id: 'ecg',
  name: 'ECG',
  category: 'procedures_poc',
  subcategory: 'cardiac',
  commonIndications: ['chest pain'],
  unit: null,
  normalRange: null,
  quickFindings: ['ST elevation', 'ST depression', 'T-wave inversion'],
  feedsCdrs: ['heart'],
}

const mockTroponinTest: TestDefinition = {
  id: 'troponin',
  name: 'Troponin',
  category: 'labs',
  subcategory: 'cardiac',
  commonIndications: ['chest pain'],
  unit: 'ng/mL',
  normalRange: '<0.04',
  quickFindings: null,
  feedsCdrs: ['heart'],
}

describe('ResultDetailExpanded - Report Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTemplates.current = []
  })

  it('shows templates for the matching test', () => {
    mockTemplates.current = [
      {
        id: 'rt_1',
        testId: 'ecg',
        name: 'Normal ECG',
        text: 'NSR, normal intervals',
        defaultStatus: 'unremarkable',
        createdAt: '',
        usageCount: 0,
      },
    ]

    const result: TestResult = { status: 'abnormal', notes: null }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    expect(screen.getByText('Templates')).toBeDefined()
    expect(screen.getByText('Normal ECG')).toBeDefined()
  })

  it('applies template text to notes on click', () => {
    mockTemplates.current = [
      {
        id: 'rt_1',
        testId: 'ecg',
        name: 'Normal ECG',
        text: 'NSR, normal intervals',
        defaultStatus: 'unremarkable',
        createdAt: '',
        usageCount: 0,
      },
    ]

    const onResultChange = vi.fn()
    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={onResultChange}
      />,
    )

    fireEvent.click(screen.getByTestId('apply-template-rt_1'))
    expect(onResultChange).toHaveBeenCalledWith({
      status: 'unremarkable',
      notes: 'NSR, normal intervals',
    })
  })

  it('does not show templates section when none exist for test', () => {
    const result: TestResult = { status: 'abnormal', notes: null }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    expect(screen.queryByText('Templates')).toBeNull()
  })

  it('shows save template button when notes are present', () => {
    const result: TestResult = { status: 'abnormal', notes: 'ST elevation in V1-V4' }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    expect(screen.getByTestId('save-template-btn-ecg')).toBeDefined()
  })

  it('does not show save template button when notes are empty', () => {
    const result: TestResult = { status: 'abnormal', notes: null }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    expect(screen.queryByTestId('save-template-btn-ecg')).toBeNull()
  })

  it('save template flow: click save, enter name, confirm', () => {
    const result: TestResult = { status: 'abnormal', notes: 'ST elevation in V1-V4' }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    fireEvent.click(screen.getByTestId('save-template-btn-ecg'))
    const nameInput = screen.getByTestId('template-name-input-ecg')
    fireEvent.change(nameInput, { target: { value: 'STEMI Pattern' } })
    fireEvent.click(screen.getByTestId('confirm-save-template-ecg'))

    expect(mockSaveTemplate).toHaveBeenCalledWith(
      'ecg',
      'STEMI Pattern',
      'ST elevation in V1-V4',
      'abnormal',
    )
  })

  it('deletes a template from the list', () => {
    mockTemplates.current = [
      {
        id: 'rt_1',
        testId: 'ecg',
        name: 'Normal ECG',
        text: 'NSR',
        defaultStatus: 'unremarkable',
        createdAt: '',
        usageCount: 0,
      },
    ]

    const result: TestResult = { status: 'abnormal', notes: null }
    render(<ResultDetailExpanded testDef={mockEcgTest} result={result} onResultChange={vi.fn()} />)

    fireEvent.click(screen.getByTestId('delete-template-rt_1'))
    expect(mockDeleteTemplate).toHaveBeenCalledWith('rt_1')
  })

  it('shows value input for quantitative tests', () => {
    const result: TestResult = { status: 'abnormal', notes: null, value: null }
    render(
      <ResultDetailExpanded testDef={mockTroponinTest} result={result} onResultChange={vi.fn()} />,
    )

    expect(screen.getByLabelText(/Value for Troponin/i)).toBeDefined()
    expect(screen.getByText('ng/mL')).toBeDefined()
  })
})
