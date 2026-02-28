/**
 * OrdersCard Component Tests
 *
 * Tests rendering, two-panel layout, recommended orders, orderset integration,
 * category sections with subcategory grouping, and action callbacks.
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
    subcategory: 'head_neck',
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

  it('renders two-panel layout with Orders and Order Sets headers', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText('Orders')).toBeDefined()
    expect(screen.getByText('Order Sets')).toBeDefined()
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

  it('renders orderset in right panel with Manage button', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText('Manage')).toBeDefined()
  })

  it('calls onOpenOrdersetManager when Manage button clicked', () => {
    render(<OrdersCard {...defaultProps} />)
    fireEvent.click(screen.getByText('Manage'))
    expect(defaultProps.onOpenOrdersetManager).toHaveBeenCalledWith('browse')
  })

  it('renders All Order Sets section with orderset names when expanded', () => {
    render(<OrdersCard {...defaultProps} />)
    // Expand the All Order Sets section
    fireEvent.click(screen.getByText(/All Order Sets/))
    expect(screen.getByText('Chest Pain Workup')).toBeDefined()
  })

  it('orderset checkbox toggles all orderset tests on/off', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrdersCard {...defaultProps} selectedTests={[]} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(screen.getByText(/All Order Sets/))
    // Click the orderset checkbox
    const osCheckbox = document.getElementById('orders-os-os-1') as HTMLInputElement
    fireEvent.click(osCheckbox)
    // Should merge orderset tests into selection
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin', 'cbc'])
  })

  it('expands/collapses category sections on click', () => {
    render(<OrdersCard {...defaultProps} />)
    // Labs category exists; click to expand
    const labsHeader = screen.getByText(/Labs \(2\)/)
    fireEvent.click(labsHeader)
    // Subcategory headers should be visible
    expect(screen.getByText('Hematology')).toBeDefined()
    // Expand the Hematology subcategory to see individual tests
    fireEvent.click(screen.getByText('Hematology'))
    expect(screen.getByText('CBC')).toBeDefined()
    // Click Labs header again to collapse
    fireEvent.click(labsHeader)
  })

  it('renders category test counts', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText(/Labs \(2\)/)).toBeDefined()
    expect(screen.getByText(/Imaging \(1\)/)).toBeDefined()
  })

  it('renders frequently used orders section', () => {
    const freqUsed: OrderSet = {
      id: 'freq-1',
      name: '__frequently_used__',
      tests: ['troponin'],
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
      usageCount: 10,
    }
    render(<OrdersCard {...defaultProps} orderSets={[mockOrderSet, freqUsed]} />)
    expect(screen.getByText('Frequently Used Orders')).toBeDefined()
  })

  it('calls onApplyOrderSet when orderset apply toggled on', () => {
    const onApplyOrderSet = vi.fn()
    render(<OrdersCard {...defaultProps} selectedTests={[]} onApplyOrderSet={onApplyOrderSet} />)
    fireEvent.click(screen.getByText(/All Order Sets/))
    const osCheckbox = document.getElementById('orders-os-os-1') as HTMLInputElement
    fireEvent.click(osCheckbox)
    expect(onApplyOrderSet).toHaveBeenCalledWith(mockOrderSet)
  })

  it('renders select/deselect all checkbox in recommended section', () => {
    render(<OrdersCard {...defaultProps} />)
    const selectAllCheckbox = document.getElementById('orders-rec-select-all') as HTMLInputElement
    expect(selectAllCheckbox).toBeDefined()
    expect(selectAllCheckbox).not.toBeNull()
  })

  it('select/deselect all toggles all recommended tests', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrdersCard {...defaultProps} selectedTests={[]} onSelectionChange={onSelectionChange} />,
    )
    const selectAllCheckbox = document.getElementById('orders-rec-select-all') as HTMLInputElement
    fireEvent.click(selectAllCheckbox)
    // Should select all recommended test IDs
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin'])
  })

  it('shows Create Orderset button in left panel', () => {
    render(<OrdersCard {...defaultProps} />)
    expect(screen.getByText('Create Orderset')).toBeDefined()
  })

  it('shows selected count badge when tests are selected', () => {
    render(<OrdersCard {...defaultProps} selectedTests={['troponin', 'cbc']} />)
    expect(screen.getByText('2 selected')).toBeDefined()
  })

  it('renders subcategory groups when category expanded', () => {
    render(<OrdersCard {...defaultProps} />)
    // Expand Labs
    fireEvent.click(screen.getByText(/Labs \(2\)/))
    // Should show subcategory headers (title-cased)
    expect(screen.getByText('Cardiac')).toBeDefined()
    expect(screen.getByText('Hematology')).toBeDefined()
  })
})
