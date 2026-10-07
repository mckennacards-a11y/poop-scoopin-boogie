import { supabase } from './supabase'
import type { Client, Visit } from './types'

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, dogs(*)')
    .order('route_order')
    .order('name')
  if (error) throw error
  return data as Client[]
}

export async function fetchClient(id: string): Promise<Client> {
  const { data, error } = await supabase.from('clients').select('*, dogs(*)').eq('id', id).single()
  if (error) throw error
  return data as Client
}

export async function fetchVisitsOn(date: string): Promise<Visit[]> {
  const { data, error } = await supabase.from('visits').select('*').eq('visit_date', date)
  if (error) throw error
  return data as Visit[]
}
