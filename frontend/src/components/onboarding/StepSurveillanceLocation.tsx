import type { WizardData } from '../../routes/Onboarding'

interface StepSurveillanceLocationProps {
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
}

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
]

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
}

export default function StepSurveillanceLocation({
  data,
  updateData,
}: StepSurveillanceLocationProps) {
  const loc = data.surveillanceLocation

  const handleStateChange = (state: string) => {
    if (!state) {
      // If ZIP is also empty, clear the whole object
      if (!loc?.zipCode) {
        updateData({ surveillanceLocation: null })
      } else {
        updateData({ surveillanceLocation: { zipCode: loc.zipCode } })
      }
    } else {
      updateData({ surveillanceLocation: { ...loc, state } })
    }
  }

  const handleZipChange = (zipCode: string) => {
    // Only allow digits, max 5
    const cleaned = zipCode.replace(/\D/g, '').slice(0, 5)
    if (!cleaned && !loc?.state) {
      updateData({ surveillanceLocation: null })
    } else {
      updateData({ surveillanceLocation: { ...loc, zipCode: cleaned || undefined } })
    }
  }

  return (
    <div>
      <h2 className="ob-step__title">Surveillance Location</h2>
      <p className="ob-step__subtitle">
        Enable CDC trend analysis by setting your practice location. This enriches your MDM with
        regional epidemiological data.
      </p>

      <div className="ob-location__fields">
        <div className="ob-location__field">
          <label className="ob-credentials__label" htmlFor="ob-state">
            State
          </label>
          <select
            id="ob-state"
            className="ob-location__select"
            value={loc?.state ?? ''}
            onChange={(e) => handleStateChange(e.target.value)}
          >
            <option value="">Select state</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>
                {STATE_NAMES[st]} ({st})
              </option>
            ))}
          </select>
        </div>

        <div className="ob-location__field">
          <label className="ob-credentials__label" htmlFor="ob-zip">
            ZIP Code
          </label>
          <input
            id="ob-zip"
            className="ob-credentials__input"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={loc?.zipCode ?? ''}
            onChange={(e) => handleZipChange(e.target.value)}
            placeholder="e.g. 90210"
          />
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
        You can change this anytime in Settings.
      </p>
    </div>
  )
}
