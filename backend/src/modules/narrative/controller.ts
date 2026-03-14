import type { Request, Response } from 'express'
import { buildParsePrompt, getEmptyParsedNarrative, type ParsedNarrative } from '../../parsePromptBuilder'
import { callGemini } from '../../vertex'
import { cleanLlmJsonResponse, extractJsonFromText } from '../../shared/llmResponseUtils'

export async function parseNarrative(req: Request, res: Response) {
  const uid = req.user!.uid
  const { narrative } = req.body

  // Build prompt and call model
  const prompt = buildParsePrompt(narrative)

  let parsedNarrative: ParsedNarrative
  try {
    const result = await callGemini(prompt)

    req.log!.info({ action: 'model-response', endpoint: 'parse-narrative', responseLength: result.text.length })

    // Clean LLM response: strip code fences, preamble, trailing commas
    const cleanedText = cleanLlmJsonResponse(result.text)

    // Try to parse the JSON response
    try {
      parsedNarrative = JSON.parse(cleanedText) as ParsedNarrative
    } catch (parseError) {
      req.log!.info({ action: 'parse-json-fallback', error: String(parseError) })
      // Fallback: extract balanced JSON from text
      const extracted = extractJsonFromText(cleanedText)
      if (extracted) {
        parsedNarrative = JSON.parse(extracted) as ParsedNarrative
      } else {
        throw new Error('Invalid model output - no valid JSON found')
      }
    }

    // Ensure required fields exist with defaults
    if (typeof parsedNarrative.confidence !== 'number') {
      parsedNarrative.confidence = 0.5
    }
    if (!Array.isArray(parsedNarrative.warnings)) {
      parsedNarrative.warnings = []
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
}
