<?php

namespace App\Http\Controllers\System;

use App\Exceptions\System\UnreachableRecipientException;
use App\Http\Controllers\Controller;
use App\Jobs\System\SendLessonReport;
use App\Models\System\Lesson;
use App\Services\System\Reports\LessonReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class LessonReportController extends Controller
{
    public function __construct(private LessonReportService $reports) {}

    /** Re-send the report for a lesson that already exists. */
    public function store(Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson);

        $student = $lesson->student;

        if (! $student) {
            throw ValidationException::withMessages(['lesson' => 'This lesson has no student to report to.']);
        }

        try {
            $recipient = $this->reports->recipientFor($student);
        } catch (UnreachableRecipientException $e) {
            throw ValidationException::withMessages(['send_report' => $e->getMessage()]);
        }

        SendLessonReport::dispatch($lesson->id)->onQueue('notifications');

        return response()->json([
            'message' => 'Lesson report queued.',
            'data'    => ['recipient_name' => $recipient->name, 'recipient_kind' => $recipient->kind],
        ], 202);
    }
}
