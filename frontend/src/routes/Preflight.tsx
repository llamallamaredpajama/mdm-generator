import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthToken } from '../lib/firebase'
import { generateMDM } from '../lib/api'
import './Preflight.css'

export default function Preflight() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { text?: string; skipConfirmation?: boolean } }
  const text = location.state?.text ?? ''
  const skipConfirmation = location.state?.skipConfirmation ?? false
  const [ackPHI, setAckPHI] = useState(skipConfirmation)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idToken = useAuthToken()

  useEffect(() => {
    if ((ackPHI || skipConfirmation) && idToken && !loading && !error) {
      onGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ackPHI, skipConfirmation, idToken])

  const onGenerate = async () => {
    if (!idToken) {
      setError('Please sign in')
      return
    }
    if (!ackPHI) return

    setLoading(true)
    setError(null)

    try {
      const resp = await generateMDM({ narrative: text, userIdToken: idToken })
      navigate('/output', { state: { text, draft: resp.draft } })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      const errorMessage = err?.response?.data?.error || err?.message || 'Generation failed'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <section className="preflight-page">
      {!skipConfirmation && <h1 className="preflight-title">Safety Confirmation</h1>}

      {/* Confirmation Card */}
      {!loading && !error && !skipConfirmation && (
        <div className="preflight-warning-card">
          <div className="preflight-warning-header">
            <svg className="preflight-warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2 className="preflight-warning-title">Important</h2>
          </div>

          <p className="preflight-warning-text">
            This tool is for <strong>educational purposes only</strong>. Never enter real patient
            information or protected health information (PHI).
          </p>

          <label className="preflight-checkbox-label">
            <input
              type="checkbox"
              className="preflight-checkbox"
              checked={ackPHI}
              onChange={(e) => setAckPHI(e.target.checked)}
            />
            <span className="preflight-checkbox-text">
              I confirm that NO protected health information (PHI) or real patient data is being submitted
            </span>
          </label>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="preflight-loading">
          <div className="preflight-spinner" />
          <h2 className="preflight-loading-title">Generating MDM</h2>
          <p className="preflight-loading-subtitle">
            Analyzing your encounter narrative...
          </p>
          <div className="preflight-loading-progress">
            <span className="preflight-loading-dot" />
            <span className="preflight-loading-dot" />
            <span className="preflight-loading-dot" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="preflight-error">
          <div className="preflight-error-header">
            <svg className="preflight-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h3 className="preflight-error-title">Error</h3>
          </div>
          <p className="preflight-error-message">{error}</p>
          <button
            className="preflight-btn preflight-btn--primary"
            onClick={() => {
              setError(null)
              setAckPHI(false)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
        </div>
      )}

      {/* Back Button */}
      {!skipConfirmation && (
        <div className="preflight-actions">
          <button
            className="preflight-btn preflight-btn--secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>
      )}
    </section>
  )
}
