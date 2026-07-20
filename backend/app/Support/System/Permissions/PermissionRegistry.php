<?php

namespace App\Support\System\Permissions;

class PermissionRegistry
{
    public const GROUPS = [
        'leads'          => ['view', 'view_any', 'create', 'edit', 'delete', 'convert', 'assign', 'mark_lost'],
        'lead_followups' => ['create', 'edit', 'complete', 'delete'],
        'tasks'          => ['view', 'view_any', 'create', 'edit', 'assign', 'approve', 'reject', 'delete'],
        'task_notes'     => ['create', 'delete'],
        'students'      => ['view', 'create', 'edit', 'delete', 'change_status'],
        'teachers'      => ['view', 'create', 'edit', 'delete', 'approve_leave'],
        'courses'       => ['view', 'edit'],
        'schedule'      => ['view', 'edit', 'reschedule'],
        'lessons'       => ['view', 'create', 'edit', 'delete'],
        'sessions'      => ['view', 'create', 'edit', 'reschedule', 'cancel'],
        'attendance'    => ['view', 'edit'],
        'reports'       => ['view', 'view_any', 'submit', 'edit_own', 'edit_any', 'delete_any'],
        'makeups'       => ['view', 'request', 'approve'],
        'quality'       => ['view', 'view_any', 'review', 'view_own'],
        'qc'            => ['view', 'create', 'edit', 'delete', 'manage_settings'],
        'invoices'      => ['view', 'create', 'create_advance', 'edit', 'void', 'record_payment', 'resend_link', 'download_pdf', 'export'],
        'wallet'        => ['view', 'credit', 'debit', 'adjust'],
        'payments'      => ['view', 'refund'],
        'payroll'       => ['view', 'view_any', 'approve', 'reject', 'mark_transferred', 'adjust', 'export'],
        'expenses'      => ['view', 'create', 'edit', 'delete'],
        'accounting'    => ['view', 'export'],
        'notifications' => ['view', 'edit_templates'],
        'whatsapp'      => ['view', 'edit'],
        'certificates'  => ['view', 'issue'],
        'settings'      => ['view', 'edit'],
        'users'          => ['view', 'view_directory', 'invite', 'create', 'edit', 'deactivate', 'suspend', 'archive', 'delete'],
        'audit'          => ['view'],
        'students_notes' => ['view', 'create', 'edit_own', 'edit_any', 'delete_own', 'delete_any'],
        'teachers_notes' => ['view', 'create', 'edit_own', 'edit_any', 'delete_own', 'delete_any'],
    ];

    public static function all(): array
    {
        $out = [];
        foreach (self::GROUPS as $group => $actions) {
            foreach ($actions as $action) {
                $out[] = "$group.$action";
            }
        }
        return $out;
    }
}
