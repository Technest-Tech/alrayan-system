<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                   => 'sometimes|string|max:100',
            'email'                  => 'sometimes|nullable|email|max:255',
            'phone'                  => 'sometimes|nullable|string|max:32',
            'whatsapp'               => 'sometimes|nullable|string|max:32',
            'country'                => 'sometimes|nullable|string|size:2',
            'course_interest_id'     => 'sometimes|nullable|exists:courses,id',
            'source'                 => 'sometimes|in:google_ads,facebook_ads,instagram_ads,whatsapp_direct,student_referral,website_form,manual_entry',
            'source_detail'          => 'sometimes|nullable|string|max:200',
            'status'                 => 'sometimes|in:new,contacted,trial_booked,trial_completed,lost',
            'assigned_supervisor_id' => 'sometimes|nullable|exists:users,id',
        ];
    }
}
