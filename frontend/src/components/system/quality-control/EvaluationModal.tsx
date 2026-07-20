'use client'
import { useState, useEffect, useMemo } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { X, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useStudents } from '@/hooks/system/useStudents'
import {
  useQcConfig,
  useQcEvaluation,
  useCreateQcEvaluation,
  useUpdateQcEvaluation,
} from '@/hooks/system/useQualityControl'
import { computeScore } from '@/types/system/qualityControl'
import { ApiError } from '@/lib/system/api'
import { SearchSelect } from './SearchSelect'
import { ScoreGauge } from './ScoreGauge'
import { ChecklistCategory } from './ChecklistCategory'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'

const DURATIONS = [10, 15, 20, 25, 30, 45, 60]
const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow bg-white'

export type EvaluationModalMode = 'create' | 'edit' | 'view'

export function EvaluationModal({
  open,
  onOpenChange,
  evaluationId,
  mode,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  evaluationId: number | null
  mode: EvaluationModalMode
}) {
  const { t } = useI18n()
  const { data: config } = useQcConfig()
  const { data: detail } = useQcEvaluation(open && evaluationId ? evaluationId : null)
  const teachersQ = useTeachers({ is_active: '1' })
  const studentsQ = useStudents({ per_page: 200 })
  const create = useCreateQcEvaluation()
  const update = useUpdateQcEvaluation(evaluationId ?? 0)

  const readOnly = mode === 'view'
  const isEdit   = mode === 'edit' || mode === 'view'

  const [teacherId,  setTeacherId]  = useState('')
  const [studentId,  setStudentId]  = useState('')
  const [duration,   setDuration]   = useState('10')
  const [notes,      setNotes]      = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const categories = useMemo(() => config?.categories ?? [], [config])
  const rules      = useMemo(() => config?.special_rules ?? [], [config])

  useEffect(() => {
    if (!open) { setInitialized(false); return }
    if (initialized || !config) return
    if (isEdit && !detail) return

    if (isEdit && detail) {
      setTeacherId(detail.teacher_id ? String(detail.teacher_id) : '')
      setStudentId(detail.student_id ? String(detail.student_id) : '')
      setDuration(String(detail.duration_minutes))
      setNotes(detail.general_notes ?? '')
      const snapshotIds = new Set(detail.items.map(i => i.category_item_id).filter((x): x is number => x != null))
      const next = new Set<number>(detail.checked_item_ids)
      // items added to the checklist after this evaluation default to checked
      for (const cat of config.categories) for (const it of cat.items) if (!snapshotIds.has(it.id)) next.add(it.id)
      setCheckedIds(next)
    } else {
      const next = new Set<number>()
      for (const cat of config.categories) for (const it of cat.items) next.add(it.id)
      setCheckedIds(next)
      setTeacherId(''); setStudentId(''); setDuration('10'); setNotes('')
    }
    setInitialized(true)
  }, [open, config, detail, isEdit, initialized])

  const score = useMemo(() => computeScore(categories, rules, checkedIds), [categories, rules, checkedIds])

  function toggle(id: number) {
    setCheckedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  function setAll(ids: number[], checked: boolean) {
    setCheckedIds(prev => {
      const n = new Set(prev)
      ids.forEach(id => (checked ? n.add(id) : n.delete(id)))
      return n
    })
  }

  async function handleSubmit() {
    if (!teacherId) { toast.error(t('qualityControl.modal.validationTeacher')); return }
    if (!studentId) { toast.error(t('qualityControl.modal.validationStudent')); return }

    const payload = {
      teacher_id: Number(teacherId),
      student_id: Number(studentId),
      duration_minutes: Number(duration),
      general_notes: notes.trim() || null,
      checked_item_ids: Array.from(checkedIds),
    }

    try {
      if (mode === 'edit') {
        await update.mutateAsync(payload)
        toast.success(t('qualityControl.modal.updated'))
      } else {
        await create.mutateAsync(payload)
        toast.success(t('qualityControl.modal.created'))
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('qualityControl.settingsModal.saveError'))
    }
  }

  const teacherOptions  = (teachersQ.data?.data ?? []).map(x => ({ value: String(x.id), label: x.name ?? `#${x.id}` }))
  const studentOptions  = (studentsQ.data?.data ?? []).map(x => ({ value: String(x.id), label: x.name ?? `#${x.id}` }))
  const durationOptions = DURATIONS.map(d => ({ value: String(d), label: `${d} ${t('qualityControl.modal.minutes')}` }))

  const title = mode === 'view'
    ? t('qualityControl.modal.viewTitle')
    : mode === 'edit' ? t('qualityControl.modal.editTitle') : t('qualityControl.modal.newTitle')
  const submitting = create.isPending || update.isPending

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="relative pointer-events-auto w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#F9FAFB', boxShadow: '0 20px 60px rgb(0 0 0 / 0.18)' }}
          >
            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-center px-6 py-4 border-b bg-white" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: NAVY }}>🤗 {title}</h3>
              <button onClick={() => onOpenChange(false)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity" aria-label={t('qualityControl.modal.cancel')}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Meta row */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_7rem_1fr_11rem] gap-3 items-end rounded-2xl border bg-white p-4" style={{ borderColor: BORDER }}>
                <Field label={t('qualityControl.modal.teacherName')}>
                  <SearchSelect value={teacherId} onChange={setTeacherId} options={teacherOptions} placeholder={t('qualityControl.modal.selectTeacher')} disabled={readOnly} />
                </Field>
                <Field label={t('qualityControl.modal.duration')}>
                  <SearchSelect value={duration} onChange={setDuration} options={durationOptions} disabled={readOnly} />
                </Field>
                <Field label={t('qualityControl.modal.studentName')}>
                  <SearchSelect value={studentId} onChange={setStudentId} options={studentOptions} placeholder={t('qualityControl.modal.selectStudent')} disabled={readOnly} />
                </Field>
                <div className="pb-1"><ScoreGauge score={score} /></div>
              </div>

              {/* Checklist */}
              {categories.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.modal.noChecklist')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <ChecklistCategory
                      key={cat.id}
                      category={cat}
                      checkedIds={checkedIds}
                      onToggle={toggle}
                      onSetAll={setAll}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}

              {/* Notes */}
              <Field label={t('qualityControl.modal.generalNotes')}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={readOnly}
                  rows={2}
                  placeholder={t('qualityControl.modal.generalNotesPlaceholder')}
                  className={inp}
                  style={{ borderColor: BORDER, resize: 'vertical' }}
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 border-t bg-white" style={{ borderColor: BORDER }}>
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: BORDER, color: NAVY }}
              >
                {t('qualityControl.modal.cancel')}
              </button>
              {!readOnly && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#0B1F3A' }}
                >
                  <Sparkles size={14} />
                  {submitting
                    ? t('qualityControl.modal.saving')
                    : mode === 'edit' ? t('qualityControl.modal.update') : t('qualityControl.modal.submit')}
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  )
}
