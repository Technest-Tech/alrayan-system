<?php

namespace App\Services\System\Reports;

class ReportRecipient
{
    public const GUARDIAN = 'guardian';
    public const STUDENT  = 'student';

    public function __construct(
        /** Digits only, already normalised for Acadmyq. */
        public readonly string $phone,
        public readonly string $name,
        /** Which of the two numbers we landed on — surfaced so the UI can say who it went to. */
        public readonly string $kind,
    ) {}
}
