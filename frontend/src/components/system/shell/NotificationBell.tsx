'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Bell, UserCheck, Wallet, PackageCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUnreadCount, useNotifications, useMarkSeen } from '@/hooks/system/useNotifications'
import { formatDistanceToNow } from '@/lib/system/date'
import { notificationText } from '@/lib/system/notificationText'
import { useI18n } from '@/lib/system/i18n'

const TYPE_ICON: Record<string, LucideIcon> = {
  'teacher.student_assigned':  UserCheck,
  'teacher.package_paid':      Wallet,
  'teacher.package_completed': PackageCheck,
}

export function NotificationBell() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { data: unread } = useUnreadCount()

  const count = unread?.count ?? 0

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
        title={t('shell.notifications')}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  )
}

/**
 * Mounted only while the dropdown is open: opening it reads the inbox (the badge clears), and
 * the items that were unread stay highlighted until it closes.
 */
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { data: notifications } = useNotifications()
  const fresh = useMarkSeen()

  const items = notifications?.data ?? []

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
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
          <span className="font-semibold">{t('shell.notifications')}</span>
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-xs opacity-60 hover:opacity-90 transition-opacity"
          >
            {t('shell.viewAll')}
          </Link>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Bell size={24} className="mb-2 opacity-40" />
              <p className="text-xs">{t('shell.allCaughtUp')}</p>
            </div>
          ) : (
            items.slice(0, 10).map((n) => {
              const { title, body } = notificationText(n, t)
              const Icon = TYPE_ICON[n.type] ?? Bell
              const isNew = !n.read_at || fresh.has(n.id)
              return (
                <Link
                  key={n.id}
                  href={n.link ?? '/notifications'}
                  className={[
                    'flex items-start gap-3 px-4 py-3 border-b hover:bg-black/5 transition-colors',
                    isNew ? 'bg-blue-50/50' : '',
                  ].join(' ')}
                  style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                  onClick={onClose}
                >
                  <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-teal-50 text-teal-600">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug">{title}</span>
                    {body && <span className="block text-xs opacity-60 mt-0.5 line-clamp-2">{body}</span>}
                    <span className="block text-xs opacity-40 mt-1">{formatDistanceToNow(n.created_at)}</span>
                  </span>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
