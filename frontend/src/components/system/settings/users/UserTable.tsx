'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import {
  useUsers,
  useDeactivateUser,
  useActivateUser,
  useResendInvite,
  type SystemUserRecord,
} from '@/hooks/system/useUsers'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { EditUserSheet } from './EditUserSheet'
import { ApiError } from '@/lib/system/api'

const ROLE_COLORS: Record<string, string> = {
  admin:      'text-purple-600 bg-purple-50',
  supervisor: 'text-blue-600 bg-blue-50',
  teacher:    'text-amber-600 bg-amber-50',
}

export function UserTable() {
  const me          = useSystemUser()
  const { data, isLoading } = useUsers()
  const deactivate  = useDeactivateUser()
  const activate    = useActivateUser()
  const resend      = useResendInvite()
  const [editing, setEditing] = useState<SystemUserRecord | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const users = data?.data ?? []

  async function handleDeactivate(user: SystemUserRecord) {
    setMenuOpen(null)
    try {
      await deactivate.mutateAsync(user.id)
      toast.success(`${user.name} deactivated.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong.')
    }
  }

  async function handleActivate(user: SystemUserRecord) {
    setMenuOpen(null)
    try {
      await activate.mutateAsync(user.id)
      toast.success(`${user.name} reactivated.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong.')
    }
  }

  async function handleResend(user: SystemUserRecord) {
    setMenuOpen(null)
    try {
      await resend.mutateAsync(user.id)
      toast.success(`Invite resent to ${user.email}.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong.')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 border-b bg-black/5 animate-pulse" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-xs font-semibold uppercase tracking-wide opacity-50"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Permissions</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0 hover:bg-black/5 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
              >
                <td className="px-5 py-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs opacity-50">{user.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[user.role] ?? ''}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3 opacity-60">
                  {user.role === 'admin'
                    ? 'All'
                    : user.role === 'teacher'
                    ? '—'
                    : `${user.permissions?.length ?? 0} of ${Object.values({}).length}`}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 relative">
                  <button
                    onClick={() => setMenuOpen((v) => (v === user.id ? null : user.id))}
                    className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {menuOpen === user.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div
                        className="absolute right-4 top-full mt-1 w-40 rounded-xl shadow-lg border z-20 py-1 text-sm"
                        style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                      >
                        <button
                          onClick={() => { setEditing(user); setMenuOpen(null) }}
                          className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResend(user)}
                          className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors"
                        >
                          Resend invite
                        </button>
                        {user.is_active ? (
                          <button
                            onClick={() => handleDeactivate(user)}
                            disabled={me?.id === user.id}
                            className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user)}
                            className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors text-green-600"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-16 text-center opacity-40 text-sm">No users yet.</div>
        )}
      </div>

      {editing && <EditUserSheet user={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
