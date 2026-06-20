<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\StudentPackage;
use App\Models\System\Task;
use Illuminate\Database\Eloquent\Model;

class TaskGenerator
{
    /**
     * Create a task for a domain record, idempotently. Re-dispatching the same
     * event for the same record will not create duplicates (matched on
     * type + related record). Returns the existing or newly-created task.
     */
    public function generate(string $type, ?Model $related, array $attributes): Task
    {
        $meta = Task::TYPE_META[$type] ?? ['priority' => 'medium', 'role' => null];

        $defaults = array_merge([
            'priority'      => $meta['priority'],
            'assignee_role' => $meta['role'],
            'status'        => 'new',
        ], $attributes);

        $task = Task::firstOrCreate(
            [
                'type'         => $type,
                'related_type' => $related ? $related->getMorphClass() : null,
                'related_id'   => $related?->getKey(),
            ],
            $defaults,
        );

        if ($task->wasRecentlyCreated) {
            $this->notify($task);
        }

        return $task;
    }

    /** Package fully consumed → support reviews and prepares the next package. */
    public function forPackageComplete(StudentPackage $package): Task
    {
        $package->loadMissing('student');
        $student = $package->student;

        return $this->generate('package_complete', $package, [
            'title'      => $student?->name ?? "Package #{$package->package_number}",
            'student_id' => $package->student_id,
            'payload'    => [
                'student_name'   => $student?->name,
                'package_number' => $package->package_number,
                'package_hours'  => $package->package_hours,
                'consumed_hours' => $package->consumed_hours,
                'tariff_minor'   => $package->tariff_at_time,
                'currency'       => $package->currency,
            ],
        ]);
    }

    /** A scheduled session was cancelled → support is informed of the schedule removal. */
    public function forSessionCancelled(Session $session): Task
    {
        $session->loadMissing(['student', 'teacher.user']);
        $student = $session->student;

        return $this->generate('schedule_removal', $session, [
            'title'      => $student?->name ?? "Session #{$session->id}",
            'student_id' => $session->student_id,
            'teacher_id' => $session->teacher_id,
            'payload'    => [
                'student_name'        => $student?->name,
                'teacher_name'        => $session->teacher?->user?->name,
                'scheduled_start'     => $session->scheduled_start?->toISOString(),
                'duration_min'        => $session->duration_min,
                'cancelled_by'        => $session->cancelled_by,
                'cancellation_reason' => $session->cancellation_reason,
            ],
        ]);
    }

    private function notify(Task $task): void
    {
        $role  = $task->assignee_role;
        $title = ucwords(str_replace('_', ' ', $task->type)) . ': ' . $task->title;
        $link  = "/tasks?focus={$task->id}";

        if ($role === 'supervisor' || $role === null) {
            NotificationService::pushToAdminsAndSupervisors('tasks.created', $title, $task->body, $link);
            return;
        }

        // Role-targeted task (quality, accountant, ...) → notify admins + that role.
        \App\Models\User::role(['admin', $role])->each(
            fn ($u) => NotificationService::push($u, 'tasks.created', $title, $task->body, $link)
        );
    }
}
