/**
 * Report Templates Tests
 *
 * Tests useReportTemplates hook and template integration
 * in ResultDetailExpanded component.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReportTemplates } from '../hooks/useReportTemplates'
import ResultDetailExpanded from '../components/build-mode/shared/ResultDetailExpanded'
import type { TestDefinition } from '../types/libraries'
import type { TestResult } from '../types/encounter'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

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

describe('useReportTemplates', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('starts with empty templates', () => {
    const { result } = renderHook(() => useReportTemplates())
    expect(result.current.templates).toEqual([])
  })

  it('saves a new template', () => {
    const { result } = renderHook(() => useReportTemplates())

    act(() => {
      result.current.saveTemplate('ecg', 'Normal ECG', 'NSR, normal intervals', 'unremarkable')
    })

    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0].testId).toBe('ecg')
    expect(result.current.templates[0].name).toBe('Normal ECG')
    expect(result.current.templates[0].text).toBe('NSR, normal intervals')
    expect(result.current.templates[0].defaultStatus).toBe('unremarkable')
  })

  it('deletes a template', () => {
    const { result } = renderHook(() => useReportTemplates())

    act(() => {
      result.current.saveTemplate('ecg', 'Normal ECG', 'NSR')
    })

    const id = result.current.templates[0].id

    act(() => {
      result.current.deleteTemplate(id)
    })

    expect(result.current.templates).toHaveLength(0)
  })

  it('filters templates by test ID', () => {
    const { result } = renderHook(() => useReportTemplates())

    act(() => {
      result.current.saveTemplate('ecg', 'Normal ECG', 'NSR')
      result.current.saveTemplate('troponin', 'Normal Troponin', '<0.04')
      result.current.saveTemplate('ecg', 'AFib', 'Atrial fibrillation')
    })

    const ecgTemplates = result.current.getTemplatesForTest('ecg')
    expect(ecgTemplates).toHaveLength(2)
    expect(ecgTemplates[0].name).toBe('Normal ECG')
    expect(ecgTemplates[1].name).toBe('AFib')

    const troponinTemplates = result.current.getTemplatesForTest('troponin')
    expect(troponinTemplates).toHaveLength(1)
  })
})

describe('ResultDetailExpanded - Report Templates', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('shows templates for the matching test', () => {
    // Pre-populate localStorage with a template
    localStorageMock.setItem('mdm-report-templates', JSON.stringify([
      { id: 'rt_1', testId: 'ecg', name: 'Normal ECG', text: 'NSR, normal intervals', defaultStatus: 'unremarkable' },
    ]))

    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('Templates')).toBeDefined()
    expect(screen.getByText('Normal ECG')).toBeDefined()
  })

  it('applies template text to notes on click', () => {
    localStorageMock.setItem('mdm-report-templates', JSON.stringify([
      { id: 'rt_1', testId: 'ecg', name: 'Normal ECG', text: 'NSR, normal intervals', defaultStatus: 'unremarkable' },
    ]))

    const onResultChange = vi.fn()
    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={onResultChange}
      />
    )

    fireEvent.click(screen.getByTestId('apply-template-rt_1'))
    expect(onResultChange).toHaveBeenCalledWith({
      status: 'unremarkable',
      notes: 'NSR, normal intervals',
    })
  })

  it('does not show templates section when none exist for test', () => {
    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.queryByText('Templates')).toBeNull()
  })

  it('shows save template button when notes are present', () => {
    const result: TestResult = { status: 'abnormal', notes: 'ST elevation in V1-V4' }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByTestId('save-template-btn-ecg')).toBeDefined()
  })

  it('does not show save template button when notes are empty', () => {
    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.queryByTestId('save-template-btn-ecg')).toBeNull()
  })

  it('save template flow: click save, enter name, confirm', () => {
    const result: TestResult = { status: 'abnormal', notes: 'ST elevation in V1-V4' }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('save-template-btn-ecg'))
    const nameInput = screen.getByTestId('template-name-input-ecg')
    fireEvent.change(nameInput, { target: { value: 'STEMI Pattern' } })
    fireEvent.click(screen.getByTestId('confirm-save-template-ecg'))

    // Verify template was saved to localStorage
    const stored = JSON.parse(localStorageMock.getItem('mdm-report-templates') || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('STEMI Pattern')
    expect(stored[0].text).toBe('ST elevation in V1-V4')
    expect(stored[0].testId).toBe('ecg')
  })

  it('deletes a template from the list', () => {
    localStorageMock.setItem('mdm-report-templates', JSON.stringify([
      { id: 'rt_1', testId: 'ecg', name: 'Normal ECG', text: 'NSR', defaultStatus: 'unremarkable' },
    ]))

    const result: TestResult = { status: 'abnormal', notes: null }
    render(
      <ResultDetailExpanded
        testDef={mockEcgTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('delete-template-rt_1'))
    // Template should be removed
    expect(screen.queryByText('Normal ECG')).toBeNull()
  })

  it('shows value input for quantitative tests', () => {
    const result: TestResult = { status: 'abnormal', notes: null, value: null }
    render(
      <ResultDetailExpanded
        testDef={mockTroponinTest}
        result={result}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/Value for Troponin/i)).toBeDefined()
    expect(screen.getByText('ng/mL')).toBeDefined()
  })
})
