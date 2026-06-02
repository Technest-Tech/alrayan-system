<?php

namespace App\Http\Requests\System\Note;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'body'      => ['sometimes', 'string', 'max:5000'],
            'note_type' => ['sometimes', 'string', 'in:general,hr,performance,warning,commendation'],
            'pinned'    => ['sometimes', 'boolean'],
        ];
    }
}
