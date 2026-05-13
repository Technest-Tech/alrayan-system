<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class BulkAssignRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'lead_ids'      => 'required|array|min:1',
            'lead_ids.*'    => 'integer|exists:sys_leads,id',
            'supervisor_id' => 'required|exists:users,id',
        ];
    }
}
