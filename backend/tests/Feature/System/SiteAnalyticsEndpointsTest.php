<?php

namespace Tests\Feature\System;

use App\Models\SiteVisit;
use Tests\SystemTestCase;

class SiteAnalyticsEndpointsTest extends SystemTestCase
{
    /** A page view, dated, with everything else defaulted. */
    private function visit(array $attributes = []): SiteVisit
    {
        static $n = 0;
        $n++;

        return SiteVisit::create(array_merge([
            'visitor_hash' => str_repeat('a', 63) . $n,
            'session_hash' => str_repeat('b', 63) . $n,
            'path'         => '/',
            'locale'       => 'en',
            'device'       => 'desktop',
            'is_bot'       => false,
            'created_at'   => now(),
        ], $attributes));
    }

    public function test_requires_the_analytics_permission(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->getJson('/api/system/site/analytics')
            ->assertForbidden();
    }

    public function test_returns_the_full_report_shape(): void
    {
        $this->visit();

        $this->asAdmin()
            ->getJson('/api/system/site/analytics')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'range'   => ['from', 'to'],
                    'summary' => ['pageviews', 'visitors', 'sessions', 'bounce_rate', 'pages_per_session', 'previous'],
                    'series'  => [['date', 'pageviews', 'visitors']],
                    'top_pages', 'sources', 'countries', 'devices', 'browsers', 'locales',
                    'funnel'  => ['visitors', 'trial_bookings', 'contacts', 'trial_rate', 'contact_rate'],
                ],
            ]);
    }

    public function test_counts_page_views_visitors_and_sessions_separately(): void
    {
        // One person, one session, two pages.
        $this->visit(['visitor_hash' => 'v1', 'session_hash' => 's1', 'path' => '/']);
        $this->visit(['visitor_hash' => 'v1', 'session_hash' => 's1', 'path' => '/pricing']);
        // A second person, one page.
        $this->visit(['visitor_hash' => 'v2', 'session_hash' => 's2', 'path' => '/']);

        $summary = $this->asAdmin()->getJson('/api/system/site/analytics')
            ->assertOk()->json('data.summary');

        $this->assertSame(3, $summary['pageviews']);
        $this->assertSame(2, $summary['visitors']);
        $this->assertSame(2, $summary['sessions']);
        // s2 never went past its first page; s1 did.
        $this->assertEquals(50, $summary['bounce_rate']);
        $this->assertEquals(1.5, $summary['pages_per_session']);
    }

    public function test_excludes_bots_from_every_figure(): void
    {
        $this->visit(['visitor_hash' => 'human', 'path' => '/']);
        $this->visit(['visitor_hash' => 'crawler', 'path' => '/', 'is_bot' => true]);

        $data = $this->asAdmin()->getJson('/api/system/site/analytics')->assertOk()->json('data');

        $this->assertSame(1, $data['summary']['pageviews']);
        $this->assertSame(1, $data['top_pages'][0]['pageviews']);
    }

    public function test_groups_traffic_sources_by_campaign_then_referrer_then_direct(): void
    {
        $this->visit(['utm_source' => 'facebook', 'referrer_host' => 'l.facebook.com']);
        $this->visit(['referrer_host' => 'www.google.com']);
        $this->visit(['referrer_host' => null]);

        $sources = collect($this->asAdmin()->getJson('/api/system/site/analytics')->json('data.sources'))
            ->pluck('pageviews', 'label');

        $this->assertSame(1, $sources['facebook'], 'a tagged link is attributed to its campaign source');
        $this->assertSame(1, $sources['www.google.com']);
        $this->assertSame(1, $sources['Direct']);
    }

    public function test_treats_a_referral_from_our_own_domain_as_direct(): void
    {
        config(['app.url' => 'https://zadacademiq.com']);

        $this->visit(['referrer_host' => 'zadacademiq.com']);
        $this->visit(['referrer_host' => null]);

        $sources = collect($this->asAdmin()->getJson('/api/system/site/analytics')->json('data.sources'))
            ->pluck('pageviews', 'label');

        $this->assertSame(2, $sources['Direct']);
        $this->assertArrayNotHasKey('zadacademiq.com', $sources->all());
    }

    public function test_labels_missing_countries_as_unknown(): void
    {
        $this->visit(['country' => 'FR']);
        $this->visit(['country' => null]);

        $countries = collect($this->asAdmin()->getJson('/api/system/site/analytics')->json('data.countries'))
            ->pluck('pageviews', 'label');

        $this->assertSame(1, $countries['FR']);
        $this->assertSame(1, $countries['Unknown']);
    }

    public function test_counts_a_visitor_once_per_source_not_once_per_row(): void
    {
        // The same person arriving twice from Google is one visitor, two views.
        $this->visit(['visitor_hash' => 'v1', 'referrer_host' => 'www.google.com']);
        $this->visit(['visitor_hash' => 'v1', 'referrer_host' => 'www.google.com']);

        $google = collect($this->asAdmin()->getJson('/api/system/site/analytics')->json('data.sources'))
            ->firstWhere('label', 'www.google.com');

        $this->assertSame(2, $google['pageviews']);
        $this->assertSame(1, $google['visitors']);
    }

    public function test_the_series_fills_in_quiet_days(): void
    {
        $this->visit(['created_at' => now()->subDays(2)]);

        $series = $this->asAdmin()
            ->getJson('/api/system/site/analytics?from=' . now()->subDays(3)->toDateString() . '&to=' . now()->toDateString())
            ->assertOk()->json('data.series');

        $this->assertCount(4, $series, 'every day in the window gets a point');
        $this->assertSame(1, collect($series)->sum('pageviews'));
        $this->assertSame([0, 1, 0, 0], collect($series)->pluck('pageviews')->all());
    }

    public function test_ignores_traffic_outside_the_window(): void
    {
        $this->visit(['created_at' => now()->subDays(60)]);
        $this->visit(['created_at' => now()]);

        $summary = $this->asAdmin()
            ->getJson('/api/system/site/analytics?from=' . now()->subDays(7)->toDateString() . '&to=' . now()->toDateString())
            ->json('data.summary');

        $this->assertSame(1, $summary['pageviews']);
    }
}
