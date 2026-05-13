<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Expense\StoreExpenseRequest;
use App\Http\Requests\System\Expense\UpdateExpenseRequest;
use App\Http\Resources\System\ExpenseResource;
use App\Models\System\Expense;
use App\Services\System\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        $query = Expense::with('category', 'createdBy')
            ->when($request->input('filter.category_id'), fn($q, $v) => $q->where('category_id', $v))
            ->when($request->input('filter.currency'), fn($q, $v) => $q->where('currency', $v))
            ->when($request->input('filter.from'), fn($q, $v) => $q->whereDate('occurred_on', '>=', $v))
            ->when($request->input('filter.to'), fn($q, $v) => $q->whereDate('occurred_on', '<=', $v))
            ->when($request->input('filter.q'), fn($q, $v) => $q->where('description', 'like', "%{$v}%"))
            ->orderByDesc('occurred_on');

        return ExpenseResource::collection($query->paginate($request->integer('per_page', 25)));
    }

    public function show(int $id): ExpenseResource
    {
        return new ExpenseResource(Expense::with('category', 'createdBy')->findOrFail($id));
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create(array_merge(
            $request->validated(),
            ['created_by_user_id' => $request->user()->id]
        ));

        AuditLog::record('expenses.created', $request->user(), [
            'expense_id'  => $expense->id,
            'amount'      => $expense->amount_minor,
            'currency'    => $expense->currency,
            'category_id' => $expense->category_id,
        ]);

        return response()->json(['data' => new ExpenseResource($expense->load('category'))], 201);
    }

    public function update(UpdateExpenseRequest $request, int $id): ExpenseResource
    {
        $expense = Expense::findOrFail($id);
        $expense->update($request->validated());
        return new ExpenseResource($expense->load('category'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        AuditLog::record('expenses.deleted', $request->user(), ['expense_id' => $id]);

        return response()->json(null, 204);
    }
}
