<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Teacher\AvailabilityRequest;
use App\Http\Resources\System\TeacherAvailabilityResource;
use App\Models\System\Teacher;
use App\Models\System\TeacherAvailability;
use App\Services\System\AuditLog;
use Illuminate\Support\Facades\DB;

class TeacherAvailabilityController extends Controller
{
    public function update(AvailabilityRequest $request, Teacher $teacher): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('update', $teacher);

        DB::transaction(function () use ($request, $teacher) {
            $teacher->availability()->delete();

            foreach ($request->availability as $slot) {
                TeacherAvailability::create([
                    'teacher_id'  => $teacher->id,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time'  => $slot['start_time'],
                    'end_time'    => $slot['end_time'],
                    'timezone'    => $request->timezone,
                ]);
            }

            AuditLog::record('teacher.availability_updated', $teacher, ['slots' => count($request->availability)]);
        });

        return TeacherAvailabilityResource::collection($teacher->availability()->get());
    }
}
