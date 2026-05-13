import type { DashboardActivity } from '@/hooks/system/useDashboard'
import { formatDistanceToNow } from '@/lib/system/date'
import { Activity } from 'lucide-react'

interface Props {
  items:   DashboardActivity[]
  loading: boolean
}

export function RecentActivity({ items, loading }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
    >
      <div
        className="px-5 py-3 border-b font-semibold text-sm"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
      >
        Recent activity
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-5 rounded-lg bg-black/5 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-40 gap-2">
          <Activity size={20} />
          <p className="text-xs">No activity yet.</p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          {items.map((a, i) => (
            <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{a.text}</span>
              <span className="text-xs opacity-40 shrink-0 ml-4">{formatDistanceToNow(a.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
