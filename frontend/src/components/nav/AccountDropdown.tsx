import { useState, useCallback, useRef, useEffect } from 'react'
import {
  SignOut as SignOutIcon,
  Lightning as LightningIcon,
  CreditCard as CreditCardIcon,
} from '@phosphor-icons/react'
import type { User } from 'firebase/auth'
import { signOutUser } from '../../lib/firebase'
import { useSubscription, GENERATION_LIMITS } from '../../hooks/useSubscription'
import { createCustomerPortalSession, createCheckoutSession, getProducts } from '../../lib/stripe'
import './AccountDropdown.css'

function getUserInitials(displayName: string | null | undefined): string {
  if (!displayName) return 'DR'
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

interface AccountDropdownProps {
  user: User | null
}

export default function AccountDropdown({ user }: AccountDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { tier, remainingGenerations } = useSubscription()
  const limit = GENERATION_LIMITS[tier]
  const [billingLoading, setBillingLoading] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  const handleBilling = useCallback(async () => {
    if (!user || billingLoading) return
    setBillingLoading(true)
    try {
      if (tier === 'free') {
        const products = await getProducts()
        const proProduct = products.find((p) => p.name?.toLowerCase().includes('pro'))
        if (proProduct?.prices?.[0]?.id) {
          const url = await createCheckoutSession(user, proProduct.prices[0].id)
          window.location.assign(url)
        }
      } else {
        const url = await createCustomerPortalSession(user)
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      // Stripe redirect failed — dropdown will close naturally
    } finally {
      setBillingLoading(false)
    }
  }, [user, tier, billingLoading])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  const usagePercent =
    remainingGenerations !== null ? Math.max(0, ((limit - remainingGenerations) / limit) * 100) : 0

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'enterprise' ? 'Enterprise' : 'Free'

  return (
    <div className="account-dropdown" ref={dropdownRef}>
      <button type="button" className="account-dropdown__trigger" onClick={toggle}>
        {user.photoURL ? (
          <img
            className="account-dropdown__avatar"
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="account-dropdown__avatar account-dropdown__avatar--initials">
            {getUserInitials(user.displayName)}
          </div>
        )}
      </button>

      {open && (
        <div className="account-dropdown__menu">
          <div className="account-dropdown__user-info">
            <span className="account-dropdown__name">Dr. {user.displayName || 'Physician'}</span>
            <span className={`account-dropdown__badge account-dropdown__badge--${tier}`}>
              {tierLabel}
            </span>
          </div>

          {remainingGenerations !== null && (
            <div className="account-dropdown__quota">
              <div className="account-dropdown__quota-header">
                <span className="account-dropdown__quota-label">Generations</span>
                <span className="account-dropdown__quota-value">
                  {remainingGenerations} / {limit}
                </span>
              </div>
              <div className="account-dropdown__quota-bar">
                <div
                  className="account-dropdown__quota-fill"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}

          <button
            className="account-dropdown__action"
            onClick={handleBilling}
            disabled={billingLoading}
          >
            {tier === 'free' ? (
              <>
                <LightningIcon size={16} weight="bold" />
                {billingLoading ? 'Loading...' : 'Upgrade to Pro'}
              </>
            ) : (
              <>
                <CreditCardIcon size={16} />
                {billingLoading ? 'Loading...' : 'Manage Billing'}
              </>
            )}
          </button>

          <div className="account-dropdown__divider" />

          <button
            type="button"
            className="account-dropdown__action account-dropdown__action--danger"
            onClick={() => signOutUser()}
          >
            <SignOutIcon weight="bold" size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
