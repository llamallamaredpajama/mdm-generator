/**
 * DifferentialList Component Tests
 *
 * Tests rendering, expand/collapse, urgency display, and accessibility.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DifferentialList from '../components/build-mode/shared/DifferentialList'
import type { DifferentialItem } from '../types/encounter'

const mockDifferential: DifferentialItem[] = [
  {
    diagnosis: 'Acute Coronary Syndrome',
    urgency: 'emergent',
    reasoning: 'Chest pain with cardiac risk factors',
    cdrContext: 'HEART score applicable',
    regionalContext: 'Elevated cardiac presentations in region',
  },
  {
    diagnosis: 'Pulmonary Embolism',
    urgency: 'urgent',
    reasoning: 'Dyspnea and tachycardia',
  },
  {
    diagnosis: 'Costochondritis',
    urgency: 'routine',
    reasoning: 'Reproducible chest wall tenderness',
  },
]

describe('DifferentialList', () => {
  it('renders all differential items', () => {
    render(<DifferentialList differential={mockDifferential} />)
    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
    expect(screen.getByText('Pulmonary Embolism')).toBeDefined()
    expect(screen.getByText('Costochondritis')).toBeDefined()
  })

  it('shows urgency text labels for accessibility', () => {
    render(<DifferentialList differential={mockDifferential} />)
    expect(screen.getByText('Emergent')).toBeDefined()
    expect(screen.getByText('Urgent')).toBeDefined()
    expect(screen.getByText('Routine')).toBeDefined()
  })

  it('shows urgency summary badges', () => {
    render(<DifferentialList differential={mockDifferential} />)
    expect(screen.getByText('1 emergent')).toBeDefined()
    expect(screen.getByText('1 urgent')).toBeDefined()
    expect(screen.getByText('1 routine')).toBeDefined()
  })

  it('expands item to show reasoning on click', () => {
    render(<DifferentialList differential={mockDifferential} />)
    // Reasoning should not be visible initially
    expect(screen.queryByText('Chest pain with cardiac risk factors')).toBeNull()

    // Click the first item header
    fireEvent.click(screen.getByText('Acute Coronary Syndrome'))

    // Reasoning should now be visible
    expect(screen.getByText('Chest pain with cardiac risk factors')).toBeDefined()
  })

  it('shows cdrContext and regionalContext in expanded view when present', () => {
    render(<DifferentialList differential={mockDifferential} />)
    fireEvent.click(screen.getByText('Acute Coronary Syndrome'))

    expect(screen.getByText('HEART score applicable')).toBeDefined()
    expect(screen.getByText('Elevated cardiac presentations in region')).toBeDefined()
  })

  it('does not show cdrContext/regionalContext when absent', () => {
    render(<DifferentialList differential={mockDifferential} />)
    fireEvent.click(screen.getByText('Pulmonary Embolism'))

    // Should show reasoning but NOT CDR/regional labels
    expect(screen.getByText('Dyspnea and tachycardia')).toBeDefined()
    expect(screen.queryByText('CDR Association:')).toBeNull()
    expect(screen.queryByText('Regional Context:')).toBeNull()
  })

  it('toggles Expand All / Collapse All', () => {
    render(<DifferentialList differential={mockDifferential} />)

    // Initially shows "Expand All"
    const toggleBtn = screen.getByText('Expand All')
    fireEvent.click(toggleBtn)

    // All reasoning should be visible
    expect(screen.getByText('Chest pain with cardiac risk factors')).toBeDefined()
    expect(screen.getByText('Dyspnea and tachycardia')).toBeDefined()
    expect(screen.getByText('Reproducible chest wall tenderness')).toBeDefined()

    // Button should now say "Collapse All"
    expect(screen.getByText('Collapse All')).toBeDefined()

    // Click collapse
    fireEvent.click(screen.getByText('Collapse All'))

    // Reasoning should be hidden
    expect(screen.queryByText('Chest pain with cardiac risk factors')).toBeNull()
  })

  it('shows worst-first ordering note', () => {
    render(<DifferentialList differential={mockDifferential} />)
    expect(screen.getByText('Listed in worst-first order based on clinical presentation')).toBeDefined()
  })

  it('sets aria-expanded on header buttons', () => {
    render(<DifferentialList differential={mockDifferential} />)
    const buttons = screen.getAllByRole('button', { name: /Acute Coronary Syndrome|Pulmonary Embolism|Costochondritis/i })

    // All should start collapsed
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-expanded')).toBe('false')
    })

    // Expand first one
    fireEvent.click(buttons[0])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
  })
})
