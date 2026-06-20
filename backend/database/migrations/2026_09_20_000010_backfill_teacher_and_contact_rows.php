<?php

use App\Models\System\Teacher;
use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Teachers already have a user_id — just align role + status on the user.
        Teacher::with('user')->chunkById(200, function ($teachers) {
            foreach ($teachers as $teacher) {
                $user = $teacher->user;
                if (! $user) {
                    continue;
                }

                $user->forceFill([
                    'role'      => 'teacher',
                    'status'    => $teacher->is_active ? 'active' : 'inactive',
                    'is_active' => (bool) $teacher->is_active,
                ])->save();

                if (! $user->hasRole('teacher')) {
                    $user->assignRole('teacher');
                }
            }
        });

        // Give every user a primary email/phone child row mirroring their
        // canonical users.email / users.whatsapp, so the directory + edit form
        // render a uniform contact list.
        User::chunkById(200, function ($users) {
            foreach ($users as $user) {
                if ($user->email && ! UserEmail::where('user_id', $user->id)->where('is_primary', true)->exists()) {
                    UserEmail::firstOrCreate(
                        ['user_id' => $user->id, 'email' => $user->email],
                        ['is_primary' => true],
                    );
                }

                if ($user->whatsapp && ! UserPhone::where('user_id', $user->id)->where('is_primary', true)->exists()) {
                    UserPhone::firstOrCreate(
                        ['user_id' => $user->id, 'phone' => $user->whatsapp, 'type' => 'whatsapp'],
                        ['is_primary' => true],
                    );
                }
            }
        });
    }

    public function down(): void
    {
        // Contact rows are removed with their users (cascade); nothing to undo here.
    }
};
