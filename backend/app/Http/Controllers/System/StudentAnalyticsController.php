<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\StudentTimelineEntry;
use App\Models\System\Teacher;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StudentAnalyticsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $preset = in_array($request->string('period')->toString(), ['30d', '90d', '12m', 'all'], true)
            ? $request->string('period')->toString()
            : 'all';
        $periodStart = match ($preset) {
            '30d' => now()->subDays(30)->startOfDay(),
            '90d' => now()->subDays(90)->startOfDay(),
            '12m' => now()->subMonths(12)->startOfMonth(),
            default => null,
        };

        $students = Student::query();
        $totalStudents = (clone $students)->count();
        $statusCounts = (clone $students)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $timeline = StudentTimelineEntry::query()
            ->where('event_type', 'status_changed')
            ->when($periodStart, fn (Builder $query) => $query->where('created_at', '>=', $periodStart))
            ->orderBy('created_at')
            ->get();

        $stoppedEntries = $timeline->filter(
            fn (StudentTimelineEntry $entry) => in_array(data_get($entry->payload, 'new'), ['paused', 'suspended'], true),
        );
        $returnedEntries = $timeline->filter(
            fn (StudentTimelineEntry $entry) => data_get($entry->payload, 'new') === 'active'
                && in_array(data_get($entry->payload, 'old'), ['paused', 'suspended'], true),
        );
        $archivedEntries = $timeline->filter(
            fn (StudentTimelineEntry $entry) => data_get($entry->payload, 'new') === 'cancelled',
        );
        $reactivatedEntries = $timeline->filter(
            fn (StudentTimelineEntry $entry) => data_get($entry->payload, 'new') === 'active'
                && data_get($entry->payload, 'old') === 'cancelled',
        );

        $currentlyStopped = (int) ($statusCounts['paused'] ?? 0) + (int) ($statusCounts['suspended'] ?? 0);
        $currentlyArchived = (int) ($statusCounts['cancelled'] ?? 0);

        $records = $this->records($request);
        $chartMonths = $this->monthKeys();
        $lessonsByMonth = $this->lessonsByMonth($chartMonths);
        $activeStudentsByMonth = $this->activeStudentsByMonth($chartMonths);
        $averageLessonsByMonth = collect($chartMonths)->map(fn (string $month) => [
            'month' => $month,
            'value' => ($activeStudentsByMonth[$month] ?? 0) > 0
                ? round(($lessonsByMonth[$month] ?? 0) / $activeStudentsByMonth[$month], 1)
                : 0,
        ])->values();

        $packageStats = StudentPackage::query()
            ->selectRaw('currency, AVG(CASE WHEN package_hours > 0 THEN tariff_at_time * 1.0 / package_hours ELSE NULL END) as avg_hourly_rate')
            ->groupBy('currency')
            ->get()
            ->map(fn (StudentPackage $package) => [
                'currency' => $package->currency,
                'minor' => (int) round((float) $package->avg_hourly_rate),
            ])
            ->values();

        $averagePackageHours = (float) (StudentPackage::query()->where('package_hours', '>', 0)->avg('package_hours') ?? 0);
        $totalLessons = Lesson::query()->count();

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'period' => [
                'preset' => $preset,
                'from' => $periodStart?->toDateString(),
                'to' => now()->toDateString(),
            ],
            'overview' => [
                'total_students' => $totalStudents,
                'active_students' => (int) ($statusCounts['active'] ?? 0),
                'inactive_students' => $currentlyStopped,
                'archived_students' => $currentlyArchived,
                'average_package_hours' => round($averagePackageHours, 1),
                'average_tariff_by_currency' => $packageStats,
                'total_lessons' => $totalLessons,
                'average_lessons_per_student' => $totalStudents > 0 ? round($totalLessons / $totalStudents, 1) : 0,
            ],
            'stopped' => [
                'currently_stopped' => $currentlyStopped,
                'stopped_period' => $stoppedEntries->count(),
                'returned_period' => $returnedEntries->count(),
                'return_rate' => $stoppedEntries->count() > 0
                    ? round(($returnedEntries->count() / $stoppedEntries->count()) * 100, 1)
                    : 0,
                'average_pause_days' => $this->averagePauseDays(),
                'upcoming_returns' => 0,
                'overdue_returns' => Student::query()
                    ->whereIn('status', ['paused', 'suspended'])
                    ->where(fn (Builder $query) => $query
                        ->where('paused_at', '<', now()->subDays(30))
                        ->orWhere('suspended_at', '<', now()->subDays(30)))
                    ->count(),
                'reasons' => $this->reasonBreakdown($stoppedEntries),
                'monthly' => $this->lifecycleMonthlySeries($chartMonths, ['paused', 'suspended'], ['active'], ['paused', 'suspended']),
            ],
            'archived' => [
                'currently_archived' => $currentlyArchived,
                'archived_period' => $archivedEntries->count(),
                'reactivated_period' => $reactivatedEntries->count(),
                'in_grace_window' => Student::query()
                    ->whereIn('status', ['paused', 'suspended'])
                    ->where(fn (Builder $query) => $query
                        ->where('paused_at', '>=', now()->subDays(30))
                        ->orWhere('suspended_at', '>=', now()->subDays(30)))
                    ->count(),
                'approaching_archive' => Student::query()
                    ->whereIn('status', ['paused', 'suspended'])
                    ->where(fn (Builder $query) => $query
                        ->whereBetween('paused_at', [now()->subDays(30), now()->subDays(21)])
                        ->orWhereBetween('suspended_at', [now()->subDays(30), now()->subDays(21)]))
                    ->count(),
                'at_risk_new' => Student::query()
                    ->where('status', 'trial')
                    ->where('created_at', '<', now()->subDays(7))
                    ->count(),
                'archive_rate' => $totalStudents > 0 ? round(($currentlyArchived / $totalStudents) * 100, 1) : 0,
                'reasons' => $this->archiveReasonBreakdown(),
                'monthly' => $this->lifecycleMonthlySeries($chartMonths, ['cancelled'], ['active'], ['cancelled']),
            ],
            'charts' => [
                'status' => [
                    ['key' => 'active', 'label' => 'Active', 'value' => (int) ($statusCounts['active'] ?? 0)],
                    ['key' => 'inactive', 'label' => 'Inactive', 'value' => $currentlyStopped],
                    ['key' => 'new', 'label' => 'New', 'value' => (int) ($statusCounts['trial'] ?? 0)],
                    ['key' => 'archived', 'label' => 'Archived', 'value' => $currentlyArchived],
                ],
                'currencies' => Student::query()
                    ->selectRaw('currency, COUNT(*) as aggregate')
                    ->groupBy('currency')
                    ->orderByDesc('aggregate')
                    ->get()
                    ->map(fn (Student $student) => [
                        'key' => $student->currency,
                        'label' => $student->currency,
                        'value' => (int) $student->aggregate,
                    ])
                    ->values(),
                'package_sizes' => $this->packageSizeDistribution(),
                'activity' => collect($chartMonths)->map(fn (string $month) => [
                    'month' => $month,
                    'lessons' => (int) ($lessonsByMonth[$month] ?? 0),
                    'active_students' => (int) ($activeStudentsByMonth[$month] ?? 0),
                ])->values(),
                'lessons_per_month' => collect($chartMonths)->map(fn (string $month) => [
                    'month' => $month,
                    'value' => (int) ($lessonsByMonth[$month] ?? 0),
                ])->values(),
                'package_utilization' => $this->packageUtilization(),
                'active_students_per_month' => collect($chartMonths)->map(fn (string $month) => [
                    'month' => $month,
                    'value' => (int) ($activeStudentsByMonth[$month] ?? 0),
                ])->values(),
                'average_lessons_per_student' => $averageLessonsByMonth,
            ],
            'filters' => [
                'teachers' => Teacher::query()
                    ->whereIn('id', Student::query()->whereNotNull('assigned_teacher_id')->select('assigned_teacher_id'))
                    ->with('user:id,name')
                    ->get(['id', 'user_id'])
                    ->map(fn (Teacher $teacher) => [
                        'id' => $teacher->id,
                        'name' => $teacher->user?->name,
                    ])
                    ->filter(fn (array $teacher) => filled($teacher['name']))
                    ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                    ->values(),
            ],
            'records' => $records,
        ]);
    }

    private function records(Request $request): array
    {
        $perPage = min(max($request->integer('per_page', 20), 10), 100);
        $query = Student::query()
            ->with(['course', 'assignedTeacher.user', 'packages.allocations'])
            ->withCount('lessons')
            ->withMax('lessons', 'scheduled_at');

        if ($search = trim($request->string('q')->toString())) {
            $query->search($search);
        }

        $status = $request->string('status')->toString();
        match ($status) {
            'active' => $query->where('status', 'active'),
            'inactive' => $query->whereIn('status', ['paused', 'suspended']),
            'new' => $query->where('status', 'trial'),
            'suspended' => $query->where('status', 'suspended'),
            'archived' => $query->where('status', 'cancelled'),
            default => null,
        };

        if ($teacherId = $request->integer('teacher_id')) {
            $query->where('assigned_teacher_id', $teacherId);
        }

        $sort = $request->string('sort', 'name')->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';
        $sortColumn = match ($sort) {
            'status' => 'status',
            'lessons' => 'lessons_count',
            'last_activity' => 'lessons_max_scheduled_at',
            'created_at' => 'created_at',
            default => 'name',
        };
        $query->orderBy($sortColumn, $direction);

        $page = $query->paginate($perPage)->appends($request->query());

        return [
            'data' => $page->getCollection()->map(function (Student $student) {
                $packages = $student->packages;
                $latestPackage = $packages->sortByDesc('package_number')->first();
                $packageHours = (float) $packages->sum('package_hours');
                $consumedHours = (float) $packages->sum(
                    fn (StudentPackage $package) => $package->allocations->sum('hours'),
                );
                $remainingHours = max(0, $packageHours - $consumedHours);
                $packagePrice = (int) ($latestPackage?->tariff_at_time ?? $student->monthly_price_minor);
                $latestHours = (float) ($latestPackage?->package_hours ?? $student->package_hours_default);

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'teacher' => $student->assignedTeacher ? [
                        'id' => $student->assignedTeacher->id,
                        'name' => $student->assignedTeacher->user?->name,
                    ] : null,
                    'course' => $student->course?->title,
                    'phone' => $student->phone ?: $student->whatsapp,
                    'currency' => $latestPackage?->currency ?? $student->currency,
                    'package_hours' => $latestHours,
                    'package_price_minor' => $packagePrice,
                    'price_per_hour_minor' => $latestHours > 0 ? (int) round($packagePrice / $latestHours) : 0,
                    'teacher_rate' => (int) ($student->assignedTeacher?->hourly_rate ?? 0),
                    'teacher_currency' => $student->assignedTeacher?->currency,
                    'hours_left' => round($remainingHours, 1),
                    'remaining_balance_minor' => (int) $student->wallet_balance_minor,
                    'lessons' => (int) $student->lessons_count,
                    'last_activity' => $student->lessons_max_scheduled_at,
                    'status' => $student->status,
                ];
            })->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'from' => $page->firstItem(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'to' => $page->lastItem(),
                'total' => $page->total(),
            ],
        ];
    }

    private function averagePauseDays(): float
    {
        $students = Student::query()
            ->whereIn('status', ['paused', 'suspended'])
            ->get(['paused_at', 'suspended_at']);

        if ($students->isEmpty()) {
            return 0;
        }

        return round($students->average(function (Student $student) {
            $started = $student->paused_at ?? $student->suspended_at;

            return $started ? $started->diffInDays(now()) : 0;
        }), 1);
    }

    private function reasonBreakdown(Collection $entries): Collection
    {
        return $entries
            ->map(fn (StudentTimelineEntry $entry) => trim((string) (
                data_get($entry->payload, 'context.reason')
                ?: data_get($entry->payload, 'context.notes')
                ?: 'Other'
            )))
            ->countBy()
            ->sortDesc()
            ->map(fn (int $value, string $label) => compact('label', 'value'))
            ->values();
    }

    private function archiveReasonBreakdown(): Collection
    {
        return Student::query()
            ->where('status', 'cancelled')
            ->get(['cancellation_reason'])
            ->map(fn (Student $student) => trim((string) ($student->cancellation_reason ?: 'Other')))
            ->countBy()
            ->sortDesc()
            ->map(fn (int $value, string $label) => compact('label', 'value'))
            ->values();
    }

    private function monthKeys(): array
    {
        $cursor = CarbonImmutable::now()->startOfMonth()->subMonths(12);

        return collect(range(0, 12))
            ->map(fn (int $offset) => $cursor->addMonths($offset)->format('Y-m'))
            ->all();
    }

    private function lessonsByMonth(array $months): Collection
    {
        return Lesson::query()
            ->where('scheduled_at', '>=', CarbonImmutable::createFromFormat('Y-m', $months[0])->startOfMonth())
            ->get(['scheduled_at'])
            ->countBy(fn (Lesson $lesson) => $lesson->scheduled_at->format('Y-m'));
    }

    private function activeStudentsByMonth(array $months): Collection
    {
        return Lesson::query()
            ->where('scheduled_at', '>=', CarbonImmutable::createFromFormat('Y-m', $months[0])->startOfMonth())
            ->get(['student_id', 'scheduled_at'])
            ->groupBy(fn (Lesson $lesson) => $lesson->scheduled_at->format('Y-m'))
            ->map(fn (Collection $lessons) => $lessons->pluck('student_id')->filter()->unique()->count());
    }

    private function lifecycleMonthlySeries(
        array $months,
        array $negativeStatuses,
        array $positiveStatuses,
        array $positiveOldStatuses,
    ): Collection {
        $entries = StudentTimelineEntry::query()
            ->where('event_type', 'status_changed')
            ->where('created_at', '>=', CarbonImmutable::createFromFormat('Y-m', $months[0])->startOfMonth())
            ->get();

        return collect($months)->map(function (string $month) use (
            $entries,
            $negativeStatuses,
            $positiveStatuses,
            $positiveOldStatuses,
        ) {
            $monthly = $entries->filter(fn (StudentTimelineEntry $entry) => $entry->created_at->format('Y-m') === $month);

            return [
                'month' => $month,
                'negative' => $monthly->filter(
                    fn (StudentTimelineEntry $entry) => in_array(data_get($entry->payload, 'new'), $negativeStatuses, true),
                )->count(),
                'positive' => $monthly->filter(
                    fn (StudentTimelineEntry $entry) => in_array(data_get($entry->payload, 'new'), $positiveStatuses, true)
                        && in_array(data_get($entry->payload, 'old'), $positiveOldStatuses, true),
                )->count(),
            ];
        })->values();
    }

    private function packageSizeDistribution(): Collection
    {
        $buckets = [
            ['key' => '0-5', 'label' => '0–5h', 'min' => 0, 'max' => 5, 'value' => 0],
            ['key' => '6-10', 'label' => '6–10h', 'min' => 6, 'max' => 10, 'value' => 0],
            ['key' => '11-15', 'label' => '11–15h', 'min' => 11, 'max' => 15, 'value' => 0],
            ['key' => '16-20', 'label' => '16–20h', 'min' => 16, 'max' => 20, 'value' => 0],
            ['key' => '21-30', 'label' => '21–30h', 'min' => 21, 'max' => 30, 'value' => 0],
            ['key' => '30+', 'label' => '30h+', 'min' => 31, 'max' => PHP_INT_MAX, 'value' => 0],
        ];

        StudentPackage::query()->pluck('package_hours')->each(function (int $hours) use (&$buckets) {
            foreach ($buckets as &$bucket) {
                if ($hours >= $bucket['min'] && $hours <= $bucket['max']) {
                    $bucket['value']++;
                    break;
                }
            }
        });

        return collect($buckets)->map(fn (array $bucket) => collect($bucket)->except(['min', 'max'])->all());
    }

    private function packageUtilization(): Collection
    {
        $segments = collect([
            'new' => ['key' => 'new', 'label' => 'New packages', 'value' => 0],
            'partial' => ['key' => 'partial', 'label' => 'Partially used', 'value' => 0],
            'mostly' => ['key' => 'mostly', 'label' => 'Mostly used', 'value' => 0],
            'full' => ['key' => 'full', 'label' => 'Fully used', 'value' => 0],
        ]);

        StudentPackage::query()
            ->with('allocations')
            ->where('package_hours', '>', 0)
            ->get()
            ->each(function (StudentPackage $package) use ($segments) {
                $used = (float) $package->allocations->sum('hours');
                $ratio = $used / max(1, (float) $package->package_hours);
                $key = match (true) {
                    $ratio <= 0 => 'new',
                    $ratio < .5 => 'partial',
                    $ratio < .8 => 'mostly',
                    default => 'full',
                };
                $segment = $segments->get($key);
                $segment['value']++;
                $segments->put($key, $segment);
            });

        return $segments->values();
    }
}
