import { useState, useCallback, useEffect } from 'react'
import type { TrendAnalysisResult } from '../types/surveillance'
import { formatTrendReport } from '../lib/formatTrendReport'
import { useToast } from '../contexts/ToastContext'
import './TrendReportModal.css'

interface TrendReportModalProps {
  analysis: TrendAnalysisResult
  isOpen: boolean
  onClose: () => void
}

export default function TrendReportModal({ analysis, isOpen, onClose }: TrendReportModalProps) {
  const [copied, setCopied] = useState(false)
  const { success: showSuccess, error: showError } = useToast()

  const reportText = formatTrendReport(analysis)

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) setCopied(false)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      showSuccess('Report copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Failed to copy report')
    }
  }, [reportText, showSuccess, showError])

  const handleDownload = useCallback(() => {
    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trend-report-${analysis.analysisId.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [reportText, analysis.analysisId])

  if (!isOpen) return null

  return (
    <div className="trend-report-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Trend Analysis Report">
      <div className="trend-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trend-report-modal__header">
          <h3 className="trend-report-modal__title">Chart-Ready Trend Report</h3>
          <button type="button" className="trend-report-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="trend-report-modal__body">
          <pre className="trend-report-modal__text">{reportText}</pre>
        </div>

        <div className="trend-report-modal__actions">
          <button type="button" className="trend-report-modal__btn" onClick={handleDownload}>
            &darr; Download .txt
          </button>
          <button
            type="button"
            className={`trend-report-modal__btn trend-report-modal__btn--primary ${copied ? 'trend-report-modal__btn--copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '⎘ Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
