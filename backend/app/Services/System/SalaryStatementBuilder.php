<?php

namespace App\Services\System;

use App\Models\System\Payroll;
use App\Models\System\Teacher;
use App\Services\System\Dto\SalaryStatement;

class SalaryStatementBuilder
{
    public function forTeacher(Teacher $t, ?int $year, ?int $month): SalaryStatement
    {
        $current = Payroll::where('teacher_id', $t->id)
            ->when($year && $month, fn($q) => $q->where('period_year', $year)->where('period_month', $month))
            ->latest('period_year')
            ->latest('period_month')
            ->with('adjustments')
            ->first();

        $history = Payroll::where('teacher_id', $t->id)
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->limit(12)
            ->get();

        return new SalaryStatement(teacher: $t, current: $current, history: $history);
    }
}
