<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\LessonSubjectResource;
use App\Models\System\LessonSubject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LessonSubjectController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LessonSubject::class);

        return LessonSubjectResource::collection(
            LessonSubject::orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): LessonSubjectResource
    {
        $this->authorize('create', LessonSubject::class);

        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'fields'     => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $subject = LessonSubject::create($data);

        return new LessonSubjectResource($subject);
    }

    public function update(Request $request, LessonSubject $lessonSubject): LessonSubjectResource
    {
        $this->authorize('update', $lessonSubject);

        $data = $request->validate([
            'name'       => ['sometimes', 'string', 'max:255'],
            'fields'     => ['sometimes', 'nullable', 'array'],
            'sort_order' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $lessonSubject->update($data);

        return new LessonSubjectResource($lessonSubject);
    }

    public function destroy(LessonSubject $lessonSubject): Response
    {
        $this->authorize('delete', $lessonSubject);

        $lessonSubject->delete();

        return response()->noContent();
    }
}
