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
            weekendingdate: '2026-02-14T00:00:00.000',
            jurisdiction: 'TX',
            pctconfc19inptbeds: '1.25',
            pctconffluinptbeds: '3.40',
            pctconfrsvinptbeds: '0.80',
            totalconfc19newadmpctchg: '-11.49',
            totalconfflunewadmpctchg: '-21.54',
          },
          {
            weekendingdate: '2026-02-07T00:00:00.000',
            jurisdiction: 'TX',
            pctconfc19inptbeds: '1.30',
            pctconffluinptbeds: '3.10',
            pctconfrsvinptbeds: '0.90',
            totalconfc19newadmpctchg: '20.15',
            totalconfflunewadmpctchg: '24.82',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].source).toBe('cdc_respiratory')
      expect(result[0].region).toBe('TX')
      expect(result[0].unit).toBe('pct_inpatient_beds')
    })

    it('parses all three conditions (Influenza, COVID-19, RSV)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            weekendingdate: '2026-02-14T00:00:00.000',
            jurisdiction: 'TX',
            pctconfc19inptbeds: '1.25',
            pctconffluinptbeds: '3.40',
            pctconfrsvinptbeds: '0.80',
            totalconfc19newadmpctchg: '-11.49',
            totalconfflunewadmpctchg: '-21.54',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      const conditions = result.map((dp) => dp.condition)
      expect(conditions).toContain('Influenza')
      expect(conditions).toContain('COVID-19')
      expect(conditions).toContain('RSV')
    })

    it('uses precomputed pctchg for trend when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            weekendingdate: '2026-02-14T00:00:00.000',
            jurisdiction: 'TX',
            pctconfc19inptbeds: '1.25',
            pctconffluinptbeds: '3.40',
            totalconfc19newadmpctchg: '-11.49',
            totalconfflunewadmpctchg: '24.82',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      const covid = result.find((dp) => dp.condition === 'COVID-19')
      const flu = result.find((dp) => dp.condition === 'Influenza')
      expect(covid?.trend).toBe('falling')
      expect(covid?.trendMagnitude).toBe(11)
      expect(flu?.trend).toBe('rising')
      expect(flu?.trendMagnitude).toBe(25)
    })

    it('computes fallback trend for RSV from 2-point comparison', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            weekendingdate: '2026-02-14T00:00:00.000',
            jurisdiction: 'TX',
            pctconfrsvinptbeds: '1.20',
          },
          {
            weekendingdate: '2026-02-07T00:00:00.000',
            jurisdiction: 'TX',
            pctconfrsvinptbeds: '0.80',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_lower'])
      const rsvPoints = result.filter((dp) => dp.condition === 'RSV')
      expect(rsvPoints.length).toBe(2)
      // 1.20/0.80 = 50% increase → 'rising'
      expect(rsvPoints[0].trend).toBe('rising')
      expect(rsvPoints[0].trendMagnitude).toBe(50)
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
