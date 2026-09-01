<?php

namespace App\Console\Commands\System;

use App\Models\System\Lead;
use App\Models\TrialBooking;
use App\Services\System\LeadFromTrialBookingConverter;
use Illuminate\Console\Command;

/**
 * Repairs the CRM side of trial bookings taken before the booking→lead mapping
 * carried the visitor's details: the insert holding those details was rejected
 * by sys_leads.country, so a booking either produced no lead at all or — where
 * a queue worker ran the fallback — one with an empty notes field.
 *
 * Creates the missing leads and fills only the columns that are still empty, so
 * anything a supervisor has since typed survives and re-running is a no-op.
 */
class BackfillTrialLeadDetails extends Command
{
    protected $signature   = 'system:leads:backfill-trial-details {--dry-run : List what would change without writing}';
    protected $description = 'Fill missing notes, country and WhatsApp on leads created from trial bookings';

    /** Columns worth recovering — all of them derive from the booking. */
    private const RECOVERABLE = ['notes', 'country', 'whatsapp', 'source_detail', 'platform', 'payload'];

    public function handle(LeadFromTrialBookingConverter $converter): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $created = 0;
        $updated = 0;

        // Bookings that never reached the CRM at all — the failed insert left
        // them lead-less whenever no queue worker picked up the fallback.
        // withTrashed so a lead a supervisor deleted on purpose is not recreated.
        TrialBooking::whereDoesntHave('lead', fn ($q) => $q->withTrashed())
            ->chunkById(200, function ($bookings) use ($converter, $dryRun, &$created) {
                foreach ($bookings as $booking) {
                    $this->line("Booking {$booking->reference} ({$booking->name}): creating lead");

                    if (! $dryRun) {
                        $converter->convert($booking);
                    }

                    $created++;
                }
            });

        Lead::whereNotNull('trial_booking_id')
            ->with('trialBooking')
            ->chunkById(200, function ($leads) use ($converter, $dryRun, &$updated) {
                foreach ($leads as $lead) {
                    $booking = $lead->trialBooking;
                    if (! $booking) continue;

                    $mapped = $converter->attributesFor($booking);
                    $fill   = [];

                    foreach (self::RECOVERABLE as $column) {
                        if (! blank($lead->{$column})) continue;
                        if (blank($mapped[$column] ?? null)) continue;

                        $fill[$column] = $mapped[$column];
                    }

                    if ($fill === []) continue;

                    $this->line("Lead #{$lead->id} ({$lead->name}): " . implode(', ', array_keys($fill)));

                    if (! $dryRun) {
                        $lead->forceFill($fill)->save();
                    }

                    $updated++;
                }
            });

        $this->info($dryRun
            ? "{$created} lead(s) would be created, {$updated} updated."
            : "{$created} lead(s) created, {$updated} updated.");

        return self::SUCCESS;
    }
}
