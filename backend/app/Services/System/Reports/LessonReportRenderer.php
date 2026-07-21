<?php

namespace App\Services\System\Reports;

use App\Models\System\Lesson;
use App\Services\System\WhatsAppDispatcher;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Spatie\Browsershot\Browsershot;

/**
 * Rasterises the lesson report to a PNG on the public disk and returns its
 * absolute https URL — Acadmyq fetches report images server-side, so nothing
 * behind auth or on a private host will do.
 */
class LessonReportRenderer
{
    public function __construct(private LessonReportData $data) {}

    public function render(Lesson $lesson): string
    {
        $url = $this->publicUrl($this->rasterise($lesson));

        // Fail here rather than let the queued send die on a 422 from Acadmyq.
        WhatsAppDispatcher::assertPubliclyFetchableUrl($url);

        return $url;
    }

    /**
     * Raw PNG bytes for a direct download. Unlike render(), the browser receives
     * the image straight from us, so there is no public-URL fetchability to assert.
     */
    public function bytes(Lesson $lesson): string
    {
        $disk = Storage::disk(config('reports.lesson_report.disk'));

        return (string) $disk->get($this->rasterise($lesson));
    }

    /**
     * The report's HTML — a browsable fallback for the download when no rasteriser
     * is configured (local/CI). Production overrides this by producing a real PNG.
     */
    public function html(Lesson $lesson): string
    {
        $locale = (string) config('reports.lesson_report.locale');

        return view('system.reports.lesson-report', $this->data->build($lesson, $locale))->render();
    }

    /** Whether bytes() yields a genuine raster image (false for the no-Chromium fake). */
    public function producesRasterImage(): bool
    {
        return true;
    }

    /**
     * Rasterises the report to a PNG on the disk and returns its path. The path is
     * content-addressed, so an unchanged lesson re-uses the PNG it already produced
     * instead of paying for another Chromium boot.
     */
    private function rasterise(Lesson $lesson): string
    {
        $locale = (string) config('reports.lesson_report.locale');
        $html   = view('system.reports.lesson-report', $this->data->build($lesson, $locale))->render();

        $path = $this->pathFor($lesson, $html);
        $disk = Storage::disk(config('reports.lesson_report.disk'));

        if (! $disk->exists($path)) {
            $disk->put($path, $this->screenshot($html));
        }

        return $path;
    }

    protected function screenshot(string $html): string
    {
        $config = config('reports.browsershot');

        $shot = Browsershot::html($html)
            ->setScreenshotType('png')
            ->windowSize((int) config('reports.lesson_report.width'), 800)
            ->deviceScaleFactor((int) config('reports.lesson_report.device_scale_factor'))
            ->fullPage()
            ->showBackground()
            ->timeout((int) $config['timeout']);

        if ($config['no_sandbox']) {
            $shot->noSandbox();
        }
        if ($args = $config['chromium_arguments']) {
            $shot->addChromiumArguments($args);
        }
        foreach (['node_binary' => 'setNodeBinary', 'npm_binary' => 'setNpmBinary', 'chrome_path' => 'setChromePath', 'node_module_path' => 'setNodeModulePath'] as $key => $setter) {
            if ($config[$key]) {
                $shot->{$setter}($config[$key]);
            }
        }

        return $shot->screenshot();
    }

    private function pathFor(Lesson $lesson, string $html): string
    {
        $directory = trim((string) config('reports.lesson_report.directory'), '/');

        return sprintf('%s/lesson-%d-%s.png', $directory, $lesson->id, substr(hash('sha256', $html), 0, 16));
    }

    private function publicUrl(string $path): string
    {
        $base = rtrim((string) config('reports.public_base_url'), '/');

        if ($base === '') {
            throw new RuntimeException('reports.public_base_url is not configured; the report image would be unreachable.');
        }

        return "{$base}/storage/{$path}";
    }

    public function caption(Lesson $lesson): string
    {
        return $this->data->caption($lesson, (string) config('reports.lesson_report.locale'));
    }
}
