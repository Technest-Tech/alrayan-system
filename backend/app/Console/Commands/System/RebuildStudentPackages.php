<?php

namespace App\Console\Commands\System;

use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Services\System\PackageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Re-runs the package engine for students so a change to how lessons are counted
 * reaches records created before it. Without this a student's figures only correct
 * themselves the next time someone happens to edit one of their lessons, which
 * leaves two students on the same deal showing different balances.
 */
class RebuildStudentPackages extends Command
{
    protected $signature = 'sys:rebuild-packages
                            {--student= : Restrict to one student id}
                            {--dry-run  : Report what would change without writing}';

    protected $description = "Rebuild student package allocations from their lessons";

    public function handle(PackageService $packages): int
    {
        $dry = (bool) $this->option('dry-run');

        $query = Student::query()->orderBy('id');
        if ($id = $this->option('student')) {
            $query->whereKey($id);
        }
        $students = $query->get();

        if ($students->isEmpty()) {
            $this->warn('No students matched.');
            return self::SUCCESS;
        }

        $this->info(($dry ? 'DRY RUN — ' : '') . "Rebuilding {$students->count()} student(s)…");

        $before = $this->consumedByStudent();
        $changed = [];

        DB::beginTransaction();
        try {
            foreach ($students as $student) {
                $packages->rebuild($student);
            }

            $after = $this->consumedByStudent();

            foreach ($students as $student) {
                $b = round((float) ($before[$student->id] ?? 0), 2);
                $a = round((float) ($after[$student->id] ?? 0), 2);
                if (abs($a - $b) >= 0.01) {
                    $changed[] = [$student->id, $student->name ?? '—', $b, $a, round($a - $b, 2)];
                }
            }

            if ($dry) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Rebuild failed, nothing was written: ' . $e->getMessage());
            return self::FAILURE;
        }

        if (! $changed) {
            $this->info('No student changed.');
            return self::SUCCESS;
        }

        $this->table(['student', 'name', 'hours before', 'hours after', 'delta'], $changed);
        $delta = round(array_sum(array_column($changed, 4)), 2);
        $this->info(count($changed) . " student(s) changed, {$delta}h net.");
        $this->line($dry ? 'Dry run — rolled back, nothing written.' : 'Committed.');

        return self::SUCCESS;
    }

    /** consumed hours per student, straight from the allocations. */
    private function consumedByStudent(): array
    {
        return StudentPackage::query()
            ->leftJoin('sys_lesson_package_allocations as a', 'a.package_id', '=', 'sys_student_packages.id')
            ->groupBy('sys_student_packages.student_id')
            ->selectRaw('sys_student_packages.student_id AS sid, COALESCE(SUM(a.hours), 0) AS consumed')
            ->pluck('consumed', 'sid')
            ->toArray();
    }
}
