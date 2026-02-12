import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

// eslint-disable-next-line react-refresh/only-export-components
export async function signInWithGoogle() {
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
      alert('Pop-up blocked by your browser. Please allow pop-ups for this site and try again.')
      return
    }
    alert(`Sign in failed: ${authError.message}`)
    throw error
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
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])
  
  const value = useMemo(() => ({ user }), [user])
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}