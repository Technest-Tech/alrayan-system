<?php

namespace App\Services\System\Reports;

use App\Exceptions\System\UnreachableRecipientException;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\WhatsAppSendLog;
use App\Services\System\WhatsAppDispatcher;
use InvalidArgumentException;

class LessonReportService
{
    public function __construct(
        private LessonReportRenderer $renderer,
        private WhatsAppDispatcher $whatsapp,
    ) {}

    /**
     * A child's report belongs in their guardian's hands, an adult's in their own.
     * Either number is accepted as a fallback: a missing report is worse than one
     * delivered to the other party on the account.
     *
     * @throws UnreachableRecipientException
     */
    public function recipientFor(Student $student): ReportRecipient
    {
        $student->loadMissing('guardian');

        $guardian = $student->guardian;

        $asGuardian = [ReportRecipient::GUARDIAN, $guardian?->whatsapp, $guardian?->name];
        $asStudent  = [ReportRecipient::STUDENT, $student->whatsapp, $student->name];

        $candidates = $student->student_type === 'child'
            ? [$asGuardian, $asStudent]
            : [$asStudent, $asGuardian];

        foreach ($candidates as [$kind, $phone, $name]) {
            if (! $phone) {
                continue;
            }

            try {
                return new ReportRecipient(WhatsAppDispatcher::normalizePhone($phone), (string) $name, $kind);
            } catch (InvalidArgumentException) {
                // Malformed number — try the other party rather than give up.
            }
        }

        throw new UnreachableRecipientException(
            "No valid WhatsApp number for student \"{$student->name}\" or their guardian."
        );
    }

    /** @throws UnreachableRecipientException */
    public function assertReachable(Student $student): void
    {
        $this->recipientFor($student);
    }

    /**
     * Renders the report and queues it. Expensive — the Chromium boot happens
     * here — so callers should be inside a queued job, not an HTTP request.
     *
     * @throws UnreachableRecipientException
     */
    public function send(Lesson $lesson): WhatsAppSendLog
    {
        $student = $lesson->student;

        if (! $student) {
            throw new UnreachableRecipientException("Lesson {$lesson->id} has no student to report to.");
        }

        $recipient = $this->recipientFor($student);

        return $this->whatsapp->sendImage(
            $recipient->phone,
            $this->renderer->render($lesson),
            $this->renderer->caption($lesson),
            WhatsAppSendLog::KIND_REPORT,
        );
    }
}
