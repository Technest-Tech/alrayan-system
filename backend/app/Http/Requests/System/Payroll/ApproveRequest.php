<?php

namespace App\Http\Requests\System\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array { return []; }
}
