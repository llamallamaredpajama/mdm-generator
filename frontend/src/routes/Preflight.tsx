import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthToken } from '../lib/firebase'
import { generateMDM } from '../lib/api'

export default function Preflight() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { text?: string } }
  const text = location.state?.text ?? ''
  const [ackPHI, setAckPHI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idToken = useAuthToken()

  // Auto-submit when PHI is acknowledged
  useEffect(() => {
    if (ackPHI && idToken && !loading) {
      onGenerate()
    }
  }, [ackPHI])

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
    } catch (e: any) {
      const errorMessage = e?.response?.data?.error || e?.message || 'Generation failed'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <section style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Safety Confirmation</h2>
      
      {!loading && !error && (
        <div style={{ 
          background: '#f8f9fa', 
          border: '2px solid #dc3545', 
          borderRadius: '8px', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Important</h3>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            This tool is for educational purposes only. Never enter real patient information.
          </p>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 500
          }}>
            <input 
              type="checkbox" 
              checked={ackPHI} 
              onChange={(e) => setAckPHI(e.target.checked)}
              style={{ 
                marginRight: '0.75rem', 
                marginTop: '0.25rem',
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
            <span>
              I confirm that NO protected health information (PHI) or real patient data is being submitted
            </span>
          </label>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Processing...</div>
          <div style={{ color: '#666' }}>Generating your MDM documentation</div>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #c00', 
          borderRadius: '8px', 
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#c00', marginBottom: '0.5rem' }}>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null)
              setAckPHI(false)
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button 
          onClick={() => navigate(-1)}
          disabled={loading}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Back
        </button>
      </div>
    </section>
  )
}

