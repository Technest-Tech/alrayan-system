<?php

namespace App\Http\Requests\System\PayrollAdjustment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdjustmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $bonusCategories     = ['performance', 'retention', 'reports_consistency', 'tenure', 'other_bonus'];
        $deductionCategories = ['unauthorized_absence', 'late_report', 'late_arrival', 'quality_issue', 'other_deduction'];

        $type = $this->input('type');
        $allowedCategories = $type === 'bonus' ? $bonusCategories : ($type === 'deduction' ? $deductionCategories : array_merge($bonusCategories, $deductionCategories));

        return [
            'type'         => ['required', 'in:bonus,deduction'],
            'category'     => ['required', Rule::in($allowedCategories)],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'reason'       => ['required', 'string'],
        ];
    }
}
