<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which quality manager (staff user) covers which teacher. Informational —
        // scopes filters and the Supervisor Activity panel.
        Schema::create('sys_qc_assignments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('quality_manager_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->timestamps();

            $t->unique(['quality_manager_id', 'teacher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_qc_assignments');
    }
};
