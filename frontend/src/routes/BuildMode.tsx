/**
 * Build Mode Route
 *
 * Main route component for Build Mode v2 - guided 3-section MDM generation.
 * Manages view state between dashboard (carousel view) and editor (single encounter).
 *
 * Build Mode v2 - Phase 7 (Carousel Integration)
 */

import { useState, useCallback } from 'react'
import EncounterCarousel from '../components/build-mode/EncounterCarousel'
import EncounterEditor from '../components/build-mode/EncounterEditor'
import { useEncounterList } from '../hooks/useEncounterList'
import { Link } from 'react-router-dom'
import './BuildMode.css'

/**
 * Build Mode route component
 *
 * Provides two views:
 * 1. Carousel view (selectedEncounterId = null)
 *    - Animated card carousel of encounters
 *    - Create new encounter card
 *    - Select existing encounter to edit
 *
 * 2. Editor view (selectedEncounterId = string)
 *    - 3-section guided workflow
 *    - Back navigation to carousel
 */
export default function BuildMode() {
  // View state: null = carousel, string = editor for that encounter
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  // Fetch encounters from Firestore
  const { encounters, loading, error, createEncounter, deleteEncounter } = useEncounterList()

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

  // Render editor view when an encounter is selected
  if (selectedEncounterId) {
    return (
      <div className="build-mode build-mode--editor">
        <EncounterEditor encounterId={selectedEncounterId} onBack={handleBack} />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="build-mode build-mode--carousel">
        <header className="build-mode__header">
          <div className="build-mode__header-left">
            <Link to="/compose" className="build-mode__back-link">
              ← Compose
            </Link>
            <h1 className="build-mode__title">Build Mode</h1>
          </div>
        </header>
        <main className="build-mode__main build-mode__main--carousel">
          <div className="build-mode__loading">
            <div className="build-mode__loading-spinner" aria-hidden="true" />
            <p>Loading encounters...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="build-mode build-mode--carousel">
        <header className="build-mode__header">
          <div className="build-mode__header-left">
            <Link to="/compose" className="build-mode__back-link">
              ← Compose
            </Link>
            <h1 className="build-mode__title">Build Mode</h1>
          </div>
        </header>
        <main className="build-mode__main build-mode__main--carousel">
          <div className="build-mode__error">
            <span className="build-mode__error-icon" aria-hidden="true">⚠️</span>
            <p className="build-mode__error-message">
              {error.message || 'Failed to load encounters'}
            </p>
            <button
              type="button"
              className="build-mode__retry-button"
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
    <div className="build-mode build-mode--carousel">
      {/* Header */}
      <header className="build-mode__header">
        <div className="build-mode__header-left">
          <Link to="/compose" className="build-mode__back-link">
            ← Compose
          </Link>
          <h1 className="build-mode__title">Build Mode</h1>
        </div>
        <div className="build-mode__header-right">
          <p className="build-mode__subtitle">
            Track multiple encounters through your shift
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div className="build-mode__info-banner">
        <div className="build-mode__info-icon" aria-hidden="true">
          💡
        </div>
        <div className="build-mode__info-content">
          <p className="build-mode__info-text">
            <strong>Guided 3-Section Workflow:</strong> Each encounter progresses through
            Initial Evaluation → Workup & Results → Treatment & Disposition.
            Each section builds on the previous, creating comprehensive MDM documentation.
          </p>
        </div>
      </div>

      {/* Main Carousel Content */}
      <main className="build-mode__main build-mode__main--carousel">
        <EncounterCarousel
          encounters={encounters}
          onSelectEncounter={handleSelectEncounter}
          onCreateEncounter={createEncounter}
          onDeleteEncounter={deleteEncounter}
        />
      </main>

      {/* Footer with hints */}
      <footer className="build-mode__footer">
        <div className="build-mode__footer-content">
          <span className="build-mode__footer-item">
            <span className="build-mode__footer-icon" aria-hidden="true">🕐</span>
            12-hour shift window per encounter
          </span>
          <span className="build-mode__footer-divider" aria-hidden="true">•</span>
          <span className="build-mode__footer-item">
            <span className="build-mode__footer-icon" aria-hidden="true">🔄</span>
            2 submissions per section
          </span>
          <span className="build-mode__footer-divider" aria-hidden="true">•</span>
          <span className="build-mode__footer-item">
            <span className="build-mode__footer-icon" aria-hidden="true">📱</span>
            Real-time sync across devices
          </span>
        </div>
      </footer>
    </div>
  )
}
