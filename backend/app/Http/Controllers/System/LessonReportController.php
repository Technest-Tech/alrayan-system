<?php

namespace App\Http\Controllers\System;

use App\Exceptions\System\UnreachableRecipientException;
use App\Http\Controllers\Controller;
use App\Jobs\System\SendLessonReport;
use App\Models\System\Lesson;
use App\Services\System\Reports\LessonReportRenderer;
use App\Services\System\Reports\LessonReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class LessonReportController extends Controller
{
    public function __construct(
        private LessonReportService $reports,
        private LessonReportRenderer $renderer,
    ) {}

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

    /**
     * Render the lesson report PNG and stream it straight back as a download, so an
     * admin can forward it by hand instead of dispatching it over WhatsApp.
     */
    public function download(Lesson $lesson): Response
    {
        $this->authorize('update', $lesson);

        if (! $lesson->student) {
            throw ValidationException::withMessages(['lesson' => 'This lesson has no student to report on.']);
        }

        // With Chromium wired up (production) this is a real PNG. Without it
        // (local/CI fake mode), hand back the report HTML so it can still be
        // previewed in a browser instead of a .png that is secretly markup.
        if ($this->renderer->producesRasterImage()) {
            return response($this->renderer->bytes($lesson), 200, [
                'Content-Type'        => 'image/png',
                'Content-Disposition' => sprintf('attachment; filename="lesson-report-%d.png"', $lesson->id),
            ]);
        }

        return response($this->renderer->html($lesson), 200, [
            'Content-Type'        => 'text/html; charset=utf-8',
            'Content-Disposition' => sprintf('attachment; filename="lesson-report-%d.html"', $lesson->id),
        ]);
    }
}
