import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { AdminPlanBodySchema } from './schemas.js'
import { createAdminController } from './controller.js'
import type { AdminDeps } from '../../dependencies.js'

export function createAdminRoutes(deps: AdminDeps): Router {
  const router = Router()
  const { setPlan } = createAdminController(deps)

  router.post('/v1/admin/set-plan', authenticate, requireAdmin, validate(AdminPlanBodySchema), asyncHandler(setPlan))

  return router
}
