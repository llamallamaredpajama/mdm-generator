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
            key_plot_id: 'CDC_VERILY_tx_2850_Treatment plant_post grit removal',
            date: '2026-02-18',
            pcr_conc_lin: '28125454.38',
            normalization: 'flow-population',
          },
          {
            key_plot_id: 'NWSS_tx_256_Treatment plant_raw wastewater',
            date: '2026-02-18',
            pcr_conc_lin: '15048191.55',
            normalization: 'flow-population',
          },
          {
            key_plot_id: 'CDC_VERILY_tx_2850_Treatment plant_post grit removal',
            date: '2026-02-11',
            pcr_conc_lin: '20000000.00',
            normalization: 'flow-population',
          },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].source).toBe('cdc_wastewater')
      expect(result[0].region).toBe('TX')
      expect(result[0].condition).toBe('SARS-CoV-2')
      expect(result[0].unit).toBe('wastewater_concentration')
    })

    it('aggregates multiple sites per date into median', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { key_plot_id: 'NWSS_tx_100_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '10000000' },
          { key_plot_id: 'NWSS_tx_200_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '30000000' },
          { key_plot_id: 'NWSS_tx_300_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '20000000' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_lower'])
      // 3 sites on same date → should aggregate to 1 data point
      expect(result.length).toBe(1)
      // Median of [10M, 20M, 30M] = 20M
      expect(result[0].value).toBe(20000000)
    })

    it('filters out records from other states', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { key_plot_id: 'NWSS_tx_100_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '10000000' },
          { key_plot_id: 'NWSS_ca_200_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '30000000' },
          { key_plot_id: 'CDC_VERILY_fl_300_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '5000000' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      // Only TX record should remain
      expect(result.length).toBe(1)
      expect(result[0].value).toBe(10000000)
    })

    it('computes trend from consecutive dates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { key_plot_id: 'NWSS_tx_100_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '30000000' },
          { key_plot_id: 'NWSS_tx_100_Treatment plant_raw', date: '2026-02-11', pcr_conc_lin: '15000000' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_lower'])
      expect(result.length).toBe(2)
      // 30M / 15M = 100% increase → rising
      expect(result[0].trend).toBe('rising')
      expect(result[0].trendMagnitude).toBe(100)
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

    it('handles rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })
      await expect(adapter.fetch(testRegion, ['gastrointestinal'])).rejects.toThrow(
        'CDC Wastewater API error: 429',
      )
    })

    it('returns empty when no data for the target state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { key_plot_id: 'NWSS_ca_100_Treatment plant_raw', date: '2026-02-18', pcr_conc_lin: '10000000' },
        ]),
      })

      const result = await adapter.fetch(testRegion, ['respiratory_upper'])
      expect(result).toEqual([])
    })
  })
})
