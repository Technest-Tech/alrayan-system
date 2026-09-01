<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Several teacher fields validate a longer value than their column can hold, so
 * a paragraph of credentials or a long photo URL passed validation and then hit
 * MySQL's strict mode as "Data too long" — a 500 the admin saw as a server error
 * with the teacher unsaved. Widen each column to what the request already allows,
 * so the validation rule is the real limit and an over-long value comes back as a
 * field error instead of a crash.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Public site profiles (SiteTeacherController::validated).
        Schema::table('teachers', function (Blueprint $table) {
            $table->text('credentials')->change();               // was varchar(255), validated max:1000
            $table->text('credentials_fr')->nullable()->change(); // was varchar(255), validated max:1000
            $table->string('quote', 300)->nullable()->change();   // was varchar(255), validated max:300
            $table->string('quote_fr', 300)->nullable()->change();
            $table->string('image', 500)->nullable()->change();   // was varchar(255), validated max:500
        });

        // Staff profiles (Store/UpdateTeacherRequest).
        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->string('cv_url', 2048)->nullable()->change();                  // validated max:2048
            $table->string('payment_account_details', 500)->nullable()->change();  // validated max:500
        });

        // Identity row written for every teacher created through the user directory.
        Schema::table('users', function (Blueprint $table) {
            $table->string('photo_url', 2048)->nullable()->change(); // validated max:2048
            $table->string('whatsapp', 64)->nullable()->change();    // validated max:64
        });
    }

    public function down(): void
    {
        // Narrowing a column MySQL has already filled would abort the rollback with
        // the very "data too long" error this migration exists to prevent, so cut
        // each value back to the old limit first. Anything past it is lost — that
        // is what going back to the narrower column means.
        foreach ([
            ['teachers', 'credentials', 255],
            ['teachers', 'credentials_fr', 255],
            ['teachers', 'quote', 255],
            ['teachers', 'quote_fr', 255],
            ['teachers', 'image', 255],
            ['sys_teachers', 'cv_url', 255],
            ['sys_teachers', 'payment_account_details', 255],
            ['users', 'photo_url', 255],
            ['users', 'whatsapp', 32],
        ] as [$table, $column, $length]) {
            DB::table($table)
                ->whereRaw("CHAR_LENGTH(`{$column}`) > ?", [$length])
                ->update([$column => DB::raw("LEFT(`{$column}`, {$length})")]);
        }

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('credentials')->change();
            $table->string('credentials_fr')->nullable()->change();
            $table->string('quote')->nullable()->change();
            $table->string('quote_fr')->nullable()->change();
            $table->string('image')->nullable()->change();
        });

        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->string('cv_url')->nullable()->change();
            $table->string('payment_account_details')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('photo_url')->nullable()->change();
            $table->string('whatsapp', 32)->nullable()->change();
        });
    }
};
