<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchedulePatternResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'student_id'   => $this->student_id,
            'teacher_id'   => $this->teacher_id,
            'day_of_week'  => $this->day_of_week,
            'start_time'   => $this->start_time,
            'duration_min' => $this->duration_min,
            'timezone'     => $this->timezone,
            'valid_from'   => $this->valid_from?->toDateString(),
            'valid_to'     => $this->valid_to?->toDateString(),
            'teacher'      => $this->whenLoaded('teacher', fn () => [
                'id'   => $this->teacher->id,
                'name' => $this->teacher->user?->name,
            ]),
        ];
    }
}
