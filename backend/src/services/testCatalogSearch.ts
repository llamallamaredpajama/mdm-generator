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
import { generateEmbedding } from './embeddingService.js'
import type { TestDefinition } from '../types/libraries.js'
import { logger } from '../logger.js'

const DEFAULT_LIMIT = 50

/**
 * Find the most relevant tests for a clinical narrative using vector search.
 *
 * Embeds the narrative with RETRIEVAL_QUERY, then performs cosine similarity
 * search against pre-computed RETRIEVAL_DOCUMENT embeddings in Firestore.
 *
 * @param narrative - Clinical narrative text (Section 1 content)
 * @param limit - Max results to return (default 50)
 * @param db - Optional Firestore instance (falls back to admin.firestore() if not provided)
 * @returns Matching TestDefinition[] sorted by relevance (most similar first)
 */
export async function getRelevantTests(
  narrative: string,
  limit: number = DEFAULT_LIMIT,
  db?: FirebaseFirestore.Firestore,
): Promise<TestDefinition[]> {
  const start = Date.now()

  // 1. Embed the narrative
  const queryVector = await generateEmbedding(narrative, 'RETRIEVAL_QUERY')

  // Use injected db or fall back to admin.firestore()
  const firestore = db ?? admin.firestore()

  // 2. Vector search via Firestore findNearest
  const snapshot = await firestore
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
  logger.info({
    action: 'vector-search',
    results: tests.length,
    elapsed_ms: elapsed,
  }, 'Test vector search completed')

  return tests
}
