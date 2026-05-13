<?php

namespace App\Policies\System;

use App\Models\System\StudentNote;
use App\Models\User;

class StudentNotePolicy
{
    public function view(User $user, StudentNote $note): bool
    {
        return $user->can('students.view');
    }

    public function create(User $user): bool
    {
        return $user->can('students_notes.create');
    }

    public function update(User $user, StudentNote $note): bool
    {
        if ($user->can('students_notes.edit_any')) return true;
        return $user->can('students_notes.edit_own') && $note->author_user_id === $user->id;
    }

    public function delete(User $user, StudentNote $note): bool
    {
        if ($user->can('students_notes.delete_any')) return true;
        return $user->can('students_notes.delete_own') && $note->author_user_id === $user->id;
    }
}
