import admin from 'firebase-admin'

// Defer Firestore initialization to avoid initialization order issues
const getDb = () => admin.firestore()

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'

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
  }
}

export class UserService {
  private get collection() {
    return getDb().collection('users')
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
   */
  async incrementUsage(uid: string): Promise<void> {
    await this.collection.doc(uid).update({
      usedThisPeriod: admin.firestore.FieldValue.increment(1),
      totalRequests: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.Timestamp.now()
    })
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
    if (!user) {
      // Return default free plan stats if user doesn't exist
      return {
        plan: 'free',
        used: 0,
        limit: PLAN_FEATURES.free.maxRequestsPerMonth,
        remaining: PLAN_FEATURES.free.maxRequestsPerMonth,
        percentUsed: 0,
        periodKey: this.getCurrentPeriodKey(),
        features: PLAN_FEATURES.free
      }
    }

    const currentPeriod = this.getCurrentPeriodKey()
    const used = user.periodKey === currentPeriod ? user.usedThisPeriod : 0
    const limit = user.features.maxRequestsPerMonth
    const remaining = Math.max(0, limit - used)
    const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0

    return {
      plan: user.plan,
      used,
      limit,
      remaining,
      percentUsed,
      periodKey: currentPeriod,
      features: user.features
    }
  }

  /**
   * Helper to get current period key (YYYY-MM)
   */
  private getCurrentPeriodKey(): string {
    const now = new Date()
    return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}`
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
}

export const userService = new UserService()