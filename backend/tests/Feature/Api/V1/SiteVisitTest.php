<?php

namespace Tests\Feature\Api\V1;

use App\Models\SiteVisit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteVisitTest extends TestCase
{
    use RefreshDatabase;

    private const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

    /** @param array<string,mixed> $overrides */
    private function beacon(array $overrides = [], string $agent = self::CHROME)
    {
        return $this->withHeaders(['User-Agent' => $agent])
            ->postJson('/api/v1/site-visits', array_merge([
                'path'      => '/courses',
                'sessionId' => 'session-one',
                'locale'    => 'en',
            ], $overrides));
    }

    public function test_records_a_page_view(): void
    {
        $this->beacon()->assertNoContent();

        $visit = SiteVisit::sole();

        $this->assertSame('/courses', $visit->path);
        $this->assertSame('en', $visit->locale);
        $this->assertSame('desktop', $visit->device);
        $this->assertSame('Chrome', $visit->browser);
        $this->assertSame('macOS', $visit->os);
        $this->assertFalse($visit->is_bot);
    }

    public function test_never_stores_the_visitor_ip_or_a_reversible_id(): void
    {
        $this->beacon()->assertNoContent();

        $visit = SiteVisit::sole();
        $row   = collect($visit->getAttributes())->implode('|');

        $this->assertStringNotContainsString('127.0.0.1', $row);
        $this->assertSame(64, strlen($visit->visitor_hash), 'visitor_hash should be a sha256 digest');
        $this->assertSame(64, strlen($visit->session_hash), 'session_hash should be a sha256 digest');
        // The raw session id the client sent must not survive in the clear.
        $this->assertStringNotContainsString('session-one', $row);
    }

    public function test_the_same_visitor_is_counted_once_per_day(): void
    {
        $this->beacon(['path' => '/']);
        $this->beacon(['path' => '/pricing']);

        $this->assertSame(2, SiteVisit::count());
        $this->assertSame(1, SiteVisit::distinct()->count('visitor_hash'));
    }

    public function test_query_strings_and_trailing_slashes_collapse_to_one_page(): void
    {
        $this->beacon(['path' => '/courses/?utm_source=facebook#top']);

        $this->assertSame('/courses', SiteVisit::sole()->path);
    }

    public function test_splits_the_referrer_into_a_host(): void
    {
        $this->beacon(['referrer' => 'https://www.google.com/search?q=quran']);

        $this->assertSame('www.google.com', SiteVisit::sole()->referrer_host);
    }

    public function test_stores_campaign_tags(): void
    {
        $this->beacon([
            'utmSource'   => 'facebook',
            'utmMedium'   => 'cpc',
            'utmCampaign' => 'ramadan',
        ]);

        $visit = SiteVisit::sole();

        $this->assertSame('facebook', $visit->utm_source);
        $this->assertSame('cpc', $visit->utm_medium);
        $this->assertSame('ramadan', $visit->utm_campaign);
    }

    public function test_flags_crawlers(): void
    {
        $this->beacon([], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');

        $this->assertTrue(SiteVisit::sole()->is_bot);
    }

    public function test_reads_the_country_from_the_cdn_header(): void
    {
        $this->withHeaders(['User-Agent' => self::CHROME, 'CF-IPCountry' => 'fr'])
            ->postJson('/api/v1/site-visits', ['path' => '/', 'sessionId' => 's'])
            ->assertNoContent();

        $this->assertSame('FR', SiteVisit::sole()->country);
    }

    public function test_detects_mobile_devices(): void
    {
        $this->beacon([], 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');

        $visit = SiteVisit::sole();

        $this->assertSame('mobile', $visit->device);
        $this->assertSame('iOS', $visit->os);
    }

    public function test_rejects_a_payload_without_a_path(): void
    {
        $this->withHeaders(['User-Agent' => self::CHROME])
            ->postJson('/api/v1/site-visits', ['sessionId' => 's'])
            ->assertStatus(422);

        $this->assertSame(0, SiteVisit::count());
    }
}
