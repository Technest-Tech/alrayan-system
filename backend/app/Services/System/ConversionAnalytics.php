<?php

namespace App\Services\System;

use App\Models\System\Lead;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ConversionAnalytics
{
    public function funnel(Carbon $from, Carbon $to): array
    {
        $base = Lead::whereBetween('created_at', [$from, $to]);

        $leads     = (clone $base)->count();
        $contacted = (clone $base)->whereIn('status', ['contacted', 'trial_booked', 'trial_completed', 'enrolled', 'lost'])->count();
        $trials    = (clone $base)->whereIn('status', ['trial_completed', 'enrolled'])->count();
        $enrolled  = (clone $base)->where('status', 'enrolled')->count();

        return compact('leads', 'contacted', 'trials', 'enrolled');
    }

    public function bySource(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('source, count(*) as total, sum(case when status="enrolled" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('source')
            ->get();
    }

    public function bySupervisor(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('assigned_supervisor_id, count(*) as total, sum(case when status="enrolled" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('assigned_supervisor_id')
            ->groupBy('assigned_supervisor_id')
            ->with('supervisor:id,name')
            ->get();
    }

    public function trendDaily(Carbon $from, Carbon $to): Collection
    {
        return Lead::query()
            ->selectRaw('DATE(created_at) as date, count(*) as leads_count, sum(case when status in ("trial_booked","trial_completed","enrolled") then 1 else 0 end) as trials_count, sum(case when status="enrolled" then 1 else 0 end) as enrolled_count')
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();
    }
}
