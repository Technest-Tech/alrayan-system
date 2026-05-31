<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentNoteResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'student_id'     => $this->student_id,
            'author_user_id' => $this->author_user_id,
            'author_name'    => optional($this->author)->name,
            'author_role'    => optional($this->author)->role,
            'body'           => $this->body,
            'note_type'      => $this->note_type,
            'pinned'         => (bool) $this->pinned,
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
            'deleted_at'     => $this->deleted_at,
        ];
    }
}
