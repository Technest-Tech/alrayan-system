'use client'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { ReviewLeaveSheet } from '@/components/system/teachers/ReviewLeaveSheet'
import { useTeacherLeaves } from '@/hooks/system/useTeacherLeaves'
import { useI18n } from '@/lib/system/i18n'
import type { TeacherLeave } from '@/types/system/teacher'

export default function TeacherLeavePage() {
  const { t } = useI18n()
  const [reviewing, setReviewing] = useState<TeacherLeave | null>(null)

  const { data, isLoading } = useTeacherLeaves()
  const leaves = data?.data ?? []
  const pending = leaves.filter((l) => l.status === 'pending')

  return (
    <>
      <PageHeader
        title={t('teachers.leaveTitle')}
        description={t('teachers.leaveSubtitle')}
      />

      {pending.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-5"
          style={{ background: 'rgb(var(--status-warning, 154 113 23) / 0.1)', border: '1px solid rgb(var(--status-warning, 154 113 23) / 0.3)' }}
        >
          <AlertTriangle size={18} style={{ color: 'rgb(var(--status-warning, 154 113 23))' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'rgb(var(--status-warning, 154 113 23))' }}>
              {pending.length} {pending.length === 1 ? t('teachers.leavePendingSingular') : t('teachers.leavePendingPlural')} {t('teachers.leaveAwaitingReview')}
            </p>
            <p className="text-xs mt-0.5 opacity-70">{t('teachers.leaveInstruction')}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <EmptyState icon="CalendarOff" title={t('teachers.leaveEmpty')} description={t('teachers.leaveEmptyDescription')} />
      ) : (
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-xs font-semibold uppercase tracking-wide opacity-50"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
              >
                <th className="text-left px-5 py-3">{t('teachers.leaveColumnTeacher')}</th>
                <th className="text-left px-5 py-3">{t('teachers.leaveColumnPeriod')}</th>
                <th className="text-left px-5 py-3">{t('teachers.leaveColumnReason')}</th>
                <th className="text-left px-5 py-3">{t('teachers.leaveColumnStatus')}</th>
                <th className="text-left px-5 py-3">{t('teachers.leaveColumnRequested')}</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr
                  key={leave.id}
                  onClick={() => setReviewing(leave)}
                  className="border-b last:border-0 hover:bg-black/5 transition-colors cursor-pointer"
                  style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
                >
                  <td className="px-5 py-3 font-medium">{leave.teacher_name ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums">{leave.start_date} – {leave.end_date}</td>
                  <td className="px-5 py-3 opacity-70 max-w-xs truncate">{leave.reason}</td>
                  <td className="px-5 py-3"><StatusBadge value={leave.status} /></td>
                  <td className="px-5 py-3 opacity-50">
                    {new Date(leave.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReviewLeaveSheet leave={reviewing} onClose={() => setReviewing(null)} />
    </>
  )
}
