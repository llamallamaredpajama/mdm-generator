/**
 * LLM Client Interface
 *
 * Abstraction over the LLM provider (currently Vertex AI / Gemini).
 * Enables dependency injection for testing and future provider swaps.
 */

export interface LlmPrompt {
  system: string
  user: string
}

export interface LlmOptions {
  /** Force JSON output mode */
  jsonMode?: boolean
  /** Request timeout in milliseconds */
  timeoutMs?: number
}

export interface LlmResponse {
  text: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  latencyMs: number
}

/**
 * Interface for LLM clients. All LLM interactions go through this.
 */
export interface ILlmClient {
  generate(prompt: LlmPrompt, options?: LlmOptions): Promise<LlmResponse>
}
