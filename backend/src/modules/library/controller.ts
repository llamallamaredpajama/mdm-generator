import type { Request, Response } from 'express'
import type { LibraryDeps } from '../../dependencies.js'

export function createLibraryController({ libraryCaches }: LibraryDeps) {
  let cachedCategories: { tests: unknown[]; categories: string[] } | null = null

  return {
    getTests: async (req: Request, res: Response) => {
      const tests = await libraryCaches.getTests()
      if (!cachedCategories || cachedCategories.tests !== tests) {
        cachedCategories = { tests, categories: [...new Set(tests.map(t => t.category))] }
      }

      req.log!.info({ action: 'get-test-library', testCount: tests.length })

      return res.json({ ok: true, tests, categories: cachedCategories.categories, cachedAt: new Date().toISOString() })
    },

    getCdrs: async (req: Request, res: Response) => {
      const cdrs = await libraryCaches.getCdrs()

      req.log!.info({ action: 'list-cdrs', cdrCount: cdrs.length })

      return res.json({ ok: true, cdrs })
    },
  }
}
