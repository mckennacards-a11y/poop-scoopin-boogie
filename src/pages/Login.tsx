import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'customer' | 'team'>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    if (mode === 'team') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError('That email and password did not match. Check them and try again.')
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      })
      if (error) setError('We could not send the link. Check the email address and try again in a minute.')
      else setSent(true)
    }
    setBusy(false)
  }

  return (
    <div className="center">
      <form className="login" onSubmit={submit}>
        <img src="./logo.png" alt="Poop Scoopin' Boogie" />
        {mode === 'customer' ? (
          <>
            <h2>Customer login</h2>
            <div className="muted">Enter the email you signed up with and we’ll send you a login link. No password needed.</div>
          </>
        ) : (
          <h2>Team login</h2>
        )}

        {sent ? (
          <div className="alert ok">Check your email for a link from us. Tap it on this phone to log in.</div>
        ) : (
          <>
            <label className="field">
              Email
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {mode === 'team' && (
              <label className="field">
                Password
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            )}
            {error && <div className="alert bad">{error}</div>}
            <button className="btn primary big" disabled={busy}>
              {busy ? 'One moment…' : mode === 'team' ? 'Log in' : 'Email me a login link'}
            </button>
          </>
        )}

        {mode === 'customer' && (
          <div className="muted">
            New here? <Link to="/signup">Sign up for scoopin’</Link>
          </div>
        )}
        <button
          type="button"
          className="btn small"
          onClick={() => {
            setMode(mode === 'team' ? 'customer' : 'team')
            setSent(false)
            setError('')
          }}
        >
          {mode === 'team' ? 'I’m a customer' : 'Team login'}
        </button>
      </form>
    </div>
  )
}
