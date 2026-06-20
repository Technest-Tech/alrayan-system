'use client'
import { useSessions } from '@/hooks/system/useSessions'
import { useI18n } from '@/lib/system/i18n'

export function MissingReportsBanner({ teacherId }: { teacherId: number }) {
  const { t } = useI18n()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const from = yesterday.toISOString().split('T')[0]

  const { data: result } = useSessions({
    teacher_id: teacherId,
    status:     'attended',
    from:       `${from}T00:00:00Z`,
  })

  const sessions = ((result as any)?.data ?? []) as Array<{ report_overdue_at: string | null; has_report: boolean | null }>
  const missing  = sessions.filter(s => !s.has_report && s.report_overdue_at)

  if (missing.length === 0) return null

  const label = missing.length !== 1 ? t('teachers.missingPlural') : t('teachers.missingSingular')

  return (
    <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800 flex items-center justify-between">
      <span>⚠ {String(missing.length)} {label} {t('teachers.fromPastSessions')}</span>
    </div>
  )
}
