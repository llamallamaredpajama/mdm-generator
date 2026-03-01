/**
 * Test Catalog Vector Search
 *
 * Retrieves semantically relevant tests/procedures from the `testLibrary`
 * Firestore collection using vector similarity search (findNearest).
 *
 * Falls back gracefully — callers should catch errors and use the full
 * cached catalog as a fallback (same pattern as surveillance enrichment).
 */

import admin from 'firebase-admin'
import { generateEmbedding } from './embeddingService'
import type { TestDefinition } from '../types/libraries'

const DEFAULT_LIMIT = 50
const getDb = () => admin.firestore()

/**
 * Find the most relevant tests for a clinical narrative using vector search.
 *
 * Embeds the narrative with RETRIEVAL_QUERY, then performs cosine similarity
 * search against pre-computed RETRIEVAL_DOCUMENT embeddings in Firestore.
 *
 * @param narrative - Clinical narrative text (Section 1 content)
 * @param limit - Max results to return (default 50)
 * @returns Matching TestDefinition[] sorted by relevance (most similar first)
 */
export async function getRelevantTests(
  narrative: string,
  limit: number = DEFAULT_LIMIT
): Promise<TestDefinition[]> {
  const start = Date.now()

  // 1. Embed the narrative
  const queryVector = await generateEmbedding(narrative, 'RETRIEVAL_QUERY')

  // 2. Vector search via Firestore findNearest
  const snapshot = await getDb()
    .collection('testLibrary')
    .findNearest({
      vectorField: 'embedding',
      queryVector,
      limit,
      distanceMeasure: 'COSINE',
    })
    .get()

  // 3. Map to TestDefinition, stripping the embedding field (save memory)
  const tests: TestDefinition[] = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.id && data.name && data.category) {
      const { embedding: _embedding, ...rest } = data
      tests.push(rest as TestDefinition)
    }
  }

  const elapsed = Date.now() - start
  console.log({
    action: 'vector-search',
    results: tests.length,
    elapsed_ms: elapsed,
  })

  return tests
}
