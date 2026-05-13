<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'supervisor', 'teacher'])->nullable()->after('email');
            $table->string('phone', 32)->nullable()->after('role');
            $table->string('whatsapp', 32)->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('whatsapp');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->index(['role', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'is_active']);
            $table->dropColumn(['role', 'phone', 'whatsapp', 'is_active', 'last_login_at']);
        });
    }
};
