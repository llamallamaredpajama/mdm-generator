import { useEffect, useState } from 'react'
import { useAuthToken, useAuth, signOutUser } from '../lib/firebase'
import { whoAmI } from '../lib/api'
import { useSubscription } from '../hooks/useSubscription'
import { 
  createCheckoutSession, 
  createCustomerPortalSession,
  getProducts,
  type ProductWithPrices
} from '../lib/stripe'

export default function Settings() {
  const token = useAuthToken()
  const { user } = useAuth()
  const { subscription, tier, loading: subLoading } = useSubscription()
  const [info, setInfo] = useState<{ plan: string | null; usedThisPeriod: number; monthlyQuota: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [products, setProducts] = useState<ProductWithPrices[]>([])

  useEffect(() => {
    const run = async () => {
      if (!token) return
      setLoading(true)
      try {
        const res = await whoAmI(token)
        setInfo({ plan: res.plan, usedThisPeriod: res.used, monthlyQuota: res.limit, remaining: res.remaining })
      } catch (e) {
        console.error('Failed to load account info', e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return
      try {
        const productsData = await getProducts()
        setProducts(productsData)
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [user])

  const handleUpgrade = async () => {
    if (!user) return
    
    try {
      setRedirecting(true)
      
      // Find the Pro product price ID
      const proProduct = products.find(p => 
        p.metadata?.tier === 'pro' || 
        p.name.toLowerCase() === 'pro'
      )
      
      if (!proProduct || !proProduct.prices?.length) {
        alert('Pro plan is not available yet. Please try again later.')
        setRedirecting(false)
        return
      }

      const price = proProduct.prices.find((p: any) => 
        p.recurring?.interval === 'month'
      ) || proProduct.prices[0]

      const checkoutUrl = await createCheckoutSession(
        user,
        price.id,
        window.location.origin + '/settings?success=true',
        window.location.origin + '/settings'
      )
      
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Unable to start checkout. Please try again.')
      setRedirecting(false)
    }
  }

  const handleManageBilling = async () => {
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
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getPlanDisplayName = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro'
      case 'enterprise':
        return 'Enterprise'
      default:
        return 'Free'
    }
  }

  const getPlanFeatures = (tier: string) => {
    switch (tier) {
      case 'pro':
        return ['250 MDMs/month', 'Priority processing', 'Export formats', 'Priority support']
      case 'enterprise':
        return ['1000 MDMs/month', 'Fastest processing', 'API access', 'Team features', 'Dedicated support']
      default:
        return ['10 MDMs/month', 'Basic features', 'Email support']
    }
  }

  return (
    <section>
      <h2>Settings</h2>
      
      {/* Account Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Account</h3>
        {user ? (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {user.email}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>User ID:</strong> {user.uid}
            </div>
            <button onClick={() => signOutUser()}>Sign out</button>
          </div>
        ) : (
          <div>Please sign in on the Start page.</div>
        )}
      </div>

      {/* Subscription Management Section */}
      {user && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Subscription Management</h3>
          
          {subLoading || loading ? (
            <div>Loading subscription details...</div>
          ) : (
            <>
              {/* Current Plan Details */}
              <div style={{ 
                background: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ marginTop: 0 }}>Current Plan: {getPlanDisplayName(tier)}</h4>
                
                {subscription && subscription.status === 'active' ? (
                  <>
                    <p style={{ color: '#0a0', marginBottom: '0.5rem' }}>
                      ✓ Active Subscription
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Status:</strong> {subscription.status}
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Billing Period:</strong> {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                    {subscription.cancelAtPeriodEnd && (
                      <p style={{ color: '#aa0', marginBottom: '0.5rem' }}>
                        ⚠️ Subscription will cancel at period end
                      </p>
                    )}
                  </>
                ) : subscription && subscription.status === 'trialing' ? (
                  <>
                    <p style={{ color: '#0a0', marginBottom: '0.5rem' }}>
                      ✓ Trial Active
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Trial Ends:</strong> {formatDate(subscription.trialEnd)}
                    </p>
                  </>
                ) : (
                  <p style={{ marginBottom: '0.5rem' }}>
                    You're on the free plan with basic features.
                  </p>
                )}
                
                {/* Plan Features */}
                <div style={{ marginTop: '1rem' }}>
                  <strong>Plan Features:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {getPlanFeatures(tier).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Usage Information */}
              {info && (
                <div style={{ 
                  background: '#f9f9f9', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ marginTop: 0 }}>Usage This Month</h4>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{info.usedThisPeriod}</strong> of <strong>{info.monthlyQuota}</strong> MDMs used
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{info.remaining}</strong> remaining
                  </div>
                  
                  {/* Usage Progress Bar */}
                  <div style={{ 
                    background: '#ddd', 
                    borderRadius: '4px', 
                    height: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: info.usedThisPeriod / info.monthlyQuota > 0.8 ? '#e90' : '#0a0',
                      width: `${Math.min(100, (info.usedThisPeriod / info.monthlyQuota) * 100)}%`,
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '1.5rem' }}>
                {tier === 'free' ? (
                  <button 
                    onClick={handleUpgrade}
                    disabled={redirecting}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      cursor: redirecting ? 'not-allowed' : 'pointer',
                      opacity: redirecting ? 0.5 : 1
                    }}
                  >
                    {redirecting ? 'Redirecting...' : 'Upgrade to Pro →'}
                  </button>
                ) : (
                  <button 
                    onClick={handleManageBilling}
                    disabled={redirecting}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      cursor: redirecting ? 'not-allowed' : 'pointer',
                      opacity: redirecting ? 0.5 : 1
                    }}
                  >
                    {redirecting ? 'Redirecting...' : 'Manage Billing →'}
                  </button>
                )}
                
                {tier !== 'free' && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Access Stripe Customer Portal to update payment, download invoices, or cancel subscription
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* System Information */}
      <div>
        <h3>System Information</h3>
        <p><strong>Model:</strong> Gemini 1.5 Flash (Vertex AI)</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      </div>
    </section>
  )
}

