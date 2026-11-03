import { toast } from 'sonner'
import { ApiError } from '@/lib/system/api'

/** "12.50" → 1250. NaN when the text isn't a number, so callers can refuse it. */
export function toMinor(amount: string): number {
  return Math.round(parseFloat(amount) * 100)
}

export function fromMinor(minor: number | null | undefined): string {
  return minor == null ? '' : (minor / 100).toFixed(2)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today on the user's own calendar — toISOString() would give the UTC date. */
export function todayIso(): string {
  return isoDate(new Date())
}

export function currentMonth(): string {
  return todayIso().slice(0, 7)
}

/** First and last day of the month `offset` months from now. */
export function monthBounds(offset = 0): { from: string; to: string } {
  const now = new Date()
  return {
    from: isoDate(new Date(now.getFullYear(), now.getMonth() + offset, 1)),
    to:   isoDate(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)),
  }
}

/** Show a failed request's validation messages, or a fallback when it has none. */
export function toastApiError(e: unknown, fallback: string): void {
  if (e instanceof ApiError && e.errors) {
    Object.values(e.errors).flat().forEach(m => toast.error(String(m)))
    return
  }
  toast.error(e instanceof ApiError ? e.message : fallback)
}
