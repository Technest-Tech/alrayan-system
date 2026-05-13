<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CourseApiController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('courses.index', 3600, fn () => Course::active()->get());

        return response()->json(['data' => $data]);
    }

    public function show(string $slug): JsonResponse
    {
        $data = Cache::remember("courses.show.{$slug}", 3600, fn () =>
            Course::active()->where('slug', $slug)->firstOrFail()
        );

        return response()->json($data);
    }
}
