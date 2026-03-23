import { useState, useEffect } from 'react'
import { useAuthToken } from '../lib/firebase'
import { fetchTestLibrary } from '../lib/api'
import type { TestDefinition, TestCategory } from '../types/libraries'

interface UseTestLibraryResult {
  tests: TestDefinition[]
  categories: TestCategory[]
  loading: boolean
  error: string | null
}

const cache = new Map<string, { tests: TestDefinition[]; categories: TestCategory[] }>()
const promiseCache = new Map<
  string,
  Promise<{ tests: TestDefinition[]; categories: TestCategory[] }>
>()

export function useTestLibrary(): UseTestLibraryResult {
  const token = useAuthToken()
  const [tests, setTests] = useState<TestDefinition[]>([])
  const [categories, setCategories] = useState<TestCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    if (cache.has(token)) {
      const data = cache.get(token)!
      setTests(data.tests)
      setCategories(data.categories)
      return
    }

    if (!promiseCache.has(token)) {
      promiseCache.set(token, fetchTestLibrary(token))
    }

    let cancelled = false
    setLoading(true)

    promiseCache
      .get(token)!
      .then((res) => {
        cache.set(token, res)
        if (!cancelled) {
          setTests(res.tests)
          setCategories(res.categories)
          setError(null)
        }
      })
      .catch((err) => {
        promiseCache.delete(token)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load test library')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return { tests, categories, loading, error }
}

export function clearTestCache() {
  cache.clear()
  promiseCache.clear()
}
