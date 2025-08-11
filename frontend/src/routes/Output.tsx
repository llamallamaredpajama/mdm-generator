import { useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Output() {
  const location = useLocation() as { state?: { text?: string; draft?: string; draftJson?: any } }
  const text = location.state?.text ?? ''
  const [tab, setTab] = useState<'text' | 'json'>('text')
  const mdmDraft = location.state?.draft ?? `MDM (Draft)\n\n- Differential: ...\n- Data reviewed/ordered: ...\n- Decision making: ...\n- Risk: ...\n\nNotes:\nThis is an educational draft only. Review carefully. Copy at your own risk.`
  const mdmJson = location.state?.draftJson

  const copy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      alert('Copied to clipboard')
    } catch (e) {
      alert('Copy failed')
    }
  }

  return (
    <section>
      <h2>Generated MDM</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button onClick={() => setTab('text')} disabled={tab === 'text'}>Text</button>
        <button onClick={() => setTab('json')} disabled={tab === 'json'}>JSON</button>
      </div>
      {tab === 'text' ? (
        <div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', background: '#2d2d2d' }}>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#f0f0f0', margin: 0 }}>{mdmDraft}</pre>
          </div>
          <button onClick={() => copy(mdmDraft)} style={{ marginTop: '0.5rem' }}>Copy text</button>
        </div>
      ) : (
        <div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', background: '#2d2d2d' }}>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#f0f0f0', margin: 0 }}>{JSON.stringify(mdmJson ?? {}, null, 2)}</pre>
          </div>
          <button onClick={() => copy(JSON.stringify(mdmJson ?? {}, null, 2))} style={{ marginTop: '0.5rem' }}>Copy JSON</button>
        </div>
      )}

      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: '#fff3cd', 
        border: '1px solid #ffc107', 
        borderRadius: '4px' 
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          <strong>⚠️ Important:</strong> The patient narrative and MDM generated will not be saved online. 
          You are responsible for copy-pasting and saving this information if desired.
        </p>
      </div>

      <details style={{ marginTop: '1rem' }}>
        <summary>Original narrative</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      </details>
    </section>
  )
}