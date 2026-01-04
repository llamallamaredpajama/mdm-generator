import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DictationGuide from '../components/DictationGuide'
import ConfirmationModal from '../components/ConfirmationModal'
import { whoAmI } from '../lib/api'
import { useAuthToken } from '../lib/firebase'
import './Compose.css'

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
    navigate('/preflight', { state: { text, skipConfirmation: true } })
  }

  const getQuotaStatus = () => {
    if (remaining === null) return null
    if (remaining === 0) return 'danger'
    if (remaining <= 3) return 'warning'
    return null
  }

  const quotaStatus = getQuotaStatus()

  return (
    <>
      <div className="compose-page">
        <header className="compose-header">
          <h1 className="compose-title">Encounter Narrative</h1>
        </header>

        <div className="compose-grid">
          <div className="compose-editor">
            <textarea
              className="compose-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start your encounter narrative here...

Example: 45-year-old male presents with chest pain x 2 hours. Pain is substernal, radiating to left arm, associated with diaphoresis. History of HTN, DM. Currently taking metformin and lisinopril..."
              rows={20}
            />

            <div className="compose-actions">
              <button
                className="compose-submit"
                disabled={!canSubmit}
                title={remaining === 0 ? 'No remaining quota this month' : ''}
                onClick={handleSubmitClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Generate MDM
              </button>

              {remaining !== null && (
                <span className={`compose-quota ${quotaStatus ? `compose-quota--${quotaStatus}` : ''}`}>
                  <svg className="compose-quota-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {remaining} generations remaining
                </span>
              )}

              <span className="compose-char-count">
                {text.length.toLocaleString()} characters
              </span>
            </div>
          </div>

          <aside>
            <DictationGuide />
          </aside>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        text={text}
      />
    </>
  )
}
