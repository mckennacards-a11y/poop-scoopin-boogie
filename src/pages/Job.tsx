import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchClient } from '../lib/data'
import { compressPhoto } from '../lib/photos'
import { localDate, mapsDirectionsUrl } from '../lib/schedule'
import { ARRIVAL_CHECKLIST, FINISH_CHECKLIST } from '../lib/sop'
import { PHOTO_BUCKET, supabase } from '../lib/supabase'
import { TEMPERAMENT_LABEL, type Client, type Visit } from '../lib/types'

type PhotoKind = 'yard' | 'gate'

export default function Job() {
  const { clientId } = useParams()
  const today = localDate()
  const [client, setClient] = useState<Client | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [previews, setPreviews] = useState<Record<PhotoKind, string>>({ yard: '', gate: '' })
  const [uploading, setUploading] = useState<PhotoKind | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  useEffect(() => {
    if (!clientId) return
    fetchClient(clientId).then(setClient).catch(() => setError('Could not load this client.'))
    supabase
      .from('visits')
      .select('*')
      .eq('client_id', clientId)
      .eq('visit_date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVisit(data as Visit)
      })
  }, [clientId, today])

  // Show photos already uploaded for this visit (for example after a refresh).
  useEffect(() => {
    if (!visit) return
    ;(['yard', 'gate'] as PhotoKind[]).forEach(async (kind) => {
      const path = kind === 'yard' ? visit.yard_photo_path : visit.gate_photo_path
      if (!path || previews[kind]) return
      const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)
      if (data) setPreviews((p) => ({ ...p, [kind]: data.signedUrl }))
    })
  }, [visit?.yard_photo_path, visit?.gate_photo_path])

  async function startJob() {
    if (!client) return
    setBusy(true)
    setError('')
    const { data: user } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('visits')
      .upsert(
        { client_id: client.id, visit_date: today, started_by: user.user?.id },
        { onConflict: 'client_id,visit_date', ignoreDuplicates: false },
      )
      .select()
      .single()
    if (error) setError('Could not start the job. Check your signal and try again.')
    else setVisit(data as Visit)
    setBusy(false)
  }

  async function toggle(key: string, value: boolean) {
    if (!visit) return
    const checklist = { ...visit.checklist, [key]: value }
    setVisit({ ...visit, checklist })
    await supabase.from('visits').update({ checklist }).eq('id', visit.id)
  }

  async function onPhoto(kind: PhotoKind, file: File | undefined) {
    if (!file || !visit) return
    setUploading(kind)
    setError('')
    try {
      const blob = await compressPhoto(file)
      const path = `${visit.id}/${kind}-${Date.now()}.jpg`
      const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
      if (up.error) throw up.error
      const field = kind === 'yard' ? 'yard_photo_path' : 'gate_photo_path'
      const { error } = await supabase.from('visits').update({ [field]: path }).eq('id', visit.id)
      if (error) throw error
      setVisit({ ...visit, [field]: path })
      setPreviews((p) => ({ ...p, [kind]: URL.createObjectURL(blob) }))
    } catch {
      setError('That photo did not upload. Check your signal and take it again.')
    } finally {
      setUploading(null)
    }
  }

  async function complete() {
    if (!visit) return
    setBusy(true)
    setError('')
    const { data, error } = await supabase.functions.invoke('complete-visit', { body: { visit_id: visit.id } })
    setBusy(false)
    if (error || !data?.ok) {
      setError(data?.error ?? 'Could not complete the job. Check your signal and try again.')
      return
    }
    setVisit({ ...visit, status: 'complete', emailed_at: data.emailed ? new Date().toISOString() : null })
    setResult(
      data.emailed
        ? `Done! ${client?.name} was emailed their yard and gate photos.`
        : `Job marked done, but the email did not send (${data.email_error ?? 'no email on file'}).`,
    )
  }

  if (!client) return <main className="page">{error ? <div className="alert bad">{error}</div> : null}</main>

  const checks = visit?.checklist ?? {}
  const arrived = ARRIVAL_CHECKLIST.every((c) => checks[c.key])
  const finished = FINISH_CHECKLIST.every((c) => checks[c.key])
  const hasPhotos = Boolean(visit?.yard_photo_path && visit?.gate_photo_path)
  const isComplete = visit?.status === 'complete'

  return (
    <main className="page">
      <div className="row between">
        <Link to="/" className="btn small">
          ← Today
        </Link>
        {client.status === 'payment_issue' && <span className="pill payment_issue">Payment issue</span>}
      </div>

      <section className="card">
        <h1>{client.name}</h1>
        <div>{client.address}</div>
        <a className="btn denim" href={mapsDirectionsUrl(client.address)} target="_blank" rel="noopener">
          Open in Google Maps
        </a>
        <dl className="kv">
          {client.gate_code && (
            <>
              <dt>Gate code</dt>
              <dd className="gate-code">{client.gate_code}</dd>
            </>
          )}
          {client.access_notes && (
            <>
              <dt>Access</dt>
              <dd>{client.access_notes}</dd>
            </>
          )}
          <dt>Bags</dt>
          <dd>{client.bag_disposal === 'client_bin' ? 'In the client’s trash bin' : 'Take them with you'}</dd>
          {client.phone && (
            <>
              <dt>Phone</dt>
              <dd>
                <a href={`sms:${client.phone}`}>{client.phone}</a>
              </dd>
            </>
          )}
        </dl>
        {client.instructions && <div className="alert warn">{client.instructions}</div>}
      </section>

      <section className="card">
        <h2>Dogs</h2>
        {(client.dogs ?? []).length === 0 && <div className="muted">No dogs listed.</div>}
        {(client.dogs ?? []).map((d) => (
          <div key={d.id} className="row between">
            <div className="grow">
              <strong>{d.name}</strong> {d.breed && <span className="muted">· {d.breed}</span>}
              {d.notes && <div className="muted">{d.notes}</div>}
            </div>
            <span className={`pill ${d.temperament === 'keep_out' ? 'paused' : 'dog'}`}>{TEMPERAMENT_LABEL[d.temperament]}</span>
          </div>
        ))}
      </section>

      {!visit && (
        <button className="btn primary big" onClick={startJob} disabled={busy}>
          I’m here, start job
        </button>
      )}

      {visit && !isComplete && (
        <>
          <section className="card">
            <h2>1. Before you go in</h2>
            {ARRIVAL_CHECKLIST.map((c) => (
              <label className="check" key={c.key}>
                <input id={`chk-${c.key}`} type="checkbox" checked={!!checks[c.key]} onChange={(e) => toggle(c.key, e.target.checked)} />
                {c.label}
              </label>
            ))}
          </section>

          <section className="card" aria-disabled={!arrived} style={{ opacity: arrived ? 1 : 0.5 }}>
            <h2>2. Scoop, then wrap up</h2>
            {FINISH_CHECKLIST.map((c) => (
              <label className="check" key={c.key}>
                <input
                  id={`chk-${c.key}`}
                  type="checkbox"
                  disabled={!arrived}
                  checked={!!checks[c.key]}
                  onChange={(e) => toggle(c.key, e.target.checked)}
                />
                {c.label}
              </label>
            ))}
          </section>

          <section className="card" style={{ opacity: arrived ? 1 : 0.5 }}>
            <h2>3. Photos</h2>
            <div className="muted">Both photos go to the customer. The job can’t be completed without them.</div>
            {(['yard', 'gate'] as PhotoKind[]).map((kind) => {
              const filled = kind === 'yard' ? visit.yard_photo_path : visit.gate_photo_path
              return (
                <label key={kind} className={`photo-slot ${filled ? 'filled' : ''}`}>
                  <strong>{kind === 'yard' ? 'Clean yard' : 'Latched gate'}</strong>
                  {previews[kind] && <img src={previews[kind]} alt={kind === 'yard' ? 'Clean yard' : 'Latched gate'} />}
                  <input
                    id={`photo-${kind}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={!arrived || uploading !== null}
                    onChange={(e) => onPhoto(kind, e.target.files?.[0])}
                  />
                  <span className="btn">
                    {uploading === kind ? 'Uploading…' : filled ? 'Retake photo' : 'Take photo'}
                  </span>
                </label>
              )
            })}
          </section>

          {error && <div className="alert bad">{error}</div>}

          <button className="btn primary big" onClick={complete} disabled={!arrived || !finished || !hasPhotos || busy}>
            {busy ? 'Sending…' : 'Complete job & email customer'}
          </button>
          {!(arrived && finished && hasPhotos) && (
            <div className="muted" style={{ textAlign: 'center' }}>
              Tick every box and add both photos to finish.
            </div>
          )}
        </>
      )}

      {isComplete && (
        <>
          <div className={`alert ${result.startsWith('Job marked') ? 'warn' : 'ok'}`}>
            {result || (visit?.emailed_at ? 'Done and emailed.' : 'Done.')}
          </div>
          <Link to="/" className="btn primary big">
            Back to route
          </Link>
        </>
      )}
    </main>
  )
}
