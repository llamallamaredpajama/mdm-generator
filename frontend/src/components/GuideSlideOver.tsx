import { useEffect, useRef } from 'react'
import './GuideSlideOver.css'

interface GuideSlideOverProps {
  isOpen: boolean
  onClose: () => void
}

export default function GuideSlideOver({ isOpen, onClose }: GuideSlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Trap focus within panel when open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus()
    }
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`guide-slideover__backdrop ${isOpen ? 'guide-slideover__backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`guide-slideover ${isOpen ? 'guide-slideover--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        tabIndex={-1}
      >
        {/* Header */}
        <header className="guide-slideover__header">
          <h2 id="guide-title" className="guide-slideover__title">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10.8" fill="currentColor" opacity="0.15" />
              <circle cx="12" cy="12" r="10.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="7.2" r="1.44" />
              <rect x="10.56" y="10.2" width="2.88" height="7.2" rx="1.2" />
            </svg>
            Build Mode
          </h2>
          <button
            type="button"
            className="guide-slideover__close"
            onClick={onClose}
            aria-label="Close guide"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="guide-slideover__content">
          {/* Introduction */}
          <section className="guide-section">
            <p className="guide-intro">
              The MDM Generator uses <strong>EM-specific training</strong> to document the
              "hidden" clinical logic physicians instinctively use but rarely type out.
              Choose your input mode based on case complexity and your documentation needs.
            </p>
          </section>

          {/* Build Mode */}
          <section className="guide-section">
            <div className="guide-mode guide-mode--build">
              <div className="guide-mode__header">
                <span className="guide-mode__badge guide-mode__badge--build">ON</span>
              </div>
              <p className="guide-mode__description">
                Best for <strong>complex cases</strong> requiring high-complexity billing
                documentation or clinical defense. The blueprint form exposes all MDM parameters.
              </p>
              <ul className="guide-mode__list">
                <li>Structured fields spark recall of important details</li>
                <li>Guided walk-through of all MDM areas</li>
                <li>Ensures comprehensive documentation</li>
                <li>Supports worst-first differential approach</li>
              </ul>
              <div className="guide-mode__tip">
                <strong>Best for:</strong> Chest pain, AMS, polytrauma, sepsis workups,
                diagnostic dilemmas, high-risk dispositions
              </div>
            </div>
          </section>

          {/* Simple Mode */}
          <section className="guide-section">
            <div className="guide-mode guide-mode--simple">
              <div className="guide-mode__header">
                <span className="guide-mode__badge guide-mode__badge--simple">OFF</span>
              </div>
              <p className="guide-mode__description">
                Best for <strong>fast, low-acuity cases</strong> or when you can confidently
                report the encounter in a free-flow style capturing most important details.
              </p>
              <ul className="guide-mode__list">
                <li>Tell the story naturally using your narrative style</li>
                <li>Include HPI, ROS, PE, Differential, Workup, and Plan</li>
                <li>The AI handles extraction and organization</li>
                <li>Ideal for straightforward presentations</li>
              </ul>
              <div className="guide-mode__tip">
                <strong>Best for:</strong> Simple lacerations, minor injuries, stable chronic conditions,
                clear-cut presentations
              </div>
            </div>
          </section>

          {/* Worst-First Approach */}
          <section className="guide-section">
            <h3 className="guide-section__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Worst-First Mentality
            </h3>
            <p className="guide-section__text">
              Emergency Medicine documentation prioritizes life-threatening conditions first.
              The AI is trained to generate broad but accurate differential diagnoses with
              this "worst-first" approach, rather than "most likely" lists.
            </p>
          </section>

          {/* MDM Complexity */}
          <section className="guide-section">
            <h3 className="guide-section__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              MDM Complexity Drivers
            </h3>
            <ul className="guide-section__list">
              <li><strong>Number of diagnoses</strong> — emergent and non-emergent conditions considered</li>
              <li><strong>Data reviewed</strong> — labs, imaging, EKG, external records</li>
              <li><strong>Risk stratification</strong> — clinical decision rules applied</li>
              <li><strong>Management complexity</strong> — treatment decisions and disposition planning</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
