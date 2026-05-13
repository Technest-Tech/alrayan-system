<?php

namespace App\Services\System\Dto;

readonly class QualityScore
{
    public function __construct(
        public int   $attendance,
        public int   $reports,
        public int   $retention,
        public int   $punctuality,
        public array $inputs,
    ) {}
}
