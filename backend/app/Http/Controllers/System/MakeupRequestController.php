<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Makeup\ReviewMakeupRequest;
use App\Http\Requests\System\Makeup\StoreMakeupRequest;
use App\Http\Resources\System\MakeupRequestResource;
use App\Http\Resources\System\SessionResource;
use App\Jobs\System\CreateSessionZoomMeeting;
use App\Models\System\MakeupRequest;
use App\Models\System\Session;
use App\Services\System\NotificationService;
use App\Services\System\ScheduleConflictDetector;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MakeupRequestController extends Controller
{
    public function __construct(private ScheduleConflictDetector $detector) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', MakeupRequest::class);

        $query = MakeupRequest::with(['originalSession.student', 'originalSession.teacher', 'makeupSession'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at');

        if (auth()->user()->role === 'teacher') {
            $query->whereHas('originalSession', fn ($q) => $q->where('teacher_id', auth()->user()->teacher?->id));
        }

        return response()->json(MakeupRequestResource::collection($query->paginate(20)));
    }

    public function store(StoreMakeupRequest $request): JsonResponse
    {
        $session = Session::findOrFail($request->original_session_id);
        $this->authorize('create', [MakeupRequest::class, $session]);

        $makeupRequest = MakeupRequest::create([
            'original_session_id'   => $request->original_session_id,
            'requested_by_user_id'  => auth()->id(),
            'proposed_start_at'     => Carbon::parse($request->proposed_start_at),
            'proposed_duration_min' => $request->proposed_duration_min,
            'reason'                => $request->reason,
            'status'                => 'pending',
        ]);

        return response()->json(new MakeupRequestResource($makeupRequest->load(['originalSession'])), 201);
    }

    public function approve(ReviewMakeupRequest $request, MakeupRequest $makeupRequest): JsonResponse
    {
        $this->authorize('approve', MakeupRequest::class);

        if ($makeupRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending.'], 422);
        }

        $original = $makeupRequest->originalSession;

        // Check conflicts
        $start     = $makeupRequest->proposed_start_at;
        $end       = $start->copy()->addMinutes($makeupRequest->proposed_duration_min);
        $conflicts = $this->detector->check($original->teacher_id, $start, $end);

        $hardConflict = collect($conflicts)->first(fn ($c) => $c->type === 'teacher_on_leave');
        if ($hardConflict) {
            return response()->json(['message' => 'Teacher is on approved leave during proposed makeup time.'], 422);
        }

        DB::transaction(function () use ($makeupRequest, $original, $start, $end, $request) {
            $makeupSession = Session::create([
                'student_id'          => $original->student_id,
                'teacher_id'          => $original->teacher_id,
                'original_session_id' => $original->id,
                'scheduled_start'     => $start,
                'scheduled_end'       => $end,
                'duration_min'        => $makeupRequest->proposed_duration_min,
                'status'              => 'scheduled',
            ]);

            CreateSessionZoomMeeting::dispatch($makeupSession);

            $makeupRequest->update([
                'status'             => 'approved',
                'reviewed_by_user_id'=> auth()->id(),
                'review_note'        => $request->review_note,
                'reviewed_at'        => now(),
                'makeup_session_id'  => $makeupSession->id,
            ]);

            // Notify requesting teacher
            $requester = $makeupRequest->requestedBy;
            if ($requester) {
                NotificationService::push($requester, 'makeups.approved', "Makeup approved for session #{$original->id}", null, "/sessions/{$makeupSession->id}");
            }
        });

        return response()->json(new MakeupRequestResource($makeupRequest->fresh()->load(['originalSession', 'makeupSession'])));
    }

    public function deny(ReviewMakeupRequest $request, MakeupRequest $makeupRequest): JsonResponse
    {
        $this->authorize('approve', MakeupRequest::class);

        if ($makeupRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending.'], 422);
        }

        $makeupRequest->update([
            'status'              => 'denied',
            'reviewed_by_user_id' => auth()->id(),
            'review_note'         => $request->review_note,
            'reviewed_at'         => now(),
        ]);

        $requester = $makeupRequest->requestedBy;
        if ($requester) {
            NotificationService::push($requester, 'makeups.denied', "Makeup request denied for session #{$makeupRequest->original_session_id}", null, null);
        }

        return response()->json(new MakeupRequestResource($makeupRequest->load(['originalSession'])));
    }
}
