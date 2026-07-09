<?php

namespace App\Services\System\Reports;

use App\Models\System\Lesson;
use App\Models\System\StudentPackage;
use App\Support\System\Setting;
use Illuminate\Support\Facades\Storage;

/**
 * Flattens a Lesson into everything the report template needs to draw itself.
 *
 * Images are inlined as data URIs rather than left as URLs: Chromium renders the
 * template from an HTML string with no base URL, and the queue worker cannot be
 * assumed to reach the app over HTTP.
 */
class LessonReportData
{
    /** Only a genuine no-show gets the "we missed you" template. */
    private const ABSENT_STATUS = 'absent';

    public function build(Lesson $lesson, string $locale): array
    {
        $lesson->loadMissing(['student.guardian', 'teacher.user', 'subject', 'evaluation', 'package', 'allocations.package']);

        $student  = $lesson->student;
        $timezone = $student?->timezone ?: (Setting::get('academy.default_timezone') ?: config('app.timezone'));
        $when     = $lesson->scheduled_at->copy()->timezone($timezone);

        $package = $this->packageFor($lesson);

        return [
            'locale'      => $locale,
            'academyName' => Setting::get('academy.name') ?: config('app.name'),
            'logo'        => $this->dataUriFromDisk(Setting::get('academy.logo_path')),

            'isAbsent'    => $lesson->status === self::ABSENT_STATUS,
            'statusKey'   => $lesson->status,
            'statusLabel' => trans("lesson_report.status.{$lesson->status}", [], $locale),

            'studentName'     => $student?->name,
            'teacherName'     => $lesson->teacher?->user?->name,
            'subjectName'     => $lesson->subject?->name,
            'evaluationLabel' => $lesson->evaluation?->label,

            'dateLabel'     => $when->locale($locale)->isoFormat('dddd D MMMM YYYY'),
            'timeLabel'     => $when->format('H:i'),
            'durationLabel' => $this->formatDuration((int) $lesson->duration_minutes),

            'package' => $package ? [
                'number'  => $package->package_number,
                'used'    => $this->formatHours($package->consumed_hours),
                'total'   => $this->formatHours($package->package_hours),
                'percent' => $this->percent($package),
                'isPaid'  => $package->status === 'paid',
            ] : null,

            'content'  => $this->clean($lesson->content),
            'homework' => $this->clean($lesson->homework),
            'notes'    => $this->clean($lesson->notes),
            'souvenir' => $this->resolveImage($lesson->souvenir_image),
        ];
    }

    public function caption(Lesson $lesson, string $locale): string
    {
        $lesson->loadMissing('student');

        return trans('lesson_report.caption', [
            'student' => $lesson->student?->name ?? '',
            'date'    => $lesson->scheduled_at->format('d/m/Y'),
        ], $locale);
    }

    /**
     * A lesson that straddles a package boundary has more than one allocation.
     * The last one is where the student actually stands now, so that is the
     * package worth showing progress for.
     */
    private function packageFor(Lesson $lesson): ?StudentPackage
    {
        return $lesson->allocations->last()?->package ?? $lesson->package;
    }

    private function percent(StudentPackage $package): int
    {
        if ($package->package_hours <= 0) {
            return 0;
        }

        return (int) min(100, round($package->consumed_hours / $package->package_hours * 100));
    }

    /** 11.0 → "11h", 28.5 → "28.5h" — never "28.50h". */
    private function formatHours(float $hours): string
    {
        return rtrim(rtrim(number_format($hours, 1, '.', ''), '0'), '.') . 'h';
    }

    /** 90 → "1h30", 60 → "1h", 30 → "30min". Reads the same in French and English. */
    private function formatDuration(int $minutes): string
    {
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        if ($h === 0) {
            return "{$m}min";
        }

        return $m > 0 ? "{$h}h{$m}" : "{$h}h";
    }

    private function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    /**
     * `souvenir_image` is whatever the upload endpoint handed back — an absolute
     * URL into our own /storage. Inline it when it maps onto the public disk;
     * otherwise let Chromium fetch it and accept that a remote host may 404.
     */
    private function resolveImage(?string $value): ?string
    {
        if (! $value = $this->clean($value)) {
            return null;
        }

        if (str_starts_with($value, 'data:')) {
            return $value;
        }

        $path = $this->publicDiskPath($value);

        return ($path !== null ? $this->dataUriFromDisk($path) : null) ?? $value;
    }

    /** Strips any scheme/host/"storage" prefix down to a path relative to the public disk. */
    private function publicDiskPath(string $value): ?string
    {
        $path = parse_url($value, PHP_URL_PATH) ?: $value;
        $path = ltrim($path, '/');

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        return $path !== '' ? $path : null;
    }

    private function dataUriFromDisk(?string $path): ?string
    {
        if (! $path = $this->clean($path)) {
            return null;
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            return null;
        }

        $mime = $disk->mimeType($path) ?: 'image/png';

        return 'data:' . $mime . ';base64,' . base64_encode($disk->get($path));
    }
}
