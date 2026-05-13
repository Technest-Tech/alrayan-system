<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Trial Booking</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0B1F3A; padding: 28px 40px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
    .divider { height: 4px; background: #C9A96E; }
    .body { padding: 36px 40px; }
    .body h2 { color: #0B1F3A; font-size: 18px; margin: 0 0 20px; }
    table.fields { width: 100%; border-collapse: collapse; font-size: 14px; }
    table.fields tr { border-bottom: 1px solid #e8e4da; }
    table.fields tr:last-child { border-bottom: none; }
    table.fields th { text-align: left; padding: 10px 0; color: #6b7280; font-weight: 600; width: 40%; }
    table.fields td { padding: 10px 0; color: #0B1F3A; }
    .cta { margin-top: 28px; }
    .cta a { display: inline-block; background: #C9A96E; color: #0B1F3A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { background: #f5f0e8; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Alrayan Academy</h1>
      <p>New Trial Booking Notification</p>
    </div>
    <div class="divider"></div>
    <div class="body">
      <h2>New Trial Booking</h2>
      <table class="fields">
        <tr><th>Reference</th><td>{{ $booking->reference }}</td></tr>
        <tr><th>Name</th><td>{{ $booking->name }}</td></tr>
        <tr><th>Email</th><td>{{ $booking->email }}</td></tr>
        <tr><th>Country</th><td>{{ $booking->country }}</td></tr>
        <tr><th>Phone</th><td>{{ $booking->phone ?? '—' }}</td></tr>
        <tr><th>Age Group</th><td>{{ $booking->age_group }}</td></tr>
        <tr><th>Course Interest</th><td>{{ $booking->course_interest }}</td></tr>
        <tr><th>Preferred Time</th><td>{{ $booking->preferred_time }}</td></tr>
        <tr><th>Timezone</th><td>{{ $booking->timezone }}</td></tr>
        <tr><th>Message</th><td>{{ $booking->message ?? '—' }}</td></tr>
        <tr><th>Submitted At</th><td>{{ $booking->submitted_at->toDateTimeString() }}</td></tr>
      </table>
      <div class="cta">
        <a href="https://wa.me/{{ config('app.whatsapp', '201000000000') }}?text={{ urlencode('Assalamu alaikum ' . $booking->name . ', regarding your trial booking ' . $booking->reference) }}">
          Contact on WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      Alrayan Academy &middot; info@alrayan-academy.com
    </div>
  </div>
</body>
</html>
