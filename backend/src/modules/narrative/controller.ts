import type { Request, Response } from 'express'
import { buildParsePrompt, getEmptyParsedNarrative, type ParsedNarrative } from '../../parsePromptBuilder'
import type { NarrativeDeps } from '../../dependencies'

export function createNarrativeController({ llmClient, responseParser }: NarrativeDeps) {
  return {
    parseNarrative: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { narrative } = req.body

      const prompt = buildParsePrompt(narrative)

      let parsedNarrative: ParsedNarrative
      try {
        const result = await llmClient.generate(prompt)

        req.log!.info({ action: 'model-response', endpoint: 'parse-narrative', responseLength: result.text.length })

        const parsed = responseParser.parseNarrative(result.text)
        parsedNarrative = parsed.data

        if (!parsed.success || ('fallback' in parsed && parsed.fallback)) {
          req.log!.info({ action: 'parse-narrative-fallback', reason: 'reason' in parsed ? parsed.reason : 'parse failed' })
        }
      } catch (e) {
        req.log!.warn({ action: 'parse-model-fallback', error: String(e) }, 'Parse model failed, returning empty structure')
        parsedNarrative = getEmptyParsedNarrative()
      }

      // Note: This endpoint does NOT increment usage - it's a UI helper
      req.log!.info({ action: 'parse-narrative-completed', uid, confidence: parsedNarrative.confidence })

      return res.json({
        ok: true,
        parsed: parsedNarrative,
        confidence: parsedNarrative.confidence,
        warnings: parsedNarrative.warnings
      })
    },
  }
}
