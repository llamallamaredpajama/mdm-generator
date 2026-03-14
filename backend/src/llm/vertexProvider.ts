/**
 * Vertex AI LLM Client
 *
 * Wraps the existing callGemini() function in the ILlmClient interface.
 * Adds latency tracking for observability.
 */

import { VertexAI } from '@google-cloud/vertexai'
import type { ILlmClient, LlmPrompt, LlmOptions, LlmResponse } from './llmClient.js'
import { config as appConfig } from '../config.js'
import { logger } from '../logger.js'

export interface VertexConfig {
  project?: string
  location?: string
  model?: string
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  defaultTimeoutMs?: number
}

export class VertexLlmClient implements ILlmClient {
  private vertex: VertexAI
  private config: Required<VertexConfig>

  constructor(config?: VertexConfig) {
    const project = config?.project || appConfig.projectId
    const location = config?.location || appConfig.vertexLocation

    // Parse inline JSON credentials if available
    const credentialsJson = appConfig.credentialsJson
    const googleAuthOptions = credentialsJson
      ? { credentials: JSON.parse(credentialsJson) }
      : undefined

    this.vertex = new VertexAI({ project, location, googleAuthOptions })
    this.config = {
      project,
      location,
      model: config?.model || 'gemini-2.5-pro',
      temperature: config?.temperature ?? 0.2,
      topP: config?.topP ?? 0.95,
      maxOutputTokens: config?.maxOutputTokens ?? 16384,
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 55_000,
    }
  }

  async generate(prompt: LlmPrompt, options?: LlmOptions): Promise<LlmResponse> {
    const startMs = Date.now()
    const timeoutMs = options?.timeoutMs ?? this.config.defaultTimeoutMs

    const generationConfig: Record<string, unknown> = {
      temperature: this.config.temperature,
      topP: this.config.topP,
      maxOutputTokens: this.config.maxOutputTokens,
    }
    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json'
    }

    const model = this.vertex.getGenerativeModel({
      model: this.config.model,
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ] as any,
      generationConfig,
      systemInstruction: {
        role: 'system',
        parts: [{ text: prompt.system }],
      } as any,
    })

    const contents = [
      { role: 'user', parts: [{ text: prompt.user }] },
    ] as any

    const resultPromise = model.generateContent({ contents })
    let timer: NodeJS.Timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Vertex AI generation timed out')), timeoutMs)
    })

    let res: Awaited<typeof resultPromise>
    try {
      res = await Promise.race([resultPromise, timeoutPromise])
    } finally {
      clearTimeout(timer!)
    }
    const latencyMs = Date.now() - startMs

    const parts: any[] = res.response?.candidates?.[0]?.content?.parts || []
    // Gemini 2.5 Pro may include thinking parts — extract the actual answer
    const answerParts = parts.filter((p: any) => !p.thought && p.text)
    const text: string = answerParts.length > 0
      ? answerParts[answerParts.length - 1].text
      : (parts[parts.length - 1]?.text ?? '')

    if (parts.length > 1) {
      logger.info(`[vertex] Multi-part response: ${parts.length} parts, ${answerParts.length} answer parts`)
    }

    // Extract usage metadata if available
    const usageMetadata = res.response?.usageMetadata
    const usage = usageMetadata
      ? {
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined

    return { text, usage, latencyMs }
  }
}
