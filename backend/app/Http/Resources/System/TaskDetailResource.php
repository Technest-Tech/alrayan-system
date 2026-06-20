<?php

namespace App\Http\Resources\System;

use App\Models\System\Task;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'type'             => $this->type,
            'actionable'       => Task::isActionable($this->type),
            'status'           => $this->status,
            'priority'         => $this->priority,
            'title'            => $this->title,
            'body'             => $this->body,
            'payload'          => $this->payload,
            'related_type'     => $this->related_type,
            'related_id'       => $this->related_id,
            'student_id'       => $this->student_id,
            'student_name'     => $this->whenLoaded('student', fn () => $this->student?->name),
            'teacher_id'       => $this->teacher_id,
            'teacher_name'     => $this->whenLoaded('teacher', fn () => $this->teacher?->user?->name),
            'assignee_role'    => $this->assignee_role,
            'assignee_user_id' => $this->assignee_user_id,
            'assignee_name'    => $this->whenLoaded('assignee', fn () => $this->assignee?->name),
            'created_by'       => $this->created_by,
            'created_by_name'  => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'due_at'           => $this->due_at?->toISOString(),
            'decision'         => $this->decision,
            'decided_by'       => $this->decided_by,
            'decided_by_name'  => $this->whenLoaded('decider', fn () => $this->decider?->name),
            'decided_at'       => $this->decided_at?->toISOString(),
            'decision_notes'   => $this->decision_notes,
            'notes'            => $this->whenLoaded('notes', fn () =>
                $this->notes->map(fn ($n) => [
                    'id'         => $n->id,
                    'body'       => $n->body,
                    'actor_name' => $n->actor?->name,
                    'created_at' => $n->created_at?->toISOString(),
                ])->values()
            ),
            'activities'       => $this->whenLoaded('activities', fn () =>
                $this->activities->map(fn ($a) => [
                    'id'          => $a->id,
                    'event'       => $a->event,
                    'description' => $a->description,
                    'properties'  => $a->properties,
                    'causer_name' => $a->causer?->name,
                    'created_at'  => $a->created_at?->toISOString(),
                ])->values()
            ),
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),
        ];
    }
}
