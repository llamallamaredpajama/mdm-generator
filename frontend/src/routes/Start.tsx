import { useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle, signOutUser } from '../lib/firebase'

export default function Start() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <section>
      <h1>MDM Generator</h1>
      <p style={{ color: '#b00', fontWeight: 600 }}>
        Educational use only. Do not enter PHI. Review carefully before any use.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span>Signed in as {user.email}</span>
            <button onClick={() => signOutUser()}>Sign out</button>
          </>
        ) : (
          <button onClick={async () => {
            try {
              await signInWithGoogle()
            } catch (error) {
              // Error is already handled in signInWithGoogle
              console.error('Sign in cancelled or failed')
            }
          }}>Sign in with Google</button>
        )}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button disabled={!user} onClick={() => navigate('/compose')}>Start composing</button>
      </div>
    </section>
  )
}

