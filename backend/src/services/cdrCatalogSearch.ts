import { generateEmbedding } from './embeddingService.js'
import type { CdrDefinition } from '../types/libraries.js'
import { logger } from '../logger.js'

export interface CdrSearchResult {
  cdr: CdrDefinition
  distance: number
}

export async function searchCdrCatalog(
  queryText: string,
  db: FirebaseFirestore.Firestore,
  limit: number = 15
): Promise<CdrSearchResult[]> {
  try {
    const start = Date.now()
    const queryVector = await generateEmbedding(queryText, 'RETRIEVAL_QUERY')
    const snapshot = await db.collection('cdrLibrary')
      .findNearest({
        vectorField: 'embedding',
        queryVector,
        limit,
        distanceMeasure: 'COSINE',
        distanceResultField: 'distance',
      })
      .get()

    const results: CdrSearchResult[] = snapshot.docs.map(doc => {
      const data = doc.data()
      const { embedding, ...cdr } = data
      return { cdr: cdr as CdrDefinition, distance: doc.get('distance') ?? 1 }
    })

    logger.info({ action: 'cdr-vector-search', results: results.length, elapsed_ms: Date.now() - start }, 'CDR vector search completed')
    return results
  } catch (err) {
    logger.warn({ err }, 'CDR vector search failed (non-blocking)')
    return []
  }
}
