/**
 * User Repository
 *
 * Encapsulates Firestore operations for user/customer documents.
 * The atomic checkAndIncrementQuota stays transactional.
 */

import admin from 'firebase-admin'

export interface UserDocument {
  uid: string
  email: string
  plan: string
  displayName?: string
  credentialType?: string
  onboardingCompleted?: boolean
  surveillanceLocation?: { state?: string; zipCode?: string }
  customizableOptions?: Record<string, any>
}

export interface IUserRepository {
  getUser(uid: string): Promise<UserDocument | null>
  getCustomer(uid: string): Promise<Record<string, any> | null>
  updateCustomer(uid: string, data: Record<string, any>): Promise<void>
  incrementGapTallies(uid: string, updates: Record<string, any>): Promise<void>
}

export class FirestoreUserRepository implements IUserRepository {
  constructor(private readonly db: FirebaseFirestore.Firestore) {}

  async getUser(uid: string): Promise<UserDocument | null> {
    const doc = await this.db.collection('users').doc(uid).get()
    if (!doc.exists) return null
    return { uid, ...doc.data() } as UserDocument
  }

  async getCustomer(uid: string): Promise<Record<string, any> | null> {
    const doc = await this.db.collection('customers').doc(uid).get()
    if (!doc.exists) return null
    return doc.data() as Record<string, any>
  }

  async updateCustomer(uid: string, data: Record<string, any>): Promise<void> {
    await this.db.collection('customers').doc(uid).set(data, { merge: true })
  }

  async incrementGapTallies(uid: string, updates: Record<string, any>): Promise<void> {
    await this.db.collection('customers').doc(uid).update(updates)
  }
}
