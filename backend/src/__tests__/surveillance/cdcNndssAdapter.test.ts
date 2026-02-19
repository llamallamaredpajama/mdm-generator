import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CdcNndssAdapter } from '../../surveillance/adapters/cdcNndssAdapter'
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
  state: 'New York',
  stateAbbrev: 'NY',
  hhsRegion: 2,
  geoLevel: 'state',
}

describe('CdcNndssAdapter', () => {
  let adapter: CdcNndssAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new CdcNndssAdapter()
  })

  describe('isRelevant', () => {
    it('returns true for neurological syndromes', () => {
      expect(adapter.isRelevant(['neurological'])).toBe(true)
    })

    it('returns true for vector-borne syndromes', () => {
      expect(adapter.isRelevant(['vector_borne'])).toBe(true)
    })

    it('returns true for bioterrorism sentinel syndromes', () => {
      expect(adapter.isRelevant(['bioterrorism_sentinel'])).toBe(true)
    })

    it('returns false for respiratory-only syndromes', () => {
      expect(adapter.isRelevant(['respiratory_upper'])).toBe(false)
      expect(adapter.isRelevant(['respiratory_lower'])).toBe(false)
    })

    it('returns false for gastrointestinal syndromes', () => {
      expect(adapter.isRelevant(['gastrointestinal'])).toBe(false)
    })
  })

  describe('fetch', () => {
    it('returns normalized data points from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            disease: 'West Nile Virus',
            mmwr_year: '2026',
            mmwr_week: '5',
            current_week: '12',
          },
          {
            disease: 'West Nile Virus',
            mmwr_year: '2026',
            mmwr_week: '4',
            current_week: '10',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['neurological'])
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].source).toBe('cdc_nndss')
      expect(result[0].condition).toBe('West Nile Virus')
      expect(result[0].unit).toBe('case_count')
      expect(result[0].geoLevel).toBe('national')
    })

    it('returns empty array for irrelevant syndromes', async () => {
      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.fetch(testRegion, ['neurological'])).rejects.toThrow()
    })

    it('throws on timeout/network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))
      await expect(adapter.fetch(testRegion, ['vector_borne'])).rejects.toThrow()
    })

    it('computes trend from consecutive data points', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { disease: 'Lyme Disease', mmwr_year: '2026', mmwr_week: '5', current_week: '25' },
          { disease: 'Lyme Disease', mmwr_year: '2026', mmwr_week: '4', current_week: '20' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['vector_borne'])
      const lymePoints = result.filter((dp) => dp.condition === 'Lyme Disease')
      expect(lymePoints.length).toBe(2)
      // 25/20 = 25% increase — exceeds 10% threshold → 'rising'
      expect(lymePoints[0].trend).toBe('rising')
    })

    it('handles bioterrorism sentinel conditions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { disease: 'Anthrax', mmwr_year: '2026', mmwr_week: '5', current_week: '0' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['bioterrorism_sentinel'])
      // Value 0 is filtered (NaN check or 0 case count)
      // But 0 is still a valid number — should still produce a data point
      expect(result.length).toBe(1)
      expect(result[0].condition).toBe('Anthrax')
      expect(result[0].syndromes).toContain('bioterrorism_sentinel')
    })

    it('handles rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })
      await expect(adapter.fetch(testRegion, ['neurological'])).rejects.toThrow(
        'CDC NNDSS API error: 429',
      )
    })
  })
})
