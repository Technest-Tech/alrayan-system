<?php

use App\Models\System\WhatsAppGroup;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate students with existing whatsapp_group_link to sys_whatsapp_groups rows
        DB::table('sys_students')
            ->whereNotNull('whatsapp_group_link')
            ->whereNull('whatsapp_group_id')
            ->orderBy('id')
            ->each(function ($student) {
                $groupId = DB::table('sys_whatsapp_groups')->insertGetId([
                    'type'               => 'student',
                    'invite_link'        => $student->whatsapp_group_link,
                    'status'             => ($student->whatsapp_group_status === 'stopped') ? 'stopped' : 'active',
                    'linked_student_id'  => $student->id,
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ]);
                DB::table('sys_students')
                    ->where('id', $student->id)
                    ->update(['whatsapp_group_id' => $groupId]);
            });

        // Migrate teachers with existing whatsapp_group_link (if column exists)
        if (Schema::hasColumn('sys_teachers', 'whatsapp_group_link')) {
            DB::table('sys_teachers')
                ->whereNotNull('whatsapp_group_link')
                ->whereNull('whatsapp_group_id')
                ->orderBy('id')
                ->each(function ($teacher) {
                    $groupId = DB::table('sys_whatsapp_groups')->insertGetId([
                        'type'               => 'teacher',
                        'invite_link'        => $teacher->whatsapp_group_link,
                        'status'             => 'active',
                        'linked_teacher_id'  => $teacher->id,
                        'created_at'         => now(),
                        'updated_at'         => now(),
                    ]);
                    DB::table('sys_teachers')
                        ->where('id', $teacher->id)
                        ->update(['whatsapp_group_id' => $groupId]);
                });

            Schema::table('sys_teachers', function (Blueprint $t) {
                $t->dropColumn('whatsapp_group_link');
            });
        }

        // Drop the now-redundant text columns from students
        Schema::table('sys_students', function (Blueprint $t) {
            $t->dropColumn(['whatsapp_group_link', 'whatsapp_group_status']);
        });

        // Seed sys_settings keys for SYS-07
        $settings = [
            'wassender.api_key'                    => '',
            'wassender.instance_id'                => '',
            'wassender.webhook_url'                => '/api/system/webhooks/wassender',
            'reminders.session.before_minutes'     => 60,
            'reminders.payment.before_due_days'    => json_encode([3, 1]),
            'reminders.payment.on_due'             => 1,
            'reminders.payment.after_due_days'     => json_encode([1, 3, 7]),
            'reminders.report.after_hours'         => 24,
            'reminders.lead_followup_before_min'   => 0,
            'notifications.dedupe.window_hours'    => 24,
        ];

        foreach ($settings as $key => $value) {
            DB::table('sys_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down(): void
    {
        // Restore old text columns on students
        Schema::table('sys_students', function (Blueprint $t) {
            $t->string('whatsapp_group_link', 500)->nullable();
            $t->enum('whatsapp_group_status', ['active', 'stopped', 'none'])->default('none');
        });
    }
};
