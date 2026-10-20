import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PLANS = [
  { value: 'weekly', label: 'Weekly', price: 'from $85/month' },
  { value: 'biweekly', label: 'Every other week', price: 'from $60/month' },
  { value: 'one_time', label: 'One-time cleanup', price: 'from $60' },
] as const

export default function Signup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', dog_count: 1, plan: 'weekly', notes: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.from('signups').insert({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    })
    setBusy(false)
    if (error) setError('Something went wrong sending your info. Check each field and try again.')
    else setDone(true)
  }

  return (
    <main className="page" style={{ paddingBottom: 32 }}>
      <header className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src="./logo.png" alt="Poop Scoopin' Boogie" style={{ width: 180 }} />
        <h1>Let us do the dirty work</h1>
        <div className="muted">Weekly dog poop pickup in Tyler, TX. You get a photo of your clean yard and latched gate after every visit.</div>
      </header>

      {done ? (
        <section className="card">
          <h2>Thanks, {form.name.split(' ')[0]}!</h2>
          <div>We got your info and will call or text you within a day to set up your first visit.</div>
          <Link to="/" className="btn">
            Customer login
          </Link>
        </section>
      ) : (
        <form className="stack" onSubmit={submit}>
          <section className="card">
            <h2>Pick a plan</h2>
            {PLANS.map((p) => (
              <label key={p.value} className="check">
                <input id={`plan-${p.value}`} type="radio" name="plan" checked={form.plan === p.value} onChange={() => set('plan', p.value)} />
                <span className="grow">
                  {p.label} <span className="muted">· {p.price}</span>
                </span>
              </label>
            ))}
            <label className="field">
              How many dogs?
              <select id="dog_count" value={form.dog_count} onChange={(e) => set('dog_count', Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n === 6 ? '6 or more' : n}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="card">
            <h2>Your info</h2>
            <label className="field">
              Name
              <input id="su-name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </label>
            <div className="grid2">
              <label className="field">
                Phone
                <input id="su-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
              </label>
              <label className="field">
                Email
                <input id="su-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </label>
            </div>
            <label className="field">
              Address
              <input
                id="su-address"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="123 Oak St, Tyler, TX"
                required
              />
            </label>
            <label className="field">
              Anything we should know? (gate, dog names, sick pups)
              <textarea id="su-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={1000} />
            </label>
          </section>

          {error && <div className="alert bad">{error}</div>}
          <button className="btn primary big" disabled={busy}>
            {busy ? 'Sending…' : 'Sign me up'}
          </button>
          <div className="muted" style={{ textAlign: 'center' }}>
            Already a customer? <Link to="/">Log in</Link>
          </div>
        </form>
      )}
    </main>
  )
}
