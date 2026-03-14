import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { asyncHandler } from '../../shared/asyncHandler'
import { getTests, getCdrs } from './controller'

const router = Router()

router.get('/v1/libraries/tests', authenticate, asyncHandler(getTests))
router.get('/v1/libraries/cdrs', authenticate, asyncHandler(getCdrs))

export default router
