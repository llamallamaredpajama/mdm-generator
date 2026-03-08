/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import InlineRoomInput from '../components/compose/InlineRoomInput'

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => 'mock-ts'),
}))

vi.mock('../lib/firebase', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
  getAppDb: vi.fn(() => ({})),
}))

describe('InlineRoomInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Unassigned" placeholder when value is empty', () => {
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })

  it('shows formatted room when value is set', () => {
    render(<InlineRoomInput value="12" encounterId="enc-1" />)
    expect(screen.getByText('Room 12')).toBeTruthy()
  })

  it('enters edit mode on click', () => {
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('saves on blur', async () => {
    const { updateDoc } = await import('firebase/firestore')
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.blur(input)
    expect(updateDoc).toHaveBeenCalled()
  })

  it('saves on Enter key', async () => {
    const { updateDoc } = await import('firebase/firestore')
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(updateDoc).toHaveBeenCalled()
  })
})
