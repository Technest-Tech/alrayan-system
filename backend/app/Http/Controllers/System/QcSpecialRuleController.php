<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Qc\StoreSpecialRuleRequest;
use App\Http\Requests\System\Qc\UpdateSpecialRuleRequest;
use App\Http\Resources\System\QcSpecialRuleResource;
use App\Models\System\QcSpecialRule;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class QcSpecialRuleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return QcSpecialRuleResource::collection(QcSpecialRule::orderBy('id')->get());
    }

    public function store(StoreSpecialRuleRequest $request): QcSpecialRuleResource
    {
        $data = $request->validated();
        $data['rule_type'] ??= 'score_cap';
        $data['is_active'] ??= true;

        return new QcSpecialRuleResource(QcSpecialRule::create($data));
    }

    public function update(UpdateSpecialRuleRequest $request, QcSpecialRule $qcSpecialRule): QcSpecialRuleResource
    {
        $qcSpecialRule->update($request->validated());
        return new QcSpecialRuleResource($qcSpecialRule);
    }

    public function destroy(QcSpecialRule $qcSpecialRule): Response
    {
        $qcSpecialRule->delete();
        return response()->noContent();
    }
}
