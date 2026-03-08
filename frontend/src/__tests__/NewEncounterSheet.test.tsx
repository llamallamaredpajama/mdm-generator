/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NewEncounterSheet from '../components/compose/NewEncounterSheet'

describe('NewEncounterSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreateEncounter: vi.fn(),
    isCreating: false,
  }

  it('renders Quick and Build options when open', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    expect(screen.getByText('Quick')).toBeTruthy()
    expect(screen.getByText('Build')).toBeTruthy()
  })

  it('does not render content when closed', () => {
    render(<NewEncounterSheet {...defaultProps} open={false} />)
    expect(screen.queryByText('Quick')).toBeNull()
  })

  it('calls onCreateEncounter with "quick" when Quick option is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByText('Quick'))
    expect(defaultProps.onCreateEncounter).toHaveBeenCalledWith('quick')
  })

  it('calls onCreateEncounter with "build" when Build option is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByText('Build'))
    expect(defaultProps.onCreateEncounter).toHaveBeenCalledWith('build')
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByTestId('sheet-backdrop'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('disables buttons when isCreating', () => {
    render(<NewEncounterSheet {...defaultProps} isCreating={true} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
