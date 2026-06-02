<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'student_id'               => $this->student_id,
            'teacher_id'               => $this->teacher_id,
            'schedule_pattern_id'      => $this->schedule_pattern_id,
            'original_session_id'      => $this->original_session_id,
            'scheduled_start'          => $this->scheduled_start?->toIso8601String(),
            'scheduled_end'            => $this->scheduled_end?->toIso8601String(),
            'duration_min'             => $this->duration_min,
            'status'                   => $this->status,
            'cancelled_by'             => $this->cancelled_by,
            'cancellation_reason'      => $this->cancellation_reason,
            'apology_received'         => (bool) $this->apology_received,
            'apology_at'               => $this->apology_at?->toIso8601String(),
            'counts_against_quota'     => $this->counts_against_quota,
            'quota_impact'             => $this->quota_impact,
            'zoom_meeting_id'          => $this->zoom_meeting_id,
            'zoom_join_url'            => $this->zoom_join_url,
            'attended_marked_at'       => $this->attended_marked_at?->toIso8601String(),
            'report_overdue_at'        => $this->report_overdue_at?->toIso8601String(),
            'has_report'               => $this->when(isset($this->report), fn () => $this->report !== null),
            'student'                  => $this->whenLoaded('student', fn () => [
                'id'      => $this->student->id,
                'name'    => $this->student->name,
                'timezone'=> $this->student->timezone,
                'status'  => $this->student->status,
            ]),
            'teacher'                  => $this->whenLoaded('teacher', fn () => [
                'id'   => $this->teacher->id,
                'name' => $this->teacher->user?->name,
            ]),
            'report'                   => $this->whenLoaded('report', fn () =>
                $this->report ? new SessionReportResource($this->report) : null
            ),
        ];
    }
}
