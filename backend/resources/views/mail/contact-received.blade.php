<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0B1F3A; padding: 28px 40px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
    .divider { height: 4px; background: #C9A96E; }
    .body { padding: 36px 40px; }
    .body h2 { color: #0B1F3A; font-size: 18px; margin: 0 0 20px; }
    table.fields { width: 100%; border-collapse: collapse; font-size: 14px; }
    table.fields tr { border-bottom: 1px solid #e8e4da; }
    table.fields tr:last-child { border-bottom: none; }
    table.fields th { text-align: left; padding: 10px 0; color: #6b7280; font-weight: 600; width: 30%; }
    table.fields td { padding: 10px 0; color: #0B1F3A; }
    .message-box { background: #f9f7f2; border: 1px solid #e8e4da; border-radius: 8px; padding: 16px; margin-top: 16px; font-size: 14px; color: #4b5563; line-height: 1.6; }
    .footer { background: #f5f0e8; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Alrayan Academy</h1>
      <p>New Contact Message</p>
    </div>
    <div class="divider"></div>
    <div class="body">
      <h2>New Contact Message</h2>
      <table class="fields">
        <tr><th>Reference</th><td>{{ $contact->reference }}</td></tr>
        <tr><th>Name</th><td>{{ $contact->name }}</td></tr>
        <tr><th>Email</th><td>{{ $contact->email }}</td></tr>
        <tr><th>Subject</th><td>{{ $contact->subject }}</td></tr>
        <tr><th>Submitted At</th><td>{{ $contact->submitted_at->toDateTimeString() }}</td></tr>
      </table>
      <div class="message-box">{{ $contact->message }}</div>
    </div>
    <div class="footer">
      Alrayan Academy &middot; info@alrayan-academy.com
    </div>
  </div>
</body>
</html>
