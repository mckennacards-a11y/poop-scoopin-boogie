/* eslint-disable @typescript-eslint/no-explicit-any */
// Demo mode (npm run build:demo): sample clients in memory, no real database,
// nothing saved. Stands in for Supabase's REST API, auth, storage and the email function.
import { supabase } from '../lib/supabase'
import { localDate, weekdayOf } from '../lib/schedule'

type Row = Record<string, any>

const today = localDate()
const wd = weekdayOf(today)
const otherDay = (wd + 3) % 7
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDate(d)
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const user = { id: 'demo-riley', email: 'riley@poopscoopinboogie.com', aud: 'authenticated', role: 'authenticated' }

function client(over: Row): Row {
  return {
    id: uid(),
    phone: '(903) 555-0100',
    email: 'customer@example.com',
    gate_code: '',
    access_notes: '',
    bag_disposal: 'client_bin',
    instructions: '',
    plan: 'weekly',
    service_day: wd,
    biweekly_anchor: null,
    price_cents: 8500,
    status: 'active',
    payment_issue_since: null,
    paid_through: localDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
    route_order: 100,
    created_at: new Date().toISOString(),
    ...over,
  }
}

const c1 = client({ name: 'Dana Whitfield', address: '4512 Hollytree Dr, Tyler, TX 75703', gate_code: '1987', access_notes: 'Left side gate, latch sticks', route_order: 10, phone: '(903) 555-0142' })
const c2 = client({ name: 'Marcus Lee', address: '3207 Shiloh Rd, Tyler, TX 75703', instructions: 'Biscuit had diarrhea Monday. Scoop this yard last and spray boots.', route_order: 40, bag_disposal: 'take_away' })
const c3 = client({ name: 'The Ramirez Family', address: '1820 Copeland Rd, Tyler, TX 75701', gate_code: '4400', route_order: 20, status: 'payment_issue', payment_issue_since: daysAgo(3), price_cents: 10000 })
const c4 = client({ name: 'Linda Park', address: '905 S Broadway Ave, Tyler, TX 75701', access_notes: 'Back gate by the garage', route_order: 30, plan: 'biweekly', biweekly_anchor: today, price_cents: 6000 })
const c5 = client({ name: 'Tom Becker', address: '2214 Old Bullard Rd, Tyler, TX 75701', status: 'paused', payment_issue_since: daysAgo(9), phone: '(903) 555-0177' })
const c6 = client({ name: 'Grace Okafor', address: '6610 Old Jacksonville Hwy, Tyler, TX 75703', service_day: otherDay, price_cents: 8500 })

const db: Record<string, Row[]> = {
  clients: [c1, c2, c3, c4, c5, c6],
  dogs: [
    { id: uid(), client_id: c1.id, name: 'Waffles', breed: 'Basset hound', temperament: 'friendly', notes: 'Will follow you around' },
    { id: uid(), client_id: c1.id, name: 'Pickles', breed: 'Beagle', temperament: 'jumpy', notes: '' },
    { id: uid(), client_id: c2.id, name: 'Biscuit', breed: 'Lab mix', temperament: 'friendly', notes: 'Sick this week' },
    { id: uid(), client_id: c3.id, name: 'Duke', breed: 'German shepherd', temperament: 'keep_out', notes: 'Only go in if he is inside' },
    { id: uid(), client_id: c4.id, name: 'Lulu', breed: 'Corgi', temperament: 'shy', notes: '' },
    { id: uid(), client_id: c5.id, name: 'Rocky', breed: 'Boxer', temperament: 'friendly', notes: '' },
    { id: uid(), client_id: c6.id, name: 'Mochi', breed: 'Shih tzu', temperament: 'friendly', notes: '' },
  ],
  visits: [
    { id: uid(), client_id: c1.id, visit_date: daysAgo(7), status: 'complete', checklist: {}, yard_photo_path: 'sample/yard', gate_photo_path: 'sample/gate', notes: '', completed_at: daysAgo(7), emailed_at: daysAgo(7), email_error: null },
  ],
  client_notes: [
    { id: uid(), client_id: c2.id, body: 'Soft stool in back corner, texted Marcus a photo', created_at: new Date(Date.now() - 86_400_000 * 2).toISOString() },
  ],
}

// ---- REST (PostgREST) ----
function parseFilters(params: URLSearchParams) {
  const filters: [string, string][] = []
  params.forEach((v, k) => {
    if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(k)) return
    if (v.startsWith('eq.')) filters.push([k, decodeURIComponent(v.slice(3))])
  })
  return filters
}
const matches = (row: Row, filters: [string, string][]) => filters.every(([k, v]) => String(row[k]) === v)

function embed(table: string, rows: Row[], select: string) {
  if (table === 'clients' && select.includes('dogs(')) {
    return rows.map((r) => ({ ...r, dogs: db.dogs.filter((d) => d.client_id === r.id) }))
  }
  return rows
}

function sortRows(rows: Row[], order: string | null) {
  if (!order) return rows
  const keys = order.split(',').map((o) => {
    const [col, dir] = o.split('.')
    return { col, desc: dir === 'desc' }
  })
  return [...rows].sort((a, b) => {
    for (const { col, desc } of keys) {
      if (a[col] === b[col]) continue
      const r = a[col] > b[col] ? 1 : -1
      return desc ? -r : r
    }
    return 0
  })
}

function reply(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/*' },
  })
}

async function handleRest(url: URL, init: RequestInit): Promise<Response> {
  const table = url.pathname.split('/').pop()!
  const rows = db[table] ?? (db[table] = [])
  const params = url.searchParams
  const filters = parseFilters(params)
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  const wantsObject = (headers.get('Accept') ?? '').includes('vnd.pgrst.object')
  const prefer = headers.get('Prefer') ?? ''

  let result: Row[] = []
  if (method === 'GET' || method === 'HEAD') {
    result = sortRows(rows.filter((r) => matches(r, filters)), params.get('order'))
    const limit = Number(params.get('limit'))
    if (limit) result = result.slice(0, limit)
  } else if (method === 'POST') {
    const body = JSON.parse(String(init.body))
    const items: Row[] = Array.isArray(body) ? body : [body]
    const conflict = params.get('on_conflict')?.split(',')
    for (const item of items) {
      const existing = conflict && rows.find((r) => conflict.every((k) => String(r[k]) === String(item[k])))
      if (existing && prefer.includes('merge-duplicates')) {
        Object.assign(existing, item)
        result.push(existing)
      } else {
        const row = { id: uid(), created_at: new Date().toISOString(), ...defaults(table), ...item }
        rows.push(row)
        result.push(row)
      }
    }
  } else if (method === 'PATCH') {
    const body = JSON.parse(String(init.body))
    result = rows.filter((r) => matches(r, filters))
    result.forEach((r) => Object.assign(r, body))
  } else if (method === 'DELETE') {
    result = rows.filter((r) => matches(r, filters))
    db[table] = rows.filter((r) => !result.includes(r))
  }

  const out = embed(table, result, params.get('select') ?? '*').map((r) => structuredClone(r))
  if (wantsObject) {
    if (out.length !== 1) {
      return reply({ code: 'PGRST116', details: `The result contains ${out.length} rows`, message: 'JSON object requested, multiple (or no) rows returned' }, 406)
    }
    return reply(out[0])
  }
  if (method !== 'GET' && !prefer.includes('return=representation')) return reply(null, 204)
  return reply(out)
}

function defaults(table: string): Row {
  if (table === 'visits') return { status: 'in_progress', checklist: {}, yard_photo_path: null, gate_photo_path: null, notes: '', completed_at: null, emailed_at: null, email_error: null }
  return {}
}

const realFetch = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  if (url.pathname.startsWith('/rest/v1/')) return handleRest(url, init)
  return realFetch(input, init)
}

// ---- Auth ----
const session: any = { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 3600, expires_at: 9_999_999_999, user }
let current: any = session
const listeners: ((event: string, s: any) => void)[] = []
const auth = supabase.auth as any
auth.getSession = async () => ({ data: { session: current }, error: null })
auth.getUser = async () => ({ data: { user: current?.user ?? null }, error: null })
auth.onAuthStateChange = (cb: (event: string, s: any) => void) => {
  listeners.push(cb)
  return { data: { subscription: { unsubscribe() {} } } }
}
auth.signInWithPassword = async () => {
  current = session
  listeners.forEach((cb) => cb('SIGNED_IN', current))
  return { data: { session: current, user }, error: null }
}
auth.signOut = async () => {
  current = null
  listeners.forEach((cb) => cb('SIGNED_OUT', null))
  return { error: null }
}

// ---- Photo storage ----
const SAMPLE_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#7fae5a"/><rect y="210" width="400" height="90" fill="#6a9a48"/><text x="200" y="160" font-family="sans-serif" font-size="28" fill="#fff" text-anchor="middle">Sample photo</text></svg>',
  )
const photos = new Map<string, string>()
;(supabase.storage as any).from = () => ({
  upload: async (path: string, blob: Blob) => {
    photos.set(path, URL.createObjectURL(blob))
    return { data: { path }, error: null }
  },
  createSignedUrl: async (path: string) => ({ data: { signedUrl: photos.get(path) ?? SAMPLE_PHOTO }, error: null }),
})

// ---- Complete-job email ----
;(supabase.functions as any).invoke = async (_name: string, opts: { body: { visit_id: string } }) => {
  const visit = db.visits.find((v) => v.id === opts.body.visit_id)
  if (!visit?.yard_photo_path || !visit?.gate_photo_path) return { data: { ok: false, error: 'Add both the yard and gate photos first.' }, error: null }
  Object.assign(visit, { status: 'complete', completed_at: new Date().toISOString(), emailed_at: new Date().toISOString() })
  return { data: { ok: true, emailed: true }, error: null }
}

// ---- Banner ----
const banner = document.createElement('div')
banner.textContent = 'Demo with sample clients. Nothing is saved and no emails are sent.'
banner.setAttribute(
  'style',
  'background:#4f7385;color:#fff;font:700 13px/1.3 Nunito,system-ui,sans-serif;text-align:center;padding:8px 16px;padding-top:calc(8px + env(safe-area-inset-top,0px))',
)
document.body.prepend(banner)
