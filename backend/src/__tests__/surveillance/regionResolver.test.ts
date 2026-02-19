import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegionResolver, STATE_TO_HHS_REGION, STATE_NAMES } from '../../surveillance/regionResolver'

// Mock firebase-admin
const mockGet = vi.fn()
vi.mock('firebase-admin', () => ({
  default: {
    firestore: () => ({
      collection: () => ({
        doc: () => ({ get: mockGet }),
      }),
    }),
  },
}))

describe('RegionResolver', () => {
  let resolver: RegionResolver

  beforeEach(() => {
    vi.clearAllMocks()
    resolver = new RegionResolver()
  })

  describe('STATE_TO_HHS_REGION', () => {
    it('maps all 50 states plus DC', () => {
      const stateCount = Object.keys(STATE_TO_HHS_REGION).length
      expect(stateCount).toBeGreaterThanOrEqual(51) // 50 states + DC + territories
    })

    it('maps Texas to HHS Region 6', () => {
      expect(STATE_TO_HHS_REGION['TX']).toBe(6)
    })

    it('maps California to HHS Region 9', () => {
      expect(STATE_TO_HHS_REGION['CA']).toBe(9)
    })

    it('maps New York to HHS Region 2', () => {
      expect(STATE_TO_HHS_REGION['NY']).toBe(2)
    })
  })

  describe('resolveFromState', () => {
    it('resolves a valid state abbreviation', () => {
      const result = resolver.resolveFromState('TX')
      expect(result).not.toBeNull()
      expect(result!.state).toBe('Texas')
      expect(result!.stateAbbrev).toBe('TX')
      expect(result!.hhsRegion).toBe(6)
      expect(result!.geoLevel).toBe('state')
    })

    it('handles lowercase state abbreviation', () => {
      const result = resolver.resolveFromState('ca')
      expect(result).not.toBeNull()
      expect(result!.state).toBe('California')
    })

    it('returns null for invalid state', () => {
      const result = resolver.resolveFromState('XX')
      expect(result).toBeNull()
    })
  })

  describe('resolveFromZip', () => {
    it('resolves a valid zip code from Firestore', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ state: 'TX', county: 'Travis', fips: '48453' }),
      })

      const result = await resolver.resolveFromZip('78701')
      expect(result).not.toBeNull()
      expect(result!.zipCode).toBe('78701')
      expect(result!.state).toBe('Texas')
      expect(result!.county).toBe('Travis')
      expect(result!.fipsCode).toBe('48453')
      expect(result!.hhsRegion).toBe(6)
      expect(result!.geoLevel).toBe('county')
    })

    it('returns null when zip code is not found', async () => {
      mockGet.mockResolvedValueOnce({ exists: false })

      const result = await resolver.resolveFromZip('00000')
      expect(result).toBeNull()
    })

    it('returns null on Firestore error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Firestore unavailable'))

      const result = await resolver.resolveFromZip('78701')
      expect(result).toBeNull()
    })
  })

  describe('resolve', () => {
    it('prefers zip code over state when both provided', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ state: 'TX', county: 'Travis', fips: '48453' }),
      })

      const result = await resolver.resolve({ zipCode: '78701', state: 'CA' })
      expect(result!.stateAbbrev).toBe('TX') // from zip, not CA
      expect(result!.geoLevel).toBe('county')
    })

    it('falls back to state when zip lookup fails', async () => {
      mockGet.mockResolvedValueOnce({ exists: false })

      const result = await resolver.resolve({ zipCode: '00000', state: 'CA' })
      expect(result!.stateAbbrev).toBe('CA')
      expect(result!.geoLevel).toBe('state')
    })

    it('returns null when neither resolves', async () => {
      const result = await resolver.resolve({})
      expect(result).toBeNull()
    })
  })
})
