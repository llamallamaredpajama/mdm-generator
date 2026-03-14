import rateLimit from 'express-rate-limit'
import { config } from '../config.js'

export function createRateLimiter(opts: { windowMs?: number; max: number }) {
  return rateLimit({
    windowMs: opts.windowMs || 60_000,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  })
}

export const globalLimiter = createRateLimiter({ max: config.limits.globalRateLimit })
export const llmLimiter = createRateLimiter({ max: config.limits.llmRateLimit })
export const parseLimiter = createRateLimiter({ max: config.limits.parseRateLimit })
