import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { logger } from '../logger'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const traceHeader = req.headers['x-cloud-trace-context'] as string | undefined
  const requestId = traceHeader?.split('/')[0] || randomUUID()

  req.requestId = requestId
  req.log = logger.child({ requestId })

  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    req.log!.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
    })
  })

  next()
}
