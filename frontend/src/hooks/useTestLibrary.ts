import { useState, useEffect, useRef } from 'react'
import { useAuthToken } from '../lib/firebase'
import { fetchTestLibrary } from '../lib/api'
import type { TestDefinition, TestCategory } from '../types/libraries'

interface UseTestLibraryResult {
  tests: TestDefinition[]
  categories: TestCategory[]
  loading: boolean
  error: string | null
}

export function useTestLibrary(): UseTestLibraryResult {
  const token = useAuthToken()
  const [tests, setTests] = useState<TestDefinition[]>([])
  const [categories, setCategories] = useState<TestCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || fetchedRef.current) return

    let cancelled = false
    fetchedRef.current = true
    setLoading(true)

    fetchTestLibrary(token)
      .then((res) => {
        if (!cancelled) {
          setTests(res.tests)
          setCategories(res.categories)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load test library')
          fetchedRef.current = false
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [token])

  return { tests, categories, loading, error }
}
