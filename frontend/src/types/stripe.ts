/**
 * TypeScript interfaces for Stripe integration with Firebase Extension
 */

/**
 * Stripe checkout session as stored in Firestore
 */
export interface CheckoutSession {
  id?: string;
  mode: 'payment' | 'subscription' | 'setup';
  price?: string;
  prices?: string[];
  success_url: string;
  cancel_url: string;
  url?: string;
  created?: Date;
  sessionId?: string;
  error?: {
    message: string;
  };
  client_reference_id?: string;
  customer_email?: string;
  line_items?: Array<{
    price: string;
    quantity: number;
  }>;
  metadata?: Record<string, string>;
  payment_method_types?: string[];
  automatic_tax?: boolean;
  tax_id_collection?: boolean;
  allow_promotion_codes?: boolean;
  trial_from_plan?: boolean;
  trial_period_days?: number;
}

/**
 * Stripe subscription as stored in Firestore
 */
export interface Subscription {
  id: string;
  status: 
    | 'active' 
    | 'canceled' 
    | 'incomplete' 
    | 'incomplete_expired' 
    | 'past_due' 
    | 'trialing' 
    | 'unpaid'
    | 'paused';
  cancel_at_period_end: boolean;
  created: Date;
  current_period_start: Date;
  current_period_end: Date;
  ended_at?: Date | null;
  cancel_at?: Date | null;
  canceled_at?: Date | null;
  trial_start?: Date | null;
  trial_end?: Date | null;
  metadata?: Record<string, string>;
  items: SubscriptionItem[];
  latest_invoice?: string;
  pending_setup_intent?: string;
  pending_update?: any;
  pause_collection?: {
    behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void';
    resumes_at?: Date;
  };
}

/**
 * Individual item within a subscription
 */
export interface SubscriptionItem {
  id: string;
  price: Price;
  quantity?: number;
}

/**
 * Stripe price object as synced to Firestore
 */
export interface Price {
  id: string;
  product: string | Product;
  active: boolean;
  billing_scheme: 'per_unit' | 'tiered';
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  nickname?: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    trial_period_days?: number;
    usage_type?: 'metered' | 'licensed';
  };
  tiers?: Array<{
    flat_amount?: number;
    flat_amount_decimal?: string;
    unit_amount?: number;
    unit_amount_decimal?: string;
    up_to: number | null;
  }>;
  tiers_mode?: 'graduated' | 'volume';
  transform_quantity?: {
    divide_by: number;
    round: 'up' | 'down';
  };
  type: 'one_time' | 'recurring';
  unit_amount?: number;
  unit_amount_decimal?: string;
}

/**
 * Stripe product as synced to Firestore
 */
export interface Product {
  id: string;
  active: boolean;
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
  role?: string;
  tax_code?: string;
}

/**
 * Stripe customer data in Firestore
 */
export interface StripeCustomer {
  email?: string;
  stripeId: string;
  stripeLink: string;
}

/**
 * Combined product with prices for display
 */
export interface ProductWithPrices extends Product {
  prices: Price[];
}

/**
 * Subscription plans for the MDM Generator app
 */
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface PlanFeatures {
  tier: PlanTier;
  name: string;
  mdmsPerMonth: number;
  features: string[];
  priceId?: string;
  price?: number;
  currency?: string;
  interval?: 'month' | 'year';
}

/**
 * User subscription state
 */
export interface UserSubscriptionState {
  isLoading: boolean;
  subscription: Subscription | null;
  tier: PlanTier;
  mdmUsageThisMonth: number;
  mdmLimitThisMonth: number;
  currentPeriodEnd?: Date;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

/**
 * Billing portal session
 */
export interface BillingPortalSession {
  url: string;
  return_url: string;
  created?: Date;
}

/**
 * Payment method details
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'link';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

/**
 * Invoice for subscription billing
 */
export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: Date;
  due_date?: Date;
  paid_at?: Date;
  period_start: Date;
  period_end: Date;
  subscription?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
}

/**
 * Usage record for metered billing
 */
export interface UsageRecord {
  id: string;
  quantity: number;
  timestamp: Date;
  subscription_item: string;
}

/**
 * Stripe webhook event
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: Date;
  data: {
    object: any;
    previous_attributes?: any;
  };
}