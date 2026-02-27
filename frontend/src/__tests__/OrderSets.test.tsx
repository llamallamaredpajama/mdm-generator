/**
 * Order Sets Tests
 *
 * Tests OrderSetSuggestion component rendering and interactions.
 * Hook tests (useOrderSets) are integration-level since the rewrite
 * moved to API-backed persistence — unit testing requires mocked fetch.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OrderSetSuggestion from '../components/build-mode/shared/OrderSetSuggestion'
import type { OrderSet } from '../types/userProfile'

const mockOrderSet: OrderSet = {
  id: 'os_123',
  name: 'Chest Pain Workup',
  tests: ['troponin', 'ecg'],
  tags: ['chest pain', 'cardiac', 'acs'],
  usageCount: 3,
  createdAt: '2026-01-01T00:00:00Z',
}

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
