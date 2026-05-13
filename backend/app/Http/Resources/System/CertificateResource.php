<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'certificate_number' => $this->certificate_number,
            'type'               => $this->type,
            'title'              => $this->title,
            'description'        => $this->description,
            'issued_on'          => $this->issued_on?->toDateString(),
            'is_revoked'         => $this->isRevoked(),
            'revoked_at'         => $this->revoked_at?->toIso8601String(),
            'student'            => $this->whenLoaded('student', fn() => [
                'id'   => $this->student->id,
                'name' => $this->student->name,
            ]),
            'course'             => $this->whenLoaded('course', fn() => [
                'id'   => $this->course?->id,
                'name' => $this->course?->name,
            ]),
            'teacher'            => $this->whenLoaded('teacher', fn() => [
                'id'   => $this->teacher?->id,
                'name' => $this->teacher?->name,
            ]),
            'issued_by'          => $this->whenLoaded('issuedBy', fn() => $this->issuedBy?->name),
            'created_at'         => $this->created_at?->toIso8601String(),
        ];
    }
}
