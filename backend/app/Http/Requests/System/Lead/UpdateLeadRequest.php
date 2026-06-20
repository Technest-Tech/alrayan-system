<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                   => 'sometimes|string|max:100',
            'status'                 => 'sometimes|in:new_lead,interested,waiting_for_trial,waiting_for_payment,not_interested,lost',
            'email'                  => 'sometimes|nullable|email|max:255',
            'phone'                  => 'sometimes|nullable|string|max:32',
            'whatsapp'               => 'sometimes|nullable|string|max:32',
            'age'                    => 'sometimes|nullable|integer|min:1|max:120',
            'gender'                 => 'sometimes|nullable|in:male,female,other',
            'country'                => 'sometimes|nullable|string|size:2',
            'city'                   => 'sometimes|nullable|string|max:100',
            'course_interest_id'     => 'sometimes|nullable|exists:courses,id',
            'source'                 => 'sometimes|nullable|in:google_ads,facebook_ads,instagram_ads,whatsapp_direct,student_referral,website_form,manual_entry',
            'source_detail'          => 'sometimes|nullable|string|max:200',
            'platform'               => 'sometimes|nullable|in:website,facebook,instagram,youtube,whatsapp,tiktok,other',
            'platform_url'           => 'sometimes|nullable|url|max:500',
            'priority'               => 'sometimes|nullable|in:low,medium,high',
            'package_type'           => 'sometimes|nullable|integer|min:1',
            'package_hours'          => 'sometimes|nullable|integer|min:1',
            'subscription_price'     => 'sometimes|nullable|numeric|min:0',
            'currency'               => 'sometimes|nullable|string|size:3',
            'payment_method'         => 'sometimes|nullable|in:none,card,cash,bank_transfer',
            'notes'                  => 'sometimes|nullable|string|max:5000',
            'rejection_reason'       => 'sometimes|nullable|in:price,schedule,not_interested,no_response,other',
            'is_family_lead'         => 'sometimes|nullable|boolean',
            'assigned_supervisor_id' => 'sometimes|nullable|exists:users,id',
            'assigned_teacher_id'    => 'sometimes|nullable|exists:sys_teachers,id',
            'payload'                => 'sometimes|nullable|array',
        ];
    }
}
