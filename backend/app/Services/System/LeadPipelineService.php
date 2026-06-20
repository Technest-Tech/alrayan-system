<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LeadPipelineService
{
    /**
     * The open pipeline statuses a lead can move freely between (in any direction,
     * including staying on the same status — a no-op). `closed` is intentionally
     * excluded: it is terminal and only reached through the conversion/completion flow
     * (LeadToStudentConverter), which finalises the student's payment + package.
     */
    public const OPEN_STATUSES = [
        'new_lead', 'interested', 'waiting_for_trial', 'waiting_for_payment',
        'not_interested', 'lost',
    ];

    public function canTransition(Lead $lead, string $toStatus, User $actor): bool
    {
        // A converted (closed) lead is terminal — it can't be moved back through the pipeline.
        if ($lead->status === 'closed') {
            return false;
        }

        // `closed` is reached only through the conversion flow, never a direct status edit.
        if ($toStatus === 'closed') {
            return false;
        }

        // Otherwise any movement among the open statuses is permitted (free movement).
        return in_array($toStatus, self::OPEN_STATUSES, true);
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
