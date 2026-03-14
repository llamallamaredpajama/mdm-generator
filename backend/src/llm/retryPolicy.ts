/**
 * Retry policy for LLM calls.
 *
 * Classifies errors into retryable vs non-retryable:
 * - Retryable: timeouts, 5xx, 429 (rate limit)
 * - Non-retryable: 4xx (client errors), safety blocks
 */

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  /** Total time budget for all attempts (prevents exceeding Cloud Run timeout) */
  totalBudgetMs: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 3000,
  totalBudgetMs: 30_000,
}

/**
 * Classify whether an error is retryable.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()

  // Timeouts are retryable
  if (message.includes('timeout') || message.includes('timed out')) return true

  // Rate limits are retryable (but NOT quota exhaustion — that's a billing/limit issue)
  if (message.includes('429') || message.includes('rate limit')) return true

  // Server errors are retryable
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) return true
  if (message.includes('internal server error') || message.includes('service unavailable')) return true

  // Network errors are retryable
  if (message.includes('econnrefused') || message.includes('econnreset') || message.includes('fetch failed')) return true

  // Safety blocks are NOT retryable (same content will be blocked again)
  if (message.includes('safety') || message.includes('blocked') || message.includes('harm')) return false

  // 4xx client errors are NOT retryable
  if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) return false

  // Default: don't retry unknown errors
  return false
}

/**
 * Calculate delay with exponential backoff + jitter.
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt)
  const capped = Math.min(exponentialDelay, config.maxDelayMs)
  // Add 10-20% jitter to prevent thundering herd
  const jitter = capped * (0.1 + Math.random() * 0.1)
  return Math.round(capped + jitter)
}
