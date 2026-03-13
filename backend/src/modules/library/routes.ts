import { Router } from 'express'
import { getTests, getCdrs } from './controller'

const router = Router()

router.get('/v1/libraries/tests', getTests)
router.get('/v1/libraries/cdrs', getCdrs)

export default router
