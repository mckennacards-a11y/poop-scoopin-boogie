import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'https://example.supabase.co', key ?? 'missing-key', {
  // Look up fetch on every call so the demo build can stand in for the real database.
  global: { fetch: (...args: Parameters<typeof fetch>) => fetch(...args) },
})

export const PHOTO_BUCKET = 'visit-photos'
