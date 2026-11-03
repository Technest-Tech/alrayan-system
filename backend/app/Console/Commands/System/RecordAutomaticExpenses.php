<?php

namespace App\Console\Commands\System;

use App\Services\System\FixedExpenseAutoRecorder;
use Illuminate\Console\Command;

class RecordAutomaticExpenses extends Command
{
    protected $signature = 'treasury:record-automatic-expenses';

    protected $description = 'Record fixed expense items set to automatic once they fall due';

    public function handle(FixedExpenseAutoRecorder $recorder): int
    {
        $this->info('Recorded ' . $recorder->run() . ' automatic expense(s).');

        return self::SUCCESS;
    }
}
