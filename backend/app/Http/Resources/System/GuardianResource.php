<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class GuardianResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'whatsapp'   => $this->whatsapp,
            'students'   => $this->whenLoaded('students', fn() =>
                $this->students->map(fn($s) => [
                    'id'     => $s->id,
                    'name'   => $s->name,
                    'status' => $s->status,
                ])
            ),
            'created_at' => $this->created_at,
        ];
    }
}
