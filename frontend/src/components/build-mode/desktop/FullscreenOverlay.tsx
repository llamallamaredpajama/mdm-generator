import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { EncounterDocument, EncounterMode } from '../../../types/encounter'
import { getEncounterMode } from '../../../types/encounter'
import CardContent from '../shared/CardContent'
import './FullscreenOverlay.css'

export interface FullscreenOverlayProps {
  /** The encounter to display in fullscreen */
  encounter: EncounterDocument
  /** Callback when overlay should close */
  onClose: () => void
  /** Mode context for styling */
  mode: EncounterMode
  /** Animation phase from parent */
  animationPhase?: 'idle' | 'expanding' | 'expanded' | 'collapsing'
  /** Callback when user wants to edit this encounter */
  onEdit?: (encounterId: string) => void
  /** Callback when user wants to delete this encounter */
  onDelete?: (encounterId: string) => void
}

/**
 * FullscreenOverlay - Portal-based fullscreen view for desktop
 *
 * Renders a fixed overlay with:
 * - Backdrop click to close
 * - Focus trap for accessibility
 * - Expand animation: 400ms expo easing
 * - Full CardContent with all details
 *
 * Note: Escape key handling is managed by useCardExpansion hook
 */
export default function FullscreenOverlay({
  encounter,
  onClose,
  mode,
  animationPhase = 'expanded',
  onEdit,
  onDelete,
}: FullscreenOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Focus trap setup
  useEffect(() => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement

    // Focus the content container
    if (contentRef.current) {
      contentRef.current.focus()
    }

    // Restore focus on unmount
    return () => {
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [])

  // Trap focus within overlay
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || !overlayRef.current) return

    const focusableElements = overlayRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift+Tab: wrap to last element
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab: wrap to first element
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }, [])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === overlayRef.current) {
        onClose()
      }
    },
    [onClose]
  )

  // Handle edit action
  const handleEdit = useCallback(() => {
    if (onEdit && encounter.id) {
      onEdit(encounter.id)
      onClose()
    }
  }, [encounter.id, onEdit, onClose])

  // Handle delete action
  const handleDelete = useCallback(() => {
    if (onDelete && encounter.id) {
      onDelete(encounter.id)
      onClose()
    }
  }, [encounter.id, onDelete, onClose])

  const overlayContent = (
    <div
      ref={overlayRef}
      className={`fullscreen-overlay fullscreen-overlay--${animationPhase}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-overlay-title"
    >
      {/* Backdrop */}
      <div className="fullscreen-overlay__backdrop" aria-hidden="true" />

      {/* Content panel */}
      <div
        ref={contentRef}
        className={`fullscreen-overlay__content fullscreen-overlay__content--mode-${mode}`}
        tabIndex={-1}
      >
        {/* Header with close button */}
        <div className="fullscreen-overlay__header">
          <h2 id="fullscreen-overlay-title" className="fullscreen-overlay__title">
            {encounter.roomNumber}
          </h2>
          <button
            type="button"
            className="fullscreen-overlay__close"
            onClick={onClose}
            aria-label="Close overlay"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main content area */}
        <div className="fullscreen-overlay__body">
          <CardContent
            encounter={encounter}
            showSectionIndicators={getEncounterMode(encounter) === 'build'}
            compact={false}
          />
        </div>

        {/* Action buttons */}
        <div className="fullscreen-overlay__actions">
          {onEdit && (
            <button
              type="button"
              className="fullscreen-overlay__action fullscreen-overlay__action--primary"
              onClick={handleEdit}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Encounter
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="fullscreen-overlay__action fullscreen-overlay__action--danger"
              onClick={handleDelete}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // Portal to document.body
  return createPortal(overlayContent, document.body)
}
