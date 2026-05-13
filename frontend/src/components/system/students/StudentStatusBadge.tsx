import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import type { StudentStatus } from '@/types/system/student'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

const STATUS_LABELS: Record<StudentStatus, string> = {
  trial:     'Trial',
  active:    'Active',
  paused:    'Paused',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  return <StatusBadge value={status} label={STATUS_LABELS[status]} />
}
