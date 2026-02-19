/**
 * TrendAnalysisToggle Component
 * Reusable toggle with collapsible zip code input panel.
 * Integrates with TrendAnalysisContext.
 */

import { useState, useCallback } from 'react'
import { useTrendAnalysisContext } from '../contexts/TrendAnalysisContext'
import './TrendAnalysisToggle.css'

interface TrendAnalysisToggleProps {
  /** Compact mode for inline use in Section 1 */
  compact?: boolean
}

export default function TrendAnalysisToggle({ compact = false }: TrendAnalysisToggleProps) {
  const { isEnabled, setEnabled, location, setLocation, isLocationValid } = useTrendAnalysisContext()
  const [zipInput, setZipInput] = useState(location?.zipCode || '')

  const handleToggle = useCallback(() => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  const handleZipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 5)
      setZipInput(value)
      if (value.length === 5) {
        setLocation({ zipCode: value })
      } else if (value.length === 0) {
        setLocation(null)
      }
    },
    [setLocation]
  )

  return (
    <div className={`trend-toggle ${compact ? 'trend-toggle--compact' : ''}`}>
      <div className="trend-toggle__row">
        <label className="trend-toggle__label" htmlFor="trend-analysis-toggle">
          <svg
            className="trend-toggle__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            width={16}
            height={16}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="trend-toggle__text">Regional Trends</span>
        </label>

        <button
          id="trend-analysis-toggle"
          type="button"
          role="switch"
          aria-checked={isEnabled}
          className={`trend-toggle__switch ${isEnabled ? 'trend-toggle__switch--on' : ''}`}
          onClick={handleToggle}
        >
          <span className="trend-toggle__switch-thumb" />
        </button>
      </div>

      {/* Collapsible zip code input */}
      {isEnabled && (
        <div className="trend-toggle__zip-panel">
          <label htmlFor="trend-zip-input" className="trend-toggle__zip-label">
            ZIP Code
          </label>
          <input
            id="trend-zip-input"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={zipInput}
            onChange={handleZipChange}
            placeholder="e.g. 78701"
            className={`trend-toggle__zip-input ${
              zipInput.length === 5
                ? isLocationValid
                  ? 'trend-toggle__zip-input--valid'
                  : 'trend-toggle__zip-input--invalid'
                : ''
            }`}
          />
          {isLocationValid && (
            <span className="trend-toggle__zip-check" aria-label="Valid">✓</span>
          )}
        </div>
      )}
    </div>
  )
}
