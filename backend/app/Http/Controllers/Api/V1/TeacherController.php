<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherResource;
use App\Models\Teacher;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TeacherController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $data = Teacher::where('featured', true)
            ->orderBy('sort_order')
            ->get();

        return TeacherResource::collection($data);
    }

    public function show(string $slug): TeacherResource
    {
        $teacher = Teacher::where('slug', $slug)
            // Curated order first, then newest wins the tie — a visitor's review
            // is written with sort_order 0, and the list on the page is a scroll
            // area, so landing last would mean landing out of sight.
            ->with(['reviews' => fn ($q) => $q->where('approved', true)->orderBy('sort_order')->orderByDesc('id')])
            ->firstOrFail();

        return new TeacherResource($teacher);
    }
}
