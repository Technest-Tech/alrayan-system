<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\LessonEvaluationResource;
use App\Models\System\LessonEvaluation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LessonEvaluationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LessonEvaluation::class);

        return LessonEvaluationResource::collection(
            LessonEvaluation::orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): LessonEvaluationResource
    {
        $this->authorize('create', LessonEvaluation::class);

        $data = $request->validate([
            'label'      => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $evaluation = LessonEvaluation::create($data);

        return new LessonEvaluationResource($evaluation);
    }

    public function update(Request $request, LessonEvaluation $lessonEvaluation): LessonEvaluationResource
    {
        $this->authorize('update', $lessonEvaluation);

        $data = $request->validate([
            'label'      => ['sometimes', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $lessonEvaluation->update($data);

        return new LessonEvaluationResource($lessonEvaluation);
    }

    public function destroy(LessonEvaluation $lessonEvaluation): Response
    {
        $this->authorize('delete', $lessonEvaluation);

        $lessonEvaluation->delete();

        return response()->noContent();
    }
}
