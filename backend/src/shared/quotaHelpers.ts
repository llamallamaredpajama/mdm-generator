/**
 * Shared quota/token-limit helpers.
 */

/** Check if input text exceeds the plan's token limit */
export function checkTokenSize(text: string, maxTokensPerRequest: number) {
  const tokenEstimate = Math.ceil(text.length / 4)
  if (tokenEstimate > maxTokensPerRequest) {
    return {
      exceeded: true as const,
      payload: {
        error: `Input too large for your plan. Maximum ${maxTokensPerRequest} tokens allowed.`,
        tokenEstimate,
        maxAllowed: maxTokensPerRequest,
      },
    }
  }
  return { exceeded: false as const }
}
