/**
 * useCdrLibrary Hook Tests
 */

/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCdrLibrary } from '../hooks/useCdrLibrary'
import type { CdrDefinition } from '../types/libraries'

// Mock useAuthToken
const { mockToken } = vi.hoisted(() => ({
  mockToken: vi.fn().mockReturnValue('mock-token-123'),
}))

vi.mock('../lib/firebase', () => ({
  useAuthToken: mockToken,
}))

// Mock fetchCdrLibrary from api module
const { mockFetchCdrLibrary } = vi.hoisted(() => ({
  mockFetchCdrLibrary: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  fetchCdrLibrary: mockFetchCdrLibrary,
}))

const mockCdrs: CdrDefinition[] = [
  {
    id: 'heart',
    name: 'HEART Score',
    fullName: 'HEART Score for Major Cardiac Events',
    applicableChiefComplaints: ['chest pain', 'acute coronary syndrome'],
    components: [
      { id: 'history', label: 'History', type: 'select', source: 'section1' },
      { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2' },
    ],
    scoring: { method: 'sum', ranges: [{ min: 0, max: 3, risk: 'low', interpretation: 'Low risk' }] },
  },
  {
    id: 'wells_pe',
    name: 'Wells PE',
    fullName: 'Wells Criteria for Pulmonary Embolism',
    applicableChiefComplaints: ['shortness of breath', 'chest pain'],
    components: [
      { id: 'dvt_signs', label: 'DVT Signs', type: 'boolean', source: 'section1', value: 3 },
    ],
    scoring: { method: 'sum', ranges: [{ min: 0, max: 1, risk: 'low', interpretation: 'PE unlikely' }] },
  },
]

describe('useCdrLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.mockReturnValue('mock-token-123')
  })

  it('fetches CDR library when token is available', async () => {
    mockFetchCdrLibrary.mockResolvedValueOnce({
      ok: true,
      cdrs: mockCdrs,
    })

    const { result } = renderHook(() => useCdrLibrary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.cdrs).toHaveLength(2)
    expect(result.current.error).toBeNull()
    expect(mockFetchCdrLibrary).toHaveBeenCalledWith('mock-token-123')
  })

  it('returns empty state while token is null', () => {
    mockToken.mockReturnValue(null)

    const { result } = renderHook(() => useCdrLibrary())

    expect(result.current.loading).toBe(false)
    expect(result.current.cdrs).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFetchCdrLibrary).not.toHaveBeenCalled()
  })

  it('sets error on fetch failure', async () => {
    mockFetchCdrLibrary.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useCdrLibrary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Server error')
    expect(result.current.cdrs).toEqual([])
  })

  it('does not re-fetch after successful load (fetchedRef guard)', async () => {
    mockFetchCdrLibrary.mockResolvedValueOnce({
      ok: true,
      cdrs: mockCdrs,
    })

    const { result, rerender } = renderHook(() => useCdrLibrary())

    await waitFor(() => {
      expect(result.current.cdrs).toHaveLength(2)
    })

    // Re-render should not trigger another fetch
    rerender()

    expect(mockFetchCdrLibrary).toHaveBeenCalledTimes(1)
  })
})
