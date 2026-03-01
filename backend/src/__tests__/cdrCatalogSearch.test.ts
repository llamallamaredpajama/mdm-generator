import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/embeddingService', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(Array(768).fill(0.1))
}))

import { searchCdrCatalog } from '../services/cdrCatalogSearch'

describe('cdrCatalogSearch', () => {
  it('returns matched CDRs stripped of embedding field', async () => {
    const mockSnapshot = {
      docs: [
        {
          data: () => ({
            id: 'heart', name: 'HEART Score', fullName: 'History ECG Age Risk Troponin',
            category: 'CARDIOVASCULAR', components: [], scoring: { method: 'sum', ranges: [] },
            embedding: Array(768).fill(0.1),
          }),
          get: (field: string) => field === 'distance' ? 0.15 : undefined,
        }
      ]
    }
    const mockCollection = {
      findNearest: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockSnapshot) })
    }
    const mockDb = { collection: vi.fn().mockReturnValue(mockCollection) } as any

    const results = await searchCdrCatalog('chest pain cardiac', mockDb, 15)
    expect(results).toHaveLength(1)
    expect(results[0].cdr.id).toBe('heart')
    expect((results[0].cdr as any).embedding).toBeUndefined()
    expect(results[0].distance).toBe(0.15)
  })

  it('returns empty array on error (non-blocking)', async () => {
    const mockDb = { collection: vi.fn().mockImplementation(() => { throw new Error('fail') }) } as any
    const results = await searchCdrCatalog('chest pain', mockDb)
    expect(results).toEqual([])
  })
})
