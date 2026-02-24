/**
 * OrderSelector Component Tests
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OrderSelector from '../components/build-mode/shared/OrderSelector'
import type { TestDefinition } from '../types/libraries'

const mockTests: TestDefinition[] = [
  {
    id: 'troponin',
    name: 'Troponin',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
  {
    id: 'cbc',
    name: 'CBC',
    category: 'labs',
    subcategory: 'hematology',
    commonIndications: ['infection'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: [],
  },
  {
    id: 'ct_head',
    name: 'CT Head',
    category: 'imaging',
    subcategory: 'neuro',
    commonIndications: ['head injury'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: ['pecarn'],
  },
  {
    id: 'ecg',
    name: 'ECG',
    category: 'procedures_poc',
    subcategory: 'cardiac',
    commonIndications: ['chest pain'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
]

const defaultProps = {
  tests: mockTests,
  selectedTests: [] as string[],
  recommendedTestIds: ['troponin', 'ecg'],
  onSelectionChange: vi.fn(),
  onBack: vi.fn(),
}

describe('OrderSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tests grouped by category', () => {
    render(<OrderSelector {...defaultProps} />)

    expect(screen.getByText('Labs')).toBeDefined()
    expect(screen.getByText('Imaging')).toBeDefined()
    expect(screen.getByText('Procedures / POC')).toBeDefined()
    expect(screen.getByText('Troponin')).toBeDefined()
    expect(screen.getByText('CBC')).toBeDefined()
    expect(screen.getByText('CT Head')).toBeDefined()
    expect(screen.getByText('ECG')).toBeDefined()
  })

  it('category "Select All" works', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrderSelector
        {...defaultProps}
        onSelectionChange={onSelectionChange}
      />
    )

    // Click "Select All" for Labs category
    const selectAllButtons = screen.getAllByText('Select All')
    // First one should be Labs
    fireEvent.click(selectAllButtons[0])

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.arrayContaining(['troponin', 'cbc'])
    )
  })

  it('category "Clear All" works', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrderSelector
        {...defaultProps}
        selectedTests={['troponin', 'cbc', 'ct_head']}
        onSelectionChange={onSelectionChange}
      />
    )

    // Click "Clear All" for Labs category
    const clearAllButtons = screen.getAllByText('Clear All')
    fireEvent.click(clearAllButtons[0])

    // Should remove troponin and cbc (labs) but keep ct_head (imaging)
    expect(onSelectionChange).toHaveBeenCalledWith(['ct_head'])
  })

  it('"Back" button calls onBack callback', () => {
    const onBack = vi.fn()
    render(<OrderSelector {...defaultProps} onBack={onBack} />)

    fireEvent.click(screen.getByText('← Back to Dashboard'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('recommended tests show AI badge', () => {
    render(<OrderSelector {...defaultProps} />)

    // Troponin and ECG are recommended
    const aiBadges = screen.getAllByText('AI')
    expect(aiBadges.length).toBe(2)
  })

  it('shows selected count with category breakdown', () => {
    render(
      <OrderSelector
        {...defaultProps}
        selectedTests={['troponin', 'cbc', 'ct_head']}
      />
    )

    expect(screen.getByText(/3 total/)).toBeDefined()
    expect(screen.getByText(/2 Labs/)).toBeDefined()
    expect(screen.getByText(/1 Imaging/)).toBeDefined()
  })

  it('toggling a test checkbox calls onSelectionChange', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrderSelector
        {...defaultProps}
        selectedTests={['troponin']}
        onSelectionChange={onSelectionChange}
      />
    )

    // Check CBC (add to selection)
    fireEvent.click(screen.getByLabelText(/CBC/))
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin', 'cbc'])
  })

  it('categories are collapsible — clicking header hides tests', () => {
    render(<OrderSelector {...defaultProps} />)

    // All categories start open — Troponin should be visible
    expect(screen.getByText('Troponin')).toBeDefined()

    // Click the Labs category header to collapse it
    fireEvent.click(screen.getByText('Labs'))

    // Labs tests should be hidden
    expect(screen.queryByText('Troponin')).toBeNull()
    expect(screen.queryByText('CBC')).toBeNull()

    // Other categories still visible
    expect(screen.getByText('CT Head')).toBeDefined()
    expect(screen.getByText('ECG')).toBeDefined()
  })

  it('collapsed category can be re-expanded', () => {
    render(<OrderSelector {...defaultProps} />)

    // Collapse Labs
    fireEvent.click(screen.getByText('Labs'))
    expect(screen.queryByText('Troponin')).toBeNull()

    // Re-expand Labs
    fireEvent.click(screen.getByText('Labs'))
    expect(screen.getByText('Troponin')).toBeDefined()
  })
})
