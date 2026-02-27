/**
 * Order Sets Tests
 *
 * Tests useOrderSets hook, SaveOrderSetModal, OrderSetSuggestion,
 * and WorkupCard save button integration.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOrderSets } from '../hooks/useOrderSets'
import SaveOrderSetModal from '../components/build-mode/shared/SaveOrderSetModal'
import OrderSetSuggestion from '../components/build-mode/shared/OrderSetSuggestion'
import WorkupCard from '../components/build-mode/shared/WorkupCard'
import type { OrderSet } from '../hooks/useOrderSets'
import type { TestDefinition } from '../types/libraries'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

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
]

const mockOrderSet: OrderSet = {
  id: 'os_123',
  name: 'Chest Pain Workup',
  testIds: ['troponin', 'ecg'],
  tags: ['chest pain', 'cardiac', 'acs'],
  usageCount: 3,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('useOrderSets', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('starts with empty order sets', () => {
    const { result } = renderHook(() => useOrderSets())
    expect(result.current.orderSets).toEqual([])
  })

  it('saves a new order set', () => {
    const { result } = renderHook(() => useOrderSets())

    act(() => {
      result.current.saveOrderSet('Chest Pain', ['troponin', 'ecg'], ['cardiac'])
    })

    expect(result.current.orderSets).toHaveLength(1)
    expect(result.current.orderSets[0].name).toBe('Chest Pain')
    expect(result.current.orderSets[0].testIds).toEqual(['troponin', 'ecg'])
    expect(result.current.orderSets[0].tags).toEqual(['cardiac'])
    expect(result.current.orderSets[0].usageCount).toBe(0)
  })

  it('deletes an order set', () => {
    const { result } = renderHook(() => useOrderSets())

    act(() => {
      result.current.saveOrderSet('Set A', ['troponin'])
    })

    const id = result.current.orderSets[0].id

    act(() => {
      result.current.deleteOrderSet(id)
    })

    expect(result.current.orderSets).toHaveLength(0)
  })

  it('increments usage count', () => {
    const { result } = renderHook(() => useOrderSets())

    act(() => {
      result.current.saveOrderSet('Set A', ['troponin'])
    })

    const id = result.current.orderSets[0].id

    act(() => {
      result.current.incrementUsage(id)
    })

    expect(result.current.orderSets[0].usageCount).toBe(1)
  })

  it('suggests order set matching differential text', () => {
    const { result } = renderHook(() => useOrderSets())

    act(() => {
      result.current.saveOrderSet('Chest Pain', ['troponin', 'ecg'], ['chest pain', 'acs'])
    })

    const suggestion = result.current.suggestOrderSet('Acute Coronary Syndrome chest pain')
    expect(suggestion).not.toBeNull()
    expect(suggestion!.name).toBe('Chest Pain')
  })

  it('returns null when no order set matches', () => {
    const { result } = renderHook(() => useOrderSets())

    act(() => {
      result.current.saveOrderSet('Chest Pain', ['troponin'], ['cardiac'])
    })

    const suggestion = result.current.suggestOrderSet('ankle injury twisted')
    expect(suggestion).toBeNull()
  })
})

describe('SaveOrderSetModal', () => {
  it('renders with test chips and name input', () => {
    render(
      <SaveOrderSetModal
        selectedTestIds={['troponin', 'ecg']}
        tests={mockTests}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByTestId('save-orderset-modal')).toBeDefined()
    expect(screen.getByTestId('orderset-name-input')).toBeDefined()
    expect(screen.getByText('Troponin')).toBeDefined()
    expect(screen.getByText('ECG')).toBeDefined()
    expect(screen.getByText('Tests (2)')).toBeDefined()
  })

  it('calls onSave with name and test IDs', () => {
    const onSave = vi.fn()
    render(
      <SaveOrderSetModal
        selectedTestIds={['troponin', 'ecg']}
        tests={mockTests}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('orderset-name-input'), {
      target: { value: 'My Workup' },
    })
    fireEvent.change(screen.getByTestId('orderset-tags-input'), {
      target: { value: 'chest pain, cardiac' },
    })
    fireEvent.click(screen.getByTestId('confirm-save-orderset'))

    expect(onSave).toHaveBeenCalledWith('My Workup', ['troponin', 'ecg'], ['chest pain', 'cardiac'])
  })

  it('save button disabled without name', () => {
    render(
      <SaveOrderSetModal
        selectedTestIds={['troponin']}
        tests={mockTests}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const saveBtn = screen.getByTestId('confirm-save-orderset')
    expect(saveBtn).toHaveProperty('disabled', true)
  })

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn()
    render(
      <SaveOrderSetModal
        selectedTestIds={['troponin']}
        tests={mockTests}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('OrderSetSuggestion', () => {
  it('renders order set name and test count', () => {
    render(
      <OrderSetSuggestion
        orderSet={mockOrderSet}
        onApplyAll={vi.fn()}
        onCustomize={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    expect(screen.getByText('Chest Pain Workup')).toBeDefined()
    expect(screen.getByText(/2 tests/)).toBeDefined()
    expect(screen.getByText(/used 3x/)).toBeDefined()
  })

  it('calls onApplyAll when Apply All clicked', () => {
    const onApplyAll = vi.fn()
    render(
      <OrderSetSuggestion
        orderSet={mockOrderSet}
        onApplyAll={onApplyAll}
        onCustomize={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('orderset-apply-all'))
    expect(onApplyAll).toHaveBeenCalledWith(mockOrderSet)
  })

  it('calls onCustomize when Customize clicked', () => {
    const onCustomize = vi.fn()
    render(
      <OrderSetSuggestion
        orderSet={mockOrderSet}
        onApplyAll={vi.fn()}
        onCustomize={onCustomize}
        onSkip={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('orderset-customize'))
    expect(onCustomize).toHaveBeenCalledWith(mockOrderSet)
  })

  it('calls onSkip when Skip clicked', () => {
    const onSkip = vi.fn()
    render(
      <OrderSetSuggestion
        orderSet={mockOrderSet}
        onApplyAll={vi.fn()}
        onCustomize={vi.fn()}
        onSkip={onSkip}
      />,
    )

    fireEvent.click(screen.getByTestId('orderset-skip'))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})

describe('WorkupCard - Accept All / Continue button (B2)', () => {
  const defaultProps = {
    tests: mockTests,
    recommendedTestIds: ['troponin', 'ecg'],
    selectedTests: [] as string[],
    onSelectionChange: vi.fn(),
    onOpenOrderSelector: vi.fn(),
    loading: false,
  }

  it('does not show Accept All / Continue when onAcceptContinue is not provided', () => {
    render(<WorkupCard {...defaultProps} />)
    expect(screen.queryByText('Accept All / Continue')).toBeNull()
  })

  it('shows Accept All / Continue button when onAcceptContinue is provided', () => {
    render(
      <WorkupCard
        {...defaultProps}
        selectedTests={['troponin', 'ecg']}
        onAcceptContinue={vi.fn()}
      />,
    )
    expect(screen.getByText('Accept All / Continue')).toBeDefined()
  })

  it('calls onAcceptContinue when Accept All / Continue is clicked', () => {
    const onAcceptContinue = vi.fn()
    render(
      <WorkupCard
        {...defaultProps}
        selectedTests={['troponin', 'ecg']}
        onAcceptContinue={onAcceptContinue}
      />,
    )

    fireEvent.click(screen.getByText('Accept All / Continue'))
    expect(onAcceptContinue).toHaveBeenCalledOnce()
  })

  it('Save Set button removed from WorkupCard header (B2 — moved to DashboardOutput)', () => {
    render(
      <WorkupCard {...defaultProps} selectedTests={['troponin', 'ecg']} onSaveOrderSet={vi.fn()} />,
    )
    // Save Set button was removed from WorkupCard in B2 consolidation
    expect(screen.queryByTestId('save-orderset-btn')).toBeNull()
  })
})
