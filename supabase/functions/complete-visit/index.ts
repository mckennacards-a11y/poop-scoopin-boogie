// Marks a visit complete (only when both photos are in) and emails the customer
// their yard and gate photos from the business Gmail.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   GMAIL_USER          the business Gmail address
//   GMAIL_APP_PASSWORD  a Google "app password" for that account
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // Act as the signed-in scooper so the database's staff-only rules apply.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return json({ ok: false, error: 'Please log in again.' }, 401)

  const { visit_id } = await req.json().catch(() => ({}))
  if (!visit_id) return json({ ok: false, error: 'Missing visit.' }, 400)

  const { data: visit, error: vErr } = await supabase
    .from('visits')
    .select('*, clients(name, email, address)')
    .eq('id', visit_id)
    .single()
  if (vErr || !visit) return json({ ok: false, error: 'Could not find that job.' }, 404)
  if (!visit.yard_photo_path || !visit.gate_photo_path) {
    return json({ ok: false, error: 'Add both the yard and gate photos first.' }, 400)
  }

  if (visit.emailed_at) return json({ ok: true, emailed: true })

  if (visit.status !== 'complete') {
    const { error } = await supabase
      .from('visits')
      .update({ status: 'complete', completed_at: new Date().toISOString(), completed_by: auth.user.id })
      .eq('id', visit_id)
    if (error) return json({ ok: false, error: 'Could not save the job as done.' }, 500)
  }

  const client = visit.clients as { name: string; email: string; address: string }
  if (!client.email) {
    await supabase.from('visits').update({ email_error: 'no email on file' }).eq('id', visit_id)
    return json({ ok: true, emailed: false, email_error: 'no email on file' })
  }

  const user = Deno.env.get('GMAIL_USER')
  const pass = Deno.env.get('GMAIL_APP_PASSWORD')
  if (!user || !pass) {
    await supabase.from('visits').update({ email_error: 'email not set up yet' }).eq('id', visit_id)
    return json({ ok: true, emailed: false, email_error: 'email not set up yet' })
  }

  try {
    const [yard, gate] = await Promise.all(
      [visit.yard_photo_path, visit.gate_photo_path].map(async (path: string) => {
        const { data, error } = await supabase.storage.from('visit-photos').download(path)
        if (error || !data) throw new Error('could not read photos')
        return new Uint8Array(await data.arrayBuffer())
      }),
    )

    const firstName = escapeHtml(client.name.split(' ')[0])
    const when = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })
    const smtp = new SMTPClient({
      connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user, password: pass } },
    })
    await smtp.send({
      from: `Poop Scoopin' Boogie <${user}>`,
      to: client.email,
      subject: 'Your yard is scooped! 🐾',
      content: `Hi ${client.name.split(' ')[0]}, your yard at ${client.address} was scooped at ${when}. Photos of the clean yard and the latched gate are attached. Thanks for scoopin' with us! - Poop Scoopin' Boogie`,
      html: `<p>Hi ${firstName},</p>
<p>Your yard at ${escapeHtml(client.address)} was scooped at ${when}. We attached a photo of the clean yard and one of your gate, closed and latched behind us.</p>
<p>Thanks for scoopin' with us!<br>Poop Scoopin' Boogie</p>`,
      attachments: [
        { filename: 'clean-yard.jpg', content: yard, encoding: 'binary', contentType: 'image/jpeg' },
        { filename: 'latched-gate.jpg', content: gate, encoding: 'binary', contentType: 'image/jpeg' },
      ],
    })
    await smtp.close()
    await supabase.from('visits').update({ emailed_at: new Date().toISOString(), email_error: null }).eq('id', visit_id)
    return json({ ok: true, emailed: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'email failed'
    await supabase.from('visits').update({ email_error: msg }).eq('id', visit_id)
    return json({ ok: true, emailed: false, email_error: msg })
  }
})
