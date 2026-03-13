import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/firebase'
import { ToastProvider } from './contexts/ToastContext'
import { PhotoLibraryProvider } from './contexts/PhotoLibraryContext'
import SidebarLayout from './routes/SidebarLayout'
import LandingPage from './routes/LandingPage'
import EncounterBoard from './components/board/EncounterBoard'
import Preflight from './routes/Preflight'
import Output from './routes/Output'
import Settings from './routes/Settings'
import Analytics from './routes/Analytics'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PhotoLibraryProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<SidebarLayout />}>
                <Route path="compose" element={<EncounterBoard />} />
                <Route path="preflight" element={<Preflight />} />
                <Route path="output" element={<Output />} />
                <Route path="settings" element={<Settings />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="build" element={<Navigate to="/compose" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </PhotoLibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
