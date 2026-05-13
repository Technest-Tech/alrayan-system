<?php

namespace App\Services\System;

use App\Models\System\Certificate;
use App\Support\System\Setting;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateRenderer
{
    public function renderPdf(Certificate $certificate, bool $preview = false): string
    {
        $certificate->load('student', 'teacher', 'course', 'issuedBy');

        $data = [
            'certificate'  => $certificate,
            'academy_name' => Setting::get('academy.name', 'Alrayan Academy'),
            'academy_logo' => Setting::get('academy.logo_path'),
            'footer_text'  => Setting::get('academy.footer_text', 'Thank you for choosing Alrayan Academy.'),
            'support_email'=> Setting::get('academy.support_email', ''),
            'type_label'   => $this->typeLabel($certificate->type),
            'preview'      => $preview,
        ];

        $pdf = Pdf::loadView('system.pdf.certificate', $data)
            ->setPaper('a4', 'landscape');

        return $pdf->output();
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'course_completion' => 'Course Completion',
            'hifz_milestone'    => 'Quran Memorization Milestone',
            'ijazah'            => 'Ijazah',
            default             => 'Achievement',
        };
    }
}
