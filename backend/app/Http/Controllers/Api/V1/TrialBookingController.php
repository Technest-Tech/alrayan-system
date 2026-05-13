<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TrialBookingCreated;
use App\Http\Controllers\Controller;
use App\Mail\TrialBookingAdminNotification;
use App\Mail\TrialBookingConfirmation;
use App\Models\TrialBooking;
use App\Services\BookingReferenceGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class TrialBookingController extends Controller
{
    public function store(Request $request, BookingReferenceGenerator $refs): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100',
            'email'          => 'required|email|max:255',
            'country'        => 'required|string|max:100',
            'phone'          => 'nullable|string|max:30',
            'ageGroup'       => 'required|in:kid-5-8,kid-9-12,teen,adult',
            'courseInterest' => 'required|string|max:100',
            'preferredTime'  => 'required|string|max:50',
            'timezone'       => 'required|string|max:100',
            'message'        => 'nullable|string|max:500',
        ]);

        $booking = TrialBooking::create([
            'reference'       => $refs->forTrialBooking(),
            'name'            => $validated['name'],
            'email'           => $validated['email'],
            'country'         => $validated['country'],
            'phone'           => $validated['phone'] ?? null,
            'age_group'       => $validated['ageGroup'],
            'course_interest' => $validated['courseInterest'],
            'preferred_time'  => $validated['preferredTime'],
            'timezone'        => $validated['timezone'],
            'message'         => $validated['message'] ?? null,
        ]);

        TrialBookingCreated::dispatch($booking);

        Mail::to(config('mail.admin_address', 'info@alrayan-academy.com'))
            ->queue(new TrialBookingAdminNotification($booking));
        Mail::to($booking->email)
            ->queue(new TrialBookingConfirmation($booking));

        return response()->json([
            'reference' => $booking->reference,
            'message'   => 'Your trial class has been booked! Check your email for confirmation.',
        ], 201);
    }
}
