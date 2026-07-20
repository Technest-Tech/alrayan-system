<?php

namespace App\Support\System\Permissions;

class DefaultRoles
{
    public const SUPERVISOR_DEFAULTS = [
        'leads.view', 'leads.view_any', 'leads.create', 'leads.edit', 'leads.convert',
        'leads.assign', 'leads.mark_lost',
        'lead_followups.create', 'lead_followups.edit', 'lead_followups.complete', 'lead_followups.delete',
        'tasks.view', 'tasks.view_any', 'tasks.create', 'tasks.edit', 'tasks.assign',
        'tasks.approve', 'tasks.reject',
        'task_notes.create', 'task_notes.delete',
        'students.view', 'students.create', 'students.edit', 'students.change_status',
        'teachers.view',
        'courses.view',
        'schedule.view', 'schedule.edit', 'schedule.reschedule',
        'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
        'attendance.view', 'attendance.edit',
        'reports.view',
        'qc.view', 'qc.create', 'qc.edit',
        'invoices.view', 'invoices.create', 'invoices.record_payment',
        'notifications.view',
        'whatsapp.view',
        'certificates.view',
        'users.view', 'users.view_directory',
    ];

    public const QUALITY_DEFAULTS = [
        'quality.view', 'quality.view_any', 'quality.review', 'quality.view_own',
        'qc.view', 'qc.create', 'qc.edit', 'qc.delete', 'qc.manage_settings',
        'teachers.view',
        'reports.view', 'reports.view_any',
        'sessions.view',
        'attendance.view',
        'tasks.view', 'tasks.view_any', 'tasks.edit', 'tasks.approve', 'tasks.reject',
        'task_notes.create',
        'users.view', 'users.view_directory',
    ];

    /**
     * Teachers manage their own portal: dashboard, own students, own calendar
     * (view + create/edit/delete their OWN lessons & schedules), own settings.
     * The lessons.* grants unlock the shared calendar UI; every calendar/lesson
     * read is scoped to the authenticated teacher server-side, and every write
     * is forced to their own teacher_id + own students (controllers + policies),
     * so a teacher can never touch another teacher's data. Everything else runs
     * through unguarded self-service (`/teachers/me/*`, `/uploads`, `profile-stats`).
     */
    public const TEACHER_DEFAULTS = [
        'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
    ];

    public const ACCOUNTANT_DEFAULTS = [
        'invoices.view', 'invoices.create', 'invoices.create_advance', 'invoices.edit',
        'invoices.void', 'invoices.record_payment', 'invoices.resend_link', 'invoices.download_pdf', 'invoices.export',
        'wallet.view', 'wallet.credit', 'wallet.debit', 'wallet.adjust',
        'payments.view', 'payments.refund',
        'payroll.view', 'payroll.view_any', 'payroll.approve', 'payroll.mark_transferred', 'payroll.adjust', 'payroll.export',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
        'accounting.view', 'accounting.export',
        'tasks.view', 'tasks.view_any', 'tasks.approve', 'tasks.reject',
        'task_notes.create',
        'users.view', 'users.view_directory',
    ];

    /**
     * Default permission set for a role. Roles not listed here (admin gets
     * everything elsewhere; parent/student/teacher are subjects, not operators)
     * receive no system-panel permissions by default.
     *
     * @return list<string>
     */
    public static function forRole(string $role): array
    {
        return match ($role) {
            'supervisor' => self::SUPERVISOR_DEFAULTS,
            'quality'    => self::QUALITY_DEFAULTS,
            'accountant' => self::ACCOUNTANT_DEFAULTS,
            'teacher'    => self::TEACHER_DEFAULTS,
            default      => [],
        };
    }
}
