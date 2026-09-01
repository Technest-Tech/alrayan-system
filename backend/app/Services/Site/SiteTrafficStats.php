<?php

namespace App\Services\Site;

use App\Models\ContactMessage;
use App\Models\TrialBooking;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * Every number on the site traffic dashboard.
 *
 * All reads run against `site_visits` over a date window and exclude bots, so
 * the figures describe people rather than crawlers.
 */
class SiteTrafficStats
{
    /** How many rows any "top N" breakdown returns. */
    private const TOP_N = 10;

    private function __construct(
        private readonly CarbonImmutable $from,
        private readonly CarbonImmutable $to,
    ) {
    }

    public static function between(CarbonImmutable $from, CarbonImmutable $to): self
    {
        return new self($from->startOfDay(), $to->endOfDay());
    }

    /** @return array<string,mixed> */
    public function all(): array
    {
        return [
            'range'     => ['from' => $this->from->toDateString(), 'to' => $this->to->toDateString()],
            'summary'   => $this->summary(),
            'series'    => $this->series(),
            'top_pages' => $this->topPages(),
            'sources'   => $this->sources(),
            'countries' => $this->countries(),
            'devices'   => $this->breakdown('device'),
            'browsers'  => $this->breakdown('browser'),
            'locales'   => $this->breakdown('locale'),
            'funnel'    => $this->funnel(),
        ];
    }

    /**
     * Headline totals, each alongside the same figure for the equally-long
     * window immediately before it so the dashboard can show a trend.
     *
     * @return array<string,mixed>
     */
    public function summary(): array
    {
        [$prevFrom, $prevTo] = $this->previousWindow();

        return $this->totals($this->from, $this->to) + [
            'previous' => $this->totals($prevFrom, $prevTo),
        ];
    }

    /** @return array<string,mixed> */
    private function totals(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $row = $this->base($from, $to)
            ->selectRaw('count(*) as pageviews')
            ->selectRaw('count(distinct visitor_hash) as visitors')
            ->selectRaw('count(distinct session_hash) as sessions')
            ->first();

        $pageviews = (int) ($row->pageviews ?? 0);
        $sessions  = (int) ($row->sessions ?? 0);

        // A bounce is a session that never went past its first page.
        $bounced = (int) DB::query()
            ->fromSub(
                $this->base($from, $to)
                    ->select('session_hash')
                    ->groupBy('session_hash')
                    ->havingRaw('count(*) = 1'),
                'single_page_sessions'
            )
            ->count();

        return [
            'pageviews'         => $pageviews,
            'visitors'          => (int) ($row->visitors ?? 0),
            'sessions'          => $sessions,
            'bounce_rate'       => $sessions > 0 ? round($bounced / $sessions * 100, 1) : 0.0,
            'pages_per_session' => $sessions > 0 ? round($pageviews / $sessions, 2) : 0.0,
        ];
    }

    /**
     * Daily page views and unique visitors, with quiet days filled in as zero so
     * the chart keeps a continuous x-axis.
     *
     * @return list<array<string,mixed>>
     */
    public function series(): array
    {
        $rows = $this->base()
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('count(*) as pageviews')
            ->selectRaw('count(distinct visitor_hash) as visitors')
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy(fn ($r) => (string) $r->day);

        $series = [];
        for ($day = $this->from; $day->lessThanOrEqualTo($this->to); $day = $day->addDay()) {
            $key = $day->toDateString();
            $row = $rows->get($key);

            $series[] = [
                'date'      => $key,
                'pageviews' => (int) ($row->pageviews ?? 0),
                'visitors'  => (int) ($row->visitors ?? 0),
            ];
        }

        return $series;
    }

    /** @return list<array<string,mixed>> */
    public function topPages(): array
    {
        return $this->base()
            ->selectRaw('path as label')
            ->selectRaw('count(*) as pageviews')
            ->selectRaw('count(distinct visitor_hash) as visitors')
            ->groupBy('path')
            ->orderByDesc('pageviews')
            ->limit(self::TOP_N)
            ->get()
            ->map(fn ($r) => [
                'label'     => (string) $r->label,
                'pageviews' => (int) $r->pageviews,
                'visitors'  => (int) $r->visitors,
            ])
            ->all();
    }

    /**
     * Where the traffic came from: the UTM source when the link was tagged,
     * otherwise the referring domain. Visits with neither — typed URLs,
     * bookmarks, most app links — are grouped as "Direct", and referrals from
     * our own domain are ignored as internal navigation.
     *
     * @return list<array<string,mixed>>
     */
    public function sources(): array
    {
        // The label is derived in SQL rather than in PHP so that grouping — and
        // therefore `count(distinct visitor_hash)` — is exact. Merging groups
        // afterwards would count a visitor once per group they appear in.
        $label = "CASE
            WHEN utm_source IS NOT NULL AND utm_source <> '' THEN utm_source
            WHEN referrer_host IS NOT NULL AND referrer_host <> '' AND referrer_host <> ? THEN referrer_host
            ELSE 'Direct'
        END";

        return $this->grouped($label, [$this->ownHost() ?? '']);
    }

    /** @return list<array<string,mixed>> */
    public function countries(): array
    {
        return $this->breakdown('country');
    }

    /** Group the window by one column, collecting nulls under "Unknown". */
    private function breakdown(string $column, string $nullLabel = 'Unknown'): array
    {
        return $this->grouped("COALESCE(NULLIF($column, ''), ?)", [$nullLabel]);
    }

    /**
     * Rank the window by an arbitrary SQL label expression.
     *
     * @param  list<mixed>  $bindings
     * @return list<array<string,mixed>>
     */
    private function grouped(string $labelExpression, array $bindings = []): array
    {
        return $this->base()
            ->selectRaw("$labelExpression as label", $bindings)
            ->selectRaw('count(*) as pageviews')
            ->selectRaw('count(distinct visitor_hash) as visitors')
            // Group by the output alias, not by a second copy of the expression.
            // MySQL's only_full_group_by does not treat two parameterised copies
            // of the same CASE as the same expression, and rejects the query;
            // the alias is unambiguous to it and to SQLite alike.
            ->groupBy('label')
            ->orderByDesc('pageviews')
            ->limit(self::TOP_N)
            ->get()
            ->map(fn ($r) => [
                'label'     => (string) $r->label,
                'pageviews' => (int) $r->pageviews,
                'visitors'  => (int) $r->visitors,
            ])
            ->all();
    }

    /**
     * How the traffic turned into enquiries.
     *
     * Trial bookings and contact messages are counted from their own tables
     * rather than inferred from page views, so the funnel stays correct for
     * submissions that arrived before tracking was switched on.
     *
     * @return array<string,mixed>
     */
    public function funnel(): array
    {
        $visitors = (int) $this->base()->distinct()->count('visitor_hash');
        $trials   = TrialBooking::whereBetween('created_at', [$this->from, $this->to])->count();
        $contacts = ContactMessage::whereBetween('created_at', [$this->from, $this->to])->count();

        return [
            'visitors'       => $visitors,
            'trial_bookings' => $trials,
            'contacts'       => $contacts,
            'trial_rate'     => $visitors > 0 ? round($trials / $visitors * 100, 2) : 0.0,
            'contact_rate'   => $visitors > 0 ? round($contacts / $visitors * 100, 2) : 0.0,
        ];
    }

    /** Shared, bot-free query over the window. */
    private function base(?CarbonImmutable $from = null, ?CarbonImmutable $to = null): QueryBuilder
    {
        return DB::table('site_visits')
            ->where('is_bot', false)
            ->whereBetween('created_at', [$from ?? $this->from, $to ?? $this->to]);
    }

    /** @return array{0:CarbonImmutable,1:CarbonImmutable} */
    private function previousWindow(): array
    {
        $days = max(1, (int) $this->from->diffInDays($this->to) + 1);

        return [$this->from->subDays($days), $this->from->subSecond()];
    }

    /** The site's own domain, so self-referrals can be treated as direct. */
    private function ownHost(): ?string
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        return is_string($host) ? strtolower($host) : null;
    }
}
