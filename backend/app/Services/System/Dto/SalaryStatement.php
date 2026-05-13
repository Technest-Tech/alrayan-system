<?php

namespace App\Services\System\Dto;

use App\Models\System\Payroll;
use App\Models\System\Teacher;
use Illuminate\Support\Collection;

class SalaryStatement
{
    public function __construct(
        public Teacher    $teacher,
        public ?Payroll   $current,
        public Collection $history,
    ) {}
}
