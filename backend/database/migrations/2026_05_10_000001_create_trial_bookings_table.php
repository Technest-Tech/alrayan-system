<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->string('name');
            $table->string('email');
            $table->string('country', 100);
            $table->string('phone', 30)->nullable();
            $table->enum('age_group', ['kid-5-8', 'kid-9-12', 'teen', 'adult']);
            $table->string('course_interest', 100);
            $table->string('preferred_time', 50);
            $table->string('timezone', 100);
            $table->text('message')->nullable();
            $table->string('source', 50)->default('website');
            $table->enum('status', ['new', 'contacted', 'converted', 'lost'])->default('new');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['status', 'submitted_at']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_bookings');
    }
};
