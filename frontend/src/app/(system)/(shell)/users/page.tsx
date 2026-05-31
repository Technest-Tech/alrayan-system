'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, GraduationCap, UserCheck, ShieldCheck, Search, Plus,
  MoreHorizontal, ExternalLink, PowerOff, Power, Mail, RefreshCw,
  Star, BookOpen, CheckCircle2, XCircle, Clock, ChevronRight,
  Key, Lock, Layers, AlertCircle,
} from 'lucide-react'
import { useStudents } from '@/hooks/system/useStudents'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useSystemUsers, useRoles, useToggleUserActive } from '@/hooks/system/useSystemUsers'
import { useUrlFilters } from '@/lib/system/filters'
import type { Student } from '@/types/system/student'
import type { Teacher } from '@/types/system/teacher'
import type { SystemUser, RoleData, PermissionGroup } from '@/types/system/user'

// ─── constants ───────────────────────────────────────────────────
type Tab = 'all' | 'students' | 'teachers' | 'staff' | 'roles'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'all',      label: 'All',                  icon: <Users size={14} /> },
  { id: 'students', label: 'Students',              icon: <BookOpen size={14} /> },
  { id: 'teachers', label: 'Teachers',              icon: <GraduationCap size={14} /> },
  { id: 'staff',    label: 'Staff',                 icon: <ShieldCheck size={14} /> },
  { id: 'roles',    label: 'Roles & Permissions',   icon: <Key size={14} /> },
]

interface RoleStyle {
  label: string
  bg: string
  color: string
  dot: string
  icon: React.ReactNode
  description: string
}

const ROLE_STYLES: Record<string, RoleStyle> = {
  admin:      { label: 'Admin',      bg: 'rgb(237 233 254)', color: 'rgb(109 40 217)', dot: 'rgb(124 58 237)', icon: <ShieldCheck size={11}/>, description: 'Full system access — can manage all modules, users, and settings.' },
  supervisor: { label: 'Supervisor', bg: 'rgb(255 237 213)', color: 'rgb(194 65 12)',  dot: 'rgb(234 88 12)',  icon: <Star size={11}/>,       description: 'Operational access — manages students, teachers, schedule, and billing.' },
  teacher:    { label: 'Teacher',    bg: 'rgb(219 234 254)', color: 'rgb(29 78 216)',  dot: 'rgb(37 99 235)',  icon: <GraduationCap size={11}/>,description: 'Teaching access — views own students, submits session reports.' },
  student:    { label: 'Student',    bg: 'rgb(209 250 229)', color: 'rgb(6 95 70)',    dot: 'rgb(16 185 129)', icon: <BookOpen size={11}/>,    description: '' },
}

const STUDENT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  trial:     { label: 'Trial',     bg: 'rgb(254 249 195)', color: 'rgb(161 98 7)' },
  active:    { label: 'Active',    bg: 'rgb(220 252 231)', color: 'rgb(22 101 52)' },
  paused:    { label: 'Paused',    bg: 'rgb(255 237 213)', color: 'rgb(154 52 18)' },
  suspended: { label: 'Suspended', bg: 'rgb(254 226 226)', color: 'rgb(153 27 27)' },
  cancelled: { label: 'Cancelled', bg: 'rgb(241 245 249)', color: 'rgb(71 85 105)' },
}

const BRAND = 'rgb(14 124 90)'
const NAVY  = 'rgb(11 31 58)'
const MUTED = 'rgb(90 100 112)'
const BORDER = 'rgb(229 233 240)'

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}
function relativeTime(iso: string | null) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── sub-components ──────────────────────────────────────────────
function Avatar({ name, role, size = 36 }: { name: string; role: string; size?: number }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.student
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, background: style.bg, color: style.color, fontSize: size * 0.35 }}
    >
      {initials(name)}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.student
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.icon}{s.label}
    </span>
  )
}

function StatusBadge({ status, cfg }: { status: string; cfg: Record<string, { label: string; bg: string; color: string }> }) {
  const s = cfg[status] ?? { label: status, bg: 'rgb(241 245 249)', color: 'rgb(71 85 105)' }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: number; sub?: string; accent: string }) {
  return (
    <div
      className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border"
      style={{ background: '#fff', borderColor: BORDER }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none" style={{ color: NAVY }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: MUTED }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5 opacity-60" style={{ color: MUTED }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Dropdown menu ───────────────────────────────────────────────
function RowMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
        style={{ color: MUTED }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl py-1 min-w-44"
          style={{ background: '#fff', borderColor: BORDER }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-black/5 transition-colors text-left"
      style={{ color: danger ? 'rgb(220 38 38)' : NAVY }}
    >
      <span style={{ opacity: 0.6 }}>{icon}</span>{label}
    </button>
  )
}

// ─── Students tab ────────────────────────────────────────────────
function StudentsTab({ q, onQChange }: { q: string; onQChange: (v: string) => void }) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useStudents({ q: q || undefined, status: statusFilter || undefined })
  const students: Student[] = data?.data ?? []

  const STATUS_PILLS = ['', 'trial', 'active', 'paused', 'suspended', 'cancelled']

  return (
    <div>
      {/* status pills */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_PILLS.map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
            style={statusFilter === s
              ? { background: BRAND, color: '#fff', boxShadow: `0 1px 4px color-mix(in srgb, ${BRAND} 40%, transparent)` }
              : { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}` }}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>
      <UserListTable
        rows={students.map(s => ({
          key: `s-${s.id}`,
          name: s.name,
          email: s.email,
          role: 'student',
          statusBadge: <StatusBadge status={s.status} cfg={STUDENT_STATUS} />,
          meta: s.assigned_teacher ? s.assigned_teacher.name : '—',
          metaLabel: 'Teacher',
          lastActive: s.enrolled_at ? relativeTime(s.enrolled_at) : null,
          onClick: () => router.push(`/students/${s.id}`),
          actions: (
            <RowMenu>
              <MenuItem icon={<ExternalLink size={14}/>} label="View profile" onClick={() => router.push(`/students/${s.id}`)} />
            </RowMenu>
          ),
        }))}
        isLoading={isLoading}
        emptyMessage="No students match your filters."
      />
    </div>
  )
}

// ─── Teachers tab ────────────────────────────────────────────────
function TeachersTab({ q, onQChange }: { q: string; onQChange: (v: string) => void }) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const { data, isLoading } = useTeachers({
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active' ? '1' : '0',
    q: q || undefined,
  })
  const teachers: Teacher[] = data?.data ?? []
  const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'Active',   bg: 'rgb(220 252 231)', color: 'rgb(22 101 52)' },
    inactive: { label: 'Inactive', bg: 'rgb(241 245 249)', color: 'rgb(71 85 105)' },
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {['all', 'active', 'inactive'].map(f => (
          <button key={f}
            onClick={() => setActiveFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all capitalize"
            style={activeFilter === f
              ? { background: BRAND, color: '#fff', boxShadow: `0 1px 4px color-mix(in srgb, ${BRAND} 40%, transparent)` }
              : { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}` }}
          >
            {f}
          </button>
        ))}
      </div>
      <UserListTable
        rows={teachers.map(t => ({
          key: `t-${t.id}`,
          name: t.name,
          email: t.email,
          role: 'teacher',
          statusBadge: <StatusBadge status={t.is_active ? 'active' : 'inactive'} cfg={STATUS_CFG} />,
          meta: t.student_count != null ? `${t.student_count} students` : '—',
          metaLabel: 'Load',
          lastActive: t.last_login_at ? relativeTime(t.last_login_at) : null,
          onClick: () => router.push(`/teachers/${t.id}`),
          actions: (
            <RowMenu>
              <MenuItem icon={<ExternalLink size={14}/>} label="View profile" onClick={() => router.push(`/teachers/${t.id}`)} />
            </RowMenu>
          ),
        }))}
        isLoading={isLoading}
        emptyMessage="No teachers found."
      />
    </div>
  )
}

// ─── Staff tab ───────────────────────────────────────────────────
function StaffTab({ q, onQChange }: { q: string; onQChange: (v: string) => void }) {
  const router = useRouter()
  const { data, isLoading } = useSystemUsers({ q: q || undefined })
  const toggle = useToggleUserActive()
  const staff: SystemUser[] = data?.data ?? []
  const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'Active',   bg: 'rgb(220 252 231)', color: 'rgb(22 101 52)' },
    inactive: { label: 'Inactive', bg: 'rgb(254 226 226)', color: 'rgb(153 27 27)' },
    pending:  { label: 'Pending',  bg: 'rgb(254 249 195)', color: 'rgb(161 98 7)' },
  }

  return (
    <UserListTable
      rows={staff.map(u => {
        const statusKey = u.invite_pending ? 'pending' : u.is_active ? 'active' : 'inactive'
        return {
          key: `u-${u.id}`,
          name: u.name,
          email: u.email,
          role: u.role ?? 'admin',
          statusBadge: <StatusBadge status={statusKey} cfg={STATUS_CFG} />,
          meta: `${u.permissions?.length ?? 0} permissions`,
          metaLabel: 'Access',
          lastActive: u.last_login_at ? relativeTime(u.last_login_at) : u.invite_pending ? 'Invite pending' : null,
          onClick: u.teacher_id ? () => router.push(`/teachers/${u.teacher_id}`) : undefined,
          actions: (
            <RowMenu>
              {u.teacher_id && (
                <MenuItem icon={<ExternalLink size={14}/>} label="View teacher profile" onClick={() => router.push(`/teachers/${u.teacher_id}`)} />
              )}
              <MenuItem icon={<Mail size={14}/>} label="Resend invite" onClick={() => {}} />
              <MenuItem
                icon={u.is_active ? <PowerOff size={14}/> : <Power size={14}/>}
                label={u.is_active ? 'Deactivate' : 'Activate'}
                danger={u.is_active}
                onClick={() => toggle.mutate({ id: u.id, active: !u.is_active })}
              />
            </RowMenu>
          ),
        }
      })}
      isLoading={isLoading}
      emptyMessage="No staff users found."
    />
  )
}

// ─── All tab ─────────────────────────────────────────────────────
function AllTab({ q }: { q: string }) {
  const router = useRouter()
  const { data: studentsData, isLoading: sLoading } = useStudents({ q: q || undefined, per_page: 25 })
  const { data: teachersData, isLoading: tLoading } = useTeachers({ q: q || undefined, per_page: 25 })
  const { data: staffData, isLoading: uLoading } = useSystemUsers({ q: q || undefined })
  const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
    ...STUDENT_STATUS,
    active:   { label: 'Active',   bg: 'rgb(220 252 231)', color: 'rgb(22 101 52)' },
    inactive: { label: 'Inactive', bg: 'rgb(241 245 249)', color: 'rgb(71 85 105)' },
    pending:  { label: 'Pending',  bg: 'rgb(254 249 195)', color: 'rgb(161 98 7)' },
  }

  const rows = useMemo(() => {
    const sRows = (studentsData?.data ?? []).map((s: Student) => ({
      key: `s-${s.id}`, name: s.name, email: s.email, role: 'student',
      statusBadge: <StatusBadge status={s.status} cfg={STATUS_CFG} />,
      meta: s.assigned_teacher?.name ?? '—', metaLabel: 'Teacher',
      lastActive: s.enrolled_at ? relativeTime(s.enrolled_at) : null,
      onClick: () => router.push(`/students/${s.id}`),
      actions: <RowMenu><MenuItem icon={<ExternalLink size={14}/>} label="View" onClick={() => router.push(`/students/${s.id}`)} /></RowMenu>,
    }))
    const tRows = (teachersData?.data ?? []).map((t: Teacher) => ({
      key: `t-${t.id}`, name: t.name, email: t.email, role: 'teacher',
      statusBadge: <StatusBadge status={t.is_active ? 'active' : 'inactive'} cfg={STATUS_CFG} />,
      meta: t.student_count != null ? `${t.student_count} students` : '—', metaLabel: 'Load',
      lastActive: t.last_login_at ? relativeTime(t.last_login_at) : null,
      onClick: () => router.push(`/teachers/${t.id}`),
      actions: <RowMenu><MenuItem icon={<ExternalLink size={14}/>} label="View" onClick={() => router.push(`/teachers/${t.id}`)} /></RowMenu>,
    }))
    const uRows = (staffData?.data ?? []).map((u: SystemUser) => ({
      key: `u-${u.id}`, name: u.name, email: u.email, role: u.role ?? 'admin',
      statusBadge: <StatusBadge status={u.invite_pending ? 'pending' : u.is_active ? 'active' : 'inactive'} cfg={STATUS_CFG} />,
      meta: `${u.permissions?.length ?? 0} permissions`, metaLabel: 'Access',
      lastActive: u.last_login_at ? relativeTime(u.last_login_at) : null,
      onClick: u.teacher_id ? () => router.push(`/teachers/${u.teacher_id}`) : undefined,
      actions: <RowMenu><MenuItem icon={<Mail size={14}/>} label="Resend invite" onClick={() => {}} /></RowMenu>,
    }))
    return [...uRows, ...tRows, ...sRows]
  }, [studentsData, teachersData, staffData])

  return (
    <UserListTable
      rows={rows}
      isLoading={sLoading || tLoading || uLoading}
      emptyMessage="No users found."
    />
  )
}

// ─── Shared table ────────────────────────────────────────────────
interface UserRow {
  key: string
  name: string
  email: string
  role: string
  statusBadge: React.ReactNode
  meta?: string
  metaLabel?: string
  lastActive?: string | null
  onClick?: () => void
  actions: React.ReactNode
}

function UserListTable({ rows, isLoading, emptyMessage }: { rows: UserRow[]; isLoading: boolean; emptyMessage: string }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: '#fff' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: BORDER }}>
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-52 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }
  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl border py-16 flex flex-col items-center gap-3"
        style={{ borderColor: BORDER, background: '#fff' }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(241 245 249)', color: MUTED }}>
          <Users size={22} />
        </div>
        <p className="text-sm" style={{ color: MUTED }}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: '#fff' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, background: 'rgb(249 250 251)' }}>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>User</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: MUTED }}>Info</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: MUTED }}>Last Active</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`group border-b last:border-0 transition-colors${row.onClick ? ' cursor-pointer hover:bg-[rgb(249_250_251)]' : ''}`}
              style={{ borderColor: BORDER }}
              onClick={row.onClick}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={row.name} role={row.role} size={36} />
                  <div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: NAVY }}>{row.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{row.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5"><RoleBadge role={row.role} /></td>
              <td className="px-4 py-3.5">{row.statusBadge}</td>
              <td className="px-4 py-3.5 hidden md:table-cell">
                {row.meta && (
                  <div>
                    <p className="text-xs font-medium" style={{ color: NAVY }}>{row.meta}</p>
                    {row.metaLabel && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{row.metaLabel}</p>}
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5 hidden lg:table-cell">
                {row.lastActive
                  ? <span className="text-xs" style={{ color: MUTED }}>{row.lastActive}</span>
                  : <span className="text-xs opacity-30" style={{ color: MUTED }}>—</span>}
              </td>
              <td className="px-2 py-3.5" onClick={e => e.stopPropagation()}>
                {row.actions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Roles & Permissions tab ─────────────────────────────────────
function RolesTab() {
  const { data, isLoading } = useRoles()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const roles = data?.roles ?? []
  const groups: PermissionGroup[] = data?.permission_groups ?? []

  const selectedRoleData = useMemo(
    () => roles.find(r => r.name === selectedRole) ?? null,
    [roles, selectedRole]
  )

  const GROUP_LABELS: Record<string, string> = {
    leads: 'Leads', students: 'Students', teachers: 'Teachers', courses: 'Courses',
    schedule: 'Schedule', sessions: 'Sessions', attendance: 'Attendance', reports: 'Reports',
    makeups: 'Make-ups', quality: 'Quality', invoices: 'Invoices', wallet: 'Wallet',
    payments: 'Payments', payroll: 'Payroll', expenses: 'Expenses', accounting: 'Accounting',
    notifications: 'Notifications', whatsapp: 'WhatsApp', certificates: 'Certificates',
    settings: 'Settings', users: 'Users', audit: 'Audit Log',
    students_notes: 'Student Notes', teachers_notes: 'Teacher Notes',
  }

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
      {/* role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => {
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
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: s?.bg ?? 'rgb(241 245 249)', color: s?.color ?? MUTED }}
                >
                  {s?.icon ?? <ShieldCheck size={18}/>}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgb(241 245 249)', color: MUTED }}
                >
                  {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                </span>
              </div>
              <h3 className="text-sm font-semibold capitalize mb-1" style={{ color: NAVY }}>{role.name}</h3>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                {s?.description ?? 'System role'}
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: s?.color ?? BRAND }}>
                {isSelected ? 'Hide permissions' : 'View permissions'}
                <ChevronRight size={12} className={`transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </button>
          )
        })}
      </div>

      {/* permission matrix */}
      {selectedRoleData && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: BORDER, background: '#fff' }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: BORDER, background: 'rgb(249 250 251)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: ROLE_STYLES[selectedRoleData.name]?.bg, color: ROLE_STYLES[selectedRoleData.name]?.color }}
              >
                {ROLE_STYLES[selectedRoleData.name]?.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold capitalize" style={{ color: NAVY }}>{selectedRoleData.name} permissions</h4>
                <p className="text-xs" style={{ color: MUTED }}>{selectedRoleData.permissions.length} permissions assigned</p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: 'rgb(254 249 195)', background: 'rgb(254 252 232)', color: 'rgb(161 98 7)' }}
            >
              <Lock size={11} /> Permission editing coming soon
            </span>
          </div>

          {/* matrix */}
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
                  const extra = actions.filter(a => !COMMON.includes(a))
                  const hasPerm = (a: string) => selectedRoleData.permissions.includes(`${group}.${a}`)
                  return (
                    <tr key={group} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                      <td className="px-5 py-3 font-medium" style={{ color: NAVY }}>
                        {GROUP_LABELS[group] ?? group}
                      </td>
                      {COMMON.map(action => (
                        <td key={action} className="px-3 py-3 text-center">
                          {actions.includes(action)
                            ? hasPerm(action)
                              ? <CheckCircle2 size={15} className="mx-auto" style={{ color: 'rgb(22 101 52)' }} />
                              : <div className="w-4 h-4 rounded border mx-auto" style={{ borderColor: BORDER }} />
                            : <span className="block text-center opacity-20" style={{ color: MUTED }}>—</span>
                          }
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        {extra.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {extra.map(a => (
                              <span
                                key={a}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                                style={hasPerm(a)
                                  ? { background: 'rgb(220 252 231)', color: 'rgb(22 101 52)' }
                                  : { background: 'rgb(241 245 249)', color: MUTED, opacity: 0.6 }}
                              >
                                {hasPerm(a) && <CheckCircle2 size={9}/>}
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
        <div
          className="rounded-2xl border border-dashed py-12 flex flex-col items-center gap-3"
          style={{ borderColor: BORDER }}
        >
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

// ─── Invite dialog ───────────────────────────────────────────────
function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'supervisor' })
  const [loading, setLoading] = useState(false)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative rounded-2xl border shadow-2xl w-full max-w-md p-6"
        style={{ background: '#fff', borderColor: BORDER }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgb(209 250 229)', color: BRAND }}>
            <Mail size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: NAVY }}>Invite User</h2>
            <p className="text-xs" style={{ color: MUTED }}>They'll receive a setup email</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: NAVY }}>Full name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Sarah Al-Rashidi"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={{ borderColor: BORDER }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: NAVY }}>Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="sarah@academy.com"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={{ borderColor: BORDER }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: NAVY }}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow appearance-none"
              style={{ borderColor: BORDER }}
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-black/5"
            style={{ borderColor: BORDER, color: NAVY }}
          >
            Cancel
          </button>
          <button
            disabled={!form.name || !form.email || loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const { filters, setFilter } = useUrlFilters(['q'])

  const { data: studentsData } = useStudents({ per_page: 100 })
  const { data: teachersData } = useTeachers({ per_page: 100 })
  const { data: staffData    } = useSystemUsers({ per_page: 100 })

  const stats = useMemo(() => ({
    students: studentsData?.meta?.total ?? studentsData?.data?.length ?? 0,
    teachers: teachersData?.meta?.total ?? teachersData?.data?.length ?? 0,
    staff:    staffData?.meta?.total    ?? staffData?.data?.length    ?? 0,
    total:    (studentsData?.meta?.total ?? studentsData?.data?.length ?? 0)
            + (teachersData?.meta?.total ?? teachersData?.data?.length ?? 0)
            + (staffData?.meta?.total    ?? staffData?.data?.length    ?? 0),
  }), [studentsData, teachersData, staffData])

  return (
    <>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(14 124 90), rgb(9 88 64))', color: '#fff' }}
          >
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>Users & Access</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>Manage everyone in the system — students, teachers, and staff.</p>
          </div>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: BRAND }}
        >
          <Plus size={15} />
          Invite User
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users size={18}/>}        label="Total People"  value={stats.total}    accent={NAVY} />
        <StatCard icon={<BookOpen size={18}/>}      label="Students"      value={stats.students}  accent="rgb(6 95 70)" />
        <StatCard icon={<GraduationCap size={18}/>} label="Teachers"      value={stats.teachers}  accent="rgb(29 78 216)" />
        <StatCard icon={<ShieldCheck size={18}/>}   label="Staff"         value={stats.staff}     accent="rgb(109 40 217)" />
      </div>

      {/* ── Tab navigation ───────────────────────────────────── */}
      <div
        className="flex items-center gap-1 p-1 rounded-2xl border mb-5 overflow-x-auto"
        style={{ borderColor: BORDER, background: 'rgb(249 250 251)' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={tab === t.id
              ? { background: '#fff', color: NAVY, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: MUTED }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Search bar (not shown on roles tab) ─────────────── */}
      {tab !== 'roles' && (
        <div className="relative mb-4 max-w-sm">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: NAVY }} />
          <input
            value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            placeholder={`Search ${tab === 'all' ? 'everyone' : tab}…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
            style={{ borderColor: BORDER, background: '#fff' }}
          />
        </div>
      )}

      {/* ── Tab content ──────────────────────────────────────── */}
      {tab === 'all'      && <AllTab q={filters.q} />}
      {tab === 'students' && <StudentsTab q={filters.q} onQChange={v => setFilter('q', v)} />}
      {tab === 'teachers' && <TeachersTab q={filters.q} onQChange={v => setFilter('q', v)} />}
      {tab === 'staff'    && <StaffTab    q={filters.q} onQChange={v => setFilter('q', v)} />}
      {tab === 'roles'    && <RolesTab />}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}
