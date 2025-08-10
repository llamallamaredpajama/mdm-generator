import { useEffect, useState } from 'react'
import { useAuthToken, useAuth, signOutUser } from '../lib/firebase'
import { whoAmI } from '../lib/api'

export default function Settings() {
  const token = useAuthToken()
  const { user } = useAuth()
  const [info, setInfo] = useState<{ plan: string | null; usedThisPeriod: number; monthlyQuota: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await whoAmI(token)
        setInfo({ plan: res.plan, usedThisPeriod: res.usedThisPeriod, monthlyQuota: res.monthlyQuota, remaining: res.remaining })
      } catch (e) {
        setError('Failed to load account info')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  return (
    <section>
      <h2>Settings</h2>
      <p>Model: Gemini 1.5 Flash (Vertex AI)</p>
      <div style={{ marginBottom: '1rem' }}>
        {user ? (
          <>
            <div>Signed in as {user.email}</div>
            <button onClick={() => signOutUser()}>Sign out</button>
          </>
        ) : (
          <div>Please sign in on the Start page.</div>
        )}
      </div>
      {user && (
        <div>
          <h3>Subscription</h3>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div style={{ color: '#b00' }}>{error}</div>
          ) : info ? (
            <ul>
              <li>Plan: {info.plan ?? 'none'}</li>
              <li>Usage this month: {info.usedThisPeriod} / {info.monthlyQuota}</li>
              <li>Remaining: {info.remaining}</li>
            </ul>
          ) : (
            <div>No subscription info yet.</div>
          )}
        </div>
      )}
    </section>
  )
}

