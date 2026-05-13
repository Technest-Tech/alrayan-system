<?php

namespace App\Services\System;

use App\Models\System\Student;

class FamilyDiscountResolver
{
    public static function highestFor(Student $student): int
    {
        if (!$student->relationLoaded('siblings')) {
            $student->load('siblings');
        }

        if ($student->siblings->isEmpty()) return 0;

        return $student->siblings->max(fn($s) => (int) $s->pivot->discount_pct) ?? 0;
    }
}
