<?php

namespace App\Http\Requests\System\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'              => ['required', 'integer', 'exists:sys_students,id'],
            'type'                    => ['required', 'in:advance,reactivation,manual'],
            'due_at'                  => ['required_if:type,manual', 'date'],
            'effective_from'          => ['nullable', 'date'],
            'lines'                   => ['required_if:type,manual', 'array'],
            'lines.*.description'     => ['required_if:type,manual', 'string'],
            'lines.*.kind'            => ['required_if:type,manual', 'in:monthly,pro_rata,outstanding,adjustment,discount'],
            'lines.*.quantity'        => ['required_if:type,manual', 'integer', 'min:1'],
            'lines.*.unit_price_minor'=> ['required_if:type,manual', 'integer'],
            'lines.*.line_total_minor'=> ['required_if:type,manual', 'integer'],
        ];
    }
}
