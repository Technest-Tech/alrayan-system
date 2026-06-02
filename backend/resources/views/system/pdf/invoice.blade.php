<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 0; }
  .page { padding: 40px 50px; }

  /* ── header ── */
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
  .logo-area h1 { font-size: 22px; color: #1e3a5f; margin: 0; }
  .logo-area p { color: #666; margin: 4px 0 0; font-size: 11px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .inv-number { font-size: 18px; font-weight: bold; color: #1e3a5f; }
  .invoice-meta p { margin: 4px 0; color: #444; font-size: 11px; }

  /* ── billed-to ── */
  .bill-to { margin-bottom: 22px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: .04em; }
  .bill-to p { margin: 3px 0; }

  /* ── section heading ── */
  .section-title { font-size: 11px; text-transform: uppercase; color: #888; margin: 24px 0 8px; letter-spacing: .04em; }
  .section-meta  { font-size: 11px; color: #666; margin-bottom: 6px; }
  .section-meta strong { color: #1e3a5f; }

  /* ── tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table th { background: #1e3a5f; color: white; padding: 9px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  table td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 11px; vertical-align: top; }
  table tr:nth-child(even) td { background: #fafbfc; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: bold; letter-spacing: .02em; }
  .pill-attended       { background: #dcfce7; color: #166534; }
  .pill-absent         { background: #fee2e2; color: #991b1b; }
  .pill-cancelled      { background: #f3f4f6; color: #4b5563; }
  .pill-scheduled      { background: #dbeafe; color: #1e40af; }
  .pill-pending_substitute { background: #ffedd5; color: #9a3412; }
  .pill-rescheduled    { background: #fef3c7; color: #92400e; }

  .pill-counted         { background: #dcfce7; color: #166534; }
  .pill-counted_no_show { background: #fee2e2; color: #991b1b; }
  .pill-free_teacher    { background: #fef3c7; color: #92400e; }
  .pill-free_excused    { background: #dbeafe; color: #1e40af; }
  .pill-free            { background: #f3f4f6; color: #4b5563; }

  /* ── totals ── */
  .totals { margin-left: auto; width: 280px; margin-top: 8px; }
  .totals table { width: 100%; }
  .totals table td { border: none; padding: 5px 8px; }
  .totals .total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #1e3a5f; padding-top: 8px; }

  /* ── status ── */
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  .status-sent    { background: #dbeafe; color: #1e40af; }
  .status-paid    { background: #dcfce7; color: #166534; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
  .status-draft   { background: #f3f4f6; color: #374151; }

  .footer { border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
  .pay-link { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px 14px; border-radius: 6px; margin-top: 12px; font-size: 11px; }
  .pay-link strong { color: #047857; }
</style>
</head>
<body>
<div class="page">

  {{-- ── HEADER ── --}}
  <div class="header">
    <div class="logo-area">
      <h1>Alrayan Academy</h1>
      <p>Online Quran Learning · alrayan-academy.com</p>
    </div>
    <div class="invoice-meta">
      <div class="inv-number">{{ $invoice->invoice_number }}</div>
      <p>Issued: {{ $invoice->issued_at?->format('M d, Y') ?? '—' }}</p>
      <p>Due: {{ $invoice->due_at?->format('M d, Y') }}</p>
      @if($invoice->period_year && $invoice->period_month)
        <p>Period: {{ \Carbon\Carbon::create($invoice->period_year, $invoice->period_month)->format('F Y') }}</p>
      @endif
      <span class="status-badge status-{{ $invoice->status }}">{{ ucfirst($invoice->status) }}</span>
    </div>
  </div>

  {{-- ── BILLED TO ── --}}
  <div class="bill-to">
    <h3>Billed To</h3>
    <p><strong>{{ $invoice->student?->name ?? $invoice->snapshot['student_name'] ?? '—' }}</strong></p>
    @if(!empty($invoice->snapshot['course_name']))
      <p>Course: {{ $invoice->snapshot['course_name'] }}</p>
    @endif
    @if(!empty($invoice->snapshot['teacher_name']))
      <p>Teacher: {{ $invoice->snapshot['teacher_name'] }}</p>
    @endif
    @if($invoice->student?->country)
      <p>{{ $invoice->student->country }}</p>
    @endif
  </div>

  {{-- ── SESSIONS IN THIS PERIOD ── --}}
  @if($sessions->count() > 0)
    @php
      $statusLabels = [
        'scheduled' => 'Scheduled', 'attended' => 'Attended',
        'absent' => 'Absent', 'cancelled' => 'Cancelled',
        'rescheduled' => 'Rescheduled', 'pending_substitute' => 'Needs Sub',
      ];
      $quotaLabels = [
        'counted' => 'Counted', 'counted_no_show' => 'No-show',
        'free_teacher' => 'Free (teacher)', 'free_excused' => 'Free (excused)',
        'free' => 'Free',
      ];
    @endphp

    <p class="section-title">Sessions in this period</p>
    <p class="section-meta">
      <strong>{{ $meta['counted'] }}</strong> counted ·
      <strong>{{ $meta['free'] }}</strong> not counted ·
      per session <strong>{{ $invoice->currency }} {{ number_format($meta['per_session_price_minor'] / 100, 2) }}</strong>
    </p>

    <table>
      <thead>
        <tr>
          <th>Date · Time</th>
          <th>Teacher</th>
          <th style="text-align:center">Status</th>
          <th style="text-align:center">Quota</th>
          <th style="text-align:right">Cost</th>
        </tr>
      </thead>
      <tbody>
        @foreach($sessions as $s)
          <tr>
            <td>
              {{ $s->scheduled_start?->format('D, d M') }}
              <span style="color:#888"> · {{ $s->scheduled_start?->format('h:i A') }} · {{ $s->duration_min }}m</span>
            </td>
            <td>{{ $s->teacher_name ?? '—' }}</td>
            <td style="text-align:center">
              <span class="pill pill-{{ $s->status }}">{{ $statusLabels[$s->status] ?? $s->status }}</span>
            </td>
            <td style="text-align:center">
              <span class="pill pill-{{ $s->quota_impact }}">{{ $quotaLabels[$s->quota_impact] ?? $s->quota_impact }}</span>
            </td>
            <td style="text-align:right">
              @if($s->counts)
                {{ $invoice->currency }} {{ number_format($s->cost_minor / 100, 2) }}
              @else
                <span style="color:#bbb">—</span>
              @endif
            </td>
          </tr>
        @endforeach
      </tbody>
    </table>
  @else
    <p class="section-title">Charges</p>
    <table>
      <thead>
        <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            @if($invoice->type === 'monthly')
              Monthly tuition
              @if($invoice->period_year && $invoice->period_month)
                — {{ \Carbon\Carbon::create($invoice->period_year, $invoice->period_month)->format('F Y') }}
              @endif
            @elseif($invoice->type === 'advance')
              Advance (pro-rata) tuition
            @elseif($invoice->type === 'reactivation')
              Reactivation balance
            @else
              {{ $invoice->snapshot['description'] ?? 'Tuition' }}
            @endif
          </td>
          <td style="text-align:right">{{ $invoice->currency }} {{ number_format($invoice->subtotal_minor / 100, 2) }}</td>
        </tr>
      </tbody>
    </table>
  @endif

  {{-- ── TOTALS ── --}}
  <div class="totals">
    <table>
      @if($invoice->subtotal_minor !== $invoice->total_minor)
        <tr>
          <td>Subtotal</td>
          <td style="text-align:right">{{ $invoice->currency }} {{ number_format($invoice->subtotal_minor / 100, 2) }}</td>
        </tr>
      @endif
      @if($invoice->discount_minor > 0)
        <tr>
          <td>Discount</td>
          <td style="text-align:right">– {{ $invoice->currency }} {{ number_format($invoice->discount_minor / 100, 2) }}</td>
        </tr>
      @endif
      @if($invoice->wallet_credit_minor > 0)
        <tr>
          <td>Wallet credit</td>
          <td style="text-align:right">– {{ $invoice->currency }} {{ number_format($invoice->wallet_credit_minor / 100, 2) }}</td>
        </tr>
      @endif
      <tr class="total-row">
        <td>Total Due</td>
        <td style="text-align:right">{{ $invoice->currency }} {{ number_format($invoice->total_minor / 100, 2) }}</td>
      </tr>
    </table>
  </div>

  {{-- ── PAYMENT LINK ── --}}
  @if($invoice->payment_token && $invoice->status !== 'paid' && $invoice->status !== 'void')
    <div class="pay-link">
      <strong>💳 Pay online:</strong>
      {{ rtrim(config('system.frontend_url', config('app.url')), '/') }}/pay/{{ $invoice->payment_token }}
    </div>
  @endif

  @if($invoice->status === 'paid')
    <p style="color:#166534;margin-top:18px;font-weight:bold;">&#10003; PAID on {{ $invoice->paid_at?->format('M d, Y') }}</p>
  @endif

  <div class="footer">
    <p>Alrayan Academy · Thank you for learning with us!</p>
    <p>For payment queries, please contact us at info@alrayan-academy.com</p>
  </div>
</div>
</body>
</html>
