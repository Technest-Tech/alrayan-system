<?php

namespace App\Console\Commands\System;

use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Services\System\PackageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Puts follow-on packages the engine opened on the wrong terms back on the student's deal.
 *
 * Before the fix, an empty package opened ahead of time (typically 1 hour, USD, while a lead was
 * still open) could be binned and later restored as-is when the real package ran out, so the
 * student's next package showed 1 hour in the wrong currency. This finds every pending package
 * nobody edited by hand whose hours, price or currency differ from the package before it, copies
 * that package's terms onto it, and rebuilds the student so lessons re-flow into the new size.
 * Paid packages and hand-edited (is_manual) packages are never touched.
 */
class RepairFollowOnPackages extends Command
{
    protected $signature = 'sys:repair-follow-on-packages
                            {--student= : Restrict to one student id}
                            {--dry-run  : Report what would change without writing}';

    protected $description = 'Copy the previous package\'s hours/price/currency onto mis-sized pending packages';

    public function handle(PackageService $engine): int
    {
        $dry  = (bool) $this->option('dry-run');
        $rows = [];

        DB::beginTransaction();
        try {
            $students = Student::query()
                ->when($this->option('student'), fn ($q, $id) => $q->whereKey($id))
                ->whereHas('packages', fn ($q) => $q->where('status', 'pending')->where('is_manual', false))
                ->orderBy('id')
                ->get();

            foreach ($students as $student) {
                $packages = StudentPackage::where('student_id', $student->id)
                    ->where('package_hours', '>', 0)
                    ->orderBy('package_number')
                    ->get();

                $previous = null;
                $changed  = false;
                foreach ($packages as $package) {
                    if ($previous && $package->status === 'pending' && ! $package->is_manual) {
                        $before = $this->terms($package);
                        $package->fill([
                            'package_hours'  => (int) $previous->package_hours,
                            'tariff_at_time' => (int) $previous->tariff_at_time,
                            'currency'       => $previous->currency ?: $package->currency,
                        ]);
                        if ($package->isDirty()) {
                            $package->save();
                            $changed = true;
                            $rows[]  = [$student->id, $student->name ?? '—', '#' . $package->package_number, $before, $this->terms($package)];
                        }
                    }
                    $previous = $package;
                }

                if ($changed) {
                    $engine->rebuild($student);
                }
            }

            $dry ? DB::rollBack() : DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Repair failed, nothing was written: ' . $e->getMessage());
            return self::FAILURE;
        }

        if (! $rows) {
            $this->info('No package needed repair.');
            return self::SUCCESS;
        }

        $this->table(['student', 'name', 'package', 'before', 'after'], $rows);
        $this->info(count($rows) . ' package(s) ' . ($dry ? 'would be repaired. Dry run — rolled back, nothing written.' : 'repaired. Committed.'));

        return self::SUCCESS;
    }

    private function terms(StudentPackage $p): string
    {
        return sprintf('%dh · %s %s', $p->package_hours, number_format($p->tariff_at_time / 100, 2), $p->currency);
    }
}
