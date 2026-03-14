import admin from 'firebase-admin'
import type { GapItem } from '../buildModeSchemas.js'

/** Returns current month key in YYYY-MM format (UTC) */
export function getCurrentPeriodKey(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}`
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise' | 'admin'

export interface UserDocument {
  uid: string
  email: string
  plan: SubscriptionPlan
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp

  // Usage tracking
  usedThisPeriod: number
  periodKey: string // YYYY-MM format
  totalRequests: number

  // Subscription details
  subscriptionStartDate?: FirebaseFirestore.Timestamp
  subscriptionEndDate?: FirebaseFirestore.Timestamp
  stripeCustomerId?: string
  stripeSubscriptionId?: string

  // Onboarding
  onboardingCompleted?: boolean
  displayName?: string
  credentialType?: 'MD' | 'DO' | 'NP' | 'PA'
  surveillanceLocation?: { state?: string; zipCode?: string }

  // Enhancement advisor gap tallies
  gapTallies?: {
    /** How often each gap ID was identified across all encounters */
    identified: Record<string, number>
    /** How often each gap ID was confirmed by the user (reprocessed) */
    confirmed: Record<string, number>
    /** Per-period (YYYY-MM) identified counts */
    identifiedByPeriod?: Record<string, Record<string, number>>
    /** Per-period (YYYY-MM) confirmed counts */
    confirmedByPeriod?: Record<string, Record<string, number>>
  }
  /** Gap metadata: category + acquisition method per gap ID */
  gapMeta?: Record<string, { category: string; method: string }>
  /** Timestamp of last LLM insights generation (rate-limit gate) */
  lastInsightsGeneratedAt?: FirebaseFirestore.Timestamp

  // Feature flags
  features: {
    maxRequestsPerMonth: number
    maxTokensPerRequest: number
    priorityProcessing: boolean
    exportFormats: string[]
    apiAccess: boolean
    teamMembers: number
  }
}

export const PLAN_FEATURES: Record<SubscriptionPlan, UserDocument['features']> = {
  free: {
    maxRequestsPerMonth: 10,
    maxTokensPerRequest: 2000,
    priorityProcessing: false,
    exportFormats: ['text'],
    apiAccess: false,
    teamMembers: 1
  },
  pro: {
    maxRequestsPerMonth: 250,
    maxTokensPerRequest: 8000,
    priorityProcessing: true,
    exportFormats: ['text', 'pdf', 'docx'],
    apiAccess: true,
    teamMembers: 3
  },
  enterprise: {
    maxRequestsPerMonth: 1000,
    maxTokensPerRequest: 16000,
    priorityProcessing: true,
    exportFormats: ['text', 'pdf', 'docx', 'json', 'hl7'],
    apiAccess: true,
    teamMembers: -1 // unlimited
  },
  admin: {
    maxRequestsPerMonth: Number.MAX_SAFE_INTEGER, // Effectively unlimited
    maxTokensPerRequest: 32000,
    priorityProcessing: true,
    exportFormats: ['text', 'pdf', 'docx', 'json', 'hl7'],
    apiAccess: true,
    teamMembers: -1 // unlimited
  }
}

export class UserService {
  private _db?: FirebaseFirestore.Firestore

  constructor(db?: FirebaseFirestore.Firestore) {
    this._db = db
  }

  private get db(): FirebaseFirestore.Firestore {
    if (!this._db) this._db = admin.firestore()
    return this._db
  }

  private get collection() {
    return this.db.collection('users')
  }

  /**
   * Get or create user document
   */
  async ensureUser(uid: string, email: string): Promise<UserDocument> {
    const ref = this.collection.doc(uid)
    const snap = await ref.get()
    
    if (snap.exists) {
      return snap.data() as UserDocument
    }
    
    // Create new user with free plan
    const newUser: UserDocument = {
      uid,
      email,
      plan: 'free',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      usedThisPeriod: 0,
      periodKey: this.getCurrentPeriodKey(),
      totalRequests: 0,
      onboardingCompleted: false,
      features: PLAN_FEATURES.free
    }
    
    await ref.set(newUser)
    return newUser
  }

  /**
   * Get user document
   */
  async getUser(uid: string): Promise<UserDocument | null> {
    const snap = await this.collection.doc(uid).get()
    return snap.exists ? (snap.data() as UserDocument) : null
  }

  /**
   * Update user subscription plan
   */
  async updateUserPlan(uid: string, plan: SubscriptionPlan): Promise<void> {
    const features = PLAN_FEATURES[plan]
    await this.collection.doc(uid).update({
      plan,
      features,
      updatedAt: admin.firestore.Timestamp.now(),
      subscriptionStartDate: admin.firestore.Timestamp.now()
    })
  }

  /**
   * Check and enforce usage quota
   * @deprecated Use checkAndIncrementQuota() for atomic quota enforcement
   */
  async checkQuota(uid: string): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const user = await this.getUser(uid)
    if (!user) {
      throw new Error('User not found')
    }

    const currentPeriod = this.getCurrentPeriodKey()

    // Reset usage if new period
    if (user.periodKey !== currentPeriod) {
      await this.collection.doc(uid).update({
        periodKey: currentPeriod,
        usedThisPeriod: 0,
        updatedAt: admin.firestore.Timestamp.now()
      })
      user.usedThisPeriod = 0
      user.periodKey = currentPeriod
    }

    const limit = user.features.maxRequestsPerMonth
    const used = user.usedThisPeriod
    const remaining = Math.max(0, limit - used)
    const allowed = used < limit

    return { allowed, used, limit, remaining }
  }

  /**
   * Increment usage counter
   * @deprecated Use checkAndIncrementQuota() for atomic quota enforcement
   */
  async incrementUsage(uid: string): Promise<void> {
    await this.collection.doc(uid).update({
      usedThisPeriod: admin.firestore.FieldValue.increment(1),
      totalRequests: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.Timestamp.now()
    })
  }

  /**
   * Atomically check quota and increment usage in a single Firestore transaction.
   * Prevents race conditions where concurrent requests both pass the check.
   */
  async checkAndIncrementQuota(uid: string): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const ref = this.collection.doc(uid)
    const currentPeriod = this.getCurrentPeriodKey()

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) {
        throw new Error('User not found')
      }

      const user = snap.data() as UserDocument

      // Reset usage if new billing period
      let used = user.usedThisPeriod
      if (user.periodKey !== currentPeriod) {
        used = 0
      }

      const limit = user.features.maxRequestsPerMonth
      const allowed = used < limit

      if (allowed) {
        tx.update(ref, {
          usedThisPeriod: used + 1,
          totalRequests: admin.firestore.FieldValue.increment(1),
          periodKey: currentPeriod,
          updatedAt: admin.firestore.Timestamp.now()
        })
        return { allowed: true, used: used + 1, limit, remaining: Math.max(0, limit - used - 1) }
      }

      // Over quota — still reset periodKey if it was stale, but don't increment
      if (user.periodKey !== currentPeriod) {
        tx.update(ref, {
          periodKey: currentPeriod,
          usedThisPeriod: 0,
          updatedAt: admin.firestore.Timestamp.now()
        })
      }

      return { allowed: false, used, limit, remaining: 0 }
    })
  }

  /**
   * Check Stripe subscription from Firebase Stripe Extension's customers collection
   */
  private async getStripeSubscriptionPlan(uid: string): Promise<SubscriptionPlan | null> {
    try {
      const subscriptionsRef = this.db
        .collection('customers')
        .doc(uid)
        .collection('subscriptions')

      const snapshot = await subscriptionsRef
        .where('status', 'in', ['active', 'trialing'])
        .limit(1)
        .get()

      if (snapshot.empty) {
        return null
      }

      const subData = snapshot.docs[0].data()

      // Check price ID from items array (Firebase Stripe Extension format)
      const priceId = subData.items?.[0]?.price?.id
      const productId = subData.items?.[0]?.price?.product?.id ||
                        subData.items?.[0]?.plan?.product

      // Map price/product IDs to plans
      const PRICE_TO_PLAN: Record<string, SubscriptionPlan> = {
        'price_1SlgUUC8SiPjuMOqTC4BJ9Kf': 'pro',
        'price_1SlgUYC8SiPjuMOqmY9saU3e': 'enterprise',
      }
      const PRODUCT_TO_PLAN: Record<string, SubscriptionPlan> = {
        'prod_Tj8kp324D4WDqA': 'pro',
        'prod_Tj8kNNUXwRIG9v': 'enterprise',
      }

      if (priceId && PRICE_TO_PLAN[priceId]) {
        return PRICE_TO_PLAN[priceId]
      }
      if (productId && PRODUCT_TO_PLAN[productId]) {
        return PRODUCT_TO_PLAN[productId]
      }

      return null
    } catch (e) {
      // Don't silently swallow — a Firestore failure here causes paid users
      // to be treated as free-tier. Log prominently so on-call can detect it.
      console.error('CRITICAL: Failed to check Stripe subscription for user. Paid user may be downgraded to free tier.', e)
      throw e
    }
  }

  /**
   * Get usage statistics for user
   */
  async getUsageStats(uid: string): Promise<{
    plan: SubscriptionPlan
    used: number
    limit: number
    remaining: number
    percentUsed: number
    periodKey: string
    features: UserDocument['features']
  }> {
    const user = await this.getUser(uid)

    // Check for active Stripe subscription (takes precedence)
    const stripePlan = await this.getStripeSubscriptionPlan(uid)

    if (!user) {
      // Return Stripe plan or default free plan stats if user doesn't exist
      const plan = stripePlan || 'free'
      const features = PLAN_FEATURES[plan]
      return {
        plan,
        used: 0,
        limit: features.maxRequestsPerMonth,
        remaining: features.maxRequestsPerMonth,
        percentUsed: 0,
        periodKey: this.getCurrentPeriodKey(),
        features
      }
    }

    // Use Stripe plan if active, otherwise use stored plan
    const effectivePlan = stripePlan || user.plan
    const features = PLAN_FEATURES[effectivePlan]

    const currentPeriod = this.getCurrentPeriodKey()
    const used = user.periodKey === currentPeriod ? user.usedThisPeriod : 0
    const limit = features.maxRequestsPerMonth
    const remaining = Math.max(0, limit - used)
    const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0

    return {
      plan: effectivePlan,
      used,
      limit,
      remaining,
      percentUsed,
      periodKey: currentPeriod,
      features
    }
  }

  /**
   * Helper to get current period key (YYYY-MM)
   */
  private getCurrentPeriodKey(): string {
    return getCurrentPeriodKey()
  }

  /**
   * Admin function to grant plan (for testing/manual management)
   */
  async adminSetPlan(uid: string, plan: SubscriptionPlan): Promise<void> {
    const ref = this.collection.doc(uid)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new Error('User document does not exist')
    }

    await ref.update({
      plan,
      features: PLAN_FEATURES[plan],
      updatedAt: admin.firestore.Timestamp.now(),
      subscriptionStartDate: admin.firestore.Timestamp.now(),
      // Reset usage for upgraded users
      usedThisPeriod: 0,
      periodKey: this.getCurrentPeriodKey()
    })
  }

  /**
   * Increment gap tallies on the user's customer profile.
   * Used by Build Mode finalize and Quick Mode generate.
   */
  async incrementGapTallies(uid: string, gaps: GapItem[]): Promise<void> {
    if (gaps.length === 0) return
    const period = getCurrentPeriodKey()
    const tallyUpdates: Record<string, FirebaseFirestore.FieldValue | { category: string; method: string }> = {}
    for (const gap of gaps) {
      tallyUpdates[`gapTallies.identified.${gap.id}`] = admin.firestore.FieldValue.increment(1)
      tallyUpdates[`gapTallies.identifiedByPeriod.${period}.${gap.id}`] = admin.firestore.FieldValue.increment(1)
      tallyUpdates[`gapMeta.${gap.id}`] = { category: gap.category, method: gap.method }
    }
    await this.db.collection('customers').doc(uid).update(tallyUpdates)
  }
}

/** @deprecated Use DI via composition root. Retained for surveillance module. */
export const userService = new UserService()