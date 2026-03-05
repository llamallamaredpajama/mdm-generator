import type { WizardData } from '../../routes/Onboarding'

interface StepCredentialsProps {
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
}

const CREDENTIAL_TYPES = ['MD', 'DO', 'NP', 'PA'] as const

export default function StepCredentials({ data, updateData }: StepCredentialsProps) {
  return (
    <div>
      <h2 className="ob-step__title">Your Credentials</h2>
      <p className="ob-step__subtitle">
        This information is used for the digital attestation on your MDM documents.
      </p>

      <div className="ob-credentials__field">
        <label className="ob-credentials__label" htmlFor="ob-display-name">
          Display Name
        </label>
        <input
          id="ob-display-name"
          className="ob-credentials__input"
          type="text"
          value={data.displayName}
          onChange={(e) => updateData({ displayName: e.target.value })}
          placeholder="Dr. Jane Smith"
          maxLength={100}
          autoComplete="name"
        />
      </div>

      <div className="ob-credentials__field">
        <span className="ob-credentials__label">Credential Type</span>
        <div className="ob-credentials__pills" role="radiogroup" aria-label="Credential type">
          {CREDENTIAL_TYPES.map((type) => (
            <button
              key={type}
              className={`ob-credentials__pill${data.credentialType === type ? ' ob-credentials__pill--selected' : ''}`}
              onClick={() => updateData({ credentialType: type })}
              type="button"
              role="radio"
              aria-checked={data.credentialType === type}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
