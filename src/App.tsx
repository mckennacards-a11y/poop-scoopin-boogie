import { useEffect, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from './lib/supabase'
import Login from './pages/Login'
import Today from './pages/Today'
import Job from './pages/Job'
import Clients from './pages/Clients'
import ClientEdit from './pages/ClientEdit'
import Sops from './pages/Sops'
import Signup from './pages/Signup'
import CustomerHome from './pages/CustomerHome'

export default function App() {
  if (!isConfigured) {
    return (
      <div className="center">
        <div className="login">
          <img src="./logo.png" alt="Poop Scoopin' Boogie" />
          <div className="alert warn">The app is not connected to its database yet. Follow the setup steps in SETUP.md.</div>
        </div>
      </div>
    )
  }
  return (
    <HashRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<SignedIn />} />
      </Routes>
    </HashRouter>
  )
}

/** Everything behind a login. Staff get the route app; customers get their own page. */
function SignedIn() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [role, setRole] = useState<'staff' | 'customer' | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    supabase.rpc('is_staff').then(({ data }) => setRole(data === true ? 'staff' : 'customer'))
  }, [userId])

  if (session === undefined) return null
  if (!session) return <Login />
  if (!role) return null
  if (role === 'customer') return <CustomerHome />

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/job/:clientId" element={<Job />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/new" element={<ClientEdit />} />
        <Route path="/clients/:clientId" element={<ClientEdit />} />
        <Route path="/sops" element={<Sops />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/" end>
          <span className="icon" aria-hidden="true">🐾</span>Today
        </NavLink>
        <NavLink to="/clients">
          <span className="icon" aria-hidden="true">🏠</span>Clients
        </NavLink>
        <NavLink to="/sops">
          <span className="icon" aria-hidden="true">🧤</span>SOPs
        </NavLink>
      </nav>
    </div>
  )
}
