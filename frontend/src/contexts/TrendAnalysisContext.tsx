/**
 * TrendAnalysisContext
 * Provides surveillance trend analysis state across the app.
 * Persists isEnabled + location to localStorage.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { SurveillanceLocation, TrendAnalysisResult } from '../types/surveillance'

interface TrendAnalysisContextValue {
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
  location: SurveillanceLocation | null
  setLocation: (location: SurveillanceLocation | null) => void
  isLocationValid: boolean
  lastAnalysis: TrendAnalysisResult | null
  setLastAnalysis: (result: TrendAnalysisResult | null) => void
}

const TrendAnalysisContext = createContext<TrendAnalysisContextValue | null>(null)

const STORAGE_KEY = 'mdm-trend-prefs'

interface StoredPrefs {
  isEnabled: boolean
  location: SurveillanceLocation | null
}

function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredPrefs
  } catch {
    // ignore parse errors
  }
  return { isEnabled: false, location: null }
}

function savePrefs(prefs: StoredPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore storage errors
  }
}

export function TrendAnalysisProvider({ children }: { children: ReactNode }) {
  const initial = loadPrefs()
  const [isEnabled, setEnabledState] = useState(initial.isEnabled)
  const [location, setLocationState] = useState<SurveillanceLocation | null>(initial.location)
  const [lastAnalysis, setLastAnalysis] = useState<TrendAnalysisResult | null>(null)

  // Persist to localStorage on change
  useEffect(() => {
    savePrefs({ isEnabled, location })
  }, [isEnabled, location])

  const setEnabled = useCallback((enabled: boolean) => {
    setEnabledState(enabled)
    if (!enabled) {
      setLastAnalysis(null)
    }
  }, [])

  const setLocation = useCallback((loc: SurveillanceLocation | null) => {
    setLocationState(loc)
  }, [])

  const isLocationValid = Boolean(
    location && (
      (location.zipCode && /^\d{5}$/.test(location.zipCode)) ||
      (location.state && /^[A-Z]{2}$/i.test(location.state))
    )
  )

  return (
    <TrendAnalysisContext.Provider
      value={{
        isEnabled,
        setEnabled,
        location,
        setLocation,
        isLocationValid,
        lastAnalysis,
        setLastAnalysis,
      }}
    >
      {children}
    </TrendAnalysisContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrendAnalysisContext() {
  const context = useContext(TrendAnalysisContext)
  if (!context) {
    throw new Error('useTrendAnalysisContext must be used within a TrendAnalysisProvider')
  }
  return context
}
