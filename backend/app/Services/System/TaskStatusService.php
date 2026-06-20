<?php

namespace App\Services\System;

use App\Models\System\Task;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TaskStatusService
{
    private const TRANSITIONS = [
        'new'             => ['following_up', 'review_underway', 'done', 'postponed'],
        'following_up'    => ['review_underway', 'done', 'postponed', 'new'],
        'review_underway' => ['done', 'postponed', 'following_up'],
        'postponed'       => ['new', 'following_up', 'review_underway', 'done'],
        'done'            => [], // terminal — admin reopen only
    ];

    public function canTransition(Task $task, string $to, User $actor): bool
    {
        $from = $task->status;

        if ($from === $to) return true;

        // Admin can reopen a done task to any non-terminal status.
        if ($from === 'done') {
            return $actor->hasRole('admin') && in_array($to, Task::STATUSES, true) && $to !== 'done';
        }

        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    public function transition(Task $task, string $to, User $actor): Task
    {
        if (!in_array($to, Task::STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => "Invalid task status '{$to}'.",
            ]);
        }

        if (!$this->canTransition($task, $to, $actor)) {
            throw ValidationException::withMessages([
                'status' => "Cannot move task from '{$task->status}' to '{$to}'.",
            ]);
        }

        $task->update(['status' => $to]);

        return $task->refresh();
    }
}
