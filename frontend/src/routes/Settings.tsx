import { useEffect, useState } from 'react'
import {
  User as UserIcon,
  SignOut as SignOutIcon,
  CreditCard as CreditCardIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Lightning as LightningIcon,
  ClipboardText as ClipboardTextIcon,
  Trash as TrashIcon,
  Info as InfoIcon,
} from '@phosphor-icons/react'
import { useAuthToken, useAuth, signOutUser } from '../lib/firebase'
import { whoAmI } from '../lib/api'
import { useSubscription } from '../hooks/useSubscription'
import { useToast } from '../contexts/ToastContext'
import { useOrderSets } from '../hooks/useOrderSets'
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getProducts,
  type ProductWithPrices,
} from '../lib/stripe'
import './Settings.css'

// Skeleton component for loading states
function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />
}

function SettingsCardSkeleton() {
  return (
    <div className="settings-skeleton-card">
      <div className="settings-skeleton-header">
        <Skeleton className="skeleton-title" style={{ width: '120px' }} />
        <Skeleton className="skeleton-text" style={{ width: '80px' }} />
      </div>
      <div className="settings-skeleton-row">
        <Skeleton className="skeleton-text" style={{ width: '100px' }} />
        <Skeleton className="skeleton-text" style={{ width: '200px' }} />
      </div>
      <div className="settings-skeleton-row">
        <Skeleton className="skeleton-text" style={{ width: '100px' }} />
        <Skeleton className="skeleton-text" style={{ width: '150px' }} />
      </div>
      <Skeleton className="settings-skeleton-bar" />
    </div>
  )
}

export default function Settings() {
  const token = useAuthToken()
  const { user } = useAuth()
  const { subscription, tier, loading: subLoading } = useSubscription()
  const { error: showError } = useToast()
  const { orderSets, deleteOrderSet } = useOrderSets()
  const [info, setInfo] = useState<{
    plan: string | null
    usedThisPeriod: number
    monthlyQuota: number
    remaining: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [products, setProducts] = useState<ProductWithPrices[]>([])

  useEffect(() => {
    const run = async () => {
      if (!token) return
      setLoading(true)
      try {
        const res = await whoAmI(token)
        setInfo({
          plan: res.plan,
          usedThisPeriod: res.used,
          monthlyQuota: res.limit,
          remaining: res.remaining,
        })
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

      const proProduct = products.find(
        (p) => p.metadata?.tier === 'pro' || p.name.toLowerCase() === 'pro',
      )

      if (!proProduct || !proProduct.prices?.length) {
        showError('Pro plan is not available yet. Please try again later.')
        setRedirecting(false)
        return
      }

      const price =
        proProduct.prices.find((p) => p.recurring?.interval === 'month') || proProduct.prices[0]

      const checkoutUrl = await createCheckoutSession(
        user,
        price.id,
        window.location.origin + '/settings?success=true',
        window.location.origin + '/settings',
      )

      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      showError('Unable to start checkout. Please try again.')
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
      showError('Unable to open billing portal. Please try again.')
      setRedirecting(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
        return [
          '1000 MDMs/month',
          'Fastest processing',
          'API access',
          'Team features',
          'Dedicated support',
        ]
      default:
        return ['10 MDMs/month', 'Basic features', 'Email support']
    }
  }

  const getUsagePercentage = () => {
    if (!info) return 0
    return Math.min(100, (info.usedThisPeriod / info.monthlyQuota) * 100)
  }

  const getProgressClass = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 90) return 'settings-progress-fill--high'
    if (percentage >= 70) return 'settings-progress-fill--medium'
    return 'settings-progress-fill--low'
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      {/* Account Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          <UserIcon className="settings-section-icon" weight="bold" size={24} />
          Account
        </h2>

        {user ? (
          <div className="settings-card">
            <div className="settings-info-row">
              <span className="settings-info-label">Email</span>
              <span className="settings-info-value">{user.email}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">User ID</span>
              <span
                className="settings-info-value"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}
              >
                {user.uid}
              </span>
            </div>
            <div className="settings-actions">
              <button className="settings-btn settings-btn--danger" onClick={() => signOutUser()}>
                <SignOutIcon weight="bold" size={18} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-signin">
            <UserIcon className="settings-signin-icon" weight="bold" size={48} />
            <p className="settings-signin-text">
              Please sign in on the Start page to manage your account.
            </p>
          </div>
        )}
      </section>

      {/* Subscription Section */}
      {user && (
        <section className="settings-section">
          <h2 className="settings-section-title">
            <CreditCardIcon className="settings-section-icon" weight="bold" size={24} />
            Subscription
          </h2>

          {subLoading || loading ? (
            <SettingsCardSkeleton />
          ) : (
            <>
              {/* Current Plan */}
              <div className="settings-card">
                <div className="settings-card__header">
                  <h3 className="settings-card__title">Current Plan: {getPlanDisplayName(tier)}</h3>
                  {subscription?.status === 'active' && (
                    <span className="settings-badge settings-badge--success">Active</span>
                  )}
                  {subscription?.status === 'trialing' && (
                    <span className="settings-badge settings-badge--accent">Trial</span>
                  )}
                  {!subscription && (
                    <span className="settings-badge settings-badge--accent">Free</span>
                  )}
                </div>

                {subscription && subscription.status === 'active' ? (
                  <>
                    <p className="settings-status settings-status--active">
                      <CheckIcon weight="bold" size={16} />
                      Active Subscription
                    </p>
                    <div className="settings-info-row">
                      <span className="settings-info-label">Billing Period</span>
                      <span className="settings-info-value">
                        {formatDate(subscription.currentPeriodStart)} -{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <p className="settings-status settings-status--warning">
                        <WarningIcon weight="bold" size={16} />
                        Subscription will cancel at period end
                      </p>
                    )}
                  </>
                ) : subscription && subscription.status === 'trialing' ? (
                  <>
                    <p className="settings-status settings-status--active">
                      <CheckIcon weight="bold" size={16} />
                      Trial Active
                    </p>
                    <div className="settings-info-row">
                      <span className="settings-info-label">Trial Ends</span>
                      <span className="settings-info-value">
                        {formatDate(subscription.trialEnd)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="settings-status settings-status--info">
                    You're on the free plan with basic features.
                  </p>
                )}

                {/* Features List */}
                <div className="settings-features">
                  <p className="settings-features-title">Plan Features</p>
                  <ul className="settings-features-list">
                    {getPlanFeatures(tier).map((feature, idx) => (
                      <li key={idx} className="settings-features-item">
                        <CheckIcon className="settings-features-check" weight="bold" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Usage */}
              {info && (
                <div className="settings-card">
                  <h3 className="settings-card__title">Usage This Month</h3>
                  <div className="settings-usage">
                    <div className="settings-usage-header">
                      <span className="settings-usage-label">MDM Generations</span>
                      <span className="settings-usage-value">
                        {info.usedThisPeriod} / {info.monthlyQuota}
                      </span>
                    </div>
                    <div className="settings-progress-bar">
                      <div
                        className={`settings-progress-fill ${getProgressClass()}`}
                        style={{ width: `${getUsagePercentage()}%` }}
                      />
                    </div>
                    <p className="settings-remaining">
                      <strong>{info.remaining}</strong> generations remaining
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="settings-actions">
                {tier === 'free' ? (
                  <>
                    <button
                      className="settings-btn settings-btn--primary"
                      onClick={handleUpgrade}
                      disabled={redirecting}
                    >
                      {redirecting ? (
                        <>
                          <div className="spinner spinner--sm" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <LightningIcon weight="bold" size={18} />
                          Upgrade to Pro
                        </>
                      )}
                    </button>
                    <p className="settings-btn-help">Get 250 MDMs/month and priority processing</p>
                  </>
                ) : (
                  <>
                    <button
                      className="settings-btn settings-btn--secondary"
                      onClick={handleManageBilling}
                      disabled={redirecting}
                    >
                      {redirecting ? (
                        <>
                          <div className="spinner spinner--sm" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon weight="bold" size={18} />
                          Manage Billing
                        </>
                      )}
                    </button>
                    <p className="settings-btn-help">
                      Update payment, download invoices, or cancel subscription
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Order Sets */}
      {user && (
        <section className="settings-section">
          <h2 className="settings-section-title">
            <ClipboardTextIcon className="settings-section-icon" weight="bold" size={24} />
            Order Sets
          </h2>

          {orderSets.length === 0 ? (
            <div className="settings-card settings-card--static">
              <p className="settings-status settings-status--info">
                No saved order sets. Save one from the workup card during an encounter.
              </p>
            </div>
          ) : (
            <div className="settings-card">
              <div className="settings-orderset-list" data-testid="settings-orderset-list">
                {orderSets.map((os) => (
                  <div key={os.id} className="settings-orderset-item">
                    <div className="settings-orderset-info">
                      <span className="settings-orderset-name">{os.name}</span>
                      <span className="settings-orderset-meta">
                        {os.tests.length} tests | used {os.usageCount}x
                      </span>
                    </div>
                    <button
                      className="settings-btn settings-btn--icon-danger"
                      onClick={() => deleteOrderSet(os.id)}
                      data-testid={`delete-orderset-${os.id}`}
                      type="button"
                      title="Delete order set"
                    >
                      <TrashIcon weight="bold" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* System Information */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          <InfoIcon className="settings-section-icon" weight="bold" size={24} />
          System
        </h2>
        <div className="settings-card settings-card--static">
          <div className="settings-system-info">
            <div className="settings-system-row">
              <span className="settings-system-label">Model</span>
              <span className="settings-system-value">Gemini 1.5 Flash</span>
            </div>
            <div className="settings-system-row">
              <span className="settings-system-label">Version</span>
              <span className="settings-system-value">1.0.0</span>
            </div>
            <div className="settings-system-row">
              <span className="settings-system-label">Environment</span>
              <span className="settings-system-value">{import.meta.env.MODE}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
