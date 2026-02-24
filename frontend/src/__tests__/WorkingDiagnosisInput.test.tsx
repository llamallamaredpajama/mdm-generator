/**
 * WorkingDiagnosisInput Component Tests
 *
 * Tests AI-suggested diagnosis radio selection, "Other" free text input,
 * loading state, legacy string handling, and disabled state.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import WorkingDiagnosisInput from '../components/build-mode/shared/WorkingDiagnosisInput'

describe('WorkingDiagnosisInput', () => {
  const defaultSuggestions = ['Acute Coronary Syndrome', 'Pulmonary Embolism', 'Pneumonia']
  const noop = vi.fn()

  it('renders suggestion radio buttons and Other option', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={noop}
      />
    )

    expect(screen.getByText('Acute Coronary Syndrome')).not.toBeNull()
    expect(screen.getByText('Pulmonary Embolism')).not.toBeNull()
    expect(screen.getByText('Pneumonia')).not.toBeNull()
    expect(screen.getByText('Other')).not.toBeNull()

    const radios = container.querySelectorAll('input[type="radio"]')
    // 3 suggestions + 1 Other = 4 radios
    expect(radios.length).toBe(4)
  })

  it('selecting a suggestion calls onChange with structured WorkingDiagnosis', () => {
    const onChange = vi.fn()
    render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByText('Pulmonary Embolism'))

    expect(onChange).toHaveBeenCalledWith({
      selected: 'Pulmonary Embolism',
      custom: null,
      suggestedOptions: defaultSuggestions,
    })
  })

  it('selecting Other shows free text input', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={noop}
      />
    )

    // Initially no custom input
    expect(container.querySelector('[data-testid="dx-custom-input"]')).toBeNull()

    // Click "Other"
    fireEvent.click(screen.getByText('Other'))

    // Custom input should now appear
    expect(container.querySelector('[data-testid="dx-custom-input"]')).not.toBeNull()
  })

  it('typing custom diagnosis calls onChange with custom field', () => {
    const onChange = vi.fn()
    render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={onChange}
      />
    )

    // Select "Other" to show the input
    fireEvent.click(screen.getByText('Other'))
    onChange.mockClear()

    const input = screen.getByTestId('dx-custom-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Costochondritis' } })

    expect(onChange).toHaveBeenCalledWith({
      selected: null,
      custom: 'Costochondritis',
      suggestedOptions: defaultSuggestions,
    })
  })

  it('shows loading state', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={[]}
        loading={true}
        value={undefined}
        onChange={noop}
      />
    )

    expect(container.querySelector('[data-testid="dx-loading"]')).not.toBeNull()
    expect(screen.getByText('Analyzing...')).not.toBeNull()
  })

  it('handles legacy string value', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value="Appendicitis"
        onChange={noop}
      />
    )

    // Legacy string is treated as selected — no custom input shown
    expect(container.querySelector('[data-testid="dx-custom-input"]')).toBeNull()
  })

  it('shows custom input when no suggestions available', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={[]}
        loading={false}
        value={undefined}
        onChange={noop}
      />
    )

    // With no suggestions, custom input is the fallback
    expect(container.querySelector('[data-testid="dx-custom-input"]')).not.toBeNull()
  })

  it('disables all inputs when disabled prop is true', () => {
    const { container } = render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={noop}
        disabled={true}
      />
    )

    const radios = container.querySelectorAll('input[type="radio"]')
    radios.forEach((radio) => {
      expect((radio as HTMLInputElement).disabled).toBe(true)
    })
  })

  it('highlights selected suggestion with selected class', () => {
    render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={{ selected: 'Pneumonia', custom: null, suggestedOptions: defaultSuggestions }}
        onChange={noop}
      />
    )

    const pneumoniaLabel = screen.getByText('Pneumonia').closest('label')
    expect(pneumoniaLabel?.className).toContain('working-diagnosis__option--selected')
  })

  it('renders the Working Diagnosis label', () => {
    render(
      <WorkingDiagnosisInput
        suggestions={defaultSuggestions}
        loading={false}
        value={undefined}
        onChange={noop}
      />
    )

    expect(screen.getByText('Working Diagnosis')).not.toBeNull()
  })
})
