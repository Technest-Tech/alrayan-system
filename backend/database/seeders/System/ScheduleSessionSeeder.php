<?php

namespace Database\Seeders\System;

use App\Models\System\SchedulePattern;
use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds realistic schedule patterns, sessions (past 14 days + today + next 14 days),
 * and session reports so the Schedule and Attendance pages have rich test data.
 *
 * Run standalone:  php artisan db:seed --class=Database\\Seeders\\System\\ScheduleSessionSeeder
 * Reset + re-run:  php artisan db:seed --class=Database\\Seeders\\System\\ScheduleSessionSeeder --force
 */
class ScheduleSessionSeeder extends Seeder
{
    // Quran session report templates
    private const COVERED_TEXTS = [
        'Recited Surah Al-Fatiha and first 10 ayat of Al-Baqarah. Corrected Makhaarij of ح and خ.',
        'Noorani Qaida chapters 3–4. Student mastered compound letters with good retention.',
        'Revised full Juzz Amma. Excellent recall — only minor Idgham errors to address.',
        'Focused on Qalqalah letters in Surah Al-Ikhlas and Al-Falaq. Clear improvement noted.',
        'Pages 12–15 of Al-Baqarah. Applied Madd rules correctly throughout the recitation.',
        'Recited Surah Al-Kahf pages 1–3 with Tajweed. Discussed rules of Waqf and Ibtida.',
        'Hifz revision of surahs Al-Mulk and Al-Waqiah. Strong performance, two errors corrected.',
        'Covered vowels and Tanwin from Noorani Qaida. Student is confident and progressing well.',
        'Revised memorised surahs from Juzz Tabarak. Consistent progress in pronunciation.',
        'Session on Tajweed rules: Ghunna, Ikhfa, and Iqlab. Student completed all exercises.',
    ];

    private const HOMEWORK_TEXTS = [
        'Revise pages 1–5 and memorise the next 5 ayat.',
        'Practice the Makhaarij exercises from the worksheet.',
        'Listen to Sheikh Sudais recitation of today\'s portion twice.',
        'Write out the Arabic letters studied today from memory.',
        'Memorise Surah Al-Asr and Al-Humazah before next session.',
        null, null, null,
    ];

    public function run(): void
    {
        // ── Wipe existing generated data ───────────────────────────────────────
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('sys_session_reports')->truncate();
        DB::table('sys_sessions')->truncate();
        DB::table('sys_schedule_patterns')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ── Load teachers & active/trial students ──────────────────────────────
        $teachers = Teacher::where('is_active', true)->get();
        $students = Student::whereIn('status', ['active', 'trial'])
            ->orderBy('id')
            ->get();

        if ($students->isEmpty() || $teachers->isEmpty()) {
            $this->command->warn('No active students or teachers found — run SystemDemoSeeder first.');
            return;
        }

        $today        = Carbon::today('UTC');
        $patternCount = 0;
        $sessionCount = 0;
        $reportCount  = 0;

        // Time slots (UTC) — spread throughout the day for variety
        $timeSlots = [
            '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
        ];

        // ── 1. Schedule patterns ───────────────────────────────────────────────
        // Each active/trial student gets two recurring weekly patterns on weekdays.
        foreach ($students as $idx => $student) {
            $teacher  = $teachers[$idx % $teachers->count()];
            $duration = $student->session_duration_min ?: [30, 45, 60][$idx % 3];

            // Two distinct weekdays per student (Mon–Fri only)
            $day1 = ($idx % 5) + 1;           // 1–5
            $day2 = (($idx + 2) % 5) + 1;     // 1–5, different from day1

            foreach ([$day1, $day2] as $k => $dayOfWeek) {
                $time = $timeSlots[($idx * 2 + $k) % count($timeSlots)];

                SchedulePattern::create([
                    'student_id'  => $student->id,
                    'teacher_id'  => $student->assigned_teacher_id ?? $teacher->id,
                    'day_of_week' => $dayOfWeek,
                    'start_time'  => $time . ':00',
                    'duration_min'=> $duration,
                    'timezone'    => 'UTC',
                    'valid_from'  => $today->copy()->subDays(30)->toDateString(),
                    'valid_to'    => null,
                ]);
                $patternCount++;
            }
        }

        // ── 2. Sessions ────────────────────────────────────────────────────────
        foreach ($students as $idx => $student) {
            $teacherId = $student->assigned_teacher_id ?? $teachers[$idx % $teachers->count()]->id;
            $duration  = $student->session_duration_min ?: [30, 45, 60][$idx % 3];
            $slotHour  = (int) explode(':', $timeSlots[$idx % count($timeSlots)])[0];

            $day1 = ($idx % 5) + 1;
            $day2 = (($idx + 2) % 5) + 1;
            $studentDays = [$day1, $day2];

            // ── Past 14 days ─────────────────────────────────────────────────
            for ($offset = 14; $offset >= 1; $offset--) {
                $date = $today->copy()->subDays($offset);

                // Only sessions on the student's two scheduled days
                if (! in_array($date->dayOfWeek, $studentDays)) {
                    continue;
                }

                $start  = $date->copy()->setHour($slotHour)->setMinute(0)->setSecond(0);
                $end    = $start->copy()->addMinutes($duration);
                $status = $this->pastStatus($idx, $offset);

                $session = Session::create([
                    'student_id'          => $student->id,
                    'teacher_id'          => $teacherId,
                    'scheduled_start'     => $start,
                    'scheduled_end'       => $end,
                    'duration_min'        => $duration,
                    'status'              => $status,
                    'cancelled_by'        => $status === 'cancelled'
                        ? ['student', 'teacher', 'admin'][($idx + $offset) % 3]
                        : null,
                    'cancellation_reason' => $status === 'cancelled' ? 'Schedule conflict' : null,
                    'attended_marked_at'  => $status === 'attended'
                        ? $end->copy()->addMinutes(5)
                        : null,
                    'zoom_join_url'       => 'https://zoom.us/j/' . fake()->numerify('###########'),
                ]);
                $sessionCount++;

                // Session report (60 % of attended past sessions)
                if ($status === 'attended' && ($idx + $offset) % 5 !== 0) {
                    $this->createReport($session->id, $teacherId, $student->id, $start->copy()->addHours(1), $idx);
                    $reportCount++;
                }
            }

            // ── Today ─────────────────────────────────────────────────────────
            $todayStart  = $today->copy()->setHour($slotHour)->setMinute(0)->setSecond(0);
            $todayEnd    = $todayStart->copy()->addMinutes($duration);
            $todayStatus = $this->todayStatus($idx);

            $todaySession = Session::create([
                'student_id'          => $student->id,
                'teacher_id'          => $teacherId,
                'scheduled_start'     => $todayStart,
                'scheduled_end'       => $todayEnd,
                'duration_min'        => $duration,
                'status'              => $todayStatus,
                'cancelled_by'        => $todayStatus === 'cancelled' ? 'admin' : null,
                'cancellation_reason' => $todayStatus === 'cancelled' ? 'Student request' : null,
                'attended_marked_at'  => $todayStatus === 'attended'
                    ? $todayEnd->copy()->addMinutes(3)
                    : null,
                'zoom_join_url'       => 'https://zoom.us/j/' . fake()->numerify('###########'),
            ]);
            $sessionCount++;

            // Report for half of today's attended sessions
            if ($todayStatus === 'attended' && $idx % 2 === 0) {
                $this->createReport($todaySession->id, $teacherId, $student->id, now(), $idx);
                $reportCount++;
            }

            // ── Next 14 days ──────────────────────────────────────────────────
            for ($offset = 1; $offset <= 14; $offset++) {
                $date = $today->copy()->addDays($offset);

                if (! in_array($date->dayOfWeek, $studentDays)) {
                    continue;
                }

                $start = $date->copy()->setHour($slotHour)->setMinute(0)->setSecond(0);
                $end   = $start->copy()->addMinutes($duration);

                Session::create([
                    'student_id'      => $student->id,
                    'teacher_id'      => $teacherId,
                    'scheduled_start' => $start,
                    'scheduled_end'   => $end,
                    'duration_min'    => $duration,
                    'status'          => 'scheduled',
                    'zoom_join_url'   => 'https://zoom.us/j/' . fake()->numerify('###########'),
                ]);
                $sessionCount++;
            }
        }

        $this->command->info(
            "ScheduleSessionSeeder: {$patternCount} patterns, {$sessionCount} sessions, {$reportCount} reports seeded."
        );
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    /** Past status — mostly attended, some absent, few cancelled */
    private function pastStatus(int $idx, int $daysAgo): string
    {
        $r = ($idx + $daysAgo) % 10;
        return match (true) {
            $r < 6  => 'attended',
            $r < 8  => 'absent',
            default => 'cancelled',
        };
    }

    /**
     * Today's status — deliberate spread so the attendance page shows
     * all status types at once for a realistic test scenario.
     */
    private function todayStatus(int $idx): string
    {
        return match ($idx % 8) {
            0, 1    => 'attended',      // 2/8 already marked attended
            2       => 'absent',        // 1/8 marked absent
            3       => 'cancelled',     // 1/8 cancelled
            4       => 'pending_substitute', // 1/8 needs substitute
            default => 'scheduled',     // 3/8 still pending — main work for the team
        };
    }

    private function createReport(
        int $sessionId, int $teacherId, int $studentId,
        Carbon $submittedAt, int $idx
    ): void {
        $performances = ['excellent', 'good', 'needs_improvement'];

        SessionReport::create([
            'session_id'         => $sessionId,
            'teacher_id'         => $teacherId,
            'student_id'         => $studentId,
            'covered_text'       => self::COVERED_TEXTS[$idx % count(self::COVERED_TEXTS)],
            'performance'        => $performances[$idx % 3],
            'homework_text'      => self::HOMEWORK_TEXTS[$idx % count(self::HOMEWORK_TEXTS)],
            'next_session_notes' => $idx % 4 === 0 ? 'Continue from last checkpoint next session.' : null,
            'submitted_at'       => $submittedAt,
        ]);
    }
}
