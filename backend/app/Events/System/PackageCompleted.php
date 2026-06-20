<?php

namespace App\Events\System;

use App\Models\System\StudentPackage;
use Illuminate\Foundation\Events\Dispatchable;

class PackageCompleted
{
    use Dispatchable;

    public function __construct(public StudentPackage $package) {}
}
