<?php

namespace App\Services\System;

use App\Events\System\PayrollApproved;
use App\Events\System\PayrollTransferred;
use App\Models\System\Payroll;
use App\Models\User;
use App\Services\System\NotificationService;
use Carbon\Carbon;

class PayrollApprover
{
    public function approve(Payroll $p, User $by): Payroll
    {
        abort_unless($p->status === 'pending', 422, 'Only pending payrolls can be approved.');
        $p->update([
            'status'              => 'approved',
            'approved_at'         => now(),
            'approved_by_user_id' => $by->id,
        ]);
        // teacher_id is nullOnDelete — a deleted teacher has nobody left to notify.
        if ($p->teacher?->user) {
            NotificationService::push(
                $p->teacher->user,
                'payroll.approved',
                'Payroll approved: ' . Carbon::create($p->period_year, $p->period_month, 1)->format('F Y'),
                'EGP ' . number_format($p->net_salary_minor / 100, 2),
                '/teacher/salary'
            );
        }
        event(new PayrollApproved($p));
        return $p;
    }

    public function reject(Payroll $p, User $by, string $reason): Payroll
    {
        abort_unless($p->status === 'pending', 422, 'Only pending payrolls can be rejected.');
        $p->update(['status' => 'rejected', 'rejected_at' => now(), 'rejection_reason' => $reason]);
        return $p;
    }

    public function markTransferred(Payroll $p, User $by, string $reference): Payroll
    {
        abort_unless($p->status === 'approved', 422, 'Only approved payrolls can be marked transferred.');
        $p->update([
            'status'                 => 'transferred',
            'transferred_at'         => now(),
            'transferred_by_user_id' => $by->id,
            'transfer_reference'     => $reference,
        ]);
        if ($p->teacher?->user) {
            NotificationService::push(
                $p->teacher->user,
                'payroll.transferred',
                'Your salary has been transferred.',
                'Reference: ' . $reference,
                '/teacher/salary'
            );
        }
        event(new PayrollTransferred($p));
        return $p;
    }
}
