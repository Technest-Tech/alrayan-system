<?php

namespace App\Console\Commands\System;

use App\Events\System\TeacherUnderperforming;
use App\Models\System\QualityReview;
use App\Models\System\Teacher;
use App\Services\System\BonusRecommender;
use App\Services\System\QualityScorer;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RecomputeQualityScores extends Command
{
    protected $signature   = 'system:quality:recompute';
    protected $description = 'Recompute quality scores for all active teachers (trailing 30 days)';

    public function handle(QualityScorer $scorer, BonusRecommender $recommender): int
    {
        $end   = now();
        $start = $end->copy()->subDays(30);

        Teacher::where('is_active', true)->cursor()->each(function ($t) use ($scorer, $recommender, $start, $end) {
            $score   = $scorer->score($t, $start, $end);
            $overall = $scorer->overall($score);

            QualityReview::updateOrCreate(
                ['teacher_id' => $t->id, 'period_year' => $end->year, 'period_month' => $end->month, 'source' => 'auto'],
                [
                    'reviewer_user_id'           => null,
                    'attendance_score'            => $score->attendance,
                    'reports_score'               => $score->reports,
                    'retention_score'             => $score->retention,
                    'punctuality_score'           => $score->punctuality,
                    'overall_score'               => $overall,
                    'inputs'                      => $score->inputs,
                    'bonus_recommendation_minor'  => $recommender->forScore($overall),
                ]
            );

            if ($overall < Setting::int('quality.underperforming_threshold', 70)) {
                event(new TeacherUnderperforming($t, $overall));
            }
        });

        $this->info('Quality scores recomputed.');
        return self::SUCCESS;
    }
}
