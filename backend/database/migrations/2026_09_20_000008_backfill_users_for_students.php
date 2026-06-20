<?php

use App\Models\System\Student;
use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use App\Support\System\IdentityEmail;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const STATUS_MAP = [
        'trial'     => 'active',
        'active'    => 'active',
        'paused'    => 'inactive',
        'suspended' => 'suspended',
        'cancelled' => 'archived',
    ];

    public function up(): void
    {
        Student::withTrashed()->whereNull('user_id')->chunkById(200, function ($students) {
            foreach ($students as $student) {
                DB::transaction(function () use ($student) {
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
                });
            }
        });
    }

    public function down(): void
    {
        // Best-effort: remove the synthesized student users created by this backfill.
        $userIds = Student::withTrashed()->whereNotNull('user_id')->pluck('user_id');
        Student::withTrashed()->whereNotNull('user_id')->update(['user_id' => null]);
        User::whereIn('id', $userIds)->where('role', 'student')->delete();
    }
};
