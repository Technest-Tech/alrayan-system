<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Class Booked</title>
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
    .steps { list-style: none; padding: 0; margin: 24px 0; }
    .steps li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; font-size: 14px; color: #4b5563; }
    .step-num { background: #0B1F3A; color: #C9A96E; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; shrink: 0; }
    .cta { margin-top: 28px; text-align: center; }
    .cta a { display: inline-block; background: #25D366; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .closing { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e8e4da; font-size: 14px; color: #4b5563; }
    .footer { background: #f5f0e8; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Alrayan Academy</h1>
      <p>Your Free Trial Class is Booked</p>
    </div>
    <div class="divider"></div>
    <div class="body">
      <p class="greeting">Assalamu alaikum, {{ $booking->name }}!</p>
      <p>Your free trial class booking has been confirmed. Here are your details:</p>

      <div class="reference-box">
        <p>Your booking reference</p>
        <strong>{{ $booking->reference }}</strong>
      </div>

      <p><strong>Course:</strong> {{ $booking->course_interest }}<br>
      <strong>Preferred Time:</strong> {{ $booking->preferred_time }}<br>
      <strong>Timezone:</strong> {{ $booking->timezone }}</p>

      <p><strong>What happens next?</strong></p>
      <ol class="steps">
        <li>We match you with the most suitable certified teacher for your course and level.</li>
        <li>You receive a WhatsApp message from our team with your teacher's details and the meeting link.</li>
        <li>Your first class is completely free — no payment, no credit card required.</li>
      </ol>

      <div class="cta">
        <a href="https://wa.me/{{ config('app.whatsapp', '201000000000') }}?text={{ urlencode('Assalamu alaikum, I just booked a free trial (Ref: ' . $booking->reference . '). I\'d like to discuss scheduling.') }}">
          Chat on WhatsApp
        </a>
      </div>

      <div class="closing">
        Jazakum Allahu khayran,<br>
        <strong>The Alrayan Academy Team</strong>
      </div>
    </div>
    <div class="footer">
      Alrayan Academy &middot; info@alrayan-academy.com
    </div>
  </div>
</body>
</html>
