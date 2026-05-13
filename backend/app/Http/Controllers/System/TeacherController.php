<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Teacher\StoreTeacherRequest;
use App\Http\Requests\System\Teacher\UpdateTeacherRequest;
use App\Http\Resources\System\TeacherDetailResource;
use App\Http\Resources\System\TeacherResource;
use App\Models\System\Teacher;
use App\Models\User;
use App\Notifications\System\SystemUserInvitedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TeacherController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $teachers = QueryBuilder::for(Teacher::class)
            ->allowedFilters([
                AllowedFilter::exact('is_active'),
                AllowedFilter::scope('course', 'whereTeachesCourse'),
            ])
            ->allowedSorts(['created_at'])
            ->with('user')
            ->withCount('students')
            ->paginate($request->integer('per_page', 25));

        return TeacherResource::collection($teachers);
    }

    public function show(Teacher $teacher): TeacherDetailResource
    {
        $this->authorize('view', $teacher);

        $teacher->load(['user', 'availability', 'notes.author']);

        return new TeacherDetailResource($teacher);
    }

    public function store(StoreTeacherRequest $request): TeacherDetailResource
    {
        $this->authorize('create', Teacher::class);

        $teacher = DB::transaction(function () use ($request) {
            $token = Str::random(60);

            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'phone'     => $request->phone,
                'whatsapp'  => $request->whatsapp,
                'password'  => Hash::make(Str::random(32)),
                'role'      => 'teacher',
                'is_active' => true,
            ]);
            $user->syncRoles(['teacher']);

            // Store invite token in password resets table
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            $user->notify(new SystemUserInvitedNotification($token));

            return Teacher::create([
                'user_id'                  => $user->id,
                'qualifications'           => $request->qualifications,
                'teachable_course_ids'     => $request->teachable_course_ids ?? [],
                'payment_method'           => $request->payment_method,
                'payment_account_details'  => $request->payment_account_details,
                'per_minute_rate_30'       => $request->per_minute_rate_30,
                'per_minute_rate_45'       => $request->per_minute_rate_45,
                'per_minute_rate_60'       => $request->per_minute_rate_60,
            ]);
        });

        return new TeacherDetailResource($teacher->load('user'));
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): TeacherDetailResource
    {
        $this->authorize('update', $teacher);

        $teacher->update($request->validated());

        // Sync watched-field changes into activity log (done by LogsActivity trait)

        return new TeacherDetailResource($teacher->fresh()->load(['user', 'availability']));
    }

    public function activate(Teacher $teacher): TeacherDetailResource
    {
        $this->authorize('update', $teacher);
        $teacher->update(['is_active' => true]);

        return new TeacherDetailResource($teacher->load('user'));
    }

    public function deactivate(Teacher $teacher): TeacherDetailResource
    {
        $this->authorize('update', $teacher);

        abort_if(
            $teacher->students()->exists(),
            422,
            'Cannot deactivate a teacher with assigned students. Reassign their students first.'
        );

        $teacher->update(['is_active' => false]);

        return new TeacherDetailResource($teacher->load('user'));
    }
}
