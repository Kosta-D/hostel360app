import type { Stay } from '@/api/generated'
import { addDays, fmtDate, fmtMonth } from '@/shared/dates'

/** "10.1.2030 → 13.1.2030 · 3 nights" or "Oct 2026 → Mar 2027" / "Oct 2026 → indefinite". */
export function stayPeriod(s: Stay) {
  if (!s.longTerm) return `${fmtDate(s.checkIn)} → ${s.checkOut ? fmtDate(s.checkOut) : '?'}${s.nights ? ` · ${s.nights} night${s.nights > 1 ? 's' : ''}` : ''}`
  return `${fmtMonth(s.checkIn)} → ${s.checkOut ? fmtMonth(addDays(s.checkOut, -1)) : 'indefinite'}`
}
