import './DictationGuide.css'

const guideSections = [
  {
    title: 'Chief Complaint & Context',
    items: ['Age & sex', 'Chief complaint', 'Context / HPI'],
  },
  {
    title: 'Problems Considered',
    items: ['Emergent conditions', 'Non-emergent conditions'],
  },
  {
    title: 'Data Reviewed/Ordered',
    items: ['Labs', 'Imaging', 'EKG', 'External records', 'Independent historian'],
  },
  {
    title: 'Risk Assessment',
    items: ['Highest risk element', 'Patient factors', 'Diagnostic risks', 'Treatment risks', 'Disposition risks'],
  },
  {
    title: 'Clinical Reasoning',
    items: ['Evaluation approach', 'Key decision points', 'Working diagnosis'],
  },
  {
    title: 'Treatment & Procedures',
    items: ['Medications administered', 'Procedures performed', 'Treatment rationale'],
  },
  {
    title: 'Disposition',
    items: ['Decision & level of care', 'Rationale', 'Discharge instructions', 'Follow-up', 'Return precautions'],
  },
]

export default function DictationGuide() {
  return (
    <div className="dictation-guide">
      <div className="dictation-guide__header">
        <h3 className="dictation-guide__title">Dictation Guide</h3>
      </div>

      <p className="dictation-guide__description">
        Ensure your narrative includes these elements for a complete MDM.
      </p>

      <div className="dictation-guide__sections">
        {guideSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="dictation-guide__section">
            <h4 className="dictation-guide__section-title">{section.title}</h4>
            <ul className="dictation-guide__list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="dictation-guide__item">
                  <span className="dictation-guide__bullet" />
                  <span className="dictation-guide__item-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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

      <p className="dictation-guide__footnote">
        See <code>docs/mdm-gen-guide.md</code> for detailed guidance.
      </p>
    </div>
  )
}
