<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sys_tasks')
            ->where('type', 'package_complete')
            ->orderBy('id')
            ->each(function ($task): void {
                $package = DB::table('sys_student_packages')->where('id', $task->related_id)->first();
                if (! $package) {
                    return;
                }

                $student = DB::table('sys_students')->where('id', $package->student_id)->first();

                $teacherId = DB::table('sys_lesson_package_allocations as allocation')
                    ->join('sys_lessons as lesson', 'lesson.id', '=', 'allocation.lesson_id')
                    ->where('allocation.package_id', $package->id)
                    ->whereNull('lesson.deleted_at')
                    ->orderByDesc('lesson.scheduled_at')
                    ->value('lesson.teacher_id');

                $teacherId ??= DB::table('sys_lessons')
                    ->where('package_id', $package->id)
                    ->whereNull('deleted_at')
                    ->orderByDesc('scheduled_at')
                    ->value('teacher_id');

                $teacherId ??= $student?->assigned_teacher_id;

                $teacherName = $teacherId
                    ? DB::table('sys_teachers')
                        ->join('users', 'users.id', '=', 'sys_teachers.user_id')
                        ->where('sys_teachers.id', $teacherId)
                        ->value('users.name')
                    : null;

                $payload = json_decode((string) $task->payload, true);
                $payload = is_array($payload) ? $payload : [];
                $payload['student_name'] = $student?->name;
                $payload['teacher_name'] = $teacherName;

                DB::table('sys_tasks')->where('id', $task->id)->update([
                    'student_id' => $student?->id,
                    'teacher_id' => $teacherId,
                    'payload'    => json_encode($payload),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        // This migration enriches existing task history and is intentionally non-destructive.
    }
};
