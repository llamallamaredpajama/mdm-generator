import { generateEmbedding } from './embeddingService'
import type { CdrDefinition } from '../types/libraries'

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

    console.log({ action: 'cdr-vector-search', results: results.length, elapsed_ms: Date.now() - start })
    return results
  } catch (err) {
    console.warn('CDR vector search failed (non-blocking):', err)
    return []
  }
}
