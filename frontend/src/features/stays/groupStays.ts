import type { Stay } from '@/api/generated'
import { today } from '@/shared/dates'

/** Splits stays into what needs attention today, what's coming, and what's done. */
export function groupStays(stays: Stay[], t = today()) {
  const leaving = (s: Stay) => s.status === 'CHECKED_IN' && !!s.checkOut && s.checkOut <= t
  return {
    arriving: stays.filter((s) => s.status === 'BOOKED' && s.checkIn <= t),
    leaving: stays.filter(leaving),
    staying: stays.filter((s) => s.status === 'CHECKED_IN' && !leaving(s)),
    upcoming: stays.filter((s) => s.status === 'BOOKED' && s.checkIn > t),
    history: stays.filter((s) => s.status === 'CHECKED_OUT' || s.status === 'CANCELLED').reverse(),
  }
}
