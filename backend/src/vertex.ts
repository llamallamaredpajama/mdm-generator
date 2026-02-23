import { VertexAI } from '@google-cloud/vertexai'

export type GenResult = { text: string }

// Singleton: create the VertexAI client once at module level
const project = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'mdm-generator'
const location = process.env.VERTEX_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1'

// Parse inline JSON credentials if available (local dev via GOOGLE_APPLICATION_CREDENTIALS_JSON)
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const googleAuthOptions = credentialsJson
  ? { credentials: JSON.parse(credentialsJson) }
  : undefined

const vertex = new VertexAI({ project, location, googleAuthOptions })

export async function callGemini(
  prompt: { system: string; user: string },
  timeoutMs: number = 55_000
): Promise<GenResult> {
  const model = vertex.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    safetySettings: [
      // conservative defaults; can be tuned later
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ] as any,
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
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
  const text = res.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { text }
}

/** @deprecated Use callGemini instead */
export const callGeminiFlash = callGemini
