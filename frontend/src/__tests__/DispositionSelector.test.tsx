/**
 * DispositionSelector Component Tests
 *
 * Tests disposition radio buttons, follow-up checkboxes,
 * saved flow application, and save flow functionality.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DispositionSelector from '../components/build-mode/shared/DispositionSelector'
import type { DispoFlow } from '../hooks/useDispoFlows'

const mockFlows: DispoFlow[] = [
  {
    id: 'flow_1',
    name: 'Standard Discharge',
    disposition: 'discharge',
    followUp: ['PCP follow-up', 'Return to ED if worsening'],
  },
]

const defaultProps = {
  disposition: null as import('../types/encounter').DispositionOption | null,
  followUp: [] as string[],
  savedFlows: [] as DispoFlow[],
  onDispositionChange: vi.fn(),
  onFollowUpChange: vi.fn(),
  onApplyFlow: vi.fn(),
  onSaveFlow: vi.fn(),
  onDeleteFlow: vi.fn(),
}

describe('DispositionSelector', () => {
  it('renders all 8 disposition radio buttons', () => {
    render(<DispositionSelector {...defaultProps} />)

    expect(screen.getByText('Discharge')).toBeDefined()
    expect(screen.getByText('Observation')).toBeDefined()
    expect(screen.getByText('Admit')).toBeDefined()
    expect(screen.getByText('ICU')).toBeDefined()
    expect(screen.getByText('Transfer')).toBeDefined()
    expect(screen.getByText('AMA')).toBeDefined()
    expect(screen.getByText('LWBS')).toBeDefined()
    expect(screen.getByText('Deceased')).toBeDefined()
  })

  it('renders follow-up checkbox options', () => {
    render(<DispositionSelector {...defaultProps} />)

    expect(screen.getByText('PCP follow-up')).toBeDefined()
    expect(screen.getByText('Specialist follow-up')).toBeDefined()
    expect(screen.getByText('Return to ED if worsening')).toBeDefined()
  })

  it('selecting a disposition calls onDispositionChange', () => {
    const onDispositionChange = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        onDispositionChange={onDispositionChange}
      />
    )

    fireEvent.click(screen.getByText('Discharge'))
    expect(onDispositionChange).toHaveBeenCalledWith('discharge')
  })

  it('toggling a follow-up checkbox calls onFollowUpChange', () => {
    const onFollowUpChange = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        onFollowUpChange={onFollowUpChange}
      />
    )

    fireEvent.click(screen.getByText('PCP follow-up'))
    expect(onFollowUpChange).toHaveBeenCalledWith(['PCP follow-up'])
  })

  it('unchecking a follow-up removes it from the list', () => {
    const onFollowUpChange = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        followUp={['PCP follow-up', 'Specialist follow-up']}
        onFollowUpChange={onFollowUpChange}
      />
    )

    fireEvent.click(screen.getByText('PCP follow-up'))
    expect(onFollowUpChange).toHaveBeenCalledWith(['Specialist follow-up'])
  })

  it('shows saved flows and applies on click', () => {
    const onApplyFlow = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        savedFlows={mockFlows}
        onApplyFlow={onApplyFlow}
      />
    )

    expect(screen.getByText('Standard Discharge')).toBeDefined()
    fireEvent.click(screen.getByTestId('apply-flow-flow_1'))
    expect(onApplyFlow).toHaveBeenCalledWith(mockFlows[0])
  })

  it('deletes a saved flow on delete click', () => {
    const onDeleteFlow = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        savedFlows={mockFlows}
        onDeleteFlow={onDeleteFlow}
      />
    )

    fireEvent.click(screen.getByTestId('delete-flow-flow_1'))
    expect(onDeleteFlow).toHaveBeenCalledWith('flow_1')
  })

  it('shows save flow button when disposition is selected', () => {
    render(
      <DispositionSelector
        {...defaultProps}
        disposition="discharge"
      />
    )

    expect(screen.getByTestId('save-flow-btn')).toBeDefined()
  })

  it('save flow workflow: click save, enter name, confirm', () => {
    const onSaveFlow = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        disposition="admit"
        onSaveFlow={onSaveFlow}
      />
    )

    fireEvent.click(screen.getByTestId('save-flow-btn'))
    const nameInput = screen.getByTestId('flow-name-input')
    fireEvent.change(nameInput, { target: { value: 'Admit Standard' } })
    fireEvent.click(screen.getByTestId('confirm-save-flow'))
    expect(onSaveFlow).toHaveBeenCalledWith('Admit Standard')
  })

  it('disabled state prevents interaction', () => {
    render(
      <DispositionSelector
        {...defaultProps}
        savedFlows={mockFlows}
        disposition="discharge"
        disabled
      />
    )

    const radios = screen.getAllByRole('radio')
    radios.forEach((radio) => {
      expect(radio).toHaveProperty('disabled', true)
    })
  })

  it('adds custom follow-up via text input', () => {
    const onFollowUpChange = vi.fn()
    render(
      <DispositionSelector
        {...defaultProps}
        onFollowUpChange={onFollowUpChange}
      />
    )

    const input = screen.getByTestId('custom-followup-input')
    fireEvent.change(input, { target: { value: 'Cardiology in 2 weeks' } })
    fireEvent.click(screen.getByTestId('add-followup-btn'))
    expect(onFollowUpChange).toHaveBeenCalledWith(['Cardiology in 2 weeks'])
  })

  it('shows selected disposition as highlighted', () => {
    const { container } = render(
      <DispositionSelector
        {...defaultProps}
        disposition="icu"
      />
    )

    expect(container.querySelector('.dispo-selector__radio--selected')).not.toBeNull()
    expect(container.querySelector('.dispo-selector__radio--selected')?.textContent).toBe('ICU')
  })
})
