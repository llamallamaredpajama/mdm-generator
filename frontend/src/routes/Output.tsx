import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import './Output.css'

export default function Output() {
  const location = useLocation() as { state?: { text?: string; draft?: string; draftJson?: Record<string, unknown> } }
  const navigate = useNavigate()
  const { success, error } = useToast()
  const text = location.state?.text ?? ''
  const [tab, setTab] = useState<'text' | 'json'>('text')
  const mdmDraft = location.state?.draft ?? `MDM (Draft)\n\n- Differential: ...\n- Data reviewed/ordered: ...\n- Decision making: ...\n- Risk: ...\n\nNotes:\nThis is an educational draft only. Review carefully. Copy at your own risk.`
  const mdmJson = location.state?.draftJson

  const copy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      success('Copied to clipboard!')
    } catch {
      error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="output-page">
      <header className="output-header">
        <h1 className="output-title">Generated MDM</h1>
        <p className="output-subtitle">
          Review and copy your Medical Decision Making documentation
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="output-tabs">
        <button
          className={`output-tab ${tab === 'text' ? 'output-tab--active' : ''}`}
          onClick={() => setTab('text')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Text
        </button>
        <button
          className={`output-tab ${tab === 'json' ? 'output-tab--active' : ''}`}
          onClick={() => setTab('json')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          JSON
        </button>
      </div>

      {/* Content Display */}
      <div className="output-code-container">
        <div className="output-code">
          <pre>
            {tab === 'text' ? mdmDraft : JSON.stringify(mdmJson ?? {}, null, 2)}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="output-actions">
        <button
          className="output-btn output-btn--primary"
          onClick={() => copy(tab === 'text' ? mdmDraft : JSON.stringify(mdmJson ?? {}, null, 2))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy {tab === 'text' ? 'Text' : 'JSON'}
        </button>

        <button
          className="output-btn output-btn--secondary"
          onClick={() => navigate('/compose')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          New Generation
        </button>
      </div>

      {/* Warning Notice */}
      <div className="output-notice">
        <svg className="output-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="output-notice-text">
          <strong>Important:</strong> The patient narrative and MDM generated will not be saved online.
          You are responsible for copy-pasting and saving this information if desired.
          This is for <strong>educational purposes only</strong>.
        </p>
      </div>

      {/* Original Narrative */}
      {text && (
        <details className="output-collapsible">
          <summary>Original Narrative</summary>
          <div className="output-collapsible-content">
            <pre>{text}</pre>
          </div>
        </details>
      )}
    </div>
  )
}
