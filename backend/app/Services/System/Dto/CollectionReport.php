<?php

namespace App\Services\System\Dto;

class CollectionReport
{
    public function __construct(
        public readonly int   $totalIssued,
        public readonly int   $paidOnTime,
        public readonly int   $paidLate,
        public readonly int   $unpaid,
        public readonly int   $collectionRate,
        public readonly float $averageDaysDelay,
        public readonly array $outstandingMinorByCurrency,
    ) {}

    public function toArray(): array
    {
        return [
            'total_issued'                   => $this->totalIssued,
            'paid_on_time'                   => $this->paidOnTime,
            'paid_late'                      => $this->paidLate,
            'unpaid'                         => $this->unpaid,
            'collection_rate'                => $this->collectionRate,
            'average_days_delay'             => $this->averageDaysDelay,
            'outstanding_minor_by_currency'  => $this->outstandingMinorByCurrency,
        ];
    }
}
