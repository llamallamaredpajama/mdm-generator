import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DictationGuide from '../components/DictationGuide'
import Checklist from '../components/Checklist'
import SubscriptionStatus from '../components/SubscriptionStatus'
import { whoAmI } from '../lib/api'
import { useAuthToken } from '../lib/firebase'

export default function Compose() {
  const [text, setText] = useState('')
  const [confirmedNoPHI, setConfirmedNoPHI] = useState(false)
  const [confirmedGuide, setConfirmedGuide] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const idToken = useAuthToken()

  useEffect(() => {
    const run = async () => {
      if (!idToken) return
      setLoading(true)
      try {
        const res = await whoAmI(idToken)
        setRemaining(res.remaining)
        setPlan(res.plan)
      } catch {
        setRemaining(null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [idToken])

  const ready = confirmedNoPHI && confirmedGuide && text.trim().length > 0 && (remaining ?? 1) > 0


  return (
    <section 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr minmax(280px, 360px)', 
        gap: '2rem', 
        maxWidth: '1600px', 
        margin: '0 auto', 
        width: '100%' 
      }}
      className="compose-grid">
      <div>
        <h2>Compose encounter narrative</h2>
        <SubscriptionStatus />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dictate or type your encounter narrative here. Do not include PHI."
          rows={20}
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            disabled={!ready}
            title={(remaining ?? 1) > 0 ? '' : 'No remaining quota this month'}
            onClick={() => navigate('/preflight', { state: { text } })}
          >
            Preflight
          </button>
        </div>
      </div>
      <aside>
        <DictationGuide />
        <Checklist
          confirmedNoPHI={confirmedNoPHI}
          onToggleNoPHI={() => setConfirmedNoPHI((v) => !v)}
          confirmedGuide={confirmedGuide}
          onToggleGuide={() => setConfirmedGuide((v) => !v)}
        />
      </aside>
    </section>
  )
}

