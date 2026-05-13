<?php

namespace App\Support\System;

class NotificationTypes
{
    const LEAD_CREATED                  = 'lead.created';
    const LEAD_FOLLOWUP_DUE             = 'lead.followup_due';
    const LEAD_FOLLOWUP_DUE_UNASSIGNED  = 'lead.followup_due_unassigned';
    const LEAD_TRIAL_PENDING            = 'lead.trial_pending';

    const INVOICE_OVERDUE               = 'invoice.overdue';
    const PAYMENT_RECEIVED              = 'payment.received';
    const PAYROLL_UPCOMING_DUE          = 'payroll.upcoming_due';

    const REPORT_OVERDUE                = 'report.overdue';
    const STUDENT_ABSENCE_STREAK        = 'student.absence_streak';
    const STUDENT_AUTO_SUSPENDED        = 'student.auto_suspended';
    const STUDENT_NO_WHATSAPP_GROUP     = 'student.no_whatsapp_group';

    const TEACHER_LEAVE_PENDING         = 'teacher.leave_pending';
    const TEACHER_LEAVE_NEEDS_RESCHEDULE= 'teacher.leave_needs_reschedule';
}
