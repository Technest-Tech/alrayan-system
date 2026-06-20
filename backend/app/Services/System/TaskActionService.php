<?php

namespace App\Services\System;

use App\Models\System\Lesson;
use App\Models\System\Payroll;
use App\Models\System\PayrollAdjustment;
use App\Models\System\Task;
use App\Models\System\Teacher;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskActionService
{
    public function __construct(
        private PayrollCalculator $payrollCalculator,
        private PackageService $packages,
    ) {}

    /**
     * Approve an actionable task: apply its real side-effect, then record the
     * decision and mark the task done.
     */
    public function approve(Task $task, User $actor, ?string $notes = null): Task
    {
        $this->assertActionable($task);

        return DB::transaction(function () use ($task, $actor, $notes) {
            match ($task->type) {
                'late_lesson_deduction' => $this->applyLateLessonDeduction($task, $actor),
                'absent_paid_approval'  => $this->approveAbsentPaid($task),
                // Other actionable types (free_lesson_approval, teacher_referral_bonus,
                // review_progress_report) currently only record the decision.
                default => null,
            };

            return $this->recordDecision($task, $actor, 'approved', $notes);
        });
    }

    /** Reject an actionable task: no side-effect, just record the decision. */
    public function reject(Task $task, User $actor, ?string $notes = null): Task
    {
        $this->assertActionable($task);

        return $this->recordDecision($task, $actor, 'rejected', $notes);
    }

    private function assertActionable(Task $task): void
    {
        if (!Task::isActionable($task->type)) {
            throw ValidationException::withMessages([
                'type' => "Task type '{$task->type}' cannot be approved or rejected.",
            ]);
        }

        if ($task->decision !== null) {
            throw ValidationException::withMessages([
                'decision' => 'This task has already been decided.',
            ]);
        }
    }

    private function recordDecision(Task $task, User $actor, string $decision, ?string $notes): Task
    {
        $task->update([
            'decision'       => $decision,
            'decided_by'     => $actor->id,
            'decided_at'     => now(),
            'decision_notes' => $notes,
            'status'         => 'done',
        ]);

        return $task->refresh();
    }

    /**
     * Post a late-arrival deduction onto the teacher's payroll for the lesson's
     * month, creating that payroll if it does not exist yet.
     */
    private function applyLateLessonDeduction(Task $task, User $actor): void
    {
        $payload = $task->payload ?? [];
        $amount  = (int) ($payload['amount_minor'] ?? 0);

        if (!$task->teacher_id || $amount <= 0) {
            throw ValidationException::withMessages([
                'payload' => 'A teacher and a positive deduction amount are required.',
            ]);
        }

        $teacher = Teacher::findOrFail($task->teacher_id);
        $when    = isset($payload['scheduled_at']) ? Carbon::parse($payload['scheduled_at']) : now();
        $payroll = $this->resolvePayroll($teacher, $when);

        PayrollAdjustment::create([
            'payroll_id'       => $payroll->id,
            'type'             => 'deduction',
            'category'         => 'late_arrival',
            'amount_minor'     => $amount,
            'reason'           => $payload['reason'] ?? "Late lesson deduction (task #{$task->id})",
            'added_by_user_id' => $actor->id,
        ]);

        $payroll->recomputeTotals();
    }

    /**
     * Find the teacher's payroll for the given month, creating a fresh pending
     * one (with base salary computed from attended sessions) if none exists.
     */
    private function resolvePayroll(Teacher $teacher, Carbon $when): Payroll
    {
        $existing = Payroll::where('teacher_id', $teacher->id)
            ->where('period_year', $when->year)
            ->where('period_month', $when->month)
            ->first();

        if ($existing) {
            return $existing;
        }

        $start = $when->copy()->startOfMonth()->utc();
        $end   = $start->copy()->endOfMonth()->addDay()->startOfDay();
        $comp  = $this->payrollCalculator->calculate($teacher, $start, $end);

        return Payroll::create([
            'teacher_id'            => $teacher->id,
            'period_year'           => $when->year,
            'period_month'          => $when->month,
            'total_sessions'        => $comp->totalSessions,
            'total_minutes'         => $comp->totalMinutes,
            'breakdown_by_duration' => $comp->breakdownByDuration,
            'base_salary_minor'     => $comp->baseSalaryMinor,
            'bonuses_minor'         => 0,
            'deductions_minor'      => 0,
            'net_salary_minor'      => $comp->baseSalaryMinor,
            'status'                => 'pending',
            'snapshot'              => $comp->rateSnapshot,
        ]);
    }

    /** Mark the referenced lesson as a paid absence (billable). */
    private function approveAbsentPaid(Task $task): void
    {
        $payload  = $task->payload ?? [];
        $lessonId = $payload['lesson_id'] ?? null;

        if (!$lessonId) {
            throw ValidationException::withMessages([
                'payload' => 'A lesson reference is required to approve a paid absence.',
            ]);
        }

        $lesson = Lesson::findOrFail($lessonId);
        $lesson->update(['status' => 'paid_absence']);
        if ($lesson->student) {
            $this->packages->rebuild($lesson->student);
        }
    }
}
