<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                   => 'required|string|max:100',
            'status'                 => 'nullable|in:new_lead,interested,waiting_for_trial,waiting_for_payment,not_interested,lost',
            'email'                  => 'nullable|email|max:255',
            'phone'                  => 'nullable|string|max:32',
            'whatsapp'               => 'nullable|string|max:32',
            'age'                    => 'nullable|integer|min:1|max:120',
            'gender'                 => 'nullable|in:male,female,other',
            'country'                => 'nullable|string|size:2',
            'city'                   => 'nullable|string|max:100',
            'course_interest_id'     => 'nullable|exists:courses,id',
            'source'                 => 'nullable|in:google_ads,facebook_ads,instagram_ads,whatsapp_direct,student_referral,website_form,manual_entry',
            'source_detail'          => 'nullable|string|max:200',
            'platform'               => 'nullable|in:website,facebook,instagram,youtube,whatsapp,tiktok,other',
            'platform_url'           => 'nullable|url|max:500',
            'priority'               => 'nullable|in:low,medium,high',
            'package_type'           => 'nullable|integer|min:1',
            'package_hours'          => 'nullable|integer|min:1',
            'subscription_price'     => 'nullable|numeric|min:0',
            'currency'               => 'nullable|string|size:3',
            'payment_method'         => 'nullable|in:none,card,cash,bank_transfer',
            'notes'                  => 'nullable|string|max:5000',
            'rejection_reason'       => 'nullable|in:price,schedule,not_interested,no_response,other',
            'is_family_lead'         => 'nullable|boolean',
            'assigned_supervisor_id' => 'nullable|exists:users,id',
            'payload'                => 'nullable|array',
        ];
    }
}
