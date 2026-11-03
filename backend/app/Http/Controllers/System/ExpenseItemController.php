<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\ExpenseResource;
use App\Models\System\Expense;
use App\Models\System\ExpenseItem;
use App\Models\System\TreasuryAccount;
use App\Services\System\AuditLog;
use App\Services\System\ExpenseLedger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ExpenseItemController extends Controller
{
    public function __construct(private readonly ExpenseLedger $ledger) {}

    /** The standing items for a month: what's expected, what's been recorded, what's still due. */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);
        $month = $request->input('month', Carbon::now()->format('Y-m'));

        $items = ExpenseItem::with(['category', 'defaultAccount'])
            ->orderByDesc('is_active')
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $recorded = Expense::whereIn('item_id', $items->pluck('id'))
            ->where('period', $month)
            ->orderBy('id')
            ->get()
            ->groupBy('item_id');

        $rows = $items->map(fn (ExpenseItem $item) => $this->present($item, $month, $recorded->get($item->id, collect())));

        return response()->json([
            'data'    => $rows,
            'month'   => $month,
            'summary' => $this->summary($rows, $month),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->withAccountCurrency($request->validate($this->rules(false)));
        $this->assertFixedHasAmount($data);
        $data = $this->withAutoRecord($data, null);

        $item = ExpenseItem::create($data);

        AuditLog::record('expenses.item_created', $item, ['type' => $item->type]);

        return response()->json(['data' => $item->load(['category', 'defaultAccount'])], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = ExpenseItem::findOrFail($id);

        $data = $this->withAccountCurrency($request->validate($this->rules(true)));
        $this->assertFixedHasAmount($data + $item->only(['type', 'default_amount_minor']));
        $data = $this->withAutoRecord($data, $item);

        $item->update($data);

        return response()->json(['data' => $item->load(['category', 'defaultAccount'])]);
    }

    /** Past expenses keep their reference to the item, so this only retires it going forward. */
    public function destroy(int $id): JsonResponse
    {
        $item = ExpenseItem::findOrFail($id);
        $item->delete();

        AuditLog::record('expenses.item_deleted', $item);

        return response()->json(null, 204);
    }

    /** Record this item's expense for a month, optionally overriding its defaults. */
    public function record(Request $request, int $id): JsonResponse
    {
        $item = ExpenseItem::findOrFail($id);

        $data = $request->validate([
            'month'        => ['required', 'date_format:Y-m'],
            'occurred_on'  => ['required', 'date'],
            'amount_minor' => ['nullable', 'integer', 'min:1'],
            'account_id'   => ['nullable', 'integer', Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at')],
            'description'  => ['nullable', 'string', 'max:255'],
        ]);

        // An explicit null means "not from a tracked account"; absent means the item's default.
        $accountId = $request->has('account_id') ? ($data['account_id'] ?? null) : $item->default_account_id;
        $account   = $accountId ? TreasuryAccount::find($accountId) : null;

        if ($account) {
            ExpenseController::ensureCanMoveMoney($request->user());
        }

        $amount   = $data['amount_minor'] ?? null;
        $currency = $account?->currency ?? $item->currency;

        if ($amount === null) {
            // The default amount is in the item's currency, so it can't stand in for one
            // paid from an account in another: 100 USD must not become 100 EGP.
            if (! $item->default_amount_minor || $currency !== $item->currency) {
                throw ValidationException::withMessages([
                    'amount_minor' => "Enter the amount in {$currency}.",
                ]);
            }
            $amount = $item->default_amount_minor;
        }

        $expense = $this->ledger->create([
            'category_id'  => $item->category_id,
            'account_id'   => $account?->id,
            'item_id'      => $item->id,
            'period'       => $data['month'],
            'amount_minor' => $amount,
            'currency'     => $currency,
            'description'  => $data['description'] ?? $item->name,
            'occurred_on'  => $data['occurred_on'],
        ], $request->user());

        AuditLog::record('expenses.created', $request->user(), [
            'expense_id'  => $expense->id,
            'item_id'     => $item->id,
            'amount'      => $expense->amount_minor,
            'currency'    => $expense->currency,
            'account_id'  => $expense->account_id,
        ]);

        return response()->json([
            'data' => new ExpenseResource($expense->load(['category', 'createdBy', 'account', 'item'])),
        ], 201);
    }

    /** @return array<string,list<mixed>> */
    private function rules(bool $partial): array
    {
        $required = $partial ? ['sometimes'] : ['required'];
        $optional = $partial ? ['sometimes', 'nullable'] : ['nullable'];

        return [
            'name'                 => [...$required, 'string', 'max:150'],
            'category_id'          => [...$required, 'integer', 'exists:sys_expense_categories,id'],
            'type'                 => [...$required, Rule::in([ExpenseItem::FIXED, ExpenseItem::VARIABLE])],
            'default_amount_minor' => [...$optional, 'integer', 'min:1'],
            'currency'             => [...($partial ? ['sometimes'] : ['required_without:default_account_id', 'nullable']), 'string', Rule::in(TreasuryAccount::CURRENCIES)],
            'default_account_id'   => [...$optional, 'integer', Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at')],
            'due_day'              => [...$optional, 'integer', 'between:1,31'],
            'is_active'            => ['sometimes', 'boolean'],
            'auto_record'          => ['sometimes', 'boolean'],
            'notes'                => [...$optional, 'string', 'max:2000'],
        ];
    }

    /**
     * An item paid from an account is priced in that account's currency.
     *
     * @param  array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function withAccountCurrency(array $data): array
    {
        if (! empty($data['default_account_id'])) {
            $data['currency'] = TreasuryAccount::findOrFail($data['default_account_id'])->currency;
        }

        return $data;
    }

    /**
     * Only a fixed item with an account to pay from can record itself. Turning it on stamps
     * today as the start, so a due date already passed this month isn't recorded a second
     * time on top of a payment made by hand. A variable item has no amount to post, so
     * switching to variable switches this off.
     *
     * @param  array<string,mixed> $data
     * @return array<string,mixed>
     */
    private function withAutoRecord(array $data, ?ExpenseItem $item): array
    {
        $type   = $data['type'] ?? $item?->type;
        $wasOn  = (bool) $item?->auto_record;
        $wantOn = (bool) ($data['auto_record'] ?? $wasOn);

        if ($type !== ExpenseItem::FIXED) {
            if (! empty($data['auto_record'])) {
                throw ValidationException::withMessages(['auto_record' => 'Only a fixed item can be recorded automatically.']);
            }
            $wantOn = false;
        }

        $accountId = array_key_exists('default_account_id', $data) ? $data['default_account_id'] : $item?->default_account_id;

        if ($wantOn && ! $accountId) {
            throw ValidationException::withMessages(['auto_record' => 'Choose the account this item is paid from to record it automatically.']);
        }

        $data['auto_record'] = $wantOn;
        if ($wantOn !== $wasOn) {
            $data['auto_record_since'] = $wantOn ? Carbon::today()->toDateString() : null;
        }

        return $data;
    }

    /** @param array<string,mixed> $data */
    private function assertFixedHasAmount(array $data): void
    {
        if (($data['type'] ?? null) === ExpenseItem::FIXED && empty($data['default_amount_minor'])) {
            throw ValidationException::withMessages([
                'default_amount_minor' => 'A fixed item needs an amount.',
            ]);
        }
    }

    /** @param Collection<int,Expense> $recorded */
    private function present(ExpenseItem $item, string $month, Collection $recorded): array
    {
        $dueOn = null;
        if ($item->due_day) {
            $first = Carbon::createFromFormat('!Y-m', $month);
            $dueOn = $first->copy()->day(min($item->due_day, $first->daysInMonth))->toDateString();
        }

        $isRecorded = $recorded->isNotEmpty();
        // An item added today owes nothing for last year. It stays recordable, so a past
        // month can still be backfilled, but it isn't due or counted in months before it existed.
        $isExpected = $isRecorded || $item->created_at->format('Y-m') <= $month;

        return [
            'id'                   => $item->id,
            'name'                 => $item->name,
            'type'                 => $item->type,
            'category'             => ['id' => $item->category?->id, 'name' => $item->category?->name],
            'default_amount_minor' => $item->default_amount_minor,
            'currency'             => $item->currency,
            'default_account'      => $item->defaultAccount ? [
                'id'       => $item->defaultAccount->id,
                'name'     => $item->defaultAccount->name,
                'currency' => $item->defaultAccount->currency,
                'is_active'=> $item->defaultAccount->is_active,
            ] : null,
            'due_day'    => $item->due_day,
            'auto_record'=> $item->auto_record,
            'due_on'     => $dueOn,
            'is_active'  => $item->is_active,
            'notes'      => $item->notes,
            'is_recorded'=> $isRecorded,
            'is_expected'=> $isExpected,
            'is_overdue' => $item->isFixed() && $item->is_active && $isExpected && ! $isRecorded
                && $dueOn !== null && $dueOn < Carbon::now()->toDateString(),
            'recorded'   => $this->byCurrency($recorded),
            'expenses'   => $recorded->map(fn (Expense $e) => [
                'id'           => $e->id,
                'amount_minor' => $e->amount_minor,
                'currency'     => $e->currency,
                'occurred_on'  => $e->occurred_on?->toDateString(),
            ])->values(),
        ];
    }

    /**
     * @param  Collection<int,array<string,mixed>> $rows
     * @return array<string,list<array{currency:string,total_minor:int}>>
     */
    private function summary(Collection $rows, string $month): array
    {
        $fixed = $rows->where('type', ExpenseItem::FIXED)->where('is_active', true)->where('is_expected', true);

        // Expenses that belong to no item, so the month's picture is complete.
        $first = Carbon::createFromFormat('!Y-m', $month);
        $oneOff = Expense::whereNull('item_id')
            ->whereDate('occurred_on', '>=', $first->toDateString())
            ->whereDate('occurred_on', '<=', $first->copy()->endOfMonth()->toDateString())
            ->selectRaw('currency, SUM(amount_minor) as total_minor')
            ->groupBy('currency')
            ->orderBy('currency')
            ->get()
            ->map(fn ($r) => ['currency' => $r->currency, 'total_minor' => (int) $r->total_minor])
            ->values();

        return [
            'fixed_expected'    => $this->sumDefaults($fixed),
            'fixed_outstanding' => $this->sumDefaults($fixed->where('is_recorded', false)),
            'recorded'          => $this->mergeTotals($rows->pluck('recorded')->flatten(1)),
            'one_off'           => $oneOff,
        ];
    }

    /**
     * @param  Collection<int,array<string,mixed>> $rows
     * @return list<array{currency:string,total_minor:int}>
     */
    private function sumDefaults(Collection $rows): array
    {
        return $this->mergeTotals($rows->map(fn (array $r) => [
            'currency'    => $r['currency'],
            'total_minor' => (int) $r['default_amount_minor'],
        ]));
    }

    /**
     * @param  Collection<int,array{currency:string,total_minor:int}> $totals
     * @return list<array{currency:string,total_minor:int}>
     */
    private function mergeTotals(Collection $totals): array
    {
        return $totals
            ->groupBy('currency')
            ->map(fn (Collection $g, string $currency) => [
                'currency'    => $currency,
                'total_minor' => (int) $g->sum('total_minor'),
            ])
            ->sortKeys()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int,Expense> $expenses
     * @return list<array{currency:string,total_minor:int}>
     */
    private function byCurrency(Collection $expenses): array
    {
        return $this->mergeTotals($expenses->map(fn (Expense $e) => [
            'currency'    => $e->currency,
            'total_minor' => (int) $e->amount_minor,
        ]));
    }
}
