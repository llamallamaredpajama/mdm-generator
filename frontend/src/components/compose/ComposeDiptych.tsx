import { useState } from 'react'
import type { EncounterMode } from '../../types/encounter'
import './ComposeDiptych.css'

interface ComposeDiptychProps {
  onCreateEncounter: (mode: EncounterMode) => void
  isCreating: boolean
}

export default function ComposeDiptych({ onCreateEncounter, isCreating }: ComposeDiptychProps) {
  const [activePanel, setActivePanel] = useState<'build' | 'quick' | null>(null)

  const handleClick = (mode: EncounterMode) => {
    if (!isCreating) onCreateEncounter(mode)
  }

  const handleKeyDown = (e: React.KeyboardEvent, mode: EncounterMode) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isCreating) {
      e.preventDefault()
      onCreateEncounter(mode)
    }
  }

  return (
    <section
      className={[
        'diptych',
        activePanel && `diptych--active-${activePanel}`,
        isCreating && 'diptych--disabled',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Choose encounter mode"
      onMouseLeave={() => setActivePanel(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActivePanel(null)
      }}
    >
      <div className="diptych__divider" aria-hidden="true" />

      <div
        className={[
          'diptych__panel diptych__panel--build',
          activePanel === 'build' && 'diptych__panel--expanded',
          activePanel === 'quick' && 'diptych__panel--contracted',
        ]
          .filter(Boolean)
          .join(' ')}
        role="button"
        tabIndex={0}
        aria-label="Build Mode — structured 3-section workflow"
        aria-disabled={isCreating}
        onMouseEnter={() => setActivePanel('build')}
        onFocus={() => setActivePanel('build')}
        onClick={() => handleClick('build')}
        onKeyDown={(e) => handleKeyDown(e, 'build')}
      >
        <div className="diptych__pattern diptych__pattern--hatch" aria-hidden="true" />
        <div className="diptych__content">
          <h2 className="diptych__title">
            Build
            <br />
            Mode
          </h2>
          <p className="diptych__desc">
            Structured 3-section workflow. Guided differential, workup analysis, disposition.
          </p>
          <span className="diptych__cta" aria-hidden="true">
            Begin Build →
          </span>
        </div>
      </div>

      <div
        className={[
          'diptych__panel diptych__panel--quick',
          activePanel === 'quick' && 'diptych__panel--expanded',
          activePanel === 'build' && 'diptych__panel--contracted',
        ]
          .filter(Boolean)
          .join(' ')}
        role="button"
        tabIndex={0}
        aria-label="Quick Mode — single narrative to complete MDM"
        aria-disabled={isCreating}
        onMouseEnter={() => setActivePanel('quick')}
        onFocus={() => setActivePanel('quick')}
        onClick={() => handleClick('quick')}
        onKeyDown={(e) => handleKeyDown(e, 'quick')}
      >
        <div className="diptych__pattern diptych__pattern--speed" aria-hidden="true" />
        <div className="diptych__content">
          <h2 className="diptych__title">
            Quick
            <br />
            Mode
          </h2>
          <p className="diptych__desc">Single narrative. Complete MDM in one pass.</p>
          <span className="diptych__cta" aria-hidden="true">
            Quick Start →
          </span>
        </div>
      </div>
    </section>
  )
}
