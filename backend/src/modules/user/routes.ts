import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import {
  OrderSetCreateSchema,
  OrderSetUpdateSchema,
  DispositionFlowCreateSchema,
  DispositionFlowUpdateSchema,
  ReportTemplateCreateSchema,
  ReportTemplateUpdateSchema,
  CustomizableOptionsSchema,
} from '../../types/userProfile'
import { CompleteOnboardingSchema } from './schemas'
import {
  whoami,
  completeOnboarding,
  listOrderSets,
  createOrderSet,
  updateOrderSet,
  deleteOrderSet,
  useOrderSet,
  listDispoFlows,
  createDispoFlow,
  updateDispoFlow,
  deleteDispoFlow,
  useDispoFlow,
  listReportTemplates,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  useReportTemplate,
  getOptions,
  updateOptions,
} from './controller'

const router = Router()

// ── Whoami ────────────────────────────────────────────────────────────────
router.post('/v1/whoami', authenticate, asyncHandler(whoami))

// ── Onboarding ────────────────────────────────────────────────────────────
router.post('/v1/user/complete-onboarding', authenticate, validate(CompleteOnboardingSchema), asyncHandler(completeOnboarding))

// ── Order Sets CRUD ───────────────────────────────────────────────────────
router.get('/v1/user/order-sets', authenticate, asyncHandler(listOrderSets))
router.post('/v1/user/order-sets', authenticate, validate(OrderSetCreateSchema), asyncHandler(createOrderSet))
router.put('/v1/user/order-sets/:id', authenticate, validate(OrderSetUpdateSchema), asyncHandler(updateOrderSet))
router.delete('/v1/user/order-sets/:id', authenticate, asyncHandler(deleteOrderSet))
router.post('/v1/user/order-sets/:id/use', authenticate, asyncHandler(useOrderSet))

// ── Disposition Flows CRUD ────────────────────────────────────────────────
router.get('/v1/user/dispo-flows', authenticate, asyncHandler(listDispoFlows))
router.post('/v1/user/dispo-flows', authenticate, validate(DispositionFlowCreateSchema), asyncHandler(createDispoFlow))
router.put('/v1/user/dispo-flows/:id', authenticate, validate(DispositionFlowUpdateSchema), asyncHandler(updateDispoFlow))
router.delete('/v1/user/dispo-flows/:id', authenticate, asyncHandler(deleteDispoFlow))
router.post('/v1/user/dispo-flows/:id/use', authenticate, asyncHandler(useDispoFlow))

// ── Report Templates CRUD ─────────────────────────────────────────────────
router.get('/v1/user/report-templates', authenticate, asyncHandler(listReportTemplates))
router.post('/v1/user/report-templates', authenticate, validate(ReportTemplateCreateSchema), asyncHandler(createReportTemplate))
router.put('/v1/user/report-templates/:id', authenticate, validate(ReportTemplateUpdateSchema), asyncHandler(updateReportTemplate))
router.delete('/v1/user/report-templates/:id', authenticate, asyncHandler(deleteReportTemplate))
router.post('/v1/user/report-templates/:id/use', authenticate, asyncHandler(useReportTemplate))

// ── Customizable Options ──────────────────────────────────────────────────
router.get('/v1/user/options', authenticate, asyncHandler(getOptions))
router.put('/v1/user/options', authenticate, validate(CustomizableOptionsSchema), asyncHandler(updateOptions))

export default router
