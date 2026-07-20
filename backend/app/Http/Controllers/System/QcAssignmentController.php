<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Qc\StoreAssignmentRequest;
use App\Http\Resources\System\QcAssignmentResource;
use App\Models\System\QcAssignment;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class QcAssignmentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $assignments = QcAssignment::query()
            ->with(['qualityManager', 'teacher.user'])
            ->latest()
            ->get();

        return QcAssignmentResource::collection($assignments);
    }

    public function store(StoreAssignmentRequest $request): QcAssignmentResource
    {
        $assignment = QcAssignment::firstOrCreate($request->validated());

        return new QcAssignmentResource($assignment->load(['qualityManager', 'teacher.user']));
    }

    public function destroy(QcAssignment $qcAssignment): Response
    {
        $qcAssignment->delete();
        return response()->noContent();
    }
}
