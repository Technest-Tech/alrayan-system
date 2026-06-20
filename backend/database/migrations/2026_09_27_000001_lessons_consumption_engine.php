<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Relax status to a plain string (drops the SQLite CHECK constraint that would
        //    reject the new values) and widen session_number_hours for split-math precision.
        //    Allowed values are enforced at the application layer (Store/UpdateLessonRequest).
        Schema::table('sys_lessons', function (Blueprint $table) {
            $table->string('status', 32)->default('scheduled')->change();
            $table->decimal('session_number_hours', 8, 2)->default(0)->change();
        });

        // 2. Migrate the legacy generic "cancelled" rows. They never consumed, so map them to
        //    the new non-consuming "cancelled_by_teacher" status.
        DB::table('sys_lessons')->where('status', 'cancelled')->update(['status' => 'cancelled_by_teacher']);

        // 3. Per-package consumption allocations. A consuming lesson has one row; a lesson that
        //    crosses a package boundary has two (or more). consumed_hours(pkg) = SUM(hours).
        Schema::create('sys_lesson_package_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lesson_id')->constrained('sys_lessons')->cascadeOnDelete();
            $t->foreignId('package_id')->constrained('sys_student_packages')->cascadeOnDelete();
            $t->decimal('hours', 8, 2)->default(0);             // hours of this lesson in this package
            $t->decimal('cumulative_hours', 8, 2)->default(0);  // running total in this package after this lesson
            $t->unsignedSmallInteger('ordinal')->default(1);    // position within the package
            $t->timestamps();

            $t->unique(['lesson_id', 'package_id']);
            $t->index('package_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lesson_package_allocations');

        Schema::table('sys_lessons', function (Blueprint $table) {
            $table->decimal('session_number_hours', 8, 1)->default(0)->change();
        });

        // Best-effort: collapse the split cancellation statuses back to the legacy "cancelled".
        DB::table('sys_lessons')
            ->whereIn('status', ['cancelled_by_student', 'cancelled_by_teacher'])
            ->update(['status' => 'cancelled']);
        DB::table('sys_lessons')->where('status', 'trial_free')->update(['status' => 'scheduled']);
    }
};
