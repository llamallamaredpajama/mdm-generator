import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import DashboardLayout from './routes/DashboardLayout'
import { PhotoLibraryProvider } from './contexts/PhotoLibraryContext'
import LandingPage from './routes/LandingPage'
import EncounterBoard from './components/board/EncounterBoard'
import ArchiveView from './components/board/ArchiveView'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import OnboardingGuard from './components/OnboardingGuard'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import { TrendAnalysisProvider } from './contexts/TrendAnalysisContext'
import Analytics from './routes/Analytics'

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
        element: <DashboardLayout />,
        children: [
          { path: 'compose', element: <EncounterBoard /> },
          { path: 'archive', element: <ArchiveView /> },
          { path: 'preflight', element: <Preflight /> },
          { path: 'output', element: <Output /> },
          { path: 'settings', element: <Settings /> },
          { path: 'analytics', element: <Analytics /> },
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
      <PhotoLibraryProvider>
        <ToastProvider>
          <TrendAnalysisProvider>
            <RouterProvider router={router} />
          </TrendAnalysisProvider>
        </ToastProvider>
      </PhotoLibraryProvider>
    </AuthProvider>
  </StrictMode>,
)
