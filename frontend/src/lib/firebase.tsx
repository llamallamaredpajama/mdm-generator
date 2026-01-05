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

// Try popup first, fall back to redirect if popup fails
// eslint-disable-next-line react-refresh/only-export-components
export async function signInWithGoogle() {
  console.log('Starting Google sign in...')
  console.log('Firebase config:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
  })
  
  try {
    // First attempt with popup
    console.log('Attempting popup sign in...')
    const result = await signInWithPopup(auth, provider)
    console.log('Sign in successful (popup):', result.user.email)
    return result
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    console.error('Popup sign in error:', error)
    console.error('Error code:', authError.code)
    console.error('Error message:', authError.message)
    
    // If popup was blocked or failed, try redirect
    if (authError.code === 'auth/popup-blocked' ||
        authError.code === 'auth/operation-not-allowed' ||
        authError.code === 'auth/unauthorized-domain') {
      console.log('Falling back to redirect sign in...')
      // Use redirect as fallback
      await signInWithRedirect(auth, provider)
      // This will redirect the page, so no return value
    } else if (authError.code === 'auth/popup-closed-by-user') {
      console.log('User cancelled sign in')
    } else {
      // For other errors, show alert
      alert(`Sign in failed: ${authError.message}`)
      throw error
    }
  }
}

// Check for redirect result on page load
// eslint-disable-next-line react-refresh/only-export-components
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      console.log('Sign in successful (redirect):', result.user.email)
      return result
    }
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    console.error('Redirect sign in error:', error)
    if (authError.code !== 'auth/popup-closed-by-user') {
      alert(`Sign in failed: ${authError.message}`)
    }
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
    // Check for redirect result when component mounts
    checkRedirectResult()
    
    // Set up auth state listener
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])
  
  const value = useMemo(() => ({ user }), [user])
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}