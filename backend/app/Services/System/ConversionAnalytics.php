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
