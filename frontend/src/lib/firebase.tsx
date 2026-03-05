import { type FirebaseApp, initializeApp } from 'firebase/app'
import {
  type Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { whoAmI } from './api'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Lazy initialization — prevents module-level side effects that cause
// Firebase auth listeners to keep the event loop open in test environments
let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined
let _provider: GoogleAuthProvider | undefined

function getApp() {
  if (!_app) _app = initializeApp(firebaseConfig)
  return _app
}

function getAppAuth() {
  if (!_auth) _auth = getAuth(getApp())
  return _auth
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAppDb() {
  if (!_db) _db = getFirestore(getApp())
  return _db
}

function getProvider() {
  if (!_provider) _provider = new GoogleAuthProvider()
  return _provider
}

// eslint-disable-next-line react-refresh/only-export-components
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(getAppAuth(), getProvider())
    return result
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    // User cancelled or double-clicked — not an error
    if (
      authError.code === 'auth/popup-closed-by-user' ||
      authError.code === 'auth/cancelled-popup-request'
    ) {
      return
    }
    throw error
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export async function signOutUser() {
  await signOut(getAppAuth())
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthToken() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAppAuth(), async (u) => {
      if (u) setToken(await u.getIdToken())
      else setToken(null)
    })
    return unsubscribe
  }, [user])
  return token
}

interface AuthContextValue {
  user: User | null
  authLoading: boolean // true until first onAuthStateChanged fires
  onboardingCompleted: boolean | null // null = loading
  refreshOnboardingStatus: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  onboardingCompleted: null,
  refreshOnboardingStatus: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)

  const fetchOnboardingStatus = useCallback(async (u: User) => {
    try {
      const token = await u.getIdToken()
      const info = await whoAmI(token)
      setOnboardingCompleted(info.onboardingCompleted)
    } catch {
      // If whoAmI fails, assume onboarding is complete (backward compat)
      setOnboardingCompleted(true)
    }
  }, [])

  useEffect(() => {
    return onAuthStateChanged(getAppAuth(), (u) => {
      setUser(u)
      setAuthLoading(false)
      if (u) {
        fetchOnboardingStatus(u)
      } else {
        setOnboardingCompleted(null)
      }
    })
  }, [fetchOnboardingStatus])

  const refreshOnboardingStatus = useCallback(() => {
    if (user) {
      fetchOnboardingStatus(user)
    }
  }, [user, fetchOnboardingStatus])

  const value = useMemo(
    () => ({ user, authLoading, onboardingCompleted, refreshOnboardingStatus }),
    [user, authLoading, onboardingCompleted, refreshOnboardingStatus],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
