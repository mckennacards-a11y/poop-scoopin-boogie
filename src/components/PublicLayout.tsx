import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { BUSINESS } from '../lib/business'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { session, role } = useAuth()
  const accountLink = session ? (role === 'staff' ? '/app' : '/account') : '/login'

  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="site-brand">
          <img src="./icon-192.png" alt="" />
          <span>Poop Scoopin’ Boogie</span>
        </Link>
        <nav className="site-nav" aria-label="Site">
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to={accountLink}>{session ? 'My account' : 'Log in'}</NavLink>
          <Link to="/signup" className="btn primary small">
            Sign up
          </Link>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <img src="./logo.png" alt="Poop Scoopin' Boogie" />
        <div>
          <strong>{BUSINESS.name}</strong>
          <div>Dog poop pickup in {BUSINESS.city}</div>
          {BUSINESS.phone && <div>Call or text {BUSINESS.phone}</div>}
          {BUSINESS.email && <div>{BUSINESS.email}</div>}
        </div>
        <nav className="row" aria-label="Footer">
          <Link to="/signup">Sign up</Link>
          <Link to="/faq">FAQ</Link>
          <Link to={accountLink}>{session ? 'My account' : 'Customer login'}</Link>
        </nav>
      </footer>
    </div>
  )
}
