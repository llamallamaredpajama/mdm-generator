import { describe, it, expect } from 'vitest'
import { formatRoomDisplay } from '../types/encounter'

describe('formatRoomDisplay', () => {
  it('returns "Unassigned" for empty string', () => {
    expect(formatRoomDisplay('')).toBe('Unassigned')
  })

  it('returns "Unassigned" for whitespace-only string', () => {
    expect(formatRoomDisplay('   ')).toBe('Unassigned')
  })

  it('returns "Room 12" for numeric input', () => {
    expect(formatRoomDisplay('12')).toBe('Room 12')
  })

  it('returns "Bed 2A" for alphanumeric input', () => {
    expect(formatRoomDisplay('Bed 2A')).toBe('Bed 2A')
  })
})
