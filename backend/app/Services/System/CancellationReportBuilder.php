<?php

namespace App\Services\System;

use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Services\System\Dto\CancellationReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class CancellationReportBuilder
{
    public function build(Carbon $from, Carbon $to): CancellationReport
    {
        $cacheKey = "cancellations:{$from->toDateString()}:{$to->toDateString()}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to) {
            $cancelled = Student::where('status', 'cancelled')
                ->whereBetween('cancelled_at', [$from, $to])
                ->get();

            $byReason = $cancelled->groupBy('cancellation_reason')
                ->map->count()
                ->toArray();

            $byTeacher = $cancelled->groupBy('assigned_teacher_id')
                ->map(function ($students, $teacherId) {
                    $teacher = Teacher::find($teacherId);
                    return [
                        'teacher_name' => $teacher?->name ?? 'Unassigned',
                        'count'        => $students->count(),
                    ];
                })
                ->values()
                ->toArray();

            $monthlyCount = $cancelled->groupBy(fn($s) =>
                Carbon::parse($s->cancelled_at)->format('Y-m')
            )->map->count()->toArray();

            $rate = $this->monthlyRate($cancelled, $from, $to);

            return new CancellationReport(
                totalCancelled: $cancelled->count(),
                byReason: $byReason,
                byTeacher: $byTeacher,
                monthlyCount: $monthlyCount,
                rate: $rate,
            );
        });
    }

    private function monthlyRate($cancelled, Carbon $from, Carbon $to): array
    {
        $rows = [];
        $current = $from->copy()->startOfMonth();

        while ($current->lte($to)) {
            $monthKey = $current->format('Y-m');
            $monthEnd = $current->copy()->endOfMonth();

            $cancelledThisMonth = $cancelled->filter(
                fn($s) => $s->cancelled_at
                    && Carbon::parse($s->cancelled_at)->between($current, $monthEnd)
            )->count();

            $totalActive = Student::where('status', 'active')
                ->whereDate('enrolled_at', '<=', $monthEnd)
                ->count();

            $rows[] = [
                'month'             => $monthKey,
                'month_label'       => $current->format('M Y'),
                'cancelled'         => $cancelledThisMonth,
                'cancellation_rate' => $totalActive > 0
                    ? round(100 * $cancelledThisMonth / $totalActive, 1)
                    : 0,
            ];

            $current->addMonth();
        }

        return $rows;
    }
}
