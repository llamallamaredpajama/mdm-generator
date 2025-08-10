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
const provider = new GoogleAuthProvider()

// Try popup first, fall back to redirect if popup fails
export async function signInWithGoogle() {
  try {
    // First attempt with popup
    const result = await signInWithPopup(auth, provider)
    console.log('Sign in successful (popup):', result.user.email)
    return result
  } catch (error: any) {
    console.error('Popup sign in error:', error)
    
    // If popup was blocked or failed, try redirect
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'auth/unauthorized-domain') {
      console.log('Falling back to redirect sign in...')
      // Use redirect as fallback
      await signInWithRedirect(auth, provider)
      // This will redirect the page, so no return value
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log('User cancelled sign in')
    } else {
      // For other errors, show alert
      alert(`Sign in failed: ${error.message}`)
      throw error
    }
  }
}

// Check for redirect result on page load
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      console.log('Sign in successful (redirect):', result.user.email)
      return result
    }
  } catch (error: any) {
    console.error('Redirect sign in error:', error)
    if (error.code !== 'auth/popup-closed-by-user') {
      alert(`Sign in failed: ${error.message}`)
    }
  }
}

export async function signOutUser() {
  await signOut(auth)
}

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

export const AuthContext = createContext<{ user: User | null }>({ user: null })
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