<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LeadPipelineService
{
    // Forward-only unless admin; enrolled blocked via drag (needs convert flow)
    private const TRANSITIONS = [
        'new'             => ['contacted', 'trial_booked', 'trial_completed', 'lost'],
        'contacted'       => ['trial_booked', 'trial_completed', 'lost'],
        'trial_booked'    => ['trial_completed', 'contacted', 'lost'],
        'trial_completed' => ['contacted', 'trial_booked', 'lost'],
        'enrolled'        => [],  // terminal — only via LeadToStudentConverter
        'lost'            => ['contacted'],  // reopen — admin only
    ];

    public function canTransition(Lead $lead, string $toStatus, User $actor): bool
    {
        $from = $lead->status;

        if ($toStatus === 'enrolled') return false;  // must use convert flow

        $allowed = self::TRANSITIONS[$from] ?? [];

        if (!in_array($toStatus, $allowed, true)) {
            return false;
        }

        // Backward transitions (e.g. trial_completed → contacted) require admin
        $order = ['new', 'contacted', 'trial_booked', 'trial_completed'];
        $fromIdx = array_search($from, $order);
        $toIdx   = array_search($toStatus, $order);

        if ($fromIdx !== false && $toIdx !== false && $toIdx < $fromIdx) {
            return $actor->hasRole('admin');
        }

        return true;
    }

    public function transition(Lead $lead, string $toStatus, User $actor, array $extra = []): Lead
    {
        if (!$this->canTransition($lead, $toStatus, $actor)) {
            throw ValidationException::withMessages([
                'status' => "Cannot move lead from '{$lead->status}' to '{$toStatus}'.",
            ]);
        }

        if ($toStatus === 'lost') {
            if (empty($extra['lost_reason'])) {
                throw ValidationException::withMessages([
                    'lost_reason' => 'A reason is required when marking a lead as lost.',
                ]);
            }
            $lead->update(array_merge(['status' => 'lost'], $extra));
        } else {
            $lead->update(['status' => $toStatus]);
        }

        return $lead->refresh();
    }
}
