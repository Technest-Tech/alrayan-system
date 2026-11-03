<?php

namespace App\Services\System;

use App\Models\System\Payroll;
use App\Models\System\StudentPackage;
use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Support\System\TreasuryRouting;
use Carbon\Carbon;

/**
 * Keeps account movements in step with paid packages and transferred payrolls.
 *
 * A new movement is only created at the moment money actually moves. Later edits adjust or
 * remove it, but never create one: an old package paid before accounts existed is already
 * inside some opening balance, and correcting its price mustn't deposit it a second time.
 */
class TreasuryAutoPoster
{
    public const SOURCE_PACKAGE = 'package';
    public const SOURCE_PAYROLL = 'payroll';

    public function syncPackage(StudentPackage $package, bool $moneyJustMoved = false): void
    {
        $this->sync(self::SOURCE_PACKAGE, $package->id, $this->packageEntry($package), $moneyJustMoved);
    }

    public function syncPayroll(Payroll $payroll, bool $moneyJustMoved = false): void
    {
        $this->sync(self::SOURCE_PAYROLL, $payroll->id, $this->payrollEntry($payroll), $moneyJustMoved);
    }

    public function removeFor(string $sourceType, int $sourceId): void
    {
        $this->movement($sourceType, $sourceId)?->delete();
    }

    /** The source came back from the bin, so the movement it took with it comes back too. */
    public function restoreFor(string $sourceType, int $sourceId): void
    {
        TreasuryTransaction::onlyTrashed()
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->latest('id')
            ->first()
            ?->restore();
    }

    /** @return array<string,mixed>|null null when the package holds no received money */
    private function packageEntry(StudentPackage $package): ?array
    {
        if ($package->trashed() || $package->status !== 'paid' || (int) $package->tariff_at_time <= 0) {
            return null;
        }

        $student = $package->student?->name;

        return [
            'audience'     => TreasuryRouting::STUDENTS,
            'currency'     => $package->currency,
            'direction'    => TreasuryTransaction::IN,
            'kind'         => TreasuryTransaction::KIND_STUDENT_PAYMENT,
            'amount_minor' => (int) $package->tariff_at_time,
            'date'         => $package->paid_at ?? now(),
            'description'  => trim("Package #{$package->package_number} · {$student}", ' ·'),
            'counterparty' => $student,
            'reference'    => null,
        ];
    }

    /** @return array<string,mixed>|null null unless the salary has actually been sent */
    private function payrollEntry(Payroll $payroll): ?array
    {
        if ($payroll->trashed() || $payroll->status !== 'transferred' || (int) $payroll->net_salary_minor <= 0) {
            return null;
        }

        $teacher = $payroll->teacher?->user?->name;
        $period  = sprintf('%04d-%02d', $payroll->period_year, $payroll->period_month);

        return [
            'audience'     => TreasuryRouting::TEACHERS,
            'currency'     => $payroll->currency ?: 'EGP',
            'direction'    => TreasuryTransaction::OUT,
            'kind'         => TreasuryTransaction::KIND_TEACHER_SALARY,
            'amount_minor' => (int) $payroll->net_salary_minor,
            'date'         => $payroll->transferred_at ?? now(),
            'description'  => trim("Salary {$period} · {$teacher}", ' ·'),
            'counterparty' => $teacher,
            'reference'    => $payroll->transfer_reference,
        ];
    }

    /** @param array<string,mixed>|null $entry */
    private function sync(string $sourceType, int $sourceId, ?array $entry, bool $moneyJustMoved): void
    {
        $movement = $this->movement($sourceType, $sourceId);

        if ($entry === null) {
            $movement?->delete();
            return;
        }

        if ($movement && $movement->account->currency !== $entry['currency']) {
            $movement->delete();
            $movement = null;
            $moneyJustMoved = true;
        }

        if ($movement) {
            $movement->update($this->fields($entry, $movement->account));
            return;
        }

        if (! $moneyJustMoved) {
            return;
        }

        $account = TreasuryRouting::accountFor($entry['audience'], $entry['currency']);

        // Money received before the account's opening date is already in its opening balance.
        if (! $account || $this->date($entry)->lt($account->opening_date->copy()->startOfDay())) {
            return;
        }

        $account->transactions()->create($this->fields($entry, $account) + [
            'source_type' => $sourceType,
            'source_id'   => $sourceId,
        ]);
    }

    /**
     * @param  array<string,mixed> $entry
     * @return array<string,mixed>
     */
    private function fields(array $entry, TreasuryAccount $account): array
    {
        $date = $this->date($entry);

        // The ledger allows neither end of this: keep the row inside the account's life.
        if ($date->lt($account->opening_date->copy()->startOfDay())) {
            $date = $account->opening_date->copy();
        } elseif ($date->isFuture()) {
            $date = Carbon::today();
        }

        return [
            'direction'    => $entry['direction'],
            'kind'         => $entry['kind'],
            'amount_minor' => $entry['amount_minor'],
            'occurred_on'  => $date->toDateString(),
            'description'  => $entry['description'],
            'counterparty' => $entry['counterparty'],
            'reference'    => $entry['reference'],
        ];
    }

    /** @param array<string,mixed> $entry */
    private function date(array $entry): Carbon
    {
        return Carbon::parse($entry['date'])->startOfDay();
    }

    private function movement(string $sourceType, int $sourceId): ?TreasuryTransaction
    {
        return TreasuryTransaction::with('account')
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->first();
    }
}
