import type { Request, Response } from 'express'
import { getCachedCdrLibrary, getCachedTestLibraryResponse } from '../../shared/libraryCache'

export async function getTests(req: Request, res: Response) {
  const response = await getCachedTestLibraryResponse()

  req.log!.info({ action: 'get-test-library', testCount: response.tests.length })

  return res.json(response)
}

export async function getCdrs(req: Request, res: Response) {
  const cdrs = await getCachedCdrLibrary()

  req.log!.info({ action: 'list-cdrs', cdrCount: cdrs.length })

  return res.json({ ok: true, cdrs })
}
