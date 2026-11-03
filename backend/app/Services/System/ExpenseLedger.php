<?php

namespace App\Services\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseItem;
use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Every write to an expense goes through here so the expense and the account movement
 * paying for it can never disagree: the movement is created, moved, resized or removed
 * in the same transaction as the expense.
 */
class ExpenseLedger
{
    public function __construct(private readonly TreasuryService $treasury) {}

    /** @param array<string,mixed> $data validated expense fields */
    public function create(array $data, ?User $by): Expense
    {
        return DB::transaction(function () use ($data, $by) {
            $data = $this->normalize($data, null);

            $expense = Expense::create($data + ['created_by_user_id' => $by?->id]);
            $this->syncMovement($expense, $by);

            return $expense;
        });
    }

    /** @param array<string,mixed> $data validated expense fields */
    public function update(Expense $expense, array $data, ?User $by): Expense
    {
        return DB::transaction(function () use ($expense, $data, $by) {
            $expense->update($this->normalize($data, $expense));
            $this->syncMovement($expense, $by);

            return $expense;
        });
    }

    public function delete(Expense $expense): void
    {
        DB::transaction(function () use ($expense) {
            if ($movement = $expense->treasuryTransaction) {
                $this->treasury->assertOpen($movement->account);
                $movement->delete();
            }

            $expense->delete();
        });
    }

    /**
     * Enforce the rules every expense must satisfy, on the merged final state.
     *
     * @param  array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function normalize(array $data, ?Expense $existing): array
    {
        $accountId = array_key_exists('account_id', $data) ? $data['account_id'] : $existing?->account_id;
        $account   = $accountId ? TreasuryAccount::findOrFail($accountId) : null;

        if ($account) {
            // An account only holds one currency. Omitting the currency on create takes the
            // account's; a mismatch is refused rather than converted, since 100 USD silently
            // becoming 100 EGP would quietly corrupt the balance.
            $currency = $data['currency'] ?? ($existing ? $existing->currency : $account->currency);

            if ($currency !== $account->currency) {
                throw ValidationException::withMessages([
                    'currency' => "The account \"{$account->name}\" is in {$account->currency}. Enter the amount in {$account->currency}.",
                ]);
            }

            $data['currency'] = $currency;
        }

        $date = $data['occurred_on'] ?? $existing?->occurred_on?->toDateString();

        if ($account && $this->touchesAccount($data, $existing)) {
            $this->treasury->assertPostable($account, $date);
        }

        $itemId = array_key_exists('item_id', $data) ? $data['item_id'] : $existing?->item_id;

        if ($itemId) {
            // Keep the month an item's expense was filed under unless it's moved to another item.
            $sameItem = $existing && (int) $existing->item_id === (int) $itemId;

            $data['period'] = $data['period']
                ?? ($sameItem ? $existing->period : null)
                ?? Carbon::parse($date)->format('Y-m');

            $this->assertNotAlreadyRecorded((int) $itemId, $data['period'], $existing);
        } else {
            $data['period'] = null;
        }

        return $data;
    }

    /**
     * Renaming an expense shouldn't fail because its old date predates a later correction
     * to the account's opening date, so only changes that move money re-check the account.
     *
     * @param array<string,mixed> $data
     */
    private function touchesAccount(array $data, ?Expense $existing): bool
    {
        if (! $existing) {
            return true;
        }

        return (array_key_exists('account_id', $data) && (int) $data['account_id'] !== (int) $existing->account_id)
            || (array_key_exists('amount_minor', $data) && (int) $data['amount_minor'] !== (int) $existing->amount_minor)
            || (array_key_exists('occurred_on', $data)
                && Carbon::parse($data['occurred_on'])->toDateString() !== $existing->occurred_on?->toDateString());
    }

    /** A fixed item is paid once a month; the row lock makes a double-click harmless. */
    private function assertNotAlreadyRecorded(int $itemId, string $period, ?Expense $existing): void
    {
        $item = ExpenseItem::withTrashed()->lockForUpdate()->findOrFail($itemId);

        if (! $item->isFixed()) {
            return;
        }

        $taken = Expense::where('item_id', $itemId)
            ->where('period', $period)
            ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                'item_id' => "\"{$item->name}\" is already recorded for {$period}.",
            ]);
        }
    }

    private function syncMovement(Expense $expense, ?User $by): void
    {
        $movement = $expense->treasuryTransaction()->first();

        if (! $expense->account_id) {
            $movement?->delete();
            return;
        }

        $fields = [
            'account_id'   => $expense->account_id,
            'direction'    => TreasuryTransaction::OUT,
            'kind'         => TreasuryTransaction::KIND_EXPENSE,
            'amount_minor' => $expense->amount_minor,
            'occurred_on'  => $expense->occurred_on,
            'description'  => $expense->description,
        ];

        if ($movement) {
            $movement->update($fields);
            return;
        }

        TreasuryTransaction::create($fields + [
            'expense_id'         => $expense->id,
            'created_by_user_id' => $by?->id,
        ]);
    }
}
