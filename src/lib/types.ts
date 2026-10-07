export type ClientStatus = 'active' | 'payment_issue' | 'paused' | 'cancelled'
export type Temperament = 'friendly' | 'shy' | 'jumpy' | 'keep_out'

export interface Dog {
  id: string
  client_id: string
  name: string
  breed: string
  temperament: Temperament
  notes: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  gate_code: string
  access_notes: string
  bag_disposal: 'client_bin' | 'take_away'
  instructions: string
  plan: 'weekly' | 'biweekly'
  service_day: number
  biweekly_anchor: string | null
  price_cents: number
  status: ClientStatus
  payment_issue_since: string | null
  paid_through: string | null
  route_order: number
  dogs?: Dog[]
}

export interface Visit {
  id: string
  client_id: string
  visit_date: string
  status: 'in_progress' | 'complete'
  checklist: Record<string, boolean>
  yard_photo_path: string | null
  gate_photo_path: string | null
  notes: string
  completed_at: string | null
  emailed_at: string | null
  email_error: string | null
}

export interface ClientNote {
  id: string
  client_id: string
  body: string
  created_at: string
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'Active',
  payment_issue: 'Payment issue',
  paused: 'Paused',
  cancelled: 'Cancelled',
}

export const TEMPERAMENT_LABEL: Record<Temperament, string> = {
  friendly: 'Friendly',
  shy: 'Shy',
  jumpy: 'Jumps',
  keep_out: 'Stay out if loose',
}
