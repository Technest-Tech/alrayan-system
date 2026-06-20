<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class TaskNote extends Model
{
    protected $table = 'sys_task_notes';

    protected $guarded = [];

    public function task()  { return $this->belongsTo(Task::class); }
    public function actor() { return $this->belongsTo(User::class, 'actor_user_id'); }
}
