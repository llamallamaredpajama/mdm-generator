import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './routes/Layout'
import LandingPage from './routes/LandingPage'
import Compose from './routes/Compose'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import Wireframe from './routes/Wireframe'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route path="compose" element={<Compose />} />
              <Route path="preflight" element={<Preflight />} />
              <Route path="output" element={<Output />} />
              <Route path="settings" element={<Settings />} />
              <Route path="wireframe" element={<Wireframe />} />
              <Route path="build" element={<Navigate to="/compose" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
