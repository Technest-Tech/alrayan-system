<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\QcCategoryResource;
use App\Http\Resources\System\QcSpecialRuleResource;
use App\Models\System\QcCategory;
use App\Models\System\QcSpecialRule;
use Illuminate\Http\JsonResponse;

class QcConfigController extends Controller
{
    /**
     * The checklist template consumed by the New/Edit Evaluation modal:
     * active categories (with their active items) + active special rules.
     */
    public function show(): JsonResponse
    {
        $categories = QcCategory::query()
            ->where('is_active', true)
            ->with(['items' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')->orderBy('id')
            ->get();

        $rules = QcSpecialRule::query()->where('is_active', true)->orderBy('id')->get();

        return response()->json([
            'data' => [
                'categories'    => QcCategoryResource::collection($categories)->resolve(),
                'special_rules' => QcSpecialRuleResource::collection($rules)->resolve(),
            ],
        ]);
    }
}
