'use client'
import { useSessionConflicts } from '@/hooks/system/useSessions'
import Link from 'next/link'

export function ConflictBanner() {
  const { data: conflicts } = useSessionConflicts()
  if (!conflicts || conflicts.length === 0) return null

  return (
    <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between text-sm">
      <span className="text-orange-800 font-medium">
        ⚠ {conflicts.length} scheduling conflict{conflicts.length !== 1 ? 's' : ''} detected
      </span>
      <Link href="/schedule/conflicts" className="text-orange-700 underline text-xs">
        View all
      </Link>
    </div>
  )
}
