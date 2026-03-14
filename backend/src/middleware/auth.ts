import type { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import { AuthenticationError, AuthorizationError } from '../errors.js'
import type { UserService } from '../services/userService.js'

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

const PLAN_TIERS: Record<string, number> = { free: 0, pro: 1, enterprise: 2, admin: 3 }

export function createRequirePlan(userService: UserService) {
  return function requirePlan(minPlan: 'pro' | 'enterprise') {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const uid = req.user?.uid
        if (!uid) return next(new AuthenticationError())
        if (req.user?.admin) return next()

        const stats = await userService.getUsageStats(uid)
        const userTier = PLAN_TIERS[stats.plan] ?? 0
        const requiredTier = PLAN_TIERS[minPlan] ?? 1

        if (userTier < requiredTier) {
          return next(new AuthorizationError(
            `This feature requires a ${minPlan} plan`,
            { code: 'PLAN_REQUIRED', upgradeRequired: true, requiredPlan: minPlan }
          ))
        }
        next()
      } catch (err) {
        next(err)
      }
    }
  }
}

// Singleton — safe because middleware is only called at request time (after Firebase init)
export const authenticate = createAuthMiddleware(admin)
