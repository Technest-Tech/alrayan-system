<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 0; }
  .page { padding: 40px; }
  .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #2563eb; margin: 0 0 4px; }
  .header p  { margin: 0; color: #555; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .meta .block { width: 48%; }
  .meta .block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 0 0 4px; }
  .meta .block p  { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
  .total-row td { font-weight: bold; border-top: 2px solid #2563eb; border-bottom: none; font-size: 14px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
  .badge-pending    { background: #fef3c7; color: #92400e; }
  .badge-approved   { background: #dbeafe; color: #1d4ed8; }
  .badge-transferred{ background: #dcfce7; color: #166534; }
  .badge-rejected   { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>Azhary</h1>
    <p>Salary Slip &mdash; {{ \Carbon\Carbon::create($payroll->period_year, $payroll->period_month, 1)->format('F Y') }}</p>
  </div>

  <div class="meta">
    <div class="block">
      <h3>Teacher</h3>
      <p><strong>{{ $payroll->teacher->user->name }}</strong></p>
      <p>Payment: {{ ucfirst(str_replace('_', ' ', $payroll->teacher->payment_method ?? 'N/A')) }}</p>
    </div>
    <div class="block" style="text-align:right">
      <h3>Status</h3>
      <p><span class="badge badge-{{ $payroll->status }}">{{ ucfirst($payroll->status) }}</span></p>
      @if($payroll->transfer_reference)
      <p>Ref: {{ $payroll->transfer_reference }}</p>
      @endif
    </div>
  </div>

  <table>
    <thead><tr><th>Duration</th><th>Sessions</th><th>Minutes</th><th>Rate / min (piastres)</th><th>Sub-total (EGP)</th></tr></thead>
    <tbody>
    @php $bd = $payroll->breakdown_by_duration ?? []; $snap = $payroll->snapshot ?? []; @endphp
    @foreach([30, 45, 60] as $dur)
      @php $mins = $bd[$dur] ?? 0; $rate = $snap[$dur] ?? 0; $sessions = $mins > 0 ? round($mins / $dur) : 0; @endphp
      @if($mins > 0)
      <tr>
        <td>{{ $dur }}-min</td>
        <td>{{ $sessions }}</td>
        <td>{{ number_format($mins) }}</td>
        <td>{{ number_format($rate) }}</td>
        <td>{{ number_format(($mins * $rate) / 100, 2) }}</td>
      </tr>
      @endif
    @endforeach
    </tbody>
  </table>

  <table>
    <thead><tr><th>Item</th><th>Category</th><th>Notes</th><th style="text-align:right">Amount (EGP)</th></tr></thead>
    <tbody>
      <tr><td colspan="3"><strong>Base salary</strong></td><td style="text-align:right">{{ number_format($payroll->base_salary_minor / 100, 2) }}</td></tr>
      @foreach($payroll->adjustments->where('type','bonus') as $adj)
      <tr><td>+ Bonus</td><td>{{ ucfirst(str_replace('_',' ',$adj->category)) }}</td><td>{{ $adj->reason }}</td><td style="text-align:right;color:#16a34a">+{{ number_format($adj->amount_minor / 100, 2) }}</td></tr>
      @endforeach
      @foreach($payroll->adjustments->where('type','deduction') as $adj)
      <tr><td>&ndash; Deduction</td><td>{{ ucfirst(str_replace('_',' ',$adj->category)) }}</td><td>{{ $adj->reason }}</td><td style="text-align:right;color:#dc2626">-{{ number_format($adj->amount_minor / 100, 2) }}</td></tr>
      @endforeach
      <tr class="total-row"><td colspan="3">Net Salary</td><td style="text-align:right">EGP {{ number_format($payroll->net_salary_minor / 100, 2) }}</td></tr>
    </tbody>
  </table>

  <div class="footer">Generated on {{ now()->format('d M Y, H:i') }} &middot; Azhary &middot; This document is auto-generated.</div>
</div>
</body>
</html>
