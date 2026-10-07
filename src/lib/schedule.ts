import type { Client } from './types'

/** Local calendar date as YYYY-MM-DD (the phone's own time zone). */
export function localDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Is this client on the route for the given date? Paused and cancelled clients never are. */
export function isDueOn(client: Pick<Client, 'status' | 'plan' | 'service_day' | 'biweekly_anchor'>, iso: string): boolean {
  if (client.status === 'paused' || client.status === 'cancelled') return false
  if (weekdayOf(iso) !== client.service_day) return false
  if (client.plan === 'weekly') return true
  if (!client.biweekly_anchor) return true
  const diff = dayNumber(iso) - dayNumber(client.biweekly_anchor)
  return ((diff % 14) + 14) % 14 === 0
}

export function mapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}
