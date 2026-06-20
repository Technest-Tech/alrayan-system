<?php

namespace Database\Seeders\System;

use App\Models\System\Guardian;
use App\Models\System\Lesson;
use App\Models\System\LessonEvaluation;
use App\Models\System\LessonSchedule;
use App\Models\System\LessonScheduleSlot;
use App\Models\System\LessonSubject;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\UserEmail;
use App\Models\User;
use App\Services\System\LessonScheduleService;
use App\Services\System\PackageService;
use App\Services\System\TaskGenerator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wipes existing teachers/students (and their operational data) and seeds a
 * realistic demo: 2 teachers, 4 students, with lessons/packages spread across
 * past creation dates so the consumption engine (splits, completion, freeze)
 * can be exercised end-to-end.
 *
 *   php artisan db:seed --class="Database\\Seeders\\System\\CalendarDemoSeeder"
 */
class CalendarDemoSeeder extends Seeder
{
    private PackageService $packages;

    /** @var array<string,LessonSubject> */
    private array $subjects = [];
    /** @var array<string,LessonEvaluation> */
    private array $evals = [];

    private const QURAN = [
        'Surah Al-Fatihah — full revision', 'Surah Al-Baqarah, ayah 1–10', 'Surah Al-Baqarah, ayah 11–25',
        'Surah Al-Baqarah, ayah 26–40', 'Surah Aal-E-Imran, ayah 1–12', 'Juz Amma — Surah An-Naba',
        'Juz Amma — Surah An-Nazi’at', 'Surah Al-Mulk, ayah 1–15', 'Surah Ya-Sin, ayah 1–20',
        'Surah Al-Kahf, ayah 1–10', 'Surah Ar-Rahman — memorization', 'Surah Al-Waqi’ah, ayah 1–20',
    ];
    private const ARABIC = [
        'Alphabet & pronunciation', 'Harakat & basic reading', 'Forming simple words', 'Reading short sentences',
        'Nouns, gender & number', 'Present-tense verbs', 'Building everyday vocabulary', 'Reading a short story',
        'Dialogue practice', 'Listening comprehension', 'Past-tense verbs', 'Writing short paragraphs',
    ];
    private const TAJWID = [
        'Rules of Noon Sakinah & Tanween', 'Idgham, Iqlab & Ikhfa', 'The Madd letters', 'Qalqalah letters',
        'Heavy (tafkheem) & light (tarqeeq) letters', 'Rules of Meem Sakinah',
    ];
    private const EVAL_ROTATION = ['Excellent', 'Very Good', 'Good', 'Excellent', 'Good'];

    public function run(): void
    {
        $this->packages = app(PackageService::class);

        $this->clearExisting();
        $this->seedCatalog();

        $ahmed = $this->makeTeacher('Ahmed Abdo', 'ahmed.abdo@alrayan.test');
        $sara  = $this->makeTeacher('Sara Othman', 'sara.othman@alrayan.test');

        $this->seedLayla($ahmed);   // many packages, a split, paid + pending-awaiting-payment + current
        $this->seedYusuf($ahmed);   // one full paid package + a partially-filled one
        $this->seedMariam($sara);   // child + guardian, small 4h packages with frequent splits
        $this->seedOmar($sara);     // low-fill package + a recurring schedule (future purple lessons)

        $this->command?->info('✓ Seeded 2 teachers, 4 students with lessons, packages & a recurring schedule.');
    }

    /* ──────────────────────────  CLEAR  ────────────────────────── */

    private function clearExisting(): void
    {
        $userIds = User::whereIn('role', ['student', 'teacher', 'parent'])->pluck('id')->all();

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'sys_lesson_package_allocations', 'sys_lessons', 'sys_student_packages',
            'sys_lesson_schedule_slots', 'sys_lesson_schedules',
            'sys_session_reports', 'sys_makeup_requests', 'sys_sessions', 'sys_schedule_patterns',
            'sys_quality_reviews', 'sys_monthly_reports',
            'sys_invoice_lines', 'sys_invoices', 'sys_payments', 'sys_paymob_payment_links', 'sys_xpay_payment_links',
            'sys_payroll_adjustments', 'sys_payrolls', 'sys_wallet_transactions', 'sys_certificates',
            'sys_student_timeline', 'sys_student_notes', 'sys_teacher_notes', 'sys_student_family_links',
            'sys_teacher_availability', 'sys_teacher_leaves',
            'sys_tasks', 'sys_task_notes', 'sys_notifications',
            'sys_lead_follow_ups', 'sys_leads',
            'sys_students', 'sys_teachers', 'sys_guardians',
        ];
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        if ($userIds) {
            DB::table('sys_user_emails')->whereIn('user_id', $userIds)->delete();
            DB::table('sys_user_phones')->whereIn('user_id', $userIds)->delete();
            DB::table('model_has_roles')->whereIn('model_id', $userIds)->where('model_type', User::class)->delete();
            DB::table('model_has_permissions')->whereIn('model_id', $userIds)->where('model_type', User::class)->delete();
            DB::table('personal_access_tokens')->whereIn('tokenable_id', $userIds)->where('tokenable_type', User::class)->delete();
            DB::table('users')->whereIn('id', $userIds)->delete();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /* ──────────────────────────  CATALOG  ──────────────────────── */

    private function seedCatalog(): void
    {
        $subjectDefs = [
            ['name' => 'Quran', 'fields' => [
                ['key' => 'surah',     'label' => 'Surah',     'type' => 'text'],
                ['key' => 'from_ayah', 'label' => 'From Ayah', 'type' => 'number'],
                ['key' => 'to_ayah',   'label' => 'To Ayah',   'type' => 'number'],
            ]],
            ['name' => 'Tajwid',          'fields' => null],
            ['name' => 'Arabic',          'fields' => null],
            ['name' => 'Islamic Studies', 'fields' => null],
        ];
        foreach ($subjectDefs as $i => $d) {
            $this->subjects[$d['name']] = LessonSubject::firstOrCreate(
                ['name' => $d['name']],
                ['fields' => $d['fields'], 'sort_order' => $i + 1],
            );
        }

        foreach (['Excellent', 'Very Good', 'Good', 'Needs Improvement'] as $i => $label) {
            $this->evals[$label] = LessonEvaluation::firstOrCreate(['label' => $label], ['sort_order' => $i + 1]);
        }
    }

    /* ──────────────────────────  PEOPLE  ───────────────────────── */

    private function makeTeacher(string $name, string $email): Teacher
    {
        $user = User::factory()->create([
            'name'      => $name,
            'email'     => $email,
            'role'      => 'teacher',
            'status'    => 'active',
            'is_active' => true,
        ]);
        UserEmail::create(['user_id' => $user->id, 'email' => $email, 'is_primary' => true]);

        return Teacher::factory()->create(['user_id' => $user->id]);
    }

    private function makeStudent(string $name, string $email, Teacher $teacher, int $packageHours, int $rateMinor, ?Guardian $guardian = null): Student
    {
        return Student::factory()->withUser()->create([
            'name'                  => $name,
            'email'                 => $email,
            'assigned_teacher_id'   => $teacher->id,
            'package_hours_default' => $packageHours,
            'hourly_rate_minor'     => $rateMinor,
            'currency'              => 'USD',
            'student_type'          => $guardian ? 'child' : 'adult',
            'guardian_id'           => $guardian?->id,
        ]);
    }

    /* ──────────────────────────  LESSONS  ──────────────────────── */

    private function makeLesson(Student $s, Teacher $t, Carbon $when, int $dur, string $status, string $subject, ?string $content, int $evalIdx = 0, ?string $notes = null, ?string $homework = null): void
    {
        $pkg = $this->packages->resolvePackageForLesson($s); // placeholder FK; rebuild() reassigns
        $createdAt = $when->isFuture() ? Carbon::now()->subDays(3) : $when->copy()->subHours(2);

        Lesson::create([
            'package_id'       => $pkg->id,
            'teacher_id'       => $t->id,
            'student_id'       => $s->id,
            'subject_id'       => $this->subjects[$subject]->id ?? null,
            'evaluation_id'    => $status === 'attended' ? $this->evals[self::EVAL_ROTATION[$evalIdx % count(self::EVAL_ROTATION)]]->id : null,
            'scheduled_at'     => $when,
            'duration_minutes' => $dur,
            'status'           => $status,
            'content'          => $content,
            'notes'            => $notes,
            'homework'         => $homework,
            'created_at'       => $createdAt,
            'updated_at'       => $createdAt,
        ]);
    }

    /** After lessons exist: rebuild, then mark older full packages paid and raise a payment task for the latest full-but-unpaid one. */
    private function finalizeStudent(Student $student): void
    {
        $this->packages->rebuild($student);

        $pkgs = $student->packages()->withoutTrashed()->orderBy('package_number')->get();
        $full = $pkgs->filter(fn ($p) => $p->package_hours > 0 && $p->consumed_hours >= $p->package_hours - 0.001)->values();

        // Older completed packages are paid; the most recent completed one stays pending (awaiting payment).
        for ($i = 0; $i < max(0, $full->count() - 1); $i++) {
            $full[$i]->update(['status' => 'paid', 'paid_at' => Carbon::now()->subWeeks(($full->count() - $i) * 3)]);
        }
        if ($full->count() && $full->last()->status === 'pending') {
            app(TaskGenerator::class)->forPackageComplete($full->last()->fresh());
        }
    }

    /* ──────────────────────────  STUDENTS  ─────────────────────── */

    private function seedLayla(Teacher $t): void
    {
        $s = $this->makeStudent('Layla Krasniqi', 'layla.k@alrayan.test', $t, 8, 1200);
        $start = Carbon::now()->subWeeks(20)->startOfWeek()->addDays(2)->setTime(16, 0); // Tue 16:00

        // First lesson is a free trial (non-consuming → shows 0.0).
        $this->makeLesson($s, $t, $start->copy(), 60, 'trial', 'Quran', 'Trial lesson — level assessment');

        for ($i = 1; $i <= 18; $i++) {
            $when = $start->copy()->addWeeks($i);
            // 1.5h lessons at weeks 3 & 11 push cumulative off whole-hours → boundary splits.
            $dur     = in_array($i, [3, 11], true) ? 90 : 60;
            $subject = $i % 3 === 0 ? 'Tajwid' : 'Quran';
            $bank    = $subject === 'Tajwid' ? self::TAJWID : self::QURAN;
            $this->makeLesson($s, $t, $when, $dur, 'attended', $subject, $bank[$i % count($bank)], $i, 'Good engagement throughout.', 'Revise the new portion.');
        }
        // Two upcoming lessons.
        $this->makeLesson($s, $t, $start->copy()->addWeeks(19), 60, 'scheduled', 'Quran', null);
        $this->makeLesson($s, $t, $start->copy()->addWeeks(20), 60, 'scheduled', 'Quran', null);

        $this->finalizeStudent($s);
    }

    private function seedYusuf(Teacher $t): void
    {
        $s = $this->makeStudent('Yusuf Rahman', 'yusuf.r@alrayan.test', $t, 10, 1500);
        $start = Carbon::now()->subWeeks(14)->startOfWeek()->addDays(4)->setTime(18, 30); // Thu 18:30

        for ($i = 0; $i < 11; $i++) {
            $when = $start->copy()->addWeeks($i);
            $this->makeLesson($s, $t, $when, 60, 'attended', 'Arabic', self::ARABIC[$i % count(self::ARABIC)], $i, null, 'Practice the dialogue.');
        }
        // A billed no-show (paid_absence consumes) and a recent upcoming lesson.
        $this->makeLesson($s, $t, $start->copy()->addWeeks(11), 60, 'paid_absence', 'Arabic', null, 0, 'Late cancellation — billed.');
        $this->makeLesson($s, $t, $start->copy()->addWeeks(13), 60, 'scheduled', 'Arabic', null);

        $this->finalizeStudent($s);
    }

    private function seedMariam(Teacher $t): void
    {
        $guardian = Guardian::factory()->withUser()->create(['name' => 'Khalid Saleh']);
        $s = $this->makeStudent('Mariam Saleh', 'mariam.s@alrayan.test', $t, 4, 1000, $guardian);
        $start = Carbon::now()->subWeeks(16)->startOfWeek()->addDays(1)->setTime(15, 0); // Mon 15:00

        $this->makeLesson($s, $t, $start->copy(), 60, 'trial', 'Quran', 'Trial lesson — getting to know the student');

        // Mixed 30/60/90-min lessons against tiny 4h packages → frequent boundary splits.
        $durations = [60, 90, 30, 60, 90, 60, 30, 90, 60, 60];
        for ($i = 0; $i < count($durations); $i++) {
            $when = $start->copy()->addWeeks($i + 1);
            $this->makeLesson($s, $t, $when, $durations[$i], 'attended', 'Quran', self::QURAN[$i % count(self::QURAN)], $i, 'Bright and attentive.', 'Memorize the new ayat.');
        }
        // A teacher-cancelled session (non-consuming) and an upcoming lesson.
        $this->makeLesson($s, $t, $start->copy()->addWeeks(11), 60, 'cancelled_by_teacher', 'Quran', null, 0, 'Teacher unavailable — to be rescheduled.');
        $this->makeLesson($s, $t, $start->copy()->addWeeks(12), 60, 'scheduled', 'Quran', null);

        $this->finalizeStudent($s);
    }

    private function seedOmar(Teacher $t): void
    {
        $s = $this->makeStudent('Omar Haddad', 'omar.h@alrayan.test', $t, 12, 2000);
        $start = Carbon::now()->subWeeks(8)->startOfWeek()->addDays(3)->setTime(19, 0); // Wed 19:00

        for ($i = 0; $i < 6; $i++) {
            $when = $start->copy()->addWeeks($i);
            $this->makeLesson($s, $t, $when, 60, 'attended', 'Islamic Studies', 'Seerah & manners — session ' . ($i + 1), $i, null, null);
        }
        // A student no-show (absent, non-consuming) and a billed student cancellation (consuming).
        $this->makeLesson($s, $t, $start->copy()->addWeeks(6), 60, 'absent', 'Islamic Studies', null, 0, 'No-show, not billed.');
        $this->makeLesson($s, $t, $start->copy()->addWeeks(7), 60, 'cancelled_by_student', 'Islamic Studies', null, 0, 'Student cancelled — billed.');

        $this->finalizeStudent($s);

        // A recurring weekly schedule → future "scheduled" occurrences (purple on the calendar).
        $schedule = LessonSchedule::create([
            'teacher_id' => $t->id,
            'student_id' => $s->id,
            'subject_id' => $this->subjects['Quran']->id,
            'recurrence' => 'weekly',
            'start_date' => Carbon::now()->next(Carbon::WEDNESDAY)->toDateString(),
            'is_active'  => true,
        ]);
        LessonScheduleSlot::create([
            'schedule_id'      => $schedule->id,
            'day_of_week'      => 3, // Wednesday
            'start_time'       => '19:00',
            'duration_minutes' => 60,
        ]);
        app(LessonScheduleService::class)->generateLessons($schedule);
    }
}
