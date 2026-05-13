<?php

namespace App\Services\System;

use App\Support\System\Setting;

class BonusRecommender
{
    public function forScore(int $overall): int
    {
        $base      = Setting::int('quality.recommended_bonus_minor', 50000);
        $threshold = Setting::int('quality.bonus_recommendation_threshold', 90);

        if ($overall >= 95) return (int) round($base * 1.5);
        if ($overall >= $threshold) return $base;
        return 0;
    }
}
