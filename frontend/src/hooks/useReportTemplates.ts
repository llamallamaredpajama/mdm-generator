/**
 * useReportTemplates Hook
 *
 * localStorage-based CRUD for saved report templates.
 * Templates are keyed by test ID so only relevant templates
 * appear for each test (e.g., ECG templates only for ECG results).
 */

import { useState, useCallback, useEffect } from 'react'
import type { TestResultStatus } from '../types/encounter'

const STORAGE_KEY = 'mdm-report-templates'

export interface ReportTemplate {
  id: string
  testId: string
  name: string
  text: string
  defaultStatus?: TestResultStatus
}

export interface UseReportTemplatesReturn {
  templates: ReportTemplate[]
  getTemplatesForTest: (testId: string) => ReportTemplate[]
  saveTemplate: (testId: string, name: string, text: string, defaultStatus?: TestResultStatus) => void
  deleteTemplate: (id: string) => void
}

function loadFromStorage(): ReportTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(templates: ReportTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // Silently fail if localStorage is full/unavailable
  }
}

export function useReportTemplates(): UseReportTemplatesReturn {
  const [templates, setTemplates] = useState<ReportTemplate[]>(loadFromStorage)

  useEffect(() => {
    saveToStorage(templates)
  }, [templates])

  const getTemplatesForTest = useCallback(
    (testId: string): ReportTemplate[] => {
      return templates.filter((t) => t.testId === testId)
    },
    [templates]
  )

  const saveTemplate = useCallback(
    (testId: string, name: string, text: string, defaultStatus?: TestResultStatus) => {
      const template: ReportTemplate = {
        id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        testId,
        name: name.trim(),
        text: text.trim(),
        defaultStatus,
      }
      setTemplates((prev) => [...prev, template])
    },
    []
  )

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { templates, getTemplatesForTest, saveTemplate, deleteTemplate }
}
