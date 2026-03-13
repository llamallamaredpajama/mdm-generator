import type { Request, Response, NextFunction } from 'express'
import type admin from 'firebase-admin'
import { AuthenticationError, AuthorizationError } from '../errors'

export function createAuthMiddleware(firebaseAdmin: typeof admin) {
  return async function authenticate(req: Request, _res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization?.split('Bearer ')[1]
    const bodyToken = req.body?.userIdToken as string | undefined

    const token = bearerToken || bodyToken

    if (bodyToken && !bearerToken) {
      req.log?.warn({ action: 'auth-body-token-deprecated' },
        'Body-token auth is deprecated. Migrate to Authorization: Bearer header.')
    }

    if (!token) {
      return next(new AuthenticationError())
    }

    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(token)
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        admin: decoded.admin === true,
      }
      next()
    } catch {
      next(new AuthenticationError())
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.admin) {
    return next(new AuthorizationError('Admin access required'))
  }
  next()
}

export function requirePlan(minPlan: 'pro' | 'enterprise') {
  return (_req: Request, _res: Response, next: NextFunction) => next()
}
