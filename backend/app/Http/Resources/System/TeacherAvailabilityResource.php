<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class TeacherAvailabilityResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'teacher_id'  => $this->teacher_id,
            'day_of_week' => $this->day_of_week,
            'start_time'  => $this->start_time,
            'end_time'    => $this->end_time,
            'timezone'    => $this->timezone,
        ];
    }
}
