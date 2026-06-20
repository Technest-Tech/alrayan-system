'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, Unlink, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { StudentDetail } from '@/types/system/student'
import { useLinkSibling, useUnlinkSibling, useStudents } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

interface FamilyTabContentProps {
  student: StudentDetail
}

function LinkSiblingSheet({ studentId, onClose }: { studentId: number | string; onClose: () => void }) {
  const { t } = useI18n()
  const [query,   setQuery]   = useState('')
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null)
  const [discount, setDiscount] = useState('0')

  const { data } = useStudents({ q: query, per_page: 10 })
  const results   = data?.data ?? []
  const link      = useLinkSibling(studentId)

  async function handleLink() {
    if (!selected) return
    try {
      await link.mutateAsync({ sibling_id: selected.id, discount_pct: parseFloat(discount) || 0 })
      toast.success(`${selected.name} linked as sibling.`)
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to link sibling.')
    }
  }

  const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
  const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-sm flex flex-col shadow-xl"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <h2 className="font-semibold">{t('students.addSibling')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('students.searchStudent')}</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('students.searchStudentPlaceholder')}
              className={inputCls}
              style={inputStyle}
            />
            {query.length > 0 && results.length > 0 && !selected && (
              <div
                className="mt-1 rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
              >
                {results.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelected({ id: s.id, name: s.name }); setQuery(s.name) }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5 transition-colors border-b last:border-0"
                    style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs opacity-50">{s.course?.name ?? '—'}</p>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div
                className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: 'rgb(var(--status-success, 14 124 90) / 0.4)', background: 'rgb(var(--status-success, 14 124 90) / 0.05)' }}
              >
                <span className="font-medium">{selected.name}</span>
                <button onClick={() => { setSelected(null); setQuery('') }} className="opacity-50 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('students.siblingDiscount')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          className="shrink-0 px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border hover:bg-black/5 transition-colors" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleLink}
            disabled={!selected || link.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {link.isPending ? t('common.linking') : t('students.linkSibling')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FamilyTabContent({ student }: FamilyTabContentProps) {
  const { t } = useI18n()
  const [showAdd, setShowAdd] = useState(false)
  const unlink = useUnlinkSibling(student.id)

  async function handleUnlink(siblingId: number, name: string) {
    try {
      await unlink.mutateAsync(siblingId)
      toast.success(`${name} unlinked.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to unlink sibling.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('students.siblingsSection')}</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <Plus size={14} />
          {t('students.addSibling')}
        </button>
      </div>

      {student.siblings.length === 0 ? (
        <p className="text-sm opacity-40 text-center py-8">{t('students.noSiblings')}</p>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wide opacity-50" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
                <th className="text-left px-5 py-3">{t('common.name')}</th>
                <th className="text-left px-5 py-3">{t('common.course')}</th>
                <th className="text-left px-5 py-3">{t('common.teacher')}</th>
                <th className="text-left px-5 py-3">Discount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {student.siblings.map((sib) => (
                <tr
                  key={sib.id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/students/${sib.id}`}
                      className="inline-flex items-center gap-1.5 font-medium hover:text-[rgb(14,124,90)] transition-colors group"
                      style={{ color: 'rgb(11 31 58)' }}
                    >
                      {sib.name}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 opacity-70">{sib.course ?? '—'}</td>
                  <td className="px-5 py-3 opacity-70">{sib.teacher_name ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums">{sib.discount_pct}%</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleUnlink(sib.id, sib.name)}
                      disabled={unlink.isPending}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title={t('students.unlinkSibling')}
                    >
                      <Unlink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <LinkSiblingSheet studentId={student.id} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
