'use client'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import { useTeachers } from '@/hooks/system/useTeachers'
import { SearchSelect, type SelectOption } from './SearchSelect'
import type { QcEvaluationFilters } from '@/hooks/system/useQualityControl'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const TEAL   = '#0d9488'

const inp = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow bg-white'

export function EvaluationsFilters({
  filters,
  onChange,
  managerOptions,
}: {
  filters: QcEvaluationFilters
  onChange: (f: QcEvaluationFilters) => void
  managerOptions: SelectOption[]
}) {
  const { t } = useI18n()
  const teachersQ = useTeachers({ is_active: '1' })
  const teacherOptions = (teachersQ.data?.data ?? []).map(x => ({ value: String(x.id), label: x.name ?? `#${x.id}` }))

  const set = (patch: Partial<QcEvaluationFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: 'rgb(var(--surface-card,255 255 255))' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} style={{ color: TEAL }} />
          <span className="text-sm font-semibold" style={{ color: NAVY }}>{t('qualityControl.filters.title')}</span>
        </div>
        <button
          onClick={() => onChange({})}
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: MUTED }}
        >
          <RotateCcw size={12} /> {t('qualityControl.filters.reset')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Field label={t('qualityControl.filters.qualityManager')}>
          <SearchSelect
            value={filters.quality_manager_id ?? ''}
            onChange={v => set({ quality_manager_id: v || undefined })}
            options={managerOptions}
            placeholder={t('qualityControl.filters.allManagers')}
            clearable
          />
        </Field>
        <Field label={t('qualityControl.filters.teacher')}>
          <SearchSelect
            value={filters.teacher_id ?? ''}
            onChange={v => set({ teacher_id: v || undefined })}
            options={teacherOptions}
            placeholder={t('qualityControl.filters.allTeachers')}
            clearable
          />
        </Field>
        <Field label={t('qualityControl.filters.fromDate')}>
          <input type="date" className={inp} style={{ borderColor: BORDER }}
            value={filters.from_date ?? ''} onChange={e => set({ from_date: e.target.value || undefined })} />
        </Field>
        <Field label={t('qualityControl.filters.toDate')}>
          <input type="date" className={inp} style={{ borderColor: BORDER }}
            value={filters.to_date ?? ''} onChange={e => set({ to_date: e.target.value || undefined })} />
        </Field>
        <Field label={t('qualityControl.filters.minScore')}>
          <input type="number" min={0} max={100} className={inp} style={{ borderColor: BORDER }}
            value={filters.min_score ?? ''} onChange={e => set({ min_score: e.target.value || undefined })} />
        </Field>
        <Field label={t('qualityControl.filters.maxScore')}>
          <input type="number" min={0} max={100} className={inp} style={{ borderColor: BORDER }}
            value={filters.max_score ?? ''} onChange={e => set({ max_score: e.target.value || undefined })} />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  )
}
