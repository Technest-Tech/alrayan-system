@php
    /**
     * Stroke icons are inlined rather than drawn with emoji: the droplet's headless
     * Chromium has no colour-emoji font and would rasterise tofu boxes.
     */
    $paths = [
        'sparkles' => '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>',
        'users'    => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'cap'      => '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 10v6"/>',
        'book'     => '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
        'calendar' => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        'clock'    => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        'hourglass'=> '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
        'package'  => '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
        'report'   => '<path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="M9 12h6M9 16h4"/>',
        'image'    => '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>',
        'check'    => '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        'cross'    => '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
        'star'     => '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>',
        'wallet'   => '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M18 12a2 2 0 0 0 0 4h3v-4Z"/>',
        'heart'    => '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
        'pen'      => '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    ];

    $icon = fn (string $name, string $color = '#0D9488', int $size = 16) => sprintf(
        '<svg width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="%2$s" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">%3$s</svg>',
        $size,
        $color,
        $paths[$name] ?? '',
    );

    $dash = trans('lesson_report.not_provided', [], $locale);
@endphp
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        /* DejaVu / Liberation ship with every Debian image; the rest are for local dev. */
        font-family: -apple-system, "Segoe UI", "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
        background: #EEF2F6;
        color: #0B1F3A;
        -webkit-font-smoothing: antialiased;
    }

    .sheet { width: 760px; background: #EEF2F6; }

    /* ── Header ─────────────────────────────────────────────── */
    .header {
        background: linear-gradient(135deg, #0B1F3A 0%, #12325C 100%);
        padding: 30px 36px 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { height: 46px; width: auto; display: block; }
    .brand-name { font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -0.4px; }
    .eyebrow {
        display: flex; align-items: center; gap: 7px;
        margin-top: 7px; font-size: 12px; font-weight: 600;
        letter-spacing: 1.6px; color: #2DD4BF;
    }
    .rule { height: 4px; background: linear-gradient(to right, #0D9488, #2DD4BF 55%, #5EEAD4); }

    .pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 15px; border-radius: 999px;
        font-size: 13px; font-weight: 600; white-space: nowrap;
    }
    .pill-present { background: #10B981; color: #fff; }
    .pill-absent  { background: #FEE2E2; color: #B91C1C; }

    /* ── Body ───────────────────────────────────────────────── */
    .body { padding: 26px 36px 30px; }

    .card {
        background: #fff;
        border: 1px solid #E3E9F0;
        border-radius: 16px;
        overflow: hidden;
    }
    .card-head {
        display: flex; align-items: center; gap: 9px;
        padding: 13px 18px;
        background: linear-gradient(to right, #F0FDFA, #F8FAFC);
        border-bottom: 1px solid #E3E9F0;
    }
    .card-title { font-size: 14.5px; font-weight: 700; letter-spacing: -0.1px; }
    .card-body { padding: 6px 18px 14px; }

    .grid { display: flex; gap: 16px; margin-bottom: 16px; }
    .grid > * { flex: 1 1 0; min-width: 0; }

    /* ── Key/value rows ─────────────────────────────────────── */
    .row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 14px; padding: 11px 0; border-bottom: 1px solid #F1F5F9;
    }
    .row:last-child { border-bottom: 0; }
    .row-label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #64748B; }
    .row-value { font-size: 14px; font-weight: 600; text-align: right; word-break: break-word; }

    /* ── Greeting ───────────────────────────────────────────── */
    .greeting {
        display: flex; align-items: center; gap: 16px;
        background: #fff; border: 1px solid #E3E9F0; border-radius: 16px;
        padding: 18px 20px; margin-bottom: 16px;
    }
    .greeting-badge {
        width: 46px; height: 46px; border-radius: 14px; flex: none;
        background: #CCFBF1; display: flex; align-items: center; justify-content: center;
    }
    .greeting-hi { font-size: 13px; color: #64748B; margin-bottom: 3px; }
    .greeting-line { font-size: 16px; font-weight: 600; }
    .greeting-line strong { color: #0D9488; font-weight: 700; }

    /* ── Chip strip ─────────────────────────────────────────── */
    .chips {
        background: #0B1F3A; border-radius: 16px;
        padding: 16px; margin-bottom: 16px;
        display: flex; justify-content: center; flex-wrap: wrap; gap: 10px;
    }
    .chip {
        display: inline-flex; align-items: center; gap: 7px;
        background: #fff; border-radius: 999px;
        padding: 8px 15px; font-size: 13px; font-weight: 600;
    }

    /* ── Package progress ───────────────────────────────────── */
    .pkg-top { display: flex; align-items: baseline; justify-content: space-between; padding: 12px 0 10px; }
    .pkg-label { font-size: 12.5px; color: #64748B; }
    .pkg-label b { color: #0D9488; font-weight: 700; }
    .pkg-pct { font-size: 22px; font-weight: 700; color: #0D9488; letter-spacing: -0.5px; }
    .bar { height: 11px; border-radius: 999px; background: #E7EDF3; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(to right, #0D9488, #2DD4BF); }
    .pkg-meta { display: flex; justify-content: space-between; gap: 12px; padding-top: 11px; }
    .pkg-meta span { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748B; }

    /* ── Report body ────────────────────────────────────────── */
    .prose {
        background: #F8FAFC; border: 1px solid #EEF2F6; border-radius: 12px;
        padding: 13px 15px; font-size: 13.5px; line-height: 1.6; color: #334155;
    }
    .sub-label { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #64748B; margin: 12px 0 7px; }
    /* Capped so a portrait photo can't stretch the card past the text beside it. */
    .souvenir { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; border: 1px solid #E3E9F0; display: block; }

    /* ── Absent variant ─────────────────────────────────────── */
    .absent-card { background: #fff; border: 1px solid #E3E9F0; border-radius: 16px; padding: 30px 32px; margin-bottom: 16px; text-align: center; }
    .absent-badge {
        width: 62px; height: 62px; border-radius: 999px; margin: 0 auto 18px;
        background: #FEF3C7; display: flex; align-items: center; justify-content: center;
    }
    .absent-card p { font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 11px; }
    .absent-hope {
        margin-top: 18px; padding: 15px; border-radius: 12px;
        background: #F0FDFA; border: 1px solid #CCFBF1;
        font-size: 14px; font-weight: 600; color: #0F766E;
    }

    /* ── Footer ─────────────────────────────────────────────── */
    .footer { background: #0B1F3A; padding: 26px 36px; text-align: center; }
    .footer-name { font-size: 16px; font-weight: 700; color: #2DD4BF; margin-bottom: 9px; }
    .footer p { font-size: 11.5px; color: #94A3B8; line-height: 1.6; }
</style>

<div class="sheet">

    {{-- ── Header ─────────────────────────────────────────── --}}
    <div class="header">
        <div>
            <div class="brand">
                @if ($logo)
                    <img src="{{ $logo }}" alt="">
                @endif
                <div class="brand-name">{{ $academyName }}</div>
            </div>
            <div class="eyebrow">
                {!! $icon('report', '#2DD4BF', 14) !!}
                {{ trans('lesson_report.eyebrow', [], $locale) }}
            </div>
        </div>

        <div class="pill {{ $isAbsent ? 'pill-absent' : 'pill-present' }}">
            {!! $icon($isAbsent ? 'cross' : 'check', $isAbsent ? '#B91C1C' : '#FFFFFF', 15) !!}
            {{ $statusLabel }}
        </div>
    </div>
    <div class="rule"></div>

    <div class="body">

        @if ($isAbsent)
            {{-- ── Absent: no lesson happened, so lead with the message ── --}}
            <div class="absent-card">
                <div class="absent-badge">{!! $icon('heart', '#D97706', 28) !!}</div>
                <p>{{ trans('lesson_report.absent_intro', [], $locale) }}</p>
                <p>{{ trans('lesson_report.absent_wish', [], $locale) }}</p>
                <p>{{ trans('lesson_report.absent_health', [], $locale) }}</p>
                <div class="absent-hope">{{ trans('lesson_report.absent_hope', [], $locale) }}</div>
            </div>

            <div class="card" style="margin-bottom:16px">
                <div class="card-head">
                    {!! $icon('book') !!}
                    <div class="card-title">{{ trans('lesson_report.lesson_details', [], $locale) }}</div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="row-label">{!! $icon('cap', '#94A3B8', 15) !!}{{ trans('lesson_report.student', [], $locale) }}</div>
                        <div class="row-value">{{ $studentName ?? $dash }}</div>
                    </div>
                    <div class="row">
                        <div class="row-label">{!! $icon('users', '#94A3B8', 15) !!}{{ trans('lesson_report.teacher', [], $locale) }}</div>
                        <div class="row-value">{{ $teacherName ?? $dash }}</div>
                    </div>
                    <div class="row">
                        <div class="row-label">{!! $icon('book', '#94A3B8', 15) !!}{{ trans('lesson_report.subject', [], $locale) }}</div>
                        <div class="row-value">{{ $subjectName ?? $dash }}</div>
                    </div>
                    <div class="row">
                        <div class="row-label">{!! $icon('calendar', '#94A3B8', 15) !!}{{ trans('lesson_report.date', [], $locale) }}</div>
                        <div class="row-value">{{ $dateLabel }}</div>
                    </div>
                    <div class="row">
                        <div class="row-label">{!! $icon('clock', '#94A3B8', 15) !!}{{ trans('lesson_report.time', [], $locale) }}</div>
                        <div class="row-value">{{ $timeLabel }}</div>
                    </div>
                </div>
            </div>
        @else
            {{-- ── Greeting ────────────────────────────────── --}}
            <div class="greeting">
                <div class="greeting-badge">{!! $icon('sparkles', '#0D9488', 22) !!}</div>
                <div>
                    <div class="greeting-hi">{{ trans('lesson_report.greeting', [], $locale) }}</div>
                    <div class="greeting-line">
                        {!! trans('lesson_report.intro', ['name' => '<strong>' . e($studentName ?? $dash) . '</strong>'], $locale) !!}
                    </div>
                </div>
            </div>

            {{-- ── Status chips ────────────────────────────── --}}
            <div class="chips">
                <span class="chip">
                    {!! $icon('check', '#10B981', 15) !!}{{ $statusLabel }}
                </span>
                @if ($evaluationLabel)
                    <span class="chip">{!! $icon('star', '#D97706', 15) !!}{{ $evaluationLabel }}</span>
                @endif
                @if ($package)
                    <span class="chip">
                        {!! $icon('wallet', $package['isPaid'] ? '#10B981' : '#94A3B8', 15) !!}
                        {{ trans($package['isPaid'] ? 'lesson_report.paid' : 'lesson_report.unpaid', [], $locale) }}
                    </span>
                @endif
            </div>

            {{-- ── Participants + Subject ──────────────────── --}}
            <div class="grid">
                <div class="card">
                    <div class="card-head">
                        {!! $icon('users') !!}
                        <div class="card-title">{{ trans('lesson_report.participants', [], $locale) }}</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="row-label">{!! $icon('cap', '#94A3B8', 15) !!}{{ trans('lesson_report.student', [], $locale) }}</div>
                            <div class="row-value">{{ $studentName ?? $dash }}</div>
                        </div>
                        <div class="row">
                            <div class="row-label">{!! $icon('users', '#94A3B8', 15) !!}{{ trans('lesson_report.teacher', [], $locale) }}</div>
                            <div class="row-value">{{ $teacherName ?? $dash }}</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-head">
                        {!! $icon('book') !!}
                        <div class="card-title">{{ trans('lesson_report.lesson_details', [], $locale) }}</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="row-label">{!! $icon('book', '#94A3B8', 15) !!}{{ trans('lesson_report.subject', [], $locale) }}</div>
                            <div class="row-value">{{ $subjectName ?? $dash }}</div>
                        </div>
                        <div class="row">
                            <div class="row-label">{!! $icon('hourglass', '#94A3B8', 15) !!}{{ trans('lesson_report.duration', [], $locale) }}</div>
                            <div class="row-value">{{ $durationLabel }}</div>
                        </div>
                    </div>
                </div>
            </div>
        @endif

        {{-- ── Schedule + Package progress ─────────────────── --}}
        @if (! $isAbsent || $package)
        <div class="grid">
            @unless ($isAbsent)
                <div class="card">
                    <div class="card-head">
                        {!! $icon('calendar') !!}
                        <div class="card-title">{{ trans('lesson_report.schedule', [], $locale) }}</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="row-label">{!! $icon('calendar', '#94A3B8', 15) !!}{{ trans('lesson_report.date', [], $locale) }}</div>
                            <div class="row-value">{{ $dateLabel }}</div>
                        </div>
                        <div class="row">
                            <div class="row-label">{!! $icon('clock', '#94A3B8', 15) !!}{{ trans('lesson_report.time', [], $locale) }}</div>
                            <div class="row-value">{{ $timeLabel }}</div>
                        </div>
                    </div>
                </div>
            @endunless

            @if ($package)
                <div class="card">
                    <div class="card-head">
                        {!! $icon('package') !!}
                        <div class="card-title">{{ trans('lesson_report.package_progress', [], $locale) }}</div>
                    </div>
                    <div class="card-body">
                        <div class="pkg-top">
                            <div class="pkg-label">
                                {{ trans('lesson_report.package_number', [], $locale) }} <b>#{{ $package['number'] }}</b>
                            </div>
                            <div class="pkg-pct">{{ $package['percent'] }}%</div>
                        </div>
                        <div class="bar">
                            <div class="bar-fill" style="width: {{ $package['percent'] }}%"></div>
                        </div>
                        <div class="pkg-meta">
                            <span>{!! $icon('clock', '#94A3B8', 13) !!}{{ trans('lesson_report.hours_used', ['hours' => $package['used']], $locale) }}</span>
                            <span>{!! $icon('package', '#94A3B8', 13) !!}{{ trans('lesson_report.hours_total', ['hours' => $package['total']], $locale) }}</span>
                        </div>
                    </div>
                </div>
            @endif
        </div>
        @endif

        {{-- ── Lesson report ───────────────────────────────── --}}
        @if (! $isAbsent && ($content || $homework || $souvenir))
            <div class="card">
                <div class="card-head">
                    {!! $icon('report') !!}
                    <div class="card-title">{{ trans('lesson_report.report', [], $locale) }}</div>
                </div>
                <div class="card-body" style="padding-bottom:18px">
                    <div style="display:flex; gap:16px; padding-top:8px">
                        <div style="flex:1 1 0; min-width:0">
                            @if ($content)
                                <div class="sub-label">{!! $icon('pen', '#94A3B8', 13) !!}{{ trans('lesson_report.content', [], $locale) }}</div>
                                <div class="prose">{!! nl2br(e($content)) !!}</div>
                            @endif
                            @if ($homework)
                                <div class="sub-label">{!! $icon('book', '#94A3B8', 13) !!}{{ trans('lesson_report.homework', [], $locale) }}</div>
                                <div class="prose">{!! nl2br(e($homework)) !!}</div>
                            @endif
                        </div>
                        @if ($souvenir)
                            <div style="flex:1 1 0; min-width:0">
                                <div class="sub-label">{!! $icon('image', '#94A3B8', 13) !!}{{ trans('lesson_report.souvenir', [], $locale) }}</div>
                                <img class="souvenir" src="{{ $souvenir }}" alt="">
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        @endif
    </div>

    {{-- ── Footer ─────────────────────────────────────────── --}}
    <div class="footer">
        <div class="footer-name">{{ $academyName }}</div>
        <p>{{ trans('lesson_report.footer_note', [], $locale) }}</p>
        <p>{{ trans('lesson_report.footer_noreply', [], $locale) }}</p>
    </div>
</div>
