/**
 * Unified Compose Route
 *
 * Provides two modes for MDM generation:
 * 1. Quick Compose - Simple single-input workflow for straightforward cases
 * 2. Build Mode - 3-section guided workflow for complex cases
 *
 * Both modes use the same carousel-based UI for managing encounters.
 */

import { useState, useCallback } from 'react'
import { useEncounterList } from '../hooks/useEncounterList'
import EncounterCarousel from '../components/build-mode/EncounterCarousel'
import EncounterEditor from '../components/build-mode/EncounterEditor'
import QuickEncounterEditor from '../components/build-mode/QuickEncounterEditor'
import type { EncounterMode } from '../types/encounter'
import './Compose.css'

/**
 * Mode toggle component for switching between Quick Compose and Build Mode
 */
function ModeToggle({
  mode,
  onModeChange,
  disabled,
}: {
  mode: EncounterMode
  onModeChange: (mode: EncounterMode) => void
  disabled?: boolean
}) {
  return (
    <div className="compose-mode-toggle" role="tablist" aria-label="Compose mode" data-mode={mode}>
      <button
        type="button"
        role="tab"
        className={`compose-mode-toggle__btn ${mode === 'quick' ? 'compose-mode-toggle__btn--active' : ''}`}
        onClick={() => onModeChange('quick')}
        disabled={disabled}
        aria-selected={mode === 'quick'}
        aria-controls="compose-content"
      >
        <svg
          className="compose-mode-toggle__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Quick Compose
      </button>
      <button
        type="button"
        role="tab"
        className={`compose-mode-toggle__btn ${mode === 'build' ? 'compose-mode-toggle__btn--active compose-mode-toggle__btn--active-build' : ''}`}
        onClick={() => onModeChange('build')}
        disabled={disabled}
        aria-selected={mode === 'build'}
        aria-controls="compose-content"
      >
        <svg
          className="compose-mode-toggle__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        Build Mode
      </button>
    </div>
  )
}

/**
 * Mode description shown below the toggle
 */
function ModeDescription({ mode }: { mode: EncounterMode }) {
  return (
    <p className="compose-mode-description">
      {mode === 'quick'
        ? 'Quick input for simpler cases — one AI analysis when finished'
        : 'Track multiple encounters through your shift with guided 3-section workflow'}
    </p>
  )
}

/**
 * Compose Route Component
 */
export default function Compose() {
  // Mode state - persisted during session
  const [mode, setMode] = useState<EncounterMode>('quick')

  // View state: null = carousel, string = editor for that encounter
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  // Fetch encounters from Firestore, filtered by mode
  const { encounters, loading, error, createEncounter, deleteEncounter, clearAllEncounters } = useEncounterList(mode)

  /**
   * Handle encounter selection from carousel
   */
  const handleSelectEncounter = useCallback((id: string) => {
    setSelectedEncounterId(id)
  }, [])

  /**
   * Handle back navigation from editor to carousel
   */
  const handleBack = useCallback(() => {
    setSelectedEncounterId(null)
  }, [])

  /**
   * Handle mode change
   * Clear selected encounter when switching modes
   */
  const handleModeChange = useCallback((newMode: EncounterMode) => {
    setMode(newMode)
    setSelectedEncounterId(null)
  }, [])

  // Render editor view when an encounter is selected
  if (selectedEncounterId) {
    // Quick mode uses QuickEncounterEditor, Build mode uses EncounterEditor
    if (mode === 'quick') {
      return (
        <div className="compose-page compose-page--editor">
          <QuickEncounterEditor
            encounterId={selectedEncounterId}
            onBack={handleBack}
          />
        </div>
      )
    }

    return (
      <div className="compose-page compose-page--editor">
        <EncounterEditor encounterId={selectedEncounterId} onBack={handleBack} />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="compose-page compose-page--carousel">
        <header className="compose-header">

          <ModeToggle mode={mode} onModeChange={handleModeChange} disabled />
        </header>
        <ModeDescription mode={mode} />
        <main className="compose-main compose-main--carousel">
          <div className="compose-loading">
            <div className="compose-loading-spinner" aria-hidden="true" />
            <p>Loading encounters...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="compose-page compose-page--carousel">
        <header className="compose-header">

          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </header>
        <ModeDescription mode={mode} />
        <main className="compose-main compose-main--carousel">
          <div className="compose-error">
            <span className="compose-error-icon" aria-hidden="true">⚠️</span>
            <p className="compose-error-message">
              {error.message || 'Failed to load encounters'}
            </p>
            <button
              type="button"
              className="compose-retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Render carousel view (default)
  return (
    <div className="compose-page compose-page--carousel">
      {/* Header */}
      <header className="compose-header">
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      </header>

      {/* Mode Description */}
      <ModeDescription mode={mode} />

      {/* Main Carousel Content */}
      <main className="compose-main compose-main--carousel" id="compose-content" role="tabpanel">
        <EncounterCarousel
          encounters={encounters}
          onSelectEncounter={handleSelectEncounter}
          onCreateEncounter={createEncounter}
          onDeleteEncounter={deleteEncounter}
          onClearAllEncounters={clearAllEncounters}
          mode={mode}
        />
      </main>

      {/* Footer Disclaimer */}
      <footer className="compose-footer">
        <p className="compose-disclaimer">
          Educational tool only. All outputs require physician review before clinical use.
        </p>
      </footer>
    </div>
  )
}
