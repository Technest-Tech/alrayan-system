<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\NotificationPreferences\UpdatePreferencesRequest;
use App\Support\System\NotificationTypes;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;

class NotificationPreferencesController extends Controller
{
    private array $allTypes = [
        'operations' => [
            NotificationTypes::LEAD_CREATED,
            NotificationTypes::LEAD_FOLLOWUP_DUE,
            NotificationTypes::LEAD_TRIAL_PENDING,
            NotificationTypes::STUDENT_ABSENCE_STREAK,
            NotificationTypes::STUDENT_AUTO_SUSPENDED,
            NotificationTypes::STUDENT_NO_WHATSAPP_GROUP,
        ],
        'finance' => [
            NotificationTypes::INVOICE_OVERDUE,
            NotificationTypes::PAYMENT_RECEIVED,
            NotificationTypes::PAYROLL_UPCOMING_DUE,
        ],
        'operations_support' => [
            NotificationTypes::REPORT_OVERDUE,
            NotificationTypes::TEACHER_LEAVE_PENDING,
            NotificationTypes::TEACHER_LEAVE_NEEDS_RESCHEDULE,
        ],
    ];

    public function show(): JsonResponse
    {
        $user    = auth()->user();
        $key     = "notifications.prefs.{$user->id}";
        $muted   = json_decode(Setting::get($key, '[]'), true) ?: [];

        return response()->json([
            'muted_types' => $muted,
            'all_types'   => $this->allTypes,
        ]);
    }

    public function update(UpdatePreferencesRequest $request): JsonResponse
    {
        $user = auth()->user();
        Setting::set("notifications.prefs.{$user->id}", json_encode($request->muted_types));
        return response()->json(['message' => 'Preferences saved.']);
    }
}
