import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Kanban as KanbanIcon,
  Archive as ArchiveIcon,
  ChartLineUp as ChartLineUpIcon,
  GearSix as GearSixIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import './BottomNav.css'

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

export default function BottomNav({ onNewEncounter }: { onNewEncounter: () => void }) {
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
      className={`bottom-nav__item${activeId === item.id ? ' bottom-nav__item--active' : ''}`}
      onClick={() => handleNavClick(item)}
      aria-label={item.label}
    >
      <item.icon className="bottom-nav__icon" weight="bold" size={22} />
      {activeId === item.id && <span className="bottom-nav__label">{item.label}</span>}
    </button>
  )

  return (
    <nav className="bottom-nav">
      {LEFT_ITEMS.map(renderItem)}

      <button
        type="button"
        className="bottom-nav__new-btn"
        onClick={onNewEncounter}
        aria-label="New Encounter"
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <path d="M14 6h4v20h-4z" fill="#fff" />
          <path d="M6 14h20v4H6z" fill="#fff" />
        </svg>
      </button>

      {RIGHT_ITEMS.map(renderItem)}
    </nav>
  )
}
