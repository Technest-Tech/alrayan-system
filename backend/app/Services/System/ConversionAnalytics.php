<?php

namespace App\Services\System;

use App\Models\System\Lead;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;

class ConversionAnalytics
{
    public function summary(): array
    {
        $total         = Lead::count();
        $closed        = Lead::where('status', 'closed')->count();
        $newThisMonth  = Lead::whereMonth('created_at', now()->month)
                             ->whereYear('created_at', now()->year)->count();
        $newThisWeek   = Lead::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $conversionRate = $total > 0 ? round(($closed / $total) * 100, 1) : 0.0;

        return [
            'total'           => $total,
            'closed'          => $closed,
            'new_this_month'  => $newThisMonth,
            'new_this_week'   => $newThisWeek,
            'conversion_rate' => $conversionRate,
        ];
    }

    public function byStatus(): array
    {
        return Lead::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    public function recentActivity(int $limit = 15): array
    {
        return Activity::query()
            ->where('log_name', 'system')
            ->where('subject_type', Lead::class)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (Activity $a) {
                $subject = Lead::withTrashed()->find($a->subject_id);
                return [
                    'id'           => $a->id,
                    'event'        => $a->event,
                    'subject_name' => $subject?->name ?? 'Unknown',
                    'causer_name'  => $a->causer?->name ?? null,
                    'properties'   => $a->properties,
                    'created_at'   => $a->created_at?->toISOString(),
                ];
            })
            ->toArray();
    }

    public function byGender(Carbon $from, Carbon $to): array
    {
        return Lead::query()
            ->selectRaw('gender, count(*) as total')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('gender')
            ->pluck('total', 'gender')
            ->toArray();
    }

    public function byCountry(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('country, count(*) as total')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('country')
            ->groupBy('country')
            ->orderByDesc('total')
            ->limit(15)
            ->get();
    }

    public function funnel(Carbon $from, Carbon $to): array
    {
        $base = Lead::whereBetween('created_at', [$from, $to]);

        $leads     = (clone $base)->count();
        $contacted = (clone $base)->whereIn('status', ['interested', 'waiting_for_trial', 'waiting_for_payment', 'closed', 'lost'])->count();
        $trials    = (clone $base)->whereIn('status', ['waiting_for_payment', 'closed'])->count();
        $enrolled  = (clone $base)->where('status', 'closed')->count();

        return compact('leads', 'contacted', 'trials', 'enrolled');
    }

    public function bySource(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('source, count(*) as total, sum(case when status="closed" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('source')
            ->get();
    }

    public function bySupervisor(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('assigned_supervisor_id, count(*) as total, sum(case when status="closed" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('assigned_supervisor_id')
            ->groupBy('assigned_supervisor_id')
            ->with('supervisor:id,name')
            ->get();
    }

    public function trendDaily(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('DATE(created_at) as date, count(*) as leads_count, sum(case when status in ("waiting_for_trial","waiting_for_payment","closed") then 1 else 0 end) as trials_count, sum(case when status="closed" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();
    }
}
