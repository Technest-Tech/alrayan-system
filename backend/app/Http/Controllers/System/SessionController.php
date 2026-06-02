<?php

namespace App\Http\Controllers\System;

use App\Events\System\SessionAbsent;
use App\Events\System\SessionAttended;
use App\Events\System\SessionRescheduled;
use App\Http\Controllers\Controller;
use App\Http\Requests\System\Session\AttendanceRequest;
use App\Http\Requests\System\Session\BulkAttendanceRequest;
use App\Http\Requests\System\Session\CancelRequest;
use App\Http\Requests\System\Session\RescheduleRequest;
use App\Http\Requests\System\Session\StoreSessionRequest;
use App\Http\Resources\System\SessionDetailResource;
use App\Http\Resources\System\SessionResource;
use App\Jobs\System\CreateSessionZoomMeeting;
use App\Jobs\System\DeleteSessionZoomMeeting;
use App\Jobs\System\SendTrialConfirmationMessages;
use App\Jobs\System\UpdateSessionZoomMeeting;
use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Services\System\ScheduleConflictDetector;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function __construct(private ScheduleConflictDetector $detector) {}

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('create', Session::class); // schedule.view via policy

        $query = Session::with(['student', 'teacher'])
            ->when($request->teacher_id, fn ($q) => $q->where('teacher_id', $request->teacher_id))
            ->when($request->student_id, fn ($q) => $q->where('student_id', $request->student_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->from, fn ($q) => $q->where('scheduled_start', '>=', Carbon::parse($request->from)))
            ->when($request->to, fn ($q) => $q->where('scheduled_start', '<=', Carbon::parse($request->to)))
            ->orderBy('scheduled_start');

        // Scope teachers to their own sessions
        if (auth()->user()->role === 'teacher') {
            $query->where('teacher_id', auth()->user()->teacher?->id);
        }

        return SessionResource::collection($query->paginate(50));
    }

    public function show(Session $session): SessionDetailResource
    {
        $this->authorize('view', $session);

        $session->load(['student', 'teacher', 'pattern', 'originalSession', 'report']);

        return new SessionDetailResource($session);
    }

    public function store(StoreSessionRequest $request): SessionResource
    {
        $this->authorize('create', Session::class);

        $start = Carbon::parse($request->scheduled_start);
        $end   = $start->copy()->addMinutes($request->duration_min);

        $session = Session::create([
            'student_id'          => $request->student_id,
            'teacher_id'          => $request->teacher_id,
            'scheduled_start'     => $start,
            'scheduled_end'       => $end,
            'duration_min'        => $request->duration_min,
            'status'              => 'scheduled',
            'original_session_id' => $request->original_session_id,
        ]);

        CreateSessionZoomMeeting::dispatch($session);
        // Delay 25s so Zoom meeting creation finishes before confirmation messages fire
        SendTrialConfirmationMessages::dispatch($session->id)
            ->onQueue('notifications')
            ->delay(now()->addSeconds(25));

        return new SessionResource($session->load(['student', 'teacher']));
    }

    public function reschedule(RescheduleRequest $request, Session $session): JsonResponse
    {
        $this->authorize('reschedule', $session);

        $newStart = Carbon::parse($request->scheduled_start);
        $newEnd   = $newStart->copy()->addMinutes($session->duration_min);

        // Check conflicts
        $conflicts = $this->detector->check($session->teacher_id, $newStart, $newEnd, $session->id);

        // teacher_on_leave is always a hard block
        $hardBlock = collect($conflicts)->first(fn ($c) => $c->type === 'teacher_on_leave');
        if ($hardBlock) {
            return response()->json(['message' => 'Teacher is on approved leave during this time.', 'conflicts' => [['type' => 'teacher_on_leave']]], 422);
        }

        if (!empty($conflicts) && !$request->boolean('force_conflicts')) {
            return response()->json([
                'message'   => 'Conflicts detected. Pass force_conflicts=true to override.',
                'conflicts' => collect($conflicts)->map(fn ($c) => ['type' => $c->type])->values(),
            ], 409);
        }

        $previousStart = $session->scheduled_start->copy();
        $previousEnd   = $session->scheduled_end->copy();

        $session->update([
            'scheduled_start' => $newStart,
            'scheduled_end'   => $newEnd,
        ]);

        SessionRescheduled::dispatch($session, $previousStart, $previousEnd);
        UpdateSessionZoomMeeting::dispatch($session);

        return response()->json(new SessionDetailResource($session->load(['student', 'teacher'])));
    }

    public function reschedulePreview(RescheduleRequest $request, Session $session): JsonResponse
    {
        $this->authorize('view', $session);

        $newStart  = Carbon::parse($request->scheduled_start);
        $newEnd    = $newStart->copy()->addMinutes($session->duration_min);
        $conflicts = $this->detector->check($session->teacher_id, $newStart, $newEnd, $session->id);

        return response()->json([
            'proposed_start' => $newStart->toIso8601String(),
            'proposed_end'   => $newEnd->toIso8601String(),
            'conflicts'      => collect($conflicts)->map(fn ($c) => ['type' => $c->type])->values(),
        ]);
    }

    public function cancel(CancelRequest $request, Session $session): SessionDetailResource
    {
        $this->authorize('cancel', $session);

        $session->update([
            'status'              => 'cancelled',
            'cancelled_by'        => $request->cancelled_by,
            'cancellation_reason' => $request->cancellation_reason,
        ]);

        DeleteSessionZoomMeeting::dispatch($session);

        return new SessionDetailResource($session->load(['student', 'teacher']));
    }

    public function markAttendance(AttendanceRequest $request, Session $session): JsonResponse
    {
        $this->authorize('markAttendance', $session);

        // Enforce: cannot mark attended until a report has been submitted for this session.
        if ($request->status === 'attended' && ! $session->report()->exists()) {
            return response()->json([
                'message' => 'Submit a session report before marking this session as attended.',
                'errors'  => ['status' => ['A session report is required before marking as attended.']],
            ], 422);
        }

        $data = ['status' => $request->status];

        if ($request->status === 'attended') {
            $data['attended_marked_at']         = now();
            $data['attended_marked_by_user_id'] = auth()->id();
            // Clear any stale cancellation fields when flipping back to attended.
            $data['cancelled_by']        = null;
            $data['cancellation_reason'] = null;
            $data['apology_received']    = false;
            $data['apology_at']          = null;
        } elseif ($request->status === 'absent') {
            // Capture WHOSE fault — required by UI for billing/quota rules.
            $data['cancelled_by']        = $request->cancelled_by;
            $data['cancellation_reason'] = $request->cancellation_reason;
            // Apology only meaningful when student is the absent party.
            if ($request->cancelled_by === 'student' && $request->boolean('apology_received')) {
                $data['apology_received'] = true;
                $data['apology_at']       = now();
            } else {
                $data['apology_received'] = false;
                $data['apology_at']       = null;
            }
        } elseif ($request->status === 'cancelled') {
            $data['cancelled_by']        = $request->cancelled_by;
            $data['cancellation_reason'] = $request->cancellation_reason;
            DeleteSessionZoomMeeting::dispatch($session);
        }

        $session->update($data);

        if ($request->status === 'attended') {
            SessionAttended::dispatch($session);
        } elseif ($request->status === 'absent') {
            $session->load('student');
            SessionAbsent::dispatch($session);
        }

        return response()->json(new SessionResource($session->load(['student', 'teacher'])));
    }

    public function bulkAttendance(BulkAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', Session::class); // attendance.edit via middleware

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                $session = Session::findOrFail($item['session_id']);
                $this->authorize('markAttendance', $session);

                // Enforce: cannot mark attended until a report has been submitted.
                if ($item['status'] === 'attended' && ! $session->report()->exists()) {
                    abort(422, "Session #{$session->id} cannot be marked attended without a submitted report.");
                }

                $data = ['status' => $item['status']];

                if ($item['status'] === 'attended') {
                    $data['attended_marked_at']         = now();
                    $data['attended_marked_by_user_id'] = auth()->id();
                    // Clear stale cancellation fields when flipping back to attended.
                    $data['cancelled_by']        = null;
                    $data['cancellation_reason'] = null;
                    $data['apology_received']    = false;
                    $data['apology_at']          = null;
                } elseif ($item['status'] === 'absent') {
                    // Bulk-absent defaults to teacher fault when no cancelled_by is sent —
                    // safest for billing (won't accidentally consume student quotas).
                    $data['cancelled_by']        = $item['cancelled_by'] ?? 'teacher';
                    $data['cancellation_reason'] = $item['cancellation_reason'] ?? null;
                    $apologized = ($data['cancelled_by'] === 'student')
                        && ! empty($item['apology_received']);
                    $data['apology_received'] = $apologized;
                    $data['apology_at']       = $apologized ? now() : null;
                } elseif ($item['status'] === 'cancelled') {
                    $data['cancelled_by']        = $item['cancelled_by'] ?? 'admin';
                    $data['cancellation_reason'] = $item['cancellation_reason'] ?? null;
                }

                $session->update($data);

                if ($item['status'] === 'attended') {
                    SessionAttended::dispatch($session);
                } elseif ($item['status'] === 'absent') {
                    SessionAbsent::dispatch($session->load('student'));
                }
            }
        });

        return response()->json(['message' => 'Attendance updated.']);
    }

    public function forStudent(Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $sessions = Session::where('student_id', $student->id)
            ->with(['teacher'])
            ->orderByDesc('scheduled_start')
            ->paginate(30);

        return response()->json(SessionResource::collection($sessions));
    }

    public function checkAvailability(Request $request, Teacher $teacher): JsonResponse
    {
        $request->validate([
            'scheduled_start' => ['required', 'date'],
            'duration_min'    => ['required', 'integer', 'min:1'],
        ]);

        $start     = Carbon::parse($request->scheduled_start);
        $end       = $start->copy()->addMinutes($request->duration_min);
        $conflicts = $this->detector->check($teacher->id, $start, $end);

        return response()->json([
            'available' => empty($conflicts),
            'conflicts' => collect($conflicts)->map(fn ($c) => [
                'type'    => $c->type,
                'related' => match ($c->type) {
                    'teacher_double_booking' => $c->related ? [
                        'session_id'      => $c->related->id,
                        'scheduled_start' => $c->related->scheduled_start?->toIso8601String(),
                        'scheduled_end'   => $c->related->scheduled_end?->toIso8601String(),
                        'student'         => $c->related->student
                            ? ['id' => $c->related->student->id, 'name' => $c->related->student->name]
                            : null,
                    ] : null,
                    'teacher_on_leave' => $c->related ? [
                        'start_date' => $c->related->start_date?->toDateString(),
                        'end_date'   => $c->related->end_date?->toDateString(),
                    ] : null,
                    default => null,
                },
            ])->values(),
        ]);
    }

    public function forTeacher(Teacher $teacher): JsonResponse
    {
        if (auth()->user()->role === 'teacher' && auth()->user()->teacher?->id !== $teacher->id) {
            abort(403);
        }

        $sessions = Session::where('teacher_id', $teacher->id)
            ->with(['student'])
            ->orderByDesc('scheduled_start')
            ->paginate(30);

        return response()->json(SessionResource::collection($sessions));
    }

    public function conflicts(): JsonResponse
    {
        $results = $this->detector->detectAll();

        return response()->json(collect($results)->map(fn ($r) => [
            'session'   => new SessionResource($r['session']),
            'conflicts' => collect($r['conflicts'])->map(fn ($c) => [
                'type'    => $c->type,
                'related' => match ($c->type) {
                    'teacher_double_booking' => $c->related ? [
                        'session_id'      => $c->related->id,
                        'scheduled_start' => $c->related->scheduled_start?->toIso8601String(),
                        'scheduled_end'   => $c->related->scheduled_end?->toIso8601String(),
                        'duration_min'    => $c->related->duration_min,
                        'student'         => $c->related->student
                            ? ['id' => $c->related->student->id, 'name' => $c->related->student->name]
                            : null,
                    ] : null,
                    'teacher_on_leave' => $c->related ? [
                        'start_date' => $c->related->start_date?->toDateString(),
                        'end_date'   => $c->related->end_date?->toDateString(),
                        'reason'     => $c->related->reason ?? null,
                    ] : null,
                    default => null,
                },
            ])->values(),
        ])->values());
    }

    /**
     * Send the session report to the student/guardian via Wassender.
     *
     * Accepts:
     *   kind=text   + text=<message>                → sendText
     *   kind=image  + image=<base64 PNG (data URL ok)> + caption?=<string> → sendImage
     *
     * Resolves recipient from the student record (whatsapp → phone fallback).
     * Logs every attempt to sys_wassender_logs for audit.
     */
    public function sendReportWhatsApp(Request $request, Session $session, WassenderClient $wassender): JsonResponse
    {
        $this->authorize('view', $session);

        $data = $request->validate([
            'kind'    => ['required', 'in:text,image'],
            'target'  => ['nullable', 'in:student,teacher'],   // defaults to student
            'text'    => ['required_if:kind,text', 'string', 'max:8000'],
            'image'   => ['required_if:kind,image', 'string'],  // base64 (data URL allowed)
            'caption' => ['nullable', 'string', 'max:1024'],
        ]);

        $target = $data['target'] ?? 'student';

        // Resolve recipient + display name based on target.
        if ($target === 'teacher') {
            $session->load(['teacher.user']);
            $teacher = $session->teacher;
            if (!$teacher || !$teacher->user) {
                return response()->json(['message' => 'Session has no teacher / user.'], 422);
            }
            $phone        = $teacher->user->whatsapp ?: $teacher->user->phone;
            $recipientId  = $teacher->id;
            $recipientKey = 'teacher_id';
            $recipientNm  = $teacher->user->name;
            $kind404msg   = 'Teacher has no WhatsApp/phone number on file.';
        } else {
            $session->load('student');
            $student = $session->student;
            if (!$student) {
                return response()->json(['message' => 'Session has no student.'], 422);
            }
            $phone        = $student->whatsapp ?: $student->phone;
            $recipientId  = $student->id;
            $recipientKey = 'student_id';
            $recipientNm  = $student->name;
            $kind404msg   = 'Student has no WhatsApp/phone number on file.';
        }

        if (!$phone) {
            return response()->json(['message' => $kind404msg], 422);
        }
        // Wassender's sendToPhone builds the JID; we just need a clean +country digits string.
        $cleanPhone = preg_replace('/\s|-/', '', $phone);

        // Build the rendered message + log payload depending on kind.
        if ($data['kind'] === 'text') {
            $rendered = $data['text'];
            $payload  = ['kind' => 'text'];
            $result   = $wassender->sendToPhone($cleanPhone, $rendered);
        } else {
            // Strip data: URL prefix if present and decode base64.
            $raw = $data['image'];
            if (str_contains($raw, ',')) {
                $raw = substr($raw, strpos($raw, ',') + 1);
            }
            $bytes = base64_decode($raw, true);
            if ($bytes === false) {
                return response()->json(['message' => 'Invalid image payload (not base64).'], 422);
            }

            $filename = 'session-reports/session-' . $session->id . '-' . Str::random(8) . '.png';
            Storage::disk('public')->put($filename, $bytes);
            $url = Storage::disk('public')->url($filename);

            $caption  = $data['caption'] ?? null;
            $rendered = $caption ?: "Session Report — {$recipientNm}";
            $payload  = ['kind' => 'image', 'image_path' => $filename, 'image_url' => $url];

            $jid = ltrim($cleanPhone, '+') . '@s.whatsapp.net';
            $result = $wassender->sendImage($jid, $url, $caption);
        }

        // Audit log — uses the existing sys_wassender_logs table.
        WassenderLog::create([
            'template_key'         => 'session_report.' . $target . '.' . $data['kind'],
            'recipient_phone'      => $cleanPhone,
            'rendered_message'     => $rendered,
            'status'               => $result->success ? 'sent' : 'failed',
            'external_message_id'  => $result->externalId,
            'attempt_count'        => 1,
            'error'                => $result->success ? null : ($result->errorBody ?? 'send failed'),
            'payload'              => array_merge($payload, [
                'session_id'  => $session->id,
                $recipientKey => $recipientId,
                'target'      => $target,
            ]),
            'sent_at'              => $result->success ? now() : null,
        ]);

        if (!$result->success) {
            return response()->json([
                'message' => 'WhatsApp send failed.',
                'error'   => $result->errorBody,
            ], 502);
        }

        return response()->json([
            'message'             => 'Report sent on WhatsApp.',
            'external_message_id' => $result->externalId,
            'recipient'           => $cleanPhone,
        ]);
    }
}
