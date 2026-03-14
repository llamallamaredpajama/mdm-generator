import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { AdminPlanBodySchema } from './schemas'
import { setPlan } from './controller'

const router = Router()

router.post('/v1/admin/set-plan', authenticate, requireAdmin, validate(AdminPlanBodySchema), asyncHandler(setPlan))

export default router
