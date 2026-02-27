/**
 * OrdersCard Component Tests
 *
 * Tests rendering, recommended orders, orderset integration,
 * category sections, and action callbacks.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OrdersCard from '../components/build-mode/shared/OrdersCard'
import type { TestDefinition } from '../types/libraries'
import type { OrderSet } from '../types/userProfile'

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
    feedsCdrs: [],
  },
]

const mockOrderSet: OrderSet = {
  id: 'os-1',
  name: 'Chest Pain Workup',
  tests: ['troponin', 'cbc'],
  tags: ['chest_pain'],
  createdAt: '2026-01-01T00:00:00Z',
  usageCount: 3,
}

const defaultProps = {
  tests: mockTests,
  recommendedTestIds: ['troponin'],
  selectedTests: [] as string[],
  onSelectionChange: vi.fn(),
  onOpenOrdersetManager: vi.fn(),
  onAcceptAllRecommended: vi.fn(),
  onAcceptSelected: vi.fn(),
  loading: false,
  orderSets: [mockOrderSet],
  onApplyOrderSet: vi.fn(),
}

describe('OrdersCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state when loading=true', () => {
    render(<OrdersCard {...defaultProps} loading={true} />)
    expect(screen.getByText('Loading test library...')).toBeDefined()
  })

  it('renders recommended section when recommendedTestIds has items', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText('Recommended Orders')).toBeDefined()
    expect(screen.getByText('Troponin')).toBeDefined()
  })

  it('hides recommended section when no recommended test IDs', () => {
    render(<OrdersCard {...defaultProps} recommendedTestIds={[]} />)
    expect(screen.queryByText('Recommended Orders')).toBeNull()
  })

  it('Accept All Recommended calls onAcceptAllRecommended', () => {
    render(<OrdersCard {...defaultProps} />)
    fireEvent.click(screen.getByText('Accept All Recommended'))
    expect(defaultProps.onAcceptAllRecommended).toHaveBeenCalledOnce()
  })

  it('Accept Selected calls onAcceptSelected when tests selected', () => {
    render(<OrdersCard {...defaultProps} selectedTests={['troponin']} />)
    fireEvent.click(screen.getByText('Accept Selected'))
    expect(defaultProps.onAcceptSelected).toHaveBeenCalledOnce()
  })

  it('Accept Selected button is disabled when no tests selected', () => {
    render(<OrdersCard {...defaultProps} selectedTests={[]} />)
    const btn = screen.getByText('Accept Selected')
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('toggles individual test on checkbox click', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrdersCard {...defaultProps} selectedTests={[]} onSelectionChange={onSelectionChange} />,
    )
    // Click the troponin checkbox in the recommended section
    const checkbox = screen.getByLabelText(/Troponin/i)
    fireEvent.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin'])
  })

  it('renders orderset section with orderset names', () => {
    render(<OrdersCard {...defaultProps} />)
    // Expand ordersets section
    fireEvent.click(screen.getByText(/Ordersets/))
    expect(screen.getByText('Chest Pain Workup')).toBeDefined()
  })

  it('orderset checkbox toggles all orderset tests on/off', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrdersCard {...defaultProps} selectedTests={[]} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(screen.getByText(/Ordersets/))
    // Click the orderset checkbox
    const osCheckbox = document.getElementById('orders-os-os-1') as HTMLInputElement
    fireEvent.click(osCheckbox)
    // Should merge orderset tests into selection
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin', 'cbc'])
  })

  it('calls onOpenOrdersetManager when Edit button clicked', () => {
    render(<OrdersCard {...defaultProps} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(defaultProps.onOpenOrdersetManager).toHaveBeenCalledWith('browse')
  })

  it('expands/collapses category sections on click', () => {
    render(<OrdersCard {...defaultProps} />)
    // Labs category exists; click to expand
    const labsHeader = screen.getByText(/Labs \(2\)/)
    fireEvent.click(labsHeader)
    // Now CBC and Troponin should be visible in the category list
    expect(screen.getByText('CBC')).toBeDefined()
    // Click again to collapse
    fireEvent.click(labsHeader)
  })

  it('renders category test counts', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText(/Labs \(2\)/)).toBeDefined()
    expect(screen.getByText(/Imaging \(1\)/)).toBeDefined()
  })

  it('renders frequently used section', () => {
    const freqUsed: OrderSet = {
      id: 'freq-1',
      name: '__frequently_used__',
      tests: ['troponin'],
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
      usageCount: 10,
    }
    render(<OrdersCard {...defaultProps} orderSets={[mockOrderSet, freqUsed]} />)
    expect(screen.getByText('Frequently Used')).toBeDefined()
  })

  it('calls onApplyOrderSet when orderset apply toggled on', () => {
    const onApplyOrderSet = vi.fn()
    render(<OrdersCard {...defaultProps} selectedTests={[]} onApplyOrderSet={onApplyOrderSet} />)
    fireEvent.click(screen.getByText(/Ordersets/))
    const osCheckbox = document.getElementById('orders-os-os-1') as HTMLInputElement
    fireEvent.click(osCheckbox)
    expect(onApplyOrderSet).toHaveBeenCalledWith(mockOrderSet)
  })
})
