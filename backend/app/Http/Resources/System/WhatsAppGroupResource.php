<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class WhatsAppGroupResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                => $this->id,
            'type'              => $this->type,
            'invite_link'       => $this->invite_link,
            'status'            => $this->status,
            'external_group_id' => $this->external_group_id,
            'linked_student_id' => $this->linked_student_id,
            'linked_student'    => $this->whenLoaded('linkedStudent', fn() => [
                'id'   => $this->linkedStudent->id,
                'name' => $this->linkedStudent->name,
            ]),
            'linked_teacher_id' => $this->linked_teacher_id,
            'linked_teacher'    => $this->whenLoaded('linkedTeacher', fn() => [
                'id'   => $this->linkedTeacher->id,
                'name' => $this->linkedTeacher->user?->name,
            ]),
            'created_at'        => $this->created_at?->toISOString(),
        ];
    }
}
