import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CdcRespiratoryAdapter } from '../../surveillance/adapters/cdcRespiratoryAdapter'
import type { ResolvedRegion } from '../../surveillance/types'

// Mock cache
vi.mock('../../surveillance/cache/surveillanceCache', () => ({
  SurveillanceCache: class {
    get = vi.fn().mockResolvedValue(null)
    set = vi.fn().mockResolvedValue(undefined)
  },
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const testRegion: ResolvedRegion = {
  state: 'Texas',
  stateAbbrev: 'TX',
  hhsRegion: 6,
  geoLevel: 'state',
}

describe('CdcRespiratoryAdapter', () => {
  let adapter: CdcRespiratoryAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new CdcRespiratoryAdapter()
  })

  describe('isRelevant', () => {
    it('returns true for respiratory syndromes', () => {
      expect(adapter.isRelevant(['respiratory_upper'])).toBe(true)
      expect(adapter.isRelevant(['respiratory_lower'])).toBe(true)
    })

    it('returns false for non-respiratory syndromes', () => {
      expect(adapter.isRelevant(['gastrointestinal'])).toBe(false)
      expect(adapter.isRelevant(['neurological'])).toBe(false)
    })
  })

  describe('fetch', () => {
    it('returns normalized data points from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            week_ending_date: '2026-02-08',
            jurisdiction: 'TX',
            percent_positive_influenza: '15.2',
            percent_positive_covid: '8.1',
            percent_positive_rsv: '12.5',
          },
          {
            week_ending_date: '2026-02-01',
            jurisdiction: 'TX',
            percent_positive_influenza: '13.0',
            percent_positive_covid: '7.5',
            percent_positive_rsv: '11.0',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].source).toBe('cdc_respiratory')
      expect(result[0].region).toBe('TX')
    })

    it('returns empty array for irrelevant syndromes', async () => {
      const result = await adapter.fetch(testRegion, ['gastrointestinal'])
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.fetch(testRegion, ['respiratory_upper'])).rejects.toThrow()
    })

    it('throws on timeout/network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))
      await expect(adapter.fetch(testRegion, ['respiratory_upper'])).rejects.toThrow()
    })
  })
})
