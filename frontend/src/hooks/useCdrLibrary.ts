import { useState, useEffect, useRef } from 'react'
import { useAuthToken } from '../lib/firebase'
import { fetchCdrLibrary } from '../lib/api'
import type { CdrDefinition } from '../types/libraries'

interface UseCdrLibraryResult {
  cdrs: CdrDefinition[]
  loading: boolean
  error: string | null
}

export function useCdrLibrary(): UseCdrLibraryResult {
  const token = useAuthToken()
  const [cdrs, setCdrs] = useState<CdrDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || fetchedRef.current) return

    let cancelled = false
    fetchedRef.current = true
    setLoading(true)

    fetchCdrLibrary(token)
      .then((res) => {
        if (!cancelled) {
          setCdrs(res.cdrs)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load CDR library')
          fetchedRef.current = false
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [token])

  return { cdrs, loading, error }
}
