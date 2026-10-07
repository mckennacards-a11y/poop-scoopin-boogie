import { describe, expect, it } from 'vitest'
import { isDueOn, weekdayOf } from './schedule'

describe('isDueOn', () => {
  // 2026-10-06 is a Tuesday.
  const tue = '2026-10-06'

  it('knows the weekday', () => {
    expect(weekdayOf(tue)).toBe(2)
  })

  it('puts weekly clients on their day only', () => {
    const c = { status: 'active' as const, plan: 'weekly' as const, service_day: 2, biweekly_anchor: null }
    expect(isDueOn(c, tue)).toBe(true)
    expect(isDueOn(c, '2026-10-07')).toBe(false)
  })

  it('keeps payment-issue clients on the route but drops paused ones', () => {
    const base = { plan: 'weekly' as const, service_day: 2, biweekly_anchor: null }
    expect(isDueOn({ ...base, status: 'payment_issue' }, tue)).toBe(true)
    expect(isDueOn({ ...base, status: 'paused' }, tue)).toBe(false)
    expect(isDueOn({ ...base, status: 'cancelled' }, tue)).toBe(false)
  })

  it('runs biweekly clients every other week from the anchor', () => {
    const c = { status: 'active' as const, plan: 'biweekly' as const, service_day: 2, biweekly_anchor: '2026-09-22' }
    expect(isDueOn(c, tue)).toBe(true)
    expect(isDueOn(c, '2026-10-13')).toBe(false)
    expect(isDueOn(c, '2026-10-20')).toBe(true)
    expect(isDueOn(c, '2026-09-08')).toBe(true)
  })
})
