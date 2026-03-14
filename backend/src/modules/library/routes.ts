import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { createLibraryController } from './controller.js'
import type { LibraryDeps } from '../../dependencies.js'

export function createLibraryRoutes(deps: LibraryDeps): Router {
  const router = Router()
  const { getTests, getCdrs } = createLibraryController(deps)

  router.get('/v1/libraries/tests', authenticate, asyncHandler(getTests))
  router.get('/v1/libraries/cdrs', authenticate, asyncHandler(getCdrs))

  return router
}
