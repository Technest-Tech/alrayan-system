<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\ContactConfirmation;
use App\Mail\ContactReceived;
use App\Models\ContactMessage;
use App\Models\System\Lead;
use App\Services\BookingReferenceGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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

        // Surface every contact message in the CRM as a new lead.
        try {
            Lead::create([
                'name'          => $contact->name,
                'email'         => $contact->email,
                'source'        => 'website_form',
                // sys_leads.source_detail is varchar(255) while a subject may
                // itself be 255 chars — trim so the insert can't be rejected
                // and cost us the lead.
                'source_detail' => Str::limit('Contact form · ' . $contact->subject, 255, ''),
                'platform'      => 'website',
                'status'        => 'new_lead',
                'notes'         => $contact->message,
                'payload'       => ['subject' => $contact->subject, 'reference' => $contact->reference],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to create lead from contact message', ['contact' => $contact->id, 'error' => $e->getMessage()]);
        }

        Mail::to($contact->email)
            ->queue(new ContactConfirmation($contact));

        // Notify the academy inbox as well. Zad relies on Web3Forms from the
        // website for this; here the backend owns it, so keep the queued mail.
        Mail::to(config('mail.admin_address', 'info@alrayan-academy.com'))
            ->queue(new ContactReceived($contact));

        return response()->json([
            'reference' => $contact->reference,
            'message'   => 'Your message has been received! We will reply within 24 hours.',
        ], 201);
    }
}
