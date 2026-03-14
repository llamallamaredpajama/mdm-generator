/**
 * Encounter Controller
 *
 * Thin HTTP adapter — extracts from req, delegates to orchestrator, sends res.
 * Business logic lives in encounterOrchestrator.ts.
 * Error handling is via asyncHandler → errorHandler middleware.
 */

import { z } from 'zod'
import type { Request, Response } from 'express'
import type { EncounterDeps } from '../../dependencies.js'

// ============================================================================
// Schemas (exported for routes.ts)
// ============================================================================

export const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

// ============================================================================
// Controller Factory
// ============================================================================

export function createEncounterController(deps: EncounterDeps) {
  const { orchestrator } = deps

  return {
    /** POST /v1/generate — Legacy one-shot MDM generation */
    generate: async (req: Request, res: Response) => {
      const result = await orchestrator.generate(
        req.user!.uid,
        req.user!.email || '',
        req.body.narrative,
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/process-section1 */
    processSection1: async (req: Request, res: Response) => {
      const { encounterId, content, location } = req.body
      const result = await orchestrator.processSection1(
        req.user!.uid,
        req.user!.email || '',
        encounterId,
        content,
        location,
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/process-section2 — data persistence only, no LLM call */
    processSection2: async (req: Request, res: Response) => {
      const { encounterId, content, workingDiagnosis, selectedTests, testResults, structuredDiagnosis } = req.body
      const result = await orchestrator.processSection2(
        req.user!.uid,
        encounterId,
        { content, workingDiagnosis, selectedTests, testResults, structuredDiagnosis },
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/finalize */
    finalize: async (req: Request, res: Response) => {
      const { encounterId, content, workingDiagnosis } = req.body
      const result = await orchestrator.finalize(
        req.user!.uid,
        encounterId,
        content,
        workingDiagnosis,
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/match-cdrs */
    matchCdrs: async (req: Request, res: Response) => {
      const result = await orchestrator.matchCdrs(
        req.user!.uid,
        req.body.encounterId,
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/suggest-diagnosis */
    suggestDiagnosis: async (req: Request, res: Response) => {
      const result = await orchestrator.suggestDiagnosis(
        req.user!.uid,
        req.body.encounterId,
        req.log,
      )
      res.json(result)
    },

    /** POST /v1/build-mode/parse-results */
    parseResults: async (req: Request, res: Response) => {
      const { encounterId, pastedText, orderedTestIds } = req.body
      const result = await orchestrator.parseResults(
        req.user!.uid,
        encounterId,
        pastedText,
        orderedTestIds,
        req.log,
      )
      res.json(result)
    },
  }
}
