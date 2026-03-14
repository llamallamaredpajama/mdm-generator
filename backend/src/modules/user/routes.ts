import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import {
  OrderSetCreateSchema,
  OrderSetUpdateSchema,
  DispositionFlowCreateSchema,
  DispositionFlowUpdateSchema,
  ReportTemplateCreateSchema,
  ReportTemplateUpdateSchema,
  CustomizableOptionsSchema,
} from '../../types/userProfile.js'
import { CompleteOnboardingSchema } from './schemas.js'
import { createUserController } from './controller.js'
import type { UserModuleDeps } from '../../dependencies.js'

export function createUserRoutes(deps: UserModuleDeps): Router {
  const router = Router()
  const c = createUserController(deps)

  // ── Whoami ────────────────────────────────────────────────────────────────
  router.post('/v1/whoami', authenticate, asyncHandler(c.whoami))

  // ── Onboarding ────────────────────────────────────────────────────────────
  router.post('/v1/user/complete-onboarding', authenticate, validate(CompleteOnboardingSchema), asyncHandler(c.completeOnboarding))

  // ── Order Sets CRUD ───────────────────────────────────────────────────────
  router.get('/v1/user/order-sets', authenticate, asyncHandler(c.listOrderSets))
  router.post('/v1/user/order-sets', authenticate, validate(OrderSetCreateSchema), asyncHandler(c.createOrderSet))
  router.put('/v1/user/order-sets/:id', authenticate, validate(OrderSetUpdateSchema), asyncHandler(c.updateOrderSet))
  router.delete('/v1/user/order-sets/:id', authenticate, asyncHandler(c.deleteOrderSet))
  router.post('/v1/user/order-sets/:id/use', authenticate, asyncHandler(c.useOrderSet))

  // ── Disposition Flows CRUD ────────────────────────────────────────────────
  router.get('/v1/user/dispo-flows', authenticate, asyncHandler(c.listDispoFlows))
  router.post('/v1/user/dispo-flows', authenticate, validate(DispositionFlowCreateSchema), asyncHandler(c.createDispoFlow))
  router.put('/v1/user/dispo-flows/:id', authenticate, validate(DispositionFlowUpdateSchema), asyncHandler(c.updateDispoFlow))
  router.delete('/v1/user/dispo-flows/:id', authenticate, asyncHandler(c.deleteDispoFlow))
  router.post('/v1/user/dispo-flows/:id/use', authenticate, asyncHandler(c.useDispoFlow))

  // ── Report Templates CRUD ─────────────────────────────────────────────────
  router.get('/v1/user/report-templates', authenticate, asyncHandler(c.listReportTemplates))
  router.post('/v1/user/report-templates', authenticate, validate(ReportTemplateCreateSchema), asyncHandler(c.createReportTemplate))
  router.put('/v1/user/report-templates/:id', authenticate, validate(ReportTemplateUpdateSchema), asyncHandler(c.updateReportTemplate))
  router.delete('/v1/user/report-templates/:id', authenticate, asyncHandler(c.deleteReportTemplate))
  router.post('/v1/user/report-templates/:id/use', authenticate, asyncHandler(c.useReportTemplate))

  // ── Customizable Options ──────────────────────────────────────────────────
  router.get('/v1/user/options', authenticate, asyncHandler(c.getOptions))
  router.put('/v1/user/options', authenticate, validate(CustomizableOptionsSchema), asyncHandler(c.updateOptions))

  return router
}
