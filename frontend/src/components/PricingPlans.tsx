import { useState, useEffect } from 'react'
import { useAuth } from '../lib/firebase'
import { 
  createCheckoutSession, 
  getProducts, 
  getActiveSubscription,
  createCustomerPortalSession,
  getPlanTier,
  type ProductWithPrices,
  type Subscription,
  type PlanTier
} from '../lib/stripe'
import './PricingPlans.css'

interface PlanDefinition {
  tier: PlanTier
  name: string
  price: string
  priceId?: string
  interval: 'month' | 'year'
  mdmsPerMonth: number
  features: string[]
  highlighted: boolean
  ctaText: string
}

const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    interval: 'month',
    mdmsPerMonth: 10,
    features: [
      '10 MDMs per month',
      'Basic MDM generation',
      'Copy to clipboard',
      'Email support'
    ],
    highlighted: false,
    ctaText: 'Current Plan'
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$29',
    interval: 'month',
    mdmsPerMonth: 250,
    features: [
      '250 MDMs per month',
      'Priority processing',
      'Export to multiple formats',
      'Advanced templates',
      'Priority email support',
      'Usage analytics'
    ],
    highlighted: true,
    ctaText: 'Upgrade to Pro'
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    interval: 'month',
    mdmsPerMonth: 1000,
    features: [
      '1,000 MDMs per month',
      'Fastest processing',
      'All export formats',
      'Custom templates',
      'API access',
      'Team collaboration',
      'Dedicated support',
      'Training sessions'
    ],
    highlighted: false,
    ctaText: 'Go Enterprise'
  }
]

export default function PricingPlans() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductWithPrices[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [currentTier, setCurrentTier] = useState<PlanTier>('free')
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    loadStripeData()
  }, [user])

  const loadStripeData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load products and current subscription in parallel
      const [productsData, subscription] = await Promise.all([
        getProducts(),
        getActiveSubscription(user)
      ])
      
      setProducts(productsData)
      setCurrentSubscription(subscription)
      setCurrentTier(getPlanTier(subscription))
    } catch (error) {
      console.error('Error loading Stripe data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan: PlanDefinition) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/'
      return
    }

    // If it's the current plan, do nothing
    if (plan.tier === currentTier) {
      return
    }

    // If user has an active subscription, redirect to customer portal
    if (currentSubscription && currentSubscription.status === 'active') {
      try {
        setRedirecting(true)
        const portalUrl = await createCustomerPortalSession(user)
        window.location.href = portalUrl
      } catch (error) {
        console.error('Error creating portal session:', error)
        alert('Unable to open billing portal. Please try again.')
        setRedirecting(false)
      }
      return
    }

    // For new subscriptions, create checkout session
    if (plan.tier === 'free') {
      // Can't downgrade to free through checkout
      return
    }

    // Find the price ID for the selected plan
    const product = products.find(p => 
      p.metadata?.tier === plan.tier || 
      p.name.toLowerCase() === plan.tier
    )
    
    if (!product || !product.prices?.length) {
      console.error('Product not found for tier:', plan.tier)
      alert('This plan is not available yet. Please try again later.')
      return
    }

    // Get the monthly price (or first available price)
    const price = product.prices.find((p: any) => 
      p.recurring?.interval === 'month'
    ) || product.prices[0]

    if (!price) {
      console.error('Price not found for product:', product)
      alert('Unable to find pricing information. Please try again.')
      return
    }

    try {
      setRedirecting(true)
      const checkoutUrl = await createCheckoutSession(
        user,
        price.id,
        window.location.origin + '/settings?session_id={CHECKOUT_SESSION_ID}&success=true',
        window.location.origin + '/settings?canceled=true'
      )
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Unable to start checkout. Please try again.')
      setRedirecting(false)
    }
  }

  const getButtonText = (plan: PlanDefinition): string => {
    if (plan.tier === currentTier) {
      return 'Current Plan'
    }
    
    if (currentSubscription && currentSubscription.status === 'active') {
      if (plan.tier === 'free') {
        return 'Downgrade'
      }
      const tierOrder: Record<PlanTier, number> = { free: 0, pro: 1, enterprise: 2 }
      return tierOrder[plan.tier] > tierOrder[currentTier] ? 'Upgrade' : 'Change Plan'
    }
    
    return plan.ctaText
  }

  const isButtonDisabled = (plan: PlanDefinition): boolean => {
    return plan.tier === currentTier || loading || redirecting
  }

  if (loading && !products.length) {
    return (
      <div className="pricing-plans-loading">
        <div className="spinner"></div>
        <p>Loading pricing plans...</p>
      </div>
    )
  }

  return (
    <div className="pricing-plans">
      <div className="pricing-header">
        <h2>Choose Your Plan</h2>
        <p>Select the plan that best fits your needs</p>
      </div>

      <div className="pricing-grid">
        {PLAN_DEFINITIONS.map((plan) => (
          <div 
            key={plan.tier}
            className={`pricing-card ${plan.highlighted ? 'highlighted' : ''} ${plan.tier === currentTier ? 'current' : ''}`}
          >
            {plan.highlighted && (
              <div className="popular-badge">Most Popular</div>
            )}
            
            {plan.tier === currentTier && (
              <div className="current-badge">Current Plan</div>
            )}

            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-interval">/{plan.interval}</span>
              </div>
              <div className="plan-mdms">
                {plan.mdmsPerMonth} MDMs per month
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <svg className="feature-check" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`plan-button ${plan.tier === currentTier ? 'current' : ''}`}
              onClick={() => handleSelectPlan(plan)}
              disabled={isButtonDisabled(plan)}
            >
              {redirecting ? 'Redirecting...' : getButtonText(plan)}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p className="pricing-note">
          All plans include HIPAA compliance, secure processing, and regular updates.
        </p>
        {currentSubscription && (
          <button 
            className="manage-subscription-link"
            onClick={async () => {
              if (!user) return
              try {
                setRedirecting(true)
                const portalUrl = await createCustomerPortalSession(user)
                window.location.href = portalUrl
              } catch (error) {
                console.error('Error creating portal session:', error)
                alert('Unable to open billing portal. Please try again.')
                setRedirecting(false)
              }
            }}
            disabled={redirecting}
          >
            Manage Subscription →
          </button>
        )}
      </div>
    </div>
  )
}