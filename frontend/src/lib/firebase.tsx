import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
// eslint-disable-next-line react-refresh/only-export-components
export const db = getFirestore(app)
const provider = new GoogleAuthProvider()

/**
 * Detect mobile browsers and in-app WebViews where popups are blocked or unreliable.
 * Uses User-Agent sniffing (the only reliable approach for this specific problem).
 */
function isMobileBrowser(): boolean {
  const ua = navigator.userAgent || ''
  // Standard mobile browsers
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true
  // In-app WebViews (Instagram, Facebook, Twitter, etc.) that block popups
  if (/FBAN|FBAV|Instagram|Twitter|Line\//i.test(ua)) return true
  // iPad with desktop UA (iPadOS 13+)
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true
  return false
}

// eslint-disable-next-line react-refresh/only-export-components
export async function signInWithGoogle() {
  // Mobile browsers block or stall on signInWithPopup — use redirect instead
  if (isMobileBrowser()) {
    await signInWithRedirect(auth, provider)
    // Page will redirect; execution doesn't continue here
    return
  }

  try {
    const result = await signInWithPopup(auth, provider)
    return result
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    if (authError.code === 'auth/popup-closed-by-user') {
      // User cancelled — not an error
      return
    }
    if (authError.code === 'auth/popup-blocked') {
      // Fallback: if popup is blocked on desktop, try redirect
      await signInWithRedirect(auth, provider)
      return
    }
    alert(`Sign in failed: ${authError.message}`)
    throw error
  }
}

/**
 * Process the result of a redirect-based sign-in.
 * Must be called once on app load to complete the OAuth flow after redirect.
 */
// eslint-disable-next-line react-refresh/only-export-components
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth)
    return result
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    // auth/popup-closed-by-user can fire on redirect cancellation too
    if (authError.code === 'auth/popup-closed-by-user') return null
    console.error('Redirect sign-in error:', authError.code)
    return null
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export async function signOutUser() {
  await signOut(auth)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthToken() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) setToken(await u.getIdToken())
      else setToken(null)
    })
    return unsubscribe
  }, [user])
  return token
}

const AuthContext = createContext<{ user: User | null }>({ user: null })

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Complete any pending redirect-based sign-in (mobile OAuth flow)
    checkRedirectResult()
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])
  
  const value = useMemo(() => ({ user }), [user])
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}