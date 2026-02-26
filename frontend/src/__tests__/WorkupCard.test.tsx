/**
 * WorkupCard Component Tests
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import WorkupCard from '../components/build-mode/shared/WorkupCard'
import type { TestDefinition } from '../types/libraries'

const mockTests: TestDefinition[] = [
  {
    id: 'troponin',
    name: 'Troponin',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain', 'mi risk'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
  {
    id: 'ecg',
    name: 'ECG',
    category: 'procedures_poc',
    subcategory: 'cardiac',
    commonIndications: ['chest pain', 'arrhythmia'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
  {
    id: 'cbc',
    name: 'CBC',
    category: 'labs',
    subcategory: 'hematology',
    commonIndications: ['infection', 'anemia'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: [],
  },
]

const defaultProps = {
  tests: mockTests,
  recommendedTestIds: ['troponin', 'ecg'],
  selectedTests: [] as string[],
  onSelectionChange: vi.fn(),
  onOpenOrderSelector: vi.fn(),
  loading: false,
}

describe('WorkupCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recommended tests as checked checkboxes', () => {
    render(<WorkupCard {...defaultProps} selectedTests={['troponin', 'ecg']} />)

    const troponinCheckbox = screen.getByLabelText(/Troponin/i)
    const ecgCheckbox = screen.getByLabelText(/ECG/i)

    expect(troponinCheckbox).toBeDefined()
    expect(ecgCheckbox).toBeDefined()
    expect((troponinCheckbox as HTMLInputElement).checked).toBe(true)
    expect((ecgCheckbox as HTMLInputElement).checked).toBe(true)
  })

  it('"Accept All & Continue" checks all recommended tests and calls onAcceptContinue (B2)', () => {
    const onSelectionChange = vi.fn()
    const onAcceptContinue = vi.fn()
    render(
      <WorkupCard
        {...defaultProps}
        onSelectionChange={onSelectionChange}
        onAcceptContinue={onAcceptContinue}
      />,
    )

    fireEvent.click(screen.getByText('Accept All & Continue'))

    expect(onSelectionChange).toHaveBeenCalledWith(expect.arrayContaining(['troponin', 'ecg']))
    expect(onAcceptContinue).toHaveBeenCalledOnce()
  })

  it('individual checkbox toggle updates selection', () => {
    const onSelectionChange = vi.fn()
    render(
      <WorkupCard
        {...defaultProps}
        selectedTests={['troponin']}
        onSelectionChange={onSelectionChange}
      />,
    )

    // Uncheck troponin
    fireEvent.click(screen.getByLabelText(/Troponin/i))
    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('shows loading state while test library fetches', () => {
    render(<WorkupCard {...defaultProps} loading={true} tests={[]} recommendedTestIds={[]} />)
    expect(screen.getByText(/loading/i)).toBeDefined()
  })

  it('shows empty state when no tests match', () => {
    render(<WorkupCard {...defaultProps} recommendedTestIds={[]} />)
    expect(screen.getByText(/no recommended tests/i)).toBeDefined()
  })

  it('selected count displays correctly', () => {
    render(<WorkupCard {...defaultProps} selectedTests={['troponin', 'ecg']} />)
    expect(screen.getByText('2 selected')).toBeDefined()
  })

  it('calls onOpenOrderSelector when Edit is clicked', () => {
    const onOpenOrderSelector = vi.fn()
    render(<WorkupCard {...defaultProps} onOpenOrderSelector={onOpenOrderSelector} />)

    fireEvent.click(screen.getByText('Edit'))
    expect(onOpenOrderSelector).toHaveBeenCalledOnce()
  })

  it('shows header title', () => {
    render(<WorkupCard {...defaultProps} />)
    expect(screen.getByText('Recommended Workup')).toBeDefined()
  })

  it('shows category in muted text next to test name', () => {
    render(<WorkupCard {...defaultProps} selectedTests={['troponin']} />)
    // Troponin is a labs test
    expect(screen.getByText('Labs')).toBeDefined()
  })
})
