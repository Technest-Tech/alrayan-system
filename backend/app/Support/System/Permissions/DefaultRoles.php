<?php

namespace App\Support\System\Permissions;

class DefaultRoles
{
    public const SUPERVISOR_DEFAULTS = [
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
    ];
}
