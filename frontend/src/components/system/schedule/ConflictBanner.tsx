'use client'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSessionConflicts } from '@/hooks/system/useSessions'

export function ConflictBanner() {
  const { data: conflicts } = useSessionConflicts()
  if (!conflicts || conflicts.length === 0) return null

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'rgb(234 88 12 / 0.07)', border: '1px solid rgb(234 88 12 / 0.22)' }}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: 'rgb(234 88 12 / 0.12)' }}>
          <AlertTriangle size={13} style={{ color: 'rgb(194 65 12)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgb(154 52 18)' }}>
          {conflicts.length} scheduling conflict{conflicts.length !== 1 ? 's' : ''} detected
        </p>
      </div>
      <Link
        href="/schedule/conflicts"
        className="flex items-center gap-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70"
        style={{ color: 'rgb(194 65 12)' }}
      >
        Review <ArrowRight size={12} />
      </Link>
    </div>
  )
}
