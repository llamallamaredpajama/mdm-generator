import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/firebase'

/**
 * Route guard that wraps Layout children.
 * - Not authenticated -> redirect to /
 * - onboardingCompleted === false -> redirect to /onboarding
 * - Otherwise -> render children (Outlet)
 */
export default function OnboardingGuard() {
  const { user, onboardingCompleted } = useAuth()

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
