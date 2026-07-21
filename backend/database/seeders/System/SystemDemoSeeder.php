<?php

namespace Database\Seeders\System;

use App\Models\Course;
use App\Models\System\Student;
use App\Models\System\StudentFamilyLink;
use App\Models\System\StudentNote;
use App\Models\System\StudentTimelineEntry;
use App\Models\System\Teacher;
use App\Models\System\TeacherAvailability;
use App\Models\System\TeacherLeave;
use App\Models\System\TeacherNote;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemDemoSeeder extends Seeder
{
    public function run(): void
    {
        $courses = Course::all();
        if ($courses->isEmpty()) {
            $this->command->warn('No courses found — run CourseSeeder first.');
            return;
        }

        // Create 4 demo teachers
        $teacherNames = ['Sheikh Hassan', 'Sheikh Omar', 'Sheikh Aisha', 'Sheikh Mohammed'];
        $teachers = [];

        foreach ($teacherNames as $i => $name) {
            $user = User::firstOrCreate(
                ['email' => 'teacher' . ($i + 1) . '@alrayan-academy.com'],
                [
                    'name'      => $name,
                    'password'  => bcrypt('password'),
                    'role'      => 'teacher',
                    'is_active' => true,
                    'last_login_at' => now(),
                ]
            );
            $user->syncRoles(['teacher']);

            $teacher = Teacher::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'qualifications'        => 'Hafiz Quran, Ijazah in Hafs an Asim',
                    'teachable_course_ids'  => $courses->take(2)->pluck('id')->toArray(),
                    'payment_method'        => 'vodafone_cash',
                    'payment_account_details' => '01099999' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'per_minute_rate_30'    => 240 + ($i * 20),
                    'per_minute_rate_45'    => 240 + ($i * 20),
                    'per_minute_rate_60'    => 300 + ($i * 20),
                    'is_active'             => $i < 3,
                ]
            );

            // Weekday availability
            foreach (range(1, 5) as $day) {
                TeacherAvailability::firstOrCreate([
                    'teacher_id'  => $teacher->id,
                    'day_of_week' => $day,
                    'start_time'  => '14:00:00',
                    'end_time'    => '22:00:00',
                    'timezone'    => 'Africa/Cairo',
                ]);
            }

            $teachers[] = $teacher;
        }

        // Create 25 demo students
        $statuses = array_merge(
            array_fill(0, 15, 'active'),
            array_fill(0, 4, 'trial'),
            array_fill(0, 2, 'paused'),
            array_fill(0, 2, 'suspended'),
            array_fill(0, 2, 'cancelled')
        );

        $countries = ['US', 'GB', 'CA', 'EG', 'SA', 'AE', 'DE', 'FR'];
        $students = [];
        $adminId  = User::where('role', 'admin')->value('id') ?? User::min('id');

        foreach ($statuses as $i => $status) {
            $course  = $courses->get($i % $courses->count());
            $teacher = $teachers[$i % count($teachers)];

            // Use the factory so students are created against the current (unified
            // identity) schema and each gets a linked `users` row via withUser().
            $student = Student::factory()->withUser()->create([
                'country'              => $countries[$i % count($countries)],
                'timezone'             => 'America/New_York',
                'student_type'         => $i % 5 === 0 ? 'child' : 'adult',
                'course_id'            => $course->id,
                'assigned_teacher_id'  => $teacher->id,
                'sessions_per_month'   => fake()->randomElement([4, 8, 12]),
                'session_duration_min' => fake()->randomElement([30, 45, 60]),
                'currency'             => fake()->randomElement(['USD', 'GBP']),
                'monthly_price_minor'  => fake()->randomElement([2500, 3000, 5000, 6000]),
                'status'               => $status,
                'source'               => 'manual',
                'enrolled_at'          => $status === 'active' ? now()->subDays(rand(10, 120)) : null,
                'paused_at'            => $status === 'paused' ? now()->subDays(rand(1, 30)) : null,
                'suspended_at'         => $status === 'suspended' ? now()->subDays(rand(1, 30)) : null,
                'cancelled_at'         => $status === 'cancelled' ? now()->subDays(rand(1, 60)) : null,
                'cancellation_reason'  => $status === 'cancelled' ? 'Personal' : null,
            ]);

            StudentTimelineEntry::create([
                'student_id'    => $student->id,
                'actor_user_id' => null,
                'event_type'    => 'created',
                'payload'       => ['source' => 'manual'],
            ]);

            StudentNote::create([
                'student_id'     => $student->id,
                'author_user_id' => $adminId,
                'body'           => 'Initial note for ' . $student->name,
            ]);

            $students[] = $student;
        }

        // Create 3 family-link pairs
        $pairs = [[$students[0], $students[1]], [$students[2], $students[3]], [$students[4], $students[5]]];
        foreach ($pairs as [$a, $b]) {
            if (!StudentFamilyLink::where('student_id', $a->id)->where('sibling_student_id', $b->id)->exists()) {
                StudentFamilyLink::create(['student_id' => $a->id, 'sibling_student_id' => $b->id, 'discount_pct' => 20]);
                StudentFamilyLink::create(['student_id' => $b->id, 'sibling_student_id' => $a->id, 'discount_pct' => 20]);
            }
        }

        // Teacher notes
        foreach ($teachers as $teacher) {
            TeacherNote::firstOrCreate([
                'teacher_id'     => $teacher->id,
                'author_user_id' => $adminId,
            ], [
                'body' => 'Excellent teacher, very punctual.',
            ]);
        }

        // Pending leave for teacher[0]
        TeacherLeave::firstOrCreate([
            'teacher_id' => $teachers[0]->id,
            'start_date' => now()->addWeek()->startOfWeek(),
        ], [
            'end_date' => now()->addWeek()->endOfWeek(),
            'reason'   => 'Family travel',
            'status'   => 'pending',
        ]);

        $this->command->info('SystemDemoSeeder: 4 teachers, 25 students, 3 family links seeded.');
    }
}
