import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { getAppDb } from '../lib/firebase'

export type PhotoUrlMap = Map<string, string> // "category/subcategory" → downloadUrl

export function usePhotoLibrary(): { photoUrls: PhotoUrlMap; loading: boolean } {
  const [photoUrls, setPhotoUrls] = useState<PhotoUrlMap>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchPhotos() {
      try {
        const snapshot = await getDocs(collection(getAppDb(), 'photoLibrary'))
        if (cancelled) return

        const map = new Map<string, string>()
        for (const doc of snapshot.docs) {
          const data = doc.data()
          const { category, subcategory, downloadUrl } = data as {
            category: string
            subcategory: string
            downloadUrl?: string
          }
          if (category && subcategory && downloadUrl) {
            map.set(`${category}/${subcategory}`, downloadUrl)
          }
        }
        setPhotoUrls(map)
      } catch (err) {
        console.warn('Failed to load photo library from Firestore:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPhotos()
    return () => {
      cancelled = true
    }
  }, [])

  return { photoUrls, loading }
}
