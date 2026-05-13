<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  body {
    font-family: 'DejaVu Serif', Georgia, serif;
    width: 297mm; height: 210mm;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .border-outer {
    position: absolute;
    inset: 8mm;
    border: 3px solid #c8a84b;
    border-radius: 4px;
  }
  .border-inner {
    position: absolute;
    inset: 11mm;
    border: 1px solid #c8a84b;
    border-radius: 2px;
  }
  .content {
    position: absolute;
    inset: 15mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .academy-name {
    font-size: 11pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #8b7340;
    margin-bottom: 4mm;
  }
  .cert-title {
    font-size: 26pt;
    color: #1a1a1a;
    font-weight: bold;
    margin-bottom: 5mm;
  }
  .awarded-label {
    font-size: 12pt;
    color: #555;
    font-style: italic;
    margin-bottom: 2mm;
  }
  .student-name {
    font-size: 22pt;
    color: #2a2a2a;
    border-bottom: 1px solid #c8a84b;
    padding-bottom: 2mm;
    margin-bottom: 4mm;
    min-width: 120mm;
  }
  .cert-body {
    font-size: 10pt;
    color: #444;
    max-width: 200mm;
    line-height: 1.5;
    margin-bottom: 5mm;
  }
  .meta-row {
    display: flex;
    justify-content: center;
    gap: 20mm;
    margin-bottom: 6mm;
    font-size: 9pt;
    color: #555;
  }
  .signatures {
    display: flex;
    justify-content: space-between;
    width: 200mm;
  }
  .sig-block {
    text-align: center;
    width: 80mm;
  }
  .sig-line {
    border-top: 1px solid #555;
    width: 70mm;
    margin: 0 auto 2mm;
  }
  .sig-label { font-size: 9pt; color: #555; }
  .cert-number {
    position: absolute;
    bottom: 15mm;
    right: 15mm;
    font-size: 8pt;
    color: #aaa;
  }
  .footer {
    position: absolute;
    bottom: 18mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #aaa;
  }
</style>
</head>
<body>
<div class="border-outer"></div>
<div class="border-inner"></div>

<div class="content">
  <div class="academy-name">{{ $academy_name }}</div>

  <div class="cert-title">Certificate of {{ $type_label }}</div>

  <div class="awarded-label">This certifies that</div>
  <div class="student-name">{{ $certificate->student?->name ?? '—' }}</div>

  <div class="cert-body">
    <strong>{{ $certificate->title }}</strong><br>
    @if($certificate->description)
      {{ $certificate->description }}
    @endif
  </div>

  <div class="meta-row">
    @if($certificate->course)
      <span><strong>Course:</strong> {{ $certificate->course->name }}</span>
    @endif
    <span><strong>Date:</strong> {{ $certificate->issued_on?->format('F j, Y') }}</span>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Academy Director</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">{{ $certificate->teacher?->name ?? 'Teacher' }}</div>
    </div>
  </div>
</div>

<div class="footer">{{ $footer_text }}</div>
<div class="cert-number">{{ $certificate->certificate_number }}</div>
</body>
</html>
