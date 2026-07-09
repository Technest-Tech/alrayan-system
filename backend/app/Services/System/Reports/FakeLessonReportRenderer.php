<?php

namespace App\Services\System\Reports;

use App\Models\System\Lesson;

/**
 * Renders no pixels. Used by the test suite and by any environment without a
 * Chromium binary, so that the rest of the send pipeline stays exercisable.
 *
 * It still renders the Blade template — a template that throws would otherwise
 * only ever be caught in production.
 */
class FakeLessonReportRenderer extends LessonReportRenderer
{
    protected function screenshot(string $html): string
    {
        return $html;
    }
}
