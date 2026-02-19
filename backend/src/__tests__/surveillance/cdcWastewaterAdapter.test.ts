import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CdcWastewaterAdapter } from '../../surveillance/adapters/cdcWastewaterAdapter'
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

describe('CdcWastewaterAdapter', () => {
  let adapter: CdcWastewaterAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new CdcWastewaterAdapter()
  })

  describe('isRelevant', () => {
    it('returns true for respiratory syndromes', () => {
      expect(adapter.isRelevant(['respiratory_upper'])).toBe(true)
      expect(adapter.isRelevant(['respiratory_lower'])).toBe(true)
    })

    it('returns true for gastrointestinal syndromes', () => {
      expect(adapter.isRelevant(['gastrointestinal'])).toBe(true)
    })

    it('returns false for non-covered syndromes', () => {
      expect(adapter.isRelevant(['neurological'])).toBe(false)
      expect(adapter.isRelevant(['vector_borne'])).toBe(false)
    })
  })

  describe('fetch', () => {
    it('returns normalized data points from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            date: '2026-02-08',
            pathogen: 'SARS-CoV-2',
            percentile: '75.3',
            state: 'TX',
          },
          {
            date: '2026-02-01',
            pathogen: 'SARS-CoV-2',
            percentile: '68.0',
            state: 'TX',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].source).toBe('cdc_wastewater')
      expect(result[0].region).toBe('TX')
      expect(result[0].unit).toBe('wastewater_concentration')
    })

    it('returns empty array for irrelevant syndromes', async () => {
      const result = await adapter.fetch(testRegion, ['neurological'])
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

    it('computes trend from consecutive data points', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { date: '2026-02-08', pathogen: 'RSV', percentile: '80.0' },
          { date: '2026-02-01', pathogen: 'RSV', percentile: '60.0' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_lower'])
      const rsvPoints = result.filter((dp) => dp.condition === 'RSV')
      expect(rsvPoints.length).toBe(2)
      // 80/60 = 33% increase — should be 'rising'
      expect(rsvPoints[0].trend).toBe('rising')
    })

    it('handles rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })
      await expect(adapter.fetch(testRegion, ['gastrointestinal'])).rejects.toThrow(
        'CDC Wastewater API error: 429',
      )
    })
  })
})
