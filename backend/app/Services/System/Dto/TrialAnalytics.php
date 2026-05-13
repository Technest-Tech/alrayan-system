<?php

namespace App\Services\System\Dto;

class TrialAnalytics
{
    public function __construct(
        public readonly int    $totalBooked,
        public readonly int    $completed,
        public readonly int    $enrolled,
        public readonly int    $notConverted,
        public readonly int    $conversionRate,
        public readonly array  $monthlyTrend,
        public readonly ?array $bestTeacher,
    ) {}

    public function toArray(): array
    {
        return [
            'total_booked'   => $this->totalBooked,
            'completed'      => $this->completed,
            'enrolled'       => $this->enrolled,
            'not_converted'  => $this->notConverted,
            'conversion_rate'=> $this->conversionRate,
            'monthly_trend'  => $this->monthlyTrend,
            'best_teacher'   => $this->bestTeacher,
        ];
    }
}
