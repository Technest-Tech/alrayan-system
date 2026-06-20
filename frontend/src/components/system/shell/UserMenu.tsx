'use client'
import { useState } from 'react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { useSystemUser } from './SystemShell'
import { logout } from '@/lib/system/auth'
import { useI18n } from '@/lib/system/i18n'

export function UserMenu() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const user = useSystemUser()

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

  async function handleLogout() {
    setOpen(false)
    await logout()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors text-sm font-medium"
      >
        <div className="w-7 h-7 rounded-full bg-[rgb(11,31,58)] text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="hidden sm:block">{user?.name ?? t('shell.account')}</span>
        <ChevronDown size={14} className="opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-52 rounded-xl shadow-lg border z-20 py-1 text-sm"
            style={{
              background:   'rgb(var(--surface-card, 255 255 255))',
              borderColor:  'rgb(var(--border-default, 229 233 240))',
            }}
          >
            <div
              className="px-3 py-2 border-b"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs opacity-50 truncate">{user?.email}</p>
              <p className="text-xs opacity-40 capitalize mt-0.5">{user?.role}</p>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 transition-colors">
              <User size={14} />
              {t('shell.profile')}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 transition-colors text-red-600"
            >
              <LogOut size={14} />
              {t('shell.signOut')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
