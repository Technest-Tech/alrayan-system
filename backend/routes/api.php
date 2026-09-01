<?php

use App\Http\Controllers\Api\V1\BlogController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CourseApiController;
use App\Http\Controllers\Api\V1\TeacherController;
use App\Http\Controllers\Api\V1\TeacherReviewController;
use App\Http\Controllers\Api\V1\TrialBookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/v1/up', function () {
    return response()->json([
        'status'  => 'ok',
        'version' => config('app.version', '0.1.0'),
    ]);
});

// Public read-only endpoints — no auth, no rate limit, no Turnstile
Route::prefix('v1')->group(function () {
    Route::get('/blog',           [BlogController::class, 'index']);
    Route::get('/blog/{slug}',    [BlogController::class, 'show']);
    Route::get('/courses',        [CourseApiController::class, 'index']);
    Route::get('/courses/{slug}', [CourseApiController::class, 'show']);
    Route::get('/teachers',        [TeacherController::class, 'index']);
    Route::get('/teachers/{slug}', [TeacherController::class, 'show']);
    Route::get('/site-settings',   [\App\Http\Controllers\Api\V1\SiteSettingsController::class, 'show']);
    Route::get('/pricing',        [\App\Http\Controllers\Api\PublicPricingController::class, 'show'])->name('api.pricing');
});

Route::prefix('v1')
    ->middleware(['throttle:form', 'turnstile'])
    ->group(function () {
        Route::post('/trial-bookings', [TrialBookingController::class, 'store']);
        Route::post('/contacts',       [ContactController::class, 'store']);
        // Student reviews publish straight to the teacher's page, so the
        // throttle and Turnstile on this group are load-bearing here.
        Route::post('/teachers/{slug}/reviews', [TeacherReviewController::class, 'store']);
    });

// Tracking beacon for the public site. No auth and no Turnstile — it fires on
// every page view — but throttled per IP so it cannot be used to flood the
// table. See App\Services\Site\VisitRecorder for what is (and is not) stored.
Route::prefix('v1')
    ->middleware('throttle:beacon')
    ->group(function () {
        Route::post('/site-visits', [\App\Http\Controllers\Api\V1\SiteVisitController::class, 'store']);
    });

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
