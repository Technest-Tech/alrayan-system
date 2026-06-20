import type { LucideIcon } from 'lucide-react'
import {
  Package, CalendarX, Clock, UserX, Gift, Cake, Info, Coins, ClipboardList, FileText,
} from 'lucide-react'

export type TaskStatus = 'new' | 'following_up' | 'review_underway' | 'done' | 'postponed'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskType =
  | 'package_complete'
  | 'schedule_removal'
  | 'late_lesson_deduction'
  | 'absent_paid_approval'
  | 'free_lesson_approval'
  | 'birthday_reminder'
  | 'trial_lesson_info'
  | 'teacher_referral_bonus'
  | 'manual_task'
  | 'review_progress_report'

export interface Task {
  id: number
  type: TaskType
  actionable: boolean
  status: TaskStatus
  priority: TaskPriority
  title: string
  body: string | null
  payload: Record<string, unknown> | null
  related_type: string | null
  related_id: number | null
  student_id: number | null
  student_name?: string | null
  teacher_id: number | null
  teacher_name?: string | null
  assignee_role: string | null
  assignee_user_id: number | null
  assignee_name?: string | null
  created_by: number | null
  due_at: string | null
  decision: 'approved' | 'rejected' | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskNote {
  id: number
  body: string
  actor_name: string | null
  created_at: string
}

export interface TaskActivity {
  id: number
  event: string
  description: string | null
  properties: Record<string, unknown> | null
  causer_name: string | null
  created_at: string
}

export interface TaskDetail extends Task {
  created_by_name?: string | null
  decided_by?: number | null
  decided_by_name?: string | null
  decision_notes?: string | null
  notes?: TaskNote[]
  activities?: TaskActivity[]
}

export const TASK_STATUSES: TaskStatus[] = ['new', 'following_up', 'review_underway', 'done', 'postponed']

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new:             'New task',
  following_up:    'Following up',
  review_underway: 'Review underway',
  done:            'Done',
  postponed:       'Postponed',
}

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  new:             '#1E5AAB',
  following_up:    '#B47800',
  review_underway: '#7C3AED',
  done:            '#0E7C5A',
  postponed:       '#64748b',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
  urgent: 'Urgent',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, { bg: string; color: string }> = {
  urgent: { bg: 'rgb(220 60 40 / 0.14)', color: 'rgb(180 30 15)' },
  high:   { bg: 'rgb(220 130 20 / 0.14)', color: 'rgb(150 85 0)' },
  medium: { bg: 'rgb(180 120 0 / 0.12)', color: 'rgb(140 95 0)' },
  low:    { bg: 'rgb(90 100 112 / 0.1)', color: 'rgb(90 100 112)' },
}

export interface TaskTypeMeta {
  label: string
  icon: LucideIcon
  accent: string
  actionable: boolean
}

/** Presentation registry. Adding a new type is a single entry here. */
export const TASK_TYPE_META: Record<TaskType, TaskTypeMeta> = {
  package_complete:       { label: 'Package Complete',       icon: Package,       accent: '#0E7C5A', actionable: false },
  schedule_removal:       { label: 'Schedule Removal',       icon: CalendarX,     accent: '#C0392B', actionable: false },
  late_lesson_deduction:  { label: 'Late Lesson Deduction',  icon: Clock,         accent: '#C0392B', actionable: true  },
  absent_paid_approval:   { label: 'Absent Paid Approval',   icon: UserX,         accent: '#B47800', actionable: true  },
  free_lesson_approval:   { label: 'Free Lesson Approval',   icon: Gift,          accent: '#1E5AAB', actionable: true  },
  birthday_reminder:      { label: 'Birthday Reminder',      icon: Cake,          accent: '#BE185D', actionable: false },
  trial_lesson_info:      { label: 'Trial Lesson Info',      icon: Info,          accent: '#1E5AAB', actionable: false },
  teacher_referral_bonus: { label: 'Teacher Referral Bonus', icon: Coins,         accent: '#0E7C5A', actionable: true  },
  manual_task:            { label: 'Manual Task',            icon: ClipboardList, accent: '#5A6470', actionable: false },
  review_progress_report: { label: 'Review Progress Report', icon: FileText,      accent: '#7C3AED', actionable: true  },
}

export function taskTypeMeta(type: string): TaskTypeMeta {
  return TASK_TYPE_META[type as TaskType] ?? {
    label: type.replace(/_/g, ' '),
    icon: ClipboardList,
    accent: '#5A6470',
    actionable: false,
  }
}

/** Format a minor-unit amount (e.g. cents) as a currency string. */
export function formatMinor(minor: unknown, currency = 'EUR'): string | null {
  const n = typeof minor === 'number' ? minor : Number(minor)
  if (!Number.isFinite(n)) return null
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${(n / 100).toFixed(2)}`
}
