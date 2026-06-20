<?php

namespace Database\Seeders\System;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MessageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'key'                 => 'welcome_student',
                'channel'             => 'whatsapp',
                'label'               => 'Welcome message to new student',
                'body'                => "Assalamu alaikum {student_name}! Welcome to {academy_name}. Your first session with {assigned_teacher} is at {first_session_time}. We can't wait to begin this journey with you.",
                'available_variables' => ['student_name', 'academy_name', 'assigned_teacher', 'first_session_time'],
                'example_values'      => ['student_name' => 'Sarah Ahmed', 'academy_name' => 'Azhary', 'assigned_teacher' => 'Sh. Hassan', 'first_session_time' => 'Mon Jun 14 18:00 EDT'],
            ],
            [
                'key'                 => 'session_reminder_student',
                'channel'             => 'whatsapp',
                'label'               => 'Session reminder — student group',
                'body'                => "Reminder: your {course_name} session with {teacher_name} starts at {session_time_local}. Join here: {zoom_join_url}",
                'available_variables' => ['student_name', 'teacher_name', 'session_time_local', 'course_name', 'zoom_join_url'],
                'example_values'      => ['student_name' => 'Sarah Ahmed', 'teacher_name' => 'Sh. Hassan', 'session_time_local' => '18:00 EDT', 'course_name' => 'Tajweed', 'zoom_join_url' => 'https://zoom.us/j/123'],
            ],
            [
                'key'                 => 'session_reminder_teacher',
                'channel'             => 'whatsapp',
                'label'               => 'Session reminder — teacher group',
                'body'                => "Reminder: you have a {duration_min}-minute session with {student_name} ({course_name}) at {session_time_local}. Host link: {zoom_start_url}",
                'available_variables' => ['teacher_name', 'student_name', 'session_time_local', 'course_name', 'zoom_start_url', 'duration_min'],
                'example_values'      => ['teacher_name' => 'Sh. Hassan', 'student_name' => 'Sarah Ahmed', 'session_time_local' => '18:00 EDT', 'course_name' => 'Tajweed', 'zoom_start_url' => 'https://zoom.us/s/456', 'duration_min' => '60'],
            ],
            [
                'key'                 => 'payment_due_soon',
                'channel'             => 'whatsapp',
                'label'               => 'Payment due in N days',
                'body'                => "Hello {student_name}, your invoice {invoice_number} for {amount_with_currency} is due on {due_date}. Pay here: {payment_link}",
                'available_variables' => ['student_name', 'invoice_number', 'amount_with_currency', 'due_date', 'payment_link', 'days_until_due'],
                'example_values'      => ['student_name' => 'Yusuf Khan', 'invoice_number' => 'INV-2026-0042', 'amount_with_currency' => '$120.00 USD', 'due_date' => '2026-07-15', 'payment_link' => 'https://pay.paymob.com/...', 'days_until_due' => '3'],
            ],
            [
                'key'                 => 'payment_due_today',
                'channel'             => 'whatsapp',
                'label'               => 'Payment due today',
                'body'                => "Reminder: your invoice {invoice_number} for {amount_with_currency} is due today. Pay here: {payment_link}",
                'available_variables' => ['student_name', 'invoice_number', 'amount_with_currency', 'payment_link'],
                'example_values'      => ['student_name' => 'Yusuf Khan', 'invoice_number' => 'INV-2026-0042', 'amount_with_currency' => '$120.00 USD', 'payment_link' => 'https://pay.paymob.com/...'],
            ],
            [
                'key'                 => 'payment_overdue',
                'channel'             => 'whatsapp',
                'label'               => 'Payment overdue',
                'body'                => "Your invoice {invoice_number} for {amount_with_currency} was due on {due_date}. Please complete payment here to avoid suspension: {payment_link}",
                'available_variables' => ['student_name', 'invoice_number', 'amount_with_currency', 'due_date', 'payment_link', 'days_overdue'],
                'example_values'      => ['student_name' => 'Yusuf Khan', 'invoice_number' => 'INV-2026-0042', 'amount_with_currency' => '$120.00 USD', 'due_date' => '2026-07-10', 'payment_link' => 'https://pay.paymob.com/...', 'days_overdue' => '2'],
            ],
            [
                'key'                 => 'payment_received',
                'channel'             => 'whatsapp',
                'label'               => 'Payment confirmation',
                'body'                => "Thank you, {student_name}! We've received your payment for invoice {invoice_number}.",
                'available_variables' => ['student_name', 'invoice_number'],
                'example_values'      => ['student_name' => 'Yusuf Khan', 'invoice_number' => 'INV-2026-0042'],
            ],
            [
                'key'                 => 'report_overdue_teacher',
                'channel'             => 'whatsapp',
                'label'               => 'Submit session report reminder',
                'body'                => "Reminder, {teacher_name}: please submit the session report for {student_name} ({session_time_local}).",
                'available_variables' => ['teacher_name', 'student_name', 'session_time_local'],
                'example_values'      => ['teacher_name' => 'Sh. Hassan', 'student_name' => 'Sarah Ahmed', 'session_time_local' => 'Jun 12 18:00'],
            ],
            [
                'key'                 => 'student_paused_teacher',
                'channel'             => 'whatsapp',
                'label'               => 'Student paused — sessions on hold',
                'body'                => "Heads up: {student_name}'s subscription has been paused. Their upcoming sessions are cancelled. We'll notify you when they reactivate.",
                'available_variables' => ['student_name'],
                'example_values'      => ['student_name' => 'Sarah Ahmed'],
            ],
            [
                'key'                 => 'student_suspended_teacher',
                'channel'             => 'whatsapp',
                'label'               => 'Student suspended',
                'body'                => "{student_name} has been suspended for non-payment. All upcoming sessions are cancelled until further notice.",
                'available_variables' => ['student_name'],
                'example_values'      => ['student_name' => 'Sarah Ahmed'],
            ],
            [
                'key'                 => 'teacher_leave_admin',
                'channel'             => 'whatsapp',
                'label'               => 'Teacher leave needs review',
                'body'                => "{teacher_name} requested leave from {start_date} to {end_date}. {affected_sessions_count} sessions will need rescheduling.",
                'available_variables' => ['teacher_name', 'start_date', 'end_date', 'affected_sessions_count'],
                'example_values'      => ['teacher_name' => 'Sh. Hassan', 'start_date' => '2026-07-01', 'end_date' => '2026-07-07', 'affected_sessions_count' => '4'],
            ],
            [
                'key'                 => 'lead_followup_internal',
                'channel'             => 'whatsapp',
                'label'               => 'Internal lead follow-up reminder',
                'body'                => "Follow up with {lead_name}: {action}",
                'available_variables' => ['lead_name', 'action'],
                'example_values'      => ['lead_name' => 'Sarah Ahmed', 'action' => 'Call back'],
            ],
        ];

        foreach ($templates as $tpl) {
            DB::table('sys_message_templates')->updateOrInsert(
                ['key' => $tpl['key']],
                array_merge($tpl, [
                    'available_variables' => json_encode($tpl['available_variables']),
                    'example_values'      => json_encode($tpl['example_values']),
                    'is_active'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ])
            );
        }
    }
}
