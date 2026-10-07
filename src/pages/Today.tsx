import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchClients, fetchVisitsOn } from '../lib/data'
import { isDueOn, localDate, mapsDirectionsUrl, weekdayOf } from '../lib/schedule'
import { supabase } from '../lib/supabase'
import { DAYS, type Client, type Visit } from '../lib/types'

export default function Today() {
  const today = localDate()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchClients(), fetchVisitsOn(today)])
      .then(([c, v]) => {
        setClients(c)
        setVisits(v)
      })
      .catch(() => setError('Could not load today’s jobs. Check your signal and pull to refresh.'))
      .finally(() => setLoading(false))
  }, [today])

  const route = useMemo(() => clients.filter((c) => isDueOn(c, today)), [clients, today])
  const callList = clients.filter((c) => c.status === 'paused')
  const visitFor = (id: string) => visits.find((v) => v.client_id === id)
  const doneCount = route.filter((c) => visitFor(c.id)?.status === 'complete').length
  const next = route.find((c) => visitFor(c.id)?.status !== 'complete')

  function goNext() {
    if (!next) return
    window.open(mapsDirectionsUrl(next.address), '_blank', 'noopener')
    navigate(`/job/${next.id}`)
  }

  return (
    <main className="page">
      <header className="header">
        <img src="./logo.png" alt="" />
        <div className="grow">
          <h1>Today’s jobs</h1>
          <div className="sub">
            {DAYS[weekdayOf(today)]} · {doneCount} of {route.length} done
          </div>
        </div>
        <button className="btn small" onClick={() => supabase.auth.signOut()}>
          Log out
        </button>
      </header>

      {error && <div className="alert bad">{error}</div>}

      {callList.length > 0 && (
        <section className="card" style={{ borderColor: 'var(--bad)' }}>
          <h2>Call list</h2>
          <div className="muted">Paused for not paying. Give them a call.</div>
          {callList.map((c) => (
            <div className="row between" key={c.id}>
              <Link to={`/clients/${c.id}`} className="grow">
                {c.name}
              </Link>
              {c.phone && (
                <a className="btn small denim" href={`tel:${c.phone}`}>
                  Call {c.phone}
                </a>
              )}
            </div>
          ))}
        </section>
      )}

      {next ? (
        <button className="btn primary big" onClick={goNext}>
          Next house: {next.name} →
        </button>
      ) : (
        !loading &&
        route.length > 0 && <div className="alert ok">All done for today. Great scoopin’! Spray and rinse your tools.</div>
      )}

      {!loading && route.length === 0 && !error && (
        <div className="card flat">
          <h2>No yards today</h2>
          <div className="muted">Nobody is scheduled for {DAYS[weekdayOf(today)]}. Add clients on the Clients tab.</div>
        </div>
      )}

      <section className="stack">
        {route.map((c, i) => {
          const v = visitFor(c.id)
          return (
            <Link key={c.id} to={`/job/${c.id}`} className={`card job ${v?.status === 'complete' ? 'complete' : ''}`}>
              <span className="num">{v?.status === 'complete' ? '✓' : i + 1}</span>
              <span className="grow stack" style={{ gap: 4 }}>
                <strong>{c.name}</strong>
                <span className="muted">{c.address}</span>
                <span className="row" style={{ gap: 6 }}>
                  {(c.dogs ?? []).map((d) => (
                    <span key={d.id} className="pill dog">
                      {d.name}
                    </span>
                  ))}
                  {c.status === 'payment_issue' && <span className="pill payment_issue">Payment issue</span>}
                  {v?.status === 'in_progress' && <span className="pill doing">In progress</span>}
                </span>
              </span>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
