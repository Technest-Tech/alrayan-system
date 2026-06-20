'use client'
import { useState, useMemo, type ReactNode } from 'react'
import { ShieldCheck, Star, GraduationCap, BookOpen, ChevronRight, Lock, CheckCircle2, Layers } from 'lucide-react'
import { useRoles } from '@/hooks/system/useSystemUsers'
import { useI18n } from '@/lib/system/i18n'
import type { PermissionGroup } from '@/types/system/user'

const BRAND = 'rgb(14 124 90)'
const NAVY = 'rgb(11 31 58)'
const MUTED = 'rgb(90 100 112)'
const BORDER = 'rgb(229 233 240)'

interface RoleStyle { bg: string; color: string; dot: string; icon: ReactNode; description: string }

const ROLE_STYLE_BASE: Record<string, Omit<RoleStyle, 'description'>> = {
  admin:      { bg: 'rgb(237 233 254)', color: 'rgb(109 40 217)', dot: 'rgb(124 58 237)', icon: <ShieldCheck size={11} /> },
  supervisor: { bg: 'rgb(255 237 213)', color: 'rgb(194 65 12)',  dot: 'rgb(234 88 12)',  icon: <Star size={11} /> },
  quality:    { bg: 'rgb(204 251 241)', color: 'rgb(15 118 110)', dot: 'rgb(13 148 136)',  icon: <CheckCircle2 size={11} /> },
  teacher:    { bg: 'rgb(219 234 254)', color: 'rgb(29 78 216)',  dot: 'rgb(37 99 235)',  icon: <GraduationCap size={11} /> },
  accountant: { bg: 'rgb(224 231 255)', color: 'rgb(67 56 202)',  dot: 'rgb(79 70 229)',  icon: <Layers size={11} /> },
  parent:     { bg: 'rgb(252 231 243)', color: 'rgb(157 23 77)',  dot: 'rgb(219 39 119)', icon: <BookOpen size={11} /> },
  student:    { bg: 'rgb(209 250 229)', color: 'rgb(6 95 70)',    dot: 'rgb(16 185 129)', icon: <BookOpen size={11} /> },
}

export function UserRolesTab() {
  const { t } = useI18n()
  const { data, isLoading } = useRoles()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const ROLE_STYLES: Record<string, RoleStyle> = {
    ...Object.fromEntries(Object.entries(ROLE_STYLE_BASE).map(([k, v]) => [k, { ...v, description: '' }])),
    admin:      { ...ROLE_STYLE_BASE.admin,      description: t('users.adminDescription') },
    supervisor: { ...ROLE_STYLE_BASE.supervisor, description: t('users.supervisorDescription') },
    quality:    { ...ROLE_STYLE_BASE.quality,    description: t('users.qualityDescription') },
    teacher:    { ...ROLE_STYLE_BASE.teacher,    description: t('users.teacherDescription') },
    accountant: { ...ROLE_STYLE_BASE.accountant, description: t('users.accountantDescription') },
    parent:     { ...ROLE_STYLE_BASE.parent,     description: t('users.parentDescription') },
    student:    { ...ROLE_STYLE_BASE.student,    description: t('users.studentDescription') },
  }

  const GROUP_LABELS: Record<string, string> = {
    leads: t('users.permissions.leads'), students: t('users.permissions.students'),
    teachers: t('users.permissions.teachers'), courses: t('users.permissions.courses'),
    schedule: t('users.permissions.schedule'), sessions: t('users.permissions.sessions'),
    attendance: t('users.permissions.attendance'), reports: t('users.permissions.reports'),
    makeups: t('users.permissions.makeups'), quality: t('users.permissions.quality'),
    invoices: t('users.permissions.invoices'), wallet: t('users.permissions.wallet'),
    payments: t('users.permissions.payments'), payroll: t('users.permissions.payroll'),
    expenses: t('users.permissions.expenses'), accounting: t('users.permissions.accounting'),
    notifications: t('users.permissions.notifications'), whatsapp: t('users.permissions.whatsapp'),
    certificates: t('users.permissions.certificates'), settings: t('users.permissions.settings'),
    users: t('users.permissions.users'), audit: t('users.permissions.auditLog'),
    students_notes: t('users.permissions.studentNotes'), teachers_notes: t('users.permissions.teacherNotes'),
  }

  const roles = data?.roles ?? []
  const groups: PermissionGroup[] = data?.permission_groups ?? []
  const selectedRoleData = useMemo(() => roles.find((r) => r.name === selectedRole) ?? null, [roles, selectedRole])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-6 animate-pulse" style={{ borderColor: BORDER, background: '#fff' }}>
            <div className="w-10 h-10 rounded-xl bg-gray-100 mb-4" />
            <div className="h-4 w-24 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const s = ROLE_STYLES[role.name]
          const isSelected = selectedRole === role.name
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(isSelected ? null : role.name)}
              className="text-left rounded-2xl border p-5 transition-all hover:shadow-md"
              style={{
                borderColor: isSelected ? s?.dot ?? BRAND : BORDER,
                background: isSelected ? `color-mix(in srgb, ${s?.dot ?? BRAND} 4%, white)` : '#fff',
                boxShadow: isSelected ? `0 0 0 2px color-mix(in srgb, ${s?.dot ?? BRAND} 30%, transparent)` : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s?.bg ?? 'rgb(241 245 249)', color: s?.color ?? MUTED }}>
                  {s?.icon ?? <ShieldCheck size={18} />}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgb(241 245 249)', color: MUTED }}>
                  {role.users_count} {role.users_count === 1 ? 'user' : 'users' /* role count */}
                </span>
              </div>
              <h3 className="text-sm font-semibold capitalize mb-1" style={{ color: NAVY }}>{role.name}</h3>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{s?.description ?? 'System role'}</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: s?.color ?? BRAND }}>
                {isSelected ? t('users.hidePermissions') : t('users.viewPermissions')}
                <ChevronRight size={12} className={`transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </button>
          )
        })}
      </div>

      {selectedRoleData && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: '#fff' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER, background: 'rgb(249 250 251)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ROLE_STYLES[selectedRoleData.name]?.bg, color: ROLE_STYLES[selectedRoleData.name]?.color }}>
                {ROLE_STYLES[selectedRoleData.name]?.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold capitalize" style={{ color: NAVY }}>{selectedRoleData.name} {t('users.columnPermissions').toLowerCase()}</h4>
                <p className="text-xs" style={{ color: MUTED }}>{selectedRoleData.permissions.length} {t('users.permissionsAssigned')}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'rgb(254 249 195)', background: 'rgb(254 252 232)', color: 'rgb(161 98 7)' }}>
              <Lock size={11} /> {t('users.permissionComingSoon')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: 'rgb(249 250 251)' }}>
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wide w-44" style={{ color: MUTED }}>Module</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide" style={{ color: MUTED }}>View</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Create</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Edit</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Delete</th>
                  <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Other</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(({ group, actions }) => {
                  const COMMON = ['view', 'create', 'edit', 'delete']
                  const extra = actions.filter((a) => !COMMON.includes(a))
                  const hasPerm = (a: string) => selectedRoleData.permissions.includes(`${group}.${a}`)
                  return (
                    <tr key={group} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                      <td className="px-5 py-3 font-medium" style={{ color: NAVY }}>{GROUP_LABELS[group] ?? group}</td>
                      {COMMON.map((action) => (
                        <td key={action} className="px-3 py-3 text-center">
                          {actions.includes(action)
                            ? hasPerm(action)
                              ? <CheckCircle2 size={15} className="mx-auto" style={{ color: 'rgb(22 101 52)' }} />
                              : <div className="w-4 h-4 rounded border mx-auto" style={{ borderColor: BORDER }} />
                            : <span className="block text-center opacity-20" style={{ color: MUTED }}>—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        {extra.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {extra.map((a) => (
                              <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                                style={hasPerm(a) ? { background: 'rgb(220 252 231)', color: 'rgb(22 101 52)' } : { background: 'rgb(241 245 249)', color: MUTED, opacity: 0.6 }}>
                                {hasPerm(a) && <CheckCircle2 size={9} />}
                                {a.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedRoleData && roles.length > 0 && (
        <div className="rounded-2xl border border-dashed py-12 flex flex-col items-center gap-3" style={{ borderColor: BORDER }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(241 245 249)', color: MUTED }}>
            <Layers size={22} />
          </div>
          <p className="text-sm font-medium" style={{ color: NAVY }}>Select a role to view permissions</p>
          <p className="text-xs" style={{ color: MUTED }}>Click any role card above to see its permission matrix</p>
        </div>
      )}
    </div>
  )
}
