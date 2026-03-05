import type { WizardData } from '../../routes/Onboarding'

interface StepLimitationsProps {
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
}

const LIMITATIONS = [
  {
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z',
    text: 'This is an educational tool. All outputs require physician review before clinical use.',
  },
  {
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    text: 'No Protected Health Information (PHI) should ever be entered into this application.',
  },
  {
    icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
    text: 'No medical content is stored long-term. Content exists only during your active session.',
  },
  {
    icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342',
    text: 'Physician attestation is included in every generated MDM document.',
  },
]

export default function StepLimitations({ data, updateData }: StepLimitationsProps) {
  return (
    <div>
      <h2 className="ob-step__title">Before We Begin</h2>
      <p className="ob-step__subtitle">
        Please review the following important information about this tool.
      </p>

      <ul className="ob-limitations__list">
        {LIMITATIONS.map((item, idx) => (
          <li key={idx} className="ob-limitations__item">
            <svg
              className="ob-limitations__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <label className="ob-limitations__checkbox">
        <input
          type="checkbox"
          checked={data.acknowledged}
          onChange={(e) => updateData({ acknowledged: e.target.checked })}
        />
        <span>I understand and acknowledge these limitations</span>
      </label>
    </div>
  )
}
