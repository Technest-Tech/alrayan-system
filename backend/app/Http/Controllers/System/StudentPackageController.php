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
        ]) + [
            // Hand-edited: the rebuild below must not soft-delete this row for holding no
            // lessons, and later rebuilds must not either.
            'is_manual' => true,
        ] + $this->paidAtFor($request, $studentPackage));

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

    /**
     * Every paid package carries the date it was paid. Marking one paid from the edit row used to
     * leave the date empty (only "Mark as paid" stamped it); an explicit date always wins, and a
     * package sent back to pending has not been paid at all.
     *
     * @return array{paid_at?: \Illuminate\Support\Carbon|string|null}
     */
    private function paidAtFor(UpdateStudentPackageRequest $request, StudentPackage $package): array
    {
        $status = $request->input('status', $package->status);

        if ($status === 'pending') {
            return ['paid_at' => null];
        }

        if ($request->filled('paid_at')) {
            return ['paid_at' => $request->date('paid_at')];
        }

        if ($status === 'paid' && $package->paid_at === null) {
            return ['paid_at' => now()];
        }

        return [];
    }

    /**
     * Delete a bill (package) — paid ones included.
     *
     * Packages are derived from lesson consumption, so one that still has to hold lessons is
     * re-created by the engine. Re-run rebuild immediately and report whether the row survived,
     * rather than letting a "deleted" package silently reappear on the next lesson edit.
     */
    public function destroy(StudentPackage $studentPackage): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $studentPackage);

        $student = $studentPackage->student;

        $studentPackage->delete();

        if ($student) {
            $this->packageService->rebuild($student);
        }

        // The SoftDeletes scope hides trashed rows, so if it is visible again rebuild restored it.
        $restored = StudentPackage::whereKey($studentPackage->id)->exists();

        return response()->json([
            'deleted'  => ! $restored,
            'restored' => $restored,
            'message'  => $restored
                ? 'This package still holds lessons, so the engine rebuilt it. Move or delete its lessons first.'
                : 'Package deleted.',
        ]);
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
