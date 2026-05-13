<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                   => 'required|string|max:100',
            'email'                  => 'nullable|email|max:255',
            'phone'                  => 'nullable|string|max:32',
            'whatsapp'               => 'nullable|string|max:32',
            'country'                => 'nullable|string|size:2',
            'course_interest_id'     => 'nullable|exists:courses,id',
            'source'                 => 'required|in:google_ads,facebook_ads,instagram_ads,whatsapp_direct,student_referral,website_form,manual_entry',
            'source_detail'          => 'nullable|string|max:200',
            'assigned_supervisor_id' => 'nullable|exists:users,id',
        ];
    }
}
