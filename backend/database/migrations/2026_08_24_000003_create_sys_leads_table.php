<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_leads', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone', 32)->nullable();
            $t->string('whatsapp', 32)->nullable();
            $t->string('country', 2)->nullable();
            $t->foreignId('course_interest_id')->nullable()->constrained('courses')->nullOnDelete();
            $t->enum('source', [
                'google_ads', 'facebook_ads', 'instagram_ads', 'whatsapp_direct',
                'student_referral', 'website_form', 'manual_entry',
            ]);
            $t->string('source_detail')->nullable();
            $t->enum('status', ['new', 'contacted', 'trial_booked', 'trial_completed', 'enrolled', 'lost'])->default('new');
            $t->enum('lost_reason', ['price', 'schedule', 'teacher', 'no_response', 'personal', 'quality', 'other'])->nullable();
            $t->text('lost_notes')->nullable();
            $t->foreignId('assigned_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('trial_booking_id')->nullable()->constrained('trial_bookings')->nullOnDelete();
            $t->foreignId('converted_to_student_id')->nullable()->constrained('sys_students')->nullOnDelete();
            $t->json('payload')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['status']);
            $t->index(['assigned_supervisor_id', 'status']);
            $t->index(['source']);
            if (config('database.default') !== 'sqlite') {
                $t->fullText(['name', 'email', 'phone', 'whatsapp']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_leads');
    }
};
