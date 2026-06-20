<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'suspended', 'archived'])
                ->default('active')
                ->after('is_active');
            $table->string('language', 8)->nullable()->after('status');
            $table->date('birthday')->nullable()->after('language');
            $table->enum('gender', ['male', 'female'])->nullable()->after('birthday');
            $table->string('photo_url')->nullable()->after('gender');
            $table->text('notes')->nullable()->after('photo_url');
            $table->json('documents')->nullable()->after('notes');

            $table->index('status');
            $table->index('last_login_at');
        });

        // Backfill status from the existing is_active mirror.
        DB::table('users')->where('is_active', true)->update(['status' => 'active']);
        DB::table('users')->where('is_active', false)->update(['status' => 'inactive']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['last_login_at']);
            $table->dropColumn(['status', 'language', 'birthday', 'gender', 'photo_url', 'notes', 'documents']);
        });
    }
};
