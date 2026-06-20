<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message Received</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0B1F3A; padding: 28px 40px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
    .divider { height: 4px; background: #C9A96E; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; color: #0B1F3A; font-weight: 700; margin-bottom: 16px; }
    .body p { color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .reference-box { background: #f5f0e8; border-left: 4px solid #C9A96E; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .reference-box p { margin: 0; font-size: 13px; color: #6b7280; }
    .reference-box strong { display: block; font-size: 18px; color: #0B1F3A; margin-top: 4px; font-family: monospace; }
    .cta { margin-top: 28px; text-align: center; }
    .cta a { display: inline-block; background: #25D366; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .footer { background: #f5f0e8; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Azhary</h1>
      <p>We Received Your Message</p>
    </div>
    <div class="divider"></div>
    <div class="body">
      <p class="greeting">Assalamu alaikum, {{ $contact->name }}!</p>
      <p>Thank you for reaching out to Azhary. We have received your message and will reply to <strong>{{ $contact->email }}</strong> within 24 hours.</p>

      <div class="reference-box">
        <p>Your message reference</p>
        <strong>{{ $contact->reference }}</strong>
      </div>

      <p>If you need a faster response, feel free to reach out to us directly on WhatsApp — we typically reply within minutes.</p>

      <div class="cta">
        <a href="https://wa.me/{{ config('app.whatsapp', '201000000000') }}?text={{ urlencode('Assalamu alaikum, I submitted a contact message (Ref: ' . $contact->reference . '). I\'d like to follow up.') }}">
          Chat on WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      Azhary &middot; info@alrayan-academy.com
    </div>
  </div>
</body>
</html>
