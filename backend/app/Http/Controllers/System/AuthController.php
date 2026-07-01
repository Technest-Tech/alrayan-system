<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Auth\ForgotPasswordRequest;
use App\Http\Requests\System\Auth\LoginRequest;
use App\Http\Requests\System\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Notifications\System\SystemPasswordResetNotification;
use App\Services\System\AuditLog;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $rateKey = 'login:' . $request->ip() . ':' . Str::lower($request->input('email'));

        if (RateLimiter::tooManyAttempts($rateKey, 10)) {
            $seconds = RateLimiter::availableIn($rateKey);
            return response()->json([
                'message' => "Account temporarily locked. Try again in {$seconds}s.",
            ], 429);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            RateLimiter::hit($rateKey, decaySeconds: 600);
            AuditLog::record('auth.login_failed', null, ['email' => $request->input('email')]);
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Account inactive'], 403);
        }

        RateLimiter::clear($rateKey);
        $user->update(['last_login_at' => now()]);

        // One active system session per user
        $user->tokens()->where('name', 'system-session')->delete();
        $token = $user->createToken('system-session')->plainTextToken;

        AuditLog::record('auth.login_success', $user);
        return response()->json(['token' => $token, ...$this->profile($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('auth.logout', $request->user());
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Signed out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->profile($request->user()));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'), function ($user, $token) {
            $url = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
            $user->notify(new SystemPasswordResetNotification($url));
        });

        AuditLog::record('auth.password_reset_request', null, ['email' => $request->input('email')]);
        return response()->json(['message' => 'If that account exists, a reset link is on its way.']);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Invalid or expired token'], 422);
        }

        AuditLog::record('auth.password_reset', User::where('email', $request->input('email'))->first());
        return response()->json(['message' => 'Password updated.']);
    }

    private function profile(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'is_active'   => $user->is_active,
            'teacher_id'  => $user->teacher?->id,
            // Profile fields — power the teacher dashboard header + settings prefill.
            'phone'       => $user->phone,
            'whatsapp'    => $user->whatsapp,
            'photo_url'   => $user->photo_url,
            'language'    => $user->language,
            'birthday'    => optional($user->birthday)->toDateString(),
            'gender'      => $user->gender,
        ];
    }
}
