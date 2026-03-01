/**
 * useOrderSets Hook Tests
 *
 * Tests CRUD operations, optimistic updates, suggestion matching,
 * and migration retry logic (Fix 5).
 */

/// <reference types="vitest/globals" />
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { OrderSet } from '../types/userProfile'

// ── localStorage mock (Node 22+ built-in conflicts with jsdom) ────────────

const storageMap = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storageMap.delete(key)
  }),
  clear: vi.fn(() => {
    storageMap.clear()
  }),
  get length() {
    return storageMap.size
  },
  key: vi.fn((index: number) => Array.from(storageMap.keys())[index] ?? null),
}
vi.stubGlobal('localStorage', localStorageMock)

// ── Hoisted Mocks ─────────────────────────────────────────────────────────

const {
  mockUseAuthToken,
  mockGetOrderSets,
  mockCreateOrderSet,
  mockDeleteOrderSet,
  mockUseOrderSetApi,
} = vi.hoisted(() => ({
  mockUseAuthToken: vi.fn().mockReturnValue('test-token-123'),
  mockGetOrderSets: vi.fn(),
  mockCreateOrderSet: vi.fn(),
  mockDeleteOrderSet: vi.fn(),
  mockUseOrderSetApi: vi.fn(),
}))

vi.mock('../lib/firebase', () => ({
  db: {},
  getAppDb: vi.fn(() => ({})),
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  useAuthToken: mockUseAuthToken,
}))

vi.mock('../lib/api', () => ({
  getOrderSets: (...args: unknown[]) => mockGetOrderSets(...args),
  createOrderSet: (...args: unknown[]) => mockCreateOrderSet(...args),
  updateOrderSet: vi.fn().mockResolvedValue({ ok: true, item: {} }),
  deleteOrderSet: (...args: unknown[]) => mockDeleteOrderSet(...args),
  useOrderSet: (...args: unknown[]) => mockUseOrderSetApi(...args),
}))

// ── Test Data ─────────────────────────────────────────────────────────────

const mockOrderSets: OrderSet[] = [
  {
    id: 'os-1',
    name: 'Chest Pain',
    tests: ['troponin', 'ecg'],
    tags: ['chest_pain', 'cardiac'],
    createdAt: '2026-01-01T00:00:00Z',
    usageCount: 5,
  },
]

// Import after mocks — dynamic import ensures mocks are applied
const { useOrderSets } = await import('../hooks/useOrderSets')

// ── Tests ─────────────────────────────────────────────────────────────────

describe('useOrderSets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMap.clear()
    // Default: return mock order sets from API
    mockUseAuthToken.mockReturnValue('test-token-123')
    mockGetOrderSets.mockResolvedValue({ ok: true, items: mockOrderSets })
    mockCreateOrderSet.mockResolvedValue({
      ok: true,
      item: {
        id: 'os-new',
        name: 'New Set',
        tests: ['cbc'],
        tags: [],
        createdAt: '2026-02-01T00:00:00Z',
        usageCount: 0,
      },
    })
    mockDeleteOrderSet.mockResolvedValue({ ok: true })
    mockUseOrderSetApi.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    storageMap.clear()
  })

  it('fetches order sets on mount when token available', async () => {
    const { result } = renderHook(() => useOrderSets())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetOrderSets).toHaveBeenCalledWith('test-token-123')
    expect(result.current.orderSets).toEqual(mockOrderSets)
  })

  it('returns empty state when no token', () => {
    mockUseAuthToken.mockReturnValue(null)

    const { result } = renderHook(() => useOrderSets())

    expect(result.current.orderSets).toEqual([])
    expect(mockGetOrderSets).not.toHaveBeenCalled()
  })

  it('saveOrderSet calls API and adds to state', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let saved: OrderSet | null = null
    await act(async () => {
      saved = await result.current.saveOrderSet('New Set', ['cbc'])
    })

    expect(saved).toBeTruthy()
    expect(saved!.id).toBe('os-new')
    expect(mockCreateOrderSet).toHaveBeenCalledWith('test-token-123', {
      name: 'New Set',
      tests: ['cbc'],
      tags: [],
    })
    expect(result.current.orderSets).toHaveLength(2)
  })

  it('saveOrderSet returns null on API failure', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockCreateOrderSet.mockRejectedValueOnce(new Error('Network error'))

    let saved: OrderSet | null = null
    await act(async () => {
      saved = await result.current.saveOrderSet('Fail Set', ['cbc'])
    })

    expect(saved).toBeNull()
  })

  it('deleteOrderSet removes optimistically, calls API', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteOrderSet('os-1')
    })

    expect(mockDeleteOrderSet).toHaveBeenCalledWith('test-token-123', 'os-1')
    expect(result.current.orderSets).toHaveLength(0)
  })

  it('deleteOrderSet restores on API failure (re-fetch)', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockDeleteOrderSet.mockRejectedValueOnce(new Error('Network'))

    await act(async () => {
      await result.current.deleteOrderSet('os-1')
    })

    // Should have re-fetched to restore consistency
    expect(mockGetOrderSets).toHaveBeenCalledTimes(2) // initial + recovery
  })

  it('incrementUsage updates count optimistically', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.incrementUsage('os-1')
    })

    const updated = result.current.orderSets.find((os) => os.id === 'os-1')
    expect(updated?.usageCount).toBe(6)
    expect(mockUseOrderSetApi).toHaveBeenCalledWith('test-token-123', 'os-1')
  })

  it('suggestOrderSet returns best keyword match', async () => {
    const { result } = renderHook(() => useOrderSets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const suggestion = result.current.suggestOrderSet(
      'Patient presents with chest pain and cardiac risk factors',
    )
    expect(suggestion).toBeTruthy()
    expect(suggestion!.id).toBe('os-1')
  })

  // ── Fix 5: Migration retry ─────────────────────────────────────────────

  it('[Fix 5] migration increments retry counter on failure', async () => {
    storageMap.set(
      'mdm-order-sets',
      JSON.stringify([
        {
          id: 'old-1',
          name: 'Legacy',
          testIds: ['troponin'],
          tags: [],
          usageCount: 0,
          createdAt: '',
        },
      ]),
    )
    mockCreateOrderSet.mockRejectedValueOnce(new Error('API down'))

    renderHook(() => useOrderSets())

    await waitFor(() => {
      expect(storageMap.get('mdm-order-sets-migration-retries')).toBe('1')
    })
  })

  it('[Fix 5] migration stops after max retries', async () => {
    storageMap.set('mdm-order-sets-migration-retries', '3')
    storageMap.set(
      'mdm-order-sets',
      JSON.stringify([
        {
          id: 'old-1',
          name: 'Legacy',
          testIds: ['troponin'],
          tags: [],
          usageCount: 0,
          createdAt: '',
        },
      ]),
    )

    renderHook(() => useOrderSets())

    await waitFor(() => {
      expect(mockGetOrderSets).toHaveBeenCalled()
    })

    // createOrderSet should NOT have been called for migration
    expect(mockCreateOrderSet).not.toHaveBeenCalled()
  })
})
