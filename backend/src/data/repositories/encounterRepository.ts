/**
 * Encounter Repository
 *
 * Encapsulates all Firestore operations for encounter documents.
 * Normalizes the dual llmResponse shape (flat array vs wrapped object).
 */

import admin from 'firebase-admin'
import type { DifferentialItem, CdrTracking, GapItem } from '../../buildModeSchemas.js'

// ============================================================================
// Types
// ============================================================================

export interface EncounterDocument {
  status: string
  mode?: string
  chiefComplaint?: string
  quotaCounted?: boolean
  surveillanceContext?: string
  cdrContext?: string
  cdrTracking?: CdrTracking
  encounterPhoto?: { category: string; subcategory: string }
  section1?: {
    content?: string
    llmResponse?: any
    submissionCount?: number
    status?: string
    lastUpdated?: FirebaseFirestore.Timestamp
  }
  section2?: {
    content?: string
    llmResponse?: any
    selectedTests?: string[]
    testResults?: Record<string, any>
    workingDiagnosis?: any
    submissionCount?: number
    status?: string
    lastUpdated?: FirebaseFirestore.Timestamp
  }
  section3?: {
    content?: string
    llmResponse?: any
    treatments?: any
    cdrSuggestedTreatments?: any
    disposition?: any
    followUp?: any
    submissionCount?: number
    status?: string
    lastUpdated?: FirebaseFirestore.Timestamp
  }
  quickModeData?: {
    status?: string
    narrative?: string
    patientIdentifier?: any
    mdmOutput?: any
    gaps?: GapItem[]
    processedAt?: FirebaseFirestore.Timestamp
    errorMessage?: string
  }
}

export interface IEncounterRepository {
  get(uid: string, encounterId: string): Promise<EncounterDocument | null>
  updateSection1(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  updateSection2(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  finalize(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  markQuotaCounted(uid: string, encounterId: string): Promise<void>
  updateCdrTracking(uid: string, encounterId: string, cdrTracking: CdrTracking): Promise<void>
  updateQuickModeStatus(uid: string, encounterId: string, status: string): Promise<void>
  finalizeQuickMode(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
}

/**
 * Extract differential from the dual S1 llmResponse shape.
 * Old shape: flat DifferentialItem[] (array directly).
 * New shape: { differential: DifferentialItem[], processedAt: Timestamp }.
 */
export function getDifferential(llmResponse: any): DifferentialItem[] {
  if (!llmResponse) return []
  if (Array.isArray(llmResponse)) return llmResponse as DifferentialItem[]
  if (llmResponse?.differential && Array.isArray(llmResponse.differential)) {
    return llmResponse.differential as DifferentialItem[]
  }
  return []
}

// ============================================================================
// Firestore Implementation
// ============================================================================

export class FirestoreEncounterRepository implements IEncounterRepository {
  constructor(private readonly db: FirebaseFirestore.Firestore) {}

  private ref(uid: string, encounterId: string) {
    return this.db.collection('customers').doc(uid).collection('encounters').doc(encounterId)
  }

  async get(uid: string, encounterId: string): Promise<EncounterDocument | null> {
    const snap = await this.ref(uid, encounterId).get()
    if (!snap.exists) return null
    return snap.data() as EncounterDocument
  }

  async updateSection1(uid: string, encounterId: string, data: Record<string, any>): Promise<void> {
    await this.ref(uid, encounterId).update(data)
  }

  async updateSection2(uid: string, encounterId: string, data: Record<string, any>): Promise<void> {
    await this.ref(uid, encounterId).update(data)
  }

  async finalize(uid: string, encounterId: string, data: Record<string, any>): Promise<void> {
    await this.ref(uid, encounterId).update(data)
  }

  async markQuotaCounted(uid: string, encounterId: string): Promise<void> {
    await this.ref(uid, encounterId).update({
      quotaCounted: true,
      quotaCountedAt: admin.firestore.Timestamp.now(),
    })
  }

  async updateCdrTracking(uid: string, encounterId: string, cdrTracking: CdrTracking): Promise<void> {
    await this.ref(uid, encounterId).update({
      cdrTracking,
      updatedAt: admin.firestore.Timestamp.now(),
    })
  }

  async updateQuickModeStatus(uid: string, encounterId: string, status: string): Promise<void> {
    await this.ref(uid, encounterId).update({
      'quickModeData.status': status,
      updatedAt: admin.firestore.Timestamp.now(),
    })
  }

  async finalizeQuickMode(uid: string, encounterId: string, data: Record<string, any>): Promise<void> {
    await this.ref(uid, encounterId).update(data)
  }
}
