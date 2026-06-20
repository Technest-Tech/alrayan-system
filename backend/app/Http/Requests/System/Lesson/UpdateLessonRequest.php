<?php

namespace App\Http\Requests\System\Lesson;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'      => ['sometimes', 'nullable', 'integer', 'exists:sys_teachers,id'],
            'student_id'      => ['sometimes', 'nullable', 'integer', 'exists:sys_students,id'],
            'scheduled_at'    => ['sometimes', 'nullable', 'date'],
            'duration_minutes'=> ['sometimes', 'nullable', 'integer', 'in:30,60,90,120'],
            'subject_id'      => ['sometimes', 'nullable', 'integer', 'exists:sys_lesson_subjects,id'],
            'evaluation_id'   => ['sometimes', 'nullable', 'integer', 'exists:sys_lesson_evaluations,id'],
            'status'          => ['sometimes', 'nullable', 'string', 'in:scheduled,attended,paid_absence,absent,trial_free,cancelled_by_student,cancelled_by_teacher'],
            'content'         => ['sometimes', 'nullable', 'string', 'max:5000'],
            'notes'           => ['sometimes', 'nullable', 'string', 'max:5000'],
            'homework'        => ['sometimes', 'nullable', 'string', 'max:5000'],
            'souvenir_image'  => ['sometimes', 'nullable', 'string', 'max:500'],
            'subject_details' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
