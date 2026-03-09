import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import './Layout.css'

export default function Layout() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="layout-header">
        <nav className="layout-nav">
          <Link to="/" className="layout-brand">
            <span className="layout-brand-text">
              <span className="layout-brand-ai">ai</span>
              <strong>MDM</strong>
              <span className="layout-brand-dot">.</span>
            </span>
          </Link>

          <div className="layout-nav-links">
            <NavLink
              to="/compose"
              className={({ isActive }) =>
                `layout-nav-link layout-nav-link--compose ${isActive ? 'active' : ''}`
              }
              onClick={(e) => {
                e.preventDefault()
                navigate('/compose', { state: { resetToQuick: Date.now() } })
              }}
            >
              Compose
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `layout-nav-link layout-nav-link--settings ${isActive ? 'active' : ''}`
              }
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="layout-main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
