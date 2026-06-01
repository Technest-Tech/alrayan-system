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

    public function availabilityOverview(Request $request): array
    {
        $from = $request->filled('from')
            ? \Carbon\CarbonImmutable::parse($request->string('from'))->startOfDay()
            : \Carbon\CarbonImmutable::now()->startOfWeek();
        $to = $request->filled('to')
            ? \Carbon\CarbonImmutable::parse($request->string('to'))->endOfDay()
            : $from->addDays(6)->endOfDay();

        $teachers = Teacher::query()
            ->where('is_active', true)
            ->with(['user', 'availability'])
            ->get();

        $teacherIds = $teachers->pluck('id');

        $sessions = \App\Models\System\Session::query()
            ->whereIn('teacher_id', $teacherIds)
            ->whereBetween('scheduled_start', [$from, $to])
            ->whereNotIn('status', ['cancelled'])
            ->with(['student:id,name,status'])
            ->get()
            ->groupBy('teacher_id');

        return [
            'data' => $teachers->map(function (Teacher $t) use ($sessions) {
                $list = $sessions->get($t->id, collect());
                return [
                    'id'           => $t->id,
                    'name'         => optional($t->user)->name,
                    'email'        => optional($t->user)->email,
                    'availability' => $t->availability->map(fn ($a) => [
                        'day_of_week' => (int) $a->day_of_week,
                        'start_time'  => $a->start_time,
                        'end_time'    => $a->end_time,
                        'timezone'    => $a->timezone,
                    ])->values(),
                    'sessions'     => $list->map(fn ($s) => [
                        'id'              => $s->id,
                        'scheduled_start' => $s->scheduled_start?->toIso8601String(),
                        'scheduled_end'   => $s->scheduled_end?->toIso8601String(),
                        'status'          => $s->status,
                        'is_trial'        => optional($s->student)->status === 'trial',
                        'student'         => $s->student ? [
                            'id'     => $s->student->id,
                            'name'   => $s->student->name,
                            'status' => $s->student->status,
                        ] : null,
                    ])->values(),
                ];
            })->values(),
            'range' => [
                'from' => $from->toIso8601String(),
                'to'   => $to->toIso8601String(),
            ],
        ];
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

            $perMinute = (int) round($request->hourly_rate / 60);

            return Teacher::create([
                'user_id'                  => $user->id,
                'qualifications'           => $request->qualifications,
                'cv_url'                   => $request->cv_url,
                'teachable_course_ids'     => $request->teachable_course_ids ?? [],
                'payment_method'           => $request->payment_method,
                'payment_account_details'  => $request->payment_account_details,
                'hourly_rate'              => $request->hourly_rate,
                'per_minute_rate_30'       => $perMinute,
                'per_minute_rate_45'       => $perMinute,
                'per_minute_rate_60'       => $perMinute,
            ]);
        });

        return new TeacherDetailResource($teacher->load('user'));
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): TeacherDetailResource
    {
        $this->authorize('update', $teacher);

        $data = $request->validated();

        if (isset($data['hourly_rate'])) {
            $perMinute = (int) round($data['hourly_rate'] / 60);
            $data['per_minute_rate_30'] = $perMinute;
            $data['per_minute_rate_45'] = $perMinute;
            $data['per_minute_rate_60'] = $perMinute;
        }

        $teacher->update($data);

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
