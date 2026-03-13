import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { buildParsePrompt, getEmptyParsedNarrative, type ParsedNarrative } from '../../parsePromptBuilder'
import { callGemini } from '../../vertex'
import { cleanLlmJsonResponse, extractJsonFromText } from '../../shared/llmResponseUtils'
import { ParseNarrativeSchema } from './schemas'

export async function parseNarrative(req: Request, res: Response) {
  try {
    const parsed = ParseNarrativeSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    // Verify Firebase ID token
    let uid = 'anonymous'
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { narrative } = parsed.data

    // Build prompt and call model
    const prompt = buildParsePrompt(narrative)

    let parsedNarrative: ParsedNarrative
    try {
      const result = await callGemini(prompt)

      console.log({ action: 'model-response', endpoint: 'parse-narrative', responseLength: result.text.length })

      // Clean LLM response: strip code fences, preamble, trailing commas
      const cleanedText = cleanLlmJsonResponse(result.text)

      // Try to parse the JSON response
      try {
        parsedNarrative = JSON.parse(cleanedText) as ParsedNarrative
      } catch (parseError) {
        console.log('JSON parsing failed:', parseError)
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
      console.warn('Parse model failed, returning empty structure:', e)
      parsedNarrative = getEmptyParsedNarrative()
    }

    // Note: This endpoint does NOT increment usage - it's a UI helper
    console.log('Parse narrative completed', { uid, confidence: parsedNarrative.confidence })

    return res.json({
      ok: true,
      parsed: parsedNarrative,
      confidence: parsedNarrative.confidence,
      warnings: parsedNarrative.warnings
    })
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error('unknown error')
    const status = (e as { status?: number })?.status || 500
    if (status !== 500) return res.status(status).json({ error: err.message })
    console.error('parse-narrative error:', err.message)
    return res.status(500).json({ error: 'Internal error' })
  }
}
