/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ComposeDiptych from '../components/compose/ComposeDiptych'

describe('ComposeDiptych', () => {
  const mockOnCreate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Build and Quick mode panels', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={false} />)
    expect(screen.getByLabelText(/Build Mode/)).toBeTruthy()
    expect(screen.getByLabelText(/Quick Mode/)).toBeTruthy()
  })

  it('calls onCreateEncounter with build when build panel is clicked', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={false} />)
    fireEvent.click(screen.getByLabelText(/Build Mode/))
    expect(mockOnCreate).toHaveBeenCalledWith('build')
  })

  it('calls onCreateEncounter with quick when quick panel is clicked', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={false} />)
    fireEvent.click(screen.getByLabelText(/Quick Mode/))
    expect(mockOnCreate).toHaveBeenCalledWith('quick')
  })

  it('does not call onCreateEncounter when isCreating is true', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={true} />)
    fireEvent.click(screen.getByLabelText(/Build Mode/))
    expect(mockOnCreate).not.toHaveBeenCalled()
  })

  it('supports keyboard activation with Enter', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={false} />)
    fireEvent.keyDown(screen.getByLabelText(/Build Mode/), { key: 'Enter' })
    expect(mockOnCreate).toHaveBeenCalledWith('build')
  })

  it('supports keyboard activation with Space', () => {
    render(<ComposeDiptych onCreateEncounter={mockOnCreate} isCreating={false} />)
    fireEvent.keyDown(screen.getByLabelText(/Quick Mode/), { key: ' ' })
    expect(mockOnCreate).toHaveBeenCalledWith('quick')
  })
})
