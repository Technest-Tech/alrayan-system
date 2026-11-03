<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Payroll;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\TreasuryAccount;
use App\Services\System\AuditLog;
use App\Services\System\SalaryTiers;
use App\Support\System\TreasuryRouting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TreasuryRoutingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->payload());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'students'   => ['present', 'array'],
            'students.*' => ['nullable', 'integer'],
            'teachers'   => ['present', 'array'],
            'teachers.*' => ['nullable', 'integer'],
        ]);

        $routing = [];
        foreach ([TreasuryRouting::STUDENTS, TreasuryRouting::TEACHERS] as $audience) {
            $routing[$audience] = $this->checked($audience, $data[$audience]);
        }

        TreasuryRouting::save($routing);
        AuditLog::record('treasury.routing_changed', $request->user(), $routing);

        return response()->json($this->payload());
    }

    /**
     * @param  array<string,int|null> $map
     * @return array<string,int>
     */
    private function checked(string $audience, array $map): array
    {
        $out = [];

        foreach (array_filter($map) as $currency => $accountId) {
            $account = TreasuryAccount::active()->find($accountId);

            if (! $account || $account->currency !== $currency) {
                throw ValidationException::withMessages([
                    "{$audience}.{$currency}" => "Choose an active account in {$currency}.",
                ]);
            }

            $out[$currency] = $account->id;
        }

        return $out;
    }

    /** @return array<string,mixed> */
    private function payload(): array
    {
        return [
            'data' => TreasuryRouting::all(),
            // The currencies money actually arrives or leaves in, so a gap is visible even
            // before an account in that currency exists.
            'currencies' => [
                TreasuryRouting::STUDENTS => $this->distinct(
                    Student::query()->whereNotNull('currency')->distinct()->pluck('currency'),
                    StudentPackage::query()->distinct()->pluck('currency'),
                ),
                TreasuryRouting::TEACHERS => $this->distinct(
                    collect([SalaryTiers::CURRENCY]),
                    Payroll::query()->whereNotNull('currency')->distinct()->pluck('currency'),
                ),
            ],
        ];
    }

    /** @return list<string> */
    private function distinct(iterable ...$lists): array
    {
        return collect($lists)->flatMap(fn ($list) => $list)->unique()->sort()->values()->all();
    }
}
