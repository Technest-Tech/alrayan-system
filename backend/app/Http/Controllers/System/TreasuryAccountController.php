<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\TreasuryAccountResource;
use App\Models\System\ExpenseItem;
use App\Models\System\TreasuryAccount;
use App\Services\System\AuditLog;
use App\Services\System\LiveFxRateService;
use App\Services\System\TreasuryService;
use App\Support\System\ProfitabilityConfig;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TreasuryAccountController extends Controller
{
    public function __construct(
        private readonly TreasuryService $treasury,
        private readonly LiveFxRateService $fx,
    ) {}

    public function index(): JsonResponse
    {
        $accounts = TreasuryAccount::withCount('transactions')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        $balances = $this->treasury->balances($accounts);
        $movement = $this->treasury->monthlyMovement($accounts, Carbon::now());

        foreach ($accounts as $account) {
            $account->balance_minor   = $balances[$account->id];
            $account->month_in_minor  = $movement[$account->id]['in'] ?? 0;
            $account->month_out_minor = $movement[$account->id]['out'] ?? 0;
        }

        return response()->json([
            'data'   => TreasuryAccountResource::collection($accounts),
            'totals' => $this->treasury->totalsByCurrency($accounts, $balances, $movement),
            'grand_total' => $this->grandTotal($accounts, $balances),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present(TreasuryAccount::withCount('transactions')->findOrFail($id))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules() + [
            'currency' => ['required', 'string', Rule::in(TreasuryAccount::CURRENCIES)],
        ]);

        $account = TreasuryAccount::create($data + ['created_by_user_id' => $request->user()->id]);

        AuditLog::record('treasury.account_created', $account, [
            'opening_balance_minor' => $account->opening_balance_minor,
            'currency'              => $account->currency,
        ]);

        return response()->json(['data' => $this->present($account)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $account = TreasuryAccount::findOrFail($id);

        $rules = collect($this->rules())->map(fn (array $r) => array_merge(['sometimes'], $r))->all();

        $data = $request->validate($rules + [
            'currency'  => ['sometimes', 'string', Rule::in(TreasuryAccount::CURRENCIES)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $this->assertCurrencyChangeable($account, $data);
        $this->assertOpeningDateFits($account, $data);
        $this->assertArchivable($account, $data);

        $before = $account->opening_balance_minor;
        $account->update($data);

        if ($before !== $account->opening_balance_minor) {
            AuditLog::record('treasury.opening_balance_changed', $account, [
                'from' => $before,
                'to'   => $account->opening_balance_minor,
            ]);
        }

        return response()->json(['data' => $this->present($account)]);
    }

    /** Deleting erases history, so it's only for accounts that never had any. */
    public function destroy(int $id): JsonResponse
    {
        $account = TreasuryAccount::findOrFail($id);

        if ($account->transactions()->exists()) {
            throw ValidationException::withMessages([
                'account' => 'This account has transactions. Archive it instead of deleting it.',
            ]);
        }

        ExpenseItem::where('default_account_id', $account->id)->update(['default_account_id' => null]);
        $account->delete();

        AuditLog::record('treasury.account_deleted', $account);

        return response()->json(null, 204);
    }

    /** @return array<string,list<mixed>> */
    private function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:120'],
            'type'                  => ['required', 'string', Rule::in(TreasuryAccount::TYPES)],
            'opening_balance_minor' => ['required', 'integer'],
            'opening_date'          => ['required', 'date'],
            'identifier'            => ['nullable', 'string', 'max:190'],
            'notes'                 => ['nullable', 'string', 'max:2000'],
        ];
    }

    private function present(TreasuryAccount $account): TreasuryAccountResource
    {
        $account->balance_minor = $this->treasury->balance($account);
        $movement = $this->treasury->monthlyMovement([$account], Carbon::now())[$account->id] ?? null;
        $account->month_in_minor  = $movement['in'] ?? 0;
        $account->month_out_minor = $movement['out'] ?? 0;

        return new TreasuryAccountResource($account);
    }

    /** Every existing amount is in the old currency; relabelling would change what they mean. */
    private function assertCurrencyChangeable(TreasuryAccount $account, array $data): void
    {
        if (isset($data['currency']) && $data['currency'] !== $account->currency && $account->transactions()->exists()) {
            throw ValidationException::withMessages([
                'currency' => 'The currency cannot change once the account has transactions.',
            ]);
        }
    }

    private function assertOpeningDateFits(TreasuryAccount $account, array $data): void
    {
        if (! isset($data['opening_date'])) {
            return;
        }

        $earliest = $account->transactions()->orderBy('occurred_on')->first()?->occurred_on;

        if ($earliest && Carbon::parse($data['opening_date'])->startOfDay()->gt($earliest)) {
            throw ValidationException::withMessages([
                'opening_date' => "This account has transactions from {$earliest->toDateString()}. The opening date cannot be after that.",
            ]);
        }
    }

    /** Archived accounts drop out of day-to-day use, so they must not be hiding money. */
    private function assertArchivable(TreasuryAccount $account, array $data): void
    {
        if (($data['is_active'] ?? true) === false && $account->is_active && $this->treasury->balance($account) !== 0) {
            throw ValidationException::withMessages([
                'is_active' => 'Move or adjust the remaining balance to zero before archiving this account.',
            ]);
        }
    }

    /**
     * Everything in one currency, for an at-a-glance total only — the per-currency figures
     * are the real ones. A currency with no rate marks the total partial rather than
     * silently counting as zero.
     *
     * @param  Collection<int,TreasuryAccount> $accounts
     * @param  array<int,int> $balances
     * @return array{currency:string,balance_minor:int,partial:bool}|null
     */
    private function grandTotal(Collection $accounts, array $balances): ?array
    {
        // Nothing to convert with a single currency, and no reason to touch the rate API.
        if ($accounts->pluck('currency')->unique()->count() < 2) {
            return null;
        }

        $target  = ProfitabilityConfig::reportCurrency();
        $map     = $this->fx->toEgpMap();
        $total   = 0;
        $partial = false;

        foreach ($accounts as $account) {
            $converted = $this->fx->convertMinor($balances[$account->id], $account->currency, $target, $map);

            if ($converted === null) {
                $partial = true;
                continue;
            }

            $total += $converted;
        }

        return ['currency' => $target, 'balance_minor' => $total, 'partial' => $partial];
    }
}
