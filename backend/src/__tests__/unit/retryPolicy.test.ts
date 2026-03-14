/**
 * Unit tests for retry policy.
 */

import { describe, it, expect } from 'vitest'
import { isRetryable, calculateDelay, DEFAULT_RETRY_CONFIG } from '../../llm/retryPolicy.js'
import { RetryingLlmClient } from '../../llm/retryingLlmClient.js'
import type { ILlmClient, LlmResponse } from '../../llm/llmClient.js'

describe('isRetryable', () => {
  it('retries timeouts', () => {
    expect(isRetryable(new Error('Vertex AI generation timed out'))).toBe(true)
    expect(isRetryable(new Error('Request timeout'))).toBe(true)
  })

  it('retries server errors', () => {
    expect(isRetryable(new Error('503 Service Unavailable'))).toBe(true)
    expect(isRetryable(new Error('Internal server error'))).toBe(true)
  })

  it('retries rate limits', () => {
    expect(isRetryable(new Error('429 Too Many Requests'))).toBe(true)
    expect(isRetryable(new Error('Rate limit exceeded'))).toBe(true)
  })

  it('retries network errors', () => {
    expect(isRetryable(new Error('ECONNREFUSED'))).toBe(true)
    expect(isRetryable(new Error('fetch failed'))).toBe(true)
  })

  it('does not retry safety blocks', () => {
    expect(isRetryable(new Error('Content blocked due to safety'))).toBe(false)
  })

  it('does not retry client errors', () => {
    expect(isRetryable(new Error('400 Bad Request'))).toBe(false)
    expect(isRetryable(new Error('401 Unauthorized'))).toBe(false)
  })

  it('does not retry quota exhaustion errors', () => {
    expect(isRetryable(new Error('Quota exceeded for model'))).toBe(false)
    expect(isRetryable(new Error('Resource exhausted: quota limit reached'))).toBe(false)
  })

  it('does not retry non-Error values', () => {
    expect(isRetryable('string error')).toBe(false)
    expect(isRetryable(null)).toBe(false)
  })
})

describe('calculateDelay', () => {
  it('uses exponential backoff', () => {
    const d0 = calculateDelay(0, DEFAULT_RETRY_CONFIG)
    const d1 = calculateDelay(1, DEFAULT_RETRY_CONFIG)
    // d1 should be approximately 2x d0 (with jitter)
    expect(d1).toBeGreaterThan(d0)
  })

  it('caps at maxDelayMs', () => {
    const d5 = calculateDelay(5, DEFAULT_RETRY_CONFIG)
    // With jitter, should be at most maxDelayMs * 1.2
    expect(d5).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxDelayMs * 1.3)
  })
})

describe('RetryingLlmClient', () => {
  function mockClient(responses: (LlmResponse | Error)[]): ILlmClient {
    let callIndex = 0
    return {
      async generate() {
        const response = responses[callIndex++]
        if (response instanceof Error) throw response
        return response
      },
    }
  }

  const ok: LlmResponse = { text: 'Success', latencyMs: 100 }

  it('returns on first success', async () => {
    const client = new RetryingLlmClient(mockClient([ok]))
    const result = await client.generate({ system: '', user: '' })
    expect(result.text).toBe('Success')
  })

  it('retries on retryable error then succeeds', async () => {
    const client = new RetryingLlmClient(
      mockClient([new Error('503 Service Unavailable'), ok]),
      { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20, totalBudgetMs: 5000 },
    )
    const result = await client.generate({ system: '', user: '' })
    expect(result.text).toBe('Success')
  })

  it('throws on non-retryable error immediately', async () => {
    const client = new RetryingLlmClient(
      mockClient([new Error('Content blocked due to safety')]),
      { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20, totalBudgetMs: 5000 },
    )
    await expect(client.generate({ system: '', user: '' })).rejects.toThrow('safety')
  })

  it('throws after max retries exhausted', async () => {
    const client = new RetryingLlmClient(
      mockClient([
        new Error('503 Service Unavailable'),
        new Error('503 Service Unavailable'),
        new Error('503 Service Unavailable'),
      ]),
      { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20, totalBudgetMs: 5000 },
    )
    await expect(client.generate({ system: '', user: '' })).rejects.toThrow('503')
  })
})
