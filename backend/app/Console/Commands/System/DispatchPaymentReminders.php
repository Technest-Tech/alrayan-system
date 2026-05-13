<?php

namespace App\Console\Commands\System;

use App\Models\System\Invoice;
use App\Models\System\WassenderLog;
use App\Services\System\WassenderDispatcher;
use App\Support\System\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class DispatchPaymentReminders extends Command
{
    protected $signature   = 'system:reminders:payments';
    protected $description = 'Send WhatsApp payment reminders for upcoming and overdue invoices';

    public function handle(WassenderDispatcher $wa): int
    {
        $beforeDays = json_decode(Setting::get('reminders.payment.before_due_days', '[3,1]'), true) ?: [3, 1];
        $afterDays  = json_decode(Setting::get('reminders.payment.after_due_days', '[1,3,7]'), true) ?: [1, 3, 7];
        $onDue      = (bool) Setting::get('reminders.payment.on_due', 1);

        foreach ($beforeDays as $d) {
            $this->fireFor(
                Invoice::open()->whereDate('due_at', now()->addDays($d)->toDateString())->with('student.whatsappGroup')->get(),
                'payment_due_soon',
                ['days_until_due' => (string) $d],
                $wa
            );
        }

        if ($onDue) {
            $this->fireFor(
                Invoice::open()->whereDate('due_at', now()->toDateString())->with('student.whatsappGroup')->get(),
                'payment_due_today',
                [],
                $wa
            );
        }

        foreach ($afterDays as $d) {
            $this->fireFor(
                Invoice::overdue()->whereDate('due_at', now()->subDays($d)->toDateString())->with('student.whatsappGroup')->get(),
                'payment_overdue',
                ['days_overdue' => (string) $d],
                $wa
            );
        }

        return self::SUCCESS;
    }

    private function fireFor(Collection $invoices, string $tplKey, array $extra, WassenderDispatcher $wa): void
    {
        foreach ($invoices as $inv) {
            if (!$inv->student?->whatsapp_group_id) continue;

            // One-per-day cap
            if (WassenderLog::where('template_key', $tplKey)
                ->whereJsonContains('payload->invoice_id', $inv->id)
                ->whereDate('created_at', today())
                ->exists()) {
                continue;
            }

            $log = $wa->sendTemplate($tplKey, $inv->student->whatsappGroup, array_merge([
                'student_name'         => $inv->student->name,
                'invoice_number'       => $inv->invoice_number,
                'amount_with_currency' => number_format($inv->total_minor / 100, 2) . ' ' . $inv->currency,
                'due_date'             => $inv->due_at?->toDateString() ?? '',
                'payment_link'         => optional($inv->paymobLink)->payment_url ?? '',
            ], $extra));

            $log->update(['payload' => array_merge($log->payload ?? [], ['invoice_id' => $inv->id])]);
        }
    }
}
