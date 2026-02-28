import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}))

vi.mock('google-auth-library', () => ({
  GoogleAuth: function () {
    return {
      getClient: vi.fn().mockResolvedValue({
        request: mockRequest,
      }),
    }
  },
}))

import { generateEmbedding, generateEmbeddings } from '../services/embeddingService'

beforeEach(() => {
  mockRequest.mockReset()
  // Return predictions matching the number of instances in the request
  mockRequest.mockImplementation(({ data }: { data: { instances: unknown[] } }) => ({
    data: {
      predictions: data.instances.map(() => ({
        embeddings: { values: Array(768).fill(0.1) },
      })),
    },
  }))
})

describe('embeddingService', () => {
  it('generateEmbedding returns 768-dim vector', async () => {
    const result = await generateEmbedding('chest pain', 'RETRIEVAL_QUERY')
    expect(result).toHaveLength(768)
    expect(typeof result[0]).toBe('number')
  })

  it('generateEmbeddings batches texts and returns array of vectors', async () => {
    const texts = ['chest pain', 'headache', 'abdominal pain']
    const results = await generateEmbeddings(texts, 'RETRIEVAL_DOCUMENT')
    expect(results).toHaveLength(3)
    results.forEach(r => expect(r).toHaveLength(768))
  })

  it('generateEmbeddings handles empty input', async () => {
    const results = await generateEmbeddings([], 'RETRIEVAL_DOCUMENT')
    expect(results).toHaveLength(0)
    expect(mockRequest).not.toHaveBeenCalled()
  })
})
