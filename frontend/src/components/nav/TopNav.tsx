import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Kanban as KanbanIcon,
  Archive as ArchiveIcon,
  ChartLineUp as ChartLineUpIcon,
  GearSix as GearSixIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useAuth } from '../../lib/firebase'
import AccountDropdown from './AccountDropdown'
import './TopNav.css'

interface NavItem {
  id: string
  icon: Icon
  label: string
  path: string
}

const LEFT_ITEMS: NavItem[] = [
  { id: 'board', icon: KanbanIcon, label: 'Board', path: '/compose' },
  { id: 'archive', icon: ArchiveIcon, label: 'Archive', path: '/archive' },
]

const RIGHT_ITEMS: NavItem[] = [
  { id: 'analytics', icon: ChartLineUpIcon, label: 'Analytics', path: '/analytics' },
  { id: 'settings', icon: GearSixIcon, label: 'Settings', path: '/settings' },
]

export default function TopNav({ onNewEncounter }: { onNewEncounter: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getActiveId = useCallback((): string => {
    const path = location.pathname
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/archive')) return 'archive'
    if (path.startsWith('/analytics')) return 'analytics'
    return 'board'
  }, [location.pathname])

  const activeId = getActiveId()

  const handleNavClick = useCallback(
    (item: NavItem) => {
      navigate(item.path)
    },
    [navigate],
  )

  const renderItem = (item: NavItem) => (
    <button
      key={item.id}
      type="button"
      className={`top-nav__item${activeId === item.id ? ' top-nav__item--active' : ''}`}
      onClick={() => handleNavClick(item)}
      title={activeId === item.id ? undefined : item.label}
    >
      <item.icon className="top-nav__icon" weight="bold" size={22} />
      {activeId === item.id && <span className="top-nav__label">{item.label}</span>}
    </button>
  )

  return (
    <nav className="top-nav">
      <div className="top-nav__logo">
        <span className="top-nav__logo-ai">ai</span>
        <span className="top-nav__logo-mdm">MDM</span>
      </div>

      <div className="top-nav__center">
        <div className="top-nav__group top-nav__group--left">{LEFT_ITEMS.map(renderItem)}</div>

        <button
          type="button"
          className="top-nav__new-btn"
          onClick={onNewEncounter}
          aria-label="New Encounter"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="#fff" />
          </svg>
        </button>

        <div className="top-nav__group top-nav__group--right">{RIGHT_ITEMS.map(renderItem)}</div>
      </div>

      <AccountDropdown user={user} />
    </nav>
  )
}
