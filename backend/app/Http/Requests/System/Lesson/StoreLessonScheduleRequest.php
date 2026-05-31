<?php

namespace App\Http\Requests\System\Lesson;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'             => ['required', 'integer', 'exists:sys_teachers,id'],
            'student_id'             => ['required', 'integer', 'exists:sys_students,id'],
            'subject_id'             => ['nullable', 'integer', 'exists:sys_lesson_subjects,id'],
            'recurrence'             => ['required', 'string', 'in:none,weekly,biweekly,every_4_weeks,custom'],
            'start_date'             => ['required', 'date'],
            'slots'                  => ['required', 'array', 'min:1'],
            'slots.*.day_of_week'    => ['required', 'integer', 'between:0,6'],
            'slots.*.start_time'     => ['required', 'date_format:H:i'],
            'slots.*.duration_minutes' => ['required', 'integer', 'in:30,60,90,120,150,180'],
        ];
    }
}
