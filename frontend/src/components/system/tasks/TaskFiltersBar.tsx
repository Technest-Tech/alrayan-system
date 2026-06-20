'use client'
import { Search, X, ChevronDown } from 'lucide-react'
import {
  TASK_STATUSES, TASK_TYPE_META,
  type TaskPriority, type TaskType, type TaskStatus,
} from '@/types/system/task'
import { useI18n } from '@/lib/system/i18n'
import { taskTypeKey, TASK_STATUS_KEYS, TASK_PRIORITY_KEYS, TASK_ROLE_KEYS } from './taskFields'

export interface TaskFilterState {
  q?: string
  status?: string
  type?: string
  priority?: string
  assignee_role?: string
  from_date?: string
  to_date?: string
  mine?: string
}

interface Props {
  filters: TaskFilterState
  onChange: (f: TaskFilterState) => void
}

function FilterSelect({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-7 py-2 rounded-lg border text-xs outline-none transition-all cursor-pointer focus:ring-2"
        style={{
          borderColor: value ? '#C9A24B66' : 'rgb(229 233 240)',
          background: value ? 'rgba(201,162,75,0.04)' : '#fff',
          color: value ? 'rgb(11 31 58)' : 'rgb(90 100 112)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
    </div>
  )
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  const { t } = useI18n()
  const hasFilters = Object.values(filters).some(Boolean)
  const mine = filters.mine === '1'

  const STATUS_OPTIONS = [
    { value: '', label: t('tasks.filterAllStatuses') },
    ...TASK_STATUSES.map(s => ({ value: s, label: t(TASK_STATUS_KEYS[s as TaskStatus]) })),
  ]
  const TYPE_OPTIONS = [
    { value: '', label: t('tasks.filterAllTypes') },
    ...(Object.keys(TASK_TYPE_META) as TaskType[]).map(ty => {
      const k = taskTypeKey(ty)
      return { value: ty, label: k ? t(k) : TASK_TYPE_META[ty].label }
    }),
  ]
  const PRIORITY_OPTIONS = [
    { value: '', label: t('tasks.filterAllPriorities') },
    ...(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => ({ value: p, label: t(TASK_PRIORITY_KEYS[p]) })),
  ]
  const ROLE_OPTIONS = [
    { value: '', label: t('tasks.filterAllRoles') },
    ...(['supervisor', 'quality', 'accountant', 'admin']).map(r => ({ value: r, label: t(TASK_ROLE_KEYS[r]) })),
  ]

  return (
    <div className="rounded-2xl border mb-4 overflow-hidden" style={{ background: '#fff', borderColor: 'rgb(229 233 240)', boxShadow: '0 1px 4px rgb(11 31 58 / 0.04)' }}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">{t('tasks.filters')}</p>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium cursor-pointer select-none" style={{ color: 'rgb(90 100 112)' }}>
              <input
                type="checkbox"
                checked={mine}
                onChange={e => onChange({ ...filters, mine: e.target.checked ? '1' : '' })}
                className="accent-[#0E7C5A]"
              />
              {t('tasks.myTasksOnly')}
            </label>
            {hasFilters && (
              <button
                onClick={() => onChange({})}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: 'rgba(192,57,43,0.3)', color: 'rgb(192 57 43)' }}
              >
                <X size={10} /> {t('tasks.clearAll')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
            <input
              type="text"
              placeholder={t('tasks.searchPlaceholder')}
              className="w-full pl-8 pr-3 h-9 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-[#0E7C5A]/20 transition-all"
              style={{ borderColor: filters.q ? '#C9A24B66' : 'rgb(229 233 240)', background: filters.q ? 'rgba(201,162,75,0.04)' : '#fff' }}
              value={filters.q ?? ''}
              onChange={e => onChange({ ...filters, q: e.target.value })}
            />
          </div>
          <FilterSelect value={filters.status ?? ''}        options={STATUS_OPTIONS}   onChange={v => onChange({ ...filters, status: v })} />
          <FilterSelect value={filters.priority ?? ''}      options={PRIORITY_OPTIONS} onChange={v => onChange({ ...filters, priority: v })} />
          <FilterSelect value={filters.type ?? ''}          options={TYPE_OPTIONS}     onChange={v => onChange({ ...filters, type: v })} />
          <FilterSelect value={filters.assignee_role ?? ''} options={ROLE_OPTIONS}     onChange={v => onChange({ ...filters, assignee_role: v })} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="date"
            value={filters.from_date ?? ''}
            onChange={e => onChange({ ...filters, from_date: e.target.value })}
            className="w-full h-9 px-3 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-[#0E7C5A]/20 cursor-pointer"
            style={{ borderColor: filters.from_date ? '#C9A24B66' : 'rgb(229 233 240)', color: filters.from_date ? 'rgb(11 31 58)' : 'rgb(156 163 175)' }}
          />
          <input
            type="date"
            value={filters.to_date ?? ''}
            onChange={e => onChange({ ...filters, to_date: e.target.value })}
            className="w-full h-9 px-3 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-[#0E7C5A]/20 cursor-pointer"
            style={{ borderColor: filters.to_date ? '#C9A24B66' : 'rgb(229 233 240)', color: filters.to_date ? 'rgb(11 31 58)' : 'rgb(156 163 175)' }}
          />
        </div>
      </div>
    </div>
  )
}
