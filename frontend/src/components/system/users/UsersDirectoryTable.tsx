'use client'
import { LayoutGrid, Pencil, Trash2, GraduationCap, Mail, Phone as PhoneIcon, UsersRound, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DirectoryUser, StudentProfile, UserStatus } from '@/types/system/user-directory'
import type { Paginated } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  data: DirectoryUser[]
  meta?: Paginated<DirectoryUser>['meta']
  isLoading: boolean
  perPage: number
  onView: (user: DirectoryUser) => void
  onEdit: (user: DirectoryUser) => void
  onDelete: (user: DirectoryUser) => void
  onPage: (page: number) => void
  onPerPage: (n: number) => void
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'rgb(124 58 237)', supervisor: 'rgb(30 90 171)', quality: 'rgb(14 124 90)',
  teacher: 'rgb(180 83 9)', accountant: 'rgb(67 56 202)', parent: 'rgb(190 24 93)', student: 'rgb(109 40 217)',
}
const STATUS_COLORS: Record<UserStatus, string> = {
  active: 'rgb(11 31 58)', inactive: 'rgb(90 100 112)', suspended: 'rgb(166 39 30)', archived: 'rgb(90 100 112)',
}

const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']
const initials = (name: string) => name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

const studentProfile = (u: DirectoryUser) => (u.role === 'student' ? (u.profile as StudentProfile | null) : null)

export function UsersDirectoryTable({ data, meta, isLoading, perPage, onView, onEdit, onDelete, onPage, onPerPage }: Props) {
  const { t } = useI18n()
  const columns: ColumnDef<DirectoryUser>[] = [
    {
      id: 'name',
      header: t('users.columnName'),
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3">
            {u.photo_url ? (
              <img src={u.photo_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: '1px solid rgb(229 233 240)' }} />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold shrink-0" style={{ background: avatarColor(u.name) }}>
                {initials(u.name)}
              </div>
            )}
            <span className="font-medium truncate">{u.name}</span>
          </div>
        )
      },
    },
    {
      id: 'teachers',
      header: () => <HeaderLabel icon={<GraduationCap size={13} />} label={t('users.columnTeachers')} />,
      enableSorting: false,
      cell: ({ row }) => {
        const t = studentProfile(row.original)?.assigned_teacher?.name
        return t
          ? <span className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full" style={{ background: 'rgb(244 246 250)', color: 'rgb(11 31 58)' }}><GraduationCap size={12} className="opacity-50" />{t}</span>
          : <Dash />
      },
    },
    {
      id: 'email',
      header: () => <HeaderLabel icon={<Mail size={13} />} label={t('users.columnEmail')} />,
      accessorFn: (u) => u.email ?? '',
      cell: ({ row }) => row.original.email
        ? <span className="inline-flex items-center gap-1.5 text-sm"><Mail size={12} className="opacity-40" /><span className="truncate max-w-[200px]">{row.original.email}</span></span>
        : <Dash />,
    },
    {
      id: 'phone',
      header: () => <HeaderLabel icon={<PhoneIcon size={13} />} label={t('users.columnPhone')} />,
      accessorFn: (u) => u.whatsapp ?? u.phone ?? '',
      cell: ({ row }) => (row.original.whatsapp ?? row.original.phone)
        ? <span className="inline-flex items-center gap-1.5 text-sm tabular-nums"><PhoneIcon size={12} className="opacity-40" />{row.original.whatsapp ?? row.original.phone}</span>
        : <Dash />,
    },
    {
      id: 'role',
      header: t('users.columnRole'),
      accessorFn: (u) => u.role,
      cell: ({ row }) => {
        const c = ROLE_COLORS[row.original.role] ?? 'rgb(90 100 112)'
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize border" style={{ color: c, borderColor: `color-mix(in srgb, ${c} 30%, transparent)`, background: `color-mix(in srgb, ${c} 8%, transparent)` }}>
            <CheckCircle2 size={11} /> {row.original.role}
          </span>
        )
      },
    },
    {
      id: 'status',
      header: t('users.columnStatus'),
      accessorFn: (u) => u.status,
      cell: ({ row }) => {
        const c = STATUS_COLORS[row.original.status]
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white capitalize" style={{ background: c }}>
            <CheckCircle2 size={11} /> {row.original.status}
          </span>
        )
      },
    },
    {
      id: 'sections',
      header: () => <HeaderLabel icon={<UsersRound size={13} />} label={t('users.columnSections')} />,
      enableSorting: false,
      cell: ({ row }) => {
        const course = studentProfile(row.original)?.course?.name
        return course
          ? <span className="inline-flex items-center gap-1.5 text-sm"><UsersRound size={12} className="opacity-40" />{course}</span>
          : <Dash />
      },
    },
    {
      id: 'actions',
      header: () => <span className="text-xs">··· {t('users.columnActions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center justify-end gap-1.5">
            <IconBtn onClick={() => onView(u)} label={`View ${u.name}`}><LayoutGrid size={15} /></IconBtn>
            <IconBtn onClick={() => onEdit(u)} label={`Edit ${u.name}`}><Pencil size={15} /></IconBtn>
            <button onClick={() => onDelete(u)} aria-label={`Delete ${u.name}`} className="flex items-center justify-center w-8 h-8 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ background: 'rgb(239 68 68)' }}>
              <Trash2 size={15} />
            </button>
          </div>
        )
      },
    },
  ]

  const total = meta?.total ?? data.length
  const current = meta?.current_page ?? 1
  const last = meta?.last_page ?? 1
  const from = total === 0 ? 0 : (current - 1) * perPage + 1
  const to = Math.min(current * perPage, total)

  const toolbar = (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'rgb(90 100 112)' }}>{t('users.paginationShowing')} {from}–{to} {t('common.of')} {total}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{t('users.paginationRowsPerPage')}</span>
        <Select value={String(perPage)} onValueChange={(v) => onPerPage(Number(v))}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
        emptyState={<EmptyState icon="Users" title={t('users.tableEmpty')} description={t('users.tableEmptyHint')} />}
      />
      {last > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <span style={{ color: 'rgb(90 100 112)' }}>Page {current} of {last}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPage(current - 1)} disabled={current <= 1} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-black/5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <ChevronLeft size={14} /> {t('common.prev')}
            </button>
            <button onClick={() => onPage(current + 1)} disabled={current >= last} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-black/5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              {t('common.next')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
}
function Dash() {
  return <span style={{ color: 'rgb(203 211 222)' }}>—</span>
}
function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex items-center justify-center w-8 h-8 rounded-lg border hover:bg-black/5 transition-colors" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
      {children}
    </button>
  )
}
