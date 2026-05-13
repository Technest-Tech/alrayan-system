<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\ContactConfirmation;
use App\Mail\ContactReceived;
use App\Models\ContactMessage;
use App\Services\BookingReferenceGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request, BookingReferenceGenerator $refs): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $contact = ContactMessage::create([
            'reference' => $refs->forContact(),
            ...$validated,
        ]);

        Mail::to(config('mail.admin_address', 'info@alrayan-academy.com'))
            ->queue(new ContactReceived($contact));
        Mail::to($contact->email)
            ->queue(new ContactConfirmation($contact));

        return response()->json([
            'reference' => $contact->reference,
            'message'   => 'Your message has been received! We will reply within 24 hours.',
        ], 201);
    }
}
