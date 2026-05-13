<?php

namespace App\Console\Commands\System;

use App\Models\System\SysNotification;
use App\Models\System\Student;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Console\Command;

class CheckMissingWhatsAppGroups extends Command
{
    protected $signature   = 'system:sweep:missing-whatsapp-groups';
    protected $description = 'Notify admins about active students missing a WhatsApp group';

    public function handle(): int
    {
        $count = Student::where('status', 'active')
            ->whereNull('whatsapp_group_id')
            ->count();

        if ($count === 0) return self::SUCCESS;

        // Dedupe 24h
        $exists = SysNotification::where('type', NotificationTypes::STUDENT_NO_WHATSAPP_GROUP)
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($exists) return self::SUCCESS;

        NotificationService::pushToAdmins(
            NotificationTypes::STUDENT_NO_WHATSAPP_GROUP,
            "{$count} active " . str('student')->plural($count) . " without a WhatsApp group",
            null,
            '/students?no_whatsapp=1'
        );

        return self::SUCCESS;
    }
}
