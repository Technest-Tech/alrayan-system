<?php

namespace Database\Seeders\System;

use App\Models\Course;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Services\System\StudentCreator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds 4 active students and connects each to an existing teacher (round-robin).
 * Idempotent: re-running skips students whose seed email already exists.
 */
class StudentsWithTeachersSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = Teacher::orderBy('id')->get();
        if ($teachers->isEmpty()) {
            $this->command?->warn('No teachers found — cannot connect students. Aborting.');
            return;
        }

        $courseId = Course::value('id'); // may be null; course is optional
        $creator  = app(StudentCreator::class);

        $roster = [
            ['name' => 'Yusuf Abdullah', 'country' => 'EG', 'timezone' => 'Africa/Cairo'],
            ['name' => 'Maryam Saleh',   'country' => 'SA', 'timezone' => 'Asia/Riyadh'],
            ['name' => 'Ibrahim Khan',   'country' => 'PK', 'timezone' => 'Asia/Karachi'],
            ['name' => 'Fatima Noor',    'country' => 'AE', 'timezone' => 'Asia/Dubai'],
        ];

        foreach ($roster as $i => $row) {
            $teacher = $teachers[$i % $teachers->count()];
            $email   = Str::slug($row['name']) . '@seed.alrayan.local';

            if (Student::withTrashed()->where('email', $email)->exists()) {
                $this->command?->info("• {$row['name']} already seeded — skipped.");
                continue;
            }

            $student = $creator->create([
                'name'                  => $row['name'],
                'email'                 => $email,
                'whatsapp'              => '+2010000000' . $i,
                'country'               => $row['country'],
                'timezone'              => $row['timezone'],
                'student_type'          => 'adult',
                'source'                => 'manual',
                'assigned_teacher_id'   => $teacher->id,
                'course_id'             => $courseId,
                'package_hours_default' => 8,
                'hourly_rate_minor'     => 10000,
                'currency'              => 'USD',
            ]);

            // StudentCreator provisions new students as 'trial'; make these connected ones active.
            $student->update(['status' => 'active', 'enrolled_at' => now()]);

            $this->command?->info("✓ {$row['name']} → teacher #{$teacher->id} ({$teacher->user?->name})");
        }
    }
}
