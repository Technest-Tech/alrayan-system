<?php

namespace App\Services\System;

use App\Support\System\Setting;
use Illuminate\Support\Facades\DB;

class CertificateNumberer
{
    public function next(int $year): string
    {
        return DB::transaction(function () use ($year) {
            $row  = DB::table('sys_certificate_counters')->where('year', $year)->lockForUpdate()->first();
            $next = ($row?->last ?? 0) + 1;
            DB::table('sys_certificate_counters')->updateOrInsert(['year' => $year], ['last' => $next]);
            return sprintf('%s-%d-%05d', Setting::get('certificate.prefix', 'CRT'), $year, $next);
        });
    }
}
