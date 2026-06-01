<?php

use App\Http\Controllers\System\AccountingController;
use App\Http\Controllers\System\AcademyInfoController;
use App\Http\Controllers\System\AuditLogController;
use App\Http\Controllers\System\AuthController;
use App\Http\Controllers\System\BackupsController;
use App\Http\Controllers\System\BillingExportController;
use App\Http\Controllers\System\CertificateController;
use App\Http\Controllers\System\CourseController;
use App\Http\Controllers\System\DashboardController;
use App\Http\Controllers\System\ExpenseCategoryController;
use App\Http\Controllers\System\ExpenseController;
use App\Http\Controllers\System\ExportController;
use App\Http\Controllers\System\FxRatesController;
use App\Http\Controllers\System\HealthController;
use App\Http\Controllers\System\InvoiceController;
use App\Http\Controllers\System\LeadAnalyticsController;
use App\Http\Controllers\System\LeadController;
use App\Http\Controllers\System\LeadFollowUpController;
use App\Http\Controllers\System\MakeupRequestController;
use App\Http\Controllers\System\MessageTemplateController;
use App\Http\Controllers\System\MonthlyReportController;
use App\Http\Controllers\System\NotificationController;
use App\Http\Controllers\System\NotificationPreferencesController;
use App\Http\Controllers\System\PaymentController;
use App\Http\Controllers\System\PaymobIntegrationController;
use App\Http\Controllers\System\PaymobWebhookController;
use App\Http\Controllers\System\PricingSettingsController;
use App\Http\Controllers\System\SavedViewController;
use App\Http\Controllers\System\SchedulePatternController;
use App\Http\Controllers\System\SessionController;
use App\Http\Controllers\System\SessionReportController;
use App\Http\Controllers\System\GuardianController;
use App\Http\Controllers\System\StudentController;
use App\Http\Controllers\System\StudentFamilyController;
use App\Http\Controllers\System\StudentNoteController;
use App\Http\Controllers\System\StudentTransitionController;
use App\Http\Controllers\System\ActivateStudentController;
use App\Http\Controllers\System\TeacherAvailabilityController;
use App\Http\Controllers\System\TeacherController;
use App\Http\Controllers\System\TeacherLeaveController;
use App\Http\Controllers\System\TeacherNoteController;
use App\Http\Controllers\System\TeacherReportController;
use App\Http\Controllers\System\UserController;
use App\Http\Controllers\System\WalletController;
use App\Http\Controllers\System\WassenderIntegrationController;
use App\Http\Controllers\System\WassenderLogController;
use App\Http\Controllers\System\WhatsAppGroupController;
use Illuminate\Support\Facades\Route;

Route::prefix('system')->name('system.')->group(function () {
    // Health check — no auth required
    Route::get('/health', [HealthController::class, 'show'])->name('health');

    // Auth endpoints — no session required
    Route::post('/auth/login',           [AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot');
    Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword'])->name('auth.reset');

    // Authenticated system endpoints
    Route::middleware(['auth:sanctum', 'system.active'])->group(function () {
        Route::get('/auth/me',      [AuthController::class, 'me'])->name('auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');

        // Users
        Route::middleware('system.can:users.view')->group(function () {
            Route::get('/users', [UserController::class, 'index'])->name('users.index');
        });
        Route::middleware('system.can:users.invite')->post('/users/invite', [UserController::class, 'invite'])->name('users.invite');
        Route::middleware('system.can:users.edit')->group(function () {
            Route::patch('/users/{id}',              [UserController::class, 'update'])->name('users.update');
            Route::post('/users/{id}/resend-invite', [UserController::class, 'resendInvite'])->name('users.resend-invite');
        });
        Route::middleware('system.can:users.deactivate')->group(function () {
            Route::post('/users/{id}/activate',   [UserController::class, 'activate'])->name('users.activate');
            Route::post('/users/{id}/deactivate', [UserController::class, 'deactivate'])->name('users.deactivate');
        });

        // Notifications
        Route::middleware('system.can:notifications.view')->group(function () {
            Route::get('/notifications',                   [NotificationController::class, 'index'])->name('notifications.index');
            Route::get('/notifications/unread-count',      [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
            Route::post('/notifications/{id}/read',        [NotificationController::class, 'markRead'])->name('notifications.read');
            Route::post('/notifications/read-all',         [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
        });

        // ── SYS-03 ──────────────────────────────────────────────────────────────

        // Courses
        Route::middleware('system.can:courses.view')->get('/courses', [CourseController::class, 'index'])->name('courses.index');
        Route::middleware('system.can:courses.edit')->patch('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');

        // Teachers
        Route::middleware('system.can:teachers.view')->group(function () {
            Route::get('/teachers',      [TeacherController::class, 'index'])->name('teachers.index');
            Route::get('/teachers/{teacher}/notes', [TeacherNoteController::class, 'index'])->name('teachers.notes.index');
        });
        Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::middleware('system.can:teachers.edit')->group(function () {
            Route::patch('/teachers/{teacher}',              [TeacherController::class, 'update'])->name('teachers.update');
            Route::put('/teachers/{teacher}/availability',   [TeacherAvailabilityController::class, 'update'])->name('teachers.availability.update');
            Route::post('/teachers/{teacher}/activate',      [TeacherController::class, 'activate'])->name('teachers.activate');
            Route::post('/teachers/{teacher}/deactivate',    [TeacherController::class, 'deactivate'])->name('teachers.deactivate');
        });
        Route::post('/teachers/{teacher}/notes',          [TeacherNoteController::class, 'store'])->name('teachers.notes.store');
        Route::patch('/teacher-notes/{note}',             [TeacherNoteController::class, 'update'])->name('teacher-notes.update');
        Route::delete('/teacher-notes/{note}',            [TeacherNoteController::class, 'destroy'])->name('teacher-notes.destroy');
        Route::get('/teachers/{teacher}/report-summary',  [TeacherReportController::class, 'summary'])->name('teachers.report-summary');

        // Teacher leaves
        Route::get('/teacher-leaves',                        [TeacherLeaveController::class, 'index'])->name('teacher-leaves.index');
        Route::post('/teacher-leaves',                       [TeacherLeaveController::class, 'store'])->name('teacher-leaves.store');
        Route::middleware('system.can:teachers.approve_leave')->group(function () {
            Route::post('/teacher-leaves/{leave}/approve',   [TeacherLeaveController::class, 'approve'])->name('teacher-leaves.approve');
            Route::post('/teacher-leaves/{leave}/reject',    [TeacherLeaveController::class, 'reject'])->name('teacher-leaves.reject');
        });

        // Guardians
        Route::middleware('system.can:students.view')->get('/guardians', [GuardianController::class, 'index'])->name('guardians.index');
        Route::middleware('system.can:students.create')->post('/guardians', [GuardianController::class, 'store'])->name('guardians.store');

        // Students
        Route::middleware('system.can:students.view')->group(function () {
            Route::get('/guardians',          [GuardianController::class, 'index'])->name('guardians.index');
            Route::get('/students',           [StudentController::class, 'index'])->name('students.index');
            Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
            Route::get('/students/{student}/notes', [StudentNoteController::class, 'index'])->name('students.notes.index');
        });
        Route::middleware('system.can:students.create')->group(function () {
            Route::post('/guardians', [GuardianController::class, 'store'])->name('guardians.store');
            Route::post('/students', [StudentController::class, 'store'])->name('students.store');
        });
        Route::middleware('system.can:students.edit')->group(function () {
            Route::patch('/students/{student}',                          [StudentController::class, 'update'])->name('students.update');
            Route::post('/students/{student}/siblings',                  [StudentFamilyController::class, 'store'])->name('students.siblings.store');
            Route::delete('/students/{student}/siblings/{sibling}',      [StudentFamilyController::class, 'destroy'])->name('students.siblings.destroy');
        });
        Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
        Route::middleware('system.can:students.change_status')->group(function () {
            Route::post('/students/{student}/transition', StudentTransitionController::class)->name('students.transition');
            Route::post('/students/{student}/activate',  ActivateStudentController::class)->name('students.activate');
        });

        Route::post('/students/{student}/notes',    [StudentNoteController::class, 'store'])->name('students.notes.store');
        Route::patch('/student-notes/{note}',       [StudentNoteController::class, 'update'])->name('student-notes.update');
        Route::delete('/student-notes/{note}',      [StudentNoteController::class, 'destroy'])->name('student-notes.destroy');

        // Saved views
        Route::get('/saved-views',         [SavedViewController::class, 'index'])->name('saved-views.index');
        Route::post('/saved-views',        [SavedViewController::class, 'store'])->name('saved-views.store');
        Route::delete('/saved-views/{id}', [SavedViewController::class, 'destroy'])->name('saved-views.destroy');

        // ── SYS-04 ──────────────────────────────────────────────────────────────

        // Sessions
        Route::middleware('system.can:schedule.view')->group(function () {
            Route::get('/sessions',            [SessionController::class, 'index'])->name('sessions.index');
            Route::get('/sessions/conflicts',  [SessionController::class, 'conflicts'])->name('sessions.conflicts');
            Route::get('/sessions/{session}',  [SessionController::class, 'show'])->name('sessions.show');
        });
        Route::middleware('system.can:schedule.edit')->post('/sessions', [SessionController::class, 'store'])->name('sessions.store');
        Route::middleware('system.can:schedule.reschedule')->group(function () {
            Route::patch('/sessions/{session}/reschedule', [SessionController::class, 'reschedule'])->name('sessions.reschedule');
            Route::post('/sessions/{session}/reschedule/preview', [SessionController::class, 'reschedulePreview'])->name('sessions.reschedule.preview');
        });
        Route::post('/sessions/{session}/cancel',     [SessionController::class, 'cancel'])->name('sessions.cancel');
        Route::post('/sessions/{session}/attendance', [SessionController::class, 'markAttendance'])->name('sessions.attendance');
        Route::post('/sessions/{session}/send-report-whatsapp', [SessionController::class, 'sendReportWhatsApp'])->name('sessions.send-report-whatsapp');
        Route::middleware('system.can:attendance.edit')->post('/sessions/bulk-attendance', [SessionController::class, 'bulkAttendance'])->name('sessions.bulk-attendance');

        // Schedule patterns (on students)
        Route::middleware('system.can:students.view')->group(function () {
            Route::get('/students/{student}/schedule-patterns',         [SchedulePatternController::class, 'index'])->name('schedule-patterns.index');
            Route::post('/students/{student}/schedule-patterns/preview',[SchedulePatternController::class, 'preview'])->name('schedule-patterns.preview');
            Route::get('/students/{student}/sessions',                  [SessionController::class, 'forStudent'])->name('students.sessions');
            Route::get('/students/{student}/reports',                   [SessionReportController::class, 'forStudent'])->name('students.reports');
        });
        Route::middleware('system.can:schedule.edit')->put('/students/{student}/schedule-patterns', [SchedulePatternController::class, 'replace'])->name('schedule-patterns.replace');

        // Teacher sessions + reports
        Route::get('/teachers/{teacher}/sessions',             [SessionController::class, 'forTeacher'])->name('teachers.sessions');
        Route::post('/teachers/{teacher}/check-availability',  [SessionController::class, 'checkAvailability'])->name('teachers.check-availability');
        Route::get('/teachers/{teacher}/reports',              [SessionReportController::class, 'forTeacher'])->name('teachers.reports');
        Route::get('/teachers/{teacher}/report-summary',       [TeacherReportController::class, 'summary'])->name('teachers.report-summary');

        // Session reports
        Route::middleware('system.can:reports.view_any')->get('/session-reports', [SessionReportController::class, 'index'])->name('session-reports.index');
        Route::get('/sessions/{session}/report',     [SessionReportController::class, 'showForSession'])->name('sessions.report.show');
        Route::post('/sessions/{session}/report',    [SessionReportController::class, 'store'])->name('sessions.report.store');
        Route::patch('/session-reports/{report}',    [SessionReportController::class, 'update'])->name('session-reports.update');

        // Makeup requests
        Route::get('/makeup-requests',                         [MakeupRequestController::class, 'index'])->name('makeup-requests.index');
        Route::post('/makeup-requests',                        [MakeupRequestController::class, 'store'])->name('makeup-requests.store');
        Route::post('/makeup-requests/{makeupRequest}/approve',[MakeupRequestController::class, 'approve'])->name('makeup-requests.approve');
        Route::post('/makeup-requests/{makeupRequest}/deny',   [MakeupRequestController::class, 'deny'])->name('makeup-requests.deny');

        // ── SYS-05: Billing & Invoicing ─────────────────────────────────────────

        // Invoices
        Route::middleware('system.can:invoices.view')->group(function () {
            Route::get('/invoices',                                  [InvoiceController::class, 'index'])->name('invoices.index');
            Route::get('/invoices/{invoice}',                        [InvoiceController::class, 'show'])->name('invoices.show');
            Route::get('/students/{student}/invoices',               [InvoiceController::class, 'studentInvoices'])->name('students.invoices');
            Route::get('/students/{student}/billing-state',          [InvoiceController::class, 'billingState'])->name('students.billing-state');
        });
        Route::middleware('system.can:invoices.create')->group(function () {
            Route::post('/invoices',                                          [InvoiceController::class, 'store'])->name('invoices.store');
            Route::post('/students/{student}/invoices/reactivation',          [InvoiceController::class, 'reactivationInvoice'])->name('students.invoices.reactivation');
        });
        Route::middleware('system.can:invoices.create_advance')
            ->post('/students/{student}/invoices/advance', [InvoiceController::class, 'advanceInvoice'])->name('students.invoices.advance');
        Route::middleware('system.can:invoices.edit')->group(function () {
            Route::patch('/invoices/{invoice}',       [InvoiceController::class, 'update'])->name('invoices.update');
            Route::post('/invoices/{invoice}/send',   [InvoiceController::class, 'send'])->name('invoices.send');
        });
        Route::middleware('system.can:invoices.void')
            ->post('/invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');
        Route::middleware('system.can:invoices.download_pdf')
            ->get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
        Route::middleware('system.can:invoices.resend_link')
            ->post('/invoices/{invoice}/resend-paymob-link', [InvoiceController::class, 'resendPaymobLink'])->name('invoices.resend-paymob-link');
        Route::middleware('system.can:invoices.export')
            ->post('/invoices/export', [BillingExportController::class, '__invoke'])->name('invoices.export');
        Route::middleware('system.can:invoices.record_payment')
            ->post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('invoices.payments.store');

        // Payments list
        Route::middleware('system.can:payments.view')
            ->get('/payments', [PaymentController::class, 'index'])->name('payments.index');

        // Wallet
        Route::middleware('system.can:wallet.view')->group(function () {
            Route::get('/students/{student}/wallet',              [WalletController::class, 'show'])->name('students.wallet');
            Route::get('/students/{student}/wallet/transactions', [WalletController::class, 'transactions'])->name('students.wallet.transactions');
        });
        Route::middleware('system.can:wallet.credit')
            ->post('/students/{student}/wallet/credit', [WalletController::class, 'credit'])->name('students.wallet.credit');
        Route::middleware('system.can:wallet.debit')
            ->post('/students/{student}/wallet/debit', [WalletController::class, 'debit'])->name('students.wallet.debit');
        Route::middleware('system.can:wallet.adjust')
            ->post('/students/{student}/wallet/adjust', [WalletController::class, 'adjust'])->name('students.wallet.adjust');

        // Transition prepare (billing-aware lifecycle)
        Route::post('/students/{student}/transition-prepare', [InvoiceController::class, 'transitionPrepare'])->name('students.transition-prepare');

        // Pricing + Billing settings
        Route::middleware('system.can:settings.view')->group(function () {
            Route::get('/settings/pricing',   [PricingSettingsController::class, 'show'])->name('settings.pricing');
        });
        Route::middleware('system.can:settings.edit')->group(function () {
            Route::put('/settings/pricing',              [PricingSettingsController::class, 'update'])->name('settings.pricing.update');
            Route::get('/integrations/paymob',           [PaymobIntegrationController::class, 'show'])->name('integrations.paymob');
            Route::put('/integrations/paymob',           [PaymobIntegrationController::class, 'update'])->name('integrations.paymob.update');
            Route::post('/integrations/paymob/test',     [PaymobIntegrationController::class, 'test'])->name('integrations.paymob.test');
        });

        // ── SYS-06: Payroll, Bonuses & Quality ──────────────────────────────────

        // Payrolls
        Route::middleware('system.can:payroll.view_any')->group(function () {
            Route::get('/payrolls',        [\App\Http\Controllers\System\PayrollController::class, 'index'])->name('payrolls.index');
            Route::post('/payrolls/preview',[\App\Http\Controllers\System\PayrollController::class, 'preview'])->name('payrolls.preview');
        });
        Route::get('/payrolls/{payroll}',          [\App\Http\Controllers\System\PayrollController::class, 'show'])->name('payrolls.show');
        Route::get('/payrolls/{payroll}/pdf',       [\App\Http\Controllers\System\PayrollController::class, 'pdf'])->name('payrolls.pdf');
        Route::middleware('system.can:payroll.approve')->group(function () {
            Route::post('/payrolls/{payroll}/approve', [\App\Http\Controllers\System\PayrollController::class, 'approve'])->name('payrolls.approve');
            Route::post('/payrolls/{payroll}/reject',  [\App\Http\Controllers\System\PayrollController::class, 'reject'])->name('payrolls.reject');
            Route::post('/payrolls/bulk-approve',      [\App\Http\Controllers\System\PayrollController::class, 'bulkApprove'])->name('payrolls.bulk-approve');
        });
        Route::middleware('system.can:payroll.mark_transferred')->group(function () {
            Route::post('/payrolls/{payroll}/mark-transferred', [\App\Http\Controllers\System\PayrollController::class, 'markTransferred'])->name('payrolls.mark-transferred');
            Route::post('/payrolls/bulk-transfer',              [\App\Http\Controllers\System\PayrollController::class, 'bulkTransfer'])->name('payrolls.bulk-transfer');
        });
        Route::middleware('system.can:payroll.adjust')->group(function () {
            Route::post('/payrolls/{payroll}/recalculate',            [\App\Http\Controllers\System\PayrollController::class, 'recalculate'])->name('payrolls.recalculate');
            Route::post('/payrolls/{payroll}/adjustments',            [\App\Http\Controllers\System\PayrollAdjustmentController::class, 'store'])->name('payrolls.adjustments.store');
            Route::patch('/payroll-adjustments/{payrollAdjustment}',  [\App\Http\Controllers\System\PayrollAdjustmentController::class, 'update'])->name('payroll-adjustments.update');
            Route::delete('/payroll-adjustments/{payrollAdjustment}', [\App\Http\Controllers\System\PayrollAdjustmentController::class, 'destroy'])->name('payroll-adjustments.destroy');
            Route::post('/quality/{teacher}/apply-bonus',             [\App\Http\Controllers\System\QualityController::class, 'applyBonus'])->name('quality.apply-bonus');
        });
        Route::middleware('system.can:payroll.export')
            ->post('/payrolls/export', [\App\Http\Controllers\System\PayrollExportController::class, '__invoke'])->name('payrolls.export');
        Route::get('/teachers/{teacher}/payrolls',          [\App\Http\Controllers\System\PayrollController::class, 'teacherPayrolls'])->name('teachers.payrolls');
        Route::get('/teachers/{teacher}/salary-statement',  [\App\Http\Controllers\System\PayrollController::class, 'salaryStatement'])->name('teachers.salary-statement');

        // Quality
        Route::middleware('system.can:quality.view_any')->group(function () {
            Route::get('/quality', [\App\Http\Controllers\System\QualityController::class, 'index'])->name('quality.index');
        });
        Route::get('/quality/{teacher}', [\App\Http\Controllers\System\QualityController::class, 'show'])->name('quality.show');
        Route::middleware('system.can:quality.review')
            ->post('/quality/{teacher}/reviews', [\App\Http\Controllers\System\QualityController::class, 'submitReview'])->name('quality.reviews.store');

        // ── SYS-07: Leads / CRM ──────────────────────────────────────────────────

        Route::middleware('system.can:leads.view_any')->group(function () {
            Route::get('/leads',                                     [LeadController::class, 'index'])->name('leads.index');
            Route::get('/leads/analytics',                           LeadAnalyticsController::class)->name('leads.analytics');
        });
        Route::get('/leads/{lead}',                                  [LeadController::class, 'show'])->name('leads.show');
        Route::middleware('system.can:leads.create')
            ->post('/leads',                                         [LeadController::class, 'store'])->name('leads.store');
        Route::middleware('system.can:leads.edit')
            ->patch('/leads/{lead}',                                 [LeadController::class, 'update'])->name('leads.update');
        Route::middleware('system.can:leads.assign')->group(function () {
            Route::post('/leads/{lead}/assign',                      [LeadController::class, 'assign'])->name('leads.assign');
            Route::post('/leads/bulk-assign',                        [LeadController::class, 'bulkAssign'])->name('leads.bulk-assign');
        });
        Route::middleware('system.can:leads.convert')
            ->post('/leads/{lead}/convert',                          [LeadController::class, 'convert'])->name('leads.convert');
        Route::middleware('system.can:leads.mark_lost')
            ->post('/leads/{lead}/mark-lost',                        [LeadController::class, 'markLost'])->name('leads.mark-lost');
        Route::middleware('system.can:leads.delete')
            ->delete('/leads/{lead}',                                [LeadController::class, 'destroy'])->name('leads.destroy');

        // Lead follow-ups
        Route::middleware('system.can:leads.view')->group(function () {
            Route::get('/leads/{lead}/follow-ups',                   [LeadFollowUpController::class, 'index'])->name('leads.follow-ups.index');
        });
        Route::middleware('system.can:lead_followups.create')
            ->post('/leads/{lead}/follow-ups',                       [LeadFollowUpController::class, 'store'])->name('leads.follow-ups.store');
        Route::middleware('system.can:lead_followups.edit')
            ->patch('/lead-follow-ups/{leadFollowUp}',               [LeadFollowUpController::class, 'update'])->name('lead-follow-ups.update');
        Route::middleware('system.can:lead_followups.complete')
            ->post('/lead-follow-ups/{leadFollowUp}/complete',       [LeadFollowUpController::class, 'complete'])->name('lead-follow-ups.complete');
        Route::middleware('system.can:lead_followups.delete')
            ->delete('/lead-follow-ups/{leadFollowUp}',              [LeadFollowUpController::class, 'destroy'])->name('lead-follow-ups.destroy');

        // WhatsApp groups
        Route::middleware('system.can:whatsapp.view')->group(function () {
            Route::get('/whatsapp-groups',                           [WhatsAppGroupController::class, 'index'])->name('whatsapp-groups.index');
            Route::get('/whatsapp-groups/{whatsappGroup}',           [WhatsAppGroupController::class, 'show'])->name('whatsapp-groups.show');
        });
        Route::middleware('system.can:whatsapp.register_group')
            ->post('/whatsapp-groups',                               [WhatsAppGroupController::class, 'store'])->name('whatsapp-groups.store');
        Route::middleware('system.can:whatsapp.edit_group')->group(function () {
            Route::patch('/whatsapp-groups/{whatsappGroup}',         [WhatsAppGroupController::class, 'update'])->name('whatsapp-groups.update');
            Route::post('/whatsapp-groups/{whatsappGroup}/reactivate',[WhatsAppGroupController::class, 'reactivate'])->name('whatsapp-groups.reactivate');
        });
        Route::middleware('system.can:whatsapp.stop_group')
            ->post('/whatsapp-groups/{whatsappGroup}/stop',          [WhatsAppGroupController::class, 'stop'])->name('whatsapp-groups.stop');

        // Message templates
        Route::middleware('system.can:notifications.view')->group(function () {
            Route::get('/message-templates',                         [MessageTemplateController::class, 'index'])->name('message-templates.index');
            Route::get('/message-templates/{messageTemplate}',       [MessageTemplateController::class, 'show'])->name('message-templates.show');
            Route::post('/message-templates/{messageTemplate}/preview',[MessageTemplateController::class, 'preview'])->name('message-templates.preview');
        });
        Route::middleware('system.can:notifications.edit_templates')
            ->patch('/message-templates/{messageTemplate}',          [MessageTemplateController::class, 'update'])->name('message-templates.update');

        // Wassender delivery logs
        Route::middleware('system.can:notifications.view_delivery_log')->group(function () {
            Route::get('/wassender-logs',                            [WassenderLogController::class, 'index'])->name('wassender-logs.index');
            Route::get('/wassender-logs/{wassenderLog}',             [WassenderLogController::class, 'show'])->name('wassender-logs.show');
            Route::post('/wassender-logs/{wassenderLog}/retry',      [WassenderLogController::class, 'retry'])->name('wassender-logs.retry');
        });

        // Notification preferences
        Route::middleware('system.can:notifications.edit_preferences')->group(function () {
            Route::get('/notifications/preferences',                 [NotificationPreferencesController::class, 'show'])->name('notifications.preferences.show');
            Route::put('/notifications/preferences',                 [NotificationPreferencesController::class, 'update'])->name('notifications.preferences.update');
        });

        // Wassender integration settings
        Route::middleware('system.can:settings.view')
            ->get('/integrations/wassender',                         [WassenderIntegrationController::class, 'show'])->name('integrations.wassender');
        Route::middleware('system.can:settings.edit')->group(function () {
            Route::put('/integrations/wassender',                    [WassenderIntegrationController::class, 'update'])->name('integrations.wassender.update');
            Route::post('/integrations/wassender/test',              [WassenderIntegrationController::class, 'test'])->name('integrations.wassender.test');
        });

        // ── SYS-08: Accounting, Certificates, Audit, Settings ───────────────────

        // Accounting — revenue + analytics
        Route::middleware('system.can:accounting.view')->group(function () {
            Route::get('/accounting/revenue',       [AccountingController::class, 'revenue'])->name('accounting.revenue');
            Route::get('/accounting/collection',    [AccountingController::class, 'collection'])->name('accounting.collection');
            Route::get('/accounting/cancellations', [AccountingController::class, 'cancellations'])->name('accounting.cancellations');
            Route::get('/accounting/trials',        [AccountingController::class, 'trials'])->name('accounting.trials');
        });
        Route::middleware('system.can:accounting.view_pnl')->group(function () {
            Route::get('/accounting/profit-loss',   [AccountingController::class, 'profitLoss'])->name('accounting.profit-loss');
            Route::get('/monthly-reports',          [MonthlyReportController::class, 'index'])->name('monthly-reports.index');
            Route::get('/monthly-reports/{id}/pdf', [MonthlyReportController::class, 'showPdf'])->name('monthly-reports.pdf');
            Route::get('/monthly-reports/{id}/xlsx',[MonthlyReportController::class, 'showXlsx'])->name('monthly-reports.xlsx');
        });
        Route::middleware('system.can:accounting.export')
            ->post('/monthly-reports/regenerate', [MonthlyReportController::class, 'regenerate'])->name('monthly-reports.regenerate');

        // Expenses
        Route::middleware('system.can:expenses.view')->group(function () {
            Route::get('/expenses',              [ExpenseController::class, 'index'])->name('expenses.index');
            Route::get('/expenses/{id}',         [ExpenseController::class, 'show'])->name('expenses.show');
            Route::get('/expense-categories',    [ExpenseCategoryController::class, 'index'])->name('expense-categories.index');
        });
        Route::middleware('system.can:expenses.create')
            ->post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
        Route::middleware('system.can:expenses.edit')
            ->patch('/expenses/{id}', [ExpenseController::class, 'update'])->name('expenses.update');
        Route::middleware('system.can:expenses.delete')
            ->delete('/expenses/{id}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
        Route::middleware('system.can:expenses.manage_categories')->group(function () {
            Route::post('/expense-categories',               [ExpenseCategoryController::class, 'store'])->name('expense-categories.store');
            Route::patch('/expense-categories/{id}',         [ExpenseCategoryController::class, 'update'])->name('expense-categories.update');
            Route::post('/expense-categories/{id}/deactivate',[ExpenseCategoryController::class, 'deactivate'])->name('expense-categories.deactivate');
        });

        // Certificates
        Route::middleware('system.can:certificates.view_any')->group(function () {
            Route::get('/certificates',              [CertificateController::class, 'index'])->name('certificates.index');
            Route::get('/certificates/{id}',         [CertificateController::class, 'show'])->name('certificates.show');
            Route::get('/certificates/{id}/pdf',     [CertificateController::class, 'pdf'])->name('certificates.pdf');
        });
        Route::middleware('system.can:certificates.issue')->group(function () {
            Route::post('/certificates',             [CertificateController::class, 'store'])->name('certificates.store');
            Route::post('/certificates/preview',     [CertificateController::class, 'preview'])->name('certificates.preview');
        });
        Route::middleware('system.can:certificates.edit')
            ->patch('/certificates/{id}', [CertificateController::class, 'update'])->name('certificates.update');
        Route::middleware('system.can:certificates.revoke')
            ->post('/certificates/{id}/revoke', [CertificateController::class, 'revoke'])->name('certificates.revoke');
        Route::middleware('system.can:students.view')
            ->get('/students/{id}/certificates', [CertificateController::class, 'forStudent'])->name('students.certificates');

        // Audit log
        Route::middleware('system.can:audit.view')->group(function () {
            Route::get('/audit-log',         [AuditLogController::class, 'index'])->name('audit-log.index');
            Route::get('/audit-log/{id}',    [AuditLogController::class, 'show'])->name('audit-log.show');
            Route::post('/audit-log/export', [AuditLogController::class, 'export'])->name('audit-log.export');
        });

        // Exports hub
        Route::middleware('system.can:accounting.export')->group(function () {
            Route::get('/exports',  [ExportController::class, 'index'])->name('exports.index');
            Route::post('/exports', [ExportController::class, 'store'])->name('exports.store');
        });

        // Settings — Academy info
        Route::middleware('system.can:settings.view')
            ->get('/settings/academy', [AcademyInfoController::class, 'show'])->name('settings.academy');
        Route::middleware('system.can:settings.edit_academy')->group(function () {
            Route::put('/settings/academy',          [AcademyInfoController::class, 'update'])->name('settings.academy.update');
            Route::post('/settings/academy/logo',    [AcademyInfoController::class, 'uploadLogo'])->name('settings.academy.logo');
        });

        // Settings — FX rates
        Route::middleware('system.can:settings.view')
            ->get('/settings/fx-rates', [FxRatesController::class, 'show'])->name('settings.fx-rates');
        Route::middleware('system.can:settings.edit_fx_rates')
            ->put('/settings/fx-rates', [FxRatesController::class, 'update'])->name('settings.fx-rates.update');

        // Settings — Backups
        Route::middleware('system.can:settings.view')
            ->get('/settings/backups', [BackupsController::class, 'show'])->name('settings.backups');
        Route::middleware('system.can:settings.manage_backups')
            ->post('/settings/backups/run-now', [BackupsController::class, 'runNow'])->name('settings.backups.run-now');

    }); // end auth:sanctum + system.active

    // Paymob webhook — no Sanctum, HMAC-verified
    Route::post('/system/webhooks/paymob', [PaymobWebhookController::class, 'handle'])->name('system.webhooks.paymob');

    // Public invoice payment page — no auth, token-gated
    Route::get('/pay/{token}',      [\App\Http\Controllers\System\PublicInvoiceController::class, 'show'])->name('pay.show');
    Route::get('/pay/{token}/pdf',  [\App\Http\Controllers\System\PublicInvoiceController::class, 'pdf'])->name('pay.pdf');
});
