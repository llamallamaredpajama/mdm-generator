import { Router } from 'express'
import { setPlan } from './controller'

const router = Router()

router.post('/v1/admin/set-plan', setPlan)

export default router
