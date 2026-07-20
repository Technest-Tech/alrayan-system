<?php

namespace App\Providers;

use App\Events\System\InvoiceCreated;
use App\Events\System\InvoiceOverdue;
use App\Events\System\InvoicePaid;
use App\Events\System\PackageCompleted;
use App\Events\System\PayrollApproved;
use App\Events\System\PayrollTransferred;
use App\Events\System\SessionAbsent;
use App\Events\System\SessionCancelled;
use App\Events\System\StudentStatusChanged;
use App\Events\System\TeacherLeaveApproved;
use App\Events\System\TeacherUnderperforming;
use App\Events\TrialBookingCreated;
use App\Listeners\System\ApplyWalletCreditOnInvoiceCreated;
use App\Listeners\System\CreateLeadFromTrialBooking;
use App\Listeners\System\FlagSessionsOnTeacherLeaveApproved;
use App\Listeners\System\GenerateTaskOnPackageCompleted;
use App\Listeners\System\GenerateTaskOnSessionCancelled;
use App\Listeners\System\NotifyAdminOnAbsenceStreak;
use App\Listeners\System\NotifyAdminsOnInvoiceOverdue;
use App\Listeners\System\NotifyAdminsOnTeacherUnderperforming;
use App\Listeners\System\NotifyTeacherOnLeaveApproved;
use App\Listeners\System\NotifyTeacherOnStudentPaused;
use App\Listeners\System\NotifyTeacherOnStudentSuspended;
use App\Listeners\System\OnInvoiceOverdue;
use App\Listeners\System\OnInvoicePaid;
use App\Listeners\System\SendInvoiceLinkOnInvoiceCreated;
use App\Listeners\System\SendWelcomeOnStudentEnrolled;
use App\Listeners\System\VoidDraftsOnStudentPause;
use App\Models\System\Invoice;
use App\Models\System\Lead;
use App\Models\System\Lesson;
use App\Models\System\LessonEvaluation;
use App\Models\System\LessonSchedule;
use App\Models\System\LessonSubject;
use App\Models\System\MakeupRequest;
use App\Models\System\MessageTemplate;
use App\Models\System\Payroll;
use App\Models\System\Payment;
use App\Models\System\QcEvaluation;
use App\Models\System\QualityReview;
use App\Models\System\SchedulePattern;
use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Student;
use App\Models\System\StudentNote;
use App\Models\System\StudentPackage;
use App\Models\System\Task;
use App\Models\System\Teacher;
use App\Models\System\TeacherLeave;
use App\Models\System\TeacherNote;
use App\Models\System\WhatsAppGroup;
use App\Observers\System\SessionObserver;
use App\Policies\System\InvoicePolicy;
use App\Policies\System\LeadPolicy;
use App\Policies\System\LessonEvaluationPolicy;
use App\Policies\System\LessonPolicy;
use App\Policies\System\LessonSchedulePolicy;
use App\Policies\System\LessonSubjectPolicy;
use App\Policies\System\StudentPackagePolicy;
use App\Policies\System\MakeupRequestPolicy;
use App\Policies\System\MessageTemplatePolicy;
use App\Policies\System\PaymentPolicy;
use App\Policies\System\PayrollPolicy;
use App\Policies\System\QcEvaluationPolicy;
use App\Policies\System\QualityReviewPolicy;
use App\Policies\System\SchedulePatternPolicy;
use App\Policies\System\SessionPolicy;
use App\Policies\System\SessionReportPolicy;
use App\Policies\System\StudentNotePolicy;
use App\Policies\System\StudentPolicy;
use App\Policies\System\TaskPolicy;
use App\Policies\System\TeacherLeavePolicy;
use App\Policies\System\TeacherNotePolicy;
use App\Policies\System\TeacherPolicy;
use App\Policies\System\WhatsAppGroupPolicy;
use App\Services\BookingReferenceGenerator;
use App\Services\Integrations\Acadmyq\AcadmyqClient;
use App\Services\Integrations\Acadmyq\FakeAcadmyqClient;
use App\Services\Integrations\Paymob\FakePaymobClient;
use App\Services\Integrations\Paymob\PaymobClient;
use App\Services\Integrations\Wassender\FakeWassenderClient;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Services\Integrations\Zoom\FakeZoomClient;
use App\Services\Integrations\Zoom\ZoomClient;
use App\Services\System\Reports\FakeLessonReportRenderer;
use App\Services\System\Reports\LessonReportData;
use App\Services\System\Reports\LessonReportRenderer;
use App\Support\System\Setting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(BookingReferenceGenerator::class);

        // Zoom: real client in production, fake otherwise
        $this->app->bind(ZoomClient::class, function ($app) {
            if (config('system.features.zoom')) {
                return new ZoomClient(
                    accountId:    env('ZOOM_ACCOUNT_ID', ''),
                    clientId:     env('ZOOM_CLIENT_ID', ''),
                    clientSecret: env('ZOOM_CLIENT_SECRET', ''),
                    http:         $app->make(HttpClient::class),
                    cache:        $app->make(CacheRepository::class),
                );
            }
            return new FakeZoomClient();
        });

        // Paymob: real client in production, fake otherwise
        $this->app->bind(PaymobClient::class, function ($app) {
            if (config('system.features.paymob', false)) {
                return new PaymobClient();
            }
            return new FakePaymobClient();
        });

        // Wassender: real client when configured, fake otherwise
        $this->app->bind(WassenderClient::class, function ($app) {
            $apiKey     = Setting::get('wassender.api_key', '');
            $instanceId = Setting::get('wassender.instance_id', '');
            if ($apiKey && $instanceId && config('system.features.wassender', false)) {
                return new WassenderClient($apiKey, $instanceId, $app->make(HttpClient::class));
            }
            return new FakeWassenderClient();
        });

        // Acadmyq WhatsApp: real client when configured, fake otherwise
        $this->app->bind(AcadmyqClient::class, function ($app) {
            $apiKey = config('whatsapp.api_key', '');
            if ($apiKey && config('whatsapp.enabled', false)) {
                return new AcadmyqClient(
                    baseUrl: config('whatsapp.base_url'),
                    apiKey:  $apiKey,
                    http:    $app->make(HttpClient::class),
                    timeout: config('whatsapp.timeout'),
                );
            }
            return new FakeAcadmyqClient();
        });

        // Lesson report images: Chromium when available, fake otherwise
        $this->app->bind(LessonReportRenderer::class, fn ($app) => config('reports.renderer') === 'browsershot'
            ? new LessonReportRenderer($app->make(LessonReportData::class))
            : new FakeLessonReportRenderer($app->make(LessonReportData::class)));
    }

    public function boot(): void
    {
        // Policies — SYS-02/03
        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(StudentNote::class, StudentNotePolicy::class);
        Gate::policy(TeacherNote::class, TeacherNotePolicy::class);
        Gate::policy(TeacherLeave::class, TeacherLeavePolicy::class);

        // Policies — SYS-04
        Gate::policy(Session::class, SessionPolicy::class);
        Gate::policy(SessionReport::class, SessionReportPolicy::class);
        Gate::policy(SchedulePattern::class, SchedulePatternPolicy::class);
        Gate::policy(MakeupRequest::class, MakeupRequestPolicy::class);

        // Policies — SYS-05
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);

        // Policies — SYS-06
        Gate::policy(Payroll::class, PayrollPolicy::class);
        Gate::policy(QualityReview::class, QualityReviewPolicy::class);

        // Policies — SYS-07
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(WhatsAppGroup::class, WhatsAppGroupPolicy::class);
        Gate::policy(MessageTemplate::class, MessageTemplatePolicy::class);

        // Policies — SYS-09 (Lessons & Calendar)
        Gate::policy(Lesson::class, LessonPolicy::class);
        Gate::policy(LessonSchedule::class, LessonSchedulePolicy::class);
        Gate::policy(StudentPackage::class, StudentPackagePolicy::class);
        Gate::policy(LessonSubject::class, LessonSubjectPolicy::class);
        Gate::policy(LessonEvaluation::class, LessonEvaluationPolicy::class);

        // Policies — SYS-10 (Tasks)
        Gate::policy(Task::class, TaskPolicy::class);

        // Policies — QC (Quality Control / lesson evaluations)
        Gate::policy(QcEvaluation::class, QcEvaluationPolicy::class);

        // Observers — SYS-04
        Session::observe(SessionObserver::class);

        // Events — SYS-02/03
        Event::listen(TeacherLeaveApproved::class, NotifyTeacherOnLeaveApproved::class);

        // Events — SYS-04
        Event::listen(TeacherLeaveApproved::class, FlagSessionsOnTeacherLeaveApproved::class);
        Event::listen(SessionAbsent::class, NotifyAdminOnAbsenceStreak::class);

        // Events — SYS-05
        Event::listen(InvoicePaid::class, OnInvoicePaid::class);
        Event::listen(InvoiceOverdue::class, OnInvoiceOverdue::class);
        Event::listen(StudentStatusChanged::class, VoidDraftsOnStudentPause::class);
        Event::listen(InvoiceCreated::class, ApplyWalletCreditOnInvoiceCreated::class);

        // Events — SYS-06
        Event::listen(TeacherUnderperforming::class, NotifyAdminsOnTeacherUnderperforming::class);

        // Events — SYS-07
        Event::listen(TrialBookingCreated::class, CreateLeadFromTrialBooking::class);
        Event::listen(InvoiceCreated::class, SendInvoiceLinkOnInvoiceCreated::class);
        Event::listen(InvoiceOverdue::class, NotifyAdminsOnInvoiceOverdue::class);
        Event::listen(StudentStatusChanged::class, SendWelcomeOnStudentEnrolled::class);
        Event::listen(StudentStatusChanged::class, NotifyTeacherOnStudentPaused::class);
        Event::listen(StudentStatusChanged::class, NotifyTeacherOnStudentSuspended::class);

        // Events — SYS-10 (Tasks auto-generation)
        Event::listen(PackageCompleted::class, GenerateTaskOnPackageCompleted::class);
        Event::listen(SessionCancelled::class, GenerateTaskOnSessionCancelled::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('form', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return response()->json([
                    'message' => 'Too many submissions. Please wait a minute and try again.',
                ], 429);
            });
        });
    }
}
