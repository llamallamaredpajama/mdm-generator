/**
 * Build Mode Route
 *
 * Main route component for Build Mode v2 - guided 3-section MDM generation.
 * Manages view state between dashboard (encounter list) and editor (single encounter).
 *
 * Build Mode v2 - Phase 6
 */

import { useState, useCallback } from 'react'
import EncounterDashboard from '../components/build-mode/EncounterDashboard'
import EncounterEditor from '../components/build-mode/EncounterEditor'
import { Link } from 'react-router-dom'
import './BuildMode.css'

/**
 * Build Mode route component
 *
 * Provides two views:
 * 1. Dashboard view (selectedEncounterId = null)
 *    - Grid of encounter cards
 *    - Create new encounter button
 *    - Select existing encounter to edit
 *
 * 2. Editor view (selectedEncounterId = string)
 *    - 3-section guided workflow
 *    - Back navigation to dashboard
 */
export default function BuildMode() {
  // View state: null = dashboard, string = editor for that encounter
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  /**
   * Handle encounter selection from dashboard
   */
  const handleSelectEncounter = useCallback((id: string) => {
    setSelectedEncounterId(id)
  }, [])

  /**
   * Handle back navigation from editor to dashboard
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

  // Render dashboard view (default)
  return (
    <div className="build-mode build-mode--dashboard">
      {/* Dashboard Header */}
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

      {/* Main Dashboard Content */}
      <main className="build-mode__main">
        <EncounterDashboard onSelectEncounter={handleSelectEncounter} />
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
