/**
 * Retrying LLM Client Decorator
 *
 * Wraps any ILlmClient with automatic retry on transient failures.
 * Transparent to all consumers — they just get an ILlmClient.
 */

import type { ILlmClient, LlmPrompt, LlmOptions, LlmResponse } from './llmClient.js'
import { type RetryConfig, DEFAULT_RETRY_CONFIG, isRetryable, calculateDelay } from './retryPolicy.js'

export class RetryingLlmClient implements ILlmClient {
  constructor(
    private readonly inner: ILlmClient,
    private readonly config: RetryConfig = DEFAULT_RETRY_CONFIG,
    private readonly log?: { warn: (obj: object, msg: string) => void },
  ) {}

  async generate(prompt: LlmPrompt, options?: LlmOptions): Promise<LlmResponse> {
    const startMs = Date.now()
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      // Check total time budget
      const elapsed = Date.now() - startMs
      if (attempt > 0 && elapsed >= this.config.totalBudgetMs) {
        break
      }

      try {
        return await this.inner.generate(prompt, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt >= this.config.maxRetries || !isRetryable(error)) {
          throw lastError
        }

        const delayMs = calculateDelay(attempt, this.config)
        const remaining = this.config.totalBudgetMs - (Date.now() - startMs)

        if (delayMs >= remaining) {
          // Not enough budget for retry + delay
          throw lastError
        }

        this.log?.warn(
          { attempt: attempt + 1, delayMs, error: lastError.message },
          'LLM call failed, retrying',
        )

        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw lastError ?? new Error('Retry loop exhausted without error')
  }
}
