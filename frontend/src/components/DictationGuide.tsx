import './DictationGuide.css'

const guideItems = [
  'Chief complaint and context',
  'Worst-first consideration and red flags',
  'Differential diagnoses (most dangerous first)',
  'Data reviewed/ordered (labs, imaging, consults)',
  'Clinical decision making and risk assessment',
  'Disposition and follow-up plan',
]

export default function DictationGuide() {
  return (
    <div className="dictation-guide">
      <div className="dictation-guide__header">
        <svg className="dictation-guide__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h3 className="dictation-guide__title">Dictation Guide</h3>
      </div>

      <p className="dictation-guide__description">
        Ensure your narrative includes these elements for a complete MDM.
        See <code>docs/mdm-gen-guide.md</code> for detailed guidance.
      </p>

      <ul className="dictation-guide__list">
        {guideItems.map((item, index) => (
          <li key={index} className="dictation-guide__item">
            <span className="dictation-guide__bullet" />
            <span className="dictation-guide__item-text">{item}</span>
          </li>
        ))}
      </ul>

      <div className="dictation-guide__divider" />

      <div className="dictation-guide__tip">
        <svg className="dictation-guide__tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="dictation-guide__tip-text">
          <strong>Tip:</strong> Start with the most critical findings. The AI prioritizes
          worst-first differential diagnosis approach typical of Emergency Medicine.
        </p>
      </div>
    </div>
  )
}
