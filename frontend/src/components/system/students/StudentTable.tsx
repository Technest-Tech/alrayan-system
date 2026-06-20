'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, ExternalLink, Pencil, MessageCircle,
  PauseCircle, PlayCircle, XCircle, Rows3, Download, Baby,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Student, StudentStatus } from '@/types/system/student'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { StudentStatusBadge } from './StudentStatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useStudentTransition } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

type Density = 'compact' | 'default' | 'comfortable'

/* ─── Avatar helpers ──────────────────────────── */
const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ─── Row action menu ─────────────────────────── */
const TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  trial:     ['cancelled'],
  active:    ['paused', 'suspended', 'cancelled'],
  paused:    ['active', 'cancelled'],
  suspended: ['active', 'cancelled'],
  cancelled: [],
}

const ACTION_KEYS: Partial<Record<StudentStatus, string>> = {
  active:    'common.activate',
  paused:    'status.paused',
  suspended: 'status.suspended',
  cancelled: 'students.contextCancelEnrolment',
}

const ACTION_ICONS: Partial<Record<StudentStatus, React.ReactNode>> = {
  active:    <PlayCircle size={14} />,
  paused:    <PauseCircle size={14} />,
  suspended: <PauseCircle size={14} />,
  cancelled: <XCircle size={14} />,
}

interface ActionPos { top: number; right: number }

function StudentRowActions({ student }: { student: Student }) {
  const router    = useRouter()
  const { t }     = useI18n()
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState<ActionPos>({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const transition = useStudentTransition(student.id)
  const allowed = TRANSITIONS[student.status] ?? []

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  async function doTransition(to: StudentStatus) {
    setOpen(false)
    try {
      await transition.mutateAsync({ to })
      toast.success(`Student moved to ${to}.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed.')
    }
  }

  const dropdown = open ? createPortal(
    <div
      className="fixed z-[9999] min-w-[188px] rounded-xl border shadow-lg overflow-hidden py-1"
      style={{
        top: pos.top,
        right: pos.right,
        background: '#fff',
        borderColor: 'rgb(var(--border-default,229 233 240))',
        boxShadow: '0 8px 30px rgb(11 31 58 / 0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem
        icon={<ExternalLink size={14} />}
        label={t('students.contextViewProfile')}
        onClick={() => { setOpen(false); router.push(`/students/${student.id}`) }}
      />
      <MenuItem
        icon={<Pencil size={14} />}
        label={t('students.contextEdit')}
        onClick={() => { setOpen(false); router.push(`/students/${student.id}`) }}
      />
      {student.whatsapp && (
        <MenuItem
          icon={<MessageCircle size={14} />}
          label={t('students.contextWhatsApp')}
          onClick={() => {
            setOpen(false)
            window.open(`https://wa.me/${student.whatsapp!.replace(/\D/g, '')}`, '_blank')
          }}
        />
      )}

      {allowed.length > 0 && (
        <>
          <div className="my-1 border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
          {allowed.map((to) => (
            <MenuItem
              key={to}
              icon={ACTION_ICONS[to]}
              label={ACTION_KEYS[to] ? t(ACTION_KEYS[to]!) : `${t('students.contextMoveTo')} ${to}`}
              onClick={() => doTransition(to)}
              danger={to === 'cancelled'}
            />
          ))}
        </>
      )}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 rounded-lg transition-colors hover:bg-black/5 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
        style={{ color: 'rgb(90 100 112)' }}
        aria-label="Row actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {dropdown}
    </>
  )
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors hover:bg-black/[0.03]"
      style={{ color: danger ? 'rgb(166 39 30)' : 'rgb(11 31 58)' }}
    >
      <span className="opacity-60">{icon}</span>
      {label}
    </button>
  )
}

/* ─── Main table component ────────────────────── */
interface StudentTableProps {
  data: Student[]
  isLoading: boolean
  onRowClick: (s: Student) => void
}

function formatPrice(s: Student) {
  return `${s.currency} ${(s.monthly_price_minor / 100).toFixed(0)}/mo`
}

function formatSessions(s: Student) {
  return `${s.sessions_per_month} × ${s.session_duration_min}m`
}

export function StudentTable({ data, isLoading, onRowClick }: StudentTableProps) {
  const { t }     = useI18n()
  const [density, setDensity] = useState<Density>('default')

  const columns: ColumnDef<Student>[] = [
    {
      id:     'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="accent-[rgb(14,124,90)] cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="accent-[rgb(14,124,90)] cursor-pointer"
        />
      ),
      enableSorting: false,
    },
    {
      id:     'name',
      header: t('students.columnStudent'),
      cell: ({ row }) => {
        const s     = row.original
        const color = avatarColor(s.name)
        const isChild = s.student_type === 'child'
        return (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold select-none"
                style={{ background: color }}
              >
                {initials(s.name)}
              </div>
              {isChild && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgb(14 124 90)', border: '1.5px solid #fff' }}
                >
                  <Baby size={8} color="#fff" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium truncate" style={{ color: 'rgb(11 31 58)' }}>{s.name}</p>
                {isChild && (
                  <span
                    className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}
                  >
                    {t('students.typeChild')}
                  </span>
                )}
              </div>
              <p className="text-xs truncate" style={{ color: 'rgb(90 100 112)' }}>
                {isChild && s.guardian?.name ? `↳ ${s.guardian.name}` : (s.email ?? s.country)}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      id:     'course',
      header: t('common.course'),
      cell: ({ row }) => row.original.course?.name
        ? <span className="font-medium" style={{ color: 'rgb(11 31 58)' }}>{row.original.course.name}</span>
        : <span style={{ color: 'rgb(203 211 222)' }}>—</span>,
    },
    {
      id:     'teacher',
      header: t('common.teacher'),
      cell: ({ row }) => row.original.assigned_teacher?.name
        ? <span style={{ color: 'rgb(11 31 58)' }}>{row.original.assigned_teacher.name}</span>
        : <span style={{ color: 'rgb(203 211 222)' }}>—</span>,
    },
    {
      id:     'sessions',
      header: t('students.columnSessions'),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs px-2 py-0.5 rounded-md font-medium"
          style={{ background: 'rgb(244 246 250)', color: 'rgb(11 31 58)' }}>
          {formatSessions(row.original)}
        </span>
      ),
    },
    {
      id:     'price',
      header: t('students.columnPrice'),
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-sm" style={{ color: 'rgb(14 124 90)' }}>
          {formatPrice(row.original)}
        </span>
      ),
    },
    {
      id:     'status',
      header: t('common.status'),
      cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
    },
    {
      id:            'actions',
      header:        '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <StudentRowActions student={row.original} />
        </div>
      ),
    },
  ]

  const toolbar = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'rgb(90 100 112)' }}>
          {data.length} {data.length === 1 ? t('students.countSingular') : t('students.countPlural')}
        </span>
        <button
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-black/5 transition-colors"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}
        >
          <Download size={12} />
          {t('students.exportButton')}
        </button>
      </div>

      <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgb(244 246 250)' }}>
        {(['compact', 'default', 'comfortable'] as Density[]).map((d) => (
          <button
            key={d}
            title={t(`students.density${d.charAt(0).toUpperCase()}${d.slice(1)}` as Parameters<typeof t>[0])}
            onClick={() => setDensity(d)}
            className="p-1.5 rounded-md transition-all"
            style={density === d ? {
              background: '#fff',
              color: 'rgb(14 124 90)',
              boxShadow: '0 1px 3px rgb(11 31 58 / 0.08)',
            } : { color: 'rgb(90 100 112)' }}
          >
            {d === 'compact' ? <Rows3 size={13} /> : d === 'default' ? <Rows3 size={15} /> : <Rows3 size={17} />}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      density={density}
      toolbar={toolbar}
      rowClassName="group/row"
      emptyState={
        <EmptyState
          icon="Users"
          title={t('students.tableEmpty')}
          description={t('students.tableEmptyHint')}
        />
      }
    />
  )
}
