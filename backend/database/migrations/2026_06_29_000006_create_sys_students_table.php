<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_students', function (Blueprint $t) {
            $t->id();
            // Identity
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone', 32)->nullable();
            $t->string('whatsapp', 32)->nullable();
            $t->string('country', 2);
            $t->string('timezone', 64);
            $t->enum('age_category', ['child', 'adult']);
            // Parent / guardian
            $t->string('parent_name')->nullable();
            $t->string('parent_phone', 32)->nullable();
            $t->string('parent_whatsapp', 32)->nullable();
            $t->string('parent_email')->nullable();
            // Course + teacher
            $t->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $t->foreignId('assigned_teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
            // Pricing snapshot
            $t->unsignedSmallInteger('sessions_per_month')->default(0);
            $t->unsignedTinyInteger('session_duration_min')->default(30);
            $t->char('currency', 3)->default('USD');
            $t->unsignedInteger('monthly_price_minor')->default(0);
            $t->unsignedTinyInteger('custom_discount_pct')->default(0);
            // Wallet snapshot
            $t->bigInteger('wallet_balance_minor')->default(0);
            $t->char('wallet_currency', 3)->default('USD');
            // Lifecycle
            $t->enum('status', ['trial', 'active', 'paused', 'suspended', 'cancelled'])->default('trial');
            $t->timestamp('enrolled_at')->nullable();
            $t->timestamp('paused_at')->nullable();
            $t->timestamp('suspended_at')->nullable();
            $t->timestamp('cancelled_at')->nullable();
            $t->string('cancellation_reason')->nullable();
            $t->text('cancellation_notes')->nullable();
            // Source attribution
            $t->enum('source', ['lead', 'manual', 'referral', 'trial_booking'])->default('manual');
            $t->foreignId('lead_id')->nullable();
            $t->foreignId('trial_booking_id')->nullable()->constrained('trial_bookings')->nullOnDelete();
            // Communications
            $t->foreignId('whatsapp_group_id')->nullable();
            $t->string('whatsapp_group_link', 500)->nullable();
            $t->enum('whatsapp_group_status', ['active', 'stopped', 'none'])->default('none');
            $t->softDeletes();
            $t->timestamps();
            $t->index(['status', 'assigned_teacher_id']);
            $t->index(['status', 'course_id']);
            $t->index(['status', 'country']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_students');
    }
};
