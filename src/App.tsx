import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'
import Home from './pages/Home'
import Faq from './pages/Faq'
import Signup from './pages/Signup'
import Login from './pages/Login'
import CustomerHome from './pages/CustomerHome'
import Today from './pages/Today'
import Job from './pages/Job'
import Clients from './pages/Clients'
import ClientEdit from './pages/ClientEdit'
import Sops from './pages/Sops'

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
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/account" element={<CustomerRoute />} />
          <Route path="/app/*" element={<StaffApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

function LoginRoute() {
  const { session, role } = useAuth()
  if (session && role) return <Navigate to={role === 'staff' ? '/app' : '/account'} replace />
  if (session === undefined || (session && !role)) return null
  return <Login />
}

function CustomerRoute() {
  const { session, role } = useAuth()
  if (session === null) return <Navigate to="/login" replace />
  if (!role) return null
  if (role === 'staff') return <Navigate to="/app" replace />
  return <CustomerHome />
}

/** The route app for you and your mom. */
function StaffApp() {
  const { session, role } = useAuth()
  if (session === null) return <Navigate to="/login" replace />
  if (!role) return null
  if (role !== 'staff') return <Navigate to="/account" replace />

  return (
    <div className="app">
      <Routes>
        <Route index element={<Today />} />
        <Route path="job/:clientId" element={<Job />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<ClientEdit />} />
        <Route path="clients/:clientId" element={<ClientEdit />} />
        <Route path="sops" element={<Sops />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/app" end>
          <span className="icon" aria-hidden="true">🐾</span>Today
        </NavLink>
        <NavLink to="/app/clients">
          <span className="icon" aria-hidden="true">🏠</span>Clients
        </NavLink>
        <NavLink to="/app/sops">
          <span className="icon" aria-hidden="true">🧤</span>SOPs
        </NavLink>
      </nav>
    </div>
  )
}
