import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './routes/Layout'
import Start from './routes/Start'
import Compose from './routes/Compose'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import { TrendAnalysisProvider } from './contexts/TrendAnalysisContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Start /> },
      { path: 'compose', element: <Compose /> },
      { path: 'preflight', element: <Preflight /> },
      { path: 'output', element: <Output /> },
      { path: 'settings', element: <Settings /> },
      // Redirect /build to /compose (Build Mode is now accessed via toggle on Compose page)
      { path: 'build', element: <Navigate to="/compose" replace /> },
    ],
  },
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
