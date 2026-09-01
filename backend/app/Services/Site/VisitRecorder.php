<?php

namespace App\Services\Site;

use App\Models\SiteVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Turns an incoming beacon request into a `site_visits` row.
 *
 * Everything identifying is reduced to a one-way hash before it is stored; the
 * raw IP address never reaches the database.
 */
class VisitRecorder
{
    /**
     * Substrings that mark a user agent as automated. Matched case-insensitively
     * against the full UA string. Bots are still recorded — flagged, not
     * dropped — so the dashboard can exclude them while crawl volume stays
     * visible if anyone wants to look.
     */
    private const BOT_MARKERS = [
        'bot', 'crawl', 'spider', 'slurp', 'archiver', 'curl', 'wget',
        'python-requests', 'headlesschrome', 'phantomjs', 'lighthouse',
        'pingdom', 'uptimerobot', 'gtmetrix', 'facebookexternalhit',
        'preview', 'monitoring', 'scrapy', 'okhttp', 'go-http-client',
    ];

    /** Browser name => marker, in priority order (first match wins). */
    private const BROWSERS = [
        'Edge'      => 'edg/',
        'Opera'     => 'opr/',
        'Samsung'   => 'samsungbrowser',
        'Chrome'    => 'chrome/',
        'Firefox'   => 'firefox/',
        'Safari'    => 'safari/',
    ];

    /** OS name => marker, in priority order (first match wins). */
    private const PLATFORMS = [
        'Android'   => 'android',
        'iOS'       => 'iphone',
        'iPadOS'    => 'ipad',
        'Windows'   => 'windows',
        'macOS'     => 'mac os x',
        'Linux'     => 'linux',
    ];

    public function record(Request $request, array $payload): SiteVisit
    {
        $agent    = (string) $request->userAgent();
        $referrer = $this->trim($payload['referrer'] ?? null, 512);

        return SiteVisit::create([
            'visitor_hash'  => $this->visitorHash($request, $agent),
            'session_hash'  => hash('sha256', (string) ($payload['sessionId'] ?? Str::uuid())),
            'path'          => $this->normalisePath($payload['path'] ?? '/'),
            'locale'        => $this->trim($payload['locale'] ?? null, 5),
            'referrer_host' => $this->host($referrer),
            'referrer'      => $referrer,
            'utm_source'    => $this->trim($payload['utmSource'] ?? null, 100),
            'utm_medium'    => $this->trim($payload['utmMedium'] ?? null, 100),
            'utm_campaign'  => $this->trim($payload['utmCampaign'] ?? null, 100),
            'country'       => $this->country($request),
            'device'        => $this->device($agent),
            'browser'       => $this->matchFirst($agent, self::BROWSERS),
            'os'            => $this->matchFirst($agent, self::PLATFORMS),
            'is_bot'        => $this->isBot($agent),
            'created_at'    => now(),
        ]);
    }

    /**
     * A stable-for-today, meaningless-tomorrow identifier.
     *
     * The date is part of the input, so the same person hashes differently each
     * day and the value cannot be reversed into an IP address. That makes daily
     * unique-visitor counts correct while month-long tracking impossible.
     */
    private function visitorHash(Request $request, string $agent): string
    {
        return hash('sha256', implode('|', [
            config('app.key'),
            now()->toDateString(),
            (string) $request->ip(),
            $agent,
        ]));
    }

    /** Country from the CDN/proxy header, when the site sits behind one. */
    private function country(Request $request): ?string
    {
        foreach (['CF-IPCountry', 'X-Vercel-IP-Country', 'X-Country-Code'] as $header) {
            $value = $request->header($header);
            if ($value && strlen($value) === 2 && ctype_alpha($value) && strtoupper($value) !== 'XX') {
                return strtoupper($value);
            }
        }

        return null;
    }

    private function device(string $agent): string
    {
        $agent = strtolower($agent);

        if (str_contains($agent, 'ipad') || str_contains($agent, 'tablet')) {
            return 'tablet';
        }
        if (str_contains($agent, 'mobi') || str_contains($agent, 'iphone') || str_contains($agent, 'android')) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function isBot(string $agent): bool
    {
        if ($agent === '') {
            return true;
        }

        $agent = strtolower($agent);
        foreach (self::BOT_MARKERS as $marker) {
            if (str_contains($agent, $marker)) {
                return true;
            }
        }

        return false;
    }

    /** @param array<string,string> $markers */
    private function matchFirst(string $agent, array $markers): ?string
    {
        $agent = strtolower($agent);
        foreach ($markers as $name => $marker) {
            if (str_contains($agent, $marker)) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Query strings and fragments are dropped so that `/courses?utm_source=x`
     * and `/courses` are one page in the report; UTM values are already stored
     * in their own columns. A trailing slash is trimmed for the same reason.
     */
    private function normalisePath(string $path): string
    {
        $path = strtok($path, '?') ?: '/';
        $path = strtok($path, '#') ?: '/';
        $path = '/' . ltrim($path, '/');
        $path = rtrim($path, '/');

        return Str::limit($path === '' ? '/' : $path, 255, '');
    }

    private function host(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return is_string($host) ? Str::limit(Str::lower($host), 255, '') : null;
    }

    private function trim(?string $value, int $length): ?string
    {
        $value = is_string($value) ? trim($value) : null;

        return $value === null || $value === '' ? null : Str::limit($value, $length, '');
    }
}
