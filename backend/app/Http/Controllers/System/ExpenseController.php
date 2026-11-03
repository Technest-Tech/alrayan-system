<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Expense\StoreExpenseRequest;
use App\Http\Requests\System\Expense\UpdateExpenseRequest;
use App\Http\Resources\System\ExpenseResource;
use App\Models\System\Expense;
use App\Models\User;
use App\Services\System\AuditLog;
use App\Services\System\ExpenseLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ExpenseController extends Controller
{
    private const RELATIONS = ['category', 'createdBy', 'account', 'item'];

    public function __construct(private readonly ExpenseLedger $ledger) {}

    public function index(Request $request): ResourceCollection
    {
        $query = Expense::with(self::RELATIONS)
            ->when($request->input('filter.category_id'), fn($q, $v) => $q->where('category_id', $v))
            ->when($request->input('filter.account_id'), fn($q, $v) => $q->where('account_id', $v))
            ->when($request->input('filter.item_id'), fn($q, $v) => $q->where('item_id', $v))
            ->when($request->input('filter.currency'), fn($q, $v) => $q->where('currency', $v))
            ->when($request->input('filter.from'), fn($q, $v) => $q->whereDate('occurred_on', '>=', $v))
            ->when($request->input('filter.to'), fn($q, $v) => $q->whereDate('occurred_on', '<=', $v))
            ->when($request->input('filter.q'), fn($q, $v) => $q->where('description', 'like', "%{$v}%"))
            ->orderByDesc('occurred_on')
            ->orderByDesc('id');

        return ExpenseResource::collection($query->paginate($request->integer('per_page', 25)));
    }

    public function show(int $id): ExpenseResource
    {
        return new ExpenseResource(Expense::with(self::RELATIONS)->findOrFail($id));
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['account_id'])) {
            self::ensureCanMoveMoney($request->user());
        }

        $expense = $this->ledger->create($data, $request->user());

        AuditLog::record('expenses.created', $request->user(), [
            'expense_id'  => $expense->id,
            'amount'      => $expense->amount_minor,
            'currency'    => $expense->currency,
            'category_id' => $expense->category_id,
            'account_id'  => $expense->account_id,
        ]);

        return response()->json(['data' => new ExpenseResource($expense->load(self::RELATIONS))], 201);
    }

    public function update(UpdateExpenseRequest $request, int $id): ExpenseResource
    {
        $expense = Expense::findOrFail($id);
        $data    = $request->validated();

        if ($expense->account_id || ! empty($data['account_id'])) {
            self::ensureCanMoveMoney($request->user());
        }

        $this->ledger->update($expense, $data, $request->user());

        return new ExpenseResource($expense->load(self::RELATIONS));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        if ($expense->account_id) {
            self::ensureCanMoveMoney($request->user());
        }

        $this->ledger->delete($expense);

        AuditLog::record('expenses.deleted', $request->user(), ['expense_id' => $id]);

        return response()->json(null, 204);
    }

    /** An expense tied to an account changes that account's balance. */
    public static function ensureCanMoveMoney(User $user): void
    {
        abort_unless($user->role === 'admin' || $user->can('treasury.record'), 403, 'Forbidden');
    }
}
