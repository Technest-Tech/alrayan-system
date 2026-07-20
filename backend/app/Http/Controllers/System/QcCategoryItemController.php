<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Qc\StoreCategoryItemRequest;
use App\Http\Requests\System\Qc\UpdateCategoryItemRequest;
use App\Http\Resources\System\QcCategoryItemResource;
use App\Models\System\QcCategory;
use App\Models\System\QcCategoryItem;
use Illuminate\Http\Response;

class QcCategoryItemController extends Controller
{
    public function store(StoreCategoryItemRequest $request, QcCategory $qcCategory): QcCategoryItemResource
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) $qcCategory->items()->max('sort_order') + 1;

        $item = $qcCategory->items()->create($data);

        return new QcCategoryItemResource($item);
    }

    public function update(UpdateCategoryItemRequest $request, QcCategoryItem $qcCategoryItem): QcCategoryItemResource
    {
        $qcCategoryItem->update($request->validated());
        return new QcCategoryItemResource($qcCategoryItem);
    }

    public function destroy(QcCategoryItem $qcCategoryItem): Response
    {
        $qcCategoryItem->delete();
        return response()->noContent();
    }
}
