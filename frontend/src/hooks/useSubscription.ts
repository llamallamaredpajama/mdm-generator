import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, type QuerySnapshot, type DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  metadata?: Record<string, any>;
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
  // Add your actual Stripe price IDs here
  // 'price_1234567890': 'pro',
  // 'price_0987654321': 'enterprise',
};

// Map product IDs to tiers as fallback
const PRODUCT_TO_TIER_MAP: Record<string, SubscriptionTier> = {
  // Add your actual Stripe product IDs here
  // 'prod_1234567890': 'pro',
  // 'prod_0987654321': 'enterprise',
};

// Generation limits per tier
const GENERATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 250,
  enterprise: 1000,
};

function determineSubscriptionTier(subscription: DocumentData | null): SubscriptionTier {
  if (!subscription) return 'free';
  
  // Check price ID first
  if (subscription.price?.id && PRICE_TO_TIER_MAP[subscription.price.id]) {
    return PRICE_TO_TIER_MAP[subscription.price.id];
  }
  
  // Check product ID as fallback
  if (subscription.product?.id && PRODUCT_TO_TIER_MAP[subscription.product.id]) {
    return PRODUCT_TO_TIER_MAP[subscription.product.id];
  }
  
  // Check metadata for tier information
  if (subscription.metadata?.tier) {
    return subscription.metadata.tier as SubscriptionTier;
  }
  
  // Default to free if no tier found
  return 'free';
}

function convertTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return null;
}

export function useSubscription(): SubscriptionHookReturn {
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
              priceId: data.price?.id || null,
              productId: data.product?.id || null,
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