<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Teacher\StoreTeacherRequest;
use App\Http\Requests\System\Teacher\UpdateTeacherRequest;
use App\Http\Resources\System\TeacherDetailResource;
use App\Http\Resources\System\TeacherResource;
use App\Models\System\Teacher;
use App\Services\System\TeacherCreator;
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

    public function store(StoreTeacherRequest $request, TeacherCreator $creator): TeacherDetailResource
    {
        $this->authorize('create', Teacher::class);

        $teacher = $creator->create($request->validated(), auth()->id());

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
