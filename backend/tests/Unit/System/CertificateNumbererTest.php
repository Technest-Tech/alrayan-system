<?php

namespace Tests\Unit\System;

use App\Services\System\CertificateNumberer;
use App\Support\System\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CertificateNumbererTest extends TestCase
{
    use RefreshDatabase;

    private CertificateNumberer $numberer;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->numberer = new CertificateNumberer();
    }

    public function test_generates_number_with_crt_year_sequence_format(): void
    {
        $year = 2026;
        $number = $this->numberer->next($year);

        $this->assertMatchesRegularExpression('/^CRT-2026-\d{5}$/', $number);
    }

    public function test_first_number_is_sequence_00001(): void
    {
        $year = 2026;
        $number = $this->numberer->next($year);

        $this->assertEquals("CRT-2026-00001", $number);
    }

    public function test_sequential_calls_increment_by_one(): void
    {
        $year = 2026;

        $n1 = $this->numberer->next($year);
        $n2 = $this->numberer->next($year);
        $n3 = $this->numberer->next($year);

        $this->assertEquals('CRT-2026-00001', $n1);
        $this->assertEquals('CRT-2026-00002', $n2);
        $this->assertEquals('CRT-2026-00003', $n3);
    }

    public function test_different_years_have_independent_counters(): void
    {
        $n2025 = $this->numberer->next(2025);
        $n2026 = $this->numberer->next(2026);
        $n2025b = $this->numberer->next(2025);

        $this->assertEquals('CRT-2025-00001', $n2025);
        $this->assertEquals('CRT-2026-00001', $n2026);
        $this->assertEquals('CRT-2025-00002', $n2025b);
    }

    public function test_counter_row_is_created_in_db(): void
    {
        $year = 2026;
        $this->numberer->next($year);

        $row = DB::table('sys_certificate_counters')->where('year', $year)->first();
        $this->assertNotNull($row);
        $this->assertEquals(1, $row->last);
    }

    public function test_counter_increments_in_db_on_each_call(): void
    {
        $year = 2026;
        $this->numberer->next($year);
        $this->numberer->next($year);

        $row = DB::table('sys_certificate_counters')->where('year', $year)->first();
        $this->assertEquals(2, $row->last);
    }

    public function test_respects_custom_prefix_from_setting(): void
    {
        DB::table('sys_settings')->upsert(
            [['key' => 'certificate.prefix', 'value' => 'ALR', 'created_at' => now(), 'updated_at' => now()]],
            ['key'],
            ['value', 'updated_at']
        );

        $number = $this->numberer->next(2026);

        $this->assertStringStartsWith('ALR-2026-', $number);
    }

    public function test_zero_padded_sequence_to_five_digits(): void
    {
        DB::table('sys_certificate_counters')->insert(['year' => 2026, 'last' => 9]);

        $number = $this->numberer->next(2026);

        $this->assertEquals('CRT-2026-00010', $number);
    }

    public function test_number_format_for_large_sequence(): void
    {
        DB::table('sys_certificate_counters')->insert(['year' => 2026, 'last' => 99999]);

        $number = $this->numberer->next(2026);

        $this->assertEquals('CRT-2026-100000', $number);
    }
}
