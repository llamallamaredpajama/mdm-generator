import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DictationGuide from '../components/DictationGuide'
import ConfirmationModal from '../components/ConfirmationModal'
import { whoAmI } from '../lib/api'
import { useAuthToken } from '../lib/firebase'

export default function Compose() {
  const [text, setText] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const idToken = useAuthToken()

  useEffect(() => {
    const run = async () => {
      if (!idToken) return
      try {
        const res = await whoAmI(idToken)
        setRemaining(res.remaining)
      } catch {
        setRemaining(null)
      }
    }
    run()
  }, [idToken])

  const canSubmit = text.trim().length > 0 && (remaining ?? 1) > 0

  const handleSubmitClick = () => {
    if (canSubmit) {
      setShowModal(true)
    }
  }

  const handleConfirmSubmit = () => {
    setShowModal(false)
    // Skip preflight since we already confirmed PHI, go directly to generate
    navigate('/preflight', { state: { text, skipConfirmation: true } })
  }

  return (
    <>
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
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dictate or type your encounter narrative here. Do not include PHI."
            rows={20}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={!canSubmit}
              title={(remaining ?? 1) > 0 ? '' : 'No remaining quota this month'}
              onClick={handleSubmitClick}
            >
              Submit
            </button>
          </div>
        </div>
        <aside>
          <DictationGuide />
        </aside>
      </section>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        text={text}
      />
    </>
  )
}

