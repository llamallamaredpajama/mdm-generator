import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors'
import { logger } from '../logger'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      (req.log || logger).error({ err, code: err.code }, err.message)
    }
    const body: Record<string, unknown> = { error: err.message, code: err.code }
    if ('details' in err && err.details) body.details = err.details
    if ('quotaInfo' in err && err.quotaInfo) body.quotaInfo = err.quotaInfo
    if ('retryAfterMs' in err && err.retryAfterMs) body.retryAfterMs = err.retryAfterMs
    return res.status(err.statusCode).json(body)
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', code: 'VALIDATION_ERROR', details: err.errors })
  }

  (req.log || logger).error({ err }, 'Unhandled error')
  return res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' })
}
