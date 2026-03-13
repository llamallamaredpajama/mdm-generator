import { Router } from 'express'
import { llmLimiter } from '../../middleware/rateLimiter'
import { generate } from './controller'

const router = Router()

router.post('/v1/quick-mode/generate', llmLimiter, generate)

export default router
