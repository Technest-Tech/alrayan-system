<?php

use App\Models\System\Guardian;
use App\Models\System\UserPhone;
use App\Models\User;
use App\Support\System\IdentityEmail;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Guardian::whereNull('user_id')->chunkById(200, function ($guardians) {
            foreach ($guardians as $guardian) {
                DB::transaction(function () use ($guardian) {
                    // Guardians have no real email — synthesize a unique one.
                    $email = IdentityEmail::forGuardian($guardian->name);

                    $user = User::create([
                        'name'      => $guardian->name,
                        'email'     => $email,
                        'password'  => Str::random(40),
                        'role'      => 'parent',
                        'whatsapp'  => $guardian->whatsapp,
                        'status'    => 'active',
                        'is_active' => true,
                    ]);

                    $user->syncRoles(['parent']);

                    if ($guardian->whatsapp) {
                        UserPhone::create([
                            'user_id'    => $user->id,
                            'phone'      => $guardian->whatsapp,
                            'type'       => 'whatsapp',
                            'is_primary' => true,
                        ]);
                    }

                    $guardian->forceFill(['user_id' => $user->id])->saveQuietly();
                });
            }
        });
    }

    public function down(): void
    {
        $userIds = Guardian::whereNotNull('user_id')->pluck('user_id');
        Guardian::whereNotNull('user_id')->update(['user_id' => null]);
        User::whereIn('id', $userIds)->where('role', 'parent')->delete();
    }
};
