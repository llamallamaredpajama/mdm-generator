/**
 * useDispoFlows Hook Tests
 *
 * Tests API-backed CRUD, localStorage migration, and retry logic.
 */

/// <reference types="vitest/globals" />
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DispositionFlow } from '../types/userProfile'

// ── localStorage mock ────────────────────────────────────────────────────

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
  mockGetDispoFlows,
  mockCreateDispoFlow,
  mockDeleteDispoFlow,
  mockUseDispoFlowApi,
} = vi.hoisted(() => ({
  mockUseAuthToken: vi.fn().mockReturnValue('test-token-123'),
  mockGetDispoFlows: vi.fn(),
  mockCreateDispoFlow: vi.fn(),
  mockDeleteDispoFlow: vi.fn(),
  mockUseDispoFlowApi: vi.fn(),
}))

vi.mock('../lib/firebase', () => ({
  db: {},
  getAppDb: vi.fn(() => ({})),
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  useAuthToken: mockUseAuthToken,
}))

vi.mock('../lib/api', () => ({
  getDispoFlows: (...args: unknown[]) => mockGetDispoFlows(...args),
  createDispoFlow: (...args: unknown[]) => mockCreateDispoFlow(...args),
  updateDispoFlow: vi.fn().mockResolvedValue({ ok: true, item: {} }),
  deleteDispoFlow: (...args: unknown[]) => mockDeleteDispoFlow(...args),
  useDispoFlow: (...args: unknown[]) => mockUseDispoFlowApi(...args),
}))

// ── Test Data ─────────────────────────────────────────────────────────────

const mockFlows: DispositionFlow[] = [
  {
    id: 'df-1',
    name: 'Standard Discharge',
    disposition: 'discharge',
    followUp: ['PCP follow-up'],
    createdAt: '2026-01-01T00:00:00Z',
    usageCount: 3,
  },
]

const { useDispoFlows } = await import('../hooks/useDispoFlows')

// ── Tests ─────────────────────────────────────────────────────────────────

describe('useDispoFlows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMap.clear()
    mockUseAuthToken.mockReturnValue('test-token-123')
    mockGetDispoFlows.mockResolvedValue({ ok: true, items: mockFlows })
    mockCreateDispoFlow.mockResolvedValue({
      ok: true,
      item: {
        id: 'df-new',
        name: 'New Flow',
        disposition: 'admit',
        followUp: [],
        createdAt: '2026-02-01T00:00:00Z',
        usageCount: 0,
      },
    })
    mockDeleteDispoFlow.mockResolvedValue({ ok: true })
    mockUseDispoFlowApi.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    storageMap.clear()
  })

  it('fetches flows on mount when token available', async () => {
    const { result } = renderHook(() => useDispoFlows())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetDispoFlows).toHaveBeenCalledWith('test-token-123')
    expect(result.current.flows).toEqual(mockFlows)
  })

  it('returns empty state when no token', () => {
    mockUseAuthToken.mockReturnValue(null)

    const { result } = renderHook(() => useDispoFlows())

    expect(result.current.flows).toEqual([])
    expect(mockGetDispoFlows).not.toHaveBeenCalled()
  })

  it('saveFlow calls API and adds to state', async () => {
    const { result } = renderHook(() => useDispoFlows())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let saved: DispositionFlow | null = null
    await act(async () => {
      saved = await result.current.saveFlow('New Flow', 'admit', [])
    })

    expect(saved).toBeTruthy()
    expect(saved!.id).toBe('df-new')
    expect(mockCreateDispoFlow).toHaveBeenCalledWith('test-token-123', {
      name: 'New Flow',
      disposition: 'admit',
      followUp: [],
    })
    expect(result.current.flows).toHaveLength(2)
  })

  it('saveFlow returns null on API failure', async () => {
    const { result } = renderHook(() => useDispoFlows())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockCreateDispoFlow.mockRejectedValueOnce(new Error('Network error'))

    let saved: DispositionFlow | null = null
    await act(async () => {
      saved = await result.current.saveFlow('Fail', 'discharge', [])
    })

    expect(saved).toBeNull()
  })

  it('deleteFlow removes optimistically, calls API', async () => {
    const { result } = renderHook(() => useDispoFlows())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteFlow('df-1')
    })

    expect(mockDeleteDispoFlow).toHaveBeenCalledWith('test-token-123', 'df-1')
    expect(result.current.flows).toHaveLength(0)
  })

  it('deleteFlow restores on API failure (re-fetch)', async () => {
    const { result } = renderHook(() => useDispoFlows())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockDeleteDispoFlow.mockRejectedValueOnce(new Error('Network'))

    await act(async () => {
      await result.current.deleteFlow('df-1')
    })

    expect(mockGetDispoFlows).toHaveBeenCalledTimes(2)
  })

  it('incrementUsage updates count optimistically', async () => {
    const { result } = renderHook(() => useDispoFlows())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.incrementUsage('df-1')
    })

    const updated = result.current.flows.find((f) => f.id === 'df-1')
    expect(updated?.usageCount).toBe(4)
    expect(mockUseDispoFlowApi).toHaveBeenCalledWith('test-token-123', 'df-1')
  })

  // ── Migration ─────────────────────────────────────────────────────────

  it('migration: localStorage data triggers API create calls', async () => {
    storageMap.set(
      'mdm-dispo-flows',
      JSON.stringify([
        { id: 'old-1', name: 'Legacy Flow', disposition: 'discharge', followUp: ['PCP'] },
      ]),
    )

    renderHook(() => useDispoFlows())

    await waitFor(() => {
      expect(mockCreateDispoFlow).toHaveBeenCalledWith('test-token-123', {
        name: 'Legacy Flow',
        disposition: 'discharge',
        followUp: ['PCP'],
      })
    })

    expect(storageMap.get('mdm-dispo-flows-migrated')).toBe('1')
    expect(storageMap.has('mdm-dispo-flows')).toBe(false)
  })

  it('migration: sets flag without calling API if no legacy data', async () => {
    renderHook(() => useDispoFlows())

    await waitFor(() => {
      expect(mockGetDispoFlows).toHaveBeenCalled()
    })

    expect(storageMap.get('mdm-dispo-flows-migrated')).toBe('1')
    expect(mockCreateDispoFlow).not.toHaveBeenCalled()
  })

  it('migration: increments retry counter on failure', async () => {
    storageMap.set(
      'mdm-dispo-flows',
      JSON.stringify([{ id: 'old-1', name: 'Legacy', disposition: 'discharge', followUp: [] }]),
    )
    mockCreateDispoFlow.mockRejectedValueOnce(new Error('API down'))

    renderHook(() => useDispoFlows())

    await waitFor(() => {
      expect(storageMap.get('mdm-dispo-flows-migration-retries')).toBe('1')
    })
  })

  it('migration: stops after max retries', async () => {
    storageMap.set('mdm-dispo-flows-migration-retries', '3')
    storageMap.set(
      'mdm-dispo-flows',
      JSON.stringify([{ id: 'old-1', name: 'Legacy', disposition: 'discharge', followUp: [] }]),
    )

    renderHook(() => useDispoFlows())

    await waitFor(() => {
      expect(mockGetDispoFlows).toHaveBeenCalled()
    })

    expect(mockCreateDispoFlow).not.toHaveBeenCalled()
  })
})
