<?php

namespace App\Services\System;

use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The ledger behind the Treasury module.
 *
 * Balances are always derived (opening balance + signed sum of the account's rows) and
 * never stored, so a back-dated entry, an edit or a delete can't leave a balance stale.
 */
class TreasuryService
{
    /**
     * Current balance for each account.
     *
     * @param  iterable<TreasuryAccount> $accounts
     * @return array<int,int> account id => balance in minor units
     */
    public function balances(iterable $accounts): array
    {
        $accounts = collect($accounts);

        $movements = TreasuryTransaction::query()
            ->whereIn('account_id', $accounts->pluck('id'))
            ->selectRaw('account_id, SUM(' . TreasuryTransaction::SIGNED_SQL . ') as total')
            ->groupBy('account_id')
            ->pluck('total', 'account_id');

        return $accounts
            ->mapWithKeys(fn (TreasuryAccount $a) => [
                $a->id => $a->opening_balance_minor + (int) ($movements[$a->id] ?? 0),
            ])
            ->all();
    }

    public function balance(TreasuryAccount $account): int
    {
        return $this->balances([$account])[$account->id];
    }

    /**
     * What moved through an account over a period. Transfers count here: on a single
     * account they are real money in or out, and start + in - out must equal the end.
     *
     * @return array{balance_at_start:int,total_in:int,total_out:int,balance_at_end:int}
     */
    public function statementSummary(TreasuryAccount $account, ?string $from, ?string $to): array
    {
        $before = 0;
        if ($from !== null) {
            $before = (int) $account->transactions()
                ->whereDate('occurred_on', '<', $from)
                ->selectRaw('COALESCE(SUM(' . TreasuryTransaction::SIGNED_SQL . '), 0) as total')
                ->value('total');
        }

        $totals = $account->transactions()
            ->when($from, fn ($q) => $q->whereDate('occurred_on', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('occurred_on', '<=', $to))
            ->selectRaw('direction, SUM(amount_minor) as total')
            ->groupBy('direction')
            ->pluck('total', 'direction');

        $start = $account->opening_balance_minor + $before;
        $in    = (int) ($totals[TreasuryTransaction::IN] ?? 0);
        $out   = (int) ($totals[TreasuryTransaction::OUT] ?? 0);

        return [
            'balance_at_start' => $start,
            'total_in'         => $in,
            'total_out'        => $out,
            'balance_at_end'   => $start + $in - $out,
        ];
    }

    /**
     * Money in and out of each account during a month, keyed by account id. `in`/`out` are
     * everything that moved; the `external_` pair leaves out transfers between own accounts.
     *
     * @param  iterable<TreasuryAccount> $accounts
     * @return array<int,array{in:int,out:int,external_in:int,external_out:int}>
     */
    public function monthlyMovement(iterable $accounts, Carbon $month): array
    {
        $rows = TreasuryTransaction::query()
            ->whereIn('account_id', collect($accounts)->pluck('id'))
            ->whereDate('occurred_on', '>=', $month->copy()->startOfMonth()->toDateString())
            ->whereDate('occurred_on', '<=', $month->copy()->endOfMonth()->toDateString())
            ->selectRaw('account_id, direction, kind, SUM(amount_minor) as total')
            ->groupBy('account_id', 'direction', 'kind')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[$row->account_id] ??= ['in' => 0, 'out' => 0, 'external_in' => 0, 'external_out' => 0];
            $out[$row->account_id][$row->direction] += (int) $row->total;
            // Moving money between our own accounts is neither earning nor spending.
            if ($row->kind !== TreasuryTransaction::KIND_TRANSFER) {
                $out[$row->account_id]['external_' . $row->direction] += (int) $row->total;
            }
        }

        return $out;
    }

    /**
     * A movement must fall inside the account's life: never before the date its opening
     * balance is true for (the balance would be meaningless) and never in the future.
     * Tomorrow is tolerated because the server runs on UTC, ahead of which the academy's
     * local date can already have rolled over.
     */
    public function assertPostable(TreasuryAccount $account, string $date): void
    {
        $this->assertOpen($account);

        $day = Carbon::parse($date)->startOfDay();

        if ($day->lt($account->opening_date->copy()->startOfDay())) {
            throw ValidationException::withMessages([
                'occurred_on' => "The date is before this account's opening date ({$account->opening_date->toDateString()}).",
            ]);
        }

        if ($day->gt(Carbon::tomorrow())) {
            throw ValidationException::withMessages([
                'occurred_on' => 'The date cannot be in the future.',
            ]);
        }
    }

    /** An archived account was closed at zero; touching its rows would break that. */
    public function assertOpen(TreasuryAccount $account): void
    {
        if (! $account->is_active) {
            throw ValidationException::withMessages([
                'account_id' => "The account \"{$account->name}\" is archived. Reactivate it first.",
            ]);
        }
    }

    /** @param array<string,mixed> $data */
    public function recordManual(TreasuryAccount $account, array $data, ?User $by): TreasuryTransaction
    {
        $this->assertPostable($account, $data['occurred_on']);
        $this->assertDirectionFits($data['kind'], $data['direction']);

        return $account->transactions()->create([
            'direction'          => $data['direction'],
            'kind'               => $data['kind'],
            'amount_minor'       => $data['amount_minor'],
            'occurred_on'        => $data['occurred_on'],
            'description'        => $data['description'],
            'counterparty'       => $data['counterparty'] ?? null,
            'reference'          => $data['reference'] ?? null,
            'created_by_user_id' => $by?->id,
        ]);
    }

    /** @param array<string,mixed> $data */
    public function updateManual(TreasuryTransaction $tx, array $data): TreasuryTransaction
    {
        $this->assertManual($tx);
        $this->assertOpen($tx->account);

        if (isset($data['occurred_on'])) {
            $this->assertPostable($tx->account, $data['occurred_on']);
        }

        $this->assertDirectionFits($data['kind'] ?? $tx->kind, $data['direction'] ?? $tx->direction);

        $tx->update($data);

        return $tx;
    }

    public function deleteManual(TreasuryTransaction $tx): void
    {
        $this->assertManual($tx);
        $this->assertOpen($tx->account);
        $tx->delete();
    }

    /**
     * Move money between two accounts. Across currencies the two amounts differ and both
     * are what actually left and arrived, so the provider's rate and fees need no modelling.
     *
     * @param  array<string,mixed> $data
     * @return array{0:TreasuryTransaction,1:TreasuryTransaction} [out leg, in leg]
     */
    public function transfer(TreasuryAccount $from, TreasuryAccount $to, array $data, ?User $by): array
    {
        if ($from->id === $to->id) {
            throw ValidationException::withMessages([
                'to_account_id' => 'Choose two different accounts.',
            ]);
        }

        $sent     = (int) $data['amount_minor'];
        $received = $data['received_amount_minor'] ?? null;

        if ($received === null) {
            if ($from->currency !== $to->currency) {
                throw ValidationException::withMessages([
                    'received_amount_minor' => "Enter how much arrived in {$to->currency}.",
                ]);
            }
            $received = $sent;
        }

        $this->assertPostable($from, $data['occurred_on']);
        $this->assertPostable($to, $data['occurred_on']);

        return DB::transaction(function () use ($from, $to, $data, $sent, $received, $by) {
            $group  = (string) Str::uuid();
            $shared = [
                'kind'               => TreasuryTransaction::KIND_TRANSFER,
                'occurred_on'        => $data['occurred_on'],
                'description'        => $data['description'],
                'reference'          => $data['reference'] ?? null,
                'transfer_group'     => $group,
                'created_by_user_id' => $by?->id,
            ];

            return [
                $from->transactions()->create($shared + [
                    'direction'    => TreasuryTransaction::OUT,
                    'amount_minor' => $sent,
                    'counterparty' => $to->name,
                ]),
                $to->transactions()->create($shared + [
                    'direction'    => TreasuryTransaction::IN,
                    'amount_minor' => (int) $received,
                    'counterparty' => $from->name,
                ]),
            ];
        });
    }

    /** Both legs go together: half a transfer would leave money that came from nowhere. */
    public function deleteTransfer(TreasuryTransaction $leg): void
    {
        DB::transaction(function () use ($leg) {
            $legs = TreasuryTransaction::with('account')
                ->where('transfer_group', $leg->transfer_group)
                ->get();

            $legs->each(fn (TreasuryTransaction $row) => $this->assertOpen($row->account));
            $legs->each->delete();
        });
    }

    /**
     * Sum balances per currency across accounts.
     *
     * @param  Collection<int,TreasuryAccount> $accounts
     * @param  array<int,int> $balances
     * @param  array<int,array{in:int,out:int,external_in:int,external_out:int}> $movement
     * @return list<array{currency:string,balance_minor:int,month_in_minor:int,month_out_minor:int}>
     */
    public function totalsByCurrency(Collection $accounts, array $balances, array $movement): array
    {
        return $accounts
            ->groupBy('currency')
            ->map(fn (Collection $group, string $currency) => [
                'currency'        => $currency,
                'balance_minor'   => $group->sum(fn ($a) => $balances[$a->id] ?? 0),
                'month_in_minor'  => $group->sum(fn ($a) => $movement[$a->id]['external_in'] ?? 0),
                'month_out_minor' => $group->sum(fn ($a) => $movement[$a->id]['external_out'] ?? 0),
            ])
            ->sortKeys()
            ->values()
            ->all();
    }

    private function assertManual(TreasuryTransaction $tx): void
    {
        if ($tx->isManual()) {
            return;
        }

        throw ValidationException::withMessages([
            'transaction' => match ($tx->kind) {
                TreasuryTransaction::KIND_EXPENSE         => 'This movement belongs to an expense. Change it from the expense itself.',
                TreasuryTransaction::KIND_STUDENT_PAYMENT => "This movement follows the student's package. Change the package instead.",
                TreasuryTransaction::KIND_TEACHER_SALARY  => 'This movement follows the payroll. Change the payroll instead.',
                default                                   => 'Transfers cannot be edited. Delete the transfer and enter it again.',
            },
        ]);
    }

    private function assertDirectionFits(string $kind, string $direction): void
    {
        if (! in_array($direction, TreasuryTransaction::MANUAL_KINDS[$kind] ?? [], true)) {
            throw ValidationException::withMessages([
                'kind' => "A movement of kind \"{$kind}\" cannot go \"{$direction}\".",
            ]);
        }
    }
}
