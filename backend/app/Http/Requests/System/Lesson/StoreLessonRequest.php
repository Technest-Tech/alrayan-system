<?php

namespace App\Http\Requests\System\Lesson;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'      => ['required', 'integer', 'exists:sys_teachers,id'],
            'student_id'      => ['required', 'integer', 'exists:sys_students,id'],
            'scheduled_at'    => ['required', 'date'],
            'duration_minutes'=> ['required', 'integer', 'in:30,60,90,120'],
            'subject_id'      => ['nullable', 'integer', 'exists:sys_lesson_subjects,id'],
            'evaluation_id'   => ['nullable', 'integer', 'exists:sys_lesson_evaluations,id'],
            'status'          => ['nullable', 'string', 'in:scheduled,attended,paid_absence,absent,trial,free,cancelled_by_student,cancelled_by_teacher'],
            'content'         => ['nullable', 'string', 'max:5000'],
            'notes'           => ['nullable', 'string', 'max:5000'],
            'homework'        => ['nullable', 'string', 'max:5000'],
            'souvenir_image'  => ['nullable', 'string', 'max:500'],
            'subject_details' => ['nullable', 'array'],
            'trial_evaluation'=> ['nullable', 'array'],
            // Queue the rendered report image to the student's / guardian's WhatsApp.
            'send_report'     => ['sometimes', 'boolean'],
        ];
    }
}
