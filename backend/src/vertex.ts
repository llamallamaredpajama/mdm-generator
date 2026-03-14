/** @deprecated Use llm/vertexProvider.ts instead */

import { VertexAI } from '@google-cloud/vertexai'
import { config } from './config.js'
import { logger } from './logger.js'

export type GenResult = { text: string }

export interface CallGeminiOptions {
  /** Force the model to output valid JSON (no preamble, no code fences) */
  jsonMode?: boolean
  /** Request timeout in milliseconds (default: 55000) */
  timeoutMs?: number
}

// Singleton: create the VertexAI client once at module level
const project = config.projectId
const location = config.vertexLocation

// Parse inline JSON credentials if available (local dev via GOOGLE_APPLICATION_CREDENTIALS_JSON)
const credentialsJson = config.credentialsJson
const googleAuthOptions = credentialsJson
  ? { credentials: JSON.parse(credentialsJson) }
  : undefined

const vertex = new VertexAI({ project, location, googleAuthOptions })

export async function callGemini(
  prompt: { system: string; user: string },
  optionsOrTimeout: CallGeminiOptions | number = {}
): Promise<GenResult> {
  // Backward-compatible: accept a number (timeoutMs) or options object
  const options: CallGeminiOptions =
    typeof optionsOrTimeout === 'number'
      ? { timeoutMs: optionsOrTimeout }
      : optionsOrTimeout
  const timeoutMs = options.timeoutMs ?? 55_000

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    topP: 0.95,
    maxOutputTokens: 16384,
  }
  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json'
  }

  const model = vertex.getGenerativeModel({
    model: 'gemini-2.5-pro',
    safetySettings: [
      // conservative defaults; can be tuned later
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ] as any,
    generationConfig,
    systemInstruction: {
      role: 'system',
      parts: [{ text: prompt.system }]
    } as any,
  })

  const contents = [
    { role: 'user', parts: [{ text: prompt.user }] },
  ] as any

  const resultPromise = model.generateContent({ contents })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Vertex AI generation timed out')), timeoutMs)
  )
  const res = await Promise.race([resultPromise, timeoutPromise])
  const parts: any[] = res.response?.candidates?.[0]?.content?.parts || []
  // Gemini 2.5 Pro may include thinking parts — extract the actual answer
  const answerParts = parts.filter((p: any) => !p.thought && p.text)
  const text: string = answerParts.length > 0
    ? answerParts[answerParts.length - 1].text
    : (parts[parts.length - 1]?.text ?? '')

  if (parts.length > 1) {
    logger.info(`[vertex] Multi-part response: ${parts.length} parts, ${answerParts.length} answer parts`)
  }

  return { text }
}
