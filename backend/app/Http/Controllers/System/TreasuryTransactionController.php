<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\TreasuryTransactionResource;
use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Services\System\AuditLog;
use App\Services\System\TreasuryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TreasuryTransactionController extends Controller
{
    private const RELATIONS = ['account', 'expense.category', 'createdBy'];

    public function __construct(private readonly TreasuryService $treasury) {}

    /** Recent movements across all accounts. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $rows = $this->filtered($request, TreasuryTransaction::query())
            ->with(self::RELATIONS)
            ->orderByDesc('occurred_on')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100));

        return TreasuryTransactionResource::collection($rows);
    }

    /** One account's statement: its movements with the balance after each, plus period totals. */
    public function statement(Request $request, int $accountId): AnonymousResourceCollection
    {
        $account = TreasuryAccount::findOrFail($accountId);

        $running = TreasuryTransaction::query()
            ->from('sys_treasury_transactions as prior')
            ->whereColumn('prior.account_id', 'sys_treasury_transactions.account_id')
            ->whereNull('prior.deleted_at')
            ->where(fn ($q) => $q
                ->whereColumn('prior.occurred_on', '<', 'sys_treasury_transactions.occurred_on')
                ->orWhere(fn ($same) => $same
                    ->whereColumn('prior.occurred_on', 'sys_treasury_transactions.occurred_on')
                    ->whereColumn('prior.id', '<=', 'sys_treasury_transactions.id')))
            ->selectRaw('COALESCE(SUM(CASE WHEN prior.direction = \'in\' THEN prior.amount_minor ELSE -prior.amount_minor END), 0)')
            ->withoutGlobalScopes();

        $rows = $this->filtered($request, $account->transactions()->getQuery())
            ->select('sys_treasury_transactions.*')
            ->selectSub($running, 'running_total')
            ->with(self::RELATIONS)
            ->orderByDesc('occurred_on')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 50), 100));

        return TreasuryTransactionResource::collection($rows)->additional([
            'summary' => $this->treasury->statementSummary(
                $account,
                $request->input('filter.from'),
                $request->input('filter.to'),
            ),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'account_id'   => ['required', 'integer', Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at')],
            'direction'    => ['required', Rule::in([TreasuryTransaction::IN, TreasuryTransaction::OUT])],
            'kind'         => ['required', Rule::in(array_keys(TreasuryTransaction::MANUAL_KINDS))],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'occurred_on'  => ['required', 'date'],
            'description'  => ['required', 'string', 'max:500'],
            'counterparty' => ['nullable', 'string', 'max:190'],
            'reference'    => ['nullable', 'string', 'max:190'],
        ]);

        $tx = $this->treasury->recordManual(TreasuryAccount::findOrFail($data['account_id']), $data, $request->user());

        AuditLog::record('treasury.transaction_created', $tx, [
            'account_id'   => $tx->account_id,
            'direction'    => $tx->direction,
            'kind'         => $tx->kind,
            'amount_minor' => $tx->amount_minor,
        ]);

        return response()->json(['data' => new TreasuryTransactionResource($tx->load(self::RELATIONS))], 201);
    }

    public function update(Request $request, int $id): TreasuryTransactionResource
    {
        $tx = TreasuryTransaction::findOrFail($id);

        $data = $request->validate([
            'direction'    => ['sometimes', Rule::in([TreasuryTransaction::IN, TreasuryTransaction::OUT])],
            'kind'         => ['sometimes', Rule::in(array_keys(TreasuryTransaction::MANUAL_KINDS))],
            'amount_minor' => ['sometimes', 'integer', 'min:1'],
            'occurred_on'  => ['sometimes', 'date'],
            'description'  => ['sometimes', 'string', 'max:500'],
            'counterparty' => ['sometimes', 'nullable', 'string', 'max:190'],
            'reference'    => ['sometimes', 'nullable', 'string', 'max:190'],
        ]);

        $before = $tx->only(['direction', 'kind', 'amount_minor']);
        $this->treasury->updateManual($tx, $data);

        AuditLog::record('treasury.transaction_updated', $tx, ['before' => $before]);

        return new TreasuryTransactionResource($tx->load(self::RELATIONS));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tx = TreasuryTransaction::findOrFail($id);

        if ($tx->kind === TreasuryTransaction::KIND_TRANSFER) {
            $this->treasury->deleteTransfer($tx);
        } else {
            $this->treasury->deleteManual($tx);
        }

        AuditLog::record('treasury.transaction_deleted', $tx, [
            'account_id'   => $tx->account_id,
            'kind'         => $tx->kind,
            'direction'    => $tx->direction,
            'amount_minor' => $tx->amount_minor,
        ]);

        return response()->json(null, 204);
    }

    public function transfer(Request $request): JsonResponse
    {
        $accountExists = Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at');

        $data = $request->validate([
            'from_account_id'       => ['required', 'integer', $accountExists],
            'to_account_id'         => ['required', 'integer', $accountExists],
            'amount_minor'          => ['required', 'integer', 'min:1'],
            'received_amount_minor' => ['nullable', 'integer', 'min:1'],
            'occurred_on'           => ['required', 'date'],
            'description'           => ['required', 'string', 'max:500'],
            'reference'             => ['nullable', 'string', 'max:190'],
        ]);

        [$out, $in] = $this->treasury->transfer(
            TreasuryAccount::findOrFail($data['from_account_id']),
            TreasuryAccount::findOrFail($data['to_account_id']),
            $data,
            $request->user(),
        );

        AuditLog::record('treasury.transfer_created', $out, [
            'from_account_id' => $out->account_id,
            'to_account_id'   => $in->account_id,
            'sent_minor'      => $out->amount_minor,
            'received_minor'  => $in->amount_minor,
        ]);

        return response()->json([
            'data' => TreasuryTransactionResource::collection(
                collect([$out, $in])->each->load(self::RELATIONS),
            ),
        ], 201);
    }

    /**
     * @template T of \Illuminate\Database\Eloquent\Builder
     * @param  T $query
     * @return T
     */
    private function filtered(Request $request, $query)
    {
        return $query
            ->when($request->input('filter.account_id'), fn ($q, $v) => $q->where('account_id', $v))
            ->when($request->input('filter.direction'), fn ($q, $v) => $q->where('direction', $v))
            ->when($request->input('filter.kind'), fn ($q, $v) => $q->where('kind', $v))
            ->when($request->input('filter.from'), fn ($q, $v) => $q->whereDate('occurred_on', '>=', $v))
            ->when($request->input('filter.to'), fn ($q, $v) => $q->whereDate('occurred_on', '<=', $v))
            ->when($request->input('filter.q'), fn ($q, $v) => $q->where(fn ($inner) => $inner
                ->where('description', 'like', "%{$v}%")
                ->orWhere('counterparty', 'like', "%{$v}%")
                ->orWhere('reference', 'like', "%{$v}%")));
    }
}
