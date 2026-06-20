<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Lesson\UpdateStudentPackageRequest;
use App\Http\Resources\System\StudentPackageResource;
use App\Models\System\StudentPackage;
use App\Services\System\PackageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudentPackageController extends Controller
{
    public function __construct(private PackageService $packageService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', StudentPackage::class);

        $request->validate(['student_id' => ['required', 'integer', 'exists:sys_students,id']]);

        $packages = StudentPackage::query()
            ->where('student_id', $request->input('student_id'))
            ->withCount('lessons')
            ->orderBy('package_number')
            ->get();

        return StudentPackageResource::collection($packages);
    }

    public function show(StudentPackage $studentPackage): StudentPackageResource
    {
        $this->authorize('view', $studentPackage);

        $studentPackage->load('student');
        $studentPackage->loadCount('lessons');

        return new StudentPackageResource($studentPackage);
    }

    public function update(UpdateStudentPackageRequest $request, StudentPackage $studentPackage): StudentPackageResource
    {
        $this->authorize('update', $studentPackage);

        $previousHours = $studentPackage->package_hours;

        $studentPackage->update($request->only([
            'tariff_at_time',
            'package_hours',
            'status',
            'needs_reconfirmation',
            'notes',
        ]));

        if (
            $request->has('package_hours') &&
            (int) $request->input('package_hours') !== (int) $previousHours
        ) {
            // This package keeps its own hour limit (we no longer clobber the student-wide default);
            // re-distribute so the new limit cascades through the pending packages.
            $student = $studentPackage->student;
            if ($student) {
                $this->packageService->rebuild($student);
            }
        }

        $studentPackage->loadCount('lessons');

        return new StudentPackageResource($studentPackage);
    }

    public function destroy(StudentPackage $studentPackage): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $studentPackage);

        if ($studentPackage->status === 'paid') {
            return response()->json(['message' => 'Cannot delete a paid package.'], 422);
        }

        $studentPackage->delete();

        return response()->json(['message' => 'Package deleted.']);
    }

    public function confirm(StudentPackage $studentPackage): StudentPackageResource
    {
        $this->authorize('update', $studentPackage);

        $studentPackage->update([
            'needs_reconfirmation' => false,
            'status'               => 'paid',
            'paid_at'              => $studentPackage->paid_at ?? now(),
        ]);

        $studentPackage->loadCount('lessons');

        return new StudentPackageResource($studentPackage);
    }
}
