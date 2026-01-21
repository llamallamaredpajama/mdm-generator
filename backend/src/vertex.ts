import { VertexAI } from '@google-cloud/vertexai'

export type GenResult = { text: string }

export async function callGeminiFlash(prompt: { system: string; user: string }): Promise<GenResult> {
  const project = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'mdm-generator'
  const location = process.env.VERTEX_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1'
  const vertex = new VertexAI({ project, location })
  const model = vertex.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-05-06',
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

  const res = await model.generateContent({ contents })
  const text = res.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { text }
}
