import { Outlet, Link, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-shell">
      <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 700 }}>MDM Generator</Link>
          <NavLink to="/compose">Compose</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

