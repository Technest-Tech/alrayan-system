'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { TodaySessionsList } from '@/components/system/teacher/TodaySessionsList'
import { MissingReportsBanner } from '@/components/system/teacher/MissingReportsBanner'
import { useSessions } from '@/hooks/system/useSessions'
import { useI18n } from '@/lib/system/i18n'

export default function TeacherTodayPage() {
  const { t } = useI18n()
  const today = new Date().toISOString().split('T')[0]

  // teacher_id is injected by the API based on auth token;
  // passing no teacher_id here — backend scopes to authenticated teacher
  const { data: result, isLoading, refetch } = useSessions({
    from: `${today}T00:00:00Z`,
    to:   `${today}T23:59:59Z`,
  })

  const sessions = (result as any)?.data ?? []

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <PageHeader title={t('teacher.today.title')} description={dateLabel} />

      <div className="space-y-4">
        <MissingReportsBanner teacherId={0} />

        {isLoading ? (
          <div className="text-sm text-muted-foreground">{t('teacher.today.loadingSessions')}</div>
        ) : (
          <TodaySessionsList sessions={sessions} onUpdate={refetch} />
        )}
      </div>
    </>
  )
}
