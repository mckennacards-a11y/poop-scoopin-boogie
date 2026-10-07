import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClients } from '../lib/data'
import { money } from '../lib/schedule'
import { DAYS, STATUS_LABEL, type Client } from '../lib/types'

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
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
        <Link to="/clients/new" className="btn primary small">
          + Add client
        </Link>
      </div>
      <div className="muted">
        {active.length} active · {money(monthly)} a month
      </div>
      <input id="search" type="search" placeholder="Search name or address" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <div className="alert bad">{error}</div>}
      {clients.length === 0 && !error && (
        <div className="card flat">
          <h2>No clients yet</h2>
          <div className="muted">Tap “Add client” to put your first yard on the route.</div>
        </div>
      )}
      <section className="stack">
        {shown.map((c) => (
          <Link key={c.id} to={`/clients/${c.id}`} className="card flat job">
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
