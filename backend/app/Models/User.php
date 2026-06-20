<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    /**
     * Maps a student's lifecycle status onto a user account status.
     */
    public const STUDENT_STATUS_MAP = [
        'trial'     => 'active',
        'active'    => 'active',
        'paused'    => 'inactive',
        'suspended' => 'suspended',
        'cancelled' => 'archived',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'whatsapp',
        'is_active',
        'status',
        'language',
        'birthday',
        'gender',
        'photo_url',
        'notes',
        'documents',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'birthday'          => 'date',
            'documents'         => 'array',
            'is_active'         => 'boolean',
            'password'          => 'hashed',
        ];
    }

    /**
     * Set the account status and keep the legacy `is_active` mirror in sync so
     * the EnsureSystemActive middleware keeps working unchanged.
     */
    public function syncStatus(string $status): static
    {
        $this->forceFill([
            'status'    => $status,
            'is_active' => $status === 'active',
        ])->save();

        return $this;
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(\App\Models\System\Teacher::class, 'user_id');
    }

    public function teacherProfile(): HasOne
    {
        return $this->hasOne(\App\Models\System\Teacher::class, 'user_id');
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(\App\Models\System\Student::class, 'user_id');
    }

    public function guardianProfile(): HasOne
    {
        return $this->hasOne(\App\Models\System\Guardian::class, 'user_id');
    }

    public function emails(): HasMany
    {
        return $this->hasMany(\App\Models\System\UserEmail::class);
    }

    public function phones(): HasMany
    {
        return $this->hasMany(\App\Models\System\UserPhone::class);
    }
}
