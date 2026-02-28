/**
 * Vertex AI Embedding Service
 *
 * Generates text embeddings via Vertex AI `text-embedding-005` (768 dimensions).
 * Uses REST API with google-auth-library (transitive dep) to avoid the heavy
 * @google-cloud/aiplatform package.
 */

import { GoogleAuth } from 'google-auth-library'

const project = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'mdm-generator'
const location = process.env.VERTEX_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1'
const MODEL_ID = 'text-embedding-005'
const EMBEDDING_DIMENSION = 768

const ENDPOINT = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${MODEL_ID}:predict`

// Parse inline JSON credentials if available (local dev)
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  ...(credentialsJson ? { credentials: JSON.parse(credentialsJson) } : {}),
})

export type EmbeddingTaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'

/**
 * Generate a 768-dimension embedding for a text string.
 *
 * @param text - Input text to embed
 * @param taskType - RETRIEVAL_QUERY for search queries, RETRIEVAL_DOCUMENT for catalog items
 * @returns 768-dimension number array
 */
export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType
): Promise<number[]> {
  const client = await auth.getClient()
  const response = await client.request({
    url: ENDPOINT,
    method: 'POST',
    data: {
      instances: [{ content: text, task_type: taskType }],
    },
  })

  const data = response.data as {
    predictions: Array<{ embeddings: { values: number[] } }>
  }
  const values = data.predictions?.[0]?.embeddings?.values
  if (!values || values.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Unexpected embedding response: got ${values?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSION}`
    )
  }
  return values
}

// Vertex AI allows up to 250 instances but has a 20K token limit per request.
// 100 instances keeps each batch safely under the token ceiling.
const BATCH_LIMIT = 100

/**
 * Generate 768-dimension embeddings for multiple texts in batches.
 *
 * @param texts - Input texts to embed
 * @param taskType - RETRIEVAL_QUERY for search queries, RETRIEVAL_DOCUMENT for catalog items
 * @returns Array of 768-dimension number arrays (one per input text)
 */
export async function generateEmbeddings(
  texts: string[],
  taskType: EmbeddingTaskType
): Promise<number[][]> {
  if (texts.length === 0) return []

  const client = await auth.getClient()
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_LIMIT) {
    const batch = texts.slice(i, i + BATCH_LIMIT)
    const response = await client.request({
      url: ENDPOINT,
      method: 'POST',
      data: {
        instances: batch.map(content => ({ content, task_type: taskType })),
      },
    })

    const data = response.data as {
      predictions: Array<{ embeddings: { values: number[] } }>
    }

    for (const prediction of data.predictions) {
      const values = prediction.embeddings?.values
      if (!values || values.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `Unexpected embedding response: got ${values?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSION}`
        )
      }
      allEmbeddings.push(values)
    }
  }

  return allEmbeddings
}

export { EMBEDDING_DIMENSION }
