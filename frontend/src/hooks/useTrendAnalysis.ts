/**
 * useTrendAnalysis Hook
 * Manages trend analysis state and API calls.
 */

import { useState, useCallback } from 'react'
import { useAuthToken } from '../lib/firebase'
import { useTrendAnalysisContext } from '../contexts/TrendAnalysisContext'
import { analyzeSurveillance, downloadSurveillanceReport } from '../lib/api'
import type { TrendAnalysisResult } from '../types/surveillance'

export function useTrendAnalysis() {
  const token = useAuthToken()
  const { isEnabled, location, isLocationValid, lastAnalysis, setLastAnalysis } = useTrendAnalysisContext()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const analyze = useCallback(
    async (chiefComplaint: string, differential: string[]): Promise<TrendAnalysisResult | null> => {
      if (!isEnabled || !isLocationValid || !location || !token) {
        return null
      }

      setIsAnalyzing(true)
      setError(null)

      try {
        const response = await analyzeSurveillance(
          chiefComplaint,
          differential,
          location,
          token
        )

        if (response.analysis) {
          setLastAnalysis(response.analysis)
        }
        return response.analysis
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Analysis failed')
        setError(error)
        console.error('Trend analysis failed:', error)
        return null
      } finally {
        setIsAnalyzing(false)
      }
    },
    [isEnabled, isLocationValid, location, token, setLastAnalysis]
  )

  const downloadPdf = useCallback(
    async (analysisId: string): Promise<void> => {
      if (!token) return

      try {
        const blob = await downloadSurveillanceReport(analysisId, token)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trend-report-${analysisId.slice(0, 8)}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('PDF download failed:', err)
        throw err
      }
    },
    [token]
  )

  const clearAnalysis = useCallback(() => {
    setLastAnalysis(null)
    setError(null)
  }, [setLastAnalysis])

  return {
    analysis: lastAnalysis,
    isAnalyzing,
    error,
    analyze,
    downloadPdf,
    clearAnalysis,
  }
}
