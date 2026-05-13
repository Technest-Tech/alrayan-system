<?php

namespace App\Services\System\Dto;

class CancellationReport
{
    public function __construct(
        public readonly int   $totalCancelled,
        public readonly array $byReason,
        public readonly array $byTeacher,
        public readonly array $monthlyCount,
        public readonly array $rate,
    ) {}

    public function toArray(): array
    {
        return [
            'total_cancelled' => $this->totalCancelled,
            'by_reason'       => $this->byReason,
            'by_teacher'      => $this->byTeacher,
            'monthly_count'   => $this->monthlyCount,
            'rate'            => $this->rate,
        ];
    }
}
