/**
 * QuickComposeDemo - CSS-animated demo of the Quick Compose workflow
 * Auto-plays once (~7s). Respects prefers-reduced-motion (static state).
 */
export default function QuickComposeDemo() {
  return (
    <div className="ob-demo" aria-label="Quick Compose demo animation">
      {/* Step 1: Narrative input with typewriter */}
      <div className="ob-demo__section">
        <div className="ob-demo__label">Narrative</div>
        <div className="ob-demo__narrative">
          45F chest pain, troponin negative, EKG normal sinus, pain reproducible on palpation...
        </div>
      </div>

      {/* Step 2: Generate button */}
      <div className="ob-demo__section">
        <div className="ob-demo__generate-btn">Generate MDM</div>
      </div>

      {/* Step 3: MDM output */}
      <div className="ob-demo__output">
        <div className="ob-demo__section">
          <div className="ob-demo__label">MDM Output</div>
          <div className="ob-demo__output-text">
            Medical Decision Making: High complexity. Problems addressed include acute chest pain
            with differential of ACS, PE, musculoskeletal strain. Data reviewed includes troponin,
            EKG, chest exam...
          </div>
        </div>

        {/* Step 4: Copy button */}
        <div className="ob-demo__copy-btn">Copy MDM</div>
      </div>
    </div>
  )
}
