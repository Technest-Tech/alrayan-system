<?php

namespace App\Jobs\System;

use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\AuditLog as AuditLogModel;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class BuildExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300;

    public function __construct(
        public readonly string $kind,
        public readonly array  $filters,
        public readonly int    $userId,
    ) {
        $this->onQueue('reports');
    }

    public function handle(): void
    {
        $path = $this->buildExport();

        // Notify user
        $user = \App\Models\User::find($this->userId);
        if ($user) {
            NotificationService::push($user, NotificationTypes::EXPORT_READY, [
                'kind'       => $this->kind,
                'download_url' => Storage::url($path),
            ]);
        }
    }

    private function buildExport(): string
    {
        $filename = sprintf('%s-%s.csv', $this->kind, now()->format('Y-m-d-His'));
        $path     = "exports/{$filename}";

        $csv = match ($this->kind) {
            'students'    => $this->studentsExport(),
            'teachers'    => $this->teachersExport(),
            'audit_log'   => $this->auditLogExport(),
            default       => "kind,error\n{$this->kind},not_implemented",
        };

        Storage::put($path, $csv);
        return $path;
    }

    private function studentsExport(): string
    {
        $rows = ["name,email,status,course,enrolled_at\n"];
        Student::with('course')->chunk(500, function ($students) use (&$rows) {
            foreach ($students as $s) {
                $rows[] = implode(',', [
                    "\"{$s->name}\"", "\"{$s->email}\"",
                    $s->status, "\"{$s->course?->name}\"",
                    $s->enrolled_at?->toDateString() ?? '',
                ]) . "\n";
            }
        });
        return implode('', $rows);
    }

    private function teachersExport(): string
    {
        $rows = ["name,email,is_active\n"];
        Teacher::chunk(500, function ($teachers) use (&$rows) {
            foreach ($teachers as $t) {
                $rows[] = implode(',', ["\"{$t->name}\"", "\"{$t->email}\"", $t->is_active ? '1' : '0']) . "\n";
            }
        });
        return implode('', $rows);
    }

    private function auditLogExport(): string
    {
        $rows = ["at,actor,action\n"];
        AuditLogModel::query()
            ->when($this->filters['from'] ?? null, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($this->filters['to'] ?? null, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('created_at')
            ->chunk(1000, function ($entries) use (&$rows) {
                foreach ($entries as $e) {
                    $rows[] = implode(',', [
                        $e->created_at?->toIso8601String(),
                        "\"{$e->actor_name}\"",
                        "\"{$e->action}\"",
                    ]) . "\n";
                }
            });
        return implode('', $rows);
    }
}
