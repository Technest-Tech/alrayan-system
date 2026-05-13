<?php

namespace App\Mail;

use App\Models\TrialBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TrialBookingConfirmation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly TrialBooking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your free trial class is booked! (Ref: {$this->booking->reference})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.trial-booking-confirmation',
        );
    }
}
