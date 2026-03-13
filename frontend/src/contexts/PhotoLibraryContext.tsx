import { createContext, useContext } from 'react'
import { usePhotoLibrary, type PhotoUrlMap } from '../hooks/usePhotoLibrary'

const PhotoLibraryContext = createContext<PhotoUrlMap>(new Map())

export function PhotoLibraryProvider({ children }: { children: React.ReactNode }) {
  const { photoUrls } = usePhotoLibrary()
  return <PhotoLibraryContext.Provider value={photoUrls}>{children}</PhotoLibraryContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePhotoUrls(): PhotoUrlMap {
  return useContext(PhotoLibraryContext)
}
