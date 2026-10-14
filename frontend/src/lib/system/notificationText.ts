import type { SysNotification } from '@/types/system/notification'

type Translate = (key: string, vars?: Record<string, string>) => string

/**
 * What a notification says, in the viewer's language. The teacher-inbox types carry their facts
 * in `payload` and are worded here; every other type shows the title/body the server stored.
 */
export function notificationText(n: SysNotification, t: Translate): { title: string; body: string | null } {
  const p       = n.payload ?? {}
  const student = String(p.student_name ?? '')
  const hours   = String(p.package_hours ?? 0)
  const pkg     = Number(p.package_number) === 0
    ? t('notifications.teacher.downPaymentPackage')
    : t('notifications.teacher.packageNumber', { number: String(p.package_number) })

  switch (n.type) {
    case 'teacher.student_assigned':
      return {
        title: t('notifications.teacher.studentAssignedTitle'),
        body:  [
          t('notifications.teacher.studentAssignedBody', { student }),
          // A student still on their trial has no package yet; "0 hours" says nothing.
          Number(p.package_hours) > 0 ? t('notifications.teacher.studentAssignedPackage', { hours }) : '',
        ].filter(Boolean).join(' '),
      }
    case 'teacher.package_paid':
      return {
        title: t('notifications.teacher.packagePaidTitle'),
        body:  t('notifications.teacher.packagePaidBody', { student, package: pkg, hours }),
      }
    case 'teacher.package_completed':
      return {
        title: t('notifications.teacher.packageCompletedTitle'),
        body:  t('notifications.teacher.packageCompletedBody', { student, package: pkg, hours }),
      }
    default:
      return { title: n.title, body: n.body }
  }
}
