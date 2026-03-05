import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/firebase'

/**
 * Route guard that wraps Layout children.
 * - Not authenticated -> redirect to /
 * - onboardingCompleted === false -> redirect to /onboarding
 * - Otherwise -> render children (Outlet)
 */
export default function OnboardingGuard() {
  const { user, authLoading, onboardingCompleted } = useAuth()

  // Wait for Firebase to restore session before deciding
  if (authLoading) {
    return null
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Still loading onboarding status
  if (onboardingCompleted === null) {
    return null
  }

  // Onboarding not completed
  if (onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
