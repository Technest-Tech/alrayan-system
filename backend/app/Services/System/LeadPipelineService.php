<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LeadPipelineService
{
    // closed is terminal — only reachable via LeadToStudentConverter
    private const TRANSITIONS = [
        'new_lead'          => ['interested', 'waiting_for_trial', 'not_interested', 'lost'],
        'interested'        => ['waiting_for_trial', 'waiting_for_payment', 'not_interested', 'lost'],
        'waiting_for_trial' => ['waiting_for_payment', 'interested', 'not_interested', 'lost'],
        'waiting_for_payment' => ['interested', 'waiting_for_trial', 'not_interested', 'lost'],
        'closed'            => [],  // terminal — only via LeadToStudentConverter
        'not_interested'    => ['interested', 'new_lead'],  // reopen — admin only
        'lost'              => ['interested', 'new_lead'],  // reopen — admin only
    ];

    public function canTransition(Lead $lead, string $toStatus, User $actor): bool
    {
        $from = $lead->status;

        if ($toStatus === 'closed') return false;  // must use convert flow

        $allowed = self::TRANSITIONS[$from] ?? [];

        if (!in_array($toStatus, $allowed, true)) {
            return false;
        }

        // Reopening from terminal/negative states requires admin
        $order = ['new_lead', 'interested', 'waiting_for_trial', 'waiting_for_payment'];
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
        } elseif ($toStatus === 'not_interested') {
            $lead->update(array_merge(['status' => 'not_interested'], $extra));
        } else {
            $lead->update(['status' => $toStatus]);
        }

        return $lead->refresh();
    }
}
