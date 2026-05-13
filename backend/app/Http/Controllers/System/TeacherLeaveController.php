<?php

namespace App\Http\Controllers\System;

use App\Events\System\TeacherLeaveApproved;
use App\Http\Controllers\Controller;
use App\Http\Requests\System\TeacherLeave\ReviewLeaveRequest;
use App\Http\Requests\System\TeacherLeave\StoreLeaveRequest;
use App\Http\Resources\System\TeacherLeaveResource;
use App\Models\System\Teacher;
use App\Models\System\TeacherLeave;
use App\Services\System\AuditLog;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TeacherLeaveController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $query = QueryBuilder::for(TeacherLeave::class)
            ->allowedFilters([AllowedFilter::exact('status'), AllowedFilter::exact('teacher_id')])
            ->allowedSorts(['start_date', 'created_at'])
            ->with(['teacher.user', 'reviewedBy']);

        // Teachers only see their own leaves
        if (auth()->user()->role === 'teacher') {
            $teacherId = optional(auth()->user()->teacher)->id;
            $query->where('teacher_id', $teacherId);
        }

        return TeacherLeaveResource::collection($query->paginate(50));
    }

    public function store(StoreLeaveRequest $request): TeacherLeaveResource
    {
        $this->authorize('create', TeacherLeave::class);

        $teacherId = $request->teacher_id;
        if (!$teacherId && auth()->user()->role === 'teacher') {
            $teacherId = optional(auth()->user()->teacher)->id;
        }

        abort_unless($teacherId, 422, 'teacher_id is required.');

        $leave = TeacherLeave::create([
            'teacher_id' => $teacherId,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'reason'     => $request->reason,
            'status'     => 'pending',
        ]);

        return new TeacherLeaveResource($leave->load('teacher.user'));
    }

    public function approve(ReviewLeaveRequest $request, TeacherLeave $leave): TeacherLeaveResource
    {
        $this->authorize('review', $leave);
        abort_if($leave->status !== 'pending', 422, 'Leave is not pending.');

        $leave->update([
            'status'              => 'approved',
            'reviewed_by_user_id' => auth()->id(),
            'review_note'         => $request->review_note,
            'reviewed_at'         => now(),
        ]);

        AuditLog::record('teacher_leave.approved', $leave);
        event(new TeacherLeaveApproved($leave->load('teacher.user')));

        return new TeacherLeaveResource($leave->load(['teacher.user', 'reviewedBy']));
    }

    public function reject(ReviewLeaveRequest $request, TeacherLeave $leave): TeacherLeaveResource
    {
        $this->authorize('review', $leave);
        abort_if($leave->status !== 'pending', 422, 'Leave is not pending.');

        $leave->update([
            'status'              => 'rejected',
            'reviewed_by_user_id' => auth()->id(),
            'review_note'         => $request->review_note,
            'reviewed_at'         => now(),
        ]);

        AuditLog::record('teacher_leave.rejected', $leave);

        return new TeacherLeaveResource($leave->load(['teacher.user', 'reviewedBy']));
    }
}
