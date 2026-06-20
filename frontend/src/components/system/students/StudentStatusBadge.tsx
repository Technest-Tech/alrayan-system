'use client'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { useI18n } from '@/lib/system/i18n'
import type { StudentStatus } from '@/types/system/student'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const { t } = useI18n()
  const LABELS: Record<StudentStatus, string> = {
    trial:     t('status.trial'),
    active:    t('status.active'),
    paused:    t('status.paused'),
    suspended: t('status.suspended'),
    cancelled: t('status.cancelled'),
  }
  return <StatusBadge value={status} label={LABELS[status]} />
}
