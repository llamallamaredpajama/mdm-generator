import type pino from 'pino'

declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email?: string; admin?: boolean }
      requestId?: string
      log?: pino.Logger
    }
  }
}
