'use client'
import Link from 'next/link'
import { MessageCircle, Baby, BookOpen, CalendarDays, Clock3, Globe } from 'lucide-react'
import type { Student, StudentStatus, AgeCategory } from '@/types/system/student'

// ── Avatar ────────────────────────────────────────────────────

const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CFG: Record<StudentStatus, { label: string; bg: string; color: string }> = {
  trial:     { label: 'Trial',     bg: 'rgb(30 90 171 / 0.10)',   color: 'rgb(30 90 171)'   },
  active:    { label: 'Active',    bg: 'rgb(14 124 90 / 0.10)',   color: 'rgb(14 124 90)'   },
  paused:    { label: 'Paused',    bg: 'rgb(154 113 23 / 0.10)',  color: 'rgb(154 113 23)'  },
  suspended: { label: 'Suspended', bg: 'rgb(220 38 38 / 0.10)',   color: 'rgb(220 38 38)'   },
  cancelled: { label: 'Cancelled', bg: 'rgb(107 114 128 / 0.10)', color: 'rgb(107 114 128)' },
}

// ── Helpers ───────────────────────────────────────────────────

function fmtEnrolled(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function whatsappHref(raw: string): string {
  return `https://wa.me/${raw.replace(/\D/g, '')}`
}

// ── Stats bar ─────────────────────────────────────────────────

function StatsBar({ students }: { students: Student[] }) {
  const total     = students.length
  const active    = students.filter(s => s.status === 'active').length
  const trial     = students.filter(s => s.status === 'trial').length
  const paused    = students.filter(s => s.status === 'paused' || s.status === 'suspended').length
  const cancelled = students.filter(s => s.status === 'cancelled').length

  const border = 'rgb(var(--border-default, 229 233 240))'

  return (
    <div
      className="grid grid-cols-5 rounded-xl border mb-5 overflow-hidden text-center"
      style={{ borderColor: border, background: 'rgb(var(--surface-card, 255 255 255))' }}
    >
      {[
        { label: 'Total',     value: total,     color: 'rgb(11 31 58)' },
        { label: 'Active',    value: active,    color: 'rgb(14 124 90)' },
        { label: 'Trial',     value: trial,     color: 'rgb(30 90 171)' },
        { label: 'Paused',    value: paused,    color: 'rgb(154 113 23)' },
        { label: 'Cancelled', value: cancelled, color: 'rgb(107 114 128)' },
      ].map((item, i) => (
        <div key={item.label} className="py-3 px-2" style={i > 0 ? { borderLeft: `1px solid ${border}` } : {}}>
          <p className="text-lg font-bold leading-none" style={{ color: item.color }}>{item.value}</p>
          <p className="text-[11px] mt-1 font-medium" style={{ color: 'rgb(90 100 112)' }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────

function StudentCard({ student }: { student: Student }) {
  const color   = avatarColor(student.name)
  const status  = STATUS_CFG[student.status]
  const isChild = (student.age_category as AgeCategory) === 'child'
  const border  = 'rgb(var(--border-default, 229 233 240))'

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: border }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold select-none"
              style={{ background: color }}
            >
              {initials(student.name)}
            </div>
            {isChild && (
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgb(14 124 90)', border: '2px solid #fff' }}
              >
                <Baby size={8} color="#fff" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'rgb(11 31 58)' }}>
              {student.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
              {student.email ?? student.country}
            </p>
          </div>
        </div>

        <span
          className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="mx-5 border-t" style={{ borderColor: border }} />

      {/* ── Details ── */}
      <div className="px-5 py-4 space-y-2.5 flex-1">
        <DetailRow icon={<BookOpen size={13} />}>
          {student.course?.name
            ? <span className="font-medium" style={{ color: 'rgb(11 31 58)' }}>{student.course.name}</span>
            : <span className="italic" style={{ color: 'rgb(203 211 222)' }}>No course assigned</span>
          }
        </DetailRow>

        <DetailRow icon={<CalendarDays size={13} />}>
          <span style={{ color: 'rgb(11 31 58)' }}>
            <span className="font-semibold">{student.sessions_per_month}</span>
            <span className="opacity-60"> sessions/mo · </span>
            <span className="font-semibold">{student.session_duration_min}</span>
            <span className="opacity-60"> min each</span>
          </span>
        </DetailRow>

        <DetailRow icon={<Clock3 size={13} />}>
          <span style={{ color: 'rgb(90 100 112)' }}>
            Since{' '}
            <span className="font-medium" style={{ color: 'rgb(11 31 58)' }}>
              {fmtEnrolled(student.enrolled_at)}
            </span>
          </span>
        </DetailRow>

        <DetailRow icon={<Globe size={13} />}>
          <span style={{ color: 'rgb(90 100 112)' }}>
            <span className="font-medium" style={{ color: 'rgb(11 31 58)' }}>{student.country}</span>
            {student.timezone ? <span className="opacity-60"> · {student.timezone}</span> : null}
          </span>
        </DetailRow>
      </div>

      <div className="mx-5 border-t" style={{ borderColor: border }} />

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 px-5 py-3.5">
        {student.whatsapp ? (
          <a
            href={whatsappHref(student.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-black/5"
            style={{ borderColor: border, color: 'rgb(11 31 58)' }}
          >
            <MessageCircle size={13} style={{ color: 'rgb(37 211 102)' }} />
            WhatsApp
          </a>
        ) : (
          <span className="text-xs opacity-30 italic">No WhatsApp</span>
        )}

        <Link
          href={`/students/${student.id}`}
          className="ml-auto text-xs font-semibold transition-colors hover:opacity-70"
          style={{ color: 'rgb(14 124 90)' }}
        >
          View profile →
        </Link>
      </div>
    </div>
  )
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color: 'rgb(14 124 90)', opacity: 0.7, flexShrink: 0 }}>{icon}</span>
      <span className="text-xs leading-snug">{children}</span>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────

interface Props {
  students:  Student[]
  isLoading: boolean
}

export function TeacherStudentCards({ students, isLoading }: Props) {
  const border = 'rgb(var(--border-default, 229 233 240))'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl animate-pulse"
            style={{ background: 'rgb(var(--surface-card-2, 248 250 252))', border: `1px solid ${border}` }} />
        ))}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div
        className="rounded-2xl border py-16 flex flex-col items-center gap-3 text-center"
        style={{ borderColor: border, background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(14 124 90 / 0.08)' }}>
          <BookOpen size={22} style={{ color: 'rgb(14 124 90)' }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'rgb(11 31 58)' }}>No students yet</p>
          <p className="text-sm mt-1" style={{ color: 'rgb(90 100 112)' }}>
            Students assigned to this teacher will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StatsBar students={students} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.map(s => <StudentCard key={s.id} student={s} />)}
      </div>
    </div>
  )
}
