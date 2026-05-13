<?php

namespace App\Services\System;

use App\Models\System\Payroll;
use Barryvdh\DomPDF\Facade\Pdf;

class SalarySlipPdfRenderer
{
    public function render(Payroll $payroll): string
    {
        $payroll->load(['teacher.user', 'adjustments']);
        $pdf = Pdf::loadView('system.pdf.salary-slip', ['payroll' => $payroll])
            ->setPaper('a4');
        return $pdf->output();
    }
}
