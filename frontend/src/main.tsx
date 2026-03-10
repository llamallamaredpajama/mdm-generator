import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import SidebarLayout from './routes/SidebarLayout'
import LandingPage from './routes/LandingPage'
import EncounterBoard from './components/board/EncounterBoard'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import OnboardingGuard from './components/OnboardingGuard'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import { TrendAnalysisProvider } from './contexts/TrendAnalysisContext'

const Onboarding = lazy(() => import('./routes/Onboarding'))

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: 'onboarding',
    element: (
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
    ),
  },
  {
    element: <OnboardingGuard />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: 'compose', element: <EncounterBoard /> },
          { path: 'preflight', element: <Preflight /> },
          { path: 'output', element: <Output /> },
          { path: 'settings', element: <Settings /> },
          { path: 'build', element: <Navigate to="/compose" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <TrendAnalysisProvider>
          <RouterProvider router={router} />
        </TrendAnalysisProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
