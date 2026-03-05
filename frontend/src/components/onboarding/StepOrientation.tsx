import QuickComposeDemo from './QuickComposeDemo'

export default function StepOrientation() {
  return (
    <div>
      <h2 className="ob-step__title">How It Works</h2>
      <p className="ob-step__subtitle">
        Two workflows for generating Medical Decision Making documentation.
      </p>

      <div className="ob-orientation__cards">
        <div className="ob-mode-card">
          <div className="ob-mode-card__icon" aria-hidden="true">
            &#9889;
          </div>
          <div className="ob-mode-card__title">Quick Compose</div>
          <div className="ob-mode-card__desc">
            Paste your narrative, get a complete MDM in seconds. Best for straightforward cases.
          </div>
        </div>
        <div className="ob-mode-card">
          <div className="ob-mode-card__icon" aria-hidden="true">
            &#9638;&#9638;
          </div>
          <div className="ob-mode-card__title">Build Mode</div>
          <div className="ob-mode-card__desc">
            Step-by-step workflow with differential diagnosis, workup tracking, and CDR integration.
          </div>
        </div>
      </div>

      <div className="ob-orientation__demo-label">Quick Compose Preview</div>
      <QuickComposeDemo />
    </div>
  )
}
