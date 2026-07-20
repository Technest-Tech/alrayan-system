<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Qc\StoreCategoryRequest;
use App\Http\Requests\System\Qc\UpdateCategoryRequest;
use App\Http\Resources\System\QcCategoryResource;
use App\Models\System\QcCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class QcCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = QcCategory::query()
            ->with(['items' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')->orderBy('id')
            ->get();

        return QcCategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): QcCategoryResource
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) QcCategory::max('sort_order') + 1;

        $category = QcCategory::create($data);

        return new QcCategoryResource($category->load('items'));
    }

    public function update(UpdateCategoryRequest $request, QcCategory $qcCategory): QcCategoryResource
    {
        $qcCategory->update($request->validated());
        return new QcCategoryResource($qcCategory->load('items'));
    }

    public function destroy(QcCategory $qcCategory): Response
    {
        $qcCategory->delete(); // cascade removes its items
        return response()->noContent();
    }
}
