<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->foreign('whatsapp_group_id')->references('id')->on('sys_whatsapp_groups')->nullOnDelete();
        });
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->foreign('whatsapp_group_id')->references('id')->on('sys_whatsapp_groups')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->dropForeign(['whatsapp_group_id']);
        });
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->dropForeign(['whatsapp_group_id']);
        });
    }
};
