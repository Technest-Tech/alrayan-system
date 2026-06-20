'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ExternalLink, Pencil, MessageCircle, PowerOff, Power } from 'lucide-react'
import { toast } from 'sonner'
import type { Teacher } from '@/types/system/teacher'
import type { SystemCourse } from '@/types/system/course'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useActivateTeacher, useDeactivateTeacher } from '@/hooks/system/useTeachers'
import { useCourses } from '@/hooks/system/useCourses'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

/* ─── Avatar helpers ──────────────────────────── */
const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

function avatarColor(name: string | null) {
  if (!name) return PALETTE[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ─── Row actions ─────────────────────────────── */
function TeacherRowActions({ teacher }: { teacher: Teacher }) {
  const router     = useRouter()
  const { t }      = useI18n()
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const activate   = useActivateTeacher()
  const deactivate = useDeactivateTeacher()

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

  async function toggleActive() {
    setOpen(false)
    try {
      if (teacher.is_active) {
        await deactivate.mutateAsync(teacher.id)
        toast.success('Teacher deactivated.')
      } else {
        await activate.mutateAsync(teacher.id)
        toast.success('Teacher activated.')
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed.')
    }
  }

  const dropdown = open ? createPortal(
    <div
      className="fixed z-[9999] min-w-[192px] rounded-xl border shadow-lg overflow-hidden py-1"
      style={{
        top: pos.top,
        right: pos.right,
        background: '#fff',
        borderColor: 'rgb(var(--border-default,229 233 240))',
        boxShadow: '0 8px 30px rgb(11 31 58 / 0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem icon={<ExternalLink size={14} />} label={t('teachers.contextViewProfile')}
        onClick={() => { setOpen(false); router.push(`/teachers/${teacher.id}`) }} />
      <MenuItem icon={<Pencil size={14} />} label={t('teachers.contextEdit')}
        onClick={() => { setOpen(false); router.push(`/teachers/${teacher.id}`) }} />
      {teacher.whatsapp && (
        <MenuItem icon={<MessageCircle size={14} />} label={t('teachers.contextWhatsApp')}
          onClick={() => { setOpen(false); window.open(`https://wa.me/${teacher.whatsapp!.replace(/\D/g, '')}`, '_blank') }} />
      )}
      <div className="my-1 border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
      <MenuItem
        icon={teacher.is_active ? <PowerOff size={14} /> : <Power size={14} />}
        label={teacher.is_active ? t('teachers.contextDeactivate') : t('common.activate')}
        onClick={toggleActive}
        danger={teacher.is_active}
      />
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
}: { icon?: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
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

/* ─── Table ───────────────────────────────────── */
interface TeacherTableProps {
  data: Teacher[]
  isLoading: boolean
  onRowClick?: (t: Teacher) => void
}

function fmtRate(perMinute: number) {
  return `EGP ${(perMinute * 60).toFixed(0)}/hr`
}

export function TeacherTable({ data, isLoading, onRowClick }: TeacherTableProps) {
  const { t }      = useI18n()
  const { data: courses = [] } = useCourses()
  const courseMap = Object.fromEntries(courses.map((c: SystemCourse) => [c.id, c.name]))

  const columns: ColumnDef<Teacher>[] = [
    {
      id:     'name',
      header: t('teachers.columnTeacher'),
      cell: ({ row }) => {
        const tc    = row.original
        const color = avatarColor(tc.name)
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold shrink-0 select-none"
              style={{ background: color }}
            >
              {initials(tc.name)}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: 'rgb(11 31 58)' }}>{tc.name ?? '—'}</p>
              <p className="text-xs truncate" style={{ color: 'rgb(90 100 112)' }}>{tc.email ?? ''}</p>
            </div>
          </div>
        )
      },
    },
    {
      id:     'courses',
      header: t('teachers.columnCourses'),
      cell: ({ row }) => {
        const names = row.original.teachable_course_ids.map(id => courseMap[id]).filter(Boolean)
        if (!names.length) return <span style={{ color: 'rgb(203 211 222)' }}>—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {names.map(n => (
              <span
                key={n}
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: 'rgb(14 124 90 / 0.08)',
                  color: 'rgb(14 124 90)',
                }}
              >
                {n}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id:     'students',
      header: t('teachers.columnStudents'),
      cell: ({ row }) => (
        <span
          className="tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md"
          style={{ background: 'rgb(244 246 250)', color: 'rgb(11 31 58)' }}
        >
          {row.original.student_count ?? 0}
        </span>
      ),
    },
    {
      id:     'rate',
      header: t('teachers.columnRate'),
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-sm" style={{ color: 'rgb(14 124 90)' }}>
          {fmtRate(row.original.per_minute_rate_60)}
        </span>
      ),
    },
    {
      id:     'status',
      header: t('common.status'),
      cell: ({ row }) => <StatusBadge value={row.original.is_active ? 'active' : 'inactive'} />,
    },
    {
      id:            'actions',
      header:        '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <TeacherRowActions teacher={row.original} />
        </div>
      ),
    },
  ]

  const toolbar = (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color: 'rgb(90 100 112)' }}>
        {data.length} {data.length === 1 ? t('teachers.countSingular') : t('teachers.countPlural')}
      </span>
    </div>
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      toolbar={toolbar}
      rowClassName="group/row"
      emptyState={
        <EmptyState
          icon="GraduationCap"
          title={t('teachers.tableEmpty')}
          description={t('teachers.tableEmptyHint')}
        />
      }
    />
  )
}
