import { Router } from 'express'
import { parseLimiter } from '../../middleware/rateLimiter'
import { authenticate } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../shared/asyncHandler'
import { ParseNarrativeBodySchema } from './schemas'
import { parseNarrative } from './controller'

const router = Router()

router.post('/v1/parse-narrative', parseLimiter, authenticate, validate(ParseNarrativeBodySchema), asyncHandler(parseNarrative))

export default router
