<?php

namespace App\Services\System\Reports;

/**
 * Which language a generated report speaks.
 *
 * The admin panel sends its currently selected UI language on every request
 * (`X-System-Locale`), and a report generated from that request follows it. An
 * unknown/absent value falls back to REPORTS_LOCALE, which is what queued work
 * with no originating request gets.
 */
class ReportLocale
{
    /** Locales we actually ship translations for (backend/lang/*). */
    public const SUPPORTED = ['en', 'fr'];

    public static function resolve(?string $requested): string
    {
        $requested = strtolower(trim((string) $requested));

        if (in_array($requested, self::SUPPORTED, true)) {
            return $requested;
        }

        $fallback = (string) config('reports.lesson_report.locale');

        return in_array($fallback, self::SUPPORTED, true) ? $fallback : 'en';
    }
}
