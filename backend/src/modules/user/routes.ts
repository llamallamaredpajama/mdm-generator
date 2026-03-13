import { Router } from 'express'
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
router.post('/v1/whoami', whoami)

// ── Onboarding ────────────────────────────────────────────────────────────
router.post('/v1/user/complete-onboarding', completeOnboarding)

// ── Order Sets CRUD ───────────────────────────────────────────────────────
router.get('/v1/user/order-sets', listOrderSets)
router.post('/v1/user/order-sets', createOrderSet)
router.put('/v1/user/order-sets/:id', updateOrderSet)
router.delete('/v1/user/order-sets/:id', deleteOrderSet)
router.post('/v1/user/order-sets/:id/use', useOrderSet)

// ── Disposition Flows CRUD ────────────────────────────────────────────────
router.get('/v1/user/dispo-flows', listDispoFlows)
router.post('/v1/user/dispo-flows', createDispoFlow)
router.put('/v1/user/dispo-flows/:id', updateDispoFlow)
router.delete('/v1/user/dispo-flows/:id', deleteDispoFlow)
router.post('/v1/user/dispo-flows/:id/use', useDispoFlow)

// ── Report Templates CRUD ─────────────────────────────────────────────────
router.get('/v1/user/report-templates', listReportTemplates)
router.post('/v1/user/report-templates', createReportTemplate)
router.put('/v1/user/report-templates/:id', updateReportTemplate)
router.delete('/v1/user/report-templates/:id', deleteReportTemplate)
router.post('/v1/user/report-templates/:id/use', useReportTemplate)

// ── Customizable Options ──────────────────────────────────────────────────
router.get('/v1/user/options', getOptions)
router.put('/v1/user/options', updateOptions)

export default router
