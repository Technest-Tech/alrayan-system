'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadCount, useNotifications, useMarkAllRead } from '@/hooks/system/useNotifications'
import { formatDistanceToNow } from '@/lib/system/date'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unread }        = useUnreadCount()
  const { data: notifications } = useNotifications()
  const markAll                 = useMarkAllRead()

  const count = unread?.count ?? 0
  const items = notifications?.data ?? []

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-80 rounded-xl shadow-lg border z-20 overflow-hidden text-sm"
            style={{
              background:  'rgb(var(--surface-card, 255 255 255))',
              borderColor: 'rgb(var(--border-default, 229 233 240))',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              <span className="font-semibold">Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs opacity-60 hover:opacity-90 transition-opacity"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Bell size={24} className="mb-2 opacity-40" />
                  <p className="text-xs">You&apos;re all caught up.</p>
                </div>
              ) : (
                items.slice(0, 10).map((n) => (
                  <a
                    key={n.id}
                    href={n.link ?? '#'}
                    className={[
                      'block px-4 py-3 border-b hover:bg-black/5 transition-colors',
                      !n.read_at ? 'bg-blue-50/50' : '',
                    ].join(' ')}
                    style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                    onClick={() => setOpen(false)}
                  >
                    <p className="font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs opacity-60 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs opacity-40 mt-1">{formatDistanceToNow(n.created_at)}</p>
                  </a>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
