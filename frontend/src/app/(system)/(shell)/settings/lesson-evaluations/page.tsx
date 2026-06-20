'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import {
  useLessonEvaluations,
  useCreateLessonEvaluation,
  useUpdateLessonEvaluation,
  useDeleteLessonEvaluation,
} from '@/hooks/system/useLessons'
import type { LessonEvaluation } from '@/types/system/lesson'
import { useI18n } from '@/lib/system/i18n'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'

const inp      = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow'
const inpStyle = { borderColor: BORDER, background: '#fff' }

/* ─── Inline edit row ────────────────────────────────────── */
interface EditRowProps {
  initial?: LessonEvaluation
  onSave: (data: { label: string; sort_order: number }) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

function EditRow({ initial, onSave, onCancel, isPending }: EditRowProps) {
  const { t } = useI18n()
  const [label,     setLabel]     = useState(initial?.label ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)

  async function handleSave() {
    if (!label.trim()) { toast.error(t('settings.lessonEvaluations.labelRequired')); return }
    await onSave({ label: label.trim(), sort_order: Number(sortOrder) })
  }

  return (
    <tr style={{ background: '#FAFFFE', borderTop: `1px solid ${BORDER}` }}>
      <td className="px-4 py-3">
        <input
          className={inp}
          style={inpStyle}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={t('settings.lessonEvaluations.labelPlaceholder')}
          autoFocus
        />
      </td>
      <td className="px-4 py-3 w-28">
        <input
          type="number"
          className={inp}
          style={inpStyle}
          value={sortOrder}
          onChange={e => setSortOrder(Number(e.target.value))}
          min={0}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
            style={{ color: MUTED }}
            aria-label={t('common.cancel')}
          >
            <X size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !label.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: '#0d9488' }}
          >
            <Save size={12} />
            {isPending ? t('common.saving') : t('settings.lessonEvaluations.saveShort')}
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LessonEvaluationsPage() {
  const { t } = useI18n()
  const { data: evaluations = [], isLoading } = useLessonEvaluations()
  const { mutateAsync: createEval, isPending: creating } = useCreateLessonEvaluation()
  const { mutateAsync: updateEval, isPending: updating } = useUpdateLessonEvaluation()
  const { mutate: deleteEval } = useDeleteLessonEvaluation()

  const [addOpen, setAddOpen] = useState(false)
  const [editId,  setEditId]  = useState<number | null>(null)

  async function handleCreate(data: { label: string; sort_order: number }) {
    await createEval(data)
    toast.success(t('settings.lessonEvaluations.created'))
    setAddOpen(false)
  }

  async function handleUpdate(id: number, data: { label: string; sort_order: number }) {
    await updateEval({ id, ...data })
    toast.success(t('settings.lessonEvaluations.updated'))
    setEditId(null)
  }

  function handleDelete(ev: LessonEvaluation) {
    if (!confirm(t('settings.lessonEvaluations.deleteConfirm', { label: ev.label }))) return
    deleteEval(ev.id)
    toast.success(t('settings.lessonEvaluations.deleted'))
  }

  return (
    <>
      <PageHeader
        title={t('settings.lessonEvaluations.title')}
        description={t('settings.lessonEvaluations.subtitle')}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#0d9488' }}
          >
            <Plus size={14} />
            {t('settings.lessonEvaluations.addEvaluation')}
          </button>
        }
      />

      <div className="rounded-xl border overflow-hidden max-w-xl" style={{ borderColor: BORDER }}>
        <table className="w-full text-sm">
          <thead style={{ background: '#F9FAFB' }}>
            <tr>
              {[
                { key: 'label', label: t('settings.lessonEvaluations.colLabel') },
                { key: 'sort', label: t('settings.lessonEvaluations.colSort') },
                { key: 'actions', label: '' },
              ].map(h => (
                <th
                  key={h.key}
                  className="px-4 py-3 text-left text-xs font-semibold"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Add row */}
            {addOpen && (
              <EditRow
                onSave={handleCreate}
                onCancel={() => setAddOpen(false)}
                isPending={creating}
              />
            )}

            {/* Loading skeletons */}
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                {[1, 2, 3].map(j => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded" style={{ background: '#F3F4F6' }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {!isLoading && !addOpen && evaluations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm" style={{ color: MUTED }}>
                  {t('settings.lessonEvaluations.empty')}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {evaluations.map(ev => (
              editId === ev.id ? (
                <EditRow
                  key={ev.id}
                  initial={ev}
                  onSave={(data) => handleUpdate(ev.id, data)}
                  onCancel={() => setEditId(null)}
                  isPending={updating}
                />
              ) : (
                <tr key={ev.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{ev.label}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{ev.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditId(ev.id)}
                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                        style={{ color: MUTED }}
                        aria-label={t('common.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ev)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-500"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
