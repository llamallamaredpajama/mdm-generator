import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../lib/firebase'
import { whoAmI } from '../lib/api'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phiAttested, setPhiAttested] = useState(false)
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      const timer = setTimeout(() => dialogRef.current?.focus(), 0)
      return () => clearTimeout(timer)
    } else {
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
      setError(null)
      setLoading(false)
      setPhiAttested(false)
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    },
    [onClose],
  )

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithGoogle()
      if (result) {
        const token = await result.user.getIdToken()
        const info = await whoAmI(token)
        onClose()
        navigate(info.onboardingCompleted ? '/compose' : '/onboarding')
      }
      // result is undefined when user cancelled — just reset loading
    } catch (err: unknown) {
      const authError = err as { code?: string }
      setError(
        authError.code === 'auth/popup-blocked'
          ? 'Popup blocked. Please allow popups for this site.'
          : 'Sign in failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal__overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="auth-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>

        <div className="auth-modal__brand">
          <span className="auth-modal__brand-ai">ai</span>MDM
          <span className="auth-modal__brand-dot">.</span>
        </div>
        <div className="auth-modal__accent-bar" />
        <p className="auth-modal__subtitle" id="auth-modal-title">
          Sign in with your Google account to continue
        </p>

        <label className="auth-modal__attestation">
          <input
            type="checkbox"
            checked={phiAttested}
            onChange={(e) => setPhiAttested(e.target.checked)}
          />
          <span>
            I attest that no Protected Health Information (PHI) will be used in this application
          </span>
        </label>

        <button
          className={`auth-modal__google-btn${phiAttested && !loading ? ' auth-modal__google-btn--active' : ''}`}
          onClick={handleGoogleSignIn}
          disabled={loading || !phiAttested}
        >
          {loading ? (
            <span className="auth-modal__spinner" />
          ) : (
            <svg className="auth-modal__google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <div className="auth-modal__error" role="alert">
            {error}
          </div>
        )}

        <p className="auth-modal__footer">Educational use only. No patient data stored.</p>
      </div>
    </div>
  )
}
