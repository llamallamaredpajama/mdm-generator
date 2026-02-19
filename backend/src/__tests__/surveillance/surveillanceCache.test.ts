import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SurveillanceCache } from '../../surveillance/cache/surveillanceCache'
import type { SurveillanceDataPoint } from '../../surveillance/types'

const mockGet = vi.fn()
const mockSet = vi.fn()

vi.mock('firebase-admin', () => ({
  default: {
    firestore: () => ({
      collection: () => ({
        doc: () => ({ get: mockGet, set: mockSet }),
      }),
    }),
  },
}))

const sampleDataPoint: SurveillanceDataPoint = {
  source: 'cdc_respiratory',
  condition: 'Influenza',
  syndromes: ['respiratory_upper'],
  region: 'TX',
  geoLevel: 'state',
  periodStart: '2026-02-01',
  periodEnd: '2026-02-08',
  value: 15.2,
  unit: 'percent_positive',
  trend: 'rising',
  trendMagnitude: 12,
}

describe('SurveillanceCache', () => {
  let cache: SurveillanceCache

  beforeEach(() => {
    vi.clearAllMocks()
    cache = new SurveillanceCache()
    mockSet.mockResolvedValue(undefined)
  })

  describe('get', () => {
    it('returns data on cache hit (not expired)', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          dataPoints: [sampleDataPoint],
          expiresAt: Date.now() + 60000, // still valid
        }),
      })

      const result = await cache.get('test_key')
      expect(result).toEqual([sampleDataPoint])
    })

    it('returns null on cache miss (expired)', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          dataPoints: [sampleDataPoint],
          expiresAt: Date.now() - 1000, // expired
        }),
      })

      const result = await cache.get('test_key')
      expect(result).toBeNull()
    })

    it('returns null when document not found', async () => {
      mockGet.mockResolvedValueOnce({ exists: false })

      const result = await cache.get('missing_key')
      expect(result).toBeNull()
    })

    it('returns null on Firestore error (non-critical)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Firestore unavailable'))

      const result = await cache.get('error_key')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('stores data with TTL', async () => {
      await cache.set('test_key', [sampleDataPoint], 60000)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          dataPoints: [sampleDataPoint],
          key: 'test_key',
        })
      )

      const setCall = mockSet.mock.calls[0][0]
      expect(setCall.expiresAt).toBeGreaterThan(setCall.cachedAt)
    })

    it('does not throw on Firestore error', async () => {
      mockSet.mockRejectedValueOnce(new Error('Write failed'))
      // Should not throw
      await expect(cache.set('key', [sampleDataPoint], 60000)).resolves.toBeUndefined()
    })
  })
})
