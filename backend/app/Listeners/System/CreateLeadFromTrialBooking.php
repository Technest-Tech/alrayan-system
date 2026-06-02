<?php

namespace App\Listeners\System;

use App\Events\TrialBookingCreated;
use App\Models\TrialBooking;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Services\System\LeadFromTrialBookingConverter;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Contracts\Queue\ShouldQueue;
use Throwable;

class CreateLeadFromTrialBooking implements ShouldQueue
{
    public string $queue = 'notifications';

    private const ADMIN_WHATSAPP = '+201207220414';

    public function __construct(
        private LeadFromTrialBookingConverter $converter,
        private WassenderClient $wassender,
    ) {}

    public function handle(TrialBookingCreated $event): void
    {
        $booking = $event->trialBooking;
        $lead = $this->converter->convert($booking);

        NotificationService::pushToAdminsAndSupervisors(
            NotificationTypes::LEAD_CREATED,
            "New lead: {$lead->name} from {$lead->source}",
            null,
            "/leads/{$lead->id}"
        );

        $this->sendParentWelcome($booking);
        $this->sendAdminAlert($booking, $lead->id);
    }

    private function sendParentWelcome(TrialBooking $booking): void
    {
        $phone = $booking->phone;
        if (!$phone) return;

        $name = trim((string) $booking->name);
        $firstName = $name === '' ? '' : explode(' ', $name)[0];
        $course = $booking->course_interest;

        $lines = [
            "🌟 *Welcome to Alrayan Academy* 🌟",
            "",
            "Dear *{$firstName}*,",
            "",
            "Jazakum Allah khayran for reaching out! 🤲",
            "We've received your request and our team will contact you very soon to schedule your *free trial class*.",
        ];

        if ($course) {
            $lines[] = "";
            $lines[] = "📚 Course of interest: *{$course}*";
        }

        $lines[] = "";
        $lines[] = "━━━━━━━━━━━━━━━━━━";
        $lines[] = "🕌 *أهلاً بك في أكاديمية الريان*";
        $lines[] = "";
        $lines[] = "شكراً جزيلاً لتواصلك معنا 🌷";
        $lines[] = "تم استلام طلبك بنجاح وسيقوم فريقنا بالتواصل معك قريباً جداً لترتيب *حصتك التجريبية المجانية*.";
        $lines[] = "━━━━━━━━━━━━━━━━━━";
        $lines[] = "";
        $lines[] = "📞 Need us sooner? Reply to this message anytime.";
        $lines[] = "🌐 alrayanquran.com";

        try {
            $this->wassender->sendToPhone($phone, implode("\n", $lines));
        } catch (Throwable $e) {
            report($e);
        }
    }

    private function sendAdminAlert(TrialBooking $booking, int $leadId): void
    {
        $url = 'https://system.alrayanquran.com' . "/leads/{$leadId}";

        $lines = [
            "🚨 *New Lead — Alrayan Academy* 🚨",
            "",
            "👤 *Name:* {$booking->name}",
            "📱 *Phone:* {$booking->phone}",
        ];

        if ($booking->email)            $lines[] = "📧 *Email:* {$booking->email}";
        if ($booking->country)          $lines[] = "🌍 *Country:* {$booking->country}";
        if ($booking->age_group)        $lines[] = "👶 *Age group:* {$booking->age_group}";
        if ($booking->course_interest)  $lines[] = "📚 *Course:* {$booking->course_interest}";
        if ($booking->preferred_time)   $lines[] = "⏰ *Preferred time:* {$booking->preferred_time}";
        if ($booking->timezone)         $lines[] = "🕐 *Timezone:* {$booking->timezone}";

        if ($booking->message) {
            $lines[] = "";
            $lines[] = "💬 *Message:*";
            $lines[] = $booking->message;
        }

        $lines[] = "";
        $lines[] = "🔗 {$url}";

        try {
            $this->wassender->sendToPhone(self::ADMIN_WHATSAPP, implode("\n", $lines));
        } catch (Throwable $e) {
            report($e);
        }
    }
}
