<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check — no auth, no rate limit
Route::get('/v1/up', function () {
    return response()->json([
        'status'  => 'ok',
        'version' => config('app.version', '0.1.0'),
    ]);
});

// --- Sprint 4: uncomment when forms are implemented ---
// Route::prefix('v1')->middleware(['throttle:form'])->group(function () {
//     Route::post('/trial-bookings', [\App\Http\Controllers\Api\V1\TrialBookingController::class, 'store']);
//     Route::post('/contacts',       [\App\Http\Controllers\Api\V1\ContactController::class, 'store']);
// });

// Current authenticated user (admin — Sprint 7)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
