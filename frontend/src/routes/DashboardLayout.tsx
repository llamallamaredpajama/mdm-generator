import { useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useMediaQuery'
import TopNav from '../components/nav/TopNav'
import BottomNav from '../components/nav/BottomNav'
import ErrorBoundary from '../components/ErrorBoundary'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const handleNewEncounter = useCallback(() => {
    navigate('/compose', { state: { openNew: true } })
  }, [navigate])

  return (
    <div className={`brutalist dashboard-layout${isMobile ? ' dashboard-layout--mobile' : ''}`}>
      {!isMobile && <TopNav onNewEncounter={handleNewEncounter} />}

      <div className="dashboard-layout__content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      {isMobile && <BottomNav onNewEncounter={handleNewEncounter} />}
    </div>
  )
}
