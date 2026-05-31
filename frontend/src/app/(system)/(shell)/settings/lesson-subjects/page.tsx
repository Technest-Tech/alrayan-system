'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import {
  useLessonSubjects,
  useCreateLessonSubject,
  useUpdateLessonSubject,
  useDeleteLessonSubject,
} from '@/hooks/system/useLessons'
import type { LessonSubject, LessonSubjectField } from '@/types/system/lesson'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'

const inp      = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow'
const inpStyle = { borderColor: BORDER, background: '#fff' }

const FIELD_TYPES = ['text', 'select', 'number'] as const

function newField(): LessonSubjectField {
  return { key: '', label: '', type: 'text', options: [] }
}

/* ─── Subject form ─────────────────────────────────────── */
interface SubjectFormProps {
  initial?: LessonSubject
  onSave: (data: { name: string; sort_order: number; fields: LessonSubjectField[] | null }) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

function SubjectForm({ initial, onSave, onCancel, isPending }: SubjectFormProps) {
  const [name,      setName]      = useState(initial?.name ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [fields,    setFields]    = useState<LessonSubjectField[]>(initial?.fields ?? [])
  const [showFields, setShowFields] = useState(false)

  function addField() {
    setFields(prev => [...prev, newField()])
  }

  function removeField(i: number) {
    setFields(prev => prev.filter((_, j) => j !== i))
  }

  function updateField(i: number, patch: Partial<LessonSubjectField>) {
    setFields(prev => prev.map((f, j) => j === i ? { ...f, ...patch } : f))
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Name is required.'); return }

    // Auto-derive key from label if empty
    const cleanedFields = fields.map(f => ({
      ...f,
      key: f.key.trim() || f.label.trim().toLowerCase().replace(/\s+/g, '_'),
    })).filter(f => f.label.trim())

    await onSave({
      name: name.trim(),
      sort_order: Number(sortOrder),
      fields: cleanedFields.length ? cleanedFields : null,
    })
  }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: MUTED }}>Name *</label>
          <input className={inp} style={inpStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quran Memorisation" />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: MUTED }}>Sort Order</label>
          <input type="number" className={inp} style={inpStyle} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} min={0} />
        </div>
      </div>

      {/* Fields section */}
      <div className="rounded-lg border" style={{ borderColor: BORDER }}>
        <button
          type="button"
          onClick={() => setShowFields(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-black/[0.02] transition-colors"
          style={{ color: NAVY }}
        >
          <span>Dynamic Fields ({fields.length})</span>
          {showFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFields && (
          <div className="border-t p-4 space-y-3" style={{ borderColor: BORDER }}>
            {fields.length === 0 && (
              <p className="text-xs" style={{ color: MUTED }}>No fields defined. Add fields to capture structured lesson data.</p>
            )}
            {fields.map((f, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div className="col-span-4">
                  <label className="text-xs mb-1 block" style={{ color: MUTED }}>Label *</label>
                  <input
                    className="w-full px-2 py-1.5 rounded-md border text-xs outline-none focus:ring-2 focus:ring-[#0d9488]"
                    style={inpStyle}
                    value={f.label}
                    onChange={e => updateField(i, { label: e.target.value })}
                    placeholder="e.g. Surah"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs mb-1 block" style={{ color: MUTED }}>Key</label>
                  <input
                    className="w-full px-2 py-1.5 rounded-md border text-xs outline-none focus:ring-2 focus:ring-[#0d9488]"
                    style={inpStyle}
                    value={f.key}
                    onChange={e => updateField(i, { key: e.target.value })}
                    placeholder="auto"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs mb-1 block" style={{ color: MUTED }}>Type</label>
                  <select
                    className="w-full px-2 py-1.5 rounded-md border text-xs outline-none focus:ring-2 focus:ring-[#0d9488]"
                    style={inpStyle}
                    value={f.type}
                    onChange={e => updateField(i, { type: e.target.value as LessonSubjectField['type'] })}
                  >
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-end justify-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                    aria-label="Remove field"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Options (for select type) */}
                {f.type === 'select' && (
                  <div className="col-span-12">
                    <label className="text-xs mb-1 block" style={{ color: MUTED }}>Options (comma-separated)</label>
                    <input
                      className="w-full px-2 py-1.5 rounded-md border text-xs outline-none focus:ring-2 focus:ring-[#0d9488]"
                      style={inpStyle}
                      value={(f.options ?? []).join(', ')}
                      onChange={e => updateField(i, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                      placeholder="Option 1, Option 2, …"
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: '#0d9488' }}
            >
              <Plus size={12} />
              Add field
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 rounded-lg text-sm border hover:bg-black/5 transition-colors"
          style={{ borderColor: BORDER, color: NAVY }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: '#0d9488' }}
        >
          <Save size={13} />
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LessonSubjectsPage() {
  const { data: subjects = [], isLoading } = useLessonSubjects()
  const { mutateAsync: createSubject, isPending: creating } = useCreateLessonSubject()
  const { mutateAsync: updateSubject, isPending: updating } = useUpdateLessonSubject()
  const { mutate: deleteSubject } = useDeleteLessonSubject()

  const [addOpen,   setAddOpen]   = useState(false)
  const [editId,    setEditId]    = useState<number | null>(null)

  async function handleCreate(data: Parameters<typeof createSubject>[0]) {
    await createSubject(data)
    toast.success('Subject created.')
    setAddOpen(false)
  }

  async function handleUpdate(id: number, data: Parameters<typeof createSubject>[0]) {
    await updateSubject({ id, ...data })
    toast.success('Subject updated.')
    setEditId(null)
  }

  function handleDelete(subject: LessonSubject) {
    if (!confirm(`Delete subject "${subject.name}"? This cannot be undone.`)) return
    deleteSubject(subject.id)
    toast.success('Subject deleted.')
  }

  return (
    <>
      <PageHeader
        title="Lesson Subjects"
        description="Define subjects that can be assigned to lessons. Each subject can have custom dynamic fields."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#0d9488' }}
          >
            <Plus size={14} />
            Add Subject
          </button>
        }
      />

      {/* Add form */}
      {addOpen && (
        <div
          className="rounded-xl border mb-4 p-5"
          style={{ borderColor: BORDER, background: '#fff' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>New Subject</h3>
          <SubjectForm
            onSave={handleCreate}
            onCancel={() => setAddOpen(false)}
            isPending={creating}
          />
        </div>
      )}

      {/* Subjects table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <table className="w-full text-sm">
          <thead style={{ background: '#F9FAFB' }}>
            <tr>
              {['Name', 'Fields', 'Sort', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                {[1, 2, 3, 4].map(j => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded" style={{ background: '#F3F4F6' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!isLoading && subjects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: MUTED }}>
                  No subjects yet. Click "Add Subject" to create one.
                </td>
              </tr>
            )}

            {subjects.map(s => (
              <>
                <tr key={s.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{s.name}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{s.fields?.length ?? 0} field{(s.fields?.length ?? 0) !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{s.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditId(editId === s.id ? null : s.id)}
                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                        style={{ color: MUTED }}
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>

                {editId === s.id && (
                  <tr key={`edit-${s.id}`} style={{ borderTop: `1px solid ${BORDER}`, background: '#FAFFFE' }}>
                    <td colSpan={4} className="px-5 py-4">
                      <SubjectForm
                        initial={s}
                        onSave={(data) => handleUpdate(s.id, data)}
                        onCancel={() => setEditId(null)}
                        isPending={updating}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
