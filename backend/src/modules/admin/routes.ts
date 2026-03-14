import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { AdminPlanBodySchema } from './schemas'
import { createAdminController } from './controller'
import type { AdminDeps } from '../../dependencies'

export function createAdminRoutes(deps: AdminDeps): Router {
  const router = Router()
  const { setPlan } = createAdminController(deps)

  router.post('/v1/admin/set-plan', authenticate, requireAdmin, validate(AdminPlanBodySchema), asyncHandler(setPlan))

  return router
}
