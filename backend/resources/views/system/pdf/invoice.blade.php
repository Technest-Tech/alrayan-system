<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 0; }
  .page { padding: 40px 50px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
  .logo-area h1 { font-size: 22px; color: #1e3a5f; margin: 0; }
  .logo-area p { color: #666; margin: 4px 0 0; font-size: 11px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .inv-number { font-size: 18px; font-weight: bold; color: #1e3a5f; }
  .invoice-meta p { margin: 4px 0; color: #444; font-size: 11px; }
  .bill-to { margin-bottom: 25px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
  .bill-to p { margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table th { background: #1e3a5f; color: white; padding: 10px 12px; text-align: left; font-size: 11px; }
  table td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 11px; }
  table tr:nth-child(even) td { background: #f9f9f9; }
  .totals { margin-left: auto; width: 280px; }
  .totals table { width: 100%; }
  .totals table td { border: none; padding: 5px 8px; }
  .totals .total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #1e3a5f; padding-top: 8px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  .status-sent { background: #dbeafe; color: #1e40af; }
  .status-paid { background: #dcfce7; color: #166534; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
  .status-draft { background: #f3f4f6; color: #374151; }
  .footer { border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="page">
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

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach($invoice->lines as $line)
      <tr>
        <td>{{ $line->description }}</td>
        <td style="text-align:center">{{ $line->quantity }}</td>
        <td style="text-align:right">{{ $invoice->currency }} {{ number_format($line->unit_price_minor / 100, 2) }}</td>
        <td style="text-align:right">{{ $invoice->currency }} {{ number_format($line->line_total_minor / 100, 2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal</td>
        <td style="text-align:right">{{ $invoice->currency }} {{ number_format($invoice->subtotal_minor / 100, 2) }}</td>
      </tr>
      @if($invoice->discount_minor > 0)
        <tr>
          <td>Discount</td>
          <td style="text-align:right">– {{ $invoice->currency }} {{ number_format($invoice->discount_minor / 100, 2) }}</td>
        </tr>
      @endif
      @if($invoice->wallet_credit_minor > 0)
        <tr>
          <td>Wallet Credit</td>
          <td style="text-align:right">– {{ $invoice->currency }} {{ number_format($invoice->wallet_credit_minor / 100, 2) }}</td>
        </tr>
      @endif
      <tr class="total-row">
        <td>Total Due</td>
        <td style="text-align:right">{{ $invoice->currency }} {{ number_format($invoice->total_minor / 100, 2) }}</td>
      </tr>
    </table>
  </div>

  @if($invoice->status === 'paid')
    <p style="color:#166534;margin-top:20px;font-weight:bold;">&#10003; PAID on {{ $invoice->paid_at?->format('M d, Y') }}</p>
  @endif

  <div class="footer">
    <p>Alrayan Academy · Thank you for learning with us!</p>
    <p>For payment queries, please contact us at info@alrayan-academy.com</p>
  </div>
</div>
</body>
</html>
