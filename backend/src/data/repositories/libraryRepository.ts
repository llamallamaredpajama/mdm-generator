/**
 * Library Repository
 *
 * Encapsulates Firestore reads for test and CDR library collections.
 * Caching is handled externally by the cache service.
 */

import type { TestDefinition, CdrDefinition } from '../../types/libraries.js'
import { logger } from '../../logger.js'

export interface ILibraryRepository {
  getAllTests(): Promise<TestDefinition[]>
  getAllCdrs(): Promise<CdrDefinition[]>
}

export class FirestoreLibraryRepository implements ILibraryRepository {
  constructor(private readonly db: FirebaseFirestore.Firestore) {}

  async getAllTests(): Promise<TestDefinition[]> {
    const snapshot = await this.db.collection('testLibrary').get()
    const tests: TestDefinition[] = []
    for (const doc of snapshot.docs) {
      const d = doc.data()
      if (d.id && d.name && d.category) {
        tests.push(d as TestDefinition)
      }
    }
    return tests
  }

  async getAllCdrs(): Promise<CdrDefinition[]> {
    const snapshot = await this.db.collection('cdrLibrary').get()
    const cdrs: CdrDefinition[] = []
    for (const doc of snapshot.docs) {
      const d = doc.data()
      if (d.id && d.name && d.components && d.scoring) {
        cdrs.push(d as CdrDefinition)
      } else {
        logger.warn({ action: 'cdr-repo-read', docId: doc.id }, 'Skipped malformed CDR doc')
      }
    }
    return cdrs
  }
}
