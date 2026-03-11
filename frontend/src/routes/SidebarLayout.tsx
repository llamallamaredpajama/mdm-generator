import { useState, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/firebase'
import { useIsMobile } from '../hooks/useMediaQuery'
import ErrorBoundary from '../components/ErrorBoundary'
import './SidebarLayout.css'

const STORAGE_KEY = 'sidebar-collapsed'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getUserInitials(displayName: string | null | undefined): string {
  if (!displayName) return 'DR'
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

interface NavItem {
  id: string
  icon: string
  label: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'board', icon: '/icons/board_icon_1773194309729.png', label: 'Board', path: '/compose' },
  { id: 'archive', icon: '/icons/archive_icon_1773194284720.png', label: 'Archive', path: '/archive' },
  { id: 'analytics', icon: '/icons/analytics_icon_1773194321954.png', label: 'Analytics', path: '/analytics' },
]

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'help', icon: '?', label: 'Help', path: '/help' },
  { id: 'settings', icon: '\u2699', label: 'Settings', path: '/settings' },
]

export default function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const location = useLocation()

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }, [])

  // Determine which nav item is active based on current path
  const getActiveId = useCallback((): string => {
    const path = location.pathname
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/help')) return 'help'
    if (path.startsWith('/archive')) return 'archive'
    if (path.startsWith('/analytics')) return 'analytics'
    // Default to board for /compose, /build, /preflight, /output, etc.
    return 'board'
  }, [location.pathname])

  const activeId = getActiveId()

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.id === 'archive') {
        navigate('/compose', { state: { viewArchive: true } })
      } else {
        navigate(item.path)
      }
    },
    [navigate],
  )

  const handleNewEncounter = useCallback(() => {
    navigate('/compose', { state: { openNew: true } })
  }, [navigate])

  // ── Mobile: bottom menu bar ──
  if (isMobile) {
    return (
      <div className="brutalist sidebar-layout">
        <div className="sidebar-layout__main sidebar-layout__main--mobile">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>

        <div className="sidebar-layout__mobile-bar">
          <button
            type="button"
            className={`sidebar-layout__mobile-btn${activeId === 'archive' ? ' sidebar-layout__mobile-btn--active' : ''}`}
            onClick={() => navigate('/compose', { state: { viewArchive: true } })}
            aria-label="Archive"
          >
            <span className="sidebar-layout__mobile-icon">
              <img src="/icons/archive_icon_1773194284720.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
            </span>
          </button>

          <button
            type="button"
            className="sidebar-layout__mobile-new"
            onClick={handleNewEncounter}
            aria-label="New Encounter"
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/icons/new_patient_icon_1773194296163.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
            </span>
          </button>

          <button
            type="button"
            className={`sidebar-layout__mobile-btn${activeId === 'settings' ? ' sidebar-layout__mobile-btn--active' : ''}`}
            onClick={() => navigate('/settings')}
            aria-label="Settings"
          >
            <span className="sidebar-layout__mobile-icon">{'\u2699'}</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Desktop: sidebar layout ──
  return (
    <div className="brutalist sidebar-layout">
      <aside
        className={`sidebar-layout__sidebar${collapsed ? ' sidebar-layout__sidebar--collapsed' : ''}`}
      >
        {/* Header */}
        <div className="sidebar-layout__header">
          {!collapsed && <span className="sidebar-layout__logo">Encounter</span>}
          <button
            type="button"
            className="sidebar-layout__collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '\u203A' : '\u2039'}
          </button>
        </div>

        <div className="sidebar-layout__new-wrap">
          {collapsed ? (
            <button
              type="button"
              className="sidebar-layout__new-btn sidebar-layout__new-btn--collapsed"
              onClick={handleNewEncounter}
              aria-label="New Encounter"
            >
              <img src="/icons/new_patient_icon_1773194296163.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
            </button>
          ) : (
            <button type="button" className="sidebar-layout__new-btn" onClick={handleNewEncounter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <img src="/icons/new_patient_icon_1773194296163.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
              New Encounter
            </button>
          )}
        </div>

        {/* Main Nav */}
        <nav className="sidebar-layout__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-layout__nav-item${activeId === item.id ? ' sidebar-layout__nav-item--active' : ''}`}
              onClick={() => handleNavClick(item)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-layout__nav-icon">
                {item.icon.startsWith('/') ? (
                  <img src={item.icon} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
                ) : (
                  item.icon
                )}
              </span>
              {!collapsed && <span className="sidebar-layout__nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Nav */}
        <div className="sidebar-layout__bottom">
          {BOTTOM_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-layout__nav-item sidebar-layout__nav-item--bottom${activeId === item.id ? ' sidebar-layout__nav-item--active' : ''}`}
              onClick={() => handleNavClick(item)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-layout__nav-icon">
                {item.icon.startsWith('/') ? (
                  <img src={item.icon} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
                ) : (
                  item.icon
                )}
              </span>
              {!collapsed && <span className="sidebar-layout__nav-label">{item.label}</span>}
            </button>
          ))}

          {/* User section */}
          <div className="sidebar-layout__user">
            {user?.photoURL ? (
              <img
                className="sidebar-layout__avatar"
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="sidebar-layout__avatar sidebar-layout__avatar--initials">
                {getUserInitials(user?.displayName)}
              </div>
            )}
            {!collapsed && (
              <span className="sidebar-layout__user-name">
                Dr. {user?.displayName || 'Physician'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`sidebar-layout__main${collapsed ? ' sidebar-layout__main--expanded' : ''}`}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  )
}
