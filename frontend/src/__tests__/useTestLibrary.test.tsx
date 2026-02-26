/**
 * useTestLibrary Hook Tests
 */

/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestLibrary } from '../hooks/useTestLibrary'
import type { TestDefinition, TestCategory } from '../types/libraries'

// Mock useAuthToken
const { mockToken } = vi.hoisted(() => ({
  mockToken: vi.fn().mockReturnValue('mock-token-123'),
}))

vi.mock('../lib/firebase', () => ({
  useAuthToken: mockToken,
}))

// Mock fetchTestLibrary from api module
const { mockFetchTestLibrary } = vi.hoisted(() => ({
  mockFetchTestLibrary: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  fetchTestLibrary: mockFetchTestLibrary,
}))

const mockTests: TestDefinition[] = [
  {
    id: 'troponin',
    name: 'Troponin',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain', 'mi risk'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: ['normal', 'elevated'],
    feedsCdrs: ['heart'],
  },
  {
    id: 'ct_head',
    name: 'CT Head',
    category: 'imaging',
    subcategory: 'neuro',
    commonIndications: ['head injury', 'altered mental status'],
    unit: null,
    normalRange: null,
    quickFindings: ['normal', 'hemorrhage', 'mass'],
    feedsCdrs: ['pecarn'],
  },
]

const mockCategories: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

describe('useTestLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.mockReturnValue('mock-token-123')
  })

  it('fetches test library when token is available', async () => {
    mockFetchTestLibrary.mockResolvedValueOnce({
      ok: true,
      tests: mockTests,
      categories: mockCategories,
      cachedAt: '2026-02-23T00:00:00Z',
    })

    const { result } = renderHook(() => useTestLibrary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tests).toHaveLength(2)
    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.error).toBeNull()
    expect(mockFetchTestLibrary).toHaveBeenCalledWith('mock-token-123')
  })

  it('returns empty state while token is null', () => {
    mockToken.mockReturnValue(null)

    const { result } = renderHook(() => useTestLibrary())

    expect(result.current.loading).toBe(false)
    expect(result.current.tests).toEqual([])
    expect(result.current.categories).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFetchTestLibrary).not.toHaveBeenCalled()
  })

  it('sets error on fetch failure', async () => {
    mockFetchTestLibrary.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useTestLibrary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Server error')
    expect(result.current.tests).toEqual([])
  })

  it('sets loading true while fetching', () => {
    let resolve: (v?: unknown) => void = () => {}
    mockFetchTestLibrary.mockReturnValueOnce(new Promise(r => { resolve = r }))

    const { result, unmount } = renderHook(() => useTestLibrary())

    expect(result.current.loading).toBe(true)
    unmount()
    resolve()
  })

  it('fetches when token becomes available', async () => {
    mockToken.mockReturnValue(null)
    const { result, rerender } = renderHook(() => useTestLibrary())

    expect(mockFetchTestLibrary).not.toHaveBeenCalled()

    mockToken.mockReturnValue('new-token')
    mockFetchTestLibrary.mockResolvedValueOnce({
      ok: true,
      tests: mockTests,
      categories: mockCategories,
      cachedAt: '2026-02-23T00:00:00Z',
    })
    rerender()

    await waitFor(() => {
      expect(result.current.tests).toHaveLength(2)
    })
  })
})
