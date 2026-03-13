import { Router } from 'express'
import { parseLimiter } from '../../middleware/rateLimiter'
import { parseNarrative } from './controller'

const router = Router()

router.post('/v1/parse-narrative', parseLimiter, parseNarrative)

export default router
