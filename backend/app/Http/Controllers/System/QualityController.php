<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Quality\SubmitReviewRequest;
use App\Http\Resources\System\QualityLeaderboardResource;
use App\Http\Resources\System\QualityReviewResource;
use App\Models\System\Payroll;
use App\Models\System\QualityReview;
use App\Models\System\Teacher;
use App\Services\System\BonusRecommender;
use App\Services\System\QualityScorer;
use App\Support\System\Setting;
use Illuminate\Http\Request;

class QualityController extends Controller
{
    public function index(Request $request)
    {
        $teachers = Teacher::where('is_active', true)
            ->with(['user', 'qualityReviews' => fn($q) => $q->orderByDesc('period_year')->orderByDesc('period_month')->limit(7)])
            ->get();
        return QualityLeaderboardResource::collection($teachers);
    }

    public function show(Teacher $teacher)
    {
        $reviews = QualityReview::where('teacher_id', $teacher->id)
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->with('reviewer')
            ->paginate(24);
        return QualityReviewResource::collection($reviews);
    }

    public function submitReview(SubmitReviewRequest $request, Teacher $teacher, QualityScorer $scorer, BonusRecommender $recommender)
    {
        $weights = [
            'attendance'  => Setting::int('quality.weight.attendance', 30),
            'reports'     => Setting::int('quality.weight.reports', 30),
            'retention'   => Setting::int('quality.weight.retention', 25),
            'punctuality' => Setting::int('quality.weight.punctuality', 15),
        ];
        $overall = (int) round(
            ($request->attendance_score  * $weights['attendance']
            + $request->reports_score    * $weights['reports']
            + $request->retention_score  * $weights['retention']
            + $request->punctuality_score * $weights['punctuality']) / 100
        );

        $review = QualityReview::create([
            'teacher_id'                 => $teacher->id,
            'period_year'                => $request->period_year,
            'period_month'               => $request->period_month,
            'reviewer_user_id'           => $request->user()->id,
            'source'                     => 'manual',
            'attendance_score'           => $request->attendance_score,
            'reports_score'              => $request->reports_score,
            'retention_score'            => $request->retention_score,
            'punctuality_score'          => $request->punctuality_score,
            'overall_score'              => $overall,
            'notes'                      => $request->notes,
            'bonus_recommendation_minor' => $recommender->forScore($overall),
        ]);

        return new QualityReviewResource($review->load('reviewer'));
    }

    public function applyBonus(Request $request, Teacher $teacher, BonusRecommender $recommender)
    {
        $review = QualityReview::where('teacher_id', $teacher->id)
            ->where('bonus_recommendation_minor', '>', 0)
            ->latest()
            ->firstOrFail();

        $payroll = Payroll::where('teacher_id', $teacher->id)
            ->where('status', 'pending')
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->firstOrFail();

        $this->authorize('adjust', $payroll);

        $adj = $payroll->adjustments()->create([
            'type'             => 'bonus',
            'category'         => 'performance',
            'amount_minor'     => $review->bonus_recommendation_minor,
            'reason'           => 'Bonus applied from quality recommendation (overall score: ' . $review->overall_score . ')',
            'added_by_user_id' => $request->user()->id,
        ]);
        $payroll->recomputeTotals();

        return response()->json(['message' => 'Bonus applied.', 'adjustment_id' => $adj->id]);
    }
}
