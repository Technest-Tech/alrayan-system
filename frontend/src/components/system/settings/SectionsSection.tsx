'use client'
import { useEffect, useState } from 'react'
import { Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSections, useUpdateSections, type LeadSection } from '@/hooks/system/useSections'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

const ACCENT = 'rgb(var(--accent))'
const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'

export function SectionsSection() {
  const { t } = useI18n()
  const { data, isLoading } = useSections()
  const { mutateAsync, isPending } = useUpdateSections()

  const [rows, setRows] = useState<LeadSection[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setRows(data)
  }, [data])

  const setName = (i: number, name: string) =>
    setRows(r => r.map((row, idx) => (idx === i ? { ...row, name } : row)))
  const addRow = () => setRows(r => [...r, { id: '', name: '' }])
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = rows.map(r => ({ ...r, name: r.name.trim() })).filter(r => r.name)
    if (cleaned.length === 0) {
      toast.error(t('sections.atLeastOne'))
      return
    }
    try {
      const next = await mutateAsync(cleaned)
      setRows(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('sections.saveError'))
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold" style={{ color: 'rgb(15 23 42)' }}>
            {t('sections.pageTitle')}
          </h2>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums"
            style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
          >
            {rows.length}
          </span>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('sections.addSection')}</span>
        </button>
      </div>

      <p className="text-xs opacity-55" style={{ color: 'rgb(15 23 42)' }}>
        {t('sections.hint')}
      </p>

      <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          [1, 2].map(i => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
              style={i === 1 ? undefined : { borderTop: `1px solid ${BORDER}` }}
            >
              <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'rgb(241 245 249)' }} />
              <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: 'rgb(241 245 249)' }} />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'rgb(100 116 139)' }}>
            {t('sections.empty')}
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3"
              style={i === 0 ? undefined : { borderTop: `1px solid ${BORDER}` }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
              >
                <Layers size={18} />
              </div>
              <input
                value={row.name}
                onChange={e => setName(i, e.target.value)}
                placeholder={t('sections.namePlaceholder')}
                className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow"
                style={{ borderColor: BORDER, background: CARD }}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title={t('sections.deleteAction')}
                aria-label={t('sections.deleteAction')}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || isLoading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          style={{ background: ACCENT }}
        >
          {isPending ? t('common.saving') : t('sections.save')}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 size={16} /> {t('sections.saved')}
          </span>
        )}
      </div>
    </form>
  )
}
