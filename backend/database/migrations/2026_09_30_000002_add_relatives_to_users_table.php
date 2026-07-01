<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relatives / emergency contacts for a user — used by the teacher personal-profile
 * editor. Stored as a JSON list of {name, relation, phone} to mirror the existing
 * `documents` JSON convention rather than a separate related table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('relatives')->nullable()->after('documents');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('relatives');
        });
    }
};
