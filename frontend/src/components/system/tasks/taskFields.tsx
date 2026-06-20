import { formatMinor, type Task, type TaskPriority, type TaskStatus } from '@/types/system/task'

/* ─── i18n key maps (resolved at render sites with t()) ───────── */
export const TASK_TYPE_KEYS: Record<string, string> = {
  package_complete:       'tasks.type.packageComplete',
  schedule_removal:       'tasks.type.scheduleRemoval',
  late_lesson_deduction:  'tasks.type.lateLessonDeduction',
  absent_paid_approval:   'tasks.type.absentPaidApproval',
  free_lesson_approval:   'tasks.type.freeLessonApproval',
  birthday_reminder:      'tasks.type.birthdayReminder',
  trial_lesson_info:      'tasks.type.trialLessonInfo',
  teacher_referral_bonus: 'tasks.type.teacherReferralBonus',
  manual_task:            'tasks.type.manualTask',
  review_progress_report: 'tasks.type.reviewProgressReport',
}

export const TASK_PRIORITY_KEYS: Record<TaskPriority, string> = {
  low:    'tasks.priority.low',
  medium: 'tasks.priority.medium',
  high:   'tasks.priority.high',
  urgent: 'tasks.priority.urgent',
}

export const TASK_ROLE_KEYS: Record<string, string> = {
  supervisor: 'tasks.roles.supervisor',
  quality:    'tasks.roles.quality',
  accountant: 'tasks.roles.accountant',
  admin:      'tasks.roles.admin',
}

export const TASK_STATUS_KEYS: Record<TaskStatus, string> = {
  new:             'tasks.kanban.new',
  following_up:    'tasks.kanban.followingUp',
  review_underway: 'tasks.kanban.reviewUnderway',
  done:            'tasks.kanban.done',
  postponed:       'tasks.kanban.postponed',
}

/** Resolve a task-type i18n key, falling back to the humanized type slug. */
export function taskTypeKey(type: string): string | null {
  return TASK_TYPE_KEYS[type] ?? null
}

export interface Field {
  /** i18n key for the field label, resolved at the render site with t(). */
  labelKey: string
  value: string
}

function p(task: Task): Record<string, unknown> {
  return task.payload ?? {}
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v)
}

function dt(v: unknown): string | null {
  const s = str(v)
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Compact key/value lines shown on a task card and in the detail panel. */
export function taskFields(task: Task): Field[] {
  const d = p(task)
  const out: Field[] = []
  const push = (labelKey: string, value: string | null) => { if (value) out.push({ labelKey, value }) }

  switch (task.type) {
    case 'package_complete':
      push('tasks.fields.packageNumber', str(d.package_number))
      push('tasks.fields.packageHours', d.package_hours ? `${d.package_hours}h` : null)
      push('tasks.fields.consumed', d.consumed_hours != null ? `${d.consumed_hours}h` : null)
      push('tasks.fields.tariff', formatMinor(d.tariff_minor, str(d.currency) ?? 'EUR'))
      break
    case 'schedule_removal':
      push('common.teacher', str(d.teacher_name) ?? task.teacher_name ?? null)
      push('tasks.fields.scheduled', dt(d.scheduled_start))
      push('common.duration', d.duration_min ? `${d.duration_min} min` : null)
      push('tasks.fields.cancelledBy', str(d.cancelled_by))
      push('common.reason', str(d.cancellation_reason))
      break
    case 'late_lesson_deduction':
      push('common.teacher', str(d.teacher_name) ?? task.teacher_name ?? null)
      push('tasks.fields.deduction', formatMinor(d.amount_minor, str(d.currency) ?? 'EUR'))
      push('tasks.fields.scheduled', dt(d.scheduled_at))
      break
    case 'absent_paid_approval':
      push('common.teacher', str(d.teacher_name) ?? task.teacher_name ?? null)
      push('tasks.fields.sessionNumber', str(d.session_number))
      push('tasks.fields.scheduled', dt(d.scheduled_at))
      push('common.notes', str(d.notes))
      break
    case 'review_progress_report':
      push('common.teacher', str(d.teacher_name) ?? task.teacher_name ?? null)
      push('tasks.fields.currentProgress', str(d.current_progress))
      push('tasks.fields.nextSteps', str(d.next_steps))
      break
    default:
      // manual_task and others fall back to the body text.
      if (task.body) push('tasks.fields.details', task.body)
      break
  }
  return out
}
