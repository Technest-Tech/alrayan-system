<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\System\Teacher;
use App\Services\System\Dto\TrialAnalytics;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class TrialAnalyticsBuilder
{
    public function build(Carbon $from, Carbon $to): TrialAnalytics
    {
        $cacheKey = "trials:{$from->toDateString()}:{$to->toDateString()}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to) {
            $trials = Lead::whereIn('status', ['trial_booked', 'trial_completed', 'enrolled', 'lost'])
                ->whereBetween('updated_at', [$from, $to])
                ->get();

            $booked    = $trials->count();
            $completed = $trials->whereIn('status', ['trial_completed', 'enrolled'])->count();
            $enrolled  = $trials->where('status', 'enrolled')->count();

            return new TrialAnalytics(
                totalBooked:   $booked,
                completed:     $completed,
                enrolled:      $enrolled,
                notConverted:  $booked - $enrolled,
                conversionRate: $booked === 0 ? 0 : (int) round(100 * $enrolled / $booked),
                monthlyTrend:  $this->trend($trials),
                bestTeacher:   $this->bestConvertingTeacher($from, $to),
            );
        });
    }

    private function trend($trials): array
    {
        return $trials->groupBy(fn($l) => Carbon::parse($l->updated_at)->format('Y-m'))
            ->map(function ($group, $month) {
                $enrolled = $group->where('status', 'enrolled')->count();
                return [
                    'month'           => $month,
                    'booked'          => $group->count(),
                    'enrolled'        => $enrolled,
                    'conversion_rate' => $group->count() > 0
                        ? round(100 * $enrolled / $group->count(), 1)
                        : 0,
                ];
            })
            ->sortKeys()
            ->values()
            ->toArray();
    }

    private function bestConvertingTeacher(Carbon $from, Carbon $to): ?array
    {
        $leads = Lead::where('status', 'enrolled')
            ->whereNotNull('assigned_supervisor_id')
            ->whereBetween('updated_at', [$from, $to])
            ->selectRaw('assigned_supervisor_id, COUNT(*) as enrolled_count')
            ->groupBy('assigned_supervisor_id')
            ->orderByDesc('enrolled_count')
            ->first();

        if (!$leads) return null;

        $user = \App\Models\User::find($leads->assigned_supervisor_id);
        return $user ? ['name' => $user->name, 'enrolled_count' => $leads->enrolled_count] : null;
    }
}
