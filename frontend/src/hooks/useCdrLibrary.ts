import { useState, useEffect } from 'react'
import { useAuthToken } from '../lib/firebase'
import { fetchCdrLibrary } from '../lib/api'
import type { CdrDefinition } from '../types/libraries'

interface UseCdrLibraryResult {
  cdrs: CdrDefinition[]
  loading: boolean
  error: string | null
}

const cache = new Map<string, { cdrs: CdrDefinition[] }>()
const promiseCache = new Map<string, Promise<{ cdrs: CdrDefinition[] }>>()

export function useCdrLibrary(): UseCdrLibraryResult {
  const token = useAuthToken()
  const [cdrs, setCdrs] = useState<CdrDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    if (cache.has(token)) {
      setCdrs(cache.get(token)!.cdrs)
      return
    }

    if (!promiseCache.has(token)) {
      promiseCache.set(token, fetchCdrLibrary(token))
    }

    let cancelled = false
    setLoading(true)

    promiseCache
      .get(token)!
      .then((res) => {
        cache.set(token, res)
        if (!cancelled) {
          setCdrs(res.cdrs)
          setError(null)
        }
      })
      .catch((err) => {
        promiseCache.delete(token)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load CDR library')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return { cdrs, loading, error }
}

export function clearCdrCache() {
  cache.clear()
  promiseCache.clear()
}
