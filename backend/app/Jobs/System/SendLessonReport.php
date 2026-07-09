<?php

namespace App\Jobs\System;

use App\Exceptions\System\UnreachableRecipientException;
use App\Models\System\Lesson;
use App\Services\System\Reports\LessonReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Renders the lesson report to a PNG and hands it to the WhatsApp dispatcher,
 * which queues the actual send. Rendering boots Chromium, so it never runs
 * inside the request that created the lesson.
 */
class SendLessonReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $lessonId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [30, 120];
    }

    public function handle(LessonReportService $reports): void
    {
        $lesson = Lesson::find($this->lessonId);

        if (! $lesson) {
            return;
        }

        try {
            $reports->send($lesson);
        } catch (UnreachableRecipientException $e) {
            // The controller already rejected unreachable students; if we still
            // land here the number was removed after queueing. Retrying cannot
            // conjure a phone number, so stop.
            Log::warning('Lesson report not sent.', ['lesson_id' => $lesson->id, 'reason' => $e->getMessage()]);

            $this->fail($e);
        }
    }
}
