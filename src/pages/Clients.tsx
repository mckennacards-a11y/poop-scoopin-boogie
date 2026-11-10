import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchClients } from '../lib/data'
import { supabase } from '../lib/supabase'
import { money } from '../lib/schedule'
import { DAYS, STATUS_LABEL, type Client, type Signup } from '../lib/types'

const SIGNUP_PLAN = { weekly: 'Weekly', biweekly: 'Every other week', one_time: 'One-time cleanup' }

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [signups, setSignups] = useState<Signup[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('signups')
      .select('*')
      .eq('handled', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSignups((data as Signup[]) ?? []))
    fetchClients()
      .then(setClients)
      .catch(() => setError('Could not load clients.'))
  }, [])

  const q = query.trim().toLowerCase()
  const shown = clients.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
  )
  const active = clients.filter((c) => c.status === 'active' || c.status === 'payment_issue')
  const monthly = active.reduce((sum, c) => sum + c.price_cents, 0)

  return (
    <main className="page">
      <div className="row between">
        <h1>Clients</h1>
        <Link to="/app/clients/new" className="btn primary small">
          + Add client
        </Link>
      </div>
      <div className="muted">
        {active.length} active · {money(monthly)} a month
      </div>
      <input id="search" type="search" placeholder="Search name or address" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <div className="alert bad">{error}</div>}
      {signups.length > 0 && (
        <section className="card" style={{ borderColor: 'var(--pink)' }}>
          <h2>New sign-ups</h2>
          {signups.map((s) => (
            <div key={s.id} className="stack" style={{ gap: 4 }}>
              <strong>{s.name}</strong>
              <span className="muted">
                {s.address} · {s.dog_count} dog{s.dog_count === 1 ? '' : 's'} · {SIGNUP_PLAN[s.plan]}
              </span>
              <span className="muted">
                {s.phone} · {s.email}
              </span>
              {s.notes && <span className="muted">“{s.notes}”</span>}
              <div className="row">
                <button className="btn small primary" onClick={() => navigate('/app/clients/new', { state: { signup: s } })}>
                  Add as client
                </button>
                {s.phone && (
                  <a className="btn small denim" href={`tel:${s.phone}`}>
                    Call
                  </a>
                )}
                <button
                  className="btn small"
                  onClick={async () => {
                    await supabase.from('signups').update({ handled: true }).eq('id', s.id)
                    setSignups((list) => list.filter((x) => x.id !== s.id))
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {clients.length === 0 && !error && (
        <div className="card flat">
          <h2>No clients yet</h2>
          <div className="muted">Tap “Add client” to put your first yard on the route.</div>
        </div>
      )}
      <section className="stack">
        {shown.map((c) => (
          <Link key={c.id} to={`/app/clients/${c.id}`} className="card flat job">
            <span className="grow stack" style={{ gap: 2 }}>
              <span className="row between">
                <strong>{c.name}</strong>
                <span className={`pill ${c.status}`}>{STATUS_LABEL[c.status]}</span>
              </span>
              <span className="muted">{c.address}</span>
              <span className="muted">
                {c.plan === 'weekly' ? 'Weekly' : 'Every other'} {DAYS[c.service_day]} · {money(c.price_cents)}/mo ·{' '}
                {(c.dogs ?? []).length} dog{(c.dogs ?? []).length === 1 ? '' : 's'}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
