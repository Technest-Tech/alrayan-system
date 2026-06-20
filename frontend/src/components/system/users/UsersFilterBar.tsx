'use client'
import { Search, RotateCcw, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { USER_ROLES, USER_STATUSES } from '@/types/system/user-directory'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  resetFilters: () => void
}

// sentinel for the "all" option; selecting it clears the filter so the
// trigger falls back to showing its placeholder.
const ALL = '_all_'

const selStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

export function UsersFilterBar({ filters, setFilter, resetFilters }: Props) {
  const { t }  = useI18n()
  const { data: courses = [] } = useCourses()
  const { data: teachersData } = useTeachers()
  const teachers = teachersData?.data ?? []
  const hasFilters = Object.values(filters).some(Boolean)

  // empty filter → empty value → the SelectValue shows its placeholder.
  const bind = (key: string) => ({
    value: filters[key] || '',
    onValueChange: (v: string) => setFilter(key, v === ALL ? '' : v),
  })

  const allLabel = t('common.all')
  const activeSummary = [
    `${t('common.role')}: ${filters.role ? labelFor(USER_ROLES, filters.role) : allLabel}`,
    `${t('common.status')}: ${filters.status ? labelFor(USER_STATUSES, filters.status) : allLabel}`,
    `${t('common.teacher')}: ${filters.assigned_teacher ? (teachers.find((tc) => String(tc.id) === filters.assigned_teacher)?.name ?? '—') : allLabel}`,
  ].join(' • ')

  return (
    <div className="rounded-xl border mb-4 p-4" style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
      <div className="flex items-center gap-2 mb-1">
        <Filter size={15} style={{ color: 'rgb(11 31 58)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{t('users.filterSection')}</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'rgb(90 100 112)' }}>{activeSummary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            aria-label={t('users.filterSearch')}
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder={t('users.filterSearch')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
            style={selStyle}
          />
        </div>

        <Select {...bind('role')}>
          <SelectTrigger className="w-full" aria-label={t('common.role')}><SelectValue placeholder={t('users.filterRoleAll')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterRoleAll')}</SelectItem>
            {USER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select {...bind('status')}>
          <SelectTrigger className="w-full" aria-label={t('common.status')}><SelectValue placeholder={t('users.filterStatusAll')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterStatusAll')}</SelectItem>
            {USER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select {...bind('language')}>
          <SelectTrigger className="w-full" aria-label="Language"><SelectValue placeholder={t('users.filterLanguageAll')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterLanguageAll')}</SelectItem>
            <SelectItem value="en">{t('users.langEnglish')}</SelectItem>
            <SelectItem value="ar">{t('users.langArabic')}</SelectItem>
          </SelectContent>
        </Select>

        <Select {...bind('activity')}>
          <SelectTrigger className="w-full" aria-label="Activity"><SelectValue placeholder={t('users.filterActivityAll')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterActivityAll')}</SelectItem>
            <SelectItem value="30">{t('users.filterActive30Days')}</SelectItem>
          </SelectContent>
        </Select>

        <Select {...bind('assigned_teacher')}>
          <SelectTrigger className="w-full" aria-label={t('common.teacher')}><SelectValue placeholder={t('users.filterTeacherAll')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterTeacherAll')}</SelectItem>
            {teachers.map((tc) => <SelectItem key={tc.id} value={String(tc.id)}>{tc.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select {...bind('course')}>
          <SelectTrigger className="w-full" aria-label="Subjects"><SelectValue placeholder={t('users.filterAllSubjects')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('users.filterAllSubjects')}</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Reset (always visible) */}
        <button
          onClick={resetFilters}
          disabled={!hasFilters}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors enabled:hover:bg-black/5 disabled:opacity-40"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: 'rgb(248 250 252)' }}
        >
          <RotateCcw size={13} />
          {t('common.reset')}
        </button>
      </div>
    </div>
  )
}

function labelFor(list: { value: string; label: string }[], value: string): string {
  return list.find((x) => x.value === value)?.label ?? value
}
