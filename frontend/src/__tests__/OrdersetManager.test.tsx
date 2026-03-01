/**
 * OrdersetManager Component Tests
 *
 * Tests modal behavior, search, test selection, orderset CRUD,
 * inline delete confirmation (Fix 1), and duplicate name/loading state (Fix 2).
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OrdersetManager from '../components/build-mode/shared/OrdersetManager'
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
    feedsCdrs: [],
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
  mode: 'browse' as const,
  tests: mockTests,
  selectedTests: [] as string[],
  recommendedTestIds: ['troponin'],
  onSelectionChange: vi.fn(),
  onClose: vi.fn(),
  onAcceptAllRecommended: vi.fn(),
  onAcceptSelected: vi.fn(),
  orderSets: [mockOrderSet],
  onSaveOrderSet: vi.fn().mockResolvedValue({
    id: 'new-os',
    name: 'New',
    tests: [],
    tags: [],
    createdAt: '',
    usageCount: 0,
  }),
  onUpdateOrderSet: vi.fn().mockResolvedValue(undefined),
  onDeleteOrderSet: vi.fn().mockResolvedValue(undefined),
}

describe('OrdersetManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with title and close button', () => {
    render(<OrdersetManager {...defaultProps} />)
    expect(screen.getByText('Orderset Manager')).toBeDefined()
    expect(screen.getByLabelText('Close')).toBeDefined()
  })

  it('closes on Escape key', () => {
    render(<OrdersetManager {...defaultProps} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('closes on X button click', () => {
    render(<OrdersetManager {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('filters tests by search query', () => {
    render(<OrdersetManager {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Search tests...')
    fireEvent.change(searchInput, { target: { value: 'troponin' } })
    // Only troponin should be visible in the list
    expect(screen.getByText('Troponin')).toBeDefined()
    expect(screen.queryByText('CBC')).toBeNull()
    expect(screen.queryByText('CT Head')).toBeNull()
  })

  it('toggles test selection via checkbox', () => {
    const onSelectionChange = vi.fn()
    render(<OrdersetManager {...defaultProps} onSelectionChange={onSelectionChange} />)
    const checkbox = screen.getByLabelText(/Troponin/)
    fireEvent.click(checkbox)
    expect(onSelectionChange).toHaveBeenCalledWith(['troponin'])
  })

  it('renders saved ordersets with names', () => {
    render(<OrdersetManager {...defaultProps} />)
    expect(screen.getByText('Chest Pain Workup')).toBeDefined()
    expect(screen.getByText('2 tests')).toBeDefined()
  })

  it('applies orderset on Apply click (merges tests)', () => {
    const onSelectionChange = vi.fn()
    render(
      <OrdersetManager
        {...defaultProps}
        selectedTests={['ct_head']}
        onSelectionChange={onSelectionChange}
      />,
    )
    fireEvent.click(screen.getByText('Apply'))
    // Should merge orderset tests with existing selection
    expect(onSelectionChange).toHaveBeenCalledWith(['ct_head', 'troponin', 'cbc'])
  })

  // ── Fix 1: Delete confirmation ──────────────────────────────────────────

  it('[Fix 1] shows inline delete confirmation on trash click', () => {
    render(<OrdersetManager {...defaultProps} />)
    // Click the trash button
    fireEvent.click(screen.getByLabelText('Delete Chest Pain Workup'))
    // Confirmation should appear
    expect(screen.getByText('Delete?')).toBeDefined()
    expect(screen.getByText('Yes')).toBeDefined()
    expect(screen.getByText('No')).toBeDefined()
    // onDeleteOrderSet should NOT be called yet
    expect(defaultProps.onDeleteOrderSet).not.toHaveBeenCalled()
  })

  it('[Fix 1] cancels delete on "No" click', () => {
    render(<OrdersetManager {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Delete Chest Pain Workup'))
    fireEvent.click(screen.getByText('No'))
    // Confirmation should disappear, trash icon should return
    expect(screen.queryByText('Delete?')).toBeNull()
    expect(screen.getByLabelText('Delete Chest Pain Workup')).toBeDefined()
    expect(defaultProps.onDeleteOrderSet).not.toHaveBeenCalled()
  })

  it('[Fix 1] confirms delete on "Yes" click', () => {
    render(<OrdersetManager {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Delete Chest Pain Workup'))
    fireEvent.click(screen.getByText('Yes'))
    expect(defaultProps.onDeleteOrderSet).toHaveBeenCalledWith('os-1')
  })

  // ── Create form ─────────────────────────────────────────────────────────

  it('opens create form on "Create Orderset" click', () => {
    render(<OrdersetManager {...defaultProps} selectedTests={['troponin']} />)
    fireEvent.click(screen.getByText('Create Orderset'))
    expect(screen.getByText('Create Orderset', { selector: 'h5' })).toBeDefined()
    expect(screen.getByPlaceholderText('Orderset name')).toBeDefined()
  })

  it('validates empty name on create', () => {
    render(<OrdersetManager {...defaultProps} selectedTests={['troponin']} />)
    fireEvent.click(screen.getByText('Create Orderset'))
    // Try to save with empty name via Enter key (button is disabled when empty)
    const input = screen.getByPlaceholderText('Orderset name')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Enter a name for the orderset')).toBeDefined()
  })

  // ── Fix 2: Duplicate name + loading state ───────────────────────────────

  it('[Fix 2] shows error for duplicate orderset name', () => {
    render(<OrdersetManager {...defaultProps} selectedTests={['troponin']} />)
    fireEvent.click(screen.getByText('Create Orderset'))
    const input = screen.getByPlaceholderText('Orderset name')
    fireEvent.change(input, { target: { value: 'Chest Pain Workup' } })
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByText('An orderset with this name already exists')).toBeDefined()
    expect(defaultProps.onSaveOrderSet).not.toHaveBeenCalled()
  })

  it('[Fix 2] disables Save buttons and shows "Saving..." during save', async () => {
    // Make onSaveOrderSet hang (never resolve during this test)
    let resolvePromise: (v: OrderSet) => void
    const saveMock = vi.fn(
      () =>
        new Promise<OrderSet>((resolve) => {
          resolvePromise = resolve
        }),
    )
    render(
      <OrdersetManager {...defaultProps} selectedTests={['troponin']} onSaveOrderSet={saveMock} />,
    )
    fireEvent.click(screen.getByText('Create Orderset'))
    const input = screen.getByPlaceholderText('Orderset name')
    fireEvent.change(input, { target: { value: 'New Set' } })
    fireEvent.click(screen.getByText('Save'))

    // Buttons should show "Saving..." and be disabled
    await waitFor(() => {
      const savingBtns = screen.getAllByText('Saving...')
      expect(savingBtns.length).toBeGreaterThanOrEqual(1)
      for (const btn of savingBtns) {
        expect((btn as HTMLButtonElement).disabled).toBe(true)
      }
    })

    // Resolve to clean up
    resolvePromise!({
      id: 'new-os',
      name: 'New Set',
      tests: ['troponin'],
      tags: [],
      createdAt: '',
      usageCount: 0,
    })
  })
})
