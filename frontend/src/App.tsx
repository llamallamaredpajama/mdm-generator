import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './routes/Layout'
import Start from './routes/Start'
import Compose from './routes/Compose'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import './App.css'

const BuildMode = lazy(() => import('./routes/BuildMode'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Start />} />
            <Route path="compose" element={<Compose />} />
            <Route path="preflight" element={<Preflight />} />
            <Route path="output" element={<Output />} />
            <Route path="settings" element={<Settings />} />
            <Route path="build" element={<Suspense fallback={<div>Loading...</div>}><BuildMode /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
