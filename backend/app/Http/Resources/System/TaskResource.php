<?php

namespace App\Http\Resources\System;

use App\Models\System\Task;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
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
            'due_at'           => $this->due_at?->toISOString(),
            'decision'         => $this->decision,
            'decided_at'       => $this->decided_at?->toISOString(),
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),
        ];
    }
}
