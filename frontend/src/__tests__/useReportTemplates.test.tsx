/**
 * useReportTemplates Hook Tests (API-backed)
 *
 * Tests API-backed CRUD, localStorage migration, and retry logic.
 */

/// <reference types="vitest/globals" />
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReportTemplate } from '../types/userProfile'

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
  mockGetReportTemplates,
  mockCreateReportTemplate,
  mockDeleteReportTemplate,
  mockUseReportTemplateApi,
} = vi.hoisted(() => ({
  mockUseAuthToken: vi.fn().mockReturnValue('test-token-123'),
  mockGetReportTemplates: vi.fn(),
  mockCreateReportTemplate: vi.fn(),
  mockDeleteReportTemplate: vi.fn(),
  mockUseReportTemplateApi: vi.fn(),
}))

vi.mock('../lib/firebase', () => ({
  db: {},
  getAppDb: vi.fn(() => ({})),
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  useAuthToken: mockUseAuthToken,
}))

vi.mock('../lib/api', () => ({
  getReportTemplates: (...args: unknown[]) => mockGetReportTemplates(...args),
  createReportTemplate: (...args: unknown[]) => mockCreateReportTemplate(...args),
  deleteReportTemplate: (...args: unknown[]) => mockDeleteReportTemplate(...args),
  useReportTemplate: (...args: unknown[]) => mockUseReportTemplateApi(...args),
}))

// ── Test Data ─────────────────────────────────────────────────────────────

const mockTemplates: ReportTemplate[] = [
  {
    id: 'rt-1',
    testId: 'ecg',
    name: 'Normal ECG',
    text: 'NSR, normal intervals',
    defaultStatus: 'unremarkable',
    createdAt: '2026-01-01T00:00:00Z',
    usageCount: 5,
  },
]

const { useReportTemplates } = await import('../hooks/useReportTemplates')

// ── Tests ─────────────────────────────────────────────────────────────────

describe('useReportTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMap.clear()
    mockUseAuthToken.mockReturnValue('test-token-123')
    mockGetReportTemplates.mockResolvedValue({ ok: true, items: mockTemplates })
    mockCreateReportTemplate.mockResolvedValue({
      ok: true,
      item: {
        id: 'rt-new',
        testId: 'troponin',
        name: 'Normal Troponin',
        text: '<0.04 ng/mL',
        defaultStatus: 'unremarkable',
        createdAt: '2026-02-01T00:00:00Z',
        usageCount: 0,
      },
    })
    mockDeleteReportTemplate.mockResolvedValue({ ok: true })
    mockUseReportTemplateApi.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    storageMap.clear()
  })

  it('fetches templates on mount when token available', async () => {
    const { result } = renderHook(() => useReportTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetReportTemplates).toHaveBeenCalledWith('test-token-123')
    expect(result.current.templates).toEqual(mockTemplates)
  })

  it('returns empty state when no token', () => {
    mockUseAuthToken.mockReturnValue(null)

    const { result } = renderHook(() => useReportTemplates())

    expect(result.current.templates).toEqual([])
    expect(mockGetReportTemplates).not.toHaveBeenCalled()
  })

  it('saveTemplate calls API and adds to state', async () => {
    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let saved: ReportTemplate | null = null
    await act(async () => {
      saved = await result.current.saveTemplate('troponin', 'Normal Troponin', '<0.04 ng/mL')
    })

    expect(saved).toBeTruthy()
    expect(saved!.id).toBe('rt-new')
    expect(mockCreateReportTemplate).toHaveBeenCalledWith('test-token-123', {
      testId: 'troponin',
      name: 'Normal Troponin',
      text: '<0.04 ng/mL',
      defaultStatus: 'unremarkable',
    })
    expect(result.current.templates).toHaveLength(2)
  })

  it('saveTemplate returns null on API failure', async () => {
    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockCreateReportTemplate.mockRejectedValueOnce(new Error('Network error'))

    let saved: ReportTemplate | null = null
    await act(async () => {
      saved = await result.current.saveTemplate('ecg', 'Fail', 'text')
    })

    expect(saved).toBeNull()
  })

  it('deleteTemplate removes optimistically, calls API', async () => {
    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteTemplate('rt-1')
    })

    expect(mockDeleteReportTemplate).toHaveBeenCalledWith('test-token-123', 'rt-1')
    expect(result.current.templates).toHaveLength(0)
  })

  it('deleteTemplate restores on API failure (re-fetch)', async () => {
    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockDeleteReportTemplate.mockRejectedValueOnce(new Error('Network'))

    await act(async () => {
      await result.current.deleteTemplate('rt-1')
    })

    expect(mockGetReportTemplates).toHaveBeenCalledTimes(2)
  })

  it('incrementUsage updates count optimistically', async () => {
    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.incrementUsage('rt-1')
    })

    const updated = result.current.templates.find((t) => t.id === 'rt-1')
    expect(updated?.usageCount).toBe(6)
    expect(mockUseReportTemplateApi).toHaveBeenCalledWith('test-token-123', 'rt-1')
  })

  it('getTemplatesForTest filters by testId', async () => {
    mockGetReportTemplates.mockResolvedValue({
      ok: true,
      items: [
        ...mockTemplates,
        {
          id: 'rt-2',
          testId: 'troponin',
          name: 'High Troponin',
          text: '>0.5',
          defaultStatus: 'abnormal',
          createdAt: '',
          usageCount: 0,
        },
      ],
    })

    const { result } = renderHook(() => useReportTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ecgTemplates = result.current.getTemplatesForTest('ecg')
    expect(ecgTemplates).toHaveLength(1)
    expect(ecgTemplates[0].id).toBe('rt-1')

    const troponinTemplates = result.current.getTemplatesForTest('troponin')
    expect(troponinTemplates).toHaveLength(1)
  })

  // ── Migration ─────────────────────────────────────────────────────────

  it('migration: localStorage data triggers API create calls', async () => {
    storageMap.set(
      'mdm-report-templates',
      JSON.stringify([
        {
          id: 'old-1',
          testId: 'ecg',
          name: 'Legacy ECG',
          text: 'NSR',
          defaultStatus: 'unremarkable',
        },
      ]),
    )

    renderHook(() => useReportTemplates())

    await waitFor(() => {
      expect(mockCreateReportTemplate).toHaveBeenCalledWith('test-token-123', {
        testId: 'ecg',
        name: 'Legacy ECG',
        text: 'NSR',
        defaultStatus: 'unremarkable',
      })
    })

    expect(storageMap.get('mdm-report-templates-migrated')).toBe('1')
    expect(storageMap.has('mdm-report-templates')).toBe(false)
  })

  it('migration: increments retry counter on failure', async () => {
    storageMap.set(
      'mdm-report-templates',
      JSON.stringify([
        { id: 'old-1', testId: 'ecg', name: 'Legacy', text: 'NSR', defaultStatus: 'unremarkable' },
      ]),
    )
    mockCreateReportTemplate.mockRejectedValueOnce(new Error('API down'))

    renderHook(() => useReportTemplates())

    await waitFor(() => {
      expect(storageMap.get('mdm-report-templates-migration-retries')).toBe('1')
    })
  })

  it('migration: stops after max retries', async () => {
    storageMap.set('mdm-report-templates-migration-retries', '3')
    storageMap.set(
      'mdm-report-templates',
      JSON.stringify([{ id: 'old-1', testId: 'ecg', name: 'Legacy', text: 'NSR' }]),
    )

    renderHook(() => useReportTemplates())

    await waitFor(() => {
      expect(mockGetReportTemplates).toHaveBeenCalled()
    })

    expect(mockCreateReportTemplate).not.toHaveBeenCalled()
  })
})
