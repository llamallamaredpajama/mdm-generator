import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { asyncHandler } from '../../shared/asyncHandler'
import { createLibraryController } from './controller'
import type { LibraryDeps } from '../../dependencies'

export function createLibraryRoutes(deps: LibraryDeps): Router {
  const router = Router()
  const { getTests, getCdrs } = createLibraryController(deps)

  router.get('/v1/libraries/tests', authenticate, asyncHandler(getTests))
  router.get('/v1/libraries/cdrs', authenticate, asyncHandler(getCdrs))

  return router
}
