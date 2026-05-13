<?php

namespace App\Listeners\System;

use App\Events\System\StudentStatusChanged;
use App\Models\System\Invoice;

class VoidDraftsOnStudentPause
{
    public function handle(StudentStatusChanged $event): void
    {
        if (!in_array($event->newStatus, ['paused', 'cancelled'])) return;
        Invoice::where('student_id', $event->student->id)
            ->where('status', 'draft')
            ->get()
            ->each(function (Invoice $inv) use ($event) {
                $inv->update([
                    'status'        => 'void',
                    'voided_at'     => now(),
                    'voided_reason' => "Student {$event->newStatus}",
                ]);
            });
    }
}
