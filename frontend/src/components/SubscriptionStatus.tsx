import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthToken } from '../lib/firebase'
import { whoAmI } from '../lib/api'
import './SubscriptionStatus.css'

interface SubscriptionData {
  plan: 'free' | 'pro' | 'enterprise'
  used: number
  limit: number
  remaining: number
  percentUsed: number
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const idToken = useAuthToken()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!idToken) {
        setLoading(false)
        return
      }

      try {
        const response = await whoAmI(idToken)
        setSubscription({
          plan: response.plan || 'free',
          used: response.used || 0,
          limit: response.limit || 10,
          remaining: response.remaining || 10,
          percentUsed: response.percentUsed || 0
        })
        setError(false)
      } catch (error) {
        console.error('Failed to fetch subscription data:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [idToken])

  if (loading) {
    return (
      <div className="subscription-status">
        <div style={{ color: '#999', fontSize: '0.875rem' }}>Loading subscription...</div>
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="subscription-status">
        <div style={{ color: '#dc3545', fontSize: '0.875rem' }}>Unable to load subscription</div>
      </div>
    )
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return '#ffd700'
      case 'pro': return '#dc3545'
      case 'free': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getUsageColor = (percentUsed: number) => {
    if (percentUsed >= 90) return '#dc3545'
    if (percentUsed >= 75) return '#ffc107'
    return '#28a745'
  }

  return (
    <div className="subscription-status">
      <div className="subscription-badge" style={{ borderColor: getPlanColor(subscription.plan) }}>
        <span className="plan-name" style={{ color: getPlanColor(subscription.plan) }}>
          {subscription.plan.toUpperCase()}
        </span>
      </div>
      
      <div className="usage-info">
        <div className="usage-text">
          <span className="usage-label">Monthly Usage:</span>
          <span className="usage-numbers">
            {subscription.used} / {subscription.limit}
          </span>
        </div>
        
        <div className="usage-bar-container">
          <div 
            className="usage-bar-fill" 
            style={{ 
              width: `${Math.min(subscription.percentUsed, 100)}%`,
              backgroundColor: getUsageColor(subscription.percentUsed)
            }}
          />
        </div>
        
        {subscription.percentUsed >= 90 && (
          <div className="usage-warning">
            ⚠️ {subscription.remaining} requests remaining
          </div>
        )}
      </div>

      {subscription.plan === 'free' && (
        <button 
          className="upgrade-button"
          onClick={() => navigate('/settings')}
        >
          Upgrade to Pro
        </button>
      )}
    </div>
  )
}