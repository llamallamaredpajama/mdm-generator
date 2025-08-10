import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthToken } from '../lib/firebase'
import { generateMDM, whoAmI } from '../lib/api'

export default function Preflight() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { text?: string } }
  const text = location.state?.text ?? ''
  const tokenEstimate = Math.ceil(text.length / 4)
  const [ackPHI, setAckPHI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const idToken = useAuthToken()

  useEffect(() => {
    const run = async () => {
      if (!idToken) {
        console.log('No ID token available yet')
        return
      }
      console.log('ID token available, calling whoAmI')
      try {
        const res = await whoAmI(idToken)
        console.log('whoAmI response:', res)
        setRemaining(res.remaining)
        setPlan(res.plan)
      } catch (error) {
        console.error('whoAmI error:', error)
        setRemaining(null)
      }
    }
    run()
  }, [idToken])

  const onGenerate = async () => {
    if (!idToken) return alert('Please sign in')
    if (!ackPHI) return alert('Please acknowledge the PHI warning')
    if (tokenEstimate > 10000) return alert('Input too large for plan limits (10,000 tokens)')
    if ((remaining ?? 0) <= 0) return alert('No remaining quota this month')
    setLoading(true)
    try {
      const resp = await generateMDM({ narrative: text, userIdToken: idToken })
      navigate('/output', { state: { text, draft: resp.draft } })
    } catch (e) {
      alert('Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2>Preflight checks</h2>
      <div style={{ marginBottom: '0.5rem', color: (remaining ?? 1) > 0 ? '#333' : '#b00' }}>
        {remaining == null ? 'Quota: unavailable' : `Remaining this month: ${remaining} ${plan ? `(${plan})` : ''}`}
      </div>
      <ul>
        <li>No PHI included: <label><input type="checkbox" checked={ackPHI} onChange={() => setAckPHI(v => !v)} /> I acknowledge PHI must not be entered.</label></li>
        <li>Checklist reviewed: confirmed</li>
        <li>Input size: ~{tokenEstimate.toLocaleString()} tokens (limit 10,000)</li>
        <li>Subscription check: {remaining == null ? 'unknown' : (remaining > 0 ? 'ok' : 'exhausted')}</li>
      </ul>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => navigate(-1)}>Back</button>
        <button disabled={loading || (remaining ?? 0) <= 0} title={(remaining ?? 0) <= 0 ? 'No remaining quota' : ''} onClick={onGenerate}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
    </section>
  )
}

