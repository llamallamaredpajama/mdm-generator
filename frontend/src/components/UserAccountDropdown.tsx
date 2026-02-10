import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, signOutUser, useAuthToken } from '../lib/firebase'
import { whoAmI } from '../lib/api'
import './UserAccountDropdown.css'

interface AccountInfo {
  plan: 'free' | 'pro' | 'enterprise'
  used: number
  limit: number
  remaining: number
}

interface UserAccountDropdownProps {
  iconOnly?: boolean
}

export default function UserAccountDropdown({ iconOnly }: UserAccountDropdownProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const idToken = useAuthToken()
  const [isOpen, setIsOpen] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!idToken) return
      try {
        const response = await whoAmI(idToken)
        setAccountInfo({
          plan: response.plan || 'free',
          used: response.used || 0,
          limit: response.limit || 10,
          remaining: response.remaining || 10
        })
      } catch (error) {
        console.error('Failed to fetch account info:', error)
      }
    }
    fetchAccountInfo()
  }, [idToken])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOutUser()
  }

  const handleNavigateToSettings = () => {
    setIsOpen(false)
    navigate('/settings')
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return '#ffd700'
      case 'pro': return '#dc3545'
      default: return '#6c757d'
    }
  }

  if (!user) return null

  return (
    <div className="user-account-dropdown" ref={dropdownRef}>
      <button
        className={`user-email-button${iconOnly ? ' user-email-button--icon-only' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={iconOnly ? 'Account menu' : undefined}
      >
        <svg className="user-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        {!iconOnly && <span className="user-email-text">{user.email}</span>}
        {!iconOnly && (
          <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="currentColor" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {accountInfo && (
            <>
              <div className="dropdown-section">
                <div className="account-status">
                  <span className="status-label">Account Status</span>
                  <span 
                    className="plan-badge" 
                    style={{ color: getPlanBadgeColor(accountInfo.plan) }}
                  >
                    {accountInfo.plan.toUpperCase()}
                  </span>
                </div>
                <div className="usage-summary">
                  <span className="usage-label">Monthly Usage</span>
                  <span className="usage-count">
                    {accountInfo.used} / {accountInfo.limit} requests
                  </span>
                </div>
                {accountInfo.plan === 'free' && accountInfo.remaining <= 3 && (
                  <div className="usage-alert">
                    ⚠️ Only {accountInfo.remaining} requests remaining
                  </div>
                )}
              </div>
              
              <div className="dropdown-divider"></div>
            </>
          )}

          <button 
            className="dropdown-item"
            onClick={handleNavigateToSettings}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span>Manage Subscription</span>
            {accountInfo?.plan === 'free' && (
              <span className="upgrade-hint">Upgrade</span>
            )}
          </button>

          <button 
            className="dropdown-item"
            onClick={handleSignOut}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}