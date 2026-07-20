'use client'
import { Eye, Pencil, Trash2, ClipboardList, Clock } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import type { QcEvaluation } from '@/types/system/qualityControl'
import { ScoreBadge } from './ScoreBadge'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const TEAL   = '#0d9488'

function formatDate(dt: string | null): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function EvaluationsTable({
  evaluations,
  summary,
  isLoading,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  evaluations: QcEvaluation[]
  summary?: { count: number; total_duration_minutes: number }
  isLoading?: boolean
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (e: QcEvaluation) => void
  canEdit: boolean
  canDelete: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: 'rgb(var(--surface-card,255 255 255))' }}>
      {/* Summary */}
      <div className="flex items-center gap-5 px-4 py-3 border-b text-sm" style={{ borderColor: BORDER }}>
        <span className="inline-flex items-center gap-1.5" style={{ color: NAVY }}>
          <ClipboardList size={14} style={{ color: TEAL }} />
          <b className="tabular-nums">{summary?.count ?? evaluations.length}</b>
          <span style={{ color: MUTED }}>{t('qualityControl.summary.evaluations')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: NAVY }}>
          <Clock size={14} style={{ color: TEAL }} />
          <b className="tabular-nums">{summary?.total_duration_minutes ?? 0}{t('qualityControl.summary.minutes')}</b>
          <span style={{ color: MUTED }}>{t('qualityControl.summary.totalDuration')}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2,248 250 252))' }}>
            <tr>
              {[
                t('qualityControl.table.teacher'),
                t('qualityControl.table.student'),
                t('qualityControl.table.duration'),
                t('qualityControl.table.score'),
                t('qualityControl.table.qualityManager'),
                t('qualityControl.table.date'),
                '',
              ].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: '#F1F5F9' }} /></td>
                  ))}
                </tr>
              ))
            ) : evaluations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm" style={{ color: MUTED }}>
                  {t('qualityControl.table.empty')}
                </td>
              </tr>
            ) : (
              evaluations.map(ev => (
                <tr key={ev.id} className="hover:bg-black/[0.015] transition-colors" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{ev.teacher_name ?? t('qualityControl.table.unknown')}</td>
                  <td className="px-4 py-3" style={{ color: NAVY }}>{ev.student_name ?? t('qualityControl.table.unknown')}</td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{ev.duration_minutes} {t('qualityControl.table.minutes')}</td>
                  <td className="px-4 py-3"><ScoreBadge score={ev.score} /></td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{ev.quality_manager_name ?? t('qualityControl.table.unassigned')}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: MUTED }}>{formatDate(ev.evaluated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn label={t('qualityControl.table.view')} onClick={() => onView(ev.id)}><Eye size={15} /></IconBtn>
                      {canEdit && <IconBtn label={t('qualityControl.table.edit')} onClick={() => onEdit(ev.id)}><Pencil size={15} /></IconBtn>}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(ev)}
                          aria-label={t('qualityControl.table.delete')}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" style={{ color: MUTED }}>
      {children}
    </button>
  )
}
