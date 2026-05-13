<?php

namespace App\Policies\System;

use App\Models\System\TeacherNote;
use App\Models\User;

class TeacherNotePolicy
{
    public function view(User $user, TeacherNote $note): bool
    {
        return $user->can('teachers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('teachers_notes.create');
    }

    public function update(User $user, TeacherNote $note): bool
    {
        if ($user->can('teachers_notes.edit_any')) return true;
        return $user->can('teachers_notes.edit_own') && $note->author_user_id === $user->id;
    }

    public function delete(User $user, TeacherNote $note): bool
    {
        if ($user->can('teachers_notes.delete_any')) return true;
        return $user->can('teachers_notes.delete_own') && $note->author_user_id === $user->id;
    }
}
