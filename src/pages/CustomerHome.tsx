import { useEffect, useState, type FormEvent } from 'react'
import { money } from '../lib/schedule'
import { PHOTO_BUCKET, supabase } from '../lib/supabase'
import { DAYS, TEMPERAMENT_LABEL, type Client, type Visit } from '../lib/types'

type VisitWithPhotos = Visit & { yardUrl?: string; gateUrl?: string }

const STATUS_TEXT: Record<Client['status'], string> = {
  active: 'Active',
  payment_issue: 'Payment needed',
  paused: 'Paused until payment',
  cancelled: 'Cancelled',
}

export default function CustomerHome() {
  const [client, setClient] = useState<Client | null | undefined>(undefined)
  const [visits, setVisits] = useState<VisitWithPhotos[]>([])
  const [details, setDetails] = useState({ phone: '', gate_code: '', access_notes: '', instructions: '' })
  const [saved, setSaved] = useState('')
  const [billing, setBilling] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('clients')
      .select('*, dogs(*)')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const c = (data as Client) ?? null
        setClient(c)
        if (c) setDetails({ phone: c.phone, gate_code: c.gate_code, access_notes: c.access_notes, instructions: c.instructions })
      })
    supabase
      .from('visits')
      .select('*')
      .eq('status', 'complete')
      .order('visit_date', { ascending: false })
      .limit(6)
      .then(async ({ data }) => {
        const sign = async (path: string | null) =>
          path ? (await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)).data?.signedUrl : undefined
        const list = await Promise.all(
          ((data as Visit[]) ?? []).map(async (v) => ({ ...v, yardUrl: await sign(v.yard_photo_path), gateUrl: await sign(v.gate_photo_path) })),
        )
        setVisits(list)
      })
  }, [])

  async function saveDetails(e: FormEvent) {
    e.preventDefault()
    setSaved('')
    const { error } = await supabase.rpc('update_my_details', {
      p_phone: details.phone,
      p_gate_code: details.gate_code,
      p_access_notes: details.access_notes,
      p_instructions: details.instructions,
    })
    setSaved(error ? 'Could not save. Try again in a minute.' : 'Saved. We’ll use this on your next visit.')
  }

  async function openBilling() {
    setBusy(true)
    setBilling('')
    const { data, error } = await supabase.functions.invoke('billing-portal', {
      body: { return_url: window.location.origin + window.location.pathname },
    })
    setBusy(false)
    if (!error && data?.url) window.location.href = data.url
    else setBilling('Online payments aren’t switched on yet. We’ll text you a payment link.')
  }

  const header = (
    <header className="header">
      <img src="./logo.png" alt="" />
      <div className="grow">
        <h1>{client ? `Hi, ${client.name.split(' ')[0]}!` : 'Welcome!'}</h1>
        <div className="sub">Poop Scoopin’ Boogie</div>
      </div>
      <button className="btn small" onClick={() => supabase.auth.signOut()}>
        Log out
      </button>
    </header>
  )

  if (client === undefined) return <main className="page">{header}</main>

  if (client === null) {
    return (
      <main className="page">
        {header}
        <div className="card">
          <h2>We couldn’t find your account</h2>
          <div>We look you up by the email you logged in with. If you just signed up, we’ll finish setting you up within a day. Otherwise, text us and we’ll fix it.</div>
        </div>
      </main>
    )
  }

  return (
    <main className="page" style={{ paddingBottom: 32 }}>
      {header}

      <section className="card">
        <div className="row between">
          <h2>Your plan</h2>
          <span className={`pill ${client.status}`}>{STATUS_TEXT[client.status]}</span>
        </div>
        <div>
          {client.plan === 'weekly' ? 'Every' : 'Every other'} <strong>{DAYS[client.service_day]}</strong> at {client.address}
        </div>
        <div className="muted">
          {money(client.price_cents)} a month{client.paid_through ? ` · paid through ${client.paid_through}` : ''}
        </div>
        {client.status === 'payment_issue' && <div className="alert warn">Your last payment didn’t go through. Please update your card so service keeps going.</div>}
        {client.status === 'paused' && <div className="alert bad">Service is paused until your payment goes through.</div>}
        <button className="btn primary" onClick={openBilling} disabled={busy}>
          {busy ? 'Opening…' : 'Pay or update card'}
        </button>
        {billing && <div className="alert warn">{billing}</div>}
      </section>

      <section className="card">
        <h2>Recent visits</h2>
        {visits.length === 0 && <div className="muted">Your photos will show up here after your first visit.</div>}
        {visits.map((v) => (
          <div key={v.id} className="stack" style={{ gap: 6 }}>
            <strong>{new Date(v.visit_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
            <div className="grid2">
              {v.yardUrl && <img src={v.yardUrl} alt="Clean yard" style={{ width: '100%', borderRadius: 10, aspectRatio: '4 / 3', objectFit: 'cover' }} />}
              {v.gateUrl && <img src={v.gateUrl} alt="Latched gate" style={{ width: '100%', borderRadius: 10, aspectRatio: '4 / 3', objectFit: 'cover' }} />}
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Your dogs</h2>
        {(client.dogs ?? []).length === 0 && <div className="muted">Text us your dogs’ names so we can say hi.</div>}
        {(client.dogs ?? []).map((d) => (
          <div key={d.id} className="row between">
            <span>
              <strong>{d.name}</strong> {d.breed && <span className="muted">· {d.breed}</span>}
            </span>
            <span className="pill dog">{TEMPERAMENT_LABEL[d.temperament]}</span>
          </div>
        ))}
      </section>

      <form className="card" onSubmit={saveDetails}>
        <h2>Yard access</h2>
        <div className="grid2">
          <label className="field">
            Phone
            <input id="c-phone" type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
          </label>
          <label className="field">
            Gate code
            <input id="c-gate" value={details.gate_code} onChange={(e) => setDetails({ ...details, gate_code: e.target.value })} />
          </label>
        </div>
        <label className="field">
          Which gate / how to get in
          <input id="c-access" value={details.access_notes} onChange={(e) => setDetails({ ...details, access_notes: e.target.value })} />
        </label>
        <label className="field">
          Anything else we should know
          <textarea id="c-instructions" value={details.instructions} onChange={(e) => setDetails({ ...details, instructions: e.target.value })} />
        </label>
        <button className="btn">Save</button>
        {saved && <div className={`alert ${saved.startsWith('Saved') ? 'ok' : 'bad'}`}>{saved}</div>}
      </form>
    </main>
  )
}
