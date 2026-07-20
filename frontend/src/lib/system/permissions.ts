import type { AuthUser } from '@/types/system/auth'

export type Permission =
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.convert'
  | 'students.view' | 'students.create' | 'students.edit' | 'students.delete' | 'students.change_status'
  | 'teachers.view' | 'teachers.create' | 'teachers.edit' | 'teachers.delete' | 'teachers.approve_leave'
  | 'courses.view' | 'courses.edit'
  | 'schedule.view' | 'schedule.edit' | 'schedule.reschedule'
  | 'attendance.view' | 'attendance.edit'
  | 'reports.view' | 'reports.edit'
  | 'quality.view' | 'quality.review'
  | 'qc.view' | 'qc.create' | 'qc.edit' | 'qc.delete' | 'qc.manage_settings'
  | 'invoices.view' | 'invoices.create' | 'invoices.edit' | 'invoices.void' | 'invoices.record_payment'
  | 'wallet.view' | 'wallet.adjust'
  | 'payroll.view' | 'payroll.approve' | 'payroll.mark_transferred'
  | 'expenses.view' | 'expenses.create' | 'expenses.edit' | 'expenses.delete'
  | 'accounting.view' | 'accounting.export'
  | 'notifications.view' | 'notifications.edit_templates'
  | 'whatsapp.view' | 'whatsapp.edit'
  | 'certificates.view' | 'certificates.issue'
  | 'settings.view' | 'settings.edit'
  | 'users.view' | 'users.view_directory' | 'users.invite' | 'users.create' | 'users.edit' | 'users.deactivate' | 'users.suspend' | 'users.archive'
  | 'audit.view'

export const PERMISSION_GROUPS: Record<string, string[]> = {
  leads:         ['view', 'create', 'edit', 'delete', 'convert'],
  students:      ['view', 'create', 'edit', 'delete', 'change_status'],
  teachers:      ['view', 'create', 'edit', 'delete', 'approve_leave'],
  courses:       ['view', 'edit'],
  schedule:      ['view', 'edit', 'reschedule'],
  attendance:    ['view', 'edit'],
  reports:       ['view', 'edit'],
  quality:       ['view', 'review'],
  qc:            ['view', 'create', 'edit', 'delete', 'manage_settings'],
  invoices:      ['view', 'create', 'edit', 'void', 'record_payment'],
  wallet:        ['view', 'adjust'],
  payroll:       ['view', 'approve', 'mark_transferred'],
  expenses:      ['view', 'create', 'edit', 'delete'],
  accounting:    ['view', 'export'],
  notifications: ['view', 'edit_templates'],
  whatsapp:      ['view', 'edit'],
  certificates:  ['view', 'issue'],
  settings:      ['view', 'edit'],
  users:         ['view', 'view_directory', 'invite', 'create', 'edit', 'deactivate', 'suspend', 'archive'],
  audit:         ['view'],
}

export const SUPERVISOR_DEFAULTS: Permission[] = [
  'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
  'students.view', 'students.create', 'students.edit', 'students.change_status',
  'teachers.view',
  'courses.view',
  'schedule.view', 'schedule.edit', 'schedule.reschedule',
  'attendance.view', 'attendance.edit',
  'reports.view',
  'invoices.view', 'invoices.create', 'invoices.record_payment',
  'notifications.view',
  'whatsapp.view',
  'certificates.view',
]

export function can(user: AuthUser, perm: Permission): boolean {
  if (user.role === 'admin') return true
  return user.permissions.includes(perm)
}
