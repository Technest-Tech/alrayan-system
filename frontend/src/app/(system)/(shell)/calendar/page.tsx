'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, List, CalendarRange,
  X as XIcon, GraduationCap, Users, ChevronDown, Search, Check,
  Settings, Filter, BookOpen, Clock, ArrowDownUp,
} from 'lucide-react'
import { useCalendarFeed, useLessons, useLessonSchedules } from '@/hooks/system/useLessons'
import { useTeachers }                 from '@/hooks/system/useTeachers'
import { useStudents }                 from '@/hooks/system/useStudents'
import { useMyStudents }               from '@/hooks/system/useMyStudents'
import { useSystemUser }               from '@/components/system/shell/SystemShell'
import { CreateLessonDialog }          from '@/components/system/lessons/CreateLessonDialog'
import { CreateScheduleDialog }        from '@/components/system/lessons/CreateScheduleDialog'
import { LessonDetailDrawer }          from '@/components/system/lessons/LessonDetailDrawer'
import { WeekDayGrid }                 from '@/components/system/lessons/WeekDayGrid'
import { SearchableSelect }            from '@/components/system/lessons/SearchableSelect'
import { CreateNewChooser, type ChooserSelection } from '@/components/system/lessons/CreateNewChooser'
import { ScheduleDetailsModal }        from '@/components/system/lessons/ScheduleDetailsModal'
import { CalendarSettingsModal }       from '@/components/system/lessons/CalendarSettingsModal'
import type { Lesson, LessonStatus, LessonSchedule } from '@/types/system/lesson'
import {
  STATUS_PILL, STATUS_LABEL, LESSON_STATUSES, lessonBlockStyle, displaySessionHours, isScheduleOccurrence,
} from '@/lib/system/lessonStatus'
import { useI18n } from '@/lib/system/i18n'

/* ── Design tokens ─────────────────────────────────────── */
const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_400 = '#2DD4BF'
const TEAL_600 = '#0d9488'

/* ── Week starts Saturday ─────────────────────────────── */
const DAY_LABEL_KEYS = ['days.sat', 'days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri']

function jsToGrid(jsDow: number): number {
  return jsDow === 6 ? 0 : jsDow + 1
}

function weekStartOf(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  const toSat = (copy.getDay() - 6 + 7) % 7
  copy.setDate(copy.getDate() - toSat)
  return copy
}

function fmt(d: Date): string { return d.toISOString().slice(0, 10) }

const MONTH_KEYS = [
  'schedule.months.january','schedule.months.february','schedule.months.march','schedule.months.april',
  'schedule.months.may','schedule.months.june','schedule.months.july','schedule.months.august',
  'schedule.months.september','schedule.months.october','schedule.months.november','schedule.months.december',
]

/* ── Lesson pill ────────────────────────────────────────── */
function LessonPill({ lesson, onClick, onDelete }: {
  lesson: Lesson; onClick: () => void; onDelete: (e: React.MouseEvent) => void
}) {
  const { t }      = useI18n()
  const bs         = lessonBlockStyle(lesson)
  const sessionNum = displaySessionHours(lesson)

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer group hover:opacity-90 transition-opacity"
      style={{ background: bs.bg, color: bs.color, border: bs.border }}
      onClick={onClick}
    >
      <span className="font-semibold shrink-0">{sessionNum}</span>
      <span className="truncate min-w-0">{lesson.student?.name.split(' ')[0] ?? '—'}</span>
      <button
        onClick={onDelete}
        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
        aria-label={t('schedule.calendar.deleteLesson')}
      >
        <XIcon size={10} />
      </button>
    </div>
  )
}

/* ── Month calendar ────────────────────────────────────── */
function MonthCalendar({ year, month, lessons, onLessonClick, onLessonDelete }: {
  year: number; month: number; lessons: Lesson[]
  onLessonClick: (l: Lesson) => void; onLessonDelete: (l: Lesson) => void
}) {
  const { t }     = useI18n()
  const firstDay  = new Date(year, month - 1, 1)
  const totalDays = new Date(year, month, 0).getDate()
  const startCol  = jsToGrid(firstDay.getDay())

  const byDate = useMemo(() => {
    const m: Record<string, Lesson[]> = {}
    lessons.forEach(l => {
      const d = l.scheduled_at.slice(0, 10)
      if (!m[d]) m[d] = []
      m[d].push(l)
    })
    return m
  }, [lessons])

  const today = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = [
    ...Array(startCol).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>
      {/* Day headers */}
      <div className="grid grid-cols-7" style={{ background: TEAL_50 }}>
        {DAY_LABEL_KEYS.map(dayKey => (
          <div
            key={dayKey}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider"
            style={{ color: MUTED, borderRight: `1px solid ${TEAL_100}` }}
          >{t(dayKey)}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7" style={{ borderTop: `1px solid ${BORDER}` }}>
          {week.map((day, di) => {
            if (day === null) return (
              <div key={di} className="min-h-[96px]" style={{ borderRight: `1px solid ${BORDER}`, background: '#FAFAFA' }} />
            )

            const dateStr    = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayLessons = byDate[dateStr] ?? []
            const isToday    = dateStr === today

            return (
              <div
                key={di}
                className="min-h-[96px] p-1.5 flex flex-col"
                style={{ borderRight: `1px solid ${BORDER}`, background: isToday ? TEAL_50 : '#fff' }}
              >
                <span
                  className="text-xs font-medium mb-1 inline-flex items-center justify-center w-5 h-5 rounded-full"
                  style={isToday ? { background: TEAL_600, color: '#fff' } : { color: NAVY }}
                >
                  {day}
                </span>
                <div className="space-y-0.5 flex-1">
                  {dayLessons.slice(0, 3).map(l => (
                    <LessonPill
                      key={l.id}
                      lesson={l}
                      onClick={() => onLessonClick(l)}
                      onDelete={e => { e.stopPropagation(); onLessonDelete(l) }}
                    />
                  ))}
                  {dayLessons.length > 3 && (
                    <div className="text-xs pl-1" style={{ color: MUTED }}>{t('schedule.calendar.moreCount', { count: String(dayLessons.length - 3) })}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ── List view (flat, with toolbar — matches the old system) ───────────── */
const PAGE_SIZES = [10, 25, 50]

function ListView({ lessons, onLessonClick }: { lessons: Lesson[]; onLessonClick: (l: Lesson) => void }) {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState<LessonStatus | ''>('')
  const [pageSize,     setPageSize]     = useState(10)
  const [oldestFirst,  setOldestFirst]  = useState(true)
  const [page,         setPage]         = useState(1)

  const filtered = useMemo(() => {
    let ls = statusFilter ? lessons.filter(l => l.status === statusFilter) : lessons
    ls = [...ls].sort((a, b) => {
      const d = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      return oldestFirst ? d : -d
    })
    return ls
  }, [lessons, statusFilter, oldestFirst])

  const totalHours = useMemo(
    () => filtered.reduce((s, l) => s + l.duration_minutes / 60, 0),
    [filtered],
  )

  const lastPage   = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, lastPage)
  const pageSlice  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <select
          className="px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
          style={{ borderColor: BORDER, color: NAVY }}
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
        >
          {PAGE_SIZES.map(n => <option key={n} value={n}>{t('schedule.list.perPage', { n: String(n) })}</option>)}
        </select>

        <select
          className="px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
          style={{ borderColor: BORDER, color: NAVY }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as LessonStatus | ''); setPage(1) }}
        >
          <option value="">{t('schedule.list.allStatuses')}</option>
          {LESSON_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <Filter size={15} style={{ color: MUTED }} />

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: TEAL_50, color: TEAL_600 }}>
          <BookOpen size={12} /> {t('schedule.list.lessonsCount', { count: String(filtered.length) })}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#EEF2FF', color: '#4338CA' }}>
          <Clock size={12} /> {t('schedule.list.hours', { hours: totalHours.toFixed(2) })}
        </span>

        <button
          onClick={() => { setOldestFirst(v => !v); setPage(1) }}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-black/[0.03]"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          <ArrowDownUp size={13} /> {t('schedule.list.sortDate', { order: oldestFirst ? t('schedule.list.oldest') : t('schedule.list.newest') })}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center"><p style={{ color: MUTED }}>{t('schedule.list.empty')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {[
                  'schedule.list.colSessionNumber', 'schedule.list.colStudent', 'common.duration',
                  'common.date', 'common.status', 'schedule.list.colContent',
                  'common.notes', 'schedule.list.colProgress',
                ].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap" style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((l, idx) => {
                const isPaid  = l.package?.status === 'paid'
                const rowProg = l.package ? Math.min(100, (l.session_number_hours / l.package.package_hours) * 100) : 0
                const pill    = STATUS_PILL[l.status] ?? { bg: '#F3F4F6', color: '#6B7280' }
                return (
                  <tr
                    key={l.id}
                    className="cursor-pointer hover:bg-black/[0.02] transition-colors"
                    style={{ borderBottom: idx < pageSlice.length - 1 ? `1px solid ${BORDER}` : undefined }}
                    onClick={() => onLessonClick(l)}
                  >
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center justify-center min-w-[34px] h-6 px-2 rounded-full text-xs font-semibold"
                        style={{ background: isPaid ? '#F0FDF4' : '#FEF2F2', color: isPaid ? '#15803D' : '#B91C1C' }}>
                        {displaySessionHours(l)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: NAVY }}>{l.student?.name ?? '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>{(l.duration_minutes / 60).toFixed(l.duration_minutes % 60 ? 1 : 0)}h</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: MUTED }}>
                      {new Date(l.scheduled_at).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: pill.bg, color: pill.color }}>{STATUS_LABEL[l.status]}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span className="truncate block text-xs" style={{ color: MUTED }}>{l.content || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <span className="truncate block text-xs" style={{ color: MUTED }}>{l.notes || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgb(229 233 240)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${rowProg}%`, background: isPaid ? TEAL_600 : '#EF4444' }} />
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: MUTED }}>{Math.round(rowProg)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-center gap-1 px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-black/5 transition-colors"
            style={{ color: MUTED }}
          >‹ {t('common.prev')}</button>
          <span className="text-xs px-3" style={{ color: NAVY }}>{t('schedule.list.pageOf', { page: String(safePage), total: String(lastPage) })}</span>
          <button
            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
            disabled={safePage === lastPage}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-black/5 transition-colors"
            style={{ color: MUTED }}
          >{t('common.next')} ›</button>
        </div>
      )}
    </div>
  )
}

/* ── Student multi-select with search ──────────────────── */
function StudentMultiSelect({ allStudents, selected, onChange }: {
  allStudents: { id: number; name: string }[]
  selected:    number[]
  onChange:    (ids: number[]) => void
}) {
  const { t }             = useI18n()
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const [pos,   setPos]   = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef    = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  const sel      = allStudents.filter(s => selected.includes(s.id))
  const filtered = query.trim()
    ? allStudents.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : allStudents

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  function computePos() {
    if (!triggerRef.current) return null
    const r = triggerRef.current.getBoundingClientRect()
    const openUp = (window.innerHeight - r.bottom) < 280 && r.top > 280
    return openUp
      ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: Math.max(r.width, 260) }
      : { top: r.bottom + 4,                       left: r.left, width: Math.max(r.width, 260) }
  }

  function openDropdown() { setPos(computePos()); setOpen(true); setQuery('') }
  function close()        { setOpen(false); setQuery('') }

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 10) }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !dropRef.current?.contains(target)) close()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    function update() { setPos(computePos()) }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="w-52">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? close : openDropdown}
        className="w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center gap-2 bg-white outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow"
        style={{ borderColor: open ? TEAL_600 : BORDER }}
      >
        {sel.length === 0 ? (
          <span className="flex-1 truncate" style={{ color: MUTED }}>{t('schedule.filter.allStudents')}</span>
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
            {sel.slice(0, 2).map(s => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: TEAL_50, color: TEAL_600, border: `1px solid ${TEAL_100}` }}
              >
                {s.name.split(' ')[0]}
                <span role="button" onClick={e => { e.stopPropagation(); toggle(s.id) }} className="cursor-pointer hover:opacity-70">
                  <XIcon size={10} />
                </span>
              </span>
            ))}
            {sel.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F3F4F6', color: MUTED }}>
                +{sel.length - 2}
              </span>
            )}
          </div>
        )}
        <ChevronDown size={14} className="shrink-0" style={{ color: MUTED, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {/* Floating dropdown */}
      {open && pos && (
        <div ref={dropRef} className="fixed z-[9999]" style={pos}>
          <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${TEAL_100}`, boxShadow: '0 8px 28px rgb(0 0 0 / 0.14)' }}>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${TEAL_100}` }}>
              <Search size={13} style={{ color: MUTED, flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('schedule.filter.searchStudents')}
                className="flex-1 text-sm outline-none bg-transparent min-w-0"
                style={{ color: NAVY }}
              />
              {selected.length > 0 && (
                <button type="button" onClick={() => onChange([])} className="text-xs shrink-0 underline" style={{ color: MUTED }}>
                  {t('schedule.filter.clearAll')}
                </button>
              )}
            </div>

            {/* Options */}
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: MUTED }}>{t('common.noResults')}</p>
              ) : filtered.map(s => {
                const isSel = selected.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-[#F0FDFA]"
                    style={{ background: isSel ? TEAL_50 : undefined }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: isSel ? TEAL_600 : '#fff', border: `1.5px solid ${isSel ? TEAL_600 : BORDER}` }}
                    >
                      {isSel && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className="truncate" style={{ color: NAVY }}>{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Prefill ──────────────────────────────────────────── */
interface LessonPrefill {
  scheduledAt?: string; durationMinutes?: number; teacherId?: number; studentId?: number
}

/* ── Main page ─────────────────────────────────────────── */
type ViewMode = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { t } = useI18n()
  const today = new Date()

  const [anchorDate, setAnchorDate] = useState(today)
  const year    = anchorDate.getFullYear()
  const month   = anchorDate.getMonth() + 1
  const wkStart = useMemo(() => weekStartOf(anchorDate), [anchorDate])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => { const d = new Date(wkStart); d.setDate(d.getDate() + i); return d })
  , [wkStart])

  const [viewMode,    setViewMode]    = useState<ViewMode>('month')
  const [listMode,    setListMode]    = useState(false)
  const [showFullDay, setShowFullDay] = useState(false)

  // Remember the last-chosen Calendar/List view and restore it on the next visit.
  const LIST_MODE_KEY = 'calendar.listMode'
  useEffect(() => {
    const saved = localStorage.getItem(LIST_MODE_KEY)
    if (saved !== null) setListMode(saved === 'true')
  }, [])
  useEffect(() => {
    localStorage.setItem(LIST_MODE_KEY, String(listMode))
  }, [listMode])

  const [teacherFilter, setTeacherFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState<number[]>([])

  const [createLessonOpen,   setCreateLessonOpen]   = useState(false)
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
  const [lessonPrefill,      setLessonPrefill]      = useState<LessonPrefill | undefined>()
  const [schedulePrefill,    setSchedulePrefill]    = useState<{ date?: string; startTime?: string; durationMinutes?: number; teacherId?: number; studentId?: number } | undefined>()
  const [selectedLesson,     setSelectedLesson]     = useState<Lesson | null>(null)
  const [editLesson,         setEditLesson]         = useState<Lesson | undefined>()  // "Add Report" / edit
  const [editSchedule,       setEditSchedule]       = useState<LessonSchedule | undefined>()
  const [scheduleDetail,     setScheduleDetail]     = useState<Lesson | null>(null)
  const [chooserSel,         setChooserSel]         = useState<ChooserSelection | null>(null)
  const [settingsOpen,       setSettingsOpen]       = useState(false)

  // Teachers get a self-scoped calendar: they can create/manage their own
  // lessons & schedules, but not the admin-only filters/settings.
  const user = useSystemUser()
  const isTeacher = user?.role === 'teacher'

  const { data: teachersData } = useTeachers({}, { enabled: !isTeacher })
  const { data: studentsData } = useStudents({ per_page: 500 }, { enabled: !isTeacher })
  const { data: myStudents } = useMyStudents({ enabled: isTeacher })
  const { data: schedulesData } = useLessonSchedules({ teacherId: teacherFilter ? Number(teacherFilter) : undefined })
  const teachers  = teachersData?.data ?? []
  const students  = isTeacher ? (myStudents ?? []) : (studentsData?.data ?? [])
  const schedules = schedulesData ?? []

  const [calStart, calEnd] = useMemo(() => {
    if (listMode || viewMode === 'month') {
      const last = new Date(year, month, 0).getDate()
      return [`${year}-${String(month).padStart(2,'0')}-01`, `${year}-${String(month).padStart(2,'0')}-${String(last).padStart(2,'0')}`]
    }
    if (viewMode === 'week') {
      const end = new Date(wkStart); end.setDate(end.getDate() + 6)
      return [fmt(wkStart), fmt(end)]
    }
    const ds = fmt(anchorDate)
    return [ds, ds]
  }, [listMode, viewMode, year, month, wkStart, anchorDate])

  const { data: calendarDays, refetch } = useCalendarFeed({
    teacherId:  teacherFilter ? Number(teacherFilter) : undefined,
    studentIds: studentFilter.length ? studentFilter : undefined,
    start: calStart, end: calEnd,
  })

  const { data: lessonsData } = useLessons({ teacher_id: teacherFilter || undefined, per_page: 1000 })

  const calendarLessons = useMemo(() => {
    const ls: Lesson[] = []
    calendarDays?.forEach(d => ls.push(...d.lessons))
    return ls
  }, [calendarDays])

  const listLessons = useMemo(() => {
    let ls = lessonsData?.data ?? []
    if (studentFilter.length) ls = ls.filter(l => studentFilter.includes(l.student_id))
    return ls
  }, [lessonsData, studentFilter])

  function prevPeriod() {
    setAnchorDate(d => {
      const n = new Date(d)
      if (listMode || viewMode === 'month') n.setMonth(n.getMonth() - 1, 1)
      else if (viewMode === 'week')         n.setDate(n.getDate() - 7)
      else                                  n.setDate(n.getDate() - 1)
      return n
    })
  }

  function nextPeriod() {
    setAnchorDate(d => {
      const n = new Date(d)
      if (listMode || viewMode === 'month') n.setMonth(n.getMonth() + 1, 1)
      else if (viewMode === 'week')         n.setDate(n.getDate() + 7)
      else                                  n.setDate(n.getDate() + 1)
      return n
    })
  }

  const periodTitle = useMemo(() => {
    if (listMode || viewMode === 'month') return `${t(MONTH_KEYS[month - 1])} ${year}`
    if (viewMode === 'week') {
      const end = new Date(wkStart); end.setDate(end.getDate() + 6)
      return `${wkStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return anchorDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }, [listMode, viewMode, month, year, wkStart, anchorDate, t])

  // Drag-select on the grid → the "Create New" chooser (Lesson vs Schedule).
  function handleCellSelect({ date, startTime, durationMinutes }: { date: string; startTime: string; durationMinutes: number }) {
    setChooserSel({ date, startTime, durationMinutes: Math.min(durationMinutes, 180) })
  }

  function chooserPrefillCommon() {
    return {
      teacherId: teacherFilter ? Number(teacherFilter) : undefined,
      studentId: studentFilter.length === 1 ? studentFilter[0] : undefined,
    }
  }

  function chooseLesson() {
    if (!chooserSel) return
    setLessonPrefill({
      scheduledAt:     `${chooserSel.date}T${chooserSel.startTime}`,
      durationMinutes: chooserSel.durationMinutes,
      ...chooserPrefillCommon(),
    })
    setChooserSel(null)
    setEditLesson(undefined)
    setCreateLessonOpen(true)
  }

  function chooseSchedule() {
    if (!chooserSel) return
    setSchedulePrefill({
      date:            chooserSel.date,
      startTime:       chooserSel.startTime,
      durationMinutes: chooserSel.durationMinutes,
      ...chooserPrefillCommon(),
    })
    setChooserSel(null)
    setEditSchedule(undefined)
    setCreateScheduleOpen(true)
  }

  function handleCreateLessonClose(v: boolean) {
    setCreateLessonOpen(v)
    if (!v) { setLessonPrefill(undefined); setEditLesson(undefined) }
  }

  function handleCreateScheduleClose(v: boolean) {
    setCreateScheduleOpen(v)
    if (!v) { setSchedulePrefill(undefined); setEditSchedule(undefined) }
  }

  // Schedule occurrences open the schedule panel; one-off lessons open the detail drawer.
  function handleLessonClick(lesson: Lesson) {
    if (isScheduleOccurrence(lesson)) setScheduleDetail(lesson)
    else setSelectedLesson(lesson)
  }

  // "Add Report" on a schedule occurrence → open the lesson editor pre-loaded with it.
  function handleAddReport(lesson: Lesson) {
    setScheduleDetail(null)
    setEditLesson(lesson)
    setCreateLessonOpen(true)
  }

  function handleEditSchedule(scheduleId: number) {
    const sched = schedules.find(s => s.id === scheduleId)
    setScheduleDetail(null)
    if (sched) { setEditSchedule(sched); setCreateScheduleOpen(true) }
  }

  async function handleLessonDelete(lesson: Lesson) {
    if (!confirm(t('schedule.calendar.deleteConfirm', { name: lesson.student?.name ?? '—' }))) return
    setSelectedLesson(null)
    await refetch()
  }

  const hasFilters = !!teacherFilter || studentFilter.length > 0

  return (
    <>
      {/* ── Page header ─────────────────────────────────── */}
      <div className="relative rounded-2xl mb-5 px-6 py-5 overflow-hidden" style={{ background: `linear-gradient(135deg, #fff 60%, ${TEAL_50})`, border: `1px solid ${TEAL_100}` }}>
        {/* Corner diamonds */}
        {(['top-3 left-4', 'top-3 right-4', 'bottom-3 left-4', 'bottom-3 right-4'] as const).map(pos => (
          <span key={pos} className={`absolute ${pos} select-none pointer-events-none text-sm`} style={{ color: TEAL_400 }}>◇</span>
        ))}
        {/* Teal top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${TEAL_600}, ${TEAL_400}, transparent)` }} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: TEAL_50, border: `1px solid ${TEAL_100}` }}>
              <CalendarDays size={20} style={{ color: TEAL_600 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: NAVY }}>{t('schedule.page.title')}</h1>
                <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: MUTED }}>{t('schedule.page.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Calendar settings is an admin-only configuration surface. */}
            {!isTeacher && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors hover:bg-black/[0.02]"
                style={{ borderColor: BORDER, color: MUTED, background: '#fff' }}
                aria-label={t('schedule.page.calendarSettings')}
                title={t('schedule.page.calendarSettings')}
              >
                <Settings size={16} />
              </button>
            )}
            <button
              onClick={() => { setEditSchedule(undefined); setSchedulePrefill(undefined); setCreateScheduleOpen(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: BORDER, color: NAVY, background: '#fff' }}
            >
              <CalendarRange size={14} />
              {t('schedule.page.createSchedule')}
            </button>
            <button
              onClick={() => { setEditLesson(undefined); setLessonPrefill(undefined); setCreateLessonOpen(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: TEAL_600 }}
            >
              <Plus size={14} />
              {t('schedule.page.createLesson')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter + controls bar ─────────────────────── */}
      <div className="rounded-2xl border mb-4 overflow-hidden" style={{ borderColor: BORDER, background: '#fff', boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>
        {/* Teal top stripe */}
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${TEAL_600}, ${TEAL_400}, transparent)` }} />

        <div className="px-4 py-4">
          {/* Row 1: Filter controls */}
          <div className="flex flex-wrap items-end gap-4">

            {/* Teacher filter — admins/supervisors only (teachers only see their own) */}
            {!isTeacher && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: MUTED }}>
                  <GraduationCap size={12} />
                  {t('common.teacher')}
                </label>
                <SearchableSelect
                  options={teachers.map(tch => ({ value: String(tch.id), label: tch.name ?? t('schedule.filter.teacherNumber', { id: String(tch.id) }) }))}
                  value={teacherFilter}
                  onChange={setTeacherFilter}
                  placeholder={t('schedule.filter.allTeachers')}
                  clearable
                  className="w-48"
                />
              </div>
            )}

            {/* Student filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: MUTED }}>
                <Users size={12} />
                {t('schedule.filter.students')}
                {studentFilter.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: TEAL_50, color: TEAL_600 }}>
                    {studentFilter.length}
                  </span>
                )}
              </label>
              <StudentMultiSelect allStudents={students} selected={studentFilter} onChange={setStudentFilter} />
            </div>

            {/* Clear all filters */}
            {hasFilters && (
              <button
                onClick={() => { setTeacherFilter(''); setStudentFilter([]) }}
                className="mb-0.5 self-end inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-red-50"
                style={{ borderColor: '#FECACA', color: '#DC2626' }}
              >
                <XIcon size={11} />
                {t('schedule.filter.clearFilters')}
              </button>
            )}
          </div>

          {/* Row 2: Navigation + View toggles */}
          <div className="flex items-center justify-between mt-4 pt-3.5" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3">
              {/* Full day toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className="relative w-8 h-4.5 rounded-full transition-colors cursor-pointer"
                  style={{ background: showFullDay ? TEAL_600 : 'rgb(209 213 219)', width: 32, height: 18 }}
                  onClick={() => setShowFullDay(v => !v)}
                >
                  <div
                    className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                    style={{ width: 14, height: 14, left: 2, transform: showFullDay ? 'translateX(14px)' : 'translateX(0)' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: MUTED }}>{t('schedule.controls.fullDay')}</span>
              </label>

              {/* Period navigation */}
              <div className="flex items-center gap-1 rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                <button onClick={prevPeriod} className="p-2 hover:bg-black/5 transition-colors" aria-label={t('common.prev')}>
                  <ChevronLeft size={15} style={{ color: MUTED }} />
                </button>
                <span className="text-sm font-semibold px-3" style={{ color: NAVY, minWidth: 172, textAlign: 'center' }}>
                  {periodTitle}
                </span>
                <button onClick={nextPeriod} className="p-2 hover:bg-black/5 transition-colors" aria-label={t('common.next')}>
                  <ChevronRight size={15} style={{ color: MUTED }} />
                </button>
              </div>

              <button
                onClick={() => setAnchorDate(new Date())}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors hover:bg-black/[0.03]"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                {t('schedule.controls.today')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Calendar / List toggle */}
              <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => setListMode(false)}
                  className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  style={{ background: !listMode ? TEAL_600 : '#fff', color: !listMode ? '#fff' : MUTED }}
                >
                  <CalendarDays size={13} /> {t('schedule.controls.calendar')}
                </button>
                <button
                  onClick={() => setListMode(true)}
                  className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  style={{ background: listMode ? TEAL_600 : '#fff', color: listMode ? '#fff' : MUTED, borderLeft: `1px solid ${BORDER}` }}
                >
                  <List size={13} /> {t('schedule.controls.list')}
                </button>
              </div>

              {/* Month / Week / Day */}
              {!listMode && (
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  {(['month', 'week', 'day'] as ViewMode[]).map((v, i) => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className="px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: viewMode === v ? TEAL_50 : '#fff',
                        color:      viewMode === v ? TEAL_600 : MUTED,
                        fontWeight: viewMode === v ? 600 : 400,
                        borderLeft: i > 0 ? `1px solid ${BORDER}` : undefined,
                      }}
                    >{t(`schedule.view.${v}`)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Calendar / List content ─────────────────────── */}
      {!listMode ? (
        viewMode === 'month' ? (
          <MonthCalendar
            year={year} month={month} lessons={calendarLessons}
            onLessonClick={handleLessonClick}
            onLessonDelete={handleLessonDelete}
          />
        ) : (
          <WeekDayGrid
            days={viewMode === 'week' ? weekDays : [anchorDate]}
            lessons={calendarLessons}
            showFullDay={showFullDay}
            onLessonClick={handleLessonClick}
            onCellSelect={handleCellSelect}
          />
        )
      ) : (
        <ListView lessons={listLessons} onLessonClick={handleLessonClick} />
      )}

      {/* ── Dialogs ─────────────────────────────────────── */}
      <CreateNewChooser
        open={!!chooserSel}
        selection={chooserSel}
        onChooseLesson={chooseLesson}
        onChooseSchedule={chooseSchedule}
        onClose={() => setChooserSel(null)}
      />
      <CreateLessonDialog
        open={createLessonOpen}
        onOpenChange={handleCreateLessonClose}
        lesson={editLesson}
        prefill={lessonPrefill}
        onSuccess={() => refetch()}
      />
      {createScheduleOpen && (
        <CreateScheduleDialog
          open
          onOpenChange={handleCreateScheduleClose}
          schedule={editSchedule}
          prefill={schedulePrefill}
          onSuccess={() => refetch()}
        />
      )}
      <ScheduleDetailsModal
        lesson={scheduleDetail}
        open={!!scheduleDetail}
        onClose={() => setScheduleDetail(null)}
        onAddReport={handleAddReport}
        onEditSchedule={handleEditSchedule}
        onChanged={() => refetch()}
      />
      <LessonDetailDrawer
        lesson={selectedLesson}
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onUpdate={() => refetch()}
      />
      {settingsOpen && <CalendarSettingsModal open onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
