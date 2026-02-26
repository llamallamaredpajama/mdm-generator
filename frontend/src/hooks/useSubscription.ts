import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, type QuerySnapshot, type DocumentData, Timestamp } from 'firebase/firestore';
import { getAppDb } from '../lib/firebase';
import { useAuth } from '../lib/firebase';

export type SubscriptionStatus = 
  | 'trialing' 
  | 'active' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due' 
  | 'unpaid' 
  | 'paused'
  | null;

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  endedAt: Date | null;
  trialEnd: Date | null;
  priceId: string | null;
  productId: string | null;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionHookReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  isActive: boolean;
  tier: SubscriptionTier;
  canGenerate: boolean;
  remainingGenerations: number | null;
}

// Map Stripe price IDs to tiers (these should match your Stripe configuration)
const PRICE_TO_TIER_MAP: Record<string, SubscriptionTier> = {
  'price_1SlgUUC8SiPjuMOqTC4BJ9Kf': 'pro',
  'price_1SlgUYC8SiPjuMOqmY9saU3e': 'enterprise',
};

// Map product IDs to tiers as fallback
const PRODUCT_TO_TIER_MAP: Record<string, SubscriptionTier> = {
  'prod_Tj8kp324D4WDqA': 'pro',
  'prod_Tj8kNNUXwRIG9v': 'enterprise',
};

// Generation limits per tier
const GENERATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 250,
  enterprise: 1000,
};

function determineSubscriptionTier(subscription: DocumentData | null): SubscriptionTier {
  if (!subscription) return 'free';

  // Firebase Stripe Extension stores price as a document reference,
  // but the full price data is in items[0].price
  const priceId = subscription.items?.[0]?.price?.id;
  if (priceId && PRICE_TO_TIER_MAP[priceId]) {
    return PRICE_TO_TIER_MAP[priceId];
  }

  // Check product ID from items as fallback
  const productId = subscription.items?.[0]?.price?.product?.id ||
                    subscription.items?.[0]?.plan?.product;
  if (productId && PRODUCT_TO_TIER_MAP[productId]) {
    return PRODUCT_TO_TIER_MAP[productId];
  }

  // Check metadata for tier information
  if (subscription.metadata?.tier) {
    return subscription.metadata.tier as SubscriptionTier;
  }

  // Default to free if no tier found
  return 'free';
}

function convertTimestamp(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return null;
}

export function useSubscription(): SubscriptionHookReturn {
  const db = getAppDb();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      setError(null);
      setRemainingGenerations(GENERATION_LIMITS.free);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to subscription changes in Firestore
    const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('status', 'in', ['trialing', 'active'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          if (snapshot.empty) {
            // No active subscription, user is on free tier
            setSubscription(null);
            setRemainingGenerations(GENERATION_LIMITS.free);
          } else {
            // Get the first active subscription (users should only have one)
            const doc = snapshot.docs[0];
            const data = doc.data();
            
            const tier = determineSubscriptionTier(data);
            
            // Extract IDs from items array (Firebase Stripe Extension format)
            const itemPrice = data.items?.[0]?.price;
            const extractedPriceId = itemPrice?.id || null;
            const extractedProductId = itemPrice?.product?.id ||
                                       data.items?.[0]?.plan?.product || null;

            const subscriptionData: Subscription = {
              id: doc.id,
              status: data.status as SubscriptionStatus,
              tier,
              currentPeriodStart: convertTimestamp(data.current_period_start),
              currentPeriodEnd: convertTimestamp(data.current_period_end),
              cancelAtPeriodEnd: data.cancel_at_period_end || false,
              canceledAt: convertTimestamp(data.canceled_at),
              endedAt: convertTimestamp(data.ended_at),
              trialEnd: convertTimestamp(data.trial_end),
              priceId: extractedPriceId,
              productId: extractedProductId,
              quantity: data.quantity || 1,
              metadata: data.metadata || {},
            };
            
            setSubscription(subscriptionData);
            
            // Calculate remaining generations based on usage (would need usage tracking)
            // For now, just set the limit for the tier
            setRemainingGenerations(GENERATION_LIMITS[tier]);
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error processing subscription data:', err);
          setError(err instanceof Error ? err : new Error('Failed to process subscription'));
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to subscription:', err);
        setError(err instanceof Error ? err : new Error('Failed to load subscription'));
        setLoading(false);
      }
    );

    // Also listen to usage documents if you're tracking usage
    // This would be another collection listener to track remaining generations

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Derived values
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const tier = subscription?.tier || 'free';
  const canGenerate = remainingGenerations === null || remainingGenerations > 0;

  return {
    subscription,
    loading,
    error,
    isActive,
    tier,
    canGenerate,
    remainingGenerations,
  };
}

// Helper hook to check specific subscription features
export function useSubscriptionFeature(feature: string): boolean {
  const { tier } = useSubscription();
  
  const FEATURE_MAP: Record<string, SubscriptionTier[]> = {
    'priority_processing': ['pro', 'enterprise'],
    'export_formats': ['pro', 'enterprise'],
    'api_access': ['enterprise'],
    'team_features': ['enterprise'],
    'analytics': ['pro', 'enterprise'],
    'custom_templates': ['pro', 'enterprise'],
  };
  
  const allowedTiers = FEATURE_MAP[feature] || [];
  return allowedTiers.includes(tier);
}

// Helper hook to get subscription limits
export function useSubscriptionLimits() {
  const { tier } = useSubscription();
  
  return {
    monthlyGenerations: GENERATION_LIMITS[tier],
    priorityProcessing: tier !== 'free',
    exportFormats: tier !== 'free',
    apiAccess: tier === 'enterprise',
    teamMembers: tier === 'enterprise' ? 'unlimited' : 1,
  };
}