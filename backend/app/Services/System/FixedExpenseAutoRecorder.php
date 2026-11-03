<?php

namespace App\Services\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Records fixed items switched to automatic once their due date arrives, from their default
 * account. Safe to run any number of times: an occurrence is only ever recorded once.
 */
class FixedExpenseAutoRecorder
{
    public function __construct(private readonly ExpenseLedger $ledger) {}

    /** @return int how many expenses were recorded */
    public function run(?Carbon $today = null): int
    {
        $today ??= Carbon::today();
        $recorded = 0;

        $items = ExpenseItem::with('defaultAccount')
            ->where('auto_record', true)
            ->where('is_active', true)
            ->where('type', ExpenseItem::FIXED)
            ->get();

        foreach ($items as $item) {
            // Last month too, so a day or two of scheduler downtime across the 1st loses nothing.
            foreach ([$today->copy()->startOfMonth()->subMonth(), $today->copy()->startOfMonth()] as $month) {
                if ($this->recordIfDue($item, $month, $today)) {
                    $recorded++;
                }
            }
        }

        return $recorded;
    }

    private function recordIfDue(ExpenseItem $item, Carbon $month, Carbon $today): bool
    {
        $dueOn  = $month->copy()->day(min($item->due_day ?: 1, $month->daysInMonth));
        $period = $month->format('Y-m');

        if ($dueOn->gt($today) || $dueOn->lt(Carbon::parse($item->auto_record_since)->startOfDay())) {
            return false;
        }

        // Trashed rows count: someone deleted that month's expense on purpose, and tomorrow's
        // run must not quietly put it back.
        $alreadyHandled = Expense::withTrashed()
            ->where('item_id', $item->id)
            ->where('period', $period)
            ->exists();

        if ($alreadyHandled) {
            return false;
        }

        $account = $item->defaultAccount;

        if (! $account || ! $item->default_amount_minor) {
            Log::warning('Automatic expense skipped: no account or amount', ['item_id' => $item->id]);
            return false;
        }

        try {
            $expense = $this->ledger->create([
                'category_id'  => $item->category_id,
                'account_id'   => $account->id,
                'item_id'      => $item->id,
                'period'       => $period,
                'amount_minor' => $item->default_amount_minor,
                'currency'     => $account->currency,
                'description'  => $item->name,
                'occurred_on'  => $dueOn->toDateString(),
            ], null);
        } catch (ValidationException $e) {
            // An archived account, or a due date before it opened. The item stays visibly
            // due on the monthly page, so a person can deal with it.
            Log::warning('Automatic expense skipped', ['item_id' => $item->id, 'errors' => $e->errors()]);
            return false;
        }

        AuditLog::record('expenses.auto_recorded', $expense, [
            'item_id'    => $item->id,
            'period'     => $period,
            'account_id' => $account->id,
            'amount'     => $expense->amount_minor,
        ]);

        return true;
    }
}
