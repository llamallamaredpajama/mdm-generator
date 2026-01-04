/**
 * Stripe helper functions for Firebase Extension integration
 */

import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  doc,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { type User } from 'firebase/auth';

// Re-export types that components need
export type { 
  CheckoutSession, 
  Subscription, 
  BillingPortalSession,
  ProductWithPrices,
  PlanTier,
  UserSubscriptionState 
} from '../types/stripe';

import type { 
  CheckoutSession, 
  Subscription, 
  BillingPortalSession,
  ProductWithPrices,
  PlanTier,
  UserSubscriptionState 
} from '../types/stripe';

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession(
  user: User,
  priceId: string,
  successUrl: string = window.location.origin + '/settings?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: string = window.location.origin + '/settings'
): Promise<string> {
  if (!user) {
    throw new Error('User must be authenticated to create checkout session');
  }

  const checkoutSessionRef = collection(db, 'customers', user.uid, 'checkout_sessions');
  
  const sessionData: Partial<CheckoutSession> = {
    mode: 'subscription',
    price: priceId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    // automatic_tax and tax_id_collection disabled - requires Stripe Tax setup
    metadata: {
      userId: user.uid,
      userEmail: user.email || '',
    }
  };

  const docRef = await addDoc(checkoutSessionRef, sessionData);
  
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const data = snap.data() as CheckoutSession;
      
      if (data?.error) {
        unsubscribe();
        reject(new Error(data.error.message));
      }
      
      if (data?.url) {
        unsubscribe();
        resolve(data.url);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      unsubscribe();
      reject(new Error('Checkout session creation timed out'));
    }, 30000);
  });
}

/**
 * Monitor a checkout session for completion
 */
export function monitorCheckoutSession(
  user: User,
  sessionId: string,
  onUpdate: (session: CheckoutSession) => void
): Unsubscribe {
  const sessionRef = doc(db, 'customers', user.uid, 'checkout_sessions', sessionId);
  
  return onSnapshot(sessionRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as CheckoutSession;
      onUpdate({ ...data, id: snap.id });
    }
  });
}

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(user: User): Promise<Subscription | null> {
  if (!user) return null;
  
  const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
  const q = query(
    subscriptionsRef, 
    where('status', 'in', ['active', 'trialing'])
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  // Return the first active subscription
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Subscription;
}

/**
 * Listen to subscription changes
 */
export function subscribeToSubscriptionChanges(
  user: User,
  onUpdate: (subscriptions: Subscription[]) => void
): Unsubscribe {
  if (!user) {
    onUpdate([]);
    return () => {};
  }
  
  const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
  
  return onSnapshot(subscriptionsRef, (snapshot) => {
    const subscriptions: Subscription[] = [];
    
    snapshot.forEach((doc) => {
      subscriptions.push({
        id: doc.id,
        ...doc.data()
      } as Subscription);
    });
    
    onUpdate(subscriptions);
  });
}

/**
 * Create a customer portal session for managing billing
 */
export async function createCustomerPortalSession(
  user: User,
  returnUrl: string = window.location.origin + '/settings'
): Promise<string> {
  if (!user) {
    throw new Error('User must be authenticated to access customer portal');
  }

  const portalSessionRef = collection(db, 'customers', user.uid, 'portal_sessions');
  
  const sessionData: Partial<BillingPortalSession> = {
    return_url: returnUrl,
  };

  const docRef = await addDoc(portalSessionRef, sessionData);
  
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const data = snap.data() as BillingPortalSession;
      
      if (data?.url) {
        unsubscribe();
        resolve(data.url);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      unsubscribe();
      reject(new Error('Portal session creation timed out'));
    }, 30000);
  });
}

/**
 * Get all products with prices
 */
export async function getProducts(): Promise<ProductWithPrices[]> {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('active', '==', true));
  const productsSnapshot = await getDocs(q);
  
  const products: ProductWithPrices[] = [];
  
  for (const productDoc of productsSnapshot.docs) {
    const product = {
      id: productDoc.id,
      ...productDoc.data()
    } as ProductWithPrices;
    
    // Get prices for this product
    const pricesRef = collection(db, 'products', productDoc.id, 'prices');
    const pricesQuery = query(pricesRef, where('active', '==', true));
    const pricesSnapshot = await getDocs(pricesQuery);
    
    product.prices = pricesSnapshot.docs.map(priceDoc => ({
      id: priceDoc.id,
      ...priceDoc.data()
    })) as any[];
    
    products.push(product);
  }
  
  return products;
}

/**
 * Determine user's plan tier based on subscription
 */
export function getPlanTier(subscription: Subscription | null): PlanTier {
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }
  
  // Check the product metadata or role to determine tier
  const productId = subscription.items[0]?.price?.product;
  
  if (typeof productId === 'object' && productId.metadata?.tier) {
    return productId.metadata.tier as PlanTier;
  }
  
  // Fallback: check price ID patterns (customize based on your Stripe products)
  const priceId = subscription.items[0]?.price?.id;
  if (priceId?.includes('pro')) return 'pro';
  if (priceId?.includes('enterprise')) return 'enterprise';
  
  return 'free';
}

/**
 * Get MDM usage limits based on plan tier
 */
export function getMDMLimits(tier: PlanTier): number {
  switch (tier) {
    case 'free':
      return 10;
    case 'pro':
      return 250;
    case 'enterprise':
      return 1000;
    default:
      return 10;
  }
}

/**
 * Calculate usage for current billing period
 */
export async function getCurrentPeriodUsage(
  user: User,
  subscription: Subscription | null
): Promise<number> {
  if (!user) return 0;
  
  // Determine the start of the current period
  const periodStart = subscription?.current_period_start 
    ? new Date(subscription.current_period_start)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First of month for free tier
  
  // Query usage collection (you'll need to track this in your backend)
  const usageRef = collection(db, 'customers', user.uid, 'usage');
  const q = query(
    usageRef,
    where('timestamp', '>=', Timestamp.fromDate(periodStart)),
    where('type', '==', 'mdm_generation')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Check if user can generate another MDM based on limits
 */
export async function canGenerateMDM(
  user: User,
  subscription: Subscription | null
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = getPlanTier(subscription);
  const limit = getMDMLimits(tier);
  const usage = await getCurrentPeriodUsage(user, subscription);
  
  if (usage >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit} MDMs. Please upgrade your plan to continue.`
    };
  }
  
  return { allowed: true };
}

/**
 * Helper to format subscription status for display
 */
export function formatSubscriptionStatus(status: Subscription['status']): string {
  const statusMap: Record<Subscription['status'], string> = {
    active: 'Active',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    past_due: 'Past Due',
    trialing: 'Trial',
    unpaid: 'Unpaid',
    paused: 'Paused'
  };
  
  return statusMap[status] || status;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
}

/**
 * Get complete subscription state for a user
 */
export async function getUserSubscriptionState(user: User | null): Promise<UserSubscriptionState> {
  if (!user) {
    return {
      isLoading: false,
      subscription: null,
      tier: 'free',
      mdmUsageThisMonth: 0,
      mdmLimitThisMonth: 10,
      canUpgrade: true,
      canDowngrade: false
    };
  }
  
  try {
    const subscription = await getActiveSubscription(user);
    const tier = getPlanTier(subscription);
    const usage = await getCurrentPeriodUsage(user, subscription);
    const limit = getMDMLimits(tier);
    
    return {
      isLoading: false,
      subscription,
      tier,
      mdmUsageThisMonth: usage,
      mdmLimitThisMonth: limit,
      currentPeriodEnd: subscription?.current_period_end 
        ? new Date(subscription.current_period_end) 
        : undefined,
      canUpgrade: tier !== 'enterprise',
      canDowngrade: tier !== 'free'
    };
  } catch (error) {
    console.error('Error getting subscription state:', error);
    return {
      isLoading: false,
      subscription: null,
      tier: 'free',
      mdmUsageThisMonth: 0,
      mdmLimitThisMonth: 10,
      canUpgrade: true,
      canDowngrade: false
    };
  }
}