const PLANS = [
  {
    name: 'Free',
    price: '$0/month',
    features: ['10 MDMs/month', 'Basic features', 'Email support'],
    isActive: true,
  },
  {
    name: 'Pro',
    price: '$49/month',
    features: ['250 MDMs/month', 'Priority processing', 'Export formats', 'Priority support'],
    isActive: false,
  },
  {
    name: 'Enterprise',
    price: '$199/month',
    features: [
      '1000 MDMs/month',
      'Fastest processing',
      'API access',
      'Team features',
      'Dedicated support',
    ],
    isActive: false,
  },
]

export default function StepPlanSelection() {
  return (
    <div>
      <h2 className="ob-step__title">Choose Your Plan</h2>
      <p className="ob-step__subtitle">
        You're starting on the Free plan. You can upgrade anytime from Settings.
      </p>

      <div className="ob-plans__grid">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`ob-plan-card${plan.isActive ? ' ob-plan-card--active' : ''}`}
          >
            <div className="ob-plan-card__name">{plan.name}</div>
            <div className="ob-plan-card__price">{plan.price}</div>
            <ul className="ob-plan-card__features">
              {plan.features.map((feature, fIdx) => (
                <li key={fIdx} className="ob-plan-card__feature">
                  {feature}
                </li>
              ))}
            </ul>
            {plan.isActive ? (
              <div className="ob-plan-card__badge ob-plan-card__badge--selected">Selected</div>
            ) : (
              <div className="ob-plan-card__badge ob-plan-card__badge--upgrade">
                Upgrade in Settings
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
