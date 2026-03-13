import type { ZodIssue } from 'zod'

export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly code: string
  readonly isOperational = true

  toJSON() {
    return { error: this.message, code: this.code }
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'
  constructor(message = 'Unauthorized') { super(message) }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403
  readonly code = 'FORBIDDEN'
  constructor(message = 'Forbidden', public readonly details?: Record<string, unknown>) { super(message) }
}

export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly code = 'VALIDATION_ERROR'
  constructor(message = 'Invalid request', public readonly details?: ZodIssue[]) { super(message) }
}

export class QuotaExceededError extends AppError {
  readonly statusCode = 402
  readonly code = 'QUOTA_EXCEEDED'
  constructor(message: string, public readonly quotaInfo: { remaining: number; plan: string; limit: number; used: number }) { super(message) }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly code = 'NOT_FOUND'
  constructor(message = 'Not found') { super(message) }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly code = 'RATE_LIMITED'
  constructor(message = 'Too many requests', public readonly retryAfterMs?: number) { super(message) }
}

export class LlmError extends AppError {
  readonly statusCode = 500
  readonly code = 'LLM_ERROR'
  constructor(message = 'LLM generation failed') { super(message) }
}

export class SectionLockedError extends AppError {
  readonly statusCode = 400
  readonly code = 'SECTION_LOCKED'
  constructor(public readonly section: number) { super(`Section ${section} is locked`) }
}
