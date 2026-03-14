import pino from 'pino'
import { config } from './config.js'

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() }),
  },
  redact: {
    paths: ['narrative', 'mdmText', 'content.narrative', 'req.body.narrative', 'req.body.content'],
    censor: '[REDACTED]',
  },
})

export type Logger = pino.Logger
