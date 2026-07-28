'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useLessonEvaluations,
  useCreateLessonEvaluation,
  useUpdateLessonEvaluation,
  useDeleteLessonEvaluation,
} from '@/hooks/system/useLessons'
import type { LessonEvaluation } from '@/types/system/lesson'
import { useI18n } from '@/lib/system/i18n'

const ACCENT = 'rgb(var(--accent))'
const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'
const NAVY = 'rgb(15 23 42)'
const MUTED = 'rgb(100 116 139)'

const inputClass =
  'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow'

interface EditRowProps {
  initial?: LessonEvaluation
  onSave: (data: { label: string; sort_order: number }) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

function EditRow({ initial, onSave, onCancel, isPending }: EditRowProps) {
  const { t } = useI18n()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)

  async function handleSave() {
    if (!label.trim()) {
      toast.error(t('settings.lessonEvaluations.labelRequired'))
      return
    }
    await onSave({ label: label.trim(), sort_order: Number(sortOrder) })
  }

  return (
    <tr style={{ background: 'rgb(var(--accent) / 0.04)', borderTop: `1px solid ${BORDER}` }}>
      <td className="px-4 py-3">
        <input
          className={inputClass}
          style={{ borderColor: BORDER, background: CARD }}
          value={label}
          onChange={event => setLabel(event.target.value)}
          placeholder={t('settings.lessonEvaluations.labelPlaceholder')}
          autoFocus
        />
      </td>
      <td className="px-4 py-3 w-28">
        <input
          type="number"
          className={inputClass}
          style={{ borderColor: BORDER, background: CARD }}
          value={sortOrder}
          onChange={event => setSortOrder(Number(event.target.value))}
          min={0}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
            style={{ color: MUTED }}
            aria-label={t('common.cancel')}
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !label.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            <Save size={12} />
            {isPending ? t('common.saving') : t('settings.lessonEvaluations.saveShort')}
          </button>
        </div>
      </td>
    </tr>
  )
}

export function LessonEvaluationsSection() {
  const { t } = useI18n()
  const { data: evaluations = [], isLoading } = useLessonEvaluations()
  const { mutateAsync: createEvaluation, isPending: creating } = useCreateLessonEvaluation()
  const { mutateAsync: updateEvaluation, isPending: updating } = useUpdateLessonEvaluation()
  const { mutateAsync: deleteEvaluation } = useDeleteLessonEvaluation()
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  async function handleCreate(data: { label: string; sort_order: number }) {
    await createEvaluation(data)
    toast.success(t('settings.lessonEvaluations.created'))
    setAddOpen(false)
  }

  async function handleUpdate(id: number, data: { label: string; sort_order: number }) {
    await updateEvaluation({ id, ...data })
    toast.success(t('settings.lessonEvaluations.updated'))
    setEditId(null)
  }

  async function handleDelete(evaluation: LessonEvaluation) {
    if (!confirm(t('settings.lessonEvaluations.deleteConfirm', { label: evaluation.label }))) return
    await deleteEvaluation(evaluation.id)
    toast.success(t('settings.lessonEvaluations.deleted'))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            {t('settings.lessonEvaluations.title')}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            {t('settings.lessonEvaluations.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={addOpen}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: ACCENT }}
        >
          <Plus size={15} />
          {t('settings.lessonEvaluations.addEvaluation')}
        </button>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: BORDER, background: CARD }}
      >
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(248 250 252)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>
                {t('settings.lessonEvaluations.colLabel')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold w-28" style={{ color: MUTED }}>
                {t('settings.lessonEvaluations.colSort')}
              </th>
              <th className="px-4 py-3 w-24" aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {addOpen && (
              <EditRow
                onSave={handleCreate}
                onCancel={() => setAddOpen(false)}
                isPending={creating}
              />
            )}

            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[1, 2, 3].map(cell => (
                    <td key={cell} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && !addOpen && evaluations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm" style={{ color: MUTED }}>
                  {t('settings.lessonEvaluations.empty')}
                </td>
              </tr>
            )}

            {evaluations.map(evaluation =>
              editId === evaluation.id ? (
                <EditRow
                  key={evaluation.id}
                  initial={evaluation}
                  onSave={data => handleUpdate(evaluation.id, data)}
                  onCancel={() => setEditId(null)}
                  isPending={updating}
                />
              ) : (
                <tr key={evaluation.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>
                    {evaluation.label}
                  </td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>
                    {evaluation.sort_order}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(evaluation.id)}
                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                        style={{ color: MUTED }}
                        aria-label={t('common.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(evaluation)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-500"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
