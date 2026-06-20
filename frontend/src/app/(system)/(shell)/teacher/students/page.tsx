'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useStudents } from '@/hooks/system/useStudents'
import { useI18n } from '@/lib/system/i18n'

export default function TeacherStudentsPage() {
  const { t } = useI18n()
  const { data: result, isLoading } = useStudents({ per_page: 50 })
  const students = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title={t('users.teacherMyStudents')} description={t('users.teacherMyStudentsDescription')} />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {t('users.teacherNoStudents')}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left">{t('common.name')}</th>
                <th className="py-2 px-3 text-left">{t('common.course')}</th>
                <th className="py-2 px-3 text-left">{t('common.timezone')}</th>
                <th className="py-2 px-3 text-left">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">{s.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.course?.name ?? '—'}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.timezone ?? '—'}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
