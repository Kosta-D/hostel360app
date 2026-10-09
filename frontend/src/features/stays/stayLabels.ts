import type { Stay } from '@/api/generated'

export const SOURCE = {
  BOOKING: { label: 'Booking.com', color: 'ink' },
  AIRBNB: { label: 'Airbnb', color: 'rose' },
  DIRECT: { label: 'Direct', color: 'forest' },
} as const
export const LONG_TERM = { label: 'Long term', color: 'clay' } as const

export const STATUS = {
  BOOKED: { label: 'Booked', color: 'gray' },
  CHECKED_IN: { label: 'Checked in', color: 'forest' },
  CHECKED_OUT: { label: 'Checked out', color: 'gray' },
  CANCELLED: { label: 'Cancelled', color: 'red' },
} as const

export const PAYMENT = {
  NOT_PAID: { label: 'Not paid', color: 'red' },
  PARTLY_PAID: { label: 'Partly paid', color: 'orange' },
  PAID: { label: 'Paid', color: 'forest' },
} as const

export const toOptions = (map: Record<string, { label: string }>) =>
  Object.entries(map).map(([value, { label }]) => ({ value, label }))

/** Booking.com / Airbnb / Direct for short stays, Long term otherwise. */
export const stayKind = (s: Pick<Stay, 'longTerm' | 'source'>) => (s.longTerm || !s.source ? LONG_TERM : SOURCE[s.source])
