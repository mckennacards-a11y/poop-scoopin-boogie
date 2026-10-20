// Opens the Stripe customer portal for the logged-in customer so they can pay,
// update their card, or see invoices.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY   from Stripe > Developers > API keys
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

async function stripe(path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Stripe error')
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!Deno.env.get('STRIPE_SECRET_KEY')) return json({ error: 'not_set_up' }, 503)

  // Look the customer up as themselves, so they only ever find their own record.
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: client } = await asUser
    .from('clients')
    .select('id, name, email, phone, stripe_customer_id')
    .limit(1)
    .maybeSingle()
  if (!client) return json({ error: 'no_account' }, 404)

  const { return_url } = await req.json().catch(() => ({}))

  try {
    let customerId = client.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe('customers', {
        name: client.name,
        email: client.email,
        phone: client.phone,
        'metadata[client_id]': client.id,
      })
      customerId = customer.id as string
      // Customers can't write their own record, so save the Stripe id with the service key.
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await admin.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id)
    }
    const session = await stripe('billing_portal/sessions', {
      customer: customerId,
      return_url: typeof return_url === 'string' && return_url.startsWith('https://') ? return_url : 'https://stripe.com',
    })
    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'stripe_failed' }, 502)
  }
})
