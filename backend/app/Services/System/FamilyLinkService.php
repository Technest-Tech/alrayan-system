<?php

namespace App\Services\System;

use App\Models\System\Student;
use App\Models\System\StudentFamilyLink;
use Illuminate\Support\Facades\DB;

class FamilyLinkService
{
    public function link(Student $a, Student $b, int $discountPct): void
    {
        abort_if($a->id === $b->id, 422, 'Cannot link a student to themselves.');
        abort_if(
            StudentFamilyLink::where('student_id', $a->id)->where('sibling_student_id', $b->id)->exists(),
            422,
            'Already linked.'
        );

        DB::transaction(function () use ($a, $b, $discountPct) {
            StudentFamilyLink::create(['student_id' => $a->id, 'sibling_student_id' => $b->id, 'discount_pct' => $discountPct]);
            StudentFamilyLink::create(['student_id' => $b->id, 'sibling_student_id' => $a->id, 'discount_pct' => $discountPct]);

            $this->timelineEntry($a, $b, $discountPct);
            $this->timelineEntry($b, $a, $discountPct);

            AuditLog::record('student.family_linked', $a, ['sibling_id' => $b->id, 'discount_pct' => $discountPct]);
        });
    }

    public function unlink(Student $a, Student $b): void
    {
        abort_unless(
            StudentFamilyLink::where('student_id', $a->id)->where('sibling_student_id', $b->id)->exists(),
            422,
            'Not linked.'
        );

        DB::transaction(function () use ($a, $b) {
            StudentFamilyLink::where('student_id', $a->id)->where('sibling_student_id', $b->id)->delete();
            StudentFamilyLink::where('student_id', $b->id)->where('sibling_student_id', $a->id)->delete();

            $recorder = app(StudentTimelineRecorder::class);
            $recorder->record($a, 'family_unlinked', ['sibling_id' => $b->id, 'sibling_name' => $b->name]);
            $recorder->record($b, 'family_unlinked', ['sibling_id' => $a->id, 'sibling_name' => $a->name]);

            AuditLog::record('student.family_unlinked', $a, ['sibling_id' => $b->id]);
        });
    }

    private function timelineEntry(Student $student, Student $sibling, int $discountPct): void
    {
        app(StudentTimelineRecorder::class)->record($student, 'family_linked', [
            'sibling_id'   => $sibling->id,
            'sibling_name' => $sibling->name,
            'discount_pct' => $discountPct,
        ]);
    }
}
