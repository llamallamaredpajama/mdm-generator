/**
 * useReportTemplates Hook
 *
 * API-backed CRUD for saved report templates, persisted in Firestore via
 * /v1/user/report-templates endpoints. Includes one-time migration from
 * localStorage for users who had locally-saved templates.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthToken } from '../lib/firebase'
import type { ReportTemplate } from '../types/userProfile'
import {
  getReportTemplates,
  createReportTemplate,
  deleteReportTemplate as apiDeleteReportTemplate,
  useReportTemplate as apiUseReportTemplate,
} from '../lib/api'

export type { ReportTemplate } from '../types/userProfile'

const LEGACY_STORAGE_KEY = 'mdm-report-templates'
const MIGRATION_FLAG = 'mdm-report-templates-migrated'
const MIGRATION_RETRY_KEY = 'mdm-report-templates-migration-retries'
const MAX_MIGRATION_RETRIES = 3

export interface UseReportTemplatesReturn {
  templates: ReportTemplate[]
  loading: boolean
  getTemplatesForTest: (testId: string) => ReportTemplate[]
  saveTemplate: (
    testId: string,
    name: string,
    text: string,
    defaultStatus?: 'unremarkable' | 'abnormal',
  ) => Promise<ReportTemplate | null>
  deleteTemplate: (id: string) => Promise<void>
  incrementUsage: (id: string) => void
}

interface LegacyReportTemplate {
  id: string
  testId: string
  name: string
  text: string
  defaultStatus?: 'unremarkable' | 'abnormal'
}

async function migrateFromLocalStorage(token: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return

  const retries = parseInt(localStorage.getItem(MIGRATION_RETRY_KEY) ?? '0', 10)
  if (retries >= MAX_MIGRATION_RETRIES) return

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    const legacy: LegacyReportTemplate[] = JSON.parse(raw)
    if (!Array.isArray(legacy) || legacy.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return
    }

    for (const tmpl of legacy) {
      if (tmpl.testId && tmpl.name && tmpl.text) {
        await createReportTemplate(token, {
          testId: tmpl.testId,
          name: tmpl.name,
          text: tmpl.text,
          defaultStatus: tmpl.defaultStatus ?? 'unremarkable',
        })
      }
    }

    localStorage.setItem(MIGRATION_FLAG, '1')
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(MIGRATION_RETRY_KEY)
  } catch {
    localStorage.setItem(MIGRATION_RETRY_KEY, String(retries + 1))
  }
}

export function useReportTemplates(): UseReportTemplatesReturn {
  const token = useAuthToken()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || fetchedRef.current) return
    fetchedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        await migrateFromLocalStorage(token)
        const res = await getReportTemplates(token)
        if (!cancelled) setTemplates(res.items)
      } catch {
        // Fall back to empty
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      fetchedRef.current = false
      setTemplates([])
      setLoading(true)
    }
  }, [token])

  const getTemplatesForTest = useCallback(
    (testId: string): ReportTemplate[] => {
      return templates.filter((t) => t.testId === testId)
    },
    [templates],
  )

  const saveTemplate = useCallback(
    async (
      testId: string,
      name: string,
      text: string,
      defaultStatus: 'unremarkable' | 'abnormal' = 'unremarkable',
    ): Promise<ReportTemplate | null> => {
      if (!token) return null
      try {
        const res = await createReportTemplate(token, {
          testId,
          name: name.trim(),
          text: text.trim(),
          defaultStatus,
        })
        setTemplates((prev) => [...prev, res.item])
        return res.item
      } catch {
        return null
      }
    },
    [token],
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!token) return
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      try {
        await apiDeleteReportTemplate(token, id)
      } catch {
        try {
          const res = await getReportTemplates(token)
          setTemplates(res.items)
        } catch {
          // Give up
        }
      }
    },
    [token],
  )

  const incrementUsage = useCallback(
    (id: string) => {
      if (!token) return
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t)),
      )
      apiUseReportTemplate(token, id).catch(() => {})
    },
    [token],
  )

  return {
    templates,
    loading,
    getTemplatesForTest,
    saveTemplate,
    deleteTemplate,
    incrementUsage,
  }
}
