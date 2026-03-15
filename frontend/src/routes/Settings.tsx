import { useState } from 'react'
import {
  Stethoscope as StethoscopeIcon,
  ClipboardText as ClipboardTextIcon,
  Trash as TrashIcon,
  Heartbeat as HeartbeatIcon,
} from '@phosphor-icons/react'
import { useAuth } from '../lib/firebase'
import { useOrderSets } from '../hooks/useOrderSets'
import TrendAnalysisToggle from '../components/TrendAnalysisToggle'
import './Settings.css'

export default function Settings() {
  const { user } = useAuth()
  const { orderSets, deleteOrderSet } = useOrderSets()
  const [practiceSetting, setPracticeSetting] = useState(() => {
    try {
      return localStorage.getItem('practice-setting') || ''
    } catch {
      return ''
    }
  })

  const handlePracticeSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPracticeSetting(val)
    try {
      localStorage.setItem('practice-setting', val)
    } catch {
      // localStorage unavailable
    }
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      {/* Practice Setting */}
      {user && (
        <section className="settings-section">
          <h2 className="settings-section-title">
            <StethoscopeIcon className="settings-section-icon" weight="bold" size={24} />
            Practice Setting
          </h2>
          <div className="settings-card">
            <div className="settings-info-row">
              <span className="settings-info-label">Setting</span>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g., Level 1 Trauma Center, Community ED"
                value={practiceSetting}
                onChange={handlePracticeSettingChange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Surveillance */}
      {user && (
        <section className="settings-section">
          <h2 className="settings-section-title">
            <HeartbeatIcon className="settings-section-icon" weight="bold" size={24} />
            Surveillance
          </h2>
          <div className="settings-card">
            <TrendAnalysisToggle />
          </div>
        </section>
      )}

      {/* Order Sets */}
      {user && (
        <section className="settings-section">
          <h2 className="settings-section-title">
            <ClipboardTextIcon className="settings-section-icon" weight="bold" size={24} />
            Order Sets
          </h2>

          {orderSets.length === 0 ? (
            <div className="settings-card settings-card--static">
              <p className="settings-status settings-status--info">
                No saved order sets. Save one from the workup card during an encounter.
              </p>
            </div>
          ) : (
            <div className="settings-card">
              <div className="settings-orderset-list" data-testid="settings-orderset-list">
                {orderSets.map((os) => (
                  <div key={os.id} className="settings-orderset-item">
                    <div className="settings-orderset-info">
                      <span className="settings-orderset-name">{os.name}</span>
                      <span className="settings-orderset-meta">
                        {os.tests.length} tests | used {os.usageCount}x
                      </span>
                    </div>
                    <button
                      className="settings-btn settings-btn--icon-danger"
                      onClick={() => deleteOrderSet(os.id)}
                      data-testid={`delete-orderset-${os.id}`}
                      type="button"
                      title="Delete order set"
                    >
                      <TrashIcon weight="bold" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
