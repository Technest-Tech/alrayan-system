<?php

namespace App\Console\Commands\System;

use App\Models\System\Student;
use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use App\Support\System\IdentityEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates the unified `users` identity row (role=student) for any student that
 * is missing one. Idempotent — only touches students with user_id IS NULL, so
 * it is safe to re-run and to call from a deploy migration. Orphaned students
 * (e.g. produced by the pre-provisioning lead-conversion path) are otherwise
 * invisible in the user directory, which lists users, not students.
 */
class BackfillStudentUsers extends Command
{
    protected $signature   = 'system:students:backfill-users';
    protected $description = 'Create missing users identity rows for students with no linked user';

    private const STATUS_MAP = [
        'trial'     => 'active',
        'active'    => 'active',
        'paused'    => 'inactive',
        'suspended' => 'suspended',
        'cancelled' => 'archived',
    ];

    public function handle(): int
    {
        $created = 0;

        Student::withTrashed()->whereNull('user_id')->chunkById(200, function ($students) use (&$created) {
            foreach ($students as $student) {
                DB::transaction(function () use ($student, &$created) {
                    $email = $student->email ?: IdentityEmail::forStudent($student->name);

                    $user = User::create([
                        'name'      => $student->name,
                        'email'     => $email,
                        'password'  => Str::random(40),
                        'role'      => 'student',
                        'whatsapp'  => $student->whatsapp,
                        'status'    => self::STATUS_MAP[$student->status] ?? 'active',
                        'is_active' => in_array($student->status, ['trial', 'active'], true),
                    ]);

                    $user->syncRoles(['student']);

                    UserEmail::create([
                        'user_id'    => $user->id,
                        'email'      => $email,
                        'is_primary' => true,
                    ]);

                    if ($student->whatsapp) {
                        UserPhone::create([
                            'user_id'    => $user->id,
                            'phone'      => $student->whatsapp,
                            'type'       => 'whatsapp',
                            'is_primary' => true,
                        ]);
                    }

                    $student->forceFill(['user_id' => $user->id])->saveQuietly();
                    $created++;
                });
            }
        });

        $this->info("Backfilled {$created} student user(s).");

        return self::SUCCESS;
    }
}
